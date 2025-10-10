# Store Submission Guide for Daydream Dreamcam

This guide provides step-by-step instructions for submitting the Daydream Dreamcam extension to both the Chrome Web Store and Firefox Add-ons marketplace.

## Pre-Submission Checklist

Before submitting, ensure you have:

- [ ] Run `./package.sh` to create distribution packages
- [ ] Tested the extension thoroughly in both Chrome and Firefox
- [ ] Prepared promotional images and screenshots
- [ ] Hosted the privacy policy on a public URL
- [ ] Created developer accounts for both stores
- [ ] Prepared payment method ($5 one-time fee for Chrome Web Store)

---

## Chrome Web Store Submission

### 1. Developer Account Setup

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Sign in with your Google account
3. Pay the one-time $5 developer registration fee
4. Verify your email address

### 2. Store Listing Information

#### Required Information

**Extension Name:**
```
Daydream Dreamcam
```

**Summary** (132 characters max):
```
Real-time AI video processing for your webcam. Transform your video calls with AI-powered effects.
```

**Description** (See `store-listings/description-full.txt` for complete version):
```
Daydream Dreamcam transforms your webcam into an AI-powered virtual camera with real-time video processing.

✨ KEY FEATURES
• Real-time AI video effects and transformations
• Custom AI prompts for personalized video processing
• Audio passthrough - your voice stays natural and clear
• Works with Google Meet, Zoom, Microsoft Teams, and more
• Privacy-focused: processes video, not audio

🎨 HOW IT WORKS
1. Install the extension and get your API key from daydream.live
2. Configure your AI prompt for the effects you want
3. Select "Chrome Virtual Webcam" in your video call app
4. Your video is processed in real-time with AI magic

🔒 PRIVACY & SECURITY
• Your API key and settings stored locally in your browser
• Audio never leaves your device - only video is processed
• Secure HTTPS connections to processing servers
• No data retention after your session ends

📋 REQUIREMENTS
• Chrome 10.0 or higher
• Daydream API key (free trial available at app.daydream.live)
• Webcam access

Perfect for content creators, streamers, remote workers, and anyone who wants to enhance their video presence!

See full documentation: https://github.com/dmisol/virtual-webcam
```

**Category:**
```
Social & Communication
```

**Language:**
```
English
```

### 3. Privacy Policy

**Privacy Policy URL:**
```
[Add your hosted privacy policy URL here]
Example: https://yourdomain.com/privacy-policy
or: https://github.com/dmisol/virtual-webcam/blob/master/PRIVACY.md
```

**Single Purpose Description:**
```
This extension provides an AI-powered virtual webcam that processes video streams in real-time using user-specified AI prompts, enabling enhanced video calls and streaming.
```

**Permission Justifications:**

- **storage**: Required to save user's API key and AI prompt preferences locally
- **tabs**: Required to detect when web pages request webcam access and inject the virtual camera
- **host_permissions (<all_urls>)**: Required to intercept getUserMedia() calls on any website where the user wants to use the virtual webcam

### 4. Visual Assets

#### Required Screenshots
- **Count**: Minimum 1, recommended 3-5
- **Size**: 1280x800 or 640x400 pixels
- **Format**: PNG or JPEG
- **What to capture**: See `store-listings/screenshots-checklist.md`

Recommended screenshots:
1. Extension popup showing settings interface
2. Virtual webcam working in Google Meet/Zoom
3. Before/after comparison of AI processing
4. Camera selection in a video conferencing app showing "Chrome Virtual Webcam"

#### Promotional Images (Optional but Recommended)

**Small Tile** (440x280 pixels):
- Simple logo or product shot
- Extension name visible

**Marquee** (1400x560 pixels):
- Promotional banner
- Show key features or benefits

**Icon** (128x128 pixels):
- Already included: `icon-128.png`

### 5. Distribution Settings

**Visibility:**
```
Public (or Unlisted for testing)
```

**Regions:**
```
All regions (or select specific countries)
```

**Pricing:**
```
Free
```

### 6. Upload Package

1. Click "New Item" in the Developer Dashboard
2. Upload `build/daydream-dreamcam-chrome-v1.0.0.zip`
3. Wait for automated review (typically completes within seconds)
4. Fix any validation errors if they appear

### 7. Review and Publish

1. Review all information for accuracy
2. Click "Submit for Review"
3. Wait for manual review (typically 1-3 business days, can be longer)
4. Respond promptly to any reviewer questions

**Common Review Issues to Avoid:**
- Ensure privacy policy is accessible and comprehensive
- Clearly explain why broad host permissions are needed
- Provide detailed permission justifications
- Test on a clean Chrome profile before submitting

---

## Firefox Add-ons Submission

### 1. Developer Account Setup

1. Go to [Firefox Add-on Developer Hub](https://addons.mozilla.org/developers/)
2. Sign in with your Firefox account (create one if needed)
3. No registration fee required

### 2. Submit Your Add-on

1. Click "Submit a New Add-on"
2. Choose "On this site" (listed on addons.mozilla.org)
3. Upload `build/daydream-dreamcam-firefox-v1.0.0.zip`

### 3. Add-on Details

**Name:**
```
Daydream Dreamcam
```

**Summary** (250 characters max):
```
Real-time AI video processing for your webcam. Transform your video calls with AI-powered effects. Works with Meet, Zoom, Teams and more. Privacy-focused: processes video, not audio.
```

**Description:**
```
(Use the same description as Chrome, formatted for Firefox)
See store-listings/description-full.txt
```

**Categories:**
```
Primary: Social & Communication
Secondary: Productivity
```

**Support Email:**
```
[Your support email]
```

**Support Website:**
```
https://github.com/dmisol/virtual-webcam
```

**Privacy Policy:**
```
[Your hosted privacy policy URL]
```

### 4. Version Information

**Version Number:**
```
1.0.0
```

**Release Notes:**
```
Initial release of Daydream Dreamcam

Features:
- Real-time AI video processing via WHIP/WHEP
- Custom AI prompts for personalized effects
- Audio passthrough for clear voice communication
- Compatible with major video conferencing platforms
- Privacy-focused design
```

**License:**
```
[Choose appropriate license, e.g., MIT, Apache 2.0, or Custom License]
```

### 5. Technical Details

**This add-on is experimental:**
```
No
```

**Requires payment, non-free services, or software:**
```
Yes - Requires a Daydream API key (free trial available)
```

**Has privacy policy:**
```
Yes - [Your privacy policy URL]
```

### 6. Review Process

Firefox has two review tracks:

**Preliminary Review** (faster, ~1-2 weeks):
- Listed on site but marked as "Experimental"
- Fewer users will see it

**Full Review** (slower, ~2-4 weeks):
- Full listing with no restrictions
- Recommended for production releases

Choose "Full Review" for the initial submission.

### 7. Source Code Submission

If your extension uses minified, obfuscated, or compiled code, you may need to submit source code. For this extension:

**Source Code Required:** No (all JavaScript is unminified and readable)

However, be prepared to:
- Answer questions about the WHIP/WHEP implementation
- Explain the external service dependencies
- Provide documentation for the API integration

---

## Post-Submission Monitoring

### Chrome Web Store

1. Monitor the Developer Dashboard for review status
2. Check email for any reviewer questions
3. Once approved, test the published version
4. Monitor user reviews and ratings
5. Respond to user feedback

### Firefox Add-ons

1. Monitor Add-on Developer Hub for review status
2. Check email for reviewer communications
3. Be prepared to answer technical questions
4. Review the automated validation report
5. Once approved, verify the listing

---

## Common Rejection Reasons and How to Avoid Them

### Chrome Web Store

1. **Insufficient Privacy Policy**
   - Solution: Use the comprehensive PRIVACY.md provided and host it publicly

2. **Unclear Permission Justification**
   - Solution: Use the permission justifications in `store-listings/permissions-justification.txt`

3. **Functionality Not Clear**
   - Solution: Include clear screenshots and detailed description

4. **External Code/Resources**
   - Solution: All code is included in the package, no external resources loaded

### Firefox Add-ons

1. **Privacy Policy Missing or Incomplete**
   - Solution: Host PRIVACY.md and link in submission

2. **Broad Permissions Without Justification**
   - Solution: Clearly explain in description and permission justifications

3. **Source Code Questions**
   - Solution: Be prepared to explain the WHIP/WHEP implementation

4. **External Service Dependencies**
   - Solution: Clearly document Daydream and Livepeer integrations

---

## Update Process

When releasing updates:

### Chrome Web Store
1. Increment version in `manifest.json`
2. Run `./package.sh` to create new package
3. Upload new ZIP in Developer Dashboard
4. Provide detailed release notes
5. Submit for review

### Firefox Add-ons
1. Increment version in `manifest.json`
2. Run `./package.sh` to create new package
3. Click "Upload New Version" in Developer Hub
4. Provide release notes
5. Submit for review

---

## Testing Before Submission

Before submitting to stores, test:

- [ ] Extension loads without errors in fresh Chrome profile
- [ ] Extension loads without errors in fresh Firefox profile
- [ ] Popup opens and displays correctly
- [ ] Settings save and persist after browser restart
- [ ] Virtual webcam appears in video conferencing apps
- [ ] Video processing works with valid API key
- [ ] Audio passthrough works correctly
- [ ] No console errors in normal operation
- [ ] Privacy policy link is accessible
- [ ] Icons display correctly at all sizes

---

## Support and Maintenance

After publication:

1. **Monitor User Reviews**: Respond within 24-48 hours
2. **Track Issues**: Use GitHub issues for bug reports
3. **Regular Updates**: Release updates for bug fixes and features
4. **Security**: Promptly address any security concerns
5. **Documentation**: Keep README and documentation updated

---

## Resources

### Chrome Web Store
- [Developer Program Policies](https://developer.chrome.com/docs/webstore/program-policies/)
- [Review Process](https://developer.chrome.com/docs/webstore/review-process/)
- [Best Practices](https://developer.chrome.com/docs/webstore/best-practices/)

### Firefox Add-ons
- [Add-on Policies](https://extensionworkshop.com/documentation/publish/add-on-policies/)
- [Submission Guide](https://extensionworkshop.com/documentation/publish/submitting-an-add-on/)
- [Review Policies](https://extensionworkshop.com/documentation/publish/review-policies/)

---

## Support

If you encounter issues during submission:

- **Chrome**: Use the [Chrome Web Store Help Forum](https://support.google.com/chrome_webstore/community)
- **Firefox**: Use the [Add-ons Forum](https://discourse.mozilla.org/c/add-ons/35)

Good luck with your submission! 🚀

