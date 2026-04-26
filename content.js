// content.js - Main content script (runs on every page)

class PromptImprovementAssistant {
    constructor() {
        this.isActive = false;
        this.currentInput = null;
        this.suggestionBox = null;
        this.typingTimeout = null;
        this.userExperience = 'beginner';
        this.helpDepth = 'surface';
        this.promptsImproved = 0;

        this.init();
    }

    async init() {
        // Load preferences
        const prefs = await chrome.storage.local.get([
            'userExperience', 'helpDepth', 'enabled', 'autoSuggest', 'toolbarPosition'
        ]);

        if (prefs.enabled === false) return;

        if (prefs.toolbarPosition) {
            this.customLeft = prefs.toolbarPosition.left;
            this.customTop = prefs.toolbarPosition.top;
        }

        if (prefs.enabled === false) return;

        this.userExperience = prefs.userExperience || 'beginner';
        this.helpDepth = prefs.helpDepth || 'surface';
        this.autoSuggest = prefs.autoSuggest !== false;

        // Listen for focus on input fields using capture phase
        document.addEventListener('focusin', (e) => {
            if (this.isTextInput(e.target)) {
                this.activateAssistant(e.target);
            }
        }, true);

        // Close toolbar only when clicking completely outside of it and the input
        document.addEventListener('mousedown', (e) => {
            if (!this.isActive) return;
            
            const inInput = e.target === this.currentInput || this.currentInput?.contains(e.target);
            const inToolbar = this.suggestionBox && this.suggestionBox.contains(e.target);
            
            if (!inInput && !inToolbar) {
                this.deactivateAssistant();
            }
        }, true);

        // Global input listener using capture phase to bypass stopPropagation
        document.addEventListener('input', (e) => {
            if (this.isActive && this.autoSuggest !== false && this.isTextInput(e.target)) {
                // If they typed in a different input but focusin didn't catch it, update currentInput
                if (this.currentInput !== e.target) {
                    this.activateAssistant(e.target);
                }
                this.handleInput(e);
            }
        }, true);

        // Listen for settings updates
        chrome.runtime.onMessage.addListener((msg) => {
            if (msg.action === 'settingsUpdated') {
                this.userExperience = msg.settings.defaultExperience;
                this.helpDepth = msg.settings.defaultDepth;
            }
        });
    }

    isTextInput(element) {
        // Prevent the assistant from attaching to its own inputs!
        if (this.suggestionBox && this.suggestionBox.contains(element)) return false;

        const tagName = element.tagName?.toLowerCase();
        const type = element.type?.toLowerCase();
        const role = element.getAttribute?.('role');

        return (
            tagName === 'textarea' ||
            (tagName === 'input' && ['text', 'search', 'email', 'url', 'tel', null].includes(type)) ||
            element.isContentEditable === true ||
            role === 'textbox'
        );
    }

    activateAssistant(inputElement) {
        if (this.currentInput === inputElement && this.isActive) return;
        
        this.currentInput = inputElement;
        this.isActive = true;
        this.createFloatingToolbar();
    }

    createFloatingToolbar() {
        if (this.suggestionBox) this.suggestionBox.remove();

        this.suggestionBox = document.createElement('div');
        this.suggestionBox.className = 'prompt-assistant-toolbar';
        this.suggestionBox.innerHTML = `
      <div class="toolbar-buttons">
        <div class="drag-handle" id="dragHandle" style="cursor: grab; display: flex; align-items: center; justify-content: center; padding: 4px; color: var(--pa-text-secondary); margin-right: 4px; border-radius: 6px; transition: background 0.2s;" onmouseover="this.style.background='var(--pa-bg)'" onmouseout="this.style.background='transparent'" title="Drag Toolbar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/>
            <circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/>
          </svg>
        </div>
        <button class="tool-btn" id="improveBtn" title="Improve Prompt">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </button>
        <button class="tool-btn" id="suggestBtn" title="Show Suggestions">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
          </svg>
        </button>
        <button class="tool-btn" id="learnBtn" title="Learn Prompt Engineering">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
          </svg>
        </button>
        <button class="tool-btn" id="settingsBtn" title="Settings">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
        <button class="tool-btn close-btn" id="closeBtn" title="Close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="suggestions-panel" id="suggestionsPanel" style="display: none;"></div>
      <div class="learning-panel" id="learningPanel" style="display: none;"></div>
    `;

        document.body.appendChild(this.suggestionBox);
        this.positionToolbar();
        this.attachToolbarEvents();
        this.attachDragLogic();

        // Expose instance for click handlers
        window.__promptAssistant = this;
    }

    attachDragLogic() {
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;

        const onMouseMove = (e) => {
            if (!isDragging || !this.suggestionBox) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            
            // Keep within window bounds
            const newLeft = Math.max(0, Math.min(window.innerWidth - this.suggestionBox.offsetWidth, initialLeft + dx));
            const newTop = Math.max(0, Math.min(window.innerHeight - this.suggestionBox.offsetHeight, initialTop + dy));
            
            this.suggestionBox.style.left = `${newLeft}px`;
            this.suggestionBox.style.top = `${newTop}px`;
        };

        const onMouseUp = async () => {
            if (isDragging) {
                isDragging = false;
                this.suggestionBox.style.cursor = 'default';
                document.removeEventListener('mousemove', onMouseMove, true);
                document.removeEventListener('mouseup', onMouseUp, true);

                // Save custom position so it remembers where it was dragged
                this.customLeft = parseInt(this.suggestionBox.style.left);
                this.customTop = parseInt(this.suggestionBox.style.top);
                await chrome.storage.local.set({
                    toolbarPosition: { left: this.customLeft, top: this.customTop }
                });
            }
        };

        this.suggestionBox.addEventListener('mousedown', (e) => {
            // Only left click
            if (e.button !== 0) return;

            // Don't drag if clicking interactive elements
            const interactive = ['button', 'input', 'select', 'textarea', 'a'];
            const tagName = e.target.tagName?.toLowerCase();
            
            if (interactive.includes(tagName) || 
                e.target.closest('button') || 
                e.target.closest('.tailor-input') || 
                e.target.closest('.suggestion-item') ||
                e.target.closest('.resource-item')) {
                return;
            }

            isDragging = true;
            this.suggestionBox.style.cursor = 'grabbing';
            startX = e.clientX;
            startY = e.clientY;
            
            const rect = this.suggestionBox.getBoundingClientRect();
            initialLeft = rect.left;
            initialTop = rect.top;
            
            e.preventDefault();

            // Use capture phase so toolbar's own stopPropagation doesn't block it
            document.addEventListener('mousemove', onMouseMove, true);
            document.addEventListener('mouseup', onMouseUp, true);
        });
    }

    positionToolbar() {
        if (!this.currentInput || !this.suggestionBox) return;

        const toolbarHeight = 50;

        // If user has dragged it before, use their custom position
        if (this.customLeft !== undefined && this.customTop !== undefined) {
            // Keep within window bounds in case window was resized
            const safeLeft = Math.max(0, Math.min(window.innerWidth - 320, this.customLeft));
            const safeTop = Math.max(0, Math.min(window.innerHeight - toolbarHeight, this.customTop));

            Object.assign(this.suggestionBox.style, {
                position: 'fixed',
                top: `${safeTop}px`,
                left: `${safeLeft}px`,
                zIndex: '2147483647',
                maxWidth: `${Math.min(400, window.innerWidth - 40)}px`
            });
            return;
        }

        // Otherwise snap to the input field
        const rect = this.currentInput.getBoundingClientRect();
        Object.assign(this.suggestionBox.style, {
            position: 'fixed',
            top: `${Math.min(rect.bottom + 8, window.innerHeight - toolbarHeight - 20)}px`,
            left: `${Math.max(rect.left, 20)}px`,
            zIndex: '2147483647',
            maxWidth: `${Math.min(400, window.innerWidth - 40)}px`
        });
    }

    attachToolbarEvents() {
        const panel = this.suggestionBox;

        // Prevent ChatGPT and other host sites from stealing focus back!
        const stopProp = (e) => e.stopPropagation();
        ['mousedown', 'mouseup', 'click', 'keydown', 'keyup'].forEach(evt => {
            panel.addEventListener(evt, stopProp, false); // Bubble phase only!
        });

        panel.querySelector('#improveBtn')?.addEventListener('click', () => this.improvePrompt());
        panel.querySelector('#suggestBtn')?.addEventListener('click', () => this.toggleSuggestions());
        panel.querySelector('#learnBtn')?.addEventListener('click', () => this.showLearningOptions());
        panel.querySelector('#settingsBtn')?.addEventListener('click', () => chrome.runtime.openOptionsPage());
        panel.querySelector('#closeBtn')?.addEventListener('click', () => this.deactivateAssistant());
    }

    getText(element) {
        if (!element) return '';
        if (element.tagName?.toLowerCase() === 'textarea' || element.tagName?.toLowerCase() === 'input') {
            return element.value || '';
        }
        return element.innerText || element.textContent || '';
    }

    setText(element, text) {
        if (!element) return;
        if (element.tagName?.toLowerCase() === 'textarea' || element.tagName?.toLowerCase() === 'input') {
            element.value = text;
        } else {
            element.innerText = text;
        }
        element.dispatchEvent(new Event('input', { bubbles: true }));
    }

    handleInput(event) {
        clearTimeout(this.typingTimeout);
        this.typingTimeout = setTimeout(() => {
            const text = this.getText(event.target);
            if (text?.length >= 5) {
                this.analyzePrompt(text);
            }
        }, 600);
    }

    async analyzePrompt(text) {
        try {
            const response = await chrome.runtime.sendMessage({
                action: 'analyzePrompt',
                text,
                experienceLevel: this.userExperience,
                depth: this.helpDepth
            });

            if (response) {
                const suggestions = Array.isArray(response) ? response : (response.suggestions || []);
                const tailoringOptions = response.tailoringOptions || [];
                
                if (suggestions.length || tailoringOptions.length) {
                    this.showRealTimeSuggestions(suggestions, tailoringOptions);
                }
            }
        } catch (err) {
            console.debug('Analysis skipped:', err);
        }
    }

    showRealTimeSuggestions(suggestions, tailoringOptions = []) {
        const panel = this.suggestionBox?.querySelector('#suggestionsPanel');
        if (!panel) return;

        panel.style.display = 'block';
        
        let html = '';
        
        if (suggestions.length > 0) {
            html += `
              <div class="suggestion-header pa-gradient-text">✨ Quick Suggestions</div>
              ${suggestions.map(s => `
                <div class="suggestion-item" data-text="${this.escapeHtml(s.text)}">
                  <span>${this.escapeHtml(s.text)}</span>
                  <span class="suggestion-type">${this.escapeHtml(s.type || 'tip')}</span>
                </div>
              `).join('')}
            `;
        }
        
        if (tailoringOptions.length > 0) {
            html += `
              <div class="tailor-header pa-gradient-text" style="margin-top: 15px; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Tailor Your Prompt</div>
              <div class="tailor-form" id="tailorForm">
                ${tailoringOptions.map((opt, i) => `
                  <div class="tailor-group" style="margin-bottom: 12px; margin-top: 8px;">
                    <label style="display: block; font-size: 12px; margin-bottom: 6px; font-weight: 600; color: var(--pa-text-secondary);">${this.escapeHtml(opt.category)}</label>
                    <input list="tailor-list-${i}" class="tailor-input" data-category="${this.escapeHtml(opt.category)}" placeholder="Select or type your own..." style="width: 100%; padding: 10px 12px; border-radius: 8px; background: var(--pa-surface); border: 1px solid var(--pa-border); color: var(--pa-text); font-size: 13px; transition: all 0.2s; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);">
                    <datalist id="tailor-list-${i}">
                      ${opt.options.map(o => `<option value="${this.escapeHtml(o)}">`).join('')}
                    </datalist>
                  </div>
                `).join('')}
                <button id="applyTailoringBtn" class="pa-button pa-primary-btn" style="width: 100%; margin-top: 12px; padding: 10px; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 14px; transition: all 0.2s;">Apply Enhancements</button>
              </div>
            `;
        }

        panel.innerHTML = html;

        // Add click handlers for quick suggestions
        panel.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const text = e.currentTarget.dataset.text;
                this.applySuggestion(text);
            });
        });
        
        // Make inputs behave more like dropdowns
        panel.querySelectorAll('.tailor-input').forEach(input => {
            // When clicked, clear value briefly to force datalist to show all options
            input.addEventListener('mousedown', function(e) {
                if (this.value === '') {
                    // It's empty, clicking it might not show datalist immediately in Chrome unless double clicked
                    // We can't programmatically open datalist, but stopping propagation ensures focus stays.
                }
            });
            input.addEventListener('focus', function() {
                // Hint to user
                this.setAttribute('placeholder', 'Type or double-click to view options...');
            });
            input.addEventListener('blur', function() {
                this.setAttribute('placeholder', 'Select or type your own...');
            });
        });

        // Add click handler for Apply Tailoring
        const applyBtn = panel.querySelector('#applyTailoringBtn');
        if (applyBtn) {
            applyBtn.addEventListener('mousedown', (e) => {
                e.preventDefault(); // Prevent losing focus from input
                this.applyTailoring();
            });
            // Also keep click as fallback
            applyBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.applyTailoring();
            });
        }
    }

    async applyTailoring() {
        const text = this.getText(this.currentInput);
        if (!text) return;
        
        const inputs = this.suggestionBox?.querySelectorAll('.tailor-input');
        if (!inputs) return;
        
        const tailoringData = {};
        inputs.forEach(input => {
            if (input.value.trim()) {
                tailoringData[input.dataset.category] = input.value.trim();
            }
        });

        const btn = this.suggestionBox.querySelector('#applyTailoringBtn');
        const originalText = btn.textContent;
        btn.textContent = 'Applying...';
        btn.disabled = true;

        try {
            const response = await chrome.runtime.sendMessage({
                action: 'tailorPrompt',
                text,
                tailoringData
            });

            if (response?.improved) {
                this.setText(this.currentInput, response.improved);
                this.promptsImproved++;
                await chrome.storage.local.set({ promptsImproved: this.promptsImproved });
                this.showNotification('✨ Prompt tailored successfully!');
            }
        } catch (err) {
            this.showNotification('⚠️ Could not tailor prompt', 'error');
        } finally {
            if (btn) {
                btn.textContent = originalText;
                btn.disabled = false;
            }
        }
    }

    async improvePrompt() {
        const text = this.getText(this.currentInput);
        if (!text) return;

        try {
            const response = await chrome.runtime.sendMessage({
                action: 'improvePrompt',
                text,
                experienceLevel: this.userExperience,
                depth: this.helpDepth
            });

            if (response?.improved) {
                this.setText(this.currentInput, response.improved);
                this.promptsImproved++;
                await chrome.storage.local.set({ promptsImproved: this.promptsImproved });
                this.showNotification('✨ Prompt improved!');
            }
        } catch (err) {
            this.showNotification('⚠️ Could not improve prompt', 'error');
        }
    }

    toggleSuggestions() {
        const panel = this.suggestionBox?.querySelector('#suggestionsPanel');
        if (panel) {
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        }
    }

    showLearningOptions() {
        const panel = this.suggestionBox?.querySelector('#learningPanel');
        if (!panel) return;

        panel.style.display = 'block';
        panel.innerHTML = `
      <div class="learning-header">📚 Learn Prompt Engineering</div>
      
      <div class="learning-section">
        <div class="section-title">Learning Depth</div>
        <div class="option-buttons">
          <button class="option-btn ${this.helpDepth === 'surface' ? 'active' : ''}" data-depth="surface">🌊 Surface</button>
          <button class="option-btn ${this.helpDepth === 'deep' ? 'active' : ''}" data-depth="deep">🏊 Deep Dive</button>
        </div>
      </div>

      <div class="learning-section">
        <div class="section-title">Your Experience</div>
        <div class="option-buttons">
          <button class="option-btn ${this.userExperience === 'beginner' ? 'active' : ''}" data-exp="beginner">🌱 Beginner</button>
          <button class="option-btn ${this.userExperience === 'intermediate' ? 'active' : ''}" data-exp="intermediate">🌿 Intermediate</button>
          <button class="option-btn ${this.userExperience === 'advanced' ? 'active' : ''}" data-exp="advanced">🌳 Advanced</button>
        </div>
      </div>

      <div class="learning-resources">
        <div class="resource-item" data-type="basics">📖 Prompt Basics</div>
        <div class="resource-item" data-type="advanced">🎯 Advanced Techniques</div>
        <div class="resource-item" data-type="examples">💡 Examples</div>
      </div>
    `;

        // Event listeners
        panel.querySelectorAll('[data-depth]').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                this.helpDepth = e.target.dataset.depth;
                await chrome.storage.local.set({ helpDepth: this.helpDepth });
                this.updateActiveButtons(e.target);
            });
        });

        panel.querySelectorAll('[data-exp]').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                this.userExperience = e.target.dataset.exp;
                await chrome.storage.local.set({ userExperience: this.userExperience });
                this.updateActiveButtons(e.target);
            });
        });

        panel.querySelectorAll('.resource-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const resources = {
                    basics: 'https://learnprompting.org/docs/introduction',
                    advanced: 'https://learnprompting.org/docs/intermediate/zero_shot',
                    examples: 'https://github.com/openai/openai-cookbook'
                };
                if (resources[e.target.dataset.type]) {
                    window.open(resources[e.target.dataset.type], '_blank');
                }
            });
        });
    }

    updateActiveButtons(clicked) {
        const parent = clicked.parentElement;
        parent.querySelectorAll('.option-btn').forEach(btn => btn.classList.remove('active'));
        clicked.classList.add('active');
    }

    applySuggestion(text) {
        if (this.currentInput) {
            this.setText(this.currentInput, text);
            this.showNotification('✓ Suggestion applied');
        }
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `assistant-notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        requestAnimationFrame(() => notification.classList.add('show'));

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 2500);
    }

    deactivateAssistant() {
        this.isActive = false;
        if (this.suggestionBox) {
            this.suggestionBox.remove();
            this.suggestionBox = null;
        }
        this.currentInput = null;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new PromptImprovementAssistant());
} else {
    new PromptImprovementAssistant();
}