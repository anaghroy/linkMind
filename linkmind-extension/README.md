# LinkMind Browser Extension

Save any webpage to your LinkMind knowledge base with one click.

## Features
- 🔗 Save current page with one click
- 📁 Add to a collection while saving
- 📝 Add a quick note
- 🖱️ Right-click any link to save it
- ✅ Duplicate detection
- 🤖 AI processing starts automatically

## Setup

### 1. Add icons
Create PNG icons and place in the `icons/` folder:
- `icon16.png` (16×16)
- `icon48.png` (48×48)  
- `icon128.png` (128×128)

You can use any LinkMind logo image resized to these dimensions.

### 2. Update API URL
In `popup/popup.js` and `background/background.js`, update:
```js
const API_BASE = "http://localhost:3000/api"; // change to your production URL
```

Also update the app URL in `popup.js`:
```js
const appUrl = `http://localhost:5173${path}`; // change to your production URL
```

### 3. Install in Chrome
1. Open Chrome → go to `chrome://extensions`
2. Enable **Developer Mode** (top right toggle)
3. Click **"Load unpacked"**
4. Select this `linkmind-extension` folder
5. The LinkMind icon appears in your toolbar ✅

### 4. Install in Firefox
1. Open Firefox → go to `about:debugging`
2. Click **"This Firefox"**
3. Click **"Load Temporary Add-on"**
4. Select the `manifest.json` file
5. The extension loads ✅

> For permanent Firefox install, submit to Firefox Add-ons store.

## Usage
- **Click** the toolbar icon → popup opens → click "Save to LinkMind"
- **Right-click** any page or link → "Save to LinkMind"
- First time → sign in with your LinkMind credentials

## File Structure
```
linkmind-extension/
├── manifest.json
├── popup/
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
├── background/
│   └── background.js
├── content/
│   └── content.js
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```