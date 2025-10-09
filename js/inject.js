'use strict';

// Listen for messages from the page script to store stream ID
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
});

const script = document.createElement('script');
script.setAttribute("type", "module");
script.setAttribute("src", chrome.runtime.getURL('js/main.js'));
const head = document.head || document.getElementsByTagName("head")[0] || document.documentElement;
head.insertBefore(script, head.lastChild);
