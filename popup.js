// popup.js - Extension popup logic

document.addEventListener('DOMContentLoaded', async () => {
    const statusEl = document.getElementById('status');
    const countEl = document.getElementById('count');

    // Load stats from storage
    const stats = await chrome.storage.local.get(['promptsImproved']);
    countEl.textContent = stats.promptsImproved || 0;

    // Settings button
    document.getElementById('settingsBtn').addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
    });

    // Docs button
    document.getElementById('docsBtn').addEventListener('click', () => {
        chrome.tabs.create({
            url: 'https://learnprompting.org/docs/introduction'
        });
    });

    // Feedback button
    document.getElementById('feedbackBtn').addEventListener('click', () => {
        chrome.tabs.create({
            url: 'mailto:feedback@promptassistant.dev?subject=Prompt Assistant Feedback'
        });
    });

    // Check if extension is active on current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url?.startsWith('chrome://')) {
        statusEl.innerHTML = '⚠️ Cannot run on Chrome internal pages';
        statusEl.style.background = '#fff3e0';
        statusEl.style.borderColor = '#ffb74d';
    }
});