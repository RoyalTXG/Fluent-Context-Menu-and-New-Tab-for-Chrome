# Fluent Context Menu

Fluent Context Menu is a modern Chrome extension built on Manifest V3. It replaces the native browser context menu with a highly customizable, Fluent Design-inspired interface. Additionally, it overrides the default new tab page with a minimalist dashboard featuring integrated search and advanced image upload capabilities.

## Features

### Dynamic Context Menu
* **Context-Aware Interface:** The menu dynamically adjusts its available options based on the user's selection (e.g., text highlighting, image focus, or active input fields).
* **Advanced Image Handling:** Utilizes background service workers to bypass Cross-Origin Resource Sharing (CORS) restrictions, allowing users to copy protected images directly to their system clipboard.
* **Format Conversion:** Download images natively or convert them to specific formats (PNG, JPEG) via hidden canvas rendering.
* **Customization:** Includes a dedicated settings panel to adjust theme, opacity, blur, corner radius, and font size.

### Integrated New Tab Page
* **Minimalist Dashboard:** Features a clean interface displaying the current time and date.
* **Multi Search:** Search the web, images, or videos directly from the new tab page.
* **Google Lens Integration:** A dedicated interface for reverse image searching. Users can upload an image file via the system dialog, or utilize a global paste listener to drop images directly from the clipboard.

## Installation for Developers

To install this extension locally in developer mode:

1. Clone this repository or download the ZIP file and extract it.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** using the toggle switch in the top right corner.
4. Click the **Load unpacked** button.
5. Select the root directory of this project (the folder containing `manifest.json`).

## Project Structure

* `/icons` - Application icons in various dimensions.
* `/src/background.js` - The service worker responsible for managing CORS bypass proxies, downloads, and tab management.
* `/src/content.js` - The primary content script that intercepts right-click events, manages clipboard operations, and injects the custom DOM elements.
* `/src/styles.css` - Styling rules defining the Fluent Design animations and layout.
* `/src/popup/` - HTML and JavaScript files governing the extension settings interface.
* `/src/newtab/` - HTML and JavaScript files governing the custom new tab page and reverse image upload logic.
* `manifest.json` - The extension configuration file defining permissions and script routing.

## Permissions

* `storage`: Required to save and retrieve user interface preferences.
* `contextMenus`: Required for baseline context menu operations.
* `clipboardRead` & `clipboardWrite`: Required to read pasted images and write converted images to the system clipboard.
* `downloads`: Required to save images to the local file system.
* `host_permissions (<all_urls>)`: Required to process image data across different domains without triggering CORS violations.

## License

This project is licensed under the MIT License. See the LICENSE file for details.
