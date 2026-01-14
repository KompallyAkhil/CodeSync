# CodeSync Extension

CodeSync is a Chrome extension that helps you sync your coding solutions from various competitive programming platforms directly to your GitHub repository.

## Supported Platforms

- [x] LeetCode
- [x] GeeksforGeeks
- [x] Codeforces
- [x] HackerRank

## Features

- **Auto-Detection**: Automatically detects the coding platform you are using.
- **One-Click Sync**: Extract your solution and problem details with a single click.
- **GitHub Integration**: Pushes code directly to your configured GitHub repository.
- **Status Updates**: Real-time feedback on extraction and upload status.

## Installation

### From Source

1. Clone the repository:
   ```bash
   git clone https://github.com/KompallyAkhik/CodeSync.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the extension:
   ```bash
   npm run build
   ```
4. Load into Chrome:
   - Open Chrome and go to `chrome://extensions`.
   - Enable "Developer mode" (top right).
   - Click "Load unpacked".
   - Select the `dist` folder from the project directory.

## Configuration

1. Click the extension icon in the toolbar.
2. Go to the **Settings** page (gear icon if not automatically prompted).
3. Enter your **GitHub Personal Access Token** (Generate one [here](https://github.com/settings/tokens) with `repo` scope).
4. Enter your **GitHub Username**.
5. Enter the **Repository Name** where you want to save solutions (must exist).
6. Click **Save Configuration**.

## Development

- `npm run dev` - Start dev server (not typical for extensions, but available).
- `npm run build` - Build for production.

## Tech Stack

- React
- Vite
- Chrome Extension Manifest V3
