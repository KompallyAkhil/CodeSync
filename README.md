# Coding Platform to GitHub Extension

A Chrome/Edge web extension that automatically extracts coding problems and solutions from popular coding platforms (LeetCode, GeeksforGeeks, Codeforces, HackerRank) and pushes them to your GitHub repository.

## Features

- 🔍 **Automatic Extraction**: Extracts problem title, description, and solution code from coding platforms
- 🚀 **GitHub Integration**: Automatically pushes solutions to your GitHub repository
- 📁 **Organized Structure**: Organizes files by platform and problem name
- 🎯 **Multi-Platform Support**: Works with LeetCode, GeeksforGeeks, Codeforces, and HackerRank
- 💬 **Smart Comments**: Adds problem description as comments in your code files
- 🔄 **Update Support**: Updates existing files if they already exist in the repository

## Supported Platforms

- ✅ LeetCode
- ✅ GeeksforGeeks
- ✅ Codeforces
- ✅ HackerRank

## Installation

### Step 1: Clone or Download

Download this repository to your local machine.

### Step 2: Create GitHub Personal Access Token

1. Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Give it a name (e.g., "Coding Extension")
4. Select the `repo` scope (full control of private repositories)
5. Click "Generate token"
6. **Copy the token** (you won't see it again!)

### Step 3: Create a GitHub Repository

1. Create a new repository on GitHub (e.g., `coding-solutions`)
2. Note the repository name

### Step 4: Load Extension in Chrome/Edge

1. Open Chrome or Edge browser
2. Navigate to `chrome://extensions/` (or `edge://extensions/`)
3. Enable **Developer mode** (toggle in top right)
4. Click **Load unpacked**
5. Select the folder containing this extension
6. The extension should now appear in your extensions list

### Step 5: Configure Extension

1. Click the extension icon in your browser toolbar
2. Enter your GitHub Personal Access Token
3. Enter your GitHub username
4. Enter your repository name
5. Click **Save Configuration**

## Usage

1. Navigate to a problem page on any supported coding platform
2. Write or view your solution code
3. Click the extension icon in your browser toolbar
4. Click **Extract & Push to GitHub**
5. The extension will:
   - Extract the problem title, description, and your solution code
   - Create a properly formatted file with comments
   - Push it to your GitHub repository

## File Structure

Files are organized in your repository as:
```
repository/
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

## File Naming

Files are named using the pattern:
- `{problem_number}_{problem_title}.{extension}` (for platforms with problem numbers)
- `{problem_title}.{extension}` (for other platforms)

Special characters are replaced with underscores, and the title is converted to lowercase.

## Supported Languages

The extension automatically detects and uses the correct file extension for:
- JavaScript/TypeScript (.js, .ts)
- Python (.py)
- Java (.java)
- C/C++ (.c, .cpp)
- C# (.cs)
- Go (.go)
- Rust (.rs)
- Ruby (.rb)
- Swift (.swift)
- Kotlin (.kt)
- Scala (.scala)
- PHP (.php)
- And more...

## Troubleshooting

### "Failed to extract problem data"
- Make sure you're on a problem page (not the homepage)
- Try refreshing the page
- Some platforms may have different page structures - the extension will be updated to support them

### "GitHub configuration incomplete"
- Make sure you've saved your GitHub token, username, and repository name
- Verify your token has the `repo` scope

### "Failed to push to GitHub"
- Check that your token is valid and has not expired
- Verify the repository name is correct
- Ensure the repository exists and you have write access
- Check that the default branch is `main` (or update the code to use your branch name)

### Extension not working on a platform
- The extension uses CSS selectors that may change if platforms update their UI
- Check the browser console for errors
- You may need to update the selectors in `extractors.js`

## Privacy & Security

- Your GitHub token is stored locally in your browser using Chrome's sync storage
- The extension only communicates with GitHub's API
- No data is sent to any third-party servers
- You can revoke your GitHub token at any time from GitHub settings

## Development

### Project Structure

```
MultiExtension/
├── manifest.json          # Extension manifest
├── background.js          # Service worker for GitHub API
├── content.js            # Content script injected into pages
├── extractors.js         # Platform-specific extraction logic
├── popup.html            # Extension popup UI
├── popup.js              # Popup script
├── icons/                # Extension icons
└── README.md             # This file
```

### Adding Support for New Platforms

To add support for a new coding platform:

1. Add the platform's domain to `manifest.json` in `host_permissions` and `content_scripts.matches`
2. Add a new extraction method in `extractors.js` following the pattern of existing methods
3. Add the platform detection in `PlatformExtractor.detectPlatform()`
4. Update the `extract()` method to call your new extractor

## License

MIT License - feel free to use and modify as needed!

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Notes

- The extension requires the repository to exist before pushing
- Files are pushed to the `main` branch by default
- If a file already exists, it will be updated (not duplicated)
- The extension adds problem descriptions as comments in the code files

