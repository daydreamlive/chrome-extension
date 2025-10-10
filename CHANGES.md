# API Key Fix and Improvements

## Summary
Fixed the API key storage and retrieval system to properly work with Chrome's extension security model. The main issue was that the page script doesn't have access to `chrome.storage` API, so we implemented a message-passing architecture between the content script and page script.

## Problems Fixed

### 1. API Key Not Available Error
**Problem**: Users were getting "No API key available" error even after setting the API key in settings.

**Root Cause**: The `media-devices.js` file is injected as a page script (not a content script), which means it doesn't have access to Chrome's `chrome.storage` API. The code was trying to read from `chrome.storage.sync` but it was undefined in the page script context.

**Solution**: Implemented message passing between the content script (`inject.js`) and page script (`media-devices.js`):
- Content script has access to `chrome.storage` API
- Page script requests API key from content script via `window.postMessage()`
- Content script retrieves from storage and sends back to page script
- API key is cached in memory for faster subsequent access

### 2. Default API Key Removed
**Problem**: User requested removal of default API key to prevent exposure in code.

**Solution**: Removed all references to `CONFIG.defaultApiKey` and `DEFAULT_SETTINGS.apiKey`. The extension now properly errors if no API key is set, forcing users to configure their own key.

### 3. Prompt Not Being Used
**Problem**: User's custom prompt was being ignored; hardcoded prompt was used instead.

**Solution**: Updated `createStream()` to use the prompt from user settings (or a sensible default) instead of the hardcoded "studio ghibli" prompt.

## Changes Made

### Modified Files

#### `js/inject.js` (Content Script)
- **Added**: API key request handler that retrieves from `chrome.storage.sync`
- **Added**: Storage change listener to notify page script when API key/prompt changes
- **Purpose**: Acts as a bridge between Chrome APIs and the page script

#### `js/media-devices.js` (Page Script)
- **Replaced**: `initializeApiKey()` with message-based `getApiKey()`
- **Removed**: All direct `chrome.storage` access (not available in page script)
- **Added**: Message listener for settings updates from content script
- **Fixed**: `createStream()` now properly awaits API key retrieval
- **Fixed**: Uses user's custom prompt instead of hardcoded value
- **Added**: `currentPrompt` variable to cache prompt in memory

#### `popup.js`
- **Removed**: Fallback to `DEFAULT_SETTINGS.apiKey` (now empty string)
- **Fixed**: Reset functionality clears API key instead of setting default

#### `manifest.json`
- **Added**: `options_page` field pointing to new options page

#### `README.md`
- **Updated**: Installation and configuration instructions
- **Added**: Documentation for both popup and options page configuration methods
- **Improved**: "How It Works" section with clearer explanations

### New Files

#### `options.html` + `options.js`
- **Created**: Full-page settings interface for better UX
- **Features**:
  - Beautiful gradient design
  - Clear instructions and help section
  - Direct link to get API key
  - Better error messages
  - Support for Enter key to save
- **Access**: Right-click extension icon → Options, or via chrome://extensions

## How It Works Now

### API Key Flow

1. **User sets API key**:
   - User enters API key in popup or options page
   - Saved to `chrome.storage.sync`
   - Storage change event fires

2. **Content script detects change**:
   - `inject.js` listens to `chrome.storage.onChanged`
   - Posts message to page script with new API key/prompt

3. **Page script receives update**:
   - `media-devices.js` receives message
   - Updates `currentApiKey` and `currentPrompt` in memory

4. **When virtual camera is activated**:
   - `getUserMedia()` is called for virtual camera
   - `createStream()` is triggered
   - Calls `await getApiKey()` which:
     - Returns cached value if available
     - Otherwise requests from content script via message passing
     - Waits for response (with 5-second timeout)
   - Uses API key to authenticate with Daydream API
   - Uses custom prompt for stream configuration

### Message Passing Protocol

**Page → Content Script** (Page Ready):
```javascript
{
  type: 'DAYDREAM_PAGE_READY'
}
```

**Content → Page Script** (Settings Ready - sent proactively):
```javascript
{
  type: 'DAYDREAM_SETTINGS_READY',
  apiKey: '...',
  prompt: '...'
}
```

**Page → Content Script** (Request API Key - fallback):
```javascript
{
  type: 'DAYDREAM_REQUEST_API_KEY'
}
```

**Content → Page Script** (API Key Response):
```javascript
{
  type: 'DAYDREAM_API_KEY_RESPONSE',
  apiKey: '...',
  prompt: '...'
}
```

**Content → Page Script** (Settings Updated):
```javascript
{
  type: 'DAYDREAM_SETTINGS_UPDATED',
  apiKey: '...',
  prompt: '...'
}
```

**Page → Content Script** (Stream Created):
```javascript
{
  type: 'DAYDREAM_STREAM_CREATED',
  streamId: '...'
}
```

### Loading Sequence

1. **Content Script Loads** (`inject.js`):
   - Runs at `document_start`
   - Immediately fetches API key from `chrome.storage.sync`
   - Sends `DAYDREAM_SETTINGS_READY` message to page
   - Injects page script (`main.js`)

2. **Page Script Loads** (`media-devices.js`):
   - Receives `DAYDREAM_SETTINGS_READY` message
   - Stores API key and prompt in memory
   - Sends `DAYDREAM_PAGE_READY` signal back
   - Patches `MediaDevices` API

3. **Content Script Responds**:
   - Receives `DAYDREAM_PAGE_READY` signal
   - Sends settings again (in case first message was missed)

4. **Virtual Camera Activated**:
   - `getUserMedia()` called with virtual camera
   - `createStream()` triggered
   - Calls `getApiKey()` which returns cached value
   - Creates stream with API key

This multi-step handshake ensures settings are always available, even with race conditions.

## Testing Instructions

1. **Reload the extension**:
   - Go to `chrome://extensions`
   - Click the reload icon for Daydream Dreamcam
   - Reload any open web pages

2. **Clear old settings** (optional, for clean test):
   - Right-click extension icon → Inspect popup
   - In console: `chrome.storage.sync.clear()`

3. **Configure API key**:
   - Right-click extension icon → Options
   - Enter your API key from app.daydream.live
   - Enter a custom prompt (optional)
   - Click "Save Settings"
   - Should see success message

4. **Test virtual camera**:
   - Go to a webcam test site (e.g., webcamtests.com)
   - Or open Google Meet
   - Select "Daydream Dreamcam" from camera list
   - Check browser console for logs:
     ```
     Requesting API key from content script...
     API key received: [HIDDEN]
     Using API key for stream creation: [HIDDEN]
     Using prompt for stream creation: <your prompt>
     Creating new stream via Daydream API...
     ```

5. **Verify error handling**:
   - Clear API key in settings
   - Try to use virtual camera
   - Should see error: "No API key available. Please set your API key in the extension settings."

## Browser Console Logs

When working correctly, you should see logs like:

```
[Content Script] Daydream content script loading...
[Content Script] Sending settings to page script: { hasApiKey: true, hasPrompt: true }
[Content Script] Message listeners set up
[Page Script] Signaling ready to content script
[Page Script] Received settings from content script: DAYDREAM_SETTINGS_READY
[Page Script] API key updated in memory: [HIDDEN]
[Page Script] Prompt updated in memory: Apply a subtle beauty filter and enhance colors
VIRTUAL WEBCAM INSTALLED.
...
[Page Script] Using cached API key
[Page Script] Using API key for stream creation: [HIDDEN]
Using prompt for stream creation: Apply a subtle beauty filter and enhance colors
[Page Script] Creating new stream via Daydream API...
Created stream - ID: xyz, WHIP URL: ...
```

### Troubleshooting Logs

If you see timeout errors, check for these logs:

**Settings not received:**
```
[Page Script] Waiting for settings from content script...
[Page Script] Timeout waiting for settings from content script
[Page Script] Attempting explicit request...
[Page Script] Sending explicit API key request...
```

**Content script not responding:**
- Look for `[Content Script] Daydream content script loading...`
- If missing, the content script failed to load
- Try reloading the extension and the page

## Security Improvements

1. **No default API key**: Users must provide their own
2. **API key hidden in logs**: Shown as `[HIDDEN]` in console
3. **Password field**: API key input uses `type="password"`
4. **Local storage only**: API key stored in `chrome.storage.sync` (encrypted by browser)
5. **No hardcoded credentials**: All authentication requires user configuration

## Future Enhancements

Potential improvements for later:
- Add API key validation on save
- Show connection status indicator
- Add "Test Connection" button
- Remember last used prompt
- Prompt templates/presets
- Better error messages with troubleshooting links

