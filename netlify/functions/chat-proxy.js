// Netlify Function: simple proxy to OpenAI Chat Completions
// To enable: set environment variable OPENAI_API_KEY on Netlify (or locally for testing)
// This function expects a POST { question: string } and will return { answer }
// WARNING: Keep your API key secret. Do not commit keys into the repo.

exports.handler = async function(event, context) {
  if(event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  let body = {};
  try{ body = JSON.parse(event.body || '{}'); }catch(e){ return { statusCode:400, body: 'Invalid JSON' }; }
  const question = (body.question || '').toString().trim();
  if(!question) return { statusCode: 400, body: 'Missing question' };

  const OPENAI_KEY = process.env.OPENAI_API_KEY;
  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

  // Prefer Anthropic Claude Sonnet 4 if ANTHROPIC_API_KEY is provided, otherwise fall back to OpenAI
  try{
    if(ANTHROPIC_KEY){
      // Anthropic Responses API (best-effort shape). Configure ANTHROPIC_API_KEY in Netlify env vars.
      // NOTE: If Anthropic changed their request format, adjust this body accordingly.
      const aResp = await fetch('https://api.anthropic.com/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_KEY
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4',
          // `input` is a common field in Anthropic's Responses API; adjust if the API you use differs.
          input: `Eres un asistente para una tienda herbolario. Responde brevemente, sugiere productos del catálogo cuando sea relevante y siempre ofrece un enlace si existe. Pregunta del usuario: ${question}`,
          max_tokens_to_sample: 600,
          temperature: 0.2
        })
      });
      const aData = await aResp.json().catch(()=> null);
      // Try common fields for output
      const anthropicText = (aData && (aData.output && aData.output[0] && aData.output[0].content && aData.output[0].content[0] && aData.output[0].content[0].text))
        || (aData && aData.completion) || (aData && aData.output && aData.output_text) || JSON.stringify(aData);
      return { statusCode: 200, body: JSON.stringify({ answer: anthropicText, provider: 'anthropic' }) };
    }

    if(!OPENAI_KEY){
      return { statusCode: 500, body: JSON.stringify({ error: 'Server not configured: neither OPENAI_API_KEY nor ANTHROPIC_API_KEY present' }) };
    }

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'Eres un asistente útil para una tienda herbolario. Responde brevemente, sugiere productos del catálogo cuando sea relevante y siempre ofrece un enlace si existe.' },
          { role: 'user', content: question }
        ],
        max_tokens: 400,
        temperature: 0.2
      })
    });
    const data = await resp.json();
    // extract text
    const answer = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content ? data.choices[0].message.content : JSON.stringify(data);
    return { statusCode: 200, body: JSON.stringify({ answer, provider: 'openai' }) };
  }catch(err){
    return { statusCode: 502, body: JSON.stringify({ error: String(err) }) };
  }
};
