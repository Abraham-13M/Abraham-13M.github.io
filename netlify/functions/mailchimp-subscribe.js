// Mailchimp subscribe Netlify Function (example)
// Expects POST { email: 'user@example.com' }
// Requires MAILCHIMP_API_KEY and MAILCHIMP_LIST_ID env vars
export async function handler(event, context) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  try {
    const data = JSON.parse(event.body || '{}');
    const email = (data.email || '').trim();
    if (!email) return { statusCode: 400, body: 'Email required' };

    const apiKey = process.env.MAILCHIMP_API_KEY;
    const listId = process.env.MAILCHIMP_LIST_ID;
    if (!apiKey || !listId) return { statusCode: 500, body: 'Mailchimp not configured' };

    // Mailchimp API requires datacenter in the URL (apiKey suffixed with -usX)
    const dc = apiKey.split('-')[1];
    const url = `https://${dc}.api.mailchimp.com/3.0/lists/${listId}/members`;

    const body = JSON.stringify({ email_address: email, status: 'pending' }); // 'pending' triggers double opt-in

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `apikey ${apiKey}`
      },
      body
    });

    if (!res.ok) {
      const text = await res.text();
      return { statusCode: res.status || 502, body: 'Mailchimp error: ' + text };
    }

    return { statusCode: 200, body: JSON.stringify({ message: 'Subscribed (pending)' }) };
  } catch (err) {
    return { statusCode: 500, body: String(err) };
  }
}
