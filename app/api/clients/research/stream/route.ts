import { NextRequest } from "next/server";
import { withAuth, withDb, withValidation } from "@/shared/api";
import { clientsService, WebsiteUrlInputSchema } from "@/modules/clients";
import { Permissions } from "@/shared/auth/types";
import { ErrorHandler } from "@/shared/utils/errors";
import { StreamEventType } from "@/shared/ai-sdk";

/**
 * Stream website research with real-time progress updates
 * @description Submit website URL for streaming AI research
 * @body WebsiteUrlInputSchema
 * @response Stream of progress events and partial data (Server-Sent Events)
 * @auth bearer
 * @openapi
 */
export const POST = withAuth(
  withDb(
    withValidation(
      WebsiteUrlInputSchema,
      async (_req: NextRequest, {}, { body }) => {
        try {
          // Start streaming research
          const streamResult = await clientsService.streamResearchWebsite(
            body.website_url
          );

          // Create a ReadableStream for the response
          const encoder = new TextEncoder();
          
          const stream = new ReadableStream({
            async start(controller) {
              try {
                // Stream progress events if available
                if (streamResult.eventStream) {
                  const eventReader = streamResult.eventStream.getReader();
                  
                  try {
                    while (true) {
                      const { done, value: event } = await eventReader.read();
                      
                      if (done) break;
                      
                      // Send event as SSE format
                      const eventData = JSON.stringify({
                        type: event.type,
                        message: event.message,
                        step: event.step,
                        progress: event.progress,
                        data: event.data,
                        error: event.error,
                        metadata: event.metadata,
                      });
                      
                      // SSE format: event: <type>\ndata: <json>\n\n
                      const sseMessage = `event: ${event.type}\ndata: ${eventData}\n\n`;
                      controller.enqueue(encoder.encode(sseMessage));
                      
                      // If this is an error event, close the stream
                      if (event.type === StreamEventType.ERROR) {
                        controller.close();
                        return;
                      }
                      
                      // If this is a complete event, we're done
                      if (event.type === StreamEventType.COMPLETE) {
                        // Send final metadata
                        const usage = await streamResult.usage;
                        const sources = streamResult.sources;
                        
                        const metadataEvent = JSON.stringify({
                          type: 'metadata',
                          usage,
                          sources,
                        });
                        
                        controller.enqueue(
                          encoder.encode(`event: metadata\ndata: ${metadataEvent}\n\n`)
                        );
                        
                        controller.close();
                        return;
                      }
                    }
                  } catch (error) {
                    console.error("Error reading event stream:", error);
                    const errorMessage = error instanceof Error ? error.message : "Unknown error";
                    const errorEvent = JSON.stringify({
                      type: StreamEventType.ERROR,
                      message: "Stream processing error",
                      error: { message: errorMessage },
                    });
                    controller.enqueue(
                      encoder.encode(`event: error\ndata: ${errorEvent}\n\n`)
                    );
                    controller.close();
                  } finally {
                    eventReader.releaseLock();
                  }
                } else {
                  // Fallback: stream partial objects directly
                  const partialReader = streamResult.partialObjectStream.getReader();
                  
                  try {
                    while (true) {
                      const { done, value } = await partialReader.read();
                      
                      if (done) {
                        // Send completion event
                        const finalObject = await streamResult.objectPromise;
                        const completeEvent = JSON.stringify({
                          type: StreamEventType.COMPLETE,
                          message: "Research completed!",
                          data: finalObject,
                        });
                        
                        controller.enqueue(
                          encoder.encode(`event: complete\ndata: ${completeEvent}\n\n`)
                        );
                        
                        controller.close();
                        break;
                      }
                      
                      // Send partial update
                      const partialEvent = JSON.stringify({
                        type: StreamEventType.PARTIAL,
                        message: "Processing...",
                        data: value,
                      });
                      
                      controller.enqueue(
                        encoder.encode(`event: partial\ndata: ${partialEvent}\n\n`)
                      );
                    }
                  } finally {
                    partialReader.releaseLock();
                  }
                }
              } catch (error) {
                console.error("Stream error:", error);
                const errorMessage = error instanceof Error ? error.message : "Unknown error";
                const errorEvent = JSON.stringify({
                  type: StreamEventType.ERROR,
                  message: "Stream failed",
                  error: { message: errorMessage },
                });
                
                controller.enqueue(
                  encoder.encode(`event: error\ndata: ${errorEvent}\n\n`)
                );
                controller.close();
              }
            },
          });

          // Return streaming response with SSE headers
          return new Response(stream, {
            headers: {
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache, no-transform",
              "Connection": "keep-alive",
              "X-Accel-Buffering": "no", // Disable nginx buffering
            },
          });
        } catch (error) {
          // Handle errors that occur before streaming starts
          const response = ErrorHandler.handle(error);
          return new Response(response.body, {
            status: response.status,
            headers: response.headers,
          });
        }
      }
    )
  ),
  {
    requiredPermissions: [Permissions.WRITE_CLIENTS],
  }
);

