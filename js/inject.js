'use strict';

console.log('[Content Script] Daydream content script loading...');

// Function to send API key and prompt to page script
async function sendSettingsToPage() {
    try {
        const result = await chrome.storage.sync.get(['apiKey', 'prompt']);
        console.log('[Content Script] Sending settings to page script:', {
            hasApiKey: !!result.apiKey,
            hasPrompt: !!result.prompt
        });
        
        window.postMessage({
            type: 'DAYDREAM_SETTINGS_READY',
            apiKey: result.apiKey,
            prompt: result.prompt
        }, '*');
    } catch (error) {
        console.error('[Content Script] Error sending settings to page:', error);
    }
}

// Send settings immediately when content script loads
sendSettingsToPage();

// Listen for messages from the page script
window.addEventListener('message', async (event) => {
    // Only accept messages from the same window
    if (event.source !== window) return;
    
    // Check if this is a stream ID message
    if (event.data && event.data.type === 'DAYDREAM_STREAM_CREATED') {
        console.log('[Content Script] Received stream ID from page:', event.data.streamId);
        
        // Store the stream ID using chrome.storage (only available in content script)
        try {
            await chrome.storage.sync.set({ activeStreamId: event.data.streamId });
            console.log('[Content Script] Stored stream ID in chrome.storage:', event.data.streamId);
        } catch (error) {
            console.error('[Content Script] Error storing stream ID:', error);
        }
    }
    
    // Handle API key requests from page script
    if (event.data && event.data.type === 'DAYDREAM_REQUEST_API_KEY') {
        console.log('[Content Script] Page script requesting API key');
        
        try {
            const result = await chrome.storage.sync.get(['apiKey', 'prompt']);
            console.log('[Content Script] Retrieved API key and prompt from storage');
            
            // Send the API key and prompt back to the page script
            window.postMessage({
                type: 'DAYDREAM_API_KEY_RESPONSE',
                apiKey: result.apiKey,
                prompt: result.prompt
            }, '*');
        } catch (error) {
            console.error('[Content Script] Error retrieving API key:', error);
            window.postMessage({
                type: 'DAYDREAM_API_KEY_RESPONSE',
                apiKey: null,
                prompt: null,
                error: error.message
            }, '*');
        }
    }
    
    // Handle ready signal from page script
    if (event.data && event.data.type === 'DAYDREAM_PAGE_READY') {
        console.log('[Content Script] Page script is ready, sending settings');
        sendSettingsToPage();
    }
});

// Listen for storage changes and notify the page script
chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'sync' && (changes.apiKey || changes.prompt)) {
        console.log('[Content Script] API key or prompt changed, notifying page script');
        window.postMessage({
            type: 'DAYDREAM_SETTINGS_UPDATED',
            apiKey: changes.apiKey?.newValue,
            prompt: changes.prompt?.newValue
        }, '*');
    }
});

console.log('[Content Script] Message listeners set up');

const script = document.createElement('script');
script.setAttribute("type", "module");
script.setAttribute("src", chrome.runtime.getURL('js/main.js'));
const head = document.head || document.getElementsByTagName("head")[0] || document.documentElement;
head.insertBefore(script, head.lastChild);
