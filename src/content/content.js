// Content script that runs on coding platform pages

(function () {
  "use strict";

  let extractorsLoaded = false;

  // Inject extractors script
  const script = document.createElement("script");
  script.src = chrome.runtime.getURL("extractors.js");
  script.onload = function () {
    extractorsLoaded = true;
    this.remove();
  };
  (document.head || document.documentElement).appendChild(script);

  // Helper to extract via Main World
  function extractFromMainWorld() {
    return new Promise((resolve, reject) => {
      let resolved = false;

      const listener = (event) => {
        if (event.source !== window) return;
        if (event.data.type === "CODESYNC_EXTRACT_RESPONSE") {
          resolved = true;
          window.removeEventListener("message", listener);
          resolve(event.data.data);
        }
      };

      window.addEventListener("message", listener);
      window.postMessage({ type: "CODESYNC_EXTRACT_REQUEST" }, "*");

      // Timeout fallback - if Main World doesn't respond, try Isolated World
      setTimeout(() => {
        if (resolved) return;
        window.removeEventListener("message", listener);

        // Fallback to isolated world extraction
        try {
          if (typeof PlatformExtractor !== "undefined") {
            console.log(
              "Main world extraction timed out, falling back to isolated world"
            );
            resolve(PlatformExtractor.extract());
          } else {
            // If PlatformExtractor is not defined yet, it might be injecting...
            // but usually popups inject it before sending message.
            reject(
              new Error(
                "Extraction failed: Main world timeout and PlatformExtractor undefined"
              )
            );
          }
        } catch (e) {
          reject(e);
        }
      }, 1000);
    });
  }

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "extract") {
      extractFromMainWorld()
        .then((data) => sendResponse({ success: data !== null, data: data }))
        .catch((error) => {
          console.error("Extraction error:", error);
          sendResponse({ success: false, data: null, error: error.message });
        });

      return true; // Keep channel open for async response
    }
    return true;
  });
})();
