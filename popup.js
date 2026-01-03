// DOM Elements
const views = {
  home: document.getElementById("homeView"),
  settings: document.getElementById("settingsView"),
};

const btns = {
  extract: document.getElementById("extractBtn"),
  settings: document.getElementById("toggleSettings"),
  back: document.getElementById("backBtn"),
  save: document.getElementById("saveConfig"),
};

const inputs = {
  token: document.getElementById("githubToken"),
  username: document.getElementById("githubUsername"),
  repo: document.getElementById("githubRepo"),
};

const statusContainer = document.getElementById("statusContainer");
const platformBadge = document.getElementById("platformBadge");
const platformName = document.getElementById("platformName");

// State
let currentPlatform = null;

// Initialize
document.addEventListener("DOMContentLoaded", async () => {
  await loadConfig();
  await detectPlatform();
  setupListeners();
});

// View Navigation
function switchView(viewName) {
  Object.values(views).forEach((el) => el.classList.remove("active"));
  views[viewName].classList.add("active");

  // Update header settings button visibility
  btns.settings.style.display = viewName === "home" ? "flex" : "none";
}

// Configuration Management
async function loadConfig() {
  const config = await chrome.storage.sync.get([
    "githubToken",
    "githubUsername",
    "githubRepo",
  ]);

  if (config.githubToken) inputs.token.value = config.githubToken;
  if (config.githubUsername) inputs.username.value = config.githubUsername;
  if (config.githubRepo) inputs.repo.value = config.githubRepo;

  // If not configured, show settings immediately
  if (!config.githubToken || !config.githubUsername || !config.githubRepo) {
    switchView("settings");
  }
}

async function saveConfig() {
  const token = inputs.token.value.trim();
  const username = inputs.username.value.trim();
  const repo = inputs.repo.value.trim();

  if (!token || !username || !repo) {
    showStatus("Please fill in all fields", "error", true); // Show inside settings
    return;
  }

  const originalText = btns.save.textContent;
  btns.save.innerHTML = '<div class="spinner"></div> Saving...';
  btns.save.disabled = true;

  try {
    await chrome.storage.sync.set({
      githubToken: token,
      githubUsername: username,
      githubRepo: repo,
    });

    // Switch back to home
    switchView("home");
    showStatus("Configuration saved ready to sync!", "success");
  } catch (error) {
    console.error(error); // Debugging
    // showStatus may not work well inside settings view if statusContainer is in home view
    // so we might alert or just add a small status div in settings if needed.
    // For now, let's just use alert for critical config failure or assume Success.
    alert("Failed to save settings: " + error.message);
  } finally {
    btns.save.textContent = originalText;
    btns.save.disabled = false;
  }
}

// Platform Detection
async function detectPlatform() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  const platforms = {
    "leetcode.com": "LeetCode",
    "geeksforgeeks.org": "GeeksforGeeks",
    "codeforces.com": "Codeforces",
    "hackerrank.com": "HackerRank",
  };

  const detected = Object.keys(platforms).find((domain) =>
    tab.url.includes(domain)
  );

  if (detected) {
    currentPlatform = platforms[detected];
    platformName.textContent = currentPlatform;
    platformBadge.classList.add("active");
    btns.extract.disabled = false;
  } else {
    currentPlatform = null;
    platformName.textContent = "Unsupported Platform";
    platformBadge.classList.remove("active");
    btns.extract.disabled = true;
    showStatus(
      "Please navigate to a supported coding platform (LeetCode, GFG, etc.)",
      "error"
    );
  }
}

// Logic
async function handleExtract() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  updateStatus("loading", "Extracting and saving...");
  btns.extract.disabled = true;

  try {
    // 1. Inject Scripts
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["extractors.js"],
    });

    // 2. Extract Data
    const response = await chrome.tabs.sendMessage(tab.id, {
      action: "extract",
    });

    if (!response || !response.success || !response.data) {
      throw new Error(
        "Failed to extract data. Ensure you are on a problem page."
      );
    }

    // 3. Push to GitHub
    const config = await chrome.storage.sync.get([
      "githubToken",
      "githubUsername",
      "githubRepo",
    ]);

    // Double check config
    if (!config.githubToken) {
      switchView("settings");
      throw new Error("Please configure GitHub first.");
    }

    const pushResponse = await chrome.runtime.sendMessage({
      action: "pushToGitHub",
      data: {
        problemData: response.data,
        githubConfig: config,
      },
    });

    if (pushResponse.success) {
      showStatus(
        `Success! <a href="${pushResponse.result.url}" target="_blank">View on GitHub</a><br><small>${pushResponse.result.filePath}</small>`,
        "success"
      );
    } else {
      throw new Error(pushResponse.error || "Unknown error during push");
    }
  } catch (error) {
    showStatus(error.message, "error");
  } finally {
    btns.extract.disabled = false;
  }
}

// UI Helpers
function updateStatus(type, message) {
  statusContainer.innerHTML = `
    <div class="status-card ${type}">
      ${
        type === "loading"
          ? '<div class="spinner" style="border-left-color: var(--text); width:14px; height:14px;"></div>'
          : ""
      }
      ${message}
    </div>
  `;
}

function showStatus(message, type, isSettings = false) {
  // If we are in settings, we might need a different place to show status or just switch view?
  // Current design has statusContainer on Home View.
  // For simplicity, if error is in settings, we use alert (or we could add a status div in settings).
  if (isSettings) {
    alert(message);
    return;
  }
  updateStatus(type, message);
}

function setupListeners() {
  btns.settings.addEventListener("click", () => switchView("settings"));
  btns.back.addEventListener("click", () => switchView("home"));
  btns.save.addEventListener("click", saveConfig);
  btns.extract.addEventListener("click", handleExtract);
}
