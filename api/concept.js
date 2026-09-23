// =====================================================================
// BARONG AI — Serverless Function: /api/concept (Vercel-compatible)
// =====================================================================
// Endpoint untuk menghasilkan 4 KONSEP DESAIN yang terinspirasi dari
// foto Barong user. Dapat diisi dengan:
//   - Gemini (text + image) untuk generate title/desc/tag konsep
//   - Diffusion / image-to-image model untuk generate gambar konsep
//
// JIKA BELUM ADA model AI yang terhubung:
//   Fungsi ini mengembalikan structured title/desc/tag (bukan gambar)
//   Frontend tetap dapat menampilkan 4 konsep dengan visual filter
//   (sudah disiapkan sebagai fallback visual yang natural).
// =====================================================================

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const { image, mimeType, style } = req.body || {};
  if (!image) return res.status(400).json({ concepts: [] });

  // --- AI logic (jika GEMINI_API_KEY tersedia) ---
  // Prompt untuk generate 4 variasi konsep desain:
  const CONCEPT_PROMPT = [
    'Berikan 4 (empat) usulan konsep desain BARONG yang terinspirasi dari gambar ini.',
    'Setiap konsep harus dalam Bahasa Indonesia, struktur:',
    '{ tag: string (2-3 kata gaya), title: string (judul menarik, 5-7 kata), desc: string (1 kalimat penjelasan, 18-25 kata) }',
    'Variasi gaya: minimalis-modern, tradisional berwarna, earth/natural, dan editorial magazine.',
    'HANYA kembalikan array JSON valid, tanpa markdown, tanpa teks lain.',
    'Format: { "concepts": [ {tag,title,desc}, {tag,title,desc}, {tag,title,desc}, {tag,title,desc} ] }'
  ].join(' ');

  if (GEMINI_API_KEY) {
    try {
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GEMINI_API_KEY}`;
      const payload = {
        contents: [{
          role: 'user',
          parts: [
            { text: CONCEPT_PROMPT },
            { inlineData: { mimeType: mimeType || 'image/jpeg', data: image } }
          ]
        }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.55,
          topP: 0.95,
          maxOutputTokens: 1200
        }
      };
      const r = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (r.ok) {
        const jr = await r.json();
        const raw = jr?.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';
        const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
        let parsed;
        try { parsed = JSON.parse(cleaned); } catch (e) { parsed = null; }
        if (parsed && Array.isArray(parsed.concepts) && parsed.concepts.length >= 4) {
          return res.status(200).json({ concepts: parsed.concepts.slice(0, 4), mode: 'ai-generated' });
        }
      }
    } catch (e) {
      console.warn('[BARONG AI /api/concept] Gagal generate via Gemini:', e && e.message);
    }
  }

  // --- Fallback 4 konsep default ---
  return res.status(200).json({
    mode: 'default-fallback',
    concepts: [
      { tag: 'Modern Minimalis', title: 'Barong Line-Work Kontemporer',   desc: 'Pengurangan detail ornamen menjadi garis tipis, fokus pada proporsi wajah Barong dengan negative space yang luas.' },
      { tag: 'Tradisi Berwarna',  title: 'Ornamen Klasik Berani',          desc: 'Mempertegas mahkota dan motif flora khas Bali di sekeliling, dengan palet tradisional yang lebih jenuh.' },
      { tag: 'Earth Tone',        title: 'Palet Alam yang Hangat',         desc: 'Semua warna dialihkan ke tanah, krem, cokelat tembaga. Memberikan kesan tekstur alami seperti kain tenun.' },
      { tag: 'Editorial Bali',    title: 'Komposisi Magazine Cover',       desc: 'Potongan asimetris, kontras lembut, ruang putih untuk tipografi editorial. Cocok untuk kolase dan publikasi budaya.' }
    ]
  });
}
