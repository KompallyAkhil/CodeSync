// Background service worker for GitHub API interactions

chrome.runtime.onInstalled.addListener(() => {
  console.log("Coding Platform to GitHub extension installed");
});

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "pushToGitHub") {
    pushToGitHub(request.data)
      .then((result) => sendResponse({ success: true, result: result }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  }
});

async function pushToGitHub(data) {
  const { problemData, githubConfig } = data;

  // Get stored GitHub token
  const storedConfig = await chrome.storage.sync.get([
    "githubToken",
    "githubUsername",
    "githubRepo",
  ]);
  const token = githubConfig.token || storedConfig.githubToken;
  const username = githubConfig.username || storedConfig.githubUsername;
  const repo = githubConfig.repo || storedConfig.githubRepo;

  if (!token || !username || !repo) {
    throw new Error(
      "GitHub configuration incomplete. Please set token, username, and repository in the extension popup."
    );
  }

  // Determine file extension based on language
  const extensionMap = {
    python: "py",
    python3: "py",
    javascript: "js",
    typescript: "ts",
    java: "java",
    cpp: "cpp",
    "c++": "cpp",
    c: "c",
    csharp: "cs",
    "c#": "cs",
    go: "go",
    golang: "go",
    rust: "rs",
    ruby: "rb",
    swift: "swift",
    kotlin: "kt",
    scala: "scala",
    php: "php",
    sql: "sql",
    mysql: "sql",
    bash: "sh",
    shell: "sh",
    sh: "sh",
    pandas: "py",
    react: "jsx",
    unknown: "txt",
  };

  // Normalize language name
  const lang = problemData.language
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9]/g, "");
  const fileExt =
    extensionMap[lang] ||
    extensionMap[problemData.language.toLowerCase()] ||
    "txt";

  // Create filename with proper formatting: Number_QuestionName.ext
  const sanitizeFilename = (str, problemNumber) => {
    if (!str) return "Problem";

    let cleanTitle = str.trim();

    // Remove problem number from title if it's already there
    if (problemNumber) {
      cleanTitle = cleanTitle.replace(
        new RegExp(`^\\s*${problemNumber}\\s*\\.?\\s+`, "i"),
        ""
      );
      cleanTitle = cleanTitle.replace(
        new RegExp(`^\\s*${problemNumber}\\.\\s*`, "i"),
        ""
      );
      cleanTitle = cleanTitle.replace(
        new RegExp(`^\\s*${problemNumber}[^a-zA-Z]+`, "i"),
        ""
      );
    }

    // Remove leading numbers - REMOVED to preserve titles like "2 Sum", "3Sum"
    // cleanTitle = cleanTitle.replace(/^\d+\.?\s*/g, "");
    cleanTitle = cleanTitle.trim();

    if (!cleanTitle || cleanTitle.length === 0) {
      cleanTitle = "Problem";
    }

    // Convert to SnakeCase (Replace spaces with underscores)
    // "Two Sum" -> "Two_Sum"
    const toSnakeCase = (text) => {
      return text
        .replace(/[^a-zA-Z0-9\s-]/g, "") // Remove special chars but keep spaces and hyphens
        .trim()
        .replace(/\s+/g, "_"); // Replace spaces with underscores
    };

    cleanTitle = toSnakeCase(cleanTitle);

    // Fallback if title becomes empty after sanitization
    if (!cleanTitle) cleanTitle = "Problem";

    return cleanTitle;
  };

  const problemNumber = problemData.problemNumber || "";
  const sanitizedTitle = sanitizeFilename(problemData.title, problemNumber);

  // Format: number_followedbyquestionname.extension (e.g., 1_TwoSum.py)
  const filename = problemNumber
    ? `${problemNumber}_${sanitizedTitle}.${fileExt}`
    : `${sanitizedTitle}.${fileExt}`;

  // Use a platform-specific directory, or just root?
  // Codebase previously used `${problemData.platform}/${filename}`.
  // I will keep the platform folder to be organized.
  const filePath = `${problemData.platform}/${filename}`;

  // Comment styles
  const commentStyle = {
    js: "//",
    ts: "//",
    java: "//",
    cpp: "//",
    c: "//",
    cs: "//",
    go: "//",
    rs: "//",
    swift: "//",
    kt: "//",
    scala: "//",
    php: "//",
    py: "#",
    rb: "#",
    sh: "#",
    sql: "--",
    txt: "//",
  };

  const commentChar = commentStyle[fileExt] || "//";

  // Create file content: URL, Question, Solution
  let fileContent = "";

  // 1. URL
  fileContent += `${commentChar} URL: ${problemData.url}\n`;
  fileContent += `${commentChar}\n`;

  // 2. Question (Title + Description)
  fileContent += `${commentChar} Problem: ${problemData.title}\n`;
  fileContent += `${commentChar}\n`;
  if (problemData.description && problemData.description.trim().length > 0) {
    const cleanDescription = problemData.description
      .split("\n")
      .map((line) => line.trimEnd())
      .filter((line) => line.length > 0)
      .join("\n");

    fileContent += `${commentChar} ${cleanDescription
      .split("\n")
      .join(`\n${commentChar} `)}\n`;
  }
  fileContent += `\n`;

  // 3. Solution
  fileContent += `${commentChar} Solution:\n`;
  fileContent += problemData.code;

  // Check if file exists to get SHA
  let fileSha = null;
  try {
    const existingFile = await fetch(
      `https://api.github.com/repos/${username}/${repo}/contents/${filePath}`,
      {
        headers: {
          Authorization: `token ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (existingFile.ok) {
      const fileData = await existingFile.json();
      fileSha = fileData.sha;
    }
  } catch (error) {
    // File doesn't exist
  }

  // Push to GitHub
  const apiUrl = `https://api.github.com/repos/${username}/${repo}/contents/${filePath}`;
  const payload = {
    message: `Add solution: ${problemData.title}`,
    content: btoa(unescape(encodeURIComponent(fileContent))),
    branch: "main",
  };

  if (fileSha) {
    payload.sha = fileSha;
  }

  const response = await fetch(apiUrl, {
    method: "PUT",
    headers: {
      Authorization: `token ${token}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to push to GitHub");
  }

  const result = await response.json();
  return {
    message: "Successfully pushed to GitHub!",
    url: result.content.html_url,
    filePath: filePath,
  };
}
