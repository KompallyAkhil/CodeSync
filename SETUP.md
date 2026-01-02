# Quick Setup Guide

## Prerequisites

1. **Chrome or Edge Browser** (Chromium-based)
2. **GitHub Account**
3. **GitHub Personal Access Token** (see below)

## Step-by-Step Setup

### 1. Get GitHub Personal Access Token

1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Name it: "Coding Extension"
4. Select scope: **`repo`** (Full control of private repositories)
5. Click "Generate token"
6. **Copy the token immediately** (starts with `ghp_`)

### 2. Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `coding-solutions` (or any name you prefer)
3. Choose Public or Private
4. **Do NOT** initialize with README (or do, it doesn't matter)
5. Click "Create repository"

### 3. Add Extension Icons (Optional but Recommended)

The extension needs icon files. You have two options:

**Option A: Quick Icons**
- Create or download three PNG images:
  - `icons/icon16.png` (16x16 pixels)
  - `icons/icon48.png` (48x48 pixels)
  - `icons/icon128.png` (128x128 pixels)
- Use any simple icon (code symbol, GitHub logo, etc.)

**Option B: Use Online Generator**
- Visit https://www.favicon-generator.org/
- Upload an image or create one
- Download and extract the PNG files
- Place them in the `icons/` folder

**Note:** The extension will work without icons, but Chrome may show a default icon.

### 4. Load Extension in Browser

1. Open Chrome/Edge
2. Go to `chrome://extensions/` (or `edge://extensions/`)
3. Enable **Developer mode** (toggle in top-right)
4. Click **Load unpacked**
5. Select the `MultiExtension` folder
6. Extension should appear in your extensions list

### 5. Configure Extension

1. Click the extension icon in your browser toolbar
2. Fill in:
   - **GitHub Token**: Paste your token from Step 1
   - **GitHub Username**: Your GitHub username
   - **Repository Name**: The repo name from Step 2 (e.g., `coding-solutions`)
3. Click **Save Configuration**

### 6. Test the Extension

1. Go to https://leetcode.com/problems/two-sum/ (or any LeetCode problem)
2. Write some code in the editor (or just view existing code)
3. Click the extension icon
4. Click **Extract & Push to GitHub**
5. Check your GitHub repository - you should see a new file!

## Troubleshooting

### Extension icon is grayed out
- Make sure you're on a supported platform (LeetCode, GeeksforGeeks, etc.)
- Refresh the page

### "Failed to extract problem data"
- Make sure you're on a problem page (not homepage)
- Try refreshing the page
- Some platforms may need updated selectors

### "GitHub configuration incomplete"
- Make sure you clicked "Save Configuration"
- Check that all three fields are filled

### "Failed to push to GitHub"
- Verify your token is valid (not expired)
- Check repository name is correct
- Ensure repository exists and you have write access
- Verify token has `repo` scope

### Branch name error
- If your default branch is not `main`, edit `background.js`
- Find `branch: 'main'` and change to your branch name (e.g., `'master'`)

## Supported Platforms

✅ **LeetCode** - https://leetcode.com
✅ **GeeksforGeeks** - https://www.geeksforgeeks.org
✅ **Codeforces** - https://codeforces.com
✅ **HackerRank** - https://www.hackerrank.com

## File Structure in GitHub

Your solutions will be organized like this:

```
coding-solutions/
├── leetcode/
│   ├── 1_two_sum.py
│   ├── 2_add_two_numbers.java
│   └── ...
├── geeksforgeeks/
│   ├── array_rotation.cpp
│   └── ...
├── codeforces/
│   └── ...
└── hackerrank/
    └── ...
```

## Security Notes

- Your GitHub token is stored locally in your browser
- Only you can access it
- You can revoke the token anytime from GitHub settings
- The extension only communicates with GitHub API

## Need Help?

1. Check the browser console (F12) for errors
2. Check the extension's service worker console (chrome://extensions/ > Details > Service worker)
3. Verify all files are in the correct locations
4. Make sure manifest.json is valid JSON

