// api/payments/index.js
const setCORS = (res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-callback-token");
};

export default async function handler(req, res) {
  setCORS(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { amount, order_id } = req.body || {};
    const amt = Number(amount);
    if (!amt || amt <= 0) return res.status(400).json({ error: "amount wajib > 0" });

    const reference_id = String(order_id || `ORD-${Date.now()}`);
    const basic = Buffer.from(`${process.env.XENDIT_SECRET}:`).toString("base64");

    const r = await fetch("https://api.xendit.co/qr_codes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${basic}`
      },
      body: JSON.stringify({
        reference_id,
        type: "DYNAMIC",
        currency: "IDR",
        amount: amt
      })
    });

    if (!r.ok) {
      const err = await r.text();
      return res.status(502).json({ error: "xendit_error", detail: err });
    }

    const data = await r.json();
    return res.status(200).json({
      id: data.id,
      reference_id: data.reference_id,
      amount: data.amount,
      currency: data.currency,
      status: data.status,
      expires_at: data.expires_at,
      qris: {
        qr_string: data.qr_string,
        qr_image_url: data.image_url // kadang field ini "image_url"
      }
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "server_error" });
  }
}