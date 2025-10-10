document.addEventListener('DOMContentLoaded', function() {
    const apiKeyInput = document.getElementById('api-key');
    const promptInput = document.getElementById('prompt');
    const saveBtn = document.getElementById('save-btn');
    const resetBtn = document.getElementById('reset-btn');
    const statusDiv = document.getElementById('status');

    // Default values
    const DEFAULT_SETTINGS = {
        apiKey: '',
        prompt: 'Apply a subtle beauty filter and enhance colors'
    };

    // Load saved settings
    async function loadSettings() {
        try {
            const result = await chrome.storage.sync.get(['apiKey', 'prompt', 'activeStreamId']);

            apiKeyInput.value = result.apiKey || DEFAULT_SETTINGS.apiKey;
            promptInput.value = result.prompt || DEFAULT_SETTINGS.prompt;

            console.log('Settings loaded:', { 
                apiKey: result.apiKey ? '[HIDDEN]' : '', 
                prompt: result.prompt,
                activeStreamId: result.activeStreamId 
            });
        } catch (error) {
            console.error('Error loading settings:', error);
            showStatus('Error loading settings', 'error');
        }
    }

    // Save settings
    async function saveSettings() {
        console.log('saveSettings function called');
        const apiKey = apiKeyInput.value.trim();
        const prompt = promptInput.value.trim() || DEFAULT_SETTINGS.prompt;

        if (!apiKey) {
            showStatus('API key is required', 'error');
            return;
        }

        try {
            // Get the current stored prompt to check if it changed
            const currentSettings = await chrome.storage.sync.get(['prompt', 'activeStreamId']);
            const currentPrompt = currentSettings.prompt || DEFAULT_SETTINGS.prompt;
            const activeStreamId = currentSettings.activeStreamId;

            console.log('Current settings from storage:', {
                currentPrompt,
                activeStreamId,
                allSettings: currentSettings
            });

            await chrome.storage.sync.set({
                apiKey: apiKey,
                prompt: prompt
            });

            console.log('Settings saved:', { apiKey: '[HIDDEN]', prompt: prompt });

            // If prompt changed and there's an active stream, update it via API
            if (prompt !== currentPrompt && activeStreamId) {
                console.log('Prompt changed, updating stream:', activeStreamId);
                try {
                    await updateStreamPrompt(activeStreamId, prompt, apiKey);
                    showStatus('Settings saved and stream updated!', 'success');
                } catch (error) {
                    console.error('Error updating stream prompt:', error);
                    showStatus('Settings saved, but stream update failed', 'warning');
                }
            } else {
                showStatus('Settings not updated! ' + activeStreamId, 'success');
            }

            // Notify content scripts that settings have changed
            chrome.runtime.sendMessage({
                action: 'settingsUpdated',
                settings: { apiKey: apiKey, prompt: prompt }
            }).catch(() => {
                // Ignore errors - content scripts might not be listening yet
                console.log('No content scripts available to receive settings update');
            });

        } catch (error) {
            console.error('Error saving settings:', error);
            showStatus('Error saving settings', 'error');
        }
    }

    // Update stream prompt via Daydream API
    async function updateStreamPrompt(streamId, prompt, apiKey) {
        const url = `https://api.daydream.live/v1/streams/${streamId}`;
        
        console.error('Updating stream prompt: ', prompt, apiKey, streamId);

        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                params: {
                    prompt: prompt
                }   
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to update stream: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        console.error('Stream updated successfully:', data);
        return data;
    }

    // Reset settings to defaults
    async function resetSettings() {
        try {
            await chrome.storage.sync.clear();

            apiKeyInput.value = DEFAULT_SETTINGS.apiKey;
            promptInput.value = DEFAULT_SETTINGS.prompt;

            console.log('Settings reset to defaults');
            showStatus('Settings reset to defaults', 'info');

        } catch (error) {
            console.error('Error resetting settings:', error);
            showStatus('Error resetting settings', 'error');
        }
    }

    // Show status message
    function showStatus(message, type) {
        statusDiv.textContent = message;
        statusDiv.className = `status ${type}`;
        statusDiv.style.display = 'block';

        // Hide status after 3 seconds
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 3000);
    }

    // Event listeners
    saveBtn.addEventListener('click', saveSettings);
    resetBtn.addEventListener('click', resetSettings);

    // Load settings on startup
    loadSettings();
});
