# BARONG AI

Website analisis visual Barong Bali. Analisis menggunakan Gemini melalui endpoint server di `api/analyze.js`; API key tidak dikirim ke browser.

## Menjalankan analisis di komputer

1. Pastikan Node.js 18 atau lebih baru terpasang.
2. Salin `.env.example` menjadi `.env.local`, lalu isi `GEMINI_API_KEY` dengan API key Gemini.
3. Jalankan `node server.js` dari folder proyek.
4. Buka `http://127.0.0.1:3000`.

Jangan mengunggah `.env.local` ke GitHub.

## Deploy online dari GitHub ke Cloudflare Pages

GitHub Pages hanya menerbitkan berkas statis dan tidak menjalankan endpoint API. Folder `functions/api/analyze.js` menambahkan endpoint `/api/analyze` pada Cloudflare Pages, sehingga halaman dan analisis Gemini berjalan pada domain yang sama.

1. Di Cloudflare Dashboard, buka **Workers & Pages → Create application → Pages → Connect to Git**.
2. Hubungkan repository `haryyanna/barongai), pilih branch produksi `main), biarkan build command kosong, dan isi output directory dengan `.`.
3. Setelah project dibuat, buka **Settings → Variables and Secrets**, tambahkan `GEMINI_API_KEY` sebagai secret untuk Production, lalu simpan.
4. Jalankan redeploy. Cloudflare Pages akan menerbitkan situs dan menjalankan Function pada `/api/analyze`.
5. Gunakan URL `.pages.dev` Cloudflare Pages untuk uji coba analisis AI. Perubahan selanjutnya di branch `main` akan diterbitkan otomatis.

Secret `GEMINI_API_KEY` yang tersimpan di GitHub Actions tidak otomatis tersedia bagi Pages Function. Simpan juga key tersebut sebagai secret di pengaturan project Cloudflare Pages. Jangan menanamkan key ke HTML atau JavaScript publik.
