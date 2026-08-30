// POST /api/contact — sends the Storm Dispatch form via SendGrid.
// Required env: SENDGRID_API_KEY, CONTACT_TO, CONTACT_FROM (a SendGrid-verified sender).
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'method_not_allowed' });
    return;
  }
  const b = req.body || {};
  // Honeypot: bots fill the hidden "website" field — pretend success, send nothing.
  if (b.website) {
    res.status(200).json({ ok: true });
    return;
  }
  const name = String(b.name || '').trim().slice(0, 200);
  const email = String(b.email || '').trim().slice(0, 200);
  const needs = String(b.needs || '').trim().slice(0, 300);
  const message = String(b.message || '').trim().slice(0, 5000);
  if (!email && !message) {
    res.status(400).json({ ok: false, error: 'empty' });
    return;
  }

  const key = process.env.SENDGRID_API_KEY;
  const to = process.env.CONTACT_TO;
  const from = process.env.CONTACT_FROM;
  if (!key || !to || !from) {
    res.status(503).json({ ok: false, error: 'unconfigured' });
    return;
  }

  const text = [
    'New project inquiry from rain.ceo',
    '',
    'Name:       ' + (name || '—'),
    'Email:      ' + (email || '—'),
    'Needs rain: ' + (needs || '—'),
    '',
    'The situation:',
    message || '—',
  ].join('\n');

  const payload = {
    personalizations: [{ to: [{ email: to }] }],
    from: { email: from, name: 'Rain — Storm Dispatch' },
    subject: 'New project inquiry' + (name ? ' — ' + name : '') + (needs ? ' (' + needs + ')' : ''),
    content: [{ type: 'text/plain', value: text }],
  };
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    payload.reply_to = name ? { email, name } : { email };
  }

  try {
    const r = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (r.status === 202) {
      res.status(200).json({ ok: true });
    } else {
      console.error('sendgrid_error', r.status, (await r.text()).slice(0, 500));
      res.status(502).json({ ok: false, error: 'send_failed' });
    }
  } catch (err) {
    console.error('sendgrid_exception', err);
    res.status(502).json({ ok: false, error: 'send_failed' });
  }
};
