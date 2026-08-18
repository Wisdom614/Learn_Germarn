/**
 * Standalone Cloudflare Worker Backend API for DeutschLern
 * Multi-Model Failover Architecture:
 * - Primary AI: Google Gemini 2.5 Flash (gemini-2.5-flash)
 * - Backup AI: Groq Llama 3.3 70B (llama-3.3-70b-versatile)
 * 0ms Cold Start, Auto-Failover on Quota Limit, 100k Free Requests/Day
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders()
      });
    }

    // Health check endpoint
    if (request.method === 'GET' && (path === '/health' || path === '/' || path === '')) {
      return jsonResponse({
        status: 'healthy',
        primary_model: 'gemini-2.5-flash',
        backup_model: 'llama-3.3-70b-versatile (Groq)',
        provider: 'Cloudflare Worker Multi-Model Edge Engine'
      });
    }

    try {
      let payload = {};
      if (request.method === 'POST') {
        try {
          payload = await request.json();
        } catch (e) {}
      }

      const modelChoice = payload.model || url.searchParams.get('model') || 'auto';

      if (path === '/vocabulary') {
        const word = payload.word || 'Haus';
        const prompt = `You are a German tutor. For the word "${word}" in German, return JSON with keys: word, translation, part_of_speech, gender (der/die/das), pronunciation, examples (array of objects with german and english keys), memory_tip. Return ONLY valid JSON, no markdown formatting.`;
        const aiRes = await callAI(prompt, env, 1000, modelChoice);
        return jsonResponse(cleanJson(aiRes));
      }

      if (path === '/grammar') {
        const question = payload.question || '';
        const topic = payload.topic || 'German Grammar';
        const prompt = `You are a German tutor. Explain this grammar question: "${question}" (Topic: ${topic}). Return JSON with keys: topic, explanation, rules (array of strings). Return ONLY valid JSON, no markdown formatting.`;
        const aiRes = await callAI(prompt, env, 1000, modelChoice);
        return jsonResponse(cleanJson(aiRes));
      }

      if (path === '/conversation') {
        const scenario = payload.scenario || 'restaurant';
        const userInput = payload.user_input || 'Hallo!';
        const level = payload.level || 'A1';
        const prompt = `You are a German tutor at ${level} level in a ${scenario} scenario. Student said: "${userInput}". Return JSON with keys: tutor_response, translation, corrections, suggested_replies (array of 3 short German strings). Return ONLY valid JSON, no markdown formatting.`;
        const aiRes = await callAI(prompt, env, 1000, modelChoice);
        return jsonResponse(cleanJson(aiRes));
      }

      if (path === '/translate') {
        const text = payload.text || '';
        const sourceLang = payload.source_lang || 'German';
        const targetLang = payload.target_lang || 'English';
        const prompt = `Translate this text from ${sourceLang} to ${targetLang} with context notes: "${text}". Return JSON with keys: translation, grammar_notes. Return ONLY valid JSON, no markdown formatting.`;
        const aiRes = await callAI(prompt, env, 1000, modelChoice);
        return jsonResponse(cleanJson(aiRes));
      }

      if (path === '/quiz') {
        const topic = payload.topic || 'General German';
        const count = payload.count || 5;
        const level = payload.level || 'A1';
        const prompt = `Generate a ${count}-question quiz about "${topic}" for German level ${level}. Return JSON with key: questions (array of objects with question, options (array of 4 choices), correct_answer, explanation, difficulty). Return ONLY valid JSON, no markdown formatting.`;
        const aiRes = await callAI(prompt, env, 1200, modelChoice);
        return jsonResponse(cleanJson(aiRes));
      }

      if (path === '/correct') {
        const text = payload.text || '';
        const level = payload.level || 'A1';
        const prompt = `Correct this German text written by an ${level} student: "${text}". Return JSON with keys: corrected_text, feedback. Return ONLY valid JSON, no markdown formatting.`;
        const aiRes = await callAI(prompt, env, 1000, modelChoice);
        return jsonResponse(cleanJson(aiRes));
      }

      if (path === '/chat') {
        const message = url.searchParams.get('message') || payload.message || 'Hallo';
        const prompt = `You are an encouraging German tutor. Student says: "${message}". Respond in German first, followed by English translation. Keep response concise and helpful.`;
        const aiRes = await callAI(prompt, env, 400, modelChoice);
        return jsonResponse({ response: aiRes });
      }

      return jsonResponse({ error: 'Endpoint not found' }, 404);

    } catch (err) {
      return jsonResponse({ error: err.message }, 500);
    }
  }
};

/**
 * Multi-Model Execution Engine with Automatic Failover:
 * 1. Tries Primary (Gemini 2.5 Flash)
 * 2. If Gemini fails or hits quota limits -> Fails over to Backup (Groq Llama 3.3 70B)
 */
async function callAI(prompt, env, maxTokens = 1000, modelChoice = 'auto') {
  const geminiKey = env.GEMINI_API_KEY || (env.API_KEY_PART1 && env.API_KEY_PART2 ? (env.API_KEY_PART1 + env.API_KEY_PART2) : "");
  const groqKey = env.GROQ_API_KEY || (env.GROQ_KEY_PART1 && env.GROQ_KEY_PART2 ? (env.GROQ_KEY_PART1 + env.GROQ_KEY_PART2) : "");

  // If user explicitly requested Groq
  if (modelChoice === 'groq') {
    return await callGroq(prompt, groqKey, maxTokens);
  }

  // If user explicitly requested Gemini
  if (modelChoice === 'gemini') {
    return await callGemini(prompt, geminiKey, maxTokens);
  }

  // AUTO Mode: Try Gemini first, failover to Groq if Gemini hits quota/error
  try {
    const geminiRes = await callGemini(prompt, geminiKey, maxTokens);
    if (geminiRes && !geminiRes.startsWith('[Gemini Error')) {
      return geminiRes;
    }
    console.warn("Gemini API hit limit or error. Failing over to Groq Llama 3.3 70B...");
  } catch (err) {
    console.warn("Gemini Exception. Failing over to Groq Llama 3.3 70B:", err.message);
  }

  // Backup Failover Provider: Groq Llama 3.3 70B
  return await callGroq(prompt, groqKey, maxTokens);
}

// 1. Primary AI Provider: Google Gemini 2.5 Flash
async function callGemini(prompt, apiKey, maxTokens = 1000) {
  try {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: maxTokens
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Gemini API Error ${response.status}:`, errorText);
      return `[Gemini Error ${response.status}] ${errorText}`;
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return "Hallo! Ich bin dein Deutsch-Tutor. Wie kann ich dir heute helfen?";
    }
    return text;
  } catch (e) {
    console.error("callGemini Exception:", e);
    return `[Gemini Exception] ${e.message}`;
  }
}

// 2. Backup AI Provider: Groq Llama 3.3 70B
async function callGroq(prompt, apiKey, maxTokens = 1000) {
  try {
    const groqUrl = 'https://api.groq.com/openai/v1/chat/completions';
    const response = await fetch(groqUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Groq API Error ${response.status}:`, errorText);
      return `[Groq Error ${response.status}] ${errorText}`;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'Hallo! Wie kann ich dir helfen?';
  } catch (e) {
    console.error("callGroq Exception:", e);
    return `[Groq Exception] ${e.message}`;
  }
}

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

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders()
    }
  });
}
