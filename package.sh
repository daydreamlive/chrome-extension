#!/bin/bash

# Extension Packaging Script for Daydream Dreamcam
# Creates distribution packages for Chrome Web Store and Firefox Add-ons

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
EXTENSION_NAME="daydream-dreamcam"
VERSION=$(grep '"version"' manifest.json | sed 's/.*"version": "\(.*\)".*/\1/')
BUILD_DIR="build"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BUILD_SUBDIR="${BUILD_DIR}/${EXTENSION_NAME}-${VERSION}-${TIMESTAMP}"

# Files to include in the package
INCLUDE_FILES=(
    "manifest.json"
    "popup.html"
    "popup.js"
    "icon.png"
    "icon-16.png"
    "icon-48.png"
    "icon-64.png"
    "icon-128.png"
    "js/inject.js"
    "js/main.js"
    "js/media-devices.js"
    "js/whip-whep-stream.js"
)

# Maximum package size (in bytes) - Chrome Web Store limit is 128MB, but we'll use 50MB as warning
MAX_SIZE=$((50 * 1024 * 1024))

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Daydream Dreamcam Extension Packaging Script             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Extension:${NC} ${EXTENSION_NAME}"
echo -e "${GREEN}Version:${NC} ${VERSION}"
echo -e "${GREEN}Build Directory:${NC} ${BUILD_SUBDIR}"
echo ""

# Step 1: Validate required files exist
echo -e "${YELLOW}[1/6]${NC} Validating required files..."
MISSING_FILES=0
for file in "${INCLUDE_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}✗ Missing required file: $file${NC}"
        MISSING_FILES=$((MISSING_FILES + 1))
    else
        echo -e "${GREEN}✓${NC} $file"
    fi
done

if [ $MISSING_FILES -gt 0 ]; then
    echo -e "${RED}Error: $MISSING_FILES required file(s) missing. Cannot proceed.${NC}"
    exit 1
fi

# Step 2: Validate manifest.json
echo ""
echo -e "${YELLOW}[2/6]${NC} Validating manifest.json..."
if ! python3 -m json.tool manifest.json > /dev/null 2>&1; then
    echo -e "${RED}✗ manifest.json is not valid JSON${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} manifest.json is valid JSON"

# Check manifest version
MANIFEST_VERSION=$(grep '"manifest_version"' manifest.json | sed 's/.*: \([0-9]*\).*/\1/')
if [ "$MANIFEST_VERSION" != "3" ]; then
    echo -e "${YELLOW}⚠ Warning: Manifest version is $MANIFEST_VERSION (expected 3)${NC}"
fi

# Step 3: Create build directory structure
echo ""
echo -e "${YELLOW}[3/6]${NC} Creating build directory structure..."
mkdir -p "${BUILD_SUBDIR}/js"
echo -e "${GREEN}✓${NC} Created ${BUILD_SUBDIR}"

# Step 4: Copy files
echo ""
echo -e "${YELLOW}[4/6]${NC} Copying extension files..."
for file in "${INCLUDE_FILES[@]}"; do
    cp "$file" "${BUILD_SUBDIR}/$file"
    echo -e "${GREEN}✓${NC} Copied $file"
done

# Step 5: Create ZIP packages
echo ""
echo -e "${YELLOW}[5/6]${NC} Creating distribution packages..."

# Chrome package
CHROME_ZIP="${BUILD_DIR}/${EXTENSION_NAME}-chrome-v${VERSION}.zip"
cd "${BUILD_SUBDIR}"
zip -r "../../${CHROME_ZIP}" . > /dev/null
cd - > /dev/null
CHROME_SIZE=$(stat -f%z "${CHROME_ZIP}" 2>/dev/null || stat -c%s "${CHROME_ZIP}")
echo -e "${GREEN}✓${NC} Created Chrome package: ${CHROME_ZIP} ($(numfmt --to=iec-i --suffix=B ${CHROME_SIZE} 2>/dev/null || echo "${CHROME_SIZE} bytes"))"

# Firefox package (same as Chrome for Manifest V3)
FIREFOX_ZIP="${BUILD_DIR}/${EXTENSION_NAME}-firefox-v${VERSION}.zip"
cp "${CHROME_ZIP}" "${FIREFOX_ZIP}"
FIREFOX_SIZE=$(stat -f%z "${FIREFOX_ZIP}" 2>/dev/null || stat -c%s "${FIREFOX_ZIP}")
echo -e "${GREEN}✓${NC} Created Firefox package: ${FIREFOX_ZIP} ($(numfmt --to=iec-i --suffix=B ${FIREFOX_SIZE} 2>/dev/null || echo "${FIREFOX_SIZE} bytes"))"

# Step 6: Validate packages
echo ""
echo -e "${YELLOW}[6/6]${NC} Validating packages..."

# Check size
if [ ${CHROME_SIZE} -gt ${MAX_SIZE} ]; then
    echo -e "${RED}✗ Warning: Chrome package size (${CHROME_SIZE} bytes) exceeds recommended limit (${MAX_SIZE} bytes)${NC}"
else
    echo -e "${GREEN}✓${NC} Chrome package size is within limits"
fi

if [ ${FIREFOX_SIZE} -gt ${MAX_SIZE} ]; then
    echo -e "${RED}✗ Warning: Firefox package size (${FIREFOX_SIZE} bytes) exceeds recommended limit (${MAX_SIZE} bytes)${NC}"
else
    echo -e "${GREEN}✓${NC} Firefox package size is within limits"
fi

# Verify ZIP integrity
if unzip -t "${CHROME_ZIP}" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Chrome ZIP integrity verified"
else
    echo -e "${RED}✗ Chrome ZIP integrity check failed${NC}"
    exit 1
fi

if unzip -t "${FIREFOX_ZIP}" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Firefox ZIP integrity verified"
else
    echo -e "${RED}✗ Firefox ZIP integrity check failed${NC}"
    exit 1
fi

# Summary
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Packaging Complete!                                       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Build artifacts:${NC}"
echo -e "  📦 Chrome:   ${CHROME_ZIP}"
echo -e "  📦 Firefox:  ${FIREFOX_ZIP}"
echo -e "  📁 Source:   ${BUILD_SUBDIR}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. Review STORE_SUBMISSION.md for submission guidelines"
echo -e "  2. Prepare screenshots and promotional images"
echo -e "  3. Upload ${CHROME_ZIP} to Chrome Web Store"
echo -e "  4. Upload ${FIREFOX_ZIP} to Firefox Add-ons"
echo -e "  5. Ensure privacy policy is hosted and accessible"
echo ""

