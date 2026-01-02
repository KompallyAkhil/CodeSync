// Content script that runs on coding platform pages

(function() {
  'use strict';

  let extractorsLoaded = false;

  // Inject extractors script
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('extractors.js');
  script.onload = function() {
    extractorsLoaded = true;
    this.remove();
  };
  (document.head || document.documentElement).appendChild(script);

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extract') {
      // Wait for extractors to load if not already loaded
      if (!extractorsLoaded || typeof PlatformExtractor === 'undefined') {
        // Try to extract anyway (extractors might be injected by popup)
        setTimeout(() => {
          try {
            const data = typeof PlatformExtractor !== 'undefined' ? PlatformExtractor.extract() : null;
            sendResponse({ success: data !== null, data: data });
          } catch (error) {
            sendResponse({ success: false, data: null, error: error.message });
          }
        }, 500);
        return true;
      }
      
      try {
        const data = PlatformExtractor.extract();
        sendResponse({ success: data !== null, data: data });
      } catch (error) {
        sendResponse({ success: false, data: null, error: error.message });
      }
    }
    return true; // Keep channel open for async response
  });
})();

