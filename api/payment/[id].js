// api/payments/id.js
const setCORS = (res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-callback-token");
};

export default async function handler(req, res) {
  setCORS(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { id } = req.query || {};
  if (!id) return res.status(400).json({ error: "id kosong" });

  try {
    const basic = Buffer.from(`${process.env.XENDIT_SECRET}:`).toString("base64");

    // Jika id sudah berupa qr_id (prefix "qr_"), panggil detail by id.
    // Jika bukan, treat as reference_id.
    const url = String(id).startsWith("qr_")
      ? `https://api.xendit.co/qr_codes/${id}`
      : `https://api.xendit.co/qr_codes?reference_id=${encodeURIComponent(id)}`;

    const r = await fetch(url, {
      headers: { Authorization: `Basic ${basic}` }
    });

    if (!r.ok) {
      const err = await r.text();
      return res.status(502).json({ error: "xendit_error", detail: err });
    }

    let data = await r.json();
    // kalau pakai reference_id, Xendit balikin array
    if (Array.isArray(data)) data = data[0] || null;

    if (!data) return res.status(404).json({ error: "not_found" });

    return res.status(200).json({
      id: data.id,
      reference_id: data.reference_id,
      amount: data.amount,
      currency: data.currency,
      status: data.status,
      expires_at: data.expires_at,
      qris: {
        qr_string: data.qr_string,
        qr_image_url: data.image_url
      },
      raw: data
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "server_error" });
  }
}