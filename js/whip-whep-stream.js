/**
 * WhipWhepStream - Sends video to a WHIP endpoint and receives from a WHEP endpoint
 * This allows for server-side processing of the video stream
 */
class WhipWhepStream {
  constructor(stream, whipUrl, streamId, statusApiUrl) {
    console.log("New WHIP/WHEP Stream for", stream);
    this.inputStream = stream;
    this.whipUrl = whipUrl;
    this.streamId = streamId;
    this.statusApiUrl = statusApiUrl;
    this.whepUrl = null; // Will be fetched from status API

    // Loading state management
    this.loadingState = 'initializing'; // initializing, connecting, processing, ready, error
    this.loadingMessage = 'Initializing virtual camera...';
    this.loadingFrameCount = 0;

    // Create a canvas to receive the WHEP stream
    this.canvas = document.createElement("canvas");
    // Set default canvas size (will be updated to match input stream aspect ratio)
    this.canvas.width = 1280;
    this.canvas.height = 720;
    this.video = document.createElement("video");
    this.ctx = this.canvas.getContext('2d');
    
    // Store input video dimensions for proper canvas sizing
    this.inputVideoWidth = null;
    this.inputVideoHeight = null;
    this.processedVideoWidth = null;
    this.processedVideoHeight = null;

    // Ensure canvas is properly initialized and visible
    console.log("Canvas created:", this.canvas.width, "x", this.canvas.height);

    // Draw loading state initially and force style setup
    this.drawLoadingState();

    // Ensure canvas has proper styles for visibility
    this.canvas.style.position = 'absolute';
    this.canvas.style.visibility = 'visible';
    this.canvas.style.display = 'block';

    // Create initial output stream from canvas (video only)
    this.outputStream = this.canvas.captureStream(30); // 30 fps

    // Keep a reference to the canvas video track
    this.canvasTrack = this.outputStream.getVideoTracks()[0];

    // Configure the canvas track for motion video and stable delivery
    this.configureCanvasTrack(this.canvasTrack, 30);

    // Heartbeat pump to push frames even when background throttles rAF
    // This helps remote peers continue receiving frames rather than showing an avatar
    this.startFramePump(30);

    // Start the update loop immediately to ensure loading screen is visible
    console.log("Starting initial update loop");
    this.update();

    // Method to create a fresh output stream (for when tracks end)
    this.createFreshOutputStream = () => {
      // Stop existing tracks first
      this.outputStream.getTracks().forEach(track => track.stop());

      // Create new capture stream from canvas
      const freshStream = this.canvas.captureStream(30);

      // Copy audio tracks from input to the fresh stream
      const audioTracks = this.inputStream.getAudioTracks();
      audioTracks.forEach(track => {
        freshStream.addTrack(track);
      });

      // Update our reference
      this.outputStream = freshStream;
      this.canvasTrack = this.outputStream.getVideoTracks()[0];

      // Configure the new canvas track and ensure frame pumping continues
      this.configureCanvasTrack(this.canvasTrack, 30);
      this.startFramePump(30);

      // Set up monitoring for the new video track
      this.outputStream.getVideoTracks().forEach(track => {
        console.log("Fresh output video track created:", track);
        track.onended = () => console.warn("Fresh output video track ended!");
        track.onmute = () => console.warn("Fresh output video track muted!");
        track.onunmute = () => console.log("Fresh output video track unmuted!");
      });

      return freshStream;
    };
    
    // Monitor output stream tracks
    this.outputStream.getVideoTracks().forEach(track => {
      console.log("Output video track created:", track);
      track.onended = () => console.warn("Output video track ended!");
      track.onmute = () => console.warn("Output video track muted!");
      track.onunmute = () => console.log("Output video track unmuted!");
    });
    
    // Add original audio tracks to the output stream (passthrough)
    const audioTracks = stream.getAudioTracks();
    audioTracks.forEach(track => {
      console.log("Adding passthrough audio track:", track.label);
      track.onended = () => console.warn("Input audio track ended!");
      this.outputStream.addTrack(track);
    });
    
    // Monitor input video tracks and get dimensions
    stream.getVideoTracks().forEach(track => {
      console.log("Input video track:", track.label, "- enabled:", track.enabled);
      track.onended = () => {
        console.warn("Input video track ended!");
      };
      
      // Get input video dimensions from track settings
      if (track.getSettings) {
        const settings = track.getSettings();
        if (settings.width && settings.height) {
          this.inputVideoWidth = settings.width;
          this.inputVideoHeight = settings.height;
          // Update canvas to match input aspect ratio
          this.canvas.width = this.inputVideoWidth;
          this.canvas.height = this.inputVideoHeight;
          console.log(`Input video dimensions: ${this.inputVideoWidth}x${this.inputVideoHeight}, canvas set to match`);
        }
      }
    });
    
    // Initialize connections
    this.init();
  }

  configureCanvasTrack(track, fps) {
    try {
      if (!track) return;
      // Hint that this is motion video (not text or detail)
      if ('contentHint' in track) {
        track.contentHint = 'motion';
      }
      // Try to honor desired frame rate
      if (track.applyConstraints) {
        track.applyConstraints({ frameRate: fps }).catch((e) => {
          console.warn("Unable to apply canvas track constraints:", e);
        });
      }
      // Basic diagnostics
      console.log(`Configured canvas track: contentHint=${track.contentHint || 'n/a'}`);
    } catch (e) {
      console.warn("Error configuring canvas track:", e);
    }
  }

  startFramePump(fps) {
    // Clear any existing pump before starting a new one
    if (this.framePumpIntervalId) {
      clearInterval(this.framePumpIntervalId);
      this.framePumpIntervalId = null;
    }
    const intervalMs = Math.max(10, Math.floor(1000 / (fps || 30)));
    // Only start if we have a canvas track that supports requestFrame
    const track = this.canvasTrack;
    if (!track || typeof track.requestFrame !== 'function') {
      return;
    }
    this.framePumpIntervalId = setInterval(() => {
      try {
        // Push the current canvas bitmap even if rAF is throttled/backgrounded
        track.requestFrame();
      } catch (e) {
        // If requestFrame fails (e.g., track stopped), stop the pump
        console.warn("requestFrame failed; stopping frame pump:", e);
        clearInterval(this.framePumpIntervalId);
        this.framePumpIntervalId = null;
      }
    }, intervalMs);
  }

  drawLoadingState() {
    try {
      if (!this.ctx) {
        console.error("Canvas context not available!");
        return;
      }

      // Clear the entire canvas first
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      // Draw gradient background
      const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
      gradient.addColorStop(0, '#254a32');
      gradient.addColorStop(0.5, '#2d754a');
      gradient.addColorStop(1, '#3cb270');

      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      // Save current context state for flipping
      this.ctx.save();

      // Draw a simple loading spinner (animated dots)
      this.drawLoadingSpinner();

      // Restore context state
      this.ctx.restore();
    } catch (error) {
      console.error("Error drawing loading state:", error);
    }
  }

  drawLoadingSpinner() {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const radius = 50;
    const dotCount = 12;
    const dotRadius = 4;

    // Animate spinner based on loading frame count for smooth animation
    const time = this.loadingFrameCount / 3; // Slower, smoother animation
    const activeDot = Math.floor(time % dotCount);

    for (let i = 0; i < dotCount; i++) {
      const angle = (i / dotCount) * Math.PI * 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      // Calculate distance from active dot for smooth fade effect
      const distance = Math.abs(i - activeDot);
      const opacity = Math.max(0.2, 1 - (distance * 0.15));

      this.ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
      this.ctx.beginPath();
      this.ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  async init() {
    try {
      // Update loading state to connecting
      this.loadingState = 'connecting';
      this.loadingMessage = 'Connecting to AI service...';
      this.drawLoadingState();

      // Start WHIP (publish input stream)
      await this.startWhipPublish();

      // Update loading state to processing
      this.loadingState = 'processing';
      this.loadingMessage = 'Waiting for Daydreaming to begin';
      this.drawLoadingState();

      // Fetch WHEP URL from status API
      this.whepUrl = await this.fetchWhepUrlFromStatus();
      console.log("Fetched WHEP URL:", this.whepUrl);

      // Start WHEP (subscribe to processed stream) with retry logic
      await this.startWhepSubscribeWithRetry();
    } catch (error) {
      console.error("Error initializing WHIP/WHEP:", error);
      this.loadingState = 'error';
      this.loadingMessage = 'Connection failed';
      this.drawLoadingState();
      // Fallback: pass through original stream
      this.fallbackToPassthrough();
    }
  }

  async fetchWhepUrlFromStatus(maxRetries = 15, initialDelay = 1000) {
    const statusUrl = `${this.statusApiUrl}/${this.streamId}/status`;
    let retryCount = 0;
    let delay = initialDelay;
    
    while (retryCount < maxRetries) {
      try {
        console.log(`Fetching stream status (attempt ${retryCount + 1}/${maxRetries})...`);
        const response = await fetch(statusUrl);
        
        if (!response.ok) {
          throw new Error(`Status API returned ${response.status}`);
        }
        
        const data = await response.json();
        
        // Check if stream is ready
        if (!data.success) {
          throw new Error(`Status API returned error: ${data.error}`);
        }
        
        const status = data.data;
        
        // Check if we have the WHEP URL from gateway status
        if (status.gateway_status && status.gateway_status.whep_url) {
          const whepUrl = status.gateway_status.whep_url;
          console.log("Got WHEP URL from gateway_status:", whepUrl);
          return whepUrl;
        }
        
        // If we don't have the WHEP URL yet, retry
        throw new Error('Stream not ready yet (missing gateway_status.whep_url)');
        
      } catch (error) {
        retryCount++;
        if (retryCount >= maxRetries) {
          throw new Error(`Failed to fetch WHEP URL after ${maxRetries} attempts: ${error.message}`);
        }
        
        console.log(`Status fetch failed (${error.message}), retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Exponential backoff with max delay of 3 seconds
        delay = Math.min(delay * 1.5, 3000);
      }
    }
  }

  async startWhepSubscribeWithRetry(maxRetries = 100, initialDelay = 1000) {
    let retryCount = 0;
    let delay = initialDelay;
    
    while (retryCount < maxRetries) {
      try {
        console.log(`Attempting WHEP subscribe (attempt ${retryCount + 1}/${maxRetries})...`);
        await this.startWhepSubscribe();
        console.log("WHEP subscribe successful!");
        return; // Success, exit retry loop
      } catch (error) {
        retryCount++;
        console.error(`WHEP subscribe attempt ${retryCount} failed:`, error);
        
        if (retryCount >= maxRetries) {
          const finalError = new Error(`WHEP subscribe failed after ${maxRetries} attempts: ${error.message}`);
          console.error(finalError);
          throw finalError;
        }
        
        console.log(`Retrying WHEP subscribe in ${delay}ms... (attempt ${retryCount + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Exponential backoff with max delay of 5 seconds
        delay = Math.min(delay * 1.5, 5000);
      }
    }
  }

  async startWhipPublish() {
    console.log("Starting WHIP publish to:", this.whipUrl);
    
    this.whipPeerConnection = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    // Add only video tracks from input stream (audio goes directly through)
    const videoTracks = this.inputStream.getVideoTracks();
    videoTracks.forEach(track => {
      console.log("Adding video track to WHIP:", track.label);
      this.whipPeerConnection.addTrack(track, this.inputStream);
    });

    // Create offer
    const offer = await this.whipPeerConnection.createOffer();
    await this.whipPeerConnection.setLocalDescription(offer);

    // Send offer to WHIP endpoint
    const response = await fetch(this.whipUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/sdp'
      },
      body: offer.sdp
    });

    if (!response.ok) {
      throw new Error(`WHIP request failed: ${response.status}`);
    }

    // Get answer from server
    const answerSdp = await response.text();
    const answer = {
      type: 'answer',
      sdp: answerSdp
    };
    
    await this.whipPeerConnection.setRemoteDescription(answer);
    console.log("WHIP publish established");
  }

  async startWhepSubscribe() {
    console.log("Starting WHEP subscribe from:", this.whepUrl);
    
    this.whepPeerConnection = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    // Add transceiver for receiving video only (audio is passthrough from mic)
    this.whepPeerConnection.addTransceiver('video', { direction: 'recvonly' });

    // Handle incoming tracks
    this.whepPeerConnection.ontrack = (event) => {
      console.log("Received track from WHEP:", event.track.kind);
      if (event.track.kind === 'video') {
        const stream = new MediaStream([event.track]);
        this.video.srcObject = stream;
        this.video.autoplay = true;
        this.video.muted = true;
        this.video.playsInline = true;

        // Set up error handling for the video element
        this.video.onerror = (err) => {
          console.error("Video element error:", err);
          this.handleWhepError("Video playback error");
        };

        // Set up the playing event listener
        this.video.onplaying = () => {
          console.log(`Processed video dimensions: ${this.video.videoWidth}x${this.video.videoHeight}`);
          this.processedVideoWidth = this.video.videoWidth;
          this.processedVideoHeight = this.video.videoHeight;
          
          // Keep canvas at input dimensions (don't resize to match square video)
          // This ensures proper aspect ratio for preview
          if (!this.inputVideoWidth || !this.inputVideoHeight) {
            // Fallback: use default dimensions if input dimensions not available
            this.canvas.width = 1280;
            this.canvas.height = 720;
          } else {
            this.canvas.width = this.inputVideoWidth;
            this.canvas.height = this.inputVideoHeight;
          }
          console.log(`Canvas dimensions: ${this.canvas.width}x${this.canvas.height} (input: ${this.inputVideoWidth}x${this.inputVideoHeight}, processed: ${this.processedVideoWidth}x${this.processedVideoHeight})`);

          // Update loading state to ready
          this.loadingState = 'ready';
          this.loadingMessage = 'Virtual camera active!';
          this.drawLoadingState();

          console.log("Starting canvas update loop");
          this.update();
        };

        // Also listen for loadedmetadata to check if we have video dimensions
        this.video.onloadedmetadata = () => {
          console.log("Video metadata loaded:", this.video.videoWidth, "x", this.video.videoHeight);
        };

        // Handle track ending (connection lost)
        event.track.onended = () => {
          console.warn("WHEP video track ended - attempting reconnection");
          this.handleWhepError("Video track ended");
        };

        event.track.onmute = () => {
          console.warn("WHEP video track muted");
        };

        event.track.onunmute = () => {
          console.log("WHEP video track unmuted");
        };

        // Try to play the video
        this.video.play().then(() => {
          console.log("Video playback started");
        }).catch(err => {
          console.error("Error playing video:", err);
          this.handleWhepError("Video playback failed");
        });
      }
    };

    // Create offer
    const offer = await this.whepPeerConnection.createOffer();
    await this.whepPeerConnection.setLocalDescription(offer);

    // Send offer to WHEP endpoint
    const response = await fetch(this.whepUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/sdp'
      },
      body: offer.sdp
    });

    if (!response.ok) {
      throw new Error(`WHEP request failed: ${response.status}`);
    }

    // Get answer from server
    const answerSdp = await response.text();
    const answer = {
      type: 'answer',
      sdp: answerSdp
    };
    
    await this.whepPeerConnection.setRemoteDescription(answer);
    console.log("WHEP subscribe established");
  }

  update() {
    if (this.destroyed) {
      return; // Don't continue if destroyed
    }

    if (!this.isUpdating) {
      this.isUpdating = true;
      console.log("Update loop started");
    }

    // If we're in a loading state (not ready), show loading screen
    if (this.loadingState !== 'ready') {
      this.drawLoadingState();

      // Add a simple animation frame counter for smooth spinner animation
      if (!this.loadingFrameCount) this.loadingFrameCount = 0;
      this.loadingFrameCount++;

      // Log loading progress periodically
      if (this.loadingFrameCount % 60 === 0) {
        console.log(`Loading state: ${this.loadingState} - ${this.loadingMessage}`);
      }
    } else if (this.video.readyState >= this.video.HAVE_CURRENT_DATA) {
      try {
        // Clear canvas first
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Calculate centering for square video within wider canvas
        const videoWidth = this.processedVideoWidth || this.video.videoWidth;
        const videoHeight = this.processedVideoHeight || this.video.videoHeight;
        
        // Center the video within the canvas
        // Scale to fit while maintaining aspect ratio
        const scale = Math.min(this.canvas.width / videoWidth, this.canvas.height / videoHeight);
        const scaledWidth = videoWidth * scale;
        const scaledHeight = videoHeight * scale;
        // Calculate center position
        const centerX = (this.canvas.width - scaledWidth) / 2;
        const centerY = (this.canvas.height - scaledHeight) / 2;

        // Draw the video frame centered and scaled (no flip - Google Meet handles mirroring)
        this.ctx.drawImage(this.video, centerX, centerY, scaledWidth, scaledHeight);

        // Log first few frames
        if (!this.frameCount) this.frameCount = 0;
        this.frameCount++;
        if (this.frameCount <= 5 || this.frameCount % 300 === 0) {
          console.log(`Drawing frame ${this.frameCount} - readyState: ${this.video.readyState}, dimensions: ${this.canvas.width}x${this.canvas.height}`);

          // Check output track state
          const videoTrack = this.outputStream.getVideoTracks()[0];
          if (videoTrack) {
            console.log(`Output track state: enabled=${videoTrack.enabled}, muted=${videoTrack.muted}, readyState=${videoTrack.readyState}`);
          }
        }
      } catch (err) {
        console.error("Error drawing to canvas:", err);
      }
    } else {
      // Still waiting for video data, but we're in ready state - this shouldn't happen
      if (!this.waitingCount) this.waitingCount = 0;
      this.waitingCount++;
      if (this.waitingCount % 60 === 0) {
        console.log(`Waiting for video data... readyState: ${this.video.readyState} (need ${this.video.HAVE_CURRENT_DATA}), video src: ${this.video.srcObject ? 'set' : 'not set'}`);
      }
      // Still show loading state while waiting for video data
      this.drawLoadingState();
    }

    if (!this.destroyed) {
      requestAnimationFrame(() => this.update());
    }
  }

  handleWhepError(reason) {
    console.error(`WHEP error: ${reason} - attempting recovery`);

    // If we're already in error state, don't try to recover
    if (this.loadingState === 'error') {
      return;
    }

    // Set error state temporarily
    this.loadingState = 'error';
    this.loadingMessage = 'Connection lost - reconnecting...';

    // Try to reconnect WHEP after a short delay
    setTimeout(async () => {
      try {
        console.log("Attempting WHEP reconnection...");
        if (this.whepPeerConnection) {
          this.whepPeerConnection.close();
        }

        // Re-fetch WHEP URL in case it changed
        this.whepUrl = await this.fetchWhepUrlFromStatus();
        console.log("Re-fetched WHEP URL:", this.whepUrl);

        // Attempt to reconnect
        await this.startWhepSubscribe();
        console.log("WHEP reconnection successful");
      } catch (error) {
        console.error("WHEP reconnection failed:", error);
        // Fall back to passthrough mode
        this.fallbackToPassthrough();
      }
    }, 2000); // Wait 2 seconds before attempting reconnection
  }

  fallbackToPassthrough() {
    console.warn("Falling back to passthrough mode");
    this.loadingState = 'ready';
    this.loadingMessage = 'Using original camera (passthrough)';
    this.drawLoadingState();

    // Create a simple passthrough using canvas
    const video = document.createElement("video");
    video.srcObject = this.inputStream;
    video.autoplay = true;
    video.muted = true;

    video.addEventListener('playing', () => {
      this.canvas.width = video.videoWidth;
      this.canvas.height = video.videoHeight;
      const ctx = this.canvas.getContext('2d');

      const draw = () => {
        if (this.loadingState === 'ready') {
          // Draw the video frame (no flip - Google Meet handles mirroring)
          ctx.drawImage(video, 0, 0);
        }
        requestAnimationFrame(draw);
      };
      draw();
    });

    // Ensure the canvas track remains configured/pumped in passthrough
    if (this.canvasTrack) {
      this.configureCanvasTrack(this.canvasTrack, 30);
      this.startFramePump(30);
    }
  }

  destroy() {
    console.log("Destroying WhipWhepStream");
    this.destroyed = true;
    // Stop frame pump if running
    if (this.framePumpIntervalId) {
      clearInterval(this.framePumpIntervalId);
      this.framePumpIntervalId = null;
    }
    
    // Stop all tracks in the output stream
    this.outputStream.getTracks().forEach(track => {
      track.stop();
    });
    
    // Close peer connections
    if (this.whipPeerConnection) {
      this.whipPeerConnection.close();
    }
    if (this.whepPeerConnection) {
      this.whepPeerConnection.close();
    }
    
    // Stop input stream tracks
    if (this.inputStream) {
      this.inputStream.getTracks().forEach(track => {
        track.stop();
      });
    }
  }
}

export { WhipWhepStream }

