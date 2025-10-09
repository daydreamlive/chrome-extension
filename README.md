# virtual-webcam chrome extension

This is a proof of concept of adding a virtual MediaDevice in a browser extension.

NOTE: You can use it as a regular library, check out cam.html.

![Virtual webcam](shader-cam.png)

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
- Configure in `js/media-devices.js`:
  ```javascript
  const CONFIG = {
    mode: 'whip-whep',
    whipUrl: 'https://ai.livepeer.com/live/video-to-video/YOUR_STREAM_KEY/whip',
    streamId: 'str_YOUR_STREAM_ID',
    statusApiUrl: 'https://api.daydream.live/v1/streams'
  };
  ```
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

Caveats:
- Some pages use shims or do some checks that might break with the extension 
  - WebRTC samples: https://webrtc.github.io/samples/src/content/devices/input-output/

Tested with
- Hangouts
- Meet
- Zoom
- Doesn't seem to work on Duo

Security concerns, what if a bad actor wants to capture and broadcast the stream:
- The browser will tell the user that they're using a developer extension (a bit weak as security measures go)
- The webcam light will still turn on. Doesn't solve if the actor is active during a valid video call, though.
- I guess it's possible -and probably easy- to stream from an extension to another server. Nothing is preventing any extension creator from doing it right now, without a virtual webcam. Just MitM and record.

Ideas:
- Shader editor
- Youtube video to replace feed
- Add ML like FaceMesh or other feature detection systems:
  - add privacy bar over eyes
- Try to stream from a canvas in a page (shader editor, drawing, etc.) as a MediaSource.
  

# License
This project is licensed under the [CC-BY-4.0 License](https://creativecommons.org/licenses/by/4.0/)
