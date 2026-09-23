// =====================================================================
// BARONG AI — Serverless Function Endpoint: /api/analyze  (Vercel-compatible)
// =====================================================================
// Fungsi ini berada di SERVER-SIDE. API Key Gemini TIDAK PERNAH dikirim
// ke browser pengguna. Hanya fungsi inilah yang membaca GEMINI_API_KEY
// dari environment variable server.
//
// CARA PENGGUNAAN:
//   1. Deploy project ke Vercel (atau platform serverless lain yang kompatibel)
//   2. Atur environment variable GEMINI_API_KEY di dashboard Vercel
//      (Project Settings → Environment Variables)
//   3. Frontend otomatis memanggil POST /api/analyze
//
// FORMAT REQUEST (dari frontend):
//   {
//     "image":    "<base64 image data (tanpa prefix data:...)>",
//     "mimeType": "image/jpeg"  // atau image/png, image/webp
//   }
//
// FORMAT RESPONSE (ke frontend):
//   Lihat bagian "structured JSON" di bawah ini.
// =====================================================================

export default async function handler(req, res) {
  // -------- CORS / Method guard --------
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Gunakan POST.' });
  }

  // -------- Baca API key dari environment atau default key --------
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  // -------- Validasi payload --------
  const { image, mimeType } = req.body || {};
  if (!image || typeof image !== 'string') {
    return res.status(400).json({
      isBarong: false,
      confidence: 0,
      classification: 'error',
      message: 'Payload gambar tidak valid.'
    });
  }
  const safeMime = /^image\/(jpe?g|png|webp)$/i.test(mimeType || '')
    ? mimeType
    : 'image/jpeg';

  // -------- Jika API key belum diatur --------
  // Kita TIDAK mengembalikan error, melainkan structured JSON dengan
  // classification "pending-setup" agar frontend bisa menampilkan state
  // yang ramah pengguna tanpa bocor informasi internal.
  if (!GEMINI_API_KEY) {
    console.warn('[BARONG AI] GEMINI_API_KEY environment variable belum diatur pada server.');
    return res.status(200).json({
      isBarong: false,
      confidence: 0,
      classification: 'pending-setup',
      message: 'Sistem analisis AI belum diaktifkan oleh pemilik website.'
    });
  }

  // -------- Prompt untuk klasifikasi + analisis terstruktur --------
  const SYSTEM_PROMPT = [
    'Kamu adalah sistem AI penilai kebudayaan Bali yang bertugas mendeteksi dan menganalisis Motif Baju Barong Bali secara KETAT dan AKURAT.',
    '',
    'PERINGATAN KRUSIAL: LAKUKAN PENGECEKAN KEASLIAN MOTIF TERLEBIH DAHULU!',
    'Gambar HARUS BENAR-BENAR merupakan motif Barong Bali (seperti topeng Barong Ket, Barong Macan, Barong Asu, Barong Gajah, Barong Landung) atau pakaian/kain/kaos yang menampilkan ilustrasi/motif figur Barong khas Bali.',
    '',
    'Jika gambar yang diunggah adalah salah satu dari berikut:',
    '- Foto potret / selfie manusia',
    '- Foto hewan biasa (kucing, anjing, harimau nyata, burung, dll)',
    '- Kendaraan, mobil, motor, sepeda',
    '- Pemandangan alam, gedung, ruangan, makanan',
    '- Pakaian atau kaos polos tanpa gambar Barong',
    '- Motif batik atau corak tekstil lain yang BUKAN Barong (seperti Mega Mendung, Kawung, Parang, songket murni)',
    '- Gambar acak, screenshot, ilustrasi lain yang tidak berhubungan dengan Barong Bali',
    '',
    'MAKA KAMU WAJIB MENOLAKNYA DENGAN:',
    '- isBarong: false',
    '- confidence: 0.95',
    '- classification: "non-barong"',
    '- message: "Gambar yang diunggah tidak terdeteksi sebagai motif Barong atau pakaian bernuansa Barong Bali. Mohon unggah foto baju atau motif Barong khas Bali yang jelas."',
    '- visualAnalysis: null',
    '- philosophy: ""',
    '- culturalContext: ""',
    '- designNotes: ""',
    '',
    'JANGAN PERNAH MENGARANG ATAU MENCOCOK-COCOKKAN GAMBAR NON-BARONG DENGAN FILOSOFI BARONG!',
    '',
    'JIKA DAN HANYA JIKA gambar memang mengandung figur/motif Barong Bali:',
    '- isBarong: true',
    '- confidence: nilai keyakinan (0.70 - 1.00)',
    '- classification: "barong"',
    '- visualAnalysis: berikan deskripsi warna dominan, motif utama, ornamen, perkiraan bahan, dan gaya desain.',
    '- philosophy: jelaskan filosofi Barong (simbol kebajikan Dharma, keseimbangan Rwa Bhineda) yang relevan.',
    '- culturalContext: konteks tradisi budaya Bali.',
    '- designNotes: catatan saran estetika desain.',
    '',
    'KEMBALIKAN HANYA JSON VALID SESUAI SKEMA.'
  ].join('\n');

  const USER_PROMPT = [
    'Kembalikan HANYA JSON murni (tanpa format markdown tambahan) dengan skema:',
    '{',
    '  "isBarong": boolean,',
    '  "confidence": number,',
    '  "classification": "barong" | "non-barong" | "ambiguous",',
    '  "message": string,',
    '  "visualAnalysis": {',
    '    "dominantColor": string,',
    '    "mainMotif": string,',
    '    "ornament": string,',
    '    "material": string,',
    '    "designStyle": string',
    '  } | null,',
    '  "philosophy": string,',
    '  "culturalContext": string,',
    '  "designNotes": string',
    '}'
  ].join('\n');

  const payload = {
    contents: [{
      role: 'user',
      parts: [
        { text: SYSTEM_PROMPT + '\n\n' + USER_PROMPT },
        { inlineData: { mimeType: safeMime, data: image } }
      ]
    }],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.1,
      topP: 0.9,
      maxOutputTokens: 1800
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT',       threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH',      threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT',threshold: 'BLOCK_NONE' }
    ]
  };

  try {
    // Model Gemini 3.6 Flash dengan fallback ke gemini-2.5-flash / gemini-2.0-flash
    let apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GEMINI_API_KEY}`;

    let response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-client': 'barong-ai-serverless'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok && response.status === 404) {
      // Fallback model
      apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
      response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-client': 'barong-ai-serverless'
        },
        body: JSON.stringify(payload)
      });
    }

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.error('[BARONG AI] Gemini API error:', response.status, errText.slice(0, 300));

      // Tangani rate-limit / timeout / quota secara aman — TIDAK mengembalikan detail ke frontend
      if (response.status === 429 || response.status >= 500) {
        return res.status(200).json({
          isBarong: false,
          confidence: 0,
          classification: 'server-busy',
          message: 'Analisis belum dapat dilakukan. Silakan coba kembali beberapa saat lagi.'
        });
      }
      return res.status(200).json({
        isBarong: false,
        confidence: 0,
        classification: 'server-error',
        message: 'Analisis belum dapat dilakukan. Silakan coba kembali beberapa saat lagi.'
      });
    }

    const result = await response.json();

    // -------- Ekstrak & parse JSON dari respons Gemini --------
    const rawText =
      result?.candidates?.[0]?.content?.parts?.[0]?.text ||
      result?.candidates?.[0]?.content?.parts?.map(p => p.text).join('') ||
      '';

    let parsed;
    try {
      // Bersihkan kemungkinan fence ```json ... ```
      const cleaned = rawText
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.warn('[BARONG AI] Gagal parse JSON dari Gemini. Fallback ke non-barong aman.', parseErr.message);
      return res.status(200).json({
        isBarong: false,
        confidence: 0.3,
        classification: 'parse-failed',
        message: 'Gambar belum dapat dikenali sebagai motif Barong. Silakan gunakan foto yang lebih jelas.'
      });
    }

    // -------- Safety normalisasi struktur --------
    const isBarong    = Boolean(parsed.isBarong);
    const confidence  = Number(parsed.confidence) || 0;

    // Ambigu guard
    if (isBarong && confidence < 0.5) {
      return res.status(200).json({
        isBarong: false,
        confidence: confidence,
        classification: 'ambiguous',
        message: 'Gambar belum dapat dikenali sebagai motif Barong. Silakan gunakan foto yang lebih jelas.'
      });
    }

    if (!isBarong) {
      return res.status(200).json({
        isBarong: false,
        confidence: confidence,
        classification: parsed.classification || 'non-barong',
        message: parsed.message || 'gambar tidak termasuk gambar motif barong, mohon upload gambar lain'
      });
    }

    const va = parsed.visualAnalysis || {};
    return res.status(200).json({
      isBarong: true,
      confidence: confidence,
      classification: parsed.classification || 'barong',
      visualAnalysis: {
        dominantColor: String(va.dominantColor || '').trim() || 'Tidak terdeteksi secara jelas.',
        mainMotif:     String(va.mainMotif     || '').trim() || 'Tidak terdeteksi secara jelas.',
        ornament:      String(va.ornament      || '').trim() || 'Tidak terdeteksi secara jelas.',
        material:      String(va.material      || '').trim() || 'Perkiraan berdasarkan visual tekstur.',
        designStyle:   String(va.designStyle   || '').trim() || 'Gaya desain umum.'
      },
      philosophy:      String(parsed.philosophy      || '').trim() || 'Filosofi umum Barong: simbol pelindung kebaikan dan keseimbangan Rwa Bhineda.',
      culturalContext: String(parsed.culturalContext || '').trim() || 'Barong merupakan warisan budaya Bali yang dijunjung tinggi sebagai penjaga keseimbangan alam.',
      designNotes:     String(parsed.designNotes     || '').trim() || 'Pertahankan detail ornamen khas agar identitas Barong tetap terjaga.'
    });

  } catch (err) {
    console.error('[BARONG AI] /api/analyze unhandled error:', err && err.message);
    return res.status(200).json({
      isBarong: false,
      confidence: 0,
      classification: 'server-error',
      message: 'Analisis belum dapat dilakukan. Silakan coba kembali beberapa saat lagi.'
    });
  }
}
