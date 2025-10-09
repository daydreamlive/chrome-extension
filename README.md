# Daydream Chrome Extension

To use (Chromium):
- download or clone the repo
- go to chrome://extensions
- enable Developer Mode
- Load unpacked
- Browse to the folder with the extension (where the manifest.json is)
- Note:Pages will need to be reloaded after an extension is installed to be able to use it

To use (Firefox):
- download or clone the repo
- go to about:debugging#/runtime/this-firefox
- Click "Load Temporary Add-on..."
- Browse to the folder with the extension and select the manifest.json
- Note:Pages will need to be reloaded after an extension is installed to be able to use it

Now any (most) pages using getUserMedia should be able to see a "Chrome Virtual Webcam" device

Should work on Chromium based browsers that support extensions.

## Processing Mode

Sends video to a server via WHIP and receives processed video via WHEP.
- Enables server-side processing (AI models, complex effects, etc.)
- Requires a WHIP/WHEP server with status API
- Automatically fetches dynamic WHEP URL from stream status API
- **Audio passthrough**: Audio from your microphone goes directly through without processing - only video is sent to the server
- Grab an API key from https://app.daydream.live and set it in the extension's config.

- The system will:
  1. Publish your camera video (only) to the WHIP endpoint
  2. Poll the status API (with retries) until the stream is ready
  3. Extract the WHEP URL from `gateway_status.whep_url`
  4. Subscribe to the processed video via WHEP
  5. Combine processed video with original microphone audio in the output stream

## Camera Selection

The virtual webcam will:
- Filter out any other virtual cameras
- Prefer cameras with "Macbook" in the name
- Fall back to the first available physical camera

Tested with
- Hangouts
- Meet
- Zoom