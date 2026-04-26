// background.js - Service worker (type: "module")

// Default prompt improvement logic (fallback when no API key)
const defaultImprovements = {
    beginner: {
        surface: (text) => `Please ${text.toLowerCase().replace(/^\w/, c => c.toUpperCase())}. Can you provide a clear, step-by-step answer?`,
        deep: (text) => `I need help with: ${text}. Please provide a comprehensive explanation with examples, context, and practical applications. Break down complex concepts into understandable parts.`
    },
    intermediate: {
        surface: (text) => `${text} - Please provide a concise yet complete response with key details.`,
        deep: (text) => `${text}. Provide an in-depth analysis including: 1) Core concepts 2) Practical examples 3) Common pitfalls 4) Best practices 5) Advanced considerations.`
    },
    advanced: {
        surface: (text) => `${text} [Technical depth required, assume domain expertise]`,
        deep: (text) => `${text}. Provide expert-level analysis with: technical depth, edge cases, optimization strategies, trade-offs, and references to relevant literature or frameworks.`
    }
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    handleMessage(request, sender, sendResponse);
    return true; // Keep channel open for async
});

async function handleMessage(request, sender, sendResponse) {
    try {
        switch (request.action) {
            case 'analyzePrompt':
                const analysisResult = await analyzePrompt(request.text, request.experienceLevel, request.depth);
                sendResponse(analysisResult);
                break;

            case 'improvePrompt':
                const improved = await improvePrompt(request.text, request.experienceLevel, request.depth);
                sendResponse({ improved });
                break;

            case 'tailorPrompt':
                const tailored = await tailorPrompt(request.text, request.tailoringData);
                sendResponse({ improved: tailored });
                break;

            case 'settingsUpdated':
                console.log('Settings updated in background:', request.settings);
                sendResponse({ success: true });
                break;

            default:
                sendResponse({ error: 'Unknown action' });
        }
    } catch (error) {
        console.error('Background error:', error);
        sendResponse({ error: error.message });
    }
}

async function analyzePrompt(text, experienceLevel, depth) {
    const suggestions = [];

    // Basic heuristics
    if (text.length < 25) {
        suggestions.push({ text: "Add more context and specifics", type: "clarity" });
    }

    if (!/[.?!]$/.test(text.trim())) {
        suggestions.push({ text: "End with a clear question or request", type: "structure" });
    }

    if (experienceLevel === 'beginner') {
        suggestions.push({ text: "Specify your desired output format", type: "beginner-tip" });
    }

    if (depth === 'deep') {
        suggestions.push({ text: "Include examples to illustrate your request", type: "advanced" });
    }

    // Try AI analysis if API key available
    const settings = await chrome.storage.local.get(['apiKey', 'provider']);
    if (settings.apiKey && settings.provider === 'openai') {
        try {
            const systemPrompt = `Analyze the user's prompt. Return a JSON object with:
1. "suggestions": Array of 2-3 short actionable text improvements.
2. "tailoring": Array of 3-4 multiple-choice questions specifically tailored to the task type to help the user refine their prompt.
- The questions MUST dynamically adapt to the user's goal.
- For example: If they want to learn a subject, ask about Roleplay styles, target audience, or learning format. If they are coding a game, ask about programming language, game engine, or mechanics.
- Each item must have: "category" (short string), "options" (Array of 3-5 short strings).`;
            const aiResponseStr = await callOpenAIJSON(systemPrompt, `Prompt: "${text}"`, settings.apiKey);
            if (aiResponseStr) {
                const aiData = JSON.parse(aiResponseStr);
                if (aiData.suggestions && Array.isArray(aiData.suggestions)) {
                    const aiSuggestions = aiData.suggestions.map(s => ({ text: s, type: 'ai' }));
                    suggestions.push(...aiSuggestions);
                }
                const tailoringOptions = aiData.tailoring || [];
                return { suggestions: suggestions.slice(0, 4), tailoringOptions };
            }
        } catch (e) {
            console.debug('AI analysis skipped or parsing failed:', e);
        }
    }

    return { suggestions: suggestions.slice(0, 4), tailoringOptions: [] }; // Limit suggestions
}

async function improvePrompt(text, experienceLevel, depth) {
    const settings = await chrome.storage.local.get(['apiKey', 'provider', 'endpoint']);

    // Try AI improvement first if configured
    if (settings.apiKey) {
        try {
            if (settings.provider === 'openai') {
                return await callOpenAI(
                    `Improve this prompt for clarity and effectiveness. User level: ${experienceLevel}, depth: ${depth}. Prompt: "${text}"`,
                    settings.apiKey
                );
            } else if (settings.provider === 'anthropic') {
                return await callAnthropic(
                    `Improve this prompt: "${text}" for a ${experienceLevel} user wanting ${depth} help.`,
                    settings.apiKey
                );
            } else if (settings.provider === 'local' && settings.endpoint) {
                return await callCustomEndpoint(settings.endpoint, text, settings.apiKey);
            }
        } catch (e) {
            console.debug('AI improvement failed, using fallback:', e);
        }
    }

    // Fallback to rule-based improvement
    const level = defaultImprovements[experienceLevel] || defaultImprovements.beginner;
    const fn = level[depth] || level.surface;
    return fn(text);
}

async function tailorPrompt(text, tailoringData) {
    const settings = await chrome.storage.local.get(['apiKey', 'provider', 'endpoint']);

    if (settings.apiKey && settings.provider === 'openai') {
        try {
            const tailoringParams = Object.entries(tailoringData).map(([cat, val]) => `${cat}: ${val}`).join(', ');
            return await callOpenAI(
                `Rewrite and improve the following prompt based on these specific constraints: ${tailoringParams}.\n\nOriginal Prompt: "${text}"`,
                settings.apiKey
            );
        } catch (e) {
            console.debug('AI tailoring failed:', e);
        }
    }
    
    // Fallback
    return text;
}

async function callOpenAI(prompt, apiKey) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: 'You are a prompt engineering expert. Return ONLY the improved prompt, no explanations.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.3,
            max_tokens: 500
        })
    });

    if (!response.ok) throw new Error(`OpenAI error: ${response.status}`);
    const data = await response.json();
    return data.choices[0]?.message?.content?.trim();
}

async function callOpenAIJSON(systemPrompt, userPrompt, apiKey) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            response_format: { type: "json_object" },
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.3,
            max_tokens: 500
        })
    });

    if (!response.ok) throw new Error(`OpenAI error: ${response.status}`);
    const data = await response.json();
    return data.choices[0]?.message?.content?.trim();
}

async function callAnthropic(prompt, apiKey) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 500,
            messages: [
                { role: 'user', content: `Improve this prompt (return only the improved version): ${prompt}` }
            ]
        })
    });

    if (!response.ok) throw new Error(`Anthropic error: ${response.status}`);
    const data = await response.json();
    return data.content[0]?.text?.trim();
}

async function callCustomEndpoint(endpoint, prompt, apiKey) {
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
        },
        body: JSON.stringify({
            prompt: `Improve this prompt: ${prompt}`,
            max_tokens: 500
        })
    });

    if (!response.ok) throw new Error(`Custom endpoint error: ${response.status}`);
    const data = await response.json();
    return data.response || data.text || data.choices?.[0]?.message?.content;
}

// Open options page when extension icon clicked (if no popup)
chrome.action.onClicked.addListener(() => {
    chrome.runtime.openOptionsPage();
});