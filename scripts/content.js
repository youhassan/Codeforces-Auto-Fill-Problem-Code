/**
 * Codeforces Auto-Fill Problem Code
 * Content Script (Manifest V3)
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'cf_last_problem';

  /**
   * Extract problem details from current URL and DOM
   */
  function extractProblemInfo() {
    const pathname = window.location.pathname;

    // Pattern 1: /problemset/problem/{contestId}/{index}
    // Pattern 2: /contest/{contestId}/problem/{index}
    // Pattern 3: /gym/{contestId}/problem/{index}
    // Pattern 4: /group/{groupId}/contest/{contestId}/problem/{index}
    const problemRegexes = [
      /^\/problemset\/problem\/(\d+)\/([A-Za-z0-9]+)/i,
      /^\/contest\/(\d+)\/problem\/([A-Za-z0-9]+)/i,
      /^\/gym\/(\d+)\/problem\/([A-Za-z0-9]+)/i,
      /^\/group\/[^\/]+\/contest\/(\d+)\/problem\/([A-Za-z0-9]+)/i
    ];

    for (const regex of problemRegexes) {
      const match = pathname.match(regex);
      if (match) {
        const contestId = match[1];
        const index = match[2].toUpperCase();
        const code = `${contestId}${index}`;

        // Attempt to extract clean problem title
        let title = '';
        const titleEl = document.querySelector('.problem-statement .header .title');
        if (titleEl) {
          title = titleEl.textContent.trim();
        } else {
          title = document.title.replace(/\s*-\s*Codeforces\s*$/i, '').trim();
        }

        return {
          code,
          contestId,
          index,
          title,
          url: window.location.href,
          timestamp: Date.now()
        };
      }
    }

    return null;
  }

  /**
   * Check if the current URL is a submission page
   */
  function isSubmitPage() {
    const pathname = window.location.pathname;
    return (
      /^\/problemset\/submit/i.test(pathname) ||
      /^\/contest\/\d+\/submit/i.test(pathname) ||
      /^\/gym\/\d+\/submit/i.test(pathname) ||
      /^\/group\/[^\/]+\/contest\/\d+\/submit/i.test(pathname)
    );
  }

  /**
   * Save problem data to chrome.storage.local and localStorage (fallback)
   */
  async function saveProblem(problemData) {
    if (!problemData || !problemData.code) return;

    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.set({ [STORAGE_KEY]: problemData });
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(problemData));
      console.log(`[Codeforces Auto-Fill] Captured problem: ${problemData.code} (${problemData.title || ''})`);
    } catch (err) {
      console.warn('[Codeforces Auto-Fill] Error saving problem info:', err);
    }
  }

  /**
   * Retrieve saved problem data
   */
  async function getSavedProblem() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const result = await chrome.storage.local.get(STORAGE_KEY);
        if (result && result[STORAGE_KEY]) {
          return result[STORAGE_KEY];
        }
      }

      const localData = localStorage.getItem(STORAGE_KEY);
      if (localData) {
        return JSON.parse(localData);
      }
    } catch (err) {
      console.warn('[Codeforces Auto-Fill] Error retrieving problem info:', err);
    }
    return null;
  }

  /**
   * Provide visual feedback on autofilled input
   */
  function showAutofillBadge(element, problemCode) {
    element.style.transition = 'box-shadow 0.3s ease, border-color 0.3s ease';
    element.style.borderColor = '#10B981';
    element.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.25)';

    // Reset outline after a short delay
    setTimeout(() => {
      element.style.borderColor = '';
      element.style.boxShadow = '';
    }, 2000);

    // Add a small helper note if not already present
    const existingBadge = document.getElementById('cf-autofill-indicator');
    if (!existingBadge && element.parentElement) {
      const badge = document.createElement('span');
      badge.id = 'cf-autofill-indicator';
      badge.style.cssText = `
        display: inline-flex;
        align-items: center;
        gap: 5px;
        margin-left: 8px;
        font-size: 11px;
        font-weight: 600;
        color: #0369a1;
        background-color: #f0f9ff;
        border: 1px solid #bae6fd;
        padding: 3px 8px;
        border-radius: 4px;
        vertical-align: middle;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        transition: opacity 0.5s ease;
      `;

      // Extension icon
      try {
        const iconImg = document.createElement('img');
        iconImg.src = chrome.runtime.getURL('icons/icon-16.png');
        iconImg.alt = '';
        iconImg.style.cssText = `
          width: 14px;
          height: 14px;
          display: inline-block;
          border-radius: 2px;
          flex-shrink: 0;
        `;
        badge.appendChild(iconImg);
      } catch (err) {
        // Fallback if runtime URL is not accessible
      }

      const textSpan = document.createElement('span');
      textSpan.textContent = `Auto-filled: ${problemCode}`;
      badge.appendChild(textSpan);

      element.parentElement.appendChild(badge);

      setTimeout(() => {
        badge.style.opacity = '0';
        setTimeout(() => badge.remove(), 500);
      }, 3500);
    }
  }

  /**
   * Autofill submission form fields
   */
  async function autofillSubmitPage() {
    const savedProblem = await getSavedProblem();
    if (!savedProblem || !savedProblem.code || savedProblem.enabled === false) {
      return false;
    }

    let filled = false;

    // 1. Text input for problem code (Used on /problemset/submit)
    const codeInput = document.querySelector('input[name="submittedProblemCode"]');
    if (codeInput && !codeInput.value.trim()) {
      codeInput.value = savedProblem.code;

      // Dispatch events so form validation and scripts recognize the input
      codeInput.dispatchEvent(new Event('input', { bubbles: true }));
      codeInput.dispatchEvent(new Event('change', { bubbles: true }));

      showAutofillBadge(codeInput, savedProblem.code);
      console.log(`[Codeforces Auto-Fill] Populated problem code: ${savedProblem.code}`);
      filled = true;
    }

    // 2. Dropdown select for contest problem index (Used on /contest/{contestId}/submit)
    const indexSelect = document.querySelector('select[name="submittedProblemIndex"]');
    if (indexSelect && savedProblem.index) {
      // Only set if current value is default/empty
      if (!indexSelect.value || indexSelect.selectedIndex <= 0) {
        const targetOption = Array.from(indexSelect.options).find(
          (opt) =>
            opt.value.toUpperCase() === savedProblem.index.toUpperCase() ||
            opt.text.toUpperCase().startsWith(savedProblem.index.toUpperCase())
        );

        if (targetOption) {
          indexSelect.value = targetOption.value;
          indexSelect.dispatchEvent(new Event('change', { bubbles: true }));
          showAutofillBadge(indexSelect, savedProblem.index);
          console.log(`[Codeforces Auto-Fill] Selected problem index: ${savedProblem.index}`);
          filled = true;
        }
      }
    }

    return filled;
  }

  /**
   * Setup autofill runner with retry & DOM observer to handle dynamic rendering
   */
  function setupAutofill() {
    // Attempt immediate fill
    autofillSubmitPage().then((success) => {
      if (success) return;

      // If element isn't ready, observe DOM mutations
      let attempts = 0;
      const maxAttempts = 15;
      const interval = setInterval(async () => {
        attempts++;
        const done = await autofillSubmitPage();
        if (done || attempts >= maxAttempts) {
          clearInterval(interval);
        }
      }, 200);

      // MutationObserver as fallback for dynamic SPAs
      const observer = new MutationObserver(async () => {
        const done = await autofillSubmitPage();
        if (done) {
          observer.disconnect();
          clearInterval(interval);
        }
      });

      if (document.body) {
        observer.observe(document.body, { childList: true, subtree: true });
        // Automatically disconnect after 5 seconds to free resources
        setTimeout(() => observer.disconnect(), 5000);
      }
    });
  }

  /**
   * Main execution
   */
  function init() {
    const problemInfo = extractProblemInfo();
    if (problemInfo) {
      // We are on a problem page -> capture it
      saveProblem(problemInfo);
    } else if (isSubmitPage()) {
      // We are on a submit page -> autofill it
      setupAutofill();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
