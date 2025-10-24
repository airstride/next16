# Scripts

This directory contains utility scripts for the project.

## generate-icons.mjs

Generates all required favicon and app icons from the source SVG (`public/icon.svg`).

### Usage

```bash
yarn generate-icons
```

### Generated Files

The script generates the following files in the `public/` directory:

- `favicon.ico` - Browser favicon (32x32)
- `favicon-16x16.png` - Small favicon
- `favicon-32x32.png` - Standard favicon
- `apple-touch-icon.png` - iOS home screen icon (180x180)
- `android-chrome-192x192.png` - Android app icon
- `android-chrome-512x512.png` - Large Android app icon
- `maskable-icon.png` - PWA maskable icon with safe area padding
- `icons/shortcut-campaign.png` - PWA shortcut icon for campaigns
- `icons/shortcut-dashboard.png` - PWA shortcut icon for dashboard

### Modifying Icons

To change the app icon design:

1. Edit `public/icon.svg` with your desired design
2. Run `yarn generate-icons` to regenerate all sizes
3. The script automatically maintains the brand colors from your theme (#2B2D42 and #00C6AE)

### Dependencies

- **sharp** - High-performance image processing library

