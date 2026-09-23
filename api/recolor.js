// =====================================================================
// BARONG AI — Serverless Function: /api/recolor (Vercel-compatible)
// =====================================================================
// Endpoint untuk RECOLOR gambar menggunakan AI image editing model
// (misalnya Gemini dengan mode image-to-image, atau model diffusion).
//
// Cara deploy:
//   - Simpan file ini di api/recolor.js (sudah terdeteksi otomatis oleh Vercel)
//   - Atur GEMINI_API_KEY (dan model image editing opsional) di Environment
//   - Frontend mengirim: POST /api/recolor { image, mimeType, preset }
//
// JIKA BELUM ADA model AI image editing yang disiapkan:
//   Fungsi ini secara AMAN mengembalikan structured fallback yang akan
//   ditampilkan frontend bersama canvas recolor lokal.
// =====================================================================

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  const { image, mimeType, preset } = req.body || {};
  if (!image) {
    return res.status(400).json({ ok: false, error: 'Payload gambar tidak ada.' });
  }

  // --- Placeholder logic ---
  // TODO: Integrasikan model AI image editing / diffusion di sini.
  // Contoh konsep:
  //   - Kirim gambar + prompt: "ubah warna dominan baju Barong ini menjadi [Hijau/Earth/Gold], tetap pertahankan detail ornamen."
  //   - Terima image base64 baru dari model
  //   - Return: { ok: true, recoloredImage: "data:image/...;base64,..." }
  //
  // Saat ini (belum terhubung model image-to-image), kita kembalikan preset
  // supaya frontend tetap bisa menampilkan preview via canvas filter lokal.

  const PRESETS_META = {
    original: { name: 'Asli',       prompt: 'pertahankan warna asli' },
    earth:    { name: 'Earth Tone', prompt: 'palet tanah, cokelat, krem, hangat seperti tenun alam' },
    hijau:    { name: 'Hijau',      prompt: 'dominan hijau daun dan hijau tua' },
    biru:     { name: 'Biru',       prompt: 'dominan biru samudra dan navy' },
    merah:    { name: 'Merah',      prompt: 'dominan merah darah dan maroon' },
    ungu:     { name: 'Ungu',       prompt: 'dominan ungu royal dan lavender tua' },
    pastel:   { name: 'Pastel',     prompt: 'warna pastel lembut, rendah saturasi' },
    monokrom: { name: 'Monokrom',   prompt: 'grayscale kontras tinggi' },
    gold:     { name: 'Gold',       prompt: 'dominan emas hangat seperti ornamen ukir' },
    teal:     { name: 'Teal',       prompt: 'dominan teal/toska lembut' },
    softrose: { name: 'Soft Rose',  prompt: 'dominan merah muda dusty rose' },
    vintage:  { name: 'Vintage',    prompt: 'filter vintage sepia, warna pudar klasik' },
  };

  return res.status(200).json({
    ok: true,
    mode: GEMINI_API_KEY ? 'ready-ai' : 'local-canvas-only',
    preset: preset || 'original',
    presetMeta: PRESETS_META[preset] || PRESETS_META.original,
    note: 'Gunakan canvas recolor lokal untuk preview instan. Untuk hasil AI photo-to-photo, integrasikan model image editing di function ini.',
    recoloredImage: null
  });
}
