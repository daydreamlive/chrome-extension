# Privacy Policy for Daydream Dreamcam

**Last Updated:** October 10, 2025

## Overview

Daydream Dreamcam ("the Extension") is a browser extension that enables real-time AI-powered video processing for your webcam. This privacy policy explains how we collect, use, and protect your information.

## Information We Collect

### Data Stored Locally

The Extension stores the following information locally in your browser:

1. **API Key**: Your Daydream API key is stored locally using the browser's `chrome.storage.sync` API and is synchronized across your browser instances if you're signed into your browser account.

2. **User Preferences**: Your AI prompt settings and preferences are stored locally for the Extension to function properly.

3. **Active Stream ID**: A temporary identifier for your current video stream session, used to manage stream updates.

### Data Transmitted to External Services

When you use the Extension, the following data is transmitted to external servers:

1. **Video Stream**: Your webcam video (video only, not audio) is transmitted to our WHIP/WHEP processing server for AI-powered video processing.

2. **Audio Passthrough**: Your microphone audio is NOT sent to external servers. It passes through locally and is combined with the processed video stream on your device.

3. **API Requests**: Your API key and AI prompt are transmitted to the Daydream API to configure and manage your video processing stream.

## Third-Party Services

The Extension connects to the following third-party services:

1. **Daydream API** (`api.daydream.live`)
   - Purpose: Stream configuration and management
   - Data shared: API key, AI prompts, stream configuration
   - Privacy policy: [Link to Daydream's privacy policy - to be added]

2. **Livepeer AI** (`ai.livepeer.com`)
   - Purpose: Video processing and AI transformations
   - Data shared: Video stream data
   - Privacy policy: [https://livepeer.org/privacy-policy](https://livepeer.org/privacy-policy)

## How We Use Your Information

We use the collected information solely to:

- Authenticate your access to the Daydream service
- Process your video stream according to your specified AI prompts
- Maintain your preferences and settings across browser sessions
- Provide and improve the Extension's functionality

## Data Storage and Security

- **Local Storage**: All user credentials and preferences are stored locally in your browser using Chrome's secure storage APIs.
- **Transmission Security**: All data transmitted to external servers uses HTTPS encryption.
- **No Server-Side Storage**: We do not store your video streams, API keys, or personal information on our servers beyond the duration of your active session.

## Permissions Explained

The Extension requires the following permissions:

1. **Storage** (`storage`): To save your API key and preferences locally in your browser.

2. **Tabs** (`tabs`): To detect when web pages are using webcam access and inject the virtual camera functionality.

3. **Host Permissions** (`<all_urls>`): To intercept webcam requests on any website where you want to use the virtual camera. The Extension only activates when a website requests webcam access.

4. **Daydream API Access**: To communicate with `api.daydream.live` for stream management.

5. **Livepeer AI Access**: To communicate with `ai.livepeer.com` for video processing.

## Data Retention

- **Local Data**: Stored until you remove the Extension or clear your browser data.
- **Streaming Data**: Video stream data is processed in real-time and is not retained after your session ends.
- **API Logs**: Stream configuration requests may be logged by Daydream for up to 30 days for service operation and debugging purposes.

## Your Rights and Choices

You have the right to:

- **Access**: View all data stored locally by using your browser's extension storage inspection tools.
- **Delete**: Remove all stored data by clicking the "Reset" button in the Extension popup or by uninstalling the Extension.
- **Opt-Out**: Stop using the Extension at any time by disabling or uninstalling it.

## Children's Privacy

The Extension is not intended for use by children under the age of 13. We do not knowingly collect personal information from children under 13.

## Changes to This Privacy Policy

We may update this privacy policy from time to time. When we make changes, we will update the "Last Updated" date at the top of this policy. Continued use of the Extension after changes constitutes acceptance of the updated policy.

## Data Sharing

We do not sell, trade, or rent your personal information to third parties. We only share data with the third-party services mentioned above as necessary to provide the Extension's functionality.

## International Data Transfers

Your video stream may be processed on servers located in various countries. By using the Extension, you consent to the transfer of your data to these locations.

## Contact Information

If you have questions or concerns about this privacy policy or the Extension's data practices, please contact us at:

**Email**: [Your contact email - to be added]  
**Website**: [Your website - to be added]  
**GitHub**: https://github.com/dmisol/virtual-webcam

## Compliance

This privacy policy is designed to comply with:

- General Data Protection Regulation (GDPR)
- California Consumer Privacy Act (CCPA)
- Chrome Web Store Developer Program Policies
- Firefox Add-on Policies

## Disclaimer

The Extension provides a virtual webcam that intercepts and processes video streams. Users are responsible for:

- Complying with the terms of service of websites where they use the Extension
- Obtaining necessary consents from other participants in video calls
- Understanding that processed video may appear different from your actual appearance
- Ensuring they have the rights to use their chosen AI prompts and settings

---

**Important Note**: Before publishing this privacy policy, you should:

1. Add your actual contact information (email, website)
2. Add a link to Daydream's privacy policy if available
3. Review with legal counsel to ensure compliance with your jurisdiction
4. Host this policy on a publicly accessible URL (required by Chrome Web Store and Firefox Add-ons)
5. Add the privacy policy URL to your manifest.json and store listings

