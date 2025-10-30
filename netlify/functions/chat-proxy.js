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
  if(!OPENAI_KEY){
    return { statusCode: 500, body: JSON.stringify({ error: 'Server not configured: OPENAI_API_KEY missing' }) };
  }

  try{
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
    return { statusCode: 200, body: JSON.stringify({ answer }) };
  }catch(err){
    return { statusCode: 502, body: JSON.stringify({ error: String(err) }) };
  }
};
