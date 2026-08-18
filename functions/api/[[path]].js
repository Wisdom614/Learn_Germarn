/**
 * Cloudflare Worker / Pages Function for DeutschLern Backend API
 * Global Edge Runtime — 0ms Cold Start, Never Sleeps, 100k Free Requests/Day
 * Model: Google Gemini 2.5 Flash API
 */

export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/api/, '');

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: corsHeaders()
        });
    }

    // Health check endpoint
    if (request.method === 'GET' && (path === '/health' || path === '' || path === '/')) {
        return jsonResponse({
            status: 'healthy',
            model: 'gemini-2.5-flash',
            provider: 'Cloudflare Workers Edge'
        });
    }

    // API Key verification from Cloudflare Environment Variables
    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
        return jsonResponse({ error: "GEMINI_API_KEY environment variable is not set in Cloudflare Settings." }, 500);
    }

    try {
        let payload = {};
        if (request.method === 'POST') {
            try {
                payload = await request.json();
            } catch (e) {}
        }

        // Route requests
        if (path === '/vocabulary') {
            const word = payload.word || 'Haus';
            const prompt = `You are a German tutor. For the word "${word}" in German, return JSON with keys: word, translation, part_of_speech, gender (der/die/das), pronunciation, examples (array of objects with german and english keys), memory_tip. Return ONLY valid JSON, no markdown formatting.`;
            const geminiRes = await callGemini(prompt, apiKey);
            return jsonResponse(cleanJson(geminiRes));
        }

        if (path === '/grammar') {
            const question = payload.question || '';
            const topic = payload.topic || 'German Grammar';
            const prompt = `You are a German tutor. Explain this grammar question: "${question}" (Topic: ${topic}). Return JSON with keys: topic, explanation, rules (array of strings). Return ONLY valid JSON, no markdown formatting.`;
            const geminiRes = await callGemini(prompt, apiKey);
            return jsonResponse(cleanJson(geminiRes));
        }

        if (path === '/conversation') {
            const scenario = payload.scenario || 'restaurant';
            const userInput = payload.user_input || 'Hallo!';
            const level = payload.level || 'A1';
            const prompt = `You are a German tutor at ${level} level in a ${scenario} scenario. Student said: "${userInput}". Return JSON with keys: tutor_response, translation, corrections, suggested_replies (array of 3 short German strings). Return ONLY valid JSON, no markdown formatting.`;
            const geminiRes = await callGemini(prompt, apiKey);
            return jsonResponse(cleanJson(geminiRes));
        }

        if (path === '/translate') {
            const text = payload.text || '';
            const sourceLang = payload.source_lang || 'German';
            const targetLang = payload.target_lang || 'English';
            const prompt = `Translate this text from ${sourceLang} to ${targetLang} with context notes: "${text}". Return JSON with keys: translation, grammar_notes. Return ONLY valid JSON, no markdown formatting.`;
            const geminiRes = await callGemini(prompt, apiKey);
            return jsonResponse(cleanJson(geminiRes));
        }

        if (path === '/quiz') {
            const topic = payload.topic || 'General German';
            const count = payload.count || 5;
            const level = payload.level || 'A1';
            const prompt = `Generate a ${count}-question quiz about "${topic}" for German level ${level}. Return JSON with key: questions (array of objects with question, options (array of 4 choices), correct_answer, explanation, difficulty). Return ONLY valid JSON, no markdown formatting.`;
            const geminiRes = await callGemini(prompt, apiKey);
            return jsonResponse(cleanJson(geminiRes));
        }

        if (path === '/correct') {
            const text = payload.text || '';
            const level = payload.level || 'A1';
            const prompt = `Correct this German text written by an ${level} student: "${text}". Return JSON with keys: corrected_text, feedback. Return ONLY valid JSON, no markdown formatting.`;
            const geminiRes = await callGemini(prompt, apiKey);
            return jsonResponse(cleanJson(geminiRes));
        }

        if (path === '/chat') {
            const message = url.searchParams.get('message') || payload.message || 'Hallo';
            const prompt = `You are an encouraging German tutor. Student says: "${message}". Respond in German first, followed by English translation. Keep response concise and helpful.`;
            const geminiRes = await callGemini(prompt, apiKey);
            return jsonResponse({ response: geminiRes });
        }

        return jsonResponse({ error: 'Endpoint not found' }, 404);

    } catch (err) {
        return jsonResponse({ error: err.message }, 500);
    }
}

// Call Google Gemini 2.5 Flash REST API
async function callGemini(prompt, apiKey) {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// Utility: Clean JSON output from Gemini response
function cleanJson(text) {
    if (!text) return { error: "Empty response" };
    let clean = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
    try {
        return JSON.parse(clean);
    } catch (e) {
        const match = clean.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        if (match) {
            try { return JSON.parse(match[0]); } catch (e2) {}
        }
        return { error: "Could not parse JSON", raw: text };
    }
}

// Utility: Standard CORS headers
function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
}

// Utility: Standard JSON response
function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            ...corsHeaders()
        }
    });
}
