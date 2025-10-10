# Daydream Chrome Extension

## Installation

### Chromium-based browsers (Chrome, Edge, Brave, etc.):
1. Download or clone this repository
2. Go to `chrome://extensions`
3. Enable "Developer Mode" (toggle in top right)
4. Click "Load unpacked"
5. Browse to the folder with the extension (where `manifest.json` is located)
6. **Important**: Reload any open web pages to enable the extension

### Firefox:
1. Download or clone this repository
2. Go to `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on..."
4. Browse to the folder and select `manifest.json`
5. **Important**: Reload any open web pages to enable the extension

## Configuration

### Setting up your API Key

**Option 1: Full Settings Page (Recommended)**
1. Right-click the extension icon and select "Options"
2. Or go to `chrome://extensions`, find "Daydream Dreamcam", and click "Extension options"
3. Enter your Daydream API key from [app.daydream.live](https://app.daydream.live)
4. Customize your AI prompt (optional)
5. Click "Save Settings"

**Option 2: Quick Popup**
1. Click the extension icon in your browser toolbar
2. Enter your API key and prompt
3. Click "Save Settings"

### Getting Started
1. Get your free API key from [app.daydream.live](https://app.daydream.live)
2. Configure the extension using either method above
3. Visit any website that uses your webcam
4. Select "Daydream Dreamcam" from the camera list
5. Your video will be processed in real-time with AI!

Now any (most) pages using getUserMedia will see a "Daydream Dreamcam" device

Should work on Chromium based browsers that support extensions.

## How It Works

The extension uses WHIP/WHEP protocols to send and receive video streams:

**Server-Side AI Processing**
- Sends your camera video to Daydream's AI processing servers
- Applies real-time AI effects and transformations
- Returns the processed video stream to your browser

**Audio Passthrough**
- Your microphone audio passes through directly without processing
- Only video is sent to the server for AI processing
- Ensures low latency for voice communication

**Processing Flow**
1. Publish your camera video (only) to the WHIP endpoint
2. Poll the status API (with retries) until the stream is ready
3. Extract the WHEP URL from `gateway_status.whep_url`
4. Subscribe to the processed video via WHEP
5. Combine processed video with original microphone audio in the output stream

**API Key Required**
- Get your free API key from [app.daydream.live](https://app.daydream.live)
- Configure it in the extension settings (Options page or popup)
- The API key authenticates your requests to Daydream's servers

## Camera Selection

The virtual webcam will:
- Filter out any other virtual cameras
- Prefer cameras with "Macbook" in the name
- Fall back to the first available physical camera

Tested with
- Hangouts
- Meet
- Zoom

## Packaging for Distribution

To package the extension for Chrome Web Store or Firefox Add-ons submission:

```bash
./package.sh
```

This will create:
- `build/daydream-dreamcam-chrome-v1.0.0.zip` - Ready for Chrome Web Store
- `build/daydream-dreamcam-firefox-v1.0.0.zip` - Ready for Firefox Add-ons

## Store Submission

Before submitting to extension stores:

1. **Review the submission guide**: See `STORE_SUBMISSION.md` for detailed instructions
2. **Prepare privacy policy**: Host `PRIVACY.md` on a public URL (required by both stores)
3. **Prepare screenshots**: Follow the guide in `store-listings/screenshots-checklist.md`
4. **Review store listings**: Use the content in `store-listings/` directory

For complete submission instructions, see [STORE_SUBMISSION.md](STORE_SUBMISSION.md)

## Project Structure

- `js/` - Extension JavaScript files
  - `inject.js` - Content script that bridges page script and Chrome APIs
  - `media-devices.js` - Virtual camera implementation and MediaDevices API patching
  - `whip-whep-stream.js` - WHIP/WHEP streaming protocol implementation
  - `main.js` - Main extension entry point
- `popup.html` / `popup.js` - Quick settings popup UI
- `options.html` / `options.js` - Full extension settings page
- `manifest.json` - Extension manifest (Manifest V3)
- `package.sh` - Packaging script for store submission
- `PRIVACY.md` - Privacy policy document
- `STORE_SUBMISSION.md` - Store submission guide
- `store-listings/` - Store listing content and guidelines