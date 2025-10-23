import mongoose, { type ConnectOptions } from "mongoose";
import { logger } from "@/shared/utils/logger";

const log = logger.child({ module: "database-service" });

// Capture mongoose type before global declaration
type MongooseInstance = typeof mongoose;

// Global declaration for connection caching
declare global {
  var mongoose:
    | {
        conn: MongooseInstance | null;
        promise: Promise<MongooseInstance> | null;
      }
    | undefined;
}

// Initialize globalThis mongoose cache
const initializeGlobalCache = (): {
  conn: MongooseInstance | null;
  promise: Promise<MongooseInstance> | null;
} => {
  if (!globalThis.mongoose) {
    globalThis.mongoose = {
      conn: null,
      promise: null,
    };
  }
  return globalThis.mongoose;
};

// Initialize cache immediately
initializeGlobalCache();

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DATABASE_NAME = process.env.MONGODB_DATABASE_NAME;

// Environment-specific connection options optimized for Atlas
const getConnectionOptions = (): ConnectOptions => {
  const isDev = process.env.NODE_ENV === "development";
  const isServerless = process.env.VERCEL === "1";

  // Base options for all environments
  const baseOptions: ConnectOptions = {
    dbName: MONGODB_DATABASE_NAME,
    retryWrites: true,
    retryReads: true,
    family: 4, // Use IPv4, skip trying IPv6 for faster connection
  };

  // Development-specific optimizations
  if (isDev) {
    return {
      ...baseOptions,
      // Smaller pool for dev (prevents connection exhaustion during hot reloads)
      maxPoolSize: 5,
      minPoolSize: 1,
      // More lenient timeouts for debugging
      connectTimeoutMS: 30000,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 0, // No timeout in dev for debugging
      maxIdleTimeMS: 300000, // 5 minutes
      heartbeatFrequencyMS: 30000, // Less frequent in dev
      // Enable auto-indexing in development
      autoIndex: true,
    };
  }

  // Production/Serverless optimizations for Atlas
  return {
    ...baseOptions,
    // Match Atlas M10+ recommended pool sizes
    maxPoolSize: isServerless ? 5 : 10,
    minPoolSize: isServerless ? 1 : 2,
    // Atlas-optimized timeouts
    connectTimeoutMS: 10000, // 10s to establish initial connection
    serverSelectionTimeoutMS: 10000, // 10s to select a server from replica set
    socketTimeoutMS: 45000, // 45s for long queries
    maxIdleTimeMS: 60000, // Close idle connections after 1 min
    heartbeatFrequencyMS: 10000, // Check server health every 10s
    // Production safety
    autoIndex: false, // Never auto-create indexes in prod
    // Atlas-specific optimizations
    maxStalenessSeconds: 90, // For read preference
  };
};

export class DatabaseService {
  private static instance: DatabaseService;
  private connectionAttempts = 0;
  private readonly maxRetries = 3;
  private connectionInProgress = false;
  private lastConnectionAttempt = 0;
  private readonly CONNECTION_RETRY_DELAY = 1000; // 1 second between retries
  private readonly MAX_CONNECTION_WAIT_RETRIES = 50; // Max times to wait for connectionInProgress

  private constructor() {
    this.setupMongooseSettings();
    this.setupConnectionEventHandlers();
    this.setupProcessHandlers();
  }

  /**
   * Configure Mongoose settings based on environment
   */
  private setupMongooseSettings(): void {
    const isDev = process.env.NODE_ENV === "development";

    // Development settings for better DX
    if (isDev) {
      mongoose.set("debug", true);
      mongoose.set("strictQuery", false); // More lenient for dev
      log.debug("Mongoose debug mode enabled for development");
    }

    // Prevent buffering timeout errors in serverless environments
    mongoose.set("bufferCommands", false);

    // Better for Next.js 16 Fast Refresh
    mongoose.set("autoCreate", isDev);
  }

  private setupConnectionEventHandlers(): void {
    mongoose.connection.on("connected", () => {
      this.connectionAttempts = 0;
      log.info("MongoDB connection established successfully");
    });

    mongoose.connection.on("error", (err) => {
      log.error(`MongoDB connection error: ${err}`);
      // Clear cached connection on error to allow retry
      const cached = initializeGlobalCache();
      cached.conn = null;
      cached.promise = null;
    });

    mongoose.connection.on("disconnected", () => {
      log.warn("MongoDB disconnected");
    });

    mongoose.connection.on("close", () => {
      log.debug("MongoDB connection closed");
    });
  }

  private setupProcessHandlers(): void {
    // In serverless environments (e.g., Vercel), skip process handlers
    if (process.env.VERCEL === "1") {
      log.debug("Skipping process signal handlers in serverless environment");
      return;
    }

    const gracefulShutdown = async () => {
      try {
        log.info("Graceful shutdown initiated");
        await this.disconnect();
        process.exit(0);
      } catch (error) {
        log.error("Error during graceful shutdown:", error);
        process.exit(1);
      }
    };

    // Only register if not already registered (singleton safety)
    const existingHandlers = process.listenerCount("SIGTERM");
    if (existingHandlers === 0) {
      process.on("SIGINT", gracefulShutdown);
      process.on("SIGTERM", gracefulShutdown);
      process.on("SIGUSR2", gracefulShutdown); // nodemon restart signal

      log.debug("Process signal handlers registered");
    }
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * Enhanced connection method
   * Prevents race conditions in concurrent serverless environments
   */
  public async connect(): Promise<typeof mongoose> {
    const cached = initializeGlobalCache();

    // Atomic check: Use cached connection if it exists and is valid
    if (cached.conn) {
      const readyState = mongoose.connection.readyState;
      if (readyState === 1) {
        log.debug("Using cached active MongoDB connection");
        return cached.conn;
      }
    }

    // Check readyState once and act on it atomically
    const currentState = mongoose.connection.readyState;
    
    // State 1: Already connected
    if (currentState === 1) {
      log.debug("Using existing active MongoDB connection");
      cached.conn = mongoose;
      return mongoose;
    }

    // State 2: Connection in progress - wait for existing promise
    if (currentState === 2 && cached.promise) {
      log.debug("MongoDB connection in progress, waiting for existing promise...");
      try {
        const result = await cached.promise;
        cached.conn = result;
        return result;
      } catch (error) {
        // Clear failed promise
        cached.promise = null;
        throw error;
      }
    }

    // Prevent concurrent connection attempts with bounded wait
    if (this.connectionInProgress) {
      log.debug("Connection already in progress, waiting with bounded retry...");
      let retries = 0;
      while (this.connectionInProgress && retries < this.MAX_CONNECTION_WAIT_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        retries++;
        
        // Check if connection succeeded while waiting
        if (cached.conn && mongoose.connection.readyState === 1) {
          log.debug(`Connection established while waiting (retry ${retries})`);
          return cached.conn;
        }
      }
      
      // If still in progress after max retries, throw error
      if (this.connectionInProgress) {
        throw new Error(
          `Connection wait timeout: Another connection attempt is still in progress after ${this.MAX_CONNECTION_WAIT_RETRIES * 100}ms`
        );
      }
      
      // Connection completed, try to use it
      if (cached.conn && mongoose.connection.readyState === 1) {
        return cached.conn;
      }
    }

    // Validate environment variables
    if (!MONGODB_URI) {
      throw new Error("MONGODB_URI environment variable is not defined");
    }

    if (!MONGODB_DATABASE_NAME) {
      throw new Error("MONGODB_DATABASE_NAME environment variable is not defined");
    }

    // Check retry limits - but reset if enough time has passed (30 seconds)
    const timeSinceLastAttempt = Date.now() - this.lastConnectionAttempt;
    if (timeSinceLastAttempt > 30000) {
      log.debug("Resetting connection attempts counter after 30 seconds");
      this.connectionAttempts = 0;
    }

    if (this.connectionAttempts >= this.maxRetries) {
      const error = new Error(
        `Maximum connection attempts reached (${this.maxRetries}). Last attempt was ${Math.round(timeSinceLastAttempt / 1000)}s ago.`
      );
      log.error(error.message);
      throw error;
    }

    // Enforce minimum delay between connection attempts to prevent connection storms
    if (this.connectionAttempts > 0 && timeSinceLastAttempt < this.CONNECTION_RETRY_DELAY) {
      const waitTime = this.CONNECTION_RETRY_DELAY - timeSinceLastAttempt;
      log.debug(`Waiting ${waitTime}ms before retry to prevent connection storm`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    try {
      this.connectionInProgress = true;
      this.connectionAttempts++;
      this.lastConnectionAttempt = Date.now();

      log.info(`MongoDB connection attempt ${this.connectionAttempts}/${this.maxRetries}`);

      // Create and cache the connection promise
      const connectionOptions = getConnectionOptions();
      cached.promise = mongoose.connect(MONGODB_URI, connectionOptions);
      cached.conn = await cached.promise;

      log.info("MongoDB connection established and cached");
      return cached.conn;
    } catch (error) {
      // Clear the promise on error so next attempt can retry
      cached.promise = null;
      cached.conn = null;

      log.error(
        `Failed to connect to MongoDB (attempt ${this.connectionAttempts}/${this.maxRetries}):`,
        error
      );

      throw error;
    } finally {
      this.connectionInProgress = false;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      const cached = initializeGlobalCache();

      if (cached.conn || mongoose.connection.readyState !== 0) {
        log.info("Disconnecting from MongoDB...");
        await mongoose.disconnect();

        // Clear cache
        cached.conn = null;
        cached.promise = null;

        // Reset connection state
        this.connectionAttempts = 0;
        this.connectionInProgress = false;
        this.lastConnectionAttempt = 0;

        log.info("MongoDB disconnected and cache cleared");
      }
    } catch (error) {
      log.error(`Error disconnecting from MongoDB: ${error}`);
      throw error;
    }
  }

  public getConnectionStatus(): boolean {
    return mongoose.connection.readyState === 1;
  }

  public getConnectionState(): string {
    const states = ["disconnected", "connected", "connecting", "disconnecting"];
    return states[mongoose.connection.readyState] || "unknown";
  }

  public async ensureConnection(): Promise<DatabaseService> {
    await this.connect();
    return this;
  }

  /**
   * Get connection info for debugging
   */
  public getConnectionInfo(): object {
    return {
      readyState: mongoose.connection.readyState,
      state: this.getConnectionState(),
      host: mongoose.connection.host,
      name: mongoose.connection.name,
      connectionAttempts: this.connectionAttempts,
      connectionInProgress: this.connectionInProgress,
      lastConnectionAttempt: this.lastConnectionAttempt,
      timeSinceLastAttempt: this.lastConnectionAttempt
        ? Date.now() - this.lastConnectionAttempt
        : null,
    };
  }
}

// Export a singleton instance
export const dbService = DatabaseService.getInstance();
