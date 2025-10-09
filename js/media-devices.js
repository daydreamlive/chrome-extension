import { WhipWhepStream } from './whip-whep-stream.js';

// Configuration: Choose processing mode
const CONFIG = {
  statusApiUrl: 'https://api.daydream.live/v1/streams', // Base URL for status API
  defaultApiKey: 'sk_XjTeFkZDCvEvzTucMWPA3ZAM61ko8PnEC4TfUKMcK73sjLK3a65G9v1zNDkQ2KXt' // Fallback API key
};

// Initialize API key on load
async function initializeApiKey() {
  try {
    console.log('Initializing API key...');
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      const result = await chrome.storage.sync.get(['apiKey']);
      currentApiKey = result.apiKey || CONFIG.defaultApiKey;
      console.log('API key initialized:', currentApiKey ? '[HIDDEN]' : 'none');
    } else {
      currentApiKey = CONFIG.defaultApiKey;
      console.log('Using default API key (chrome.storage not available)');
    }
  } catch (error) {
    console.error('Error initializing API key:', error);
    currentApiKey = CONFIG.defaultApiKey;
  }
}

// Function to get API key from storage or memory
async function getApiKey() {
  try {
    // If we already have an API key in memory, use it
    if (currentApiKey) {
      console.log('Using cached API key');
      return currentApiKey;
    }

    console.log('Fetching API key from storage...');

    // Check if chrome.storage is available (content script context)
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      console.log('Using chrome.storage.sync');
      const result = await chrome.storage.sync.get(['apiKey']);
      console.log('Storage result keys:', Object.keys(result));
      currentApiKey = result.apiKey || CONFIG.defaultApiKey;
      console.log('Using API key:', currentApiKey ? '[HIDDEN]' : 'none');
      return currentApiKey;
    } else {
      console.warn('Chrome storage not available, using default API key');
      currentApiKey = CONFIG.defaultApiKey;
      return currentApiKey;
    }
  } catch (error) {
    console.error('Error getting API key from storage:', error);
    currentApiKey = CONFIG.defaultApiKey;
    return currentApiKey;
  }
}

// Function to create a new stream via Daydream API
async function createStream() {
  try {
    console.log('Creating new stream via Daydream API...');

    // Use cached API key or fallback to default
    const apiKey = currentApiKey || CONFIG.defaultApiKey;
    console.log('Using API key for stream creation:', apiKey ? '[HIDDEN]' : 'none');

    if (!apiKey) {
      throw new Error('No API key available. Please set your API key in the extension settings.');
    }

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
          "prompt": "studio ghibli, flat colors, 2d, anime",
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

// Store current API key in memory for faster access
let currentApiKey = null;

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

  // Listen for API key updates from popup
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'settingsUpdated' && message.settings) {
        console.log('Received settings update:', message.settings);
        if (message.settings.apiKey) {
          currentApiKey = message.settings.apiKey;
          console.log('API key updated in memory');
        }
        // Also refresh from storage in case there are other settings
        refreshApiKeyFromStorage();
        sendResponse({ success: true });
      }
    });
  }

  // Function to refresh API key from storage
  async function refreshApiKeyFromStorage() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        const result = await chrome.storage.sync.get(['apiKey']);
        currentApiKey = result.apiKey || CONFIG.defaultApiKey;
        console.log('API key refreshed from storage');
      }
    } catch (error) {
      console.error('Error refreshing API key from storage:', error);
    }
  }

  // Initialize API key on load
  initializeApiKey().then(() => {
    console.log('API key initialization completed');
    // Also refresh from storage to ensure we have the latest value
    return refreshApiKeyFromStorage();
  }).then(() => {
    console.log('API key refresh completed');
  }).catch((error) => {
    console.error('Error during initialization:', error);
  });

  console.log('VIRTUAL WEBCAM INSTALLED.');
  console.log('MediaDevices prototype methods:', Object.getOwnPropertyNames(MediaDevices.prototype));
}

export { monkeyPatchMediaDevices }