/**
 * DeutschLern - Mobile-First German Learning App Logic
 * Stack: Vanilla ES6+ JS (Fetch API, Web Speech API Speech Recognition & Synthesis, DOM)
 * Version: 4.0.0 — Direct Voice Chat & Audio Readback Integration
 */

// ==================== CONFIGURATION & STATE ====================
const CONFIG = {
    API_BASE_URL: (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:8000'
        : (window.APP_CONFIG?.API_BASE_URL || 'https://learn-germarn.missmaster.workers.dev'),
    USER_ID: 'user_' + Math.random().toString(36).substring(2, 11),
    DEFAULT_LEVEL: 'A1'
};

const state = {
    currentLevel: localStorage.getItem('deutschlern_level') || CONFIG.DEFAULT_LEVEL,
    currentTab: 'chat',
    isLoading: false,
    selectedModel: 'auto',
    chatHistory: []
};

const voiceState = {
    isListening: false,
    autoSpeak: true,
    recognition: null
};

// SVG Vector Icon Templates
const ICONS = {
    bot: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="8" width="16" height="12" rx="2"></rect><path d="M12 8V4H8"></path></svg>`,
    user: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`,
    audio: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`,
    check: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    cross: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
    bulb: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><path d="M9 18h6"></path><path d="M10 22h4"></path><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1.55.59 2.8 1.5 3.5.76.76 1.23 1.52 1.41 2.5"></path></svg>`,
    chat: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`
};

// ==================== DOM CACHE ====================
const DOM = {
    // Header & Navigation
    levelBadgeBtn: document.getElementById('levelBadgeBtn'),
    currentLevelDisplay: document.getElementById('currentLevelDisplay'),
    navItems: document.querySelectorAll('.nav-item'),
    tabContents: document.querySelectorAll('.tab-content'),
    
    // Drawers & Modals
    moreNavBtn: document.getElementById('moreNavBtn'),
    drawerOverlay: document.getElementById('drawerOverlay'),
    drawerModal: document.getElementById('drawerModal'),
    levelOverlay: document.getElementById('levelOverlay'),
    levelModal: document.getElementById('levelModal'),
    levelOptions: document.querySelectorAll('.level-option'),

    // Global Overlays
    loadingOverlay: document.getElementById('loadingOverlay'),
    toastContainer: document.getElementById('toastContainer'),

    // Chat & Voice
    chatMessages: document.getElementById('chatMessages'),
    chatInput: document.getElementById('chatInput'),
    chatSendBtn: document.getElementById('chatSendBtn'),
    voiceMicBtn: document.getElementById('voiceMicBtn'),
    voiceAutoToggle: document.getElementById('voiceAutoToggle'),
    aiModelToggle: document.getElementById('aiModelToggle'),
    suggestionChips: document.querySelectorAll('.suggestion-bar .chip-btn:not(#voiceAutoToggle):not(#aiModelToggle)'),

    // Vocabulary
    vocabInput: document.getElementById('vocabInput'),
    vocabBtn: document.getElementById('vocabBtn'),
    vocabResult: document.getElementById('vocabResult'),

    // Conversation
    scenarioSelect: document.getElementById('scenarioSelect'),
    conversationInput: document.getElementById('conversationInput'),
    conversationBtn: document.getElementById('conversationBtn'),
    conversationResult: document.getElementById('conversationResult'),

    // Translate
    sourceLang: document.getElementById('sourceLang'),
    targetLang: document.getElementById('targetLang'),
    translateInput: document.getElementById('translateInput'),
    translateBtn: document.getElementById('translateBtn'),
    translateResult: document.getElementById('translateResult'),

    // Grammar
    grammarInput: document.getElementById('grammarInput'),
    grammarTopic: document.getElementById('grammarTopic'),
    grammarBtn: document.getElementById('grammarBtn'),
    grammarResult: document.getElementById('grammarResult'),

    // Quiz
    quizTopic: document.getElementById('quizTopic'),
    quizCount: document.getElementById('quizCount'),
    quizBtn: document.getElementById('quizBtn'),
    quizResult: document.getElementById('quizResult'),

    // Writing Correction
    correctInput: document.getElementById('correctInput'),
    correctBtn: document.getElementById('correctBtn'),
    correctResult: document.getElementById('correctResult')
};

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    updateLevelUI(state.currentLevel);
    setupEventListeners();
});

// ==================== UI HELPERS ====================
function updateLevelUI(level) {
    state.currentLevel = level;
    localStorage.setItem('deutschlern_level', level);
    if (DOM.currentLevelDisplay) {
        DOM.currentLevelDisplay.textContent = level;
    }
}

function showLoading(show = true) {
    state.isLoading = show;
    if (DOM.loadingOverlay) {
        DOM.loadingOverlay.style.display = show ? 'flex' : 'none';
    }
}

function showToast(message, duration = 3000) {
    if (!DOM.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    DOM.toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ==================== WEB SPEECH API (TEXT-TO-SPEECH) ====================
function speakGerman(text) {
    if (!('speechSynthesis' in window)) {
        showToast('Speech synthesis not supported on this browser');
        return;
    }

    window.speechSynthesis.cancel();

    const cleanText = text.replace(/[*_#`]/g, '').trim();
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'de-DE';
    utterance.rate = 0.9;

    const voices = window.speechSynthesis.getVoices();
    const deVoice = voices.find(v => v.lang.startsWith('de'));
    if (deVoice) {
        utterance.voice = deVoice;
    }

    window.speechSynthesis.speak(utterance);
    showToast('Playing German audio...');
}

// ==================== NAVIGATION & MODALS ====================
function switchTab(tabId) {
    state.currentTab = tabId;

    DOM.navItems.forEach(item => {
        if (item.dataset.tab === tabId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    DOM.tabContents.forEach(content => {
        if (content.id === tabId) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });

    closeModalSheets();
}

function openDrawer() {
    if (DOM.drawerOverlay && DOM.drawerModal) {
        DOM.drawerOverlay.classList.add('active');
        DOM.drawerModal.classList.add('active');
    }
}

function openLevelModal() {
    if (DOM.levelOverlay && DOM.levelModal) {
        DOM.levelOverlay.classList.add('active');
        DOM.levelModal.classList.add('active');
    }
}

function closeModalSheets() {
    [DOM.drawerOverlay, DOM.drawerModal, DOM.levelOverlay, DOM.levelModal].forEach(el => {
        if (el) el.classList.remove('active');
    });
}

function setupEventListeners() {
    DOM.navItems.forEach(item => {
        item.addEventListener('click', () => {
            const action = item.dataset.action;
            const tab = item.dataset.tab;
            if (action === 'open-drawer') {
                openDrawer();
            } else if (tab) {
                switchTab(tab);
            }
        });
    });

    document.querySelectorAll('.sheet-item-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            if (tab) switchTab(tab);
        });
    });

    if (DOM.levelBadgeBtn) {
        DOM.levelBadgeBtn.addEventListener('click', openLevelModal);
    }
    DOM.levelOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            const level = opt.dataset.level;
            updateLevelUI(level);
            closeModalSheets();
            showToast(`CEFR Level set to ${level}`);
        });
    });

    if (DOM.drawerOverlay) DOM.drawerOverlay.addEventListener('click', closeModalSheets);
    if (DOM.levelOverlay) DOM.levelOverlay.addEventListener('click', closeModalSheets);

    if (DOM.chatSendBtn) DOM.chatSendBtn.addEventListener('click', handleChatSend);
    if (DOM.chatInput) {
        DOM.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleChatSend();
        });
    }

    // Voice Events
    if (DOM.voiceMicBtn) {
        DOM.voiceMicBtn.addEventListener('click', toggleVoiceRecording);
    }
    if (DOM.voiceAutoToggle) {
        DOM.voiceAutoToggle.addEventListener('click', () => {
            voiceState.autoSpeak = !voiceState.autoSpeak;
            if (voiceState.autoSpeak) {
                DOM.voiceAutoToggle.classList.add('active-voice');
                DOM.voiceAutoToggle.querySelector('span').textContent = 'Auto-Speak: ON';
                showToast('Auto Readback enabled');
            } else {
                DOM.voiceAutoToggle.classList.remove('active-voice');
                DOM.voiceAutoToggle.querySelector('span').textContent = 'Auto-Speak: OFF';
                showToast('Auto Readback disabled');
            }
        });
    }
    if (DOM.aiModelToggle) {
        DOM.aiModelToggle.addEventListener('click', () => {
            if (state.selectedModel === 'auto') {
                state.selectedModel = 'gemini';
                DOM.aiModelToggle.querySelector('span').textContent = 'AI: Gemini 2.5';
                showToast('AI Provider: Gemini 2.5 Flash');
            } else if (state.selectedModel === 'gemini') {
                state.selectedModel = 'groq';
                DOM.aiModelToggle.querySelector('span').textContent = 'AI: Groq Llama 3.3';
                showToast('AI Provider: Groq Llama 3.3 70B (Backup)');
            } else {
                state.selectedModel = 'auto';
                DOM.aiModelToggle.querySelector('span').textContent = 'AI: Auto (Gemini/Groq)';
                showToast('AI Provider: Auto Failover (Gemini -> Groq)');
            }
        });
    }

    DOM.suggestionChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const prompt = chip.dataset.prompt;
            if (prompt && DOM.chatInput) {
                DOM.chatInput.value = prompt;
                handleChatSend();
            }
        });
    });

    if (DOM.vocabBtn) DOM.vocabBtn.addEventListener('click', handleVocabulary);
    if (DOM.conversationBtn) DOM.conversationBtn.addEventListener('click', handleConversation);
    if (DOM.translateBtn) DOM.translateBtn.addEventListener('click', handleTranslate);
    if (DOM.grammarBtn) DOM.grammarBtn.addEventListener('click', handleGrammar);
    if (DOM.quizBtn) DOM.quizBtn.addEventListener('click', handleQuiz);
    if (DOM.correctBtn) DOM.correctBtn.addEventListener('click', handleCorrection);

    document.addEventListener('click', (e) => {
        const audioBtn = e.target.closest('.audio-trigger-btn');
        if (audioBtn) {
            const textToSpeak = audioBtn.dataset.text;
            if (textToSpeak) speakGerman(textToSpeak);
        }

        const flashcardBtn = e.target.closest('.save-flashcard-btn');
        if (flashcardBtn) {
            const { word, translation, gender, pronunciation, example } = flashcardBtn.dataset;
            saveToFlashcards(word, translation, gender, pronunciation, example);
        }
    });
}

// ==================== API FETCH HELPER ====================
async function apiCall(endpoint, payload, targetElement = null) {
    if (targetElement) {
        targetElement.innerHTML = `
            <div class="inline-loading-box">
                <div class="typing-indicator">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
                <span>AI is thinking (${state.selectedModel})...</span>
            </div>
        `;
    }

    const bodyPayload = { ...payload, model: state.selectedModel };

    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bodyPayload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Server error occurred');
        }

        return await response.json();
    } catch (err) {
        console.error(`API Error on ${endpoint}:`, err);
        showToast(`Error: ${err.message}`);
        throw err;
    }
}

// ==================== FEATURE HANDLERS ====================

/* 1. Chat Handler */
async function handleChatSend() {
    const text = DOM.chatInput.value.trim();
    if (!text || state.isLoading) return;

    appendChatMessage('user', text);
    DOM.chatInput.value = '';

    const typingRow = appendTypingIndicator();

    try {
        const url = `${CONFIG.API_BASE_URL}/chat?user_id=${encodeURIComponent(CONFIG.USER_ID)}&message=${encodeURIComponent(text)}&model=${encodeURIComponent(state.selectedModel)}`;
        const res = await fetch(url, { method: 'POST' });
        const data = await res.json();
        
        if (typingRow) typingRow.remove();

        if (data.response) {
            appendChatMessage('bot', data.response);
            if (voiceState.autoSpeak) {
                speakGerman(data.response);
            }
        } else {
            appendChatMessage('bot', 'Sorry, I had trouble generating a response.');
        }
    } catch (err) {
        if (typingRow) typingRow.remove();
        appendChatMessage('bot', 'Connection error. Please try again.');
    }
}

function appendTypingIndicator() {
    const row = document.createElement('div');
    row.className = 'msg-row bot typing-indicator-row';

    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.innerHTML = ICONS.bot;

    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';
    bubble.innerHTML = `
        <div class="typing-indicator">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
    `;

    row.appendChild(avatar);
    row.appendChild(bubble);

    DOM.chatMessages.appendChild(row);
    DOM.chatMessages.scrollTop = DOM.chatMessages.scrollHeight;
    return row;
}

function parseMarkdown(text) {
    if (!text) return '';

    let formatted = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    formatted = formatted.replace(/^### (.*$)/gim, '<h5 class="msg-subtitle">$1</h5>');
    formatted = formatted.replace(/^## (.*$)/gim, '<h4 class="msg-title">$1</h4>');
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    formatted = formatted.replace(/_(.*?)_/g, '<em>$1</em>');
    formatted = formatted.replace(/`(.*?)`/g, '<code class="msg-code">$1</code>');

    // Format English translation sub-blocks
    formatted = formatted.replace(/(?:English|\(English\)|Translation):\s*(.*)/gi, '<div class="translation-block"><strong>English:</strong> $1</div>');

    // Bullet points formatting
    const lines = formatted.split('\n');
    let inList = false;
    let result = [];

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (line.startsWith('- ') || line.startsWith('* ')) {
            if (!inList) {
                inList = true;
                result.push('<ul class="msg-list">');
            }
            result.push(`<li>${line.substring(2)}</li>`);
        } else {
            if (inList) {
                inList = false;
                result.push('</ul>');
            }
            result.push(line);
        }
    }
    if (inList) result.push('</ul>');

    formatted = result.join('\n');
    formatted = formatted.replace(/\n\n/g, '<div class="msg-spacer"></div>');
    formatted = formatted.replace(/\n/g, '<br>');

    return formatted;
}

function appendChatMessage(sender, text) {
    const row = document.createElement('div');
    row.className = `msg-row ${sender}`;

    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.innerHTML = sender === 'bot' ? ICONS.bot : ICONS.user;

    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';
    bubble.innerHTML = parseMarkdown(text);

    if (sender === 'bot') {
        const actions = document.createElement('div');
        actions.className = 'chat-actions';
        actions.innerHTML = `
            <button class="action-icon-btn audio-trigger-btn" data-text="${text.replace(/"/g, '&quot;')}" title="Listen to German">
                ${ICONS.audio}
            </button>
        `;
        bubble.appendChild(actions);
    }

    row.appendChild(avatar);
    row.appendChild(bubble);

    DOM.chatMessages.appendChild(row);
    DOM.chatMessages.scrollTop = DOM.chatMessages.scrollHeight;
}

/* 2. Vocabulary Handler */
async function handleVocabulary() {
    const word = DOM.vocabInput.value.trim();
    if (!word) {
        showToast('Please enter a German word');
        return;
    }

    try {
        const data = await apiCall('/vocabulary', { word, language: 'German' }, DOM.vocabResult);
        renderVocabulary(data);
    } catch (err) {}
}

function renderVocabulary(data) {
    if (data.error) {
        DOM.vocabResult.innerHTML = `<div class="result-card"><p style="color:var(--error);">${data.error}</p></div>`;
        return;
    }

    const genderClass = data.gender ? data.gender.toLowerCase() : '';
    let examplesHTML = '';
    if (data.examples && Array.isArray(data.examples)) {
        examplesHTML = data.examples.map(ex => `
            <div class="example-box">
                <div class="example-de">${ex.german || ex}</div>
                ${ex.english ? `<div class="example-en">${ex.english}</div>` : ''}
            </div>
        `).join('');
    }

    DOM.vocabResult.innerHTML = `
        <div class="result-card">
            <div class="vocab-header">
                <div>
                    <div class="vocab-word-title">${data.word || ''}</div>
                    <div style="color:var(--text-secondary); font-size:13px;">${data.translation || ''} • <em>${data.part_of_speech || ''}</em></div>
                </div>
                ${data.gender ? `<span class="gender-badge ${genderClass}">${data.gender}</span>` : ''}
            </div>
            
            <div class="vocab-detail-row">
                ${data.pronunciation ? `<div><strong>Pronunciation:</strong> ${data.pronunciation}</div>` : ''}
                
                <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin-top:6px;">
                    <button class="audio-btn audio-trigger-btn" data-text="${data.word}">
                        ${ICONS.audio}
                        <span>Listen Word</span>
                    </button>

                    <button class="audio-btn save-flashcard-btn" style="background:rgba(234,179,8,0.1); color:var(--warning); border-color:var(--warning);"
                        data-word="${(data.word||'').replace(/"/g, '&quot;')}"
                        data-translation="${(data.translation||'').replace(/"/g, '&quot;')}"
                        data-gender="${data.gender||''}"
                        data-pronunciation="${(data.pronunciation||'').replace(/"/g, '&quot;')}"
                        data-example="${(data.examples?.[0]?.german||'').replace(/"/g, '&quot;')}">
                        ⭐ Save Flashcard
                    </button>
                </div>
                
                ${data.memory_tip ? `
                    <div style="margin-top:10px; background:rgba(99,102,241,0.1); padding:10px; border-radius:8px; font-size:13px; display:flex; gap:8px; align-items:flex-start;">
                        ${ICONS.bulb}
                        <div><strong>Memory Tip:</strong> ${data.memory_tip}</div>
                    </div>
                ` : ''}
                
                <div style="margin-top:12px;">
                    <strong>Examples:</strong>
                    ${examplesHTML}
                </div>
            </div>
        </div>
    `;
}

/* 3. Conversation Handler */
async function handleConversation() {
    const scenario = DOM.scenarioSelect.value;
    const user_input = DOM.conversationInput.value.trim() || 'Hallo!';

    try {
        const data = await apiCall('/conversation', {
            scenario,
            user_input,
            level: state.currentLevel
        }, DOM.conversationResult);
        renderConversation(data);
    } catch (err) {}
}

function renderConversation(data) {
    if (data.error) {
        DOM.conversationResult.innerHTML = `<div class="result-card"><p style="color:var(--error);">${data.error}</p></div>`;
        return;
    }

    DOM.conversationResult.innerHTML = `
        <div class="result-card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <strong style="color:var(--primary);">Partner Response:</strong>
                <button class="audio-btn audio-trigger-btn" data-text="${(data.tutor_response || '').replace(/"/g, '&quot;')}">${ICONS.audio} Listen</button>
            </div>
            <div style="font-size:16px; font-weight:600; margin-bottom:6px;">${data.tutor_response || ''}</div>
            <div style="color:var(--text-secondary); font-size:13px; margin-bottom:14px;">${data.translation || ''}</div>

            ${data.corrections ? `
                <div style="background:rgba(239,68,68,0.1); padding:10px; border-radius:8px; font-size:13px; margin-bottom:10px;">
                    <strong>Grammar Feedback:</strong> ${data.corrections}
                </div>
            ` : ''}

            ${data.suggested_replies && Array.isArray(data.suggested_replies) ? `
                <div style="margin-top:10px;">
                    <strong style="font-size:12px; color:var(--text-muted);">Suggested Next Replies:</strong>
                    <div style="display:flex; flex-direction:column; gap:6px; margin-top:6px;">
                        ${data.suggested_replies.map(reply => `
                            <button class="chip-btn" style="text-align:left; border-radius:8px;" onclick="DOM.conversationInput.value='${reply.replace(/'/g, "\\'")}'; handleConversation();">
                                ${ICONS.chat} ${reply}
                            </button>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
    `;
}

/* 4. Context Translate Handler */
async function handleTranslate() {
    const text = DOM.translateInput.value.trim();
    if (!text) {
        showToast('Please enter text to translate');
        return;
    }

    try {
        const data = await apiCall('/translate', {
            text,
            source_lang: DOM.sourceLang.value,
            target_lang: DOM.targetLang.value
        }, DOM.translateResult);
        renderTranslate(data);
    } catch (err) {}
}

function renderTranslate(data) {
    if (data.error) {
        DOM.translateResult.innerHTML = `<div class="result-card"><p style="color:var(--error);">${data.error}</p></div>`;
        return;
    }

    DOM.translateResult.innerHTML = `
        <div class="result-card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <strong style="color:var(--primary);">Translation:</strong>
                <button class="audio-btn audio-trigger-btn" data-text="${(data.translation || '').replace(/"/g, '&quot;')}">${ICONS.audio} Listen</button>
            </div>
            <div style="font-size:18px; font-weight:700; margin-bottom:12px;">${data.translation || ''}</div>
            
            ${data.grammar_notes ? `<div style="font-size:13px; color:var(--text-secondary); margin-top:8px;">💡 <strong>Notes:</strong> ${data.grammar_notes}</div>` : ''}
        </div>
    `;
}

/* 5. Grammar Explainer Handler */
async function handleGrammar() {
    const question = DOM.grammarInput.value.trim();
    if (!question) {
        showToast('Please enter a grammar question');
        return;
    }

    try {
        const data = await apiCall('/grammar', {
            question,
            topic: DOM.grammarTopic.value.trim() || undefined
        }, DOM.grammarResult);
        renderGrammar(data);
    } catch (err) {}
}

function renderGrammar(data) {
    if (data.error) {
        DOM.grammarResult.innerHTML = `<div class="result-card"><p style="color:var(--error);">${data.error}</p></div>`;
        return;
    }

    let rulesHTML = '';
    if (data.rules && Array.isArray(data.rules)) {
        rulesHTML = data.rules.map(r => `<li style="margin-bottom:4px;">${r}</li>`).join('');
    }

    DOM.grammarResult.innerHTML = `
        <div class="result-card">
            <h4 style="font-family:var(--font-heading); margin-bottom:8px;">${data.topic || 'Grammar Explanation'}</h4>
            <div style="line-height:1.6; margin-bottom:12px;">${data.explanation || ''}</div>
            
            ${rulesHTML ? `<div style="background:var(--bg-elevated); padding:12px; border-radius:8px; font-size:13px;"><strong>Key Rules:</strong><ul style="padding-left:18px; margin-top:6px;">${rulesHTML}</ul></div>` : ''}
        </div>
    `;
}

/* 6. Interactive Quiz Handler */
async function handleQuiz() {
    const topic = DOM.quizTopic.value.trim() || 'General German';
    const count = parseInt(DOM.quizCount.value, 10) || 5;

    try {
        const data = await apiCall('/quiz', {
            topic,
            count,
            level: state.currentLevel
        }, DOM.quizResult);
        renderQuiz(data);
    } catch (err) {}
}

function renderQuiz(data) {
    if (data.error || !data.questions || !Array.isArray(data.questions)) {
        DOM.quizResult.innerHTML = `<div class="result-card"><p style="color:var(--error);">${data.error || 'Could not load quiz questions'}</p></div>`;
        return;
    }

    const questions = data.questions;

    function renderQuestion(idx) {
        const q = questions[idx];
        const optionsHTML = q.options.map((opt, oIdx) => `
            <div class="quiz-option-card" data-idx="${oIdx}" onclick="checkAnswer(${idx}, '${opt.replace(/'/g, "\\'")}', this)">
                <span>${opt}</span>
            </div>
        `).join('');

        DOM.quizResult.innerHTML = `
            <div class="result-card">
                <div style="display:flex; justify-content:space-between; margin-bottom:12px; font-size:12px; color:var(--text-secondary);">
                    <span>Question ${idx + 1} of ${questions.length}</span>
                    <span class="level-chip">${q.difficulty || state.currentLevel}</span>
                </div>
                
                <h4 style="font-size:16px; font-family:var(--font-heading); margin-bottom:14px;">${q.question}</h4>
                
                <div class="quiz-options-list">
                    ${optionsHTML}
                </div>
                
                <div id="quizFeedback" style="margin-top:14px; display:none;"></div>
            </div>
        `;
    }

    window.checkAnswer = function(qIdx, selectedOpt, el) {
        const q = questions[qIdx];
        const isCorrect = (selectedOpt.trim().toLowerCase() === (q.correct_answer || '').trim().toLowerCase());
        
        document.querySelectorAll('.quiz-option-card').forEach(card => card.style.pointerEvents = 'none');
        
        if (isCorrect) {
            el.classList.add('correct');
        } else {
            el.classList.add('incorrect');
        }

        const feedback = document.getElementById('quizFeedback');
        feedback.style.display = 'block';
        feedback.innerHTML = `
            <div style="background:${isCorrect ? 'var(--success-light)' : 'var(--error-light)'}; border:1px solid ${isCorrect ? 'var(--success)' : 'var(--error)'}; padding:12px; border-radius:8px; font-size:13px;">
                <div style="display:flex; align-items:center; gap:6px; font-weight:700; color:${isCorrect ? 'var(--success)' : 'var(--error)'};">
                    ${isCorrect ? ICONS.check + ' Correct (Richtig!)' : ICONS.cross + ' Incorrect (Falsch!)'}
                </div>
                ${!isCorrect ? `<div style="margin-top:4px;">Correct Answer: <strong>${q.correct_answer}</strong></div>` : ''}
                ${q.explanation ? `<small style="display:block; margin-top:4px;">${q.explanation}</small>` : ''}
            </div>
            ${qIdx < questions.length - 1 ? `
                <button class="btn-primary" style="margin-top:12px;" onclick="renderNextQuestion(${qIdx + 1})">Next Question ➔</button>
            ` : `
                <div style="text-align:center; margin-top:14px; font-weight:700; color:var(--success);">Quiz Completed! Excellent work!</div>
            `}
        `;
    };

    window.renderNextQuestion = function(nextIdx) {
        renderQuestion(nextIdx);
    };

    renderQuestion(0);
}

/* 7. Writing Correction Handler */
async function handleCorrection() {
    const text = DOM.correctInput.value.trim();
    if (!text) {
        showToast('Please enter German text to correct');
        return;
    }

    try {
        const data = await apiCall('/correct', {
            text,
            level: state.currentLevel
        }, DOM.correctResult);
        renderCorrection(data, text);
    } catch (err) {}
}

function renderCorrection(data, originalText) {
    if (data.error) {
        DOM.correctResult.innerHTML = `<div class="result-card"><p style="color:var(--error);">${data.error}</p></div>`;
        return;
    }

    DOM.correctResult.innerHTML = `
        <div class="result-card">
            <h4 style="font-family:var(--font-heading); margin-bottom:12px;">Writing Correction Results</h4>
            
            <div class="diff-container">
                <div class="diff-box original">
                    <strong style="color:var(--error);">Your Text:</strong><br>
                    ${originalText}
                </div>
                <div class="diff-box corrected">
                    <strong style="color:var(--success);">Corrected German:</strong>
                    <button class="audio-btn audio-trigger-btn" style="float:right;" data-text="${(data.corrected_text || '').replace(/"/g, '&quot;')}">${ICONS.audio} Listen</button><br>
                    ${data.corrected_text || ''}
                </div>
            </div>

            ${data.feedback ? `<div style="margin-top:14px; background:rgba(99,102,241,0.1); padding:10px; border-radius:8px; font-size:13px;">Feedback: ${data.feedback}</div>` : ''}
        </div>
    `;
}

// ==================== VOICE RECOGNITION CONTROLLER ====================
function initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        return null;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'de-DE';
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => {
        voiceState.isListening = true;
        if (DOM.voiceMicBtn) {
            DOM.voiceMicBtn.classList.add('listening');
        }
        showToast('🎙️ Listening... Speak now in German!');
    };

    recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
        }
        if (DOM.chatInput) {
            DOM.chatInput.value = transcript;
        }
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        voiceState.isListening = false;
        if (DOM.voiceMicBtn) DOM.voiceMicBtn.classList.remove('listening');
        showToast(`Voice Error: ${event.error}`);
    };

    recognition.onend = () => {
        voiceState.isListening = false;
        if (DOM.voiceMicBtn) {
            DOM.voiceMicBtn.classList.remove('listening');
        }
        
        const text = DOM.chatInput ? DOM.chatInput.value.trim() : '';
        if (text) {
            showToast('Sending speech to German Tutor...');
            handleChatSend();
        }
    };

    return recognition;
}

function toggleVoiceRecording() {
    if (!voiceState.recognition) {
        voiceState.recognition = initSpeechRecognition();
    }
    if (!voiceState.recognition) {
        showToast('Speech recognition not supported in this browser. Try Chrome/Edge.');
        return;
    }

    if (voiceState.isListening) {
        voiceState.recognition.stop();
    } else {
        try {
            if (DOM.chatInput) DOM.chatInput.value = '';
            voiceState.recognition.start();
        } catch (e) {
            console.error(e);
        }
    }
}

// ==================== FLASHCARDS CONTROLLER ====================
const flashcardState = {
    cards: JSON.parse(localStorage.getItem('deutschlern_flashcards') || '[]'),
    currentIndex: 0
};

function saveToFlashcards(word, translation, gender, pronunciation, example) {
    if (!word || !translation) return;

    const exists = flashcardState.cards.some(c => c.word.toLowerCase() === word.toLowerCase());
    if (exists) {
        showToast(`'${word}' is already in your Flashcards!`);
        return;
    }

    flashcardState.cards.push({
        word,
        translation,
        gender: gender || '',
        pronunciation: pronunciation || '',
        example: example || '',
        dateSaved: Date.now()
    });

    localStorage.setItem('deutschlern_flashcards', JSON.stringify(flashcardState.cards));
    showToast(`⭐ Saved '${word}' to Flashcards!`);
    renderFlashcards();
}

function renderFlashcards() {
    const countDisplay = document.getElementById('flashcardCountDisplay');
    const deckView = document.getElementById('flashcardDeckView');
    if (!deckView) return;

    const total = flashcardState.cards.length;
    if (countDisplay) {
        countDisplay.textContent = `${total} card${total !== 1 ? 's' : ''} in your deck`;
    }

    if (total === 0) {
        deckView.innerHTML = `
            <div class="result-card" style="text-align:center; padding:40px 20px;">
                <div style="font-size:36px; margin-bottom:12px;">🎴</div>
                <h4 style="font-family:var(--font-heading); margin-bottom:8px;">No Flashcards Saved Yet</h4>
                <p style="color:var(--text-secondary); font-size:13px; margin-bottom:18px;">Search words in the Vocabulary tab and tap "⭐ Save Flashcard" to build your deck!</p>
                <button class="btn-primary" onclick="switchTab('vocabulary')">Search Vocabulary ➔</button>
            </div>
        `;
        return;
    }

    if (flashcardState.currentIndex >= total) {
        flashcardState.currentIndex = 0;
    }

    const card = flashcardState.cards[flashcardState.currentIndex];
    const genderClass = card.gender ? card.gender.toLowerCase() : '';

    deckView.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; font-size:12px; color:var(--text-muted); margin-bottom:8px;">
            <span>Card ${flashcardState.currentIndex + 1} of ${total}</span>
            <span>Tap card to flip</span>
        </div>

        <div class="flashcard-wrapper" onclick="this.classList.toggle('flipped')">
            <div class="flashcard-inner">
                <!-- Front Side -->
                <div class="flashcard-front">
                    <div style="display:flex; justify-content:space-between; width:100%; align-items:center;">
                        <span class="level-chip">German</span>
                        ${card.gender ? `<span class="gender-badge ${genderClass}">${card.gender}</span>` : ''}
                    </div>

                    <div>
                        <div style="font-size:28px; font-family:var(--font-heading); font-weight:800; color:#FFF; margin-bottom:4px;">
                            ${card.word}
                        </div>
                        ${card.pronunciation ? `<div style="color:var(--text-secondary); font-size:14px;">[${card.pronunciation}]</div>` : ''}
                    </div>

                    <div style="display:flex; gap:8px; align-items:center;">
                        <button class="audio-btn audio-trigger-btn" data-text="${card.word}" onclick="event.stopPropagation();">
                            ${ICONS.audio} Listen
                        </button>
                        <span style="font-size:12px; color:var(--text-muted);">🔄 Tap to flip</span>
                    </div>
                </div>

                <!-- Back Side -->
                <div class="flashcard-back">
                    <div style="display:flex; justify-content:space-between; width:100%; align-items:center;">
                        <span class="level-chip" style="background:rgba(16,185,129,0.15); color:var(--success);">English</span>
                    </div>

                    <div>
                        <div style="font-size:24px; font-family:var(--font-heading); font-weight:700; color:var(--primary-light); margin-bottom:8px;">
                            ${card.translation}
                        </div>
                        ${card.example ? `<div style="font-size:13px; color:var(--text-secondary); line-height:1.5;">"${card.example}"</div>` : ''}
                    </div>

                    <span style="font-size:12px; color:var(--text-muted);">🔄 Tap to flip back</span>
                </div>
            </div>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:12px; gap:8px;">
            <button class="chip-btn" onclick="prevFlashcard()" ${flashcardState.currentIndex === 0 ? 'disabled style="opacity:0.4;"' : ''}>
                ⬅️ Previous
            </button>
            
            <button class="chip-btn" style="color:var(--error); border-color:rgba(239,68,68,0.3);" onclick="removeFlashcard(${flashcardState.currentIndex})">
                🗑️ Remove
            </button>
            
            <button class="chip-btn" onclick="nextFlashcard()" ${flashcardState.currentIndex === total - 1 ? 'disabled style="opacity:0.4;"' : ''}>
                Next ➡️
            </button>
        </div>
    `;
}

function prevFlashcard() {
    if (flashcardState.currentIndex > 0) {
        flashcardState.currentIndex--;
        renderFlashcards();
    }
}

function nextFlashcard() {
    if (flashcardState.currentIndex < flashcardState.cards.length - 1) {
        flashcardState.currentIndex++;
        renderFlashcards();
    }
}

function removeFlashcard(index) {
    const card = flashcardState.cards[index];
    flashcardState.cards.splice(index, 1);
    localStorage.setItem('deutschlern_flashcards', JSON.stringify(flashcardState.cards));
    showToast(`Removed '${card.word}' from Flashcards`);
    if (flashcardState.currentIndex >= flashcardState.cards.length) {
        flashcardState.currentIndex = Math.max(0, flashcardState.cards.length - 1);
    }
    renderFlashcards();
}

function clearFlashcardDeck() {
    if (confirm('Are you sure you want to clear your saved flashcards?')) {
        flashcardState.cards = [];
        flashcardState.currentIndex = 0;
        localStorage.removeItem('deutschlern_flashcards');
        showToast('Flashcard deck cleared');
        renderFlashcards();
    }
}

// Global functions for inline HTML events
window.saveToFlashcards = saveToFlashcards;
window.prevFlashcard = prevFlashcard;
window.nextFlashcard = nextFlashcard;
window.removeFlashcard = removeFlashcard;

// Attach Flashcards & PWA initializations on page load
document.addEventListener('DOMContentLoaded', () => {
    renderFlashcards();
    const clearBtn = document.getElementById('clearDeckBtn');
    if (clearBtn) clearBtn.addEventListener('click', clearFlashcardDeck);
    initPwaInstaller();
    initMobileKeyboardAdjuster();
});

// ==================== PWA INSTALL & SERVICE WORKER CONTROLLER ====================
let deferredPwaPrompt = null;

function initPwaInstaller() {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPwaPrompt = e;
        if (DOM.pwaInstallBtn) {
            DOM.pwaInstallBtn.style.display = 'flex';
        }
    });

    if (DOM.pwaInstallBtn) {
        DOM.pwaInstallBtn.addEventListener('click', async () => {
            if (!deferredPwaPrompt) return;
            deferredPwaPrompt.prompt();
            const { outcome } = await deferredPwaPrompt.userChoice;
            if (outcome === 'accepted') {
                showToast('🎉 DeutschLern installed successfully!');
            }
            deferredPwaPrompt = null;
            DOM.pwaInstallBtn.style.display = 'none';
        });
    }

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js').catch(err => {
                console.log('Service Worker registration skipped/failed:', err);
            });
        });
    }
}

// ==================== MOBILE VIRTUAL KEYBOARD ADJUSTER ====================
function initMobileKeyboardAdjuster() {
    if (!window.visualViewport) return;

    const bottomNav = document.querySelector('.bottom-nav');
    const inputDock = document.querySelector('.input-dock');
    const chatInput = document.getElementById('chatInput');
    const chatWrapper = document.querySelector('.chat-wrapper');

    const handleViewportResize = () => {
        const viewportHeight = window.visualViewport.height;
        const windowHeight = window.innerHeight;
        const keyboardHeight = windowHeight - viewportHeight;

        if (keyboardHeight > 120) {
            // Virtual keyboard is OPEN
            document.body.classList.add('keyboard-open');
            if (bottomNav) bottomNav.style.transform = 'translateY(120%)';
            if (inputDock) {
                inputDock.style.position = 'fixed';
                inputDock.style.bottom = `${keyboardHeight + 8}px`;
                inputDock.style.left = '16px';
                inputDock.style.right = '16px';
                inputDock.style.zIndex = '999';
                inputDock.style.maxWidth = '900px';
                inputDock.style.margin = '0 auto';
            }
            if (chatWrapper) {
                chatWrapper.style.paddingBottom = '70px';
            }
            if (chatInput && document.activeElement === chatInput) {
                setTimeout(() => {
                    chatInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
            }
        } else {
            // Virtual keyboard is CLOSED
            document.body.classList.remove('keyboard-open');
            if (bottomNav) bottomNav.style.transform = '';
            if (inputDock) {
                inputDock.style.position = '';
                inputDock.style.bottom = '';
                inputDock.style.left = '';
                inputDock.style.right = '';
                inputDock.style.zIndex = '';
            }
            if (chatWrapper) {
                chatWrapper.style.paddingBottom = '';
            }
        }
    };

    window.visualViewport.addEventListener('resize', handleViewportResize);
    window.visualViewport.addEventListener('scroll', handleViewportResize);

    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            setTimeout(handleViewportResize, 200);
            setTimeout(() => {
                input.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        });
        input.addEventListener('blur', () => {
            setTimeout(handleViewportResize, 200);
        });
    });
}
