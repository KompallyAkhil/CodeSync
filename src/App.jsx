import { useState, useEffect } from 'react';
import './App.css';

function App() {
    const [view, setView] = useState('home');
    const [config, setConfig] = useState({
        githubToken: '',
        githubUsername: '',
        githubRepo: ''
    });
    const [platform, setPlatform] = useState({
        name: 'Detecting...',
        isValid: false
    });
    const [status, setStatus] = useState({
        message: '',
        type: '',
        loading: false
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isError, setIsError] = useState("");
    useEffect(() => {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
            loadConfig();
        }
        detectPlatform();
    }, []);

    const loadConfig = async () => {
        try {
            const stored = await chrome.storage.sync.get([
                "githubToken",
                "githubUsername",
                "githubRepo",
            ]);

            const newConfig = {
                githubToken: stored.githubToken || '',
                githubUsername: stored.githubUsername || '',
                githubRepo: stored.githubRepo || ''
            };

            setConfig(newConfig);

            // If not configured, show settings immediately
            if (!newConfig.githubToken || !newConfig.githubUsername || !newConfig.githubRepo) {
                setView('settings');
            }
        } catch (error) {
            console.error("Error loading config:", error);
        }
    };

    const saveConfig = async () => {
        if (!config.githubToken || !config.githubUsername || !config.githubRepo) {
            setIsError("Please fill in all fields");
            return;
        }

        setIsSaving(true);
        try {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
                await chrome.storage.sync.set(config);
            } else {
                // Mock save for dev
                console.log("Mock save config:", config);
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            setView('home');
            showStatus("Configuration saved ready to sync!", "success");
        } catch (error) {
            setIsError("Failed to save settings: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const detectPlatform = async () => {
        try {
            if (typeof chrome === 'undefined' || !chrome.tabs) {
                setPlatform({
                    name: 'Dev Mode',
                    isValid: true
                });
                return;
            }

            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            if (!tab?.url) return;

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
                setPlatform({
                    name: platforms[detected],
                    isValid: true
                });
            } else {
                setPlatform({
                    name: 'Unsupported Platform',
                    isValid: false
                });
                showStatus(
                    "Please navigate to a supported coding platform (LeetCode, GFG, etc.)",
                    "error"
                );
            }
        } catch (error) {
            console.error("Platform detection failed:", error);
        }
    };

    const handleExtract = async () => {
        setStatus({ message: "Extracting and saving...", type: "loading", loading: true });

        try {
            if (typeof chrome === 'undefined' || !chrome.tabs) {
                throw new Error("Cannot extract in dev mode");
            }

            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

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
            // Double check config
            if (!config.githubToken) {
                setView('settings');
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
                    `Success! <a href="${pushResponse.result.url}" target="_blank" class="status-link">View on GitHub</a>`,
                    "success"
                );
            } else {
                throw new Error(pushResponse.error || "Unknown error during push");
            }
        } catch (error) {
            showStatus(error.message, "error");
        }
    };

    const showStatus = (message, type) => {
        setStatus({ message, type, loading: type === 'loading' });
    };

    return (
        <div className="app">
            <header className="header">
                <div className="brand">
                    <div className="brand-icon">
                        <img src="/icons/icon48.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    <span>CodeSync</span>
                </div>
                {view === 'home' && (
                    <button
                        className="settings-btn"
                        onClick={() => setView('settings')}
                        title="Settings"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    </button>
                )}
            </header>

            <main className="main">
                {view === 'home' ? (
                    <div className="view active">
                        <div className="hero-section">
                            <div className={`platform-status ${platform.isValid ? 'active' : ''}`}>
                                <span>{platform.isValid ? '🔍' : '⚠️'}</span>
                                <span>{platform.name}</span>
                            </div>

                            <button
                                className="action-btn"
                                onClick={handleExtract}
                                disabled={!platform.isValid || status.loading}
                            >
                                <span>{status.loading ? 'Extracting...' : 'Extract & Save Solution'}</span>
                                {!status.loading && (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                        <polyline points="7 10 12 15 17 10"></polyline>
                                        <line x1="12" y1="15" x2="12" y2="3"></line>
                                    </svg>
                                )}
                            </button>
                        </div>

                        {(status.message) && (
                            <div className={`status-card ${status.type}`}>
                                {status.loading && (
                                    <div className="spinner" style={{ borderLeftColor: 'var(--text)', width: '14px', height: '14px', display: 'inline-block', marginRight: '10px', verticalAlign: 'middle' }}></div>
                                )}
                                <span dangerouslySetInnerHTML={{ __html: status.message }} />
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="view active">
                        <div className="settings-header">
                            <button className="back-btn" onClick={() => setView('home')}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="19" y1="12" x2="5" y2="12"></line>
                                    <polyline points="12 19 5 12 12 5"></polyline>
                                </svg>
                            </button>
                            <h3>Configuration</h3>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Personal Access Token</label>
                            <input
                                type="password"
                                className="form-input"
                                placeholder="ghp_xxxxxxxxxxxx"
                                value={config.githubToken}
                                onChange={(e) => setConfig({ ...config, githubToken: e.target.value })}
                            />
                            <div className="form-hint">
                                Generate token at{' '}
                                <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer">
                                    github.com/settings/tokens
                                </a>
                                {' '}(Select 'repo' scope)
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">GitHub Username</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="e.g. johndoe"
                                value={config.githubUsername}
                                onChange={(e) => setConfig({ ...config, githubUsername: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Repository Name</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="e.g. leetcode-solutions"
                                value={config.githubRepo}
                                onChange={(e) => setConfig({ ...config, githubRepo: e.target.value })}
                            />
                        </div>
                        <button
                            className="save-btn"
                            onClick={saveConfig}
                            disabled={isSaving}
                            >
                            {isSaving ? (
                                <>
                                    <div className="spinner" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px', width: '14px', height: '14px' }}></div>
                                    Saving...
                                </>
                            ) : 'Save Configuration'}
                        </button>
                        {isError && <div className="error">{isError}</div>}
                    </div>
                )}
            </main>
        </div>
    );
}

export default App;
