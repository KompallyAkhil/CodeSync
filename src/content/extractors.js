// Platform-specific extractors for different coding platforms

class PlatformExtractor {
  static detectPlatform() {
    const hostname = window.location.hostname;

    if (hostname.includes("leetcode.com")) {
      return "leetcode";
    } else if (hostname.includes("geeksforgeeks.org")) {
      return "geeksforgeeks";
    } else if (hostname.includes("codeforces.com")) {
      return "codeforces";
    } else if (hostname.includes("hackerrank.com")) {
      return "hackerrank";
    }
    return "unknown";
  }

  static extract() {
    const platform = this.detectPlatform();

    switch (platform) {
      case "leetcode":
        return this.extractLeetCode();
      case "geeksforgeeks":
        return this.extractGeeksforGeeks();
      case "codeforces":
        return this.extractCodeforces();
      case "hackerrank":
        return this.extractHackerRank();
      default:
        return null;
    }
  }

  static extractLeetCode() {
    try {
      // Extract problem title
      const titleElement =
        document.querySelector('[data-cy="question-title"]') ||
        document.querySelector('div[class*="title"]') ||
        document.querySelector("h3");
      const title = titleElement
        ? titleElement.textContent.trim()
        : "Unknown Problem";

      // Extract problem number
      const problemNumber = title.match(/^(\d+)\./)?.[1] || "";

      // Extract problem description
      const descriptionElement =
        document.querySelector('[data-cy="description"]') ||
        document.querySelector(".question-content__JfgR") ||
        document.querySelector('[class*="description"]');
      const description = descriptionElement
        ? descriptionElement.innerText
        : "";

      // Extract language - try multiple methods
      let language = "unknown";

      // Method 1: Check language selector button/dropdown
      const langButton =
        document.querySelector('[data-cy="lang-select"]') ||
        document.querySelector('button[class*="language"]') ||
        document.querySelector('div[class*="lang-select"]') ||
        document.querySelector('select[class*="language"]');

      if (langButton) {
        language =
          langButton.textContent.trim() ||
          langButton.value ||
          langButton.getAttribute("data-lang") ||
          "unknown";
      }

      // Method 2: Check Monaco editor language attribute
      const monacoEditor = document.querySelector(".monaco-editor");
      if (monacoEditor && language === "unknown") {
        const editorModel =
          monacoEditor.getAttribute("data-mode-id") ||
          monacoEditor.getAttribute("data-lang");
        if (editorModel) {
          language = editorModel.split("/").pop() || editorModel;
        }
      }

      // Method 3: Check for language in editor container
      if (language === "unknown") {
        const editorContainer = document.querySelector('[class*="editor"]');
        if (editorContainer) {
          const langAttr =
            editorContainer.getAttribute("data-language") ||
            editorContainer.getAttribute("data-lang");
          if (langAttr) language = langAttr;
        }
      }

      // Method 4: Search for known language names in buttons (Robust fallback for UI changes)
      if (language === "unknown") {
        const knownLanguages = [
          "C++",
          "Java",
          "Python",
          "Python3",
          "C",
          "C#",
          "JavaScript",
          "TypeScript",
          "PHP",
          "Swift",
          "Kotlin",
          "Dart",
          "Go",
          "Ruby",
          "Scala",
          "Rust",
          "Racket",
          "Erlang",
          "Elixir",
          "Pandas",
          "React",
        ];

        // Find buttons or divs that might be the language selector
        // We look for elements with precise text matches to known languages
        const formattingBar = document.querySelectorAll(
          'div[class*="flex"], div[class*="toolbar"]'
        );

        for (const bar of formattingBar) {
          const elements = bar.querySelectorAll(
            'button, div[role="button"], span'
          );
          for (const el of elements) {
            const text = el.textContent.trim();
            // Check exact match or "Language: X" format
            if (knownLanguages.includes(text)) {
              language = text;
              break;
            }
          }
          if (language !== "unknown") break;
        }

        // Super fallback: Check all buttons on page if still unknown (risky but better than txt)
        if (language === "unknown") {
          const allButtons = document.querySelectorAll("button");
          for (const btn of allButtons) {
            if (knownLanguages.includes(btn.textContent.trim())) {
              language = btn.textContent.trim();
              break;
            }
          }
        }
      }

      // Normalize language name
      language = this.normalizeLanguage(language);

      // Extract code solution - prioritize Monaco editor
      let code = "";

      // Method 1: Try Monaco editor (LeetCode's main editor)
      const monacoEditorElement = document.querySelector(".monaco-editor");
      if (monacoEditorElement) {
        // PRIORITY: Try to access Monaco editor model directly via window
        // This gives us the full code content, not just visible lines
        if (!code && window.monaco) {
          try {
            const editors = window.monaco.editor.getEditors();
            if (editors && editors.length > 0) {
              const model = editors[0].getModel();
              if (model) {
                code = model.getValue();
              }
            }
          } catch (e) {
            // Monaco API not accessible, try next method
          }
        }

        // Method 1.5: Try to get code from Monaco editor view lines (Fallback)
        if (!code) {
          const viewLines = monacoEditorElement.querySelectorAll(".view-line");
          if (viewLines.length > 0) {
            code = Array.from(viewLines)
              .map((line) => {
                const lineText = line.textContent || "";
                // Remove trailing whitespace but preserve structure
                return lineText.replace(/\s+$/, "");
              })
              .join("\n");
          }
        }

        // Alternative: Try to find Monaco's hidden textarea
        if (!code) {
          const monacoTextarea = monacoEditorElement.querySelector("textarea");
          if (monacoTextarea && monacoTextarea.value) {
            code = monacoTextarea.value;
          }
        }
      }

      // Method 2: Try textarea (fallback)
      if (!code) {
        const textarea =
          document.querySelector('textarea[class*="input"]') ||
          document.querySelector('textarea[class*="code"]');
        if (textarea) {
          code = textarea.value || textarea.textContent || "";
        }
      }

      // Method 3: Try CodeMirror
      if (!code) {
        const codeMirror = document.querySelector(".CodeMirror-code");
        if (codeMirror) {
          code = codeMirror.innerText;
        }
      }

      // Method 4: Try pre/code elements
      if (!code) {
        const codeElement =
          document.querySelector("pre code") ||
          document.querySelector('pre[class*="code"]');
        if (codeElement) {
          code = codeElement.textContent || codeElement.innerText || "";
        }
      }

      return {
        platform: "leetcode",
        title: title,
        problemNumber: problemNumber,
        description: description,
        code: code.trim(),
        language: language,
        url: window.location.href,
      };
    } catch (error) {
      console.error("Error extracting LeetCode data:", error);
      return null;
    }
  }

  static extractGeeksforGeeks() {
    try {
      // Extract problem title
      const titleElement =
        document.querySelector(".gfg-article-title") ||
        document.querySelector('[class*="problems_header_content_title"]') ||
        document.querySelector('[class*="problem-title"]') ||
        document.querySelector("h3");
      const title = titleElement
        ? titleElement.textContent.trim()
        : "Unknown Problem";

      // Extract problem description
      const descriptionElement =
        document.querySelector(".problem-statement") ||
        document.querySelector('[class*="problems_description__"]') ||
        document.querySelector(".content") ||
        document.querySelector("article");
      const description = descriptionElement
        ? descriptionElement.innerText
        : "";

      // Extract language - Robust multi-method approach
      let language = "unknown";

      // Method 1: Check for new specific dropdown class (React/Next versions)
      const newDropdown = document.querySelector(
        '[class*="problems_language_dropdown__"]'
      );
      if (newDropdown) {
        // Use innerText to avoid hidden text (which textContent might include),
        // and take the first line to ensure we only get the selected value
        const text = newDropdown.innerText || "";
        language = text.split("\n")[0].trim();
      }

      // Method 2: Check for active language in older dropdowns/tabs
      if (language === "unknown") {
        const activeLang =
          document.querySelector(".active-language") ||
          document.querySelector(".language-active") ||
          document.querySelector(".gfg-dropdown-active");
        if (activeLang) {
          language = activeLang.textContent || activeLang.innerText;
        }
      }

      // Method 3: Check for specific GFG editor language selector (older versions)
      if (language === "unknown") {
        const formattingBar = document.querySelectorAll(
          ".editor-toolbar, .divider, .pull-right"
        );
        for (const bar of formattingBar) {
          const text = bar.textContent;
          const knownLangs = [
            "C++",
            "Java",
            "Python",
            "Python 3",
            "C",
            "C#",
            "JavaScript",
          ];
          for (const lang of knownLangs) {
            if (text.includes(lang)) {
              if (text.includes("Language") || text.includes("Lang")) {
                language = lang;
                break;
              }
            }
          }
          if (language !== "unknown") break;
        }
      }

      // Method 4: Fallback - look for known languages in all dropdowns (Robust like LeetCode)
      if (language === "unknown") {
        const editorArea =
          document.querySelector(".problem-editor") ||
          document.querySelector('[class*="problems_right_section__"]') ||
          document.body;
        const dropdowns = editorArea.querySelectorAll(
          ".dropdown-text, .ui.selection.dropdown, select, [role='listbox'], button"
        );

        const knownLanguages = [
          "C++",
          "Java",
          "Python",
          "Python3",
          "C",
          "C#",
          "JavaScript",
          "TypeScript",
          "PHP",
          "Swift",
          "Kotlin",
          "Dart",
          "Go",
          "Ruby",
          "Scala",
          "Rust",
        ];

        for (const dd of dropdowns) {
          const text = dd.textContent || dd.value;
          if (text && knownLanguages.includes(text.trim())) {
            language = text.trim();
            break;
          }
        }
      }

      language = this.normalizeLanguage(language);

      // Extract code solution - Prioritize Monaco like LeetCode
      let code = "";

      // Method 1: Try Monaco Editor (Newer GFG & LeetCode standard)
      const monacoEditorElement = document.querySelector(".monaco-editor");
      if (monacoEditorElement) {
        // PRIORITY: Try to access Monaco editor model directly via window
        if (!code && window.monaco) {
          try {
            const editors = window.monaco.editor.getEditors();
            if (editors && editors.length > 0) {
              const model = editors[0].getModel();
              if (model) {
                code = model.getValue();
              }
            }
          } catch (e) {
            // Monaco API not accessible or failed
          }
        }

        // Fallback: Try to get code from Monaco editor view lines
        if (!code) {
          const viewLines = monacoEditorElement.querySelectorAll(".view-line");
          if (viewLines.length > 0) {
            code = Array.from(viewLines)
              .map((line) => {
                const lineText = line.textContent || "";
                return lineText.replace(/\s+$/, "");
              })
              .join("\n");
          }
        }

        // Alternative: Try to find Monaco's hidden textarea
        if (!code) {
          const monacoTextarea = monacoEditorElement.querySelector("textarea");
          if (monacoTextarea && monacoTextarea.value) {
            code = monacoTextarea.value;
          }
        }
      }

      // Method 2: Ace Editor (Most common on older GFG Practice)
      if (!code) {
        const aceLines = document.querySelectorAll(".ace_line");
        if (aceLines.length > 0) {
          // Ace editor renders lines as individual divs
          code = Array.from(aceLines)
            .map((line) => line.textContent.replace(/\s+$/, ""))
            .join("\n");
        }
      }

      // Method 3: CodeMirror
      if (!code) {
        const codeMirrors = document.querySelectorAll(".CodeMirror-code");
        if (codeMirrors.length > 0) {
          const editorCM = codeMirrors[codeMirrors.length - 1]; // Usually the last one is the editor
          code = editorCM.innerText;
        }
      }

      // Method 4: Fallback to textarea (Simple editors)
      if (!code) {
        const textareas = document.querySelectorAll("textarea");
        for (const ta of textareas) {
          // Filter out small textareas (likely comments)
          if (ta.value.length > 20 && !ta.className.includes("comment")) {
            code = ta.value;
            break;
          }
        }
      }

      // Method 5: Pre/Code elements (Static views)
      if (!code) {
        const codeElement =
          document.querySelector("pre code") || document.querySelector("pre");
        if (codeElement) {
          code = codeElement.textContent || codeElement.innerText || "";
        }
      }

      return {
        platform: "geeksforgeeks",
        title: title,
        problemNumber: "", // GFG usually doesn't have a standardized number in the title
        description: description,
        code: code.trim(),
        language: language,
        url: window.location.href,
      };
    } catch (error) {
      console.error("Error extracting GeeksforGeeks data:", error);
      return null;
    }
  }

  static extractCodeforces() {
    try {
      // Extract problem title
      const titleElement =
        document.querySelector(".title") ||
        document.querySelector("h2") ||
        document.querySelector('[class*="problem-title"]');
      const title = titleElement
        ? titleElement.textContent.trim()
        : "Unknown Problem";

      // Extract problem description
      const descriptionElement =
        document.querySelector(".problem-statement") ||
        document.querySelector(".ttypography");
      const description = descriptionElement
        ? descriptionElement.innerText
        : "";

      // Extract language
      let language = "unknown";

      // Codeforces uses language selectors in submission/editor pages
      const langSelector =
        document.querySelector('select[name="programTypeId"]') ||
        document.querySelector('[name="language"]') ||
        document.querySelector('[class*="language"]') ||
        document.querySelector("option[selected]");

      if (langSelector) {
        if (langSelector.tagName === "SELECT") {
          language =
            langSelector.options[langSelector.selectedIndex]?.text ||
            langSelector.value ||
            "unknown";
        } else {
          language =
            langSelector.textContent.trim() ||
            langSelector.value ||
            langSelector.getAttribute("data-lang") ||
            "unknown";
        }
      }

      language = this.normalizeLanguage(language);

      // Extract code solution
      let code = "";

      // Try program source
      const programSource = document.querySelector("pre.program-source");
      if (programSource) {
        code = programSource.textContent || programSource.innerText || "";
      }

      // Try textarea (editor)
      if (!code) {
        const textarea =
          document.querySelector("textarea#sourceCodeTextarea") ||
          document.querySelector('textarea[name="source"]') ||
          document.querySelector("textarea");
        if (textarea) {
          code = textarea.value || textarea.textContent || "";
        }
      }

      // Try pre/code elements
      if (!code) {
        const codeElement =
          document.querySelector("pre code") ||
          document.querySelector("pre") ||
          document.querySelector("code");
        if (codeElement) {
          code = codeElement.textContent || codeElement.innerText || "";
        }
      }

      return {
        platform: "codeforces",
        title: title,
        problemNumber: "",
        description: description,
        code: code.trim(),
        language: language,
        url: window.location.href,
      };
    } catch (error) {
      console.error("Error extracting Codeforces data:", error);
      return null;
    }
  }

  static extractHackerRank() {
    try {
      // Extract problem title
      const titleElement =
        document.querySelector(".challenge-title") ||
        document.querySelector("h1") ||
        document.querySelector('[class*="title"]') ||
        document.querySelector(".ui-icon-label");
      const title = titleElement
        ? titleElement.textContent.trim()
        : "Unknown Problem";

      // Extract problem description - try multiple selectors
      let description = "";
      const descriptionSelectors = [
        ".challenge-body",
        ".challenge-text",
        ".challenge-description",
        '[class*="description"]',
        ".problem-statement",
        ".challenge-problem-statement",
        ".problem-description",
      ];

      for (const selector of descriptionSelectors) {
        const descElement = document.querySelector(selector);
        if (descElement) {
          description = descElement.innerText || descElement.textContent || "";
          if (description.trim().length > 50) break; // Use first substantial description
        }
      }

      // Extract language - Robust multi-method approach
      let language = "unknown";

      // Method 1: Check language dropdown/select (HackerRank specific)
      const langSelect =
        document.querySelector('select[data-attr1="language"]') ||
        document.querySelector('select[class*="lang"]') ||
        document.querySelector('select[name="language"]') ||
        document.querySelector(".select-wrapper select");

      if (langSelect && langSelect.tagName === "SELECT") {
        const selectedOption = langSelect.options[langSelect.selectedIndex];
        if (selectedOption) {
          language =
            selectedOption.textContent.trim() ||
            selectedOption.value ||
            "unknown";
        }
        if (language === "unknown" && langSelect.value) {
          language = langSelect.value;
        }
      }

      // Method 2: Check for language indicator/button
      if (language === "unknown") {
        const langButton =
          document.querySelector('[class*="language"]') ||
          document.querySelector('[class*="lang-select"]') ||
          document.querySelector('button[class*="lang"]') ||
          document.querySelector(".ui-selectmenu-text");
        if (langButton) {
          language =
            langButton.textContent.trim() ||
            langButton.getAttribute("data-lang") ||
            langButton.value ||
            "unknown";
        }
      }

      // Method 3: Check URL or page context for language hint
      if (language === "unknown") {
        const urlParams = new URLSearchParams(window.location.search);
        const langParam = urlParams.get("language") || urlParams.get("lang");
        if (langParam) {
          language = langParam;
        }
      }

      // Method 4: Fallback - look for known languages in all dropdowns (Robust like LeetCode/GFG)
      if (language === "unknown") {
        const editorArea =
          document.querySelector(".editor-wrapper") || document.body;
        const potentialElements = editorArea.querySelectorAll(
          ".dropdown-text, .ui.selection.dropdown, select, [role='listbox'], button, span"
        );

        const knownLanguages = [
          "C++",
          "Java",
          "Python",
          "Python3",
          "C",
          "C#",
          "JavaScript",
          "TypeScript",
          "PHP",
          "Swift",
          "Kotlin",
          "Dart",
          "Go",
          "Ruby",
          "Scala",
          "Rust",
        ];

        for (const el of potentialElements) {
          const text = el.textContent || el.value;
          if (text && knownLanguages.includes(text.trim())) {
            language = text.trim();
            break;
          }
        }
      }

      language = this.normalizeLanguage(language);

      // Extract code solution - Prioritize editors
      let code = "";

      // Method 1: Try Monaco Editor
      const monacoEditorElement = document.querySelector(".monaco-editor");
      if (monacoEditorElement) {
        // PRIORITY: Try specific HackerRank Monaco access or standard window.monaco
        if (!code && window.monaco) {
          try {
            // HackerRank sometimes has multiple editors, let's try to find the one with content
            const editors = window.monaco.editor.getEditors();
            for (const editor of editors) {
              const val = editor.getValue();
              if (val && val.length > 10) {
                // arbitrary threshold to avoid empty/tiny editors
                code = val;
                break;
              }
            }
            // Fallback to first if none found
            if (!code && editors.length > 0) {
              code = editors[0].getValue();
            }
          } catch (e) {}
        }

        if (!code) {
          const viewLines = monacoEditorElement.querySelectorAll(".view-line");
          if (viewLines.length > 0) {
            code = Array.from(viewLines)
              .map((line) => {
                const lineText = line.textContent || "";
                return lineText.replace(/\s+$/, "");
              })
              .join("\n");
          }
        }

        if (!code) {
          const monacoTextarea = monacoEditorElement.querySelector("textarea");
          if (monacoTextarea && monacoTextarea.value) {
            code = monacoTextarea.value;
          }
        }
      }

      // Method 2: Try CodeMirror (HackerRank's usual editor)
      if (!code) {
        const codeMirror = document.querySelector(".CodeMirror-code");
        if (codeMirror) {
          // Get all lines from CodeMirror
          const lines = codeMirror.querySelectorAll(".CodeMirror-line");
          if (lines.length > 0) {
            code = Array.from(lines)
              .map((line) => line.textContent || line.innerText || "")
              .join("\n");
          } else {
            code = codeMirror.innerText || codeMirror.textContent || "";
          }
        }
      }

      // Method 3: Try Ace Editor
      if (!code) {
        const aceLines = document.querySelectorAll(".ace_line");
        if (aceLines.length > 0) {
          code = Array.from(aceLines)
            .map((line) => line.textContent.replace(/\s+$/, ""))
            .join("\n");
        }
      }

      // Method 4: Try CodeMirror textarea (hidden input)
      if (!code) {
        const codeMirrorTextarea = document.querySelector(
          ".CodeMirror textarea"
        );
        if (codeMirrorTextarea && codeMirrorTextarea.value) {
          code = codeMirrorTextarea.value;
        }
      }

      // Method 5: Try regular textarea
      if (!code) {
        const textarea =
          document.querySelector('textarea[class*="code"]') ||
          document.querySelector('textarea[name="code"]') ||
          document.querySelector("textarea");
        if (textarea) {
          code = textarea.value || textarea.textContent || "";
        }
      }

      // Method 6: Try pre/code elements (for submitted solutions)
      if (!code) {
        const codeElement =
          document.querySelector("pre code") ||
          document.querySelector('pre[class*="code"]') ||
          document.querySelector("pre");
        if (codeElement) {
          code = codeElement.textContent || codeElement.innerText || "";
        }
      }

      return {
        platform: "hackerrank",
        title: title,
        problemNumber: "",
        description: description,
        code: code.trim(),
        language: language,
        url: window.location.href,
      };
    } catch (error) {
      console.error("Error extracting HackerRank data:", error);
      return null;
    }
  }

  // Normalize language names to standard format
  static normalizeLanguage(lang) {
    if (!lang || lang === "unknown") return "unknown";

    // First, try to match common patterns before normalization
    const langLower = lang.toLowerCase().trim();

    // Direct matches for common formats
    if (langLower.includes("python")) {
      return "python";
    }
    if (langLower.includes("javascript") || langLower === "js") {
      return "javascript";
    }
    if (langLower.includes("typescript") || langLower === "ts") {
      return "typescript";
    }
    if (langLower.includes("java") && !langLower.includes("javascript")) {
      return "java";
    }
    if (
      langLower.includes("c++") ||
      langLower.includes("cpp") ||
      langLower.includes("cplusplus")
    ) {
      return "cpp";
    }
    if (
      langLower === "c" ||
      langLower === "c " ||
      (langLower.includes(" c ") && !langLower.includes("c++"))
    ) {
      return "c";
    }
    if (langLower.includes("c#") || langLower.includes("csharp")) {
      return "csharp";
    }
    if (langLower.includes("go") || langLower.includes("golang")) {
      return "go";
    }
    if (langLower.includes("rust")) {
      return "rust";
    }
    if (langLower.includes("ruby")) {
      return "ruby";
    }
    if (langLower.includes("swift")) {
      return "swift";
    }
    if (langLower.includes("kotlin")) {
      return "kotlin";
    }
    if (langLower.includes("scala")) {
      return "scala";
    }
    if (langLower.includes("php")) {
      return "php";
    }
    if (langLower.includes("sql")) {
      return "sql";
    }
    if (langLower.includes("bash") || langLower.includes("shell")) {
      return "bash";
    }

    // Fallback: normalize and map
    const normalized = langLower.replace(/\s+/g, "").replace(/[^a-z0-9]/g, "");

    const langMap = {
      python: "python",
      python3: "python",
      py: "python",
      javascript: "javascript",
      js: "javascript",
      typescript: "typescript",
      ts: "typescript",
      java: "java",
      cpp: "cpp",
      "c++": "cpp",
      cplusplus: "cpp",
      c: "c",
      csharp: "csharp",
      "c#": "csharp",
      cs: "csharp",
      go: "go",
      golang: "go",
      rust: "rust",
      rs: "rust",
      ruby: "ruby",
      rb: "ruby",
      swift: "swift",
      kotlin: "kotlin",
      kt: "kotlin",
      scala: "scala",
      php: "php",
      sql: "sql",
      mysql: "sql",
      bash: "bash",
      shell: "bash",
      sh: "bash",
    };

    return langMap[normalized] || normalized || "unknown";
  }
}

// Listen for messages from content script (to execute in Main World)
window.addEventListener("message", (event) => {
  // We only accept messages from ourselves
  if (event.source !== window) return;

  if (event.data.type && event.data.type === "CODESYNC_EXTRACT_REQUEST") {
    const data = PlatformExtractor.extract();
    window.postMessage({ type: "CODESYNC_EXTRACT_RESPONSE", data: data }, "*");
  }
});
