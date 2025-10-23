// MailerLite subscribe Netlify Function
// Expects POST { email: 'user@example.com' }
// Requires environment variable MAILERLITE_API_KEY and optionally MAILERLITE_GROUP_ID
export async function handler(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const data = JSON.parse(event.body || '{}');
    const email = (data.email || '').trim();
    if (!email) return { statusCode: 400, body: 'Email required' };

    const apiKey = process.env.MAILERLITE_API_KEY;
    const groupId = process.env.MAILERLITE_GROUP_ID; // optional
    if (!apiKey) {
      return { statusCode: 500, body: 'MailerLite API key not configured' };
    }

    const body = { email };
    if (groupId) body.group_id = groupId;

    const res = await fetch('https://api.mailerlite.com/api/v2/subscribers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-MailerLite-ApiKey': apiKey
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const text = await res.text();
      return { statusCode: res.status || 502, body: 'MailerLite error: ' + text };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Subscribed' })
    };
  } catch (err) {
    return { statusCode: 500, body: String(err) };
  }
}
