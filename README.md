![Fluent](preview.png)

# Fluent

A modern Chrome extension built on Manifest V3. Replaces the native browser context menu with a customizable Fluent Design interface and overrides the new tab page with a feature-rich dashboard.

## Features

### Dynamic Context Menu
* **Context-Aware:** Dynamically adjusts options based on selection (text, images, input fields, links).
* **Image Tools:** Copy images to clipboard, download in multiple formats (PNG/JPEG), reverse search via Google Lens. Bypasses CORS via background service worker.
* **Customization:** Adjust theme, opacity, blur, corner radius, and font size from the settings panel.
* **Toggleable:** Enable or disable the custom context menu from settings.

### Integrated New Tab Page
* **Dashboard:** Clean clock, date, and multi-engine search (web, images, video).
* **Google Lens:** Upload or paste images for reverse image search.
* **Time Tracker:** Automatic daily browsing time statistics.
* **Mini Games:** Snake and Wordle games built directly into the new tab.
* **Speed Test:** Built-in network speed tester.
* **Bookmarks:** Custom bookmark manager with link and image types. Drag, resize, and organize freely.
* **Drag & Resize Layout:** Unlock the layout to freely drag and resize every section (clock, search, widgets, etc.). Lock it to prevent accidental changes.
* **8 Themes:** Dark, Light, Ocean, Midnight, Nord, Forest, Sunset, Dracula.

## Installation for Developers

1. Clone or download this repository.
2. Open Chrome and go to `chrome://extensions/`.
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the project root.

## Project Structure

* `/icons` - Application icons.
* `/src/background.js` - Service worker: CORS proxy, downloads, tab management, time tracker.
* `/src/content.js` - Content script: intercepts right-click, manages clipboard, injects context menu DOM.
* `/src/styles.css` - Fluent Design animations and layout for the context menu.
* `/src/popup/` - Settings panel UI (popup.html, popup.js).
* `/src/newtab/` - New tab page: dashboard, search, bookmarks, games, speed test, layout manager.
* `manifest.json` - Extension configuration.

## Permissions

* `storage` — Save user preferences.
* `contextMenus` — Context menu operations.
* `clipboardRead` & `clipboardWrite` — Read/write clipboard images.
* `downloads` — Save images locally.
* `tabs`, `alarms` — Time tracker functionality.
* `host_permissions (<all_urls>)` — Process images across domains (CORS bypass).

## License

MIT License. See the LICENSE file for details.
