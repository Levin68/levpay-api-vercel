// api/webhook/xendit.js
const setCORS = (res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-callback-token");
};

export default async function handler(req, res) {
  setCORS(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const token = req.headers["x-callback-token"];
    if (!token || token !== process.env.WEBHOOK_TOKEN) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const body = req.body || {};
    console.log("Xendit webhook:", JSON.stringify(body));

    // (Opsional) teruskan ke webhook.site biar gampang dilihat
    if (process.env.DEBUG_WEBHOOK_URL) {
      try {
        await fetch(process.env.DEBUG_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ received_at: new Date().toISOString(), body })
        });
      } catch (e) {
        console.warn("Forward debug gagal:", e.message);
      }
    }

    // Kamu bisa tambahkan logika simpan ke DB, update riwayat, dsb di sini.
    // Contoh ringkas:
    // if (body.status === "SUCCEEDED" || body.payment_status === "PAID") { ... }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "server_error" });
  }
}