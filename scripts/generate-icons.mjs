#!/usr/bin/env node
/**
 * Icon Generator Script
 * Generates all required favicon and app icons from the source SVG
 * Run: node scripts/generate-icons.mjs
 */

import sharp from 'sharp';
import { readFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const publicDir = join(rootDir, 'public');
const iconsDir = join(publicDir, 'icons');

// Ensure icons directory exists
if (!existsSync(iconsDir)) {
  mkdirSync(iconsDir, { recursive: true });
}

// Read source SVG
const svgBuffer = readFileSync(join(publicDir, 'icon.svg'));

// Icon configurations
const icons = [
  // Favicons
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },

  // Android Chrome
  { name: 'android-chrome-192x192.png', size: 192 },
  { name: 'android-chrome-512x512.png', size: 512 },

  // Apple Touch Icon
  { name: 'apple-touch-icon.png', size: 180 },

  // Maskable icon (for PWA)
  { name: 'maskable-icon.png', size: 512, padding: 80 },

  // Shortcuts
  { name: 'icons/shortcut-campaign.png', size: 96, icon: 'campaign' },
  { name: 'icons/shortcut-dashboard.png', size: 96, icon: 'dashboard' },
];

// Generate campaign icon SVG
const campaignSvg = `
<svg width="96" height="96" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="96" height="96" rx="20" fill="#2B2D42"/>
  <path d="M30 48L48 30L66 48M48 32V66" stroke="#00C6AE" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="66" cy="30" r="8" fill="#00C6AE"/>
</svg>
`;

// Generate dashboard icon SVG
const dashboardSvg = `
<svg width="96" height="96" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="96" height="96" rx="20" fill="#2B2D42"/>
  <rect x="24" y="24" width="20" height="20" rx="4" fill="#00C6AE"/>
  <rect x="52" y="24" width="20" height="20" rx="4" fill="#00C6AE" opacity="0.6"/>
  <rect x="24" y="52" width="20" height="20" rx="4" fill="#00C6AE" opacity="0.6"/>
  <rect x="52" y="52" width="20" height="20" rx="4" fill="#00C6AE" opacity="0.3"/>
</svg>
`;

async function generateIcon(config) {
  try {
    let buffer = svgBuffer;

    // Use custom SVG for shortcuts
    if (config.icon === 'campaign') {
      buffer = Buffer.from(campaignSvg);
    } else if (config.icon === 'dashboard') {
      buffer = Buffer.from(dashboardSvg);
    }

    const outputPath = join(publicDir, config.name);
    const sharpInstance = sharp(buffer).resize(config.size, config.size);

    // Add padding for maskable icons (safe area)
    if (config.padding) {
      const innerSize = config.size - (config.padding * 2);
      sharpInstance
        .resize(innerSize, innerSize)
        .extend({
          top: config.padding,
          bottom: config.padding,
          left: config.padding,
          right: config.padding,
          background: { r: 43, g: 45, b: 66, alpha: 1 }
        });
    }

    await sharpInstance.png().toFile(outputPath);
    console.log(`✓ Generated ${config.name}`);
  } catch (error) {
    console.error(`✗ Failed to generate ${config.name}:`, error.message);
  }
}

async function generateFavicon() {
  try {
    // Generate ICO file (contains 16x16 and 32x32)
    const ico16 = await sharp(svgBuffer).resize(16, 16).png().toBuffer();
    const ico32 = await sharp(svgBuffer).resize(32, 32).png().toBuffer();

    // For ICO, we'll just use the 32x32 PNG as a fallback
    // (proper ICO generation requires a specialized library)
    await sharp(svgBuffer)
      .resize(32, 32)
      .png()
      .toFile(join(publicDir, 'favicon.ico'));

    console.log('✓ Generated favicon.ico');
  } catch (error) {
    console.error('✗ Failed to generate favicon.ico:', error.message);
  }
}

async function main() {
  console.log('🎨 Generating icons...\n');

  // Generate all PNG icons
  for (const icon of icons) {
    await generateIcon(icon);
  }

  // Generate favicon.ico
  await generateFavicon();

  console.log('\n✨ Icon generation complete!');
}

main().catch(console.error);

