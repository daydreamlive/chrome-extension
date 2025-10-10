import { WhipWhepStream } from './whip-whep-stream.js';

// Configuration: Choose processing mode
const CONFIG = {
  statusApiUrl: 'https://api.daydream.live/v1/streams', // Base URL for status API
};

// Function to get API key from content script
async function getApiKey() {
  try {
    // If we already have an API key in memory, use it
    if (currentApiKey) {
      console.log('[Page Script] Using cached API key');
      return currentApiKey;
    }

    // If settings have been initialized but there's no API key, return null immediately
    if (settingsInitialized) {
      console.log('[Page Script] Settings initialized but no API key found');
      return null;
    }

    console.log('[Page Script] Waiting for settings from content script...');

    // Wait for settings to be initialized
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 20; // 2 seconds total (20 * 100ms)
      
      const checkSettings = () => {
        attempts++;
        
        if (currentApiKey || settingsInitialized) {
          console.log('[Page Script] Settings received, API key:', currentApiKey ? '[HIDDEN]' : 'none');
          resolve(currentApiKey);
          return;
        }
        
        if (attempts >= maxAttempts) {
          console.error('[Page Script] Timeout waiting for settings from content script');
          console.log('[Page Script] Attempting explicit request...');
          
          // Try explicit request as fallback
          requestApiKeyExplicitly()
            .then(resolve)
            .catch(reject);
          return;
        }
        
        // Check again in 100ms
        setTimeout(checkSettings, 100);
      };
      
      checkSettings();
    });
  } catch (error) {
    console.error('[Page Script] Error getting API key:', error);
    throw error;
  }
}

// Fallback function to explicitly request API key
function requestApiKeyExplicitly() {
  console.log('[Page Script] Sending explicit API key request...');
  
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      console.error('[Page Script] Timeout waiting for explicit API key response');
      reject(new Error('Timeout waiting for API key. Please reload the page and try again.'));
    }, 3000);

    const messageHandler = (event) => {
      if (event.source !== window) return;
      
      if (event.data && event.data.type === 'DAYDREAM_API_KEY_RESPONSE') {
        clearTimeout(timeoutId);
        window.removeEventListener('message', messageHandler);
        
        if (event.data.error) {
          console.error('[Page Script] Error getting API key:', event.data.error);
          reject(new Error(event.data.error));
        } else {
          currentApiKey = event.data.apiKey;
          currentPrompt = event.data.prompt;
          settingsInitialized = true;
          console.log('[Page Script] API key received via explicit request:', currentApiKey ? '[HIDDEN]' : 'none');
          resolve(currentApiKey);
        }
      }
    };

    window.addEventListener('message', messageHandler);
    
    // Send request to content script
    window.postMessage({
      type: 'DAYDREAM_REQUEST_API_KEY'
    }, '*');
  });
}

// Function to create a new stream via Daydream API
async function createStream() {
  try {
    console.log('[Page Script] Creating new stream via Daydream API...');

    // Get API key from content script
    const apiKey = await getApiKey();
    console.log('[Page Script] Using API key for stream creation:', apiKey ? '[HIDDEN]' : 'none');

    if (!apiKey) {
      const errorMsg = 'No API key available. Please configure your API key:\n' +
                      '1. Right-click the extension icon → Options\n' +
                      '2. Enter your API key from app.daydream.live\n' +
                      '3. Save and reload this page';
      console.error('[Page Script]', errorMsg);
      throw new Error(errorMsg);
    }
    
    // Use the prompt from settings or a default
    const prompt = currentPrompt || "Apply a subtle beauty filter and enhance colors";
    console.log('Using prompt for stream creation:', prompt);

    const response = await fetch(`${CONFIG.statusApiUrl}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        "pipeline_id": "pip_SD15",
        "pipeline_params": {
          "seed": 529990,
          "delta": 0.7,
          "width": 512,
          "height": 512,
          "prompt": prompt,
          "model_id": "Lykon/dreamshaper-8",
          "lora_dict": null,
          "ip_adapter": {
            "type": "regular",
            "scale": 0.8,
            "enabled": true,
            "weight_type": "linear"
          },
          "controlnets": [
            {
              "enabled": true,
              "model_id": "lllyasviel/control_v11f1p_sd15_depth",
              "preprocessor": "depth_tensorrt",
              "conditioning_scale": 0.62,
              "preprocessor_params": {},
              "control_guidance_end": 1,
              "control_guidance_start": 0
            },
            {
              "enabled": true,
              "model_id": "lllyasviel/control_v11f1e_sd15_tile",
              "preprocessor": "feedback",
              "conditioning_scale": 0,
              "preprocessor_params": {
                "feedback_strength": 0
              },
              "control_guidance_end": 1,
              "control_guidance_start": 0
            },
            {
              "enabled": true,
              "model_id": "lllyasviel/control_v11p_sd15_canny",
              "preprocessor": "canny",
              "conditioning_scale": 0,
              "preprocessor_params": {
                "low_threshold": 100,
                "high_threshold": 200
              },
              "control_guidance_end": 1,
              "control_guidance_start": 0
            }
          ],
          "lcm_lora_id": "latent-consistency/lcm-lora-sdv1-5",
          "acceleration": "tensorrt",
          "do_add_noise": true,
          "t_index_list": [
            3,
            8,
            12,
            17
          ],
          "use_lcm_lora": true,
          "guidance_scale": 1,
          "negative_prompt": "blurry, low quality, flat",
          "num_inference_steps": 50,
          "use_denoising_batch": true,
          "normalize_seed_weights": true,
          "normalize_prompt_weights": true,
          "seed_interpolation_method": "linear",
          "enable_similar_image_filter": false,
          "prompt_interpolation_method": "linear",
          "similar_image_filter_threshold": 0.98,
          "similar_image_filter_max_skip_frame": 10
        }
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Stream creation response:', data);

    // Extract stream ID and WHIP URL from response
    const streamId = data.data?.id || data.id;
    const whipUrl = data.data?.whip_url || data.whip_url;

    if (!streamId) {
      throw new Error('No stream ID returned from API');
    }

    if (!whipUrl) {
      throw new Error('No WHIP URL returned from API');
    }

    console.log(`Created stream - ID: ${streamId}, WHIP URL: ${whipUrl}`);

    return {
      streamId: streamId,
      whipUrl: whipUrl,
      statusApiUrl: CONFIG.statusApiUrl
    };
  } catch (error) {
    console.error('Error creating stream:', error);
    throw error;
  }
}

// Cache the active processor to reuse across multiple getUserMedia calls
let activeProcessor = null;
let processorCreationTime = null;

// Store current API key and prompt in memory for faster access
let currentApiKey = null;
let currentPrompt = null;

// Track if settings have been initialized
let settingsInitialized = false;
let settingsInitPromise = null;

function monkeyPatchMediaDevices() {

  const enumerateDevicesFn = MediaDevices.prototype.enumerateDevices;
  const getUserMediaFn = MediaDevices.prototype.getUserMedia;

  MediaDevices.prototype.enumerateDevices = async function () {
    const res = await enumerateDevicesFn.call(navigator.mediaDevices);
    res.push({
      deviceId: "virtual",
      groupID: "daydream",
      kind: "videoinput",
      label: "Daydream Dreamcam",
    });
    return res;
  };

  MediaDevices.prototype.getUserMedia = async function () {
    const args = arguments;
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] getUserMedia called with:`, args[0]);
    console.log(`[${timestamp}] Is this the patched function?`, this.toString().includes('async'));
    
    var mediaDevices = navigator.mediaDevices;
    const arg = args[0];
    
    // Check if this is a request for the virtual camera
    const isVirtualCamera = arg && 
                            arg.video && 
                            typeof arg.video === 'object' &&
                            arg.video.deviceId &&
                            (arg.video.deviceId === "virtual" || 
                             (typeof arg.video.deviceId === 'object' && arg.video.deviceId.exact === "virtual"));
    
    if (isVirtualCamera) {
      console.log(`[${timestamp}] Virtual camera requested!`);
      // Get list of available cameras
      const devices = await enumerateDevicesFn.call(mediaDevices);
      const cameras = devices.filter(d => d.kind === 'videoinput');
      
      // Filter out virtual cameras and prefer Macbook camera
      const physicalCameras = cameras.filter(d => 
        !d.label.toLowerCase().includes('virtual') &&
        d.deviceId !== 'virtual'
      );
      
      // Prefer Macbook camera, otherwise use first available
      let preferredCamera = physicalCameras.find(d => 
        d.label.toLowerCase().includes('macbook')
      );
      if (!preferredCamera && physicalCameras.length > 0) {
        preferredCamera = physicalCameras[0];
      }
      
      const constraints = {
        video: {
          deviceId: preferredCamera ? { exact: preferredCamera.deviceId } : undefined,
          facingMode: args[0].facingMode,
          advanced: args[0].video.advanced,
          width: args[0].video.width,
          height: args[0].video.height,
        },
        audio: args[0].audio || true, // Pass through audio request from app
      };
      const res = await getUserMediaFn.call(
        mediaDevices,
        constraints
      );
      if (res) {
        const now = Date.now();
        
        // Reuse existing processor if it was created recently (within 10 seconds) and is ready or processing
        // This handles Google Meet's multiple rapid getUserMedia calls but ensures the processor is stable
        if (activeProcessor && processorCreationTime && (now - processorCreationTime) < 10000) {
          // Check if processor is in a good state (ready, processing, or connecting but not failed)
          const isProcessorStable = activeProcessor &&
            !activeProcessor.destroyed &&
            activeProcessor.loadingState !== 'error' &&
            (activeProcessor.loadingState === 'ready' ||
             activeProcessor.loadingState === 'processing' ||
             activeProcessor.loadingState === 'connecting');

          if (isProcessorStable) {
            console.log(`[${timestamp}] Reusing existing WhipWhepStream processor (created ${now - processorCreationTime}ms ago) - State: ${activeProcessor.loadingState}`);
            // Create a fresh output stream to avoid ended tracks
            const freshStream = activeProcessor.createFreshOutputStream();
            console.log(`[${timestamp}] Created fresh output stream with ${freshStream.getTracks().length} tracks`);
            return freshStream;
          } else {
            console.log(`[${timestamp}] Existing processor not stable (state: ${activeProcessor?.loadingState}), creating new one`);
          }
        }
        
        // Clean up old processor if it exists
        if (activeProcessor) {
          console.log(`[${timestamp}] Cleaning up old processor`);
          if (activeProcessor.destroy) {
            activeProcessor.destroy();
          }
        }
        
        console.log(`[${timestamp}] Creating new WhipWhepStream processor`);

        try {
          // Create a new stream dynamically
          const streamConfig = await createStream();
          console.log(`[${timestamp}] Created stream with ID: ${streamConfig.streamId}`);

          // Post message to content script to store the stream ID
          // (Page scripts don't have access to chrome.storage, so we use message passing)
          window.postMessage({
            type: 'DAYDREAM_STREAM_CREATED',
            streamId: streamConfig.streamId
          }, '*');
          console.log(`[${timestamp}] Posted stream ID to content script:`, streamConfig.streamId);

          activeProcessor = new WhipWhepStream(
              res,
              streamConfig.whipUrl,
              streamConfig.streamId,
              streamConfig.statusApiUrl
            );
        } catch (error) {
          console.error(`[${timestamp}] Failed to create stream:`, error);
          console.log(`[${timestamp}] Falling back to passthrough mode`);

          // Fallback to passthrough - return the original stream
          return res;
        }
        processorCreationTime = now;
        
        console.log(`[${timestamp}] Returning output stream with ${activeProcessor.outputStream.getTracks().length} tracks`);
        return activeProcessor.outputStream;
      }
    }
    
    // Not virtual camera - pass through to original getUserMedia
    console.log(`[${timestamp}] Not virtual camera - passing through to original getUserMedia`);
    const res = await getUserMediaFn.call(mediaDevices, ...arguments);
    console.log(`[${timestamp}] Returning passthrough stream with ${res.getTracks().length} tracks`);
    return res;
  };

  // Listen for settings from content script
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    
    // Handle initial settings or updates
    if (event.data && (event.data.type === 'DAYDREAM_SETTINGS_READY' || event.data.type === 'DAYDREAM_SETTINGS_UPDATED')) {
      console.log('[Page Script] Received settings from content script:', event.data.type);
      if (event.data.apiKey !== undefined) {
        currentApiKey = event.data.apiKey;
        console.log('[Page Script] API key updated in memory:', currentApiKey ? '[HIDDEN]' : 'none');
      }
      if (event.data.prompt !== undefined) {
        currentPrompt = event.data.prompt;
        console.log('[Page Script] Prompt updated in memory:', currentPrompt);
      }
      settingsInitialized = true;
    }
  });

  // Signal to content script that page script is ready
  console.log('[Page Script] Signaling ready to content script');
  window.postMessage({ type: 'DAYDREAM_PAGE_READY' }, '*');

  console.log('VIRTUAL WEBCAM INSTALLED.');
  console.log('MediaDevices prototype methods:', Object.getOwnPropertyNames(MediaDevices.prototype));
}

export { monkeyPatchMediaDevices }