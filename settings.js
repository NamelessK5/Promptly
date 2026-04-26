// settings.js - Settings page logic

const defaults = {
    provider: 'openai',
    apiKey: '',
    endpoint: '',
    defaultExperience: 'beginner',
    defaultDepth: 'surface',
    enabled: true,
    autoSuggest: true,
    darkMode: true
};

document.addEventListener('DOMContentLoaded', async () => {
    const messageEl = document.getElementById('message');

    // Load saved settings
    const saved = await chrome.storage.local.get(defaults);

    // Populate form
    document.getElementById('provider').value = saved.provider;
    document.getElementById('apiKey').value = saved.apiKey;
    document.getElementById('endpoint').value = saved.endpoint;
    document.getElementById('defaultExperience').value = saved.defaultExperience;
    document.getElementById('defaultDepth').value = saved.defaultDepth;
    document.getElementById('enabled').checked = saved.enabled;
    document.getElementById('autoSuggest').checked = saved.autoSuggest;
    document.getElementById('darkMode').checked = saved.darkMode;

    // Show/hide endpoint field based on provider
    const toggleEndpoint = (providerValue) => {
        const endpointContainer = document.getElementById('endpointContainer');
        if (endpointContainer) {
            endpointContainer.style.display = providerValue === 'local' ? 'block' : 'none';
        }
    };

    document.getElementById('provider').addEventListener('change', (e) => {
        toggleEndpoint(e.target.value);
    });

    // Initialize endpoint visibility
    toggleEndpoint(saved.provider);

    // Save button
    document.getElementById('saveBtn').addEventListener('click', async () => {
        const settings = {
            provider: document.getElementById('provider').value,
            apiKey: document.getElementById('apiKey').value.trim(),
            endpoint: document.getElementById('endpoint').value.trim(),
            defaultExperience: document.getElementById('defaultExperience').value,
            defaultDepth: document.getElementById('defaultDepth').value,
            enabled: document.getElementById('enabled').checked,
            autoSuggest: document.getElementById('autoSuggest').checked,
            darkMode: document.getElementById('darkMode').checked,
            lastSaved: new Date().toISOString()
        };

        // Validate API key if provider requires it
        if (['openai', 'anthropic'].includes(settings.provider) && !settings.apiKey) {
            showMessage('⚠️ Please enter an API key for your selected provider', 'error');
            return;
        }

        await chrome.storage.local.set(settings);
        showMessage('✅ Settings saved successfully!', 'success');

        // Notify background script of changes
        chrome.runtime.sendMessage({ action: 'settingsUpdated', settings });
    });

    // Reset button
    document.getElementById('resetBtn').addEventListener('click', async () => {
        if (confirm('Reset all settings to defaults?')) {
            await chrome.storage.local.set(defaults);
            location.reload();
        }
    });

    function showMessage(text, type) {
        messageEl.textContent = text;
        messageEl.className = `message ${type}`;
        setTimeout(() => {
            messageEl.className = 'message';
        }, 4000);
    }
});