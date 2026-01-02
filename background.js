// Background service worker for GitHub API interactions

chrome.runtime.onInstalled.addListener(() => {
  console.log('Coding Platform to GitHub extension installed');
});

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'pushToGitHub') {
    pushToGitHub(request.data)
      .then(result => sendResponse({ success: true, result: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  }
});

async function pushToGitHub(data) {
  const { problemData, githubConfig } = data;
  
  // Get stored GitHub token
  const storedConfig = await chrome.storage.sync.get(['githubToken', 'githubUsername', 'githubRepo']);
  const token = githubConfig.token || storedConfig.githubToken;
  const username = githubConfig.username || storedConfig.githubUsername;
  const repo = githubConfig.repo || storedConfig.githubRepo;

  if (!token || !username || !repo) {
    throw new Error('GitHub configuration incomplete. Please set token, username, and repository in the extension popup.');
  }

  // Determine file extension based on language
  const extensionMap = {
    'python': 'py',
    'python3': 'py',
    'javascript': 'js',
    'typescript': 'ts',
    'java': 'java',
    'cpp': 'cpp',
    'c++': 'cpp',
    'c': 'c',
    'csharp': 'cs',
    'c#': 'cs',
    'go': 'go',
    'golang': 'go',
    'rust': 'rs',
    'ruby': 'rb',
    'swift': 'swift',
    'kotlin': 'kt',
    'scala': 'scala',
    'php': 'php',
    'sql': 'sql',
    'mysql': 'sql',
    'bash': 'sh',
    'shell': 'sh',
    'sh': 'sh',
    'unknown': 'txt'
  };

  // Normalize language name (should already be normalized from extractor, but double-check)
  const lang = problemData.language.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
  const fileExt = extensionMap[lang] || extensionMap[problemData.language.toLowerCase()] || 'txt';

  // Create filename with proper formatting
  const sanitizeFilename = (str, problemNumber) => {
    if (!str) return 'Problem';
    
    let cleanTitle = str.trim();
    
    // Remove problem number from title if it's already there
    // Handle patterns like "66. Plus One", "66 Plus One", "66. Plus One", etc.
    if (problemNumber) {
      // Pattern 1: Remove "66. " or "66 " at the start
      cleanTitle = cleanTitle.replace(new RegExp(`^\\s*${problemNumber}\\s*\\.?\\s+`, 'i'), '');
      // Pattern 2: Remove "66." at the start
      cleanTitle = cleanTitle.replace(new RegExp(`^\\s*${problemNumber}\\.\\s*`, 'i'), '');
      // Pattern 3: Remove "66" followed by any non-letter characters at the start
      cleanTitle = cleanTitle.replace(new RegExp(`^\\s*${problemNumber}[^a-zA-Z]+`, 'i'), '');
    }
    
    // Also remove any leading numbers that might be duplicates
    cleanTitle = cleanTitle.replace(/^\d+\.?\s*/g, '');
    
    // Remove any leading/trailing whitespace
    cleanTitle = cleanTitle.trim();
    
    // If title is empty after cleaning, use a default
    if (!cleanTitle || cleanTitle.length === 0) {
      cleanTitle = 'Problem';
    }
    
    // Convert to Title Case (capitalize first letter of each word)
    const toTitleCase = (text) => {
      if (!text) return '';
      // Handle words separated by spaces, hyphens, or underscores
      return text.replace(/\b\w/g, (char) => char.toUpperCase())
                 .replace(/\b\w+/g, (word) => {
                   return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
                 });
    };
    
    cleanTitle = toTitleCase(cleanTitle);
    
    // Replace spaces, hyphens, and special characters with single underscore
    cleanTitle = cleanTitle.replace(/[\s\-_]+/g, '_');
    // Replace any remaining special characters
    cleanTitle = cleanTitle.replace(/[^a-zA-Z0-9_]/g, '');
    
    // Remove leading/trailing underscores and collapse multiple underscores
    cleanTitle = cleanTitle.replace(/^_+|_+$/g, '').replace(/_+/g, '_');
    
    return cleanTitle;
  };

  const problemNumber = problemData.problemNumber || '';
  const sanitizedTitle = sanitizeFilename(problemData.title, problemNumber);
  
  const filename = problemNumber && sanitizedTitle && sanitizedTitle !== 'Problem'
    ? `${problemNumber}_${sanitizedTitle}.${fileExt}`
    : sanitizedTitle && sanitizedTitle !== 'Problem'
    ? `${sanitizedTitle}.${fileExt}`
    : problemNumber
    ? `${problemNumber}_Problem.${fileExt}`
    : `Problem.${fileExt}`;
  const filePath = `${problemData.platform}/${filename}`;

  // Create file content with problem description as comment
  const commentStyle = {
    'js': '//',
    'ts': '//',
    'py': '#',
    'java': '//',
    'cpp': '//',
    'c': '//',
    'cs': '//',
    'go': '//',
    'rs': '//',
    'rb': '#',
    'swift': '//',
    'kt': '//',
    'scala': '//',
    'php': '//',
    'sql': '--',
    'sh': '#',
    'txt': '//'
  };

  const commentChar = commentStyle[fileExt] || '//';
  
  // Format problem description at the top
  let problemComment = '';
  
  if (problemData.description && problemData.description.trim().length > 0) {
    // Clean up description - remove excessive whitespace
    const cleanDescription = problemData.description
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n');
    
    // Format with proper comment style
    problemComment = `${commentChar} Problem: ${problemData.title}\n`;
    problemComment += `${commentChar} ${cleanDescription.split('\n').join(`\n${commentChar} `)}\n`;
    problemComment += `${commentChar} URL: ${problemData.url}\n\n`;
  } else {
    problemComment = `${commentChar} Problem: ${problemData.title}\n`;
    problemComment += `${commentChar} URL: ${problemData.url}\n\n`;
  }

  // Combine: problem description at top, then solution code
  const fileContent = problemComment + problemData.code;

  // Check if file exists and get its SHA
  let fileSha = null;
  try {
    const existingFile = await fetch(
      `https://api.github.com/repos/${username}/${repo}/contents/${filePath}`,
      {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );

    if (existingFile.ok) {
      const fileData = await existingFile.json();
      fileSha = fileData.sha;
    }
  } catch (error) {
    // File doesn't exist, which is fine
  }

  // Create or update file
  const apiUrl = `https://api.github.com/repos/${username}/${repo}/contents/${filePath}`;
  const payload = {
    message: `Add solution: ${problemData.title}`,
    content: btoa(unescape(encodeURIComponent(fileContent))),
    branch: 'main'
  };

  if (fileSha) {
    payload.sha = fileSha;
  }

  const response = await fetch(apiUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to push to GitHub');
  }

  const result = await response.json();
  return {
    message: 'Successfully pushed to GitHub!',
    url: result.content.html_url,
    filePath: filePath
  };
}

