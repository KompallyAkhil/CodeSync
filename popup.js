// Popup script for UI interactions

document.addEventListener('DOMContentLoaded', async () => {
  // Load saved configuration
  const result = await chrome.storage.sync.get(['githubToken', 'githubUsername', 'githubRepo']);
  
  const tokenInput = document.getElementById('githubToken');
  const usernameInput = document.getElementById('githubUsername');
  const repoInput = document.getElementById('githubRepo');
  const configStatus = document.getElementById('configStatus');

  if (result.githubToken) {
    tokenInput.value = result.githubToken;
  }
  if (result.githubUsername) {
    usernameInput.value = result.githubUsername;
  }
  if (result.githubRepo) {
    repoInput.value = result.githubRepo;
  }

  // Update config status
  function updateConfigStatus() {
    const hasToken = tokenInput.value.trim().length > 0;
    const hasUsername = usernameInput.value.trim().length > 0;
    const hasRepo = repoInput.value.trim().length > 0;
    const isConfigured = hasToken && hasUsername && hasRepo;

    if (isConfigured) {
      configStatus.innerHTML = '<span class="config-status saved">Configuration saved</span>';
    } else {
      configStatus.innerHTML = '<span class="config-status unsaved">Incomplete configuration</span>';
    }
  }

  // Check on input changes
  [tokenInput, usernameInput, repoInput].forEach(input => {
    input.addEventListener('input', updateConfigStatus);
  });

  // Initial status check
  updateConfigStatus();

  // Save configuration button
  document.getElementById('saveConfig').addEventListener('click', async () => {
    const token = tokenInput.value.trim();
    const username = usernameInput.value.trim();
    const repo = repoInput.value.trim();

    if (!token || !username || !repo) {
      showStatus('Please fill in all fields', 'error');
      return;
    }

    const saveBtn = document.getElementById('saveConfig');
    const originalText = saveBtn.textContent;
    saveBtn.innerHTML = '<span class="spinner"></span>Saving...';
    saveBtn.disabled = true;

    try {
      await chrome.storage.sync.set({
        githubToken: token,
        githubUsername: username,
        githubRepo: repo
      });

      showStatus('Configuration saved successfully', 'success');
      updateConfigStatus();
    } catch (error) {
      showStatus(`Error: ${error.message}`, 'error');
    } finally {
      saveBtn.textContent = originalText;
      saveBtn.disabled = false;
    }
  });

  // Extract and push button
  document.getElementById('extractAndPush').addEventListener('click', async () => {
    const button = document.getElementById('extractAndPush');
    const originalText = button.textContent;
    button.disabled = true;
    button.innerHTML = '<span class="spinner"></span>Processing...';

    try {
      // Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      // Check if we're on a supported platform
      const supportedPlatforms = ['leetcode.com', 'geeksforgeeks.org', 'codeforces.com', 'hackerrank.com'];
      const isSupported = supportedPlatforms.some(platform => tab.url.includes(platform));

      if (!isSupported) {
        showStatus('Please navigate to a supported coding platform', 'error');
        button.disabled = false;
        button.textContent = originalText;
        return;
      }

      // Inject extractors script if needed
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['extractors.js']
      });

      // Extract data from page
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'extract' });

      if (!response.success || !response.data) {
        showStatus('Failed to extract problem data. Make sure you are on a problem page with code visible.', 'error');
        button.disabled = false;
        button.textContent = originalText;
        return;
      }

      const problemData = response.data;

      // Get GitHub configuration
      const config = await chrome.storage.sync.get(['githubToken', 'githubUsername', 'githubRepo']);
      
      if (!config.githubToken || !config.githubUsername || !config.githubRepo) {
        showStatus('Please configure GitHub settings first', 'error');
        button.disabled = false;
        button.textContent = originalText;
        return;
      }

      showStatus('Pushing to GitHub...', 'info');

      // Push to GitHub
      const pushResponse = await chrome.runtime.sendMessage({
        action: 'pushToGitHub',
        data: {
          problemData: problemData,
          githubConfig: config
        }
      });

      if (pushResponse.success) {
        const result = pushResponse.result;
        showStatus(
          `Successfully pushed to GitHub<br><br><strong>File:</strong> ${result.filePath}<br><br><a href="${result.url}" target="_blank">View on GitHub</a>`,
          'success'
        );
      } else {
        showStatus(`Error: ${pushResponse.error}`, 'error');
      }
    } catch (error) {
      showStatus(`Error: ${error.message}`, 'error');
    } finally {
      button.disabled = false;
      button.textContent = originalText;
    }
  });

  // Show current platform info
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    const tab = tabs[0];
    const platformInfo = document.getElementById('platformInfo');
    
    let platformName = null;

    if (tab.url.includes('leetcode.com')) {
      platformName = 'LeetCode';
    } else if (tab.url.includes('geeksforgeeks.org')) {
      platformName = 'GeeksforGeeks';
    } else if (tab.url.includes('codeforces.com')) {
      platformName = 'Codeforces';
    } else if (tab.url.includes('hackerrank.com')) {
      platformName = 'HackerRank';
    }

    if (platformName) {
      platformInfo.innerHTML = `Platform: <strong>${platformName}</strong>`;
    } else {
      platformInfo.innerHTML = 'Navigate to a supported coding platform';
    }
  });
});

function showStatus(message, type) {
  const statusDiv = document.getElementById('status');
  statusDiv.className = `status ${type}`;
  statusDiv.innerHTML = message;
  
  // Auto-hide success messages after 5 seconds
  if (type === 'success') {
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 5000);
  }
}
