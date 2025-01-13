# Bor Protocol Event Listener Extension

As there is no API endpoints for the livestreaming feature on X. We created a Chrome extension designed to monitor and capture chat events from X (formerly Twitter) in real-time. The extension provides a clean, modern interface with live monitoring capabilities.

## Features

- Real-time chat monitoring
- User avatar and message capture
- Clean, modern UI with X-style design
- Start/Stop monitoring functionality
- Background processing of messages
- Duplicate message filtering
- Local storage integration

## Screenshots

### Extension Interface
![Extension Popup - Ready State](./screenshots/start-monitor.png)
*Extension popup showing the ready state with "Start Monitoring" button*

### Live Monitoring
![Extension in Action](./screenshots/stop-monitor.png)
*Extension actively monitoring a Bitcoin live stream chat with real-time messages*

### Example Use Case
The extension being used to monitor a live Bitcoin price watch party:
- Stream: "$125K WATCH PARTY WITH @KRAKENDESKTOP"
- Viewers: 6.2M views
- Real-time chat monitoring and message capture

## Installation

1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the `scrapper-extn` directory

## Project Structure

- `popup.html` - Extension popup interface
- `popup.js` - Popup interaction logic
- `content.js` - Content script for webpage interaction
- `background.js` - Background service worker
- `manifest.json` - Extension configuration

## Usage

1. Open the extension by clicking its icon in the Chrome toolbar
2. Navigate to X (Twitter) in your first tab
3. Open the chat you want to monitor in a second tab
4. Click "Start Monitoring" in the extension popup
5. The extension will begin capturing chat messages

## Technical Details

### Permissions Required

- activeTab
- tabs
- scripting
- storage

### Host Permissions
json
[
"http://localhost:/",
"https://localhost:/",
"https://x.com/",
"https://.x.com/"
]


## Development

To modify the extension:

1. Make your changes to the source files
2. Reload the extension in `chrome://extensions/`
3. Test your changes




## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
