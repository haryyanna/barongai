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
    'Kamu adalah sistem visi komputer yang mendeteksi figur, topeng, ilustrasi, dan motif Barong Bali pada gambar. Nilai objek yang terlihat, bukan nama file atau asumsi bahwa gambar harus berupa baju.',
    '',
    'PERINGATAN KRUSIAL: LAKUKAN PENGECEKAN KEASLIAN MOTIF TERLEBIH DAHULU!',
    'Barong dapat tampak sebagai topeng, patung, ukiran, lukisan, ilustrasi, foto pertunjukan, hiasan, atau motif pada pakaian/kain. Kenali beragam wujud Barong Bali: Barong Ket, Bangkal, Macan, Asu, Gajah, Landung dan variasi lokal. Foto tidak harus menampilkan pakaian.',
    'Jangan menolak gambar hanya karena Barong tidak memenuhi seluruh bingkai, warna/pencahayaan tidak ideal, detailnya bergaya kartun/abstrak, atau gambar berupa foto pakaian bermotif. Pertimbangkan ciri visual secara keseluruhan: wajah/topeng ekspresif, mata besar, taring, mahkota/gelungan dan ornamen Bali; tidak semua ciri harus hadir sekaligus.',
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
    'Jika gambar jelas menampilkan Barong Bali atau motif yang secara wajar dapat dikenali sebagai Barong:',
    '- isBarong: true',
    '- confidence: nilai keyakinan (0.50 - 1.00). Jika Barong terlihat tetapi tertutup sebagian/kurang jelas, tetap klasifikasikan true dan gunakan confidence 0.50-0.69.',
    '- classification: "barong"',
    '- visualAnalysis: hanya deskripsikan hal yang tampak pada gambar (warna, motif, ornamen, perkiraan bahan, gaya). Jangan menyimpulkan makna budaya dari penampilan saja.',
    '- philosophy: string kosong. Makna budaya tidak dinilai atau dibuat oleh AI.',
    '- culturalContext: string kosong. Konteks budaya bersumber dari panel referensi terkurasi di situs.',
    '- designNotes: catatan estetika visual saja; jangan memberi klaim keaslian atau kesesuaian adat.',
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
    // Model utama diikuti fallback jika model tidak tersedia, sedang padat,
    // atau terkena rate limit. Gambar dan prompt tetap sama pada setiap percobaan.
    const modelCandidates = ['gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-3.5-flash-lite'];
    let response;
    let lastFetchError;
    for (const model of modelCandidates) {
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      try {
        response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-client': 'barong-ai-serverless'
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(20000)
        });
      } catch (fetchError) {
        lastFetchError = fetchError;
        console.warn(`[BARONG AI] Gemini ${model} request failed:`, fetchError?.message || fetchError);
        continue;
      }
      if (!response.ok) {
        console.warn(`[BARONG AI] Gemini ${model} returned HTTP ${response.status}.`);
      }
      if (response.ok || ![404, 429, 503].includes(response.status)) break;
    }

    if (!response && lastFetchError) throw lastFetchError;

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
    const confidence  = Number.isFinite(Number(parsed.confidence)) && Number(parsed.confidence) > 0
      ? Number(parsed.confidence)
      : (isBarong ? 0.7 : 0.6);

    // Ambigu guard
    if (isBarong && confidence < 0.2) {
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
