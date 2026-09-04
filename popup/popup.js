/**
 * Codeforces Auto-Fill Problem Code
 * Modern Popup Controller
 */

const STORAGE_KEY = 'cf_last_problem';

// DOM Elements
const problemCodeEl = document.getElementById('problem-code');
const problemTitleEl = document.getElementById('problem-title');
const timestampEl = document.getElementById('timestamp');
const autofillToggle = document.getElementById('autofill-toggle');
const openSubmitBtn = document.getElementById('open-submit-btn');
const clearBtn = document.getElementById('clear-btn');
const overrideForm = document.getElementById('override-form');
const manualCodeInput = document.getElementById('manual-code-input');
const feedbackMsg = document.getElementById('feedback-msg');

const navTabs = document.querySelectorAll('.nav-tab');
const autofillSection = document.getElementById('autofill-section');
const manualSection = document.getElementById('manual-section');
const modeButtons = document.querySelectorAll('.mode-btn');

let currentMode = 'problemset';

/**
 * Format relative timestamp
 */
function formatTimeAgo(timestamp) {
  if (!timestamp) return '—';
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * Update submit URL based on selected mode and problem data
 */
function updateSubmitLink(problem) {
  if (currentMode === 'contest' && problem && problem.contestId) {
    openSubmitBtn.href = `https://codeforces.com/contest/${problem.contestId}/submit`;
  } else if (currentMode === 'gym' && problem && problem.contestId) {
    openSubmitBtn.href = `https://codeforces.com/gym/${problem.contestId}/submit`;
  } else {
    openSubmitBtn.href = 'https://codeforces.com/problemset/submit';
  }
}

/**
 * Load state from storage
 */
async function loadState() {
  try {
    const data = await chrome.storage.local.get(STORAGE_KEY);
    const problem = data[STORAGE_KEY];

    if (problem && problem.code) {
      problemCodeEl.textContent = problem.code;
      problemCodeEl.classList.remove('empty');
      problemTitleEl.textContent = problem.title || 'Codeforces Problem';
      problemTitleEl.title = problem.title || '';
      timestampEl.textContent = formatTimeAgo(problem.timestamp);
      manualCodeInput.value = problem.code;
      autofillToggle.checked = problem.enabled !== false;
    } else {
      problemCodeEl.textContent = 'None';
      problemCodeEl.classList.add('empty');
      problemTitleEl.textContent = 'Not detected';
      timestampEl.textContent = '—';
      manualCodeInput.value = '';
      autofillToggle.checked = true;
    }

    updateSubmitLink(problem);
  } catch (err) {
    console.error('Error loading stored problem:', err);
  }
}

/**
 * Display feedback
 */
function showFeedback(text, isError = false) {
  feedbackMsg.textContent = text;
  feedbackMsg.className = `feedback-msg ${isError ? 'error' : ''}`;
  setTimeout(() => {
    feedbackMsg.textContent = '';
    feedbackMsg.className = 'feedback-msg';
  }, 2500);
}

/**
 * Toggle auto-fill enabled state
 */
autofillToggle.addEventListener('change', async () => {
  try {
    const data = await chrome.storage.local.get(STORAGE_KEY);
    const problem = data[STORAGE_KEY] || {};
    problem.enabled = autofillToggle.checked;
    await chrome.storage.local.set({ [STORAGE_KEY]: problem });
    showFeedback(autofillToggle.checked ? 'Auto-fill enabled' : 'Auto-fill paused');
  } catch (err) {
    console.error('Error updating toggle state:', err);
  }
});

/**
 * Tab Navigation (Auto-Fill vs Manual Entry)
 */
navTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    navTabs.forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');

    const targetTab = tab.dataset.tab;
    if (targetTab === 'autofill') {
      autofillSection.classList.add('active');
      manualSection.classList.remove('active');
    } else {
      autofillSection.classList.remove('active');
      manualSection.classList.add('active');
      manualCodeInput.focus();
    }
  });
});

/**
 * Mode buttons (Problemset, Contest, Gym)
 */
modeButtons.forEach((btn) => {
  btn.addEventListener('click', async () => {
    modeButtons.forEach((b) => {
      b.classList.remove('active');
      const ind = b.querySelector('.active-indicator');
      if (ind) ind.remove();
    });

    btn.classList.add('active');
    const indicator = document.createElement('div');
    indicator.className = 'active-indicator';
    btn.appendChild(indicator);

    currentMode = btn.id.replace('mode-', '');

    const data = await chrome.storage.local.get(STORAGE_KEY);
    updateSubmitLink(data[STORAGE_KEY]);
  });
});

/**
 * Clear stored problem
 */
clearBtn.addEventListener('click', async () => {
  try {
    await chrome.storage.local.remove(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY);
    loadState();
    showFeedback('Cleared saved problem code');
  } catch (err) {
    console.error('Error clearing storage:', err);
  }
});

/**
 * Handle manual code override
 */
overrideForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const rawCode = manualCodeInput.value.trim().toUpperCase();

  const match = rawCode.match(/^(\d+)([A-Z0-9]+)$/i);
  if (!match) {
    showFeedback('Invalid format (e.g. 1800C1)', true);
    return;
  }

  const contestId = match[1];
  const index = match[2];
  const code = `${contestId}${index}`;

  const problemData = {
    code,
    contestId,
    index,
    title: `Problem ${code}`,
    url: `https://codeforces.com/problemset/problem/${contestId}/${index}`,
    timestamp: Date.now(),
    enabled: autofillToggle.checked
  };

  try {
    await chrome.storage.local.set({ [STORAGE_KEY]: problemData });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(problemData));
    loadState();

    // Switch back to autofill tab
    document.querySelector('.nav-tab[data-tab="autofill"]').click();
    showFeedback(`Applied problem code ${code}!`);
  } catch (err) {
    console.error('Error saving manual code:', err);
    showFeedback('Failed to save code', true);
  }
});

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', loadState);
