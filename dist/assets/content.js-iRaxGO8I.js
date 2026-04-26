(function(){var e=class{constructor(){this.isActive=!1,this.currentInput=null,this.suggestionBox=null,this.typingTimeout=null,this.userExperience=`beginner`,this.helpDepth=`surface`,this.promptsImproved=0,this.init()}async init(){let e=await chrome.storage.local.get([`userExperience`,`helpDepth`,`enabled`,`autoSuggest`,`toolbarPosition`]);e.enabled!==!1&&(e.toolbarPosition&&(this.customLeft=e.toolbarPosition.left,this.customTop=e.toolbarPosition.top),e.enabled!==!1&&(this.userExperience=e.userExperience||`beginner`,this.helpDepth=e.helpDepth||`surface`,this.autoSuggest=e.autoSuggest!==!1,document.addEventListener(`focusin`,e=>{this.isTextInput(e.target)&&this.activateAssistant(e.target)},!0),document.addEventListener(`mousedown`,e=>{if(!this.isActive)return;let t=e.target===this.currentInput||this.currentInput?.contains(e.target),n=this.suggestionBox&&this.suggestionBox.contains(e.target);!t&&!n&&this.deactivateAssistant()},!0),document.addEventListener(`input`,e=>{this.isActive&&this.autoSuggest!==!1&&this.isTextInput(e.target)&&(this.currentInput!==e.target&&this.activateAssistant(e.target),this.handleInput(e))},!0),chrome.runtime.onMessage.addListener(e=>{e.action===`settingsUpdated`&&(this.userExperience=e.settings.defaultExperience,this.helpDepth=e.settings.defaultDepth)})))}isTextInput(e){if(this.suggestionBox&&this.suggestionBox.contains(e))return!1;let t=e.tagName?.toLowerCase(),n=e.type?.toLowerCase(),r=e.getAttribute?.(`role`);return t===`textarea`||t===`input`&&[`text`,`search`,`email`,`url`,`tel`,null].includes(n)||e.isContentEditable===!0||r===`textbox`}activateAssistant(e){this.currentInput===e&&this.isActive||(this.currentInput=e,this.isActive=!0,this.createFloatingToolbar())}createFloatingToolbar(){this.suggestionBox&&this.suggestionBox.remove(),this.suggestionBox=document.createElement(`div`),this.suggestionBox.className=`prompt-assistant-toolbar`,this.suggestionBox.innerHTML=`
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
    `,document.body.appendChild(this.suggestionBox),this.positionToolbar(),this.attachToolbarEvents(),this.attachDragLogic(),window.__promptAssistant=this}attachDragLogic(){let e=!1,t,n,r,i,a=a=>{if(!e||!this.suggestionBox)return;let o=a.clientX-t,s=a.clientY-n,c=Math.max(0,Math.min(window.innerWidth-this.suggestionBox.offsetWidth,r+o)),l=Math.max(0,Math.min(window.innerHeight-this.suggestionBox.offsetHeight,i+s));this.suggestionBox.style.left=`${c}px`,this.suggestionBox.style.top=`${l}px`},o=async()=>{e&&(e=!1,this.suggestionBox.style.cursor=`default`,document.removeEventListener(`mousemove`,a,!0),document.removeEventListener(`mouseup`,o,!0),this.customLeft=parseInt(this.suggestionBox.style.left),this.customTop=parseInt(this.suggestionBox.style.top),await chrome.storage.local.set({toolbarPosition:{left:this.customLeft,top:this.customTop}}))};this.suggestionBox.addEventListener(`mousedown`,s=>{if(s.button!==0)return;let c=[`button`,`input`,`select`,`textarea`,`a`],l=s.target.tagName?.toLowerCase();if(c.includes(l)||s.target.closest(`button`)||s.target.closest(`.tailor-input`)||s.target.closest(`.suggestion-item`)||s.target.closest(`.resource-item`))return;e=!0,this.suggestionBox.style.cursor=`grabbing`,t=s.clientX,n=s.clientY;let u=this.suggestionBox.getBoundingClientRect();r=u.left,i=u.top,s.preventDefault(),document.addEventListener(`mousemove`,a,!0),document.addEventListener(`mouseup`,o,!0)})}positionToolbar(){if(!this.currentInput||!this.suggestionBox)return;if(this.customLeft!==void 0&&this.customTop!==void 0){let e=Math.max(0,Math.min(window.innerWidth-320,this.customLeft)),t=Math.max(0,Math.min(window.innerHeight-50,this.customTop));Object.assign(this.suggestionBox.style,{position:`fixed`,top:`${t}px`,left:`${e}px`,zIndex:`2147483647`,maxWidth:`${Math.min(400,window.innerWidth-40)}px`});return}let e=this.currentInput.getBoundingClientRect();Object.assign(this.suggestionBox.style,{position:`fixed`,top:`${Math.min(e.bottom+8,window.innerHeight-50-20)}px`,left:`${Math.max(e.left,20)}px`,zIndex:`2147483647`,maxWidth:`${Math.min(400,window.innerWidth-40)}px`})}attachToolbarEvents(){let e=this.suggestionBox,t=e=>e.stopPropagation();[`mousedown`,`mouseup`,`click`,`keydown`,`keyup`].forEach(n=>{e.addEventListener(n,t,!1)}),e.querySelector(`#improveBtn`)?.addEventListener(`click`,()=>this.improvePrompt()),e.querySelector(`#suggestBtn`)?.addEventListener(`click`,()=>this.toggleSuggestions()),e.querySelector(`#learnBtn`)?.addEventListener(`click`,()=>this.showLearningOptions()),e.querySelector(`#settingsBtn`)?.addEventListener(`click`,()=>chrome.runtime.openOptionsPage()),e.querySelector(`#closeBtn`)?.addEventListener(`click`,()=>this.deactivateAssistant())}getText(e){return e?e.tagName?.toLowerCase()===`textarea`||e.tagName?.toLowerCase()===`input`?e.value||``:e.innerText||e.textContent||``:``}setText(e,t){e&&(e.tagName?.toLowerCase()===`textarea`||e.tagName?.toLowerCase()===`input`?e.value=t:e.innerText=t,e.dispatchEvent(new Event(`input`,{bubbles:!0})))}handleInput(e){clearTimeout(this.typingTimeout),this.typingTimeout=setTimeout(()=>{let t=this.getText(e.target);t?.length>=5&&this.analyzePrompt(t)},600)}async analyzePrompt(e){try{let t=await chrome.runtime.sendMessage({action:`analyzePrompt`,text:e,experienceLevel:this.userExperience,depth:this.helpDepth});if(t){let e=Array.isArray(t)?t:t.suggestions||[],n=t.tailoringOptions||[];(e.length||n.length)&&this.showRealTimeSuggestions(e,n)}}catch(e){console.debug(`Analysis skipped:`,e)}}showRealTimeSuggestions(e,t=[]){let n=this.suggestionBox?.querySelector(`#suggestionsPanel`);if(!n)return;n.style.display=`block`;let r=``;e.length>0&&(r+=`
              <div class="suggestion-header pa-gradient-text">✨ Quick Suggestions</div>
              ${e.map(e=>`
                <div class="suggestion-item" data-text="${this.escapeHtml(e.text)}">
                  <span>${this.escapeHtml(e.text)}</span>
                  <span class="suggestion-type">${this.escapeHtml(e.type||`tip`)}</span>
                </div>
              `).join(``)}
            `),t.length>0&&(r+=`
              <div class="tailor-header pa-gradient-text" style="margin-top: 15px; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Tailor Your Prompt</div>
              <div class="tailor-form" id="tailorForm">
                ${t.map((e,t)=>`
                  <div class="tailor-group" style="margin-bottom: 12px; margin-top: 8px;">
                    <label style="display: block; font-size: 12px; margin-bottom: 6px; font-weight: 600; color: var(--pa-text-secondary);">${this.escapeHtml(e.category)}</label>
                    <input list="tailor-list-${t}" class="tailor-input" data-category="${this.escapeHtml(e.category)}" placeholder="Select or type your own..." style="width: 100%; padding: 10px 12px; border-radius: 8px; background: var(--pa-surface); border: 1px solid var(--pa-border); color: var(--pa-text); font-size: 13px; transition: all 0.2s; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);">
                    <datalist id="tailor-list-${t}">
                      ${e.options.map(e=>`<option value="${this.escapeHtml(e)}">`).join(``)}
                    </datalist>
                  </div>
                `).join(``)}
                <button id="applyTailoringBtn" class="pa-button pa-primary-btn" style="width: 100%; margin-top: 12px; padding: 10px; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 14px; transition: all 0.2s;">Apply Enhancements</button>
              </div>
            `),n.innerHTML=r,n.querySelectorAll(`.suggestion-item`).forEach(e=>{e.addEventListener(`click`,e=>{let t=e.currentTarget.dataset.text;this.applySuggestion(t)})}),n.querySelectorAll(`.tailor-input`).forEach(e=>{e.addEventListener(`mousedown`,function(e){this.value}),e.addEventListener(`focus`,function(){this.setAttribute(`placeholder`,`Type or double-click to view options...`)}),e.addEventListener(`blur`,function(){this.setAttribute(`placeholder`,`Select or type your own...`)})});let i=n.querySelector(`#applyTailoringBtn`);i&&(i.addEventListener(`mousedown`,e=>{e.preventDefault(),this.applyTailoring()}),i.addEventListener(`click`,e=>{e.preventDefault(),this.applyTailoring()}))}async applyTailoring(){let e=this.getText(this.currentInput);if(!e)return;let t=this.suggestionBox?.querySelectorAll(`.tailor-input`);if(!t)return;let n={};t.forEach(e=>{e.value.trim()&&(n[e.dataset.category]=e.value.trim())});let r=this.suggestionBox.querySelector(`#applyTailoringBtn`),i=r.textContent;r.textContent=`Applying...`,r.disabled=!0;try{let t=await chrome.runtime.sendMessage({action:`tailorPrompt`,text:e,tailoringData:n});t?.improved&&(this.setText(this.currentInput,t.improved),this.promptsImproved++,await chrome.storage.local.set({promptsImproved:this.promptsImproved}),this.showNotification(`✨ Prompt tailored successfully!`))}catch{this.showNotification(`⚠️ Could not tailor prompt`,`error`)}finally{r&&(r.textContent=i,r.disabled=!1)}}async improvePrompt(){let e=this.getText(this.currentInput);if(e)try{let t=await chrome.runtime.sendMessage({action:`improvePrompt`,text:e,experienceLevel:this.userExperience,depth:this.helpDepth});t?.improved&&(this.setText(this.currentInput,t.improved),this.promptsImproved++,await chrome.storage.local.set({promptsImproved:this.promptsImproved}),this.showNotification(`✨ Prompt improved!`))}catch{this.showNotification(`⚠️ Could not improve prompt`,`error`)}}toggleSuggestions(){let e=this.suggestionBox?.querySelector(`#suggestionsPanel`);e&&(e.style.display=e.style.display===`none`?`block`:`none`)}showLearningOptions(){let e=this.suggestionBox?.querySelector(`#learningPanel`);e&&(e.style.display=`block`,e.innerHTML=`
      <div class="learning-header">📚 Learn Prompt Engineering</div>
      
      <div class="learning-section">
        <div class="section-title">Learning Depth</div>
        <div class="option-buttons">
          <button class="option-btn ${this.helpDepth===`surface`?`active`:``}" data-depth="surface">🌊 Surface</button>
          <button class="option-btn ${this.helpDepth===`deep`?`active`:``}" data-depth="deep">🏊 Deep Dive</button>
        </div>
      </div>

      <div class="learning-section">
        <div class="section-title">Your Experience</div>
        <div class="option-buttons">
          <button class="option-btn ${this.userExperience===`beginner`?`active`:``}" data-exp="beginner">🌱 Beginner</button>
          <button class="option-btn ${this.userExperience===`intermediate`?`active`:``}" data-exp="intermediate">🌿 Intermediate</button>
          <button class="option-btn ${this.userExperience===`advanced`?`active`:``}" data-exp="advanced">🌳 Advanced</button>
        </div>
      </div>

      <div class="learning-resources">
        <div class="resource-item" data-type="basics">📖 Prompt Basics</div>
        <div class="resource-item" data-type="advanced">🎯 Advanced Techniques</div>
        <div class="resource-item" data-type="examples">💡 Examples</div>
      </div>
    `,e.querySelectorAll(`[data-depth]`).forEach(e=>{e.addEventListener(`click`,async e=>{this.helpDepth=e.target.dataset.depth,await chrome.storage.local.set({helpDepth:this.helpDepth}),this.updateActiveButtons(e.target)})}),e.querySelectorAll(`[data-exp]`).forEach(e=>{e.addEventListener(`click`,async e=>{this.userExperience=e.target.dataset.exp,await chrome.storage.local.set({userExperience:this.userExperience}),this.updateActiveButtons(e.target)})}),e.querySelectorAll(`.resource-item`).forEach(e=>{e.addEventListener(`click`,e=>{let t={basics:`https://learnprompting.org/docs/introduction`,advanced:`https://learnprompting.org/docs/intermediate/zero_shot`,examples:`https://github.com/openai/openai-cookbook`};t[e.target.dataset.type]&&window.open(t[e.target.dataset.type],`_blank`)})}))}updateActiveButtons(e){e.parentElement.querySelectorAll(`.option-btn`).forEach(e=>e.classList.remove(`active`)),e.classList.add(`active`)}applySuggestion(e){this.currentInput&&(this.setText(this.currentInput,e),this.showNotification(`✓ Suggestion applied`))}showNotification(e,t=`success`){let n=document.createElement(`div`);n.className=`assistant-notification ${t}`,n.textContent=e,document.body.appendChild(n),requestAnimationFrame(()=>n.classList.add(`show`)),setTimeout(()=>{n.classList.remove(`show`),setTimeout(()=>n.remove(),300)},2500)}deactivateAssistant(){this.isActive=!1,this.suggestionBox&&=(this.suggestionBox.remove(),null),this.currentInput=null}escapeHtml(e){let t=document.createElement(`div`);return t.textContent=e,t.innerHTML}};document.readyState===`loading`?document.addEventListener(`DOMContentLoaded`,()=>new e):new e;})()
