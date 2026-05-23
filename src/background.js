// background.js

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'openTab') {
    chrome.tabs.create({ url: message.url });
  }

  if (message.action === 'openWindow') {
    chrome.windows.create({ url: message.url, type: 'normal' });
  }

  if (message.action === 'openIncognito') {
    chrome.windows.create({ url: message.url, incognito: true, type: 'normal' });
  }

  if (message.action === 'openNewTab') {
    chrome.tabs.create({ url: message.url });
  }

  if (message.action === 'downloadImage') {
    chrome.downloads.download({
      url: message.url,
      filename: message.filename || undefined
    });
  }

  if (message.action === 'proxyFetchImage') {
    fetch(message.url)
      .then(res => res.blob())
      .then(blob => {
        const reader = new FileReader();
        reader.onloadend = () => sendResponse({ dataUrl: reader.result, type: blob.type });
        reader.readAsDataURL(blob);
      })
      .catch(err => sendResponse({ error: err.toString() }));

    return true;
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
    showSearchBar: true,
    showLinkOptions: true,
  });
});