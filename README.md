# BARONG AI

Website analisis visual Barong Bali. Analisis menggunakan Gemini melalui endpoint server di `api/analyze.js`; API key tidak dikirim ke browser.

## Menjalankan analisis di komputer

1. Pastikan Node.js 18 atau lebih baru terpasang.
2. Salin `.env.example` menjadi `.env.local`, lalu isi `GEMINI_API_KEY` dengan API key Gemini.
3. Jalankan `node server.js` dari folder proyek.
4. Buka `http://127.0.0.1:3000`.

Jangan mengunggah `.env.local` ke GitHub.

## Deploy online dari GitHub ke Cloudflare Pages

Folder `functions/api/analyze.js` menyediakan endpoint `/api/analyze` pada Cloudflare Pages, sehingga halaman dan analisis Gemini berjalan pada domain yang sama. Workflow `.github/workflows/deploy-cloudflare-pages.yml` membuat project dan mengirim deployment setiap ada perubahan di branch `main`.

1. Masuk ke Cloudflare Dashboard dan salin **Account ID** dari halaman Overview.
2. Buat API Token Cloudflare dengan izin **Account → Cloudflare Pages → Edit**.
3. Di repository GitHub, buka **Settings → Secrets and variables → Actions** dan tambahkan secret `CLOUDFLARE_ACCOUNT_ID` serta `CLOUDFLARE_API_TOKEN`.
4. Pastikan secret `GEMINI_API_KEY` tersedia di repository Actions. Workflow akan menyalinnya ke secret Cloudflare Pages tanpa memasukkan nilainya ke berkas publik.
5. Push perubahan ke `main` atau jalankan workflow **Deploy BARONG AI to Cloudflare Pages** dari tab Actions.

Situs online akan tersedia di `https://barongai-haryyanna-252476961.pages.dev`. Gunakan alamat Cloudflare Pages tersebut untuk analisis AI; GitHub Pages tetap berisi versi statis. Jangan menanamkan key ke HTML atau JavaScript publik.
