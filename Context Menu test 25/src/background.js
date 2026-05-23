// background.js

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'openTab') {
    chrome.tabs.create({ url: message.url });
  }
  
  if (message.action === 'downloadImage') {
    chrome.downloads.download({
      url: message.url,
      filename: message.filename || undefined 
    });
  }

  // NEW: Background Proxy to bypass CORS restrictions
  if (message.action === 'proxyFetchImage') {
    fetch(message.url)
      .then(res => res.blob())
      .then(blob => {
        // Convert the blob to a base64 Data URL to safely send it across scripts
        const reader = new FileReader();
        reader.onloadend = () => sendResponse({ dataUrl: reader.result, type: blob.type });
        reader.readAsDataURL(blob);
      })
      .catch(err => sendResponse({ error: err.toString() }));
      
    return true; // Tells Chrome we will send the response asynchronously
  }
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({
    theme:   'dark',
    opacity: 85,
    blur:    20,
    radius:  10,
    fontSize: 13,
    enableNewTab: true,
    showSearchBar: true
  });
});