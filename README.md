# BARONG AI

Website analisis visual Barong Bali. Analisis memakai fungsi server-side Gemini di `api/analyze.js`, sehingga kunci API tidak dikirim ke browser.

## Menjalankan di komputer

1. Pastikan Node.js 18 atau lebih baru terpasang.
2. Salin `.env.example` menjadi `.env.local`, lalu isi `GEMINI_API_KEY` dengan kunci Gemini milik proyek.
3. Jalankan `node server.js` dari folder ini.
4. Buka `http://127.0.0.1:3000`.

Server lokal menyediakan halaman dan `/api/analyze` sekaligus. Jangan mengunggah `.env.local` ke GitHub; berkas itu sudah masuk `.gitignore`.

## GitHub Pages

Repository ini menerbitkan versi situs statis dari branch `main`. Pastikan **Settings → Pages → Build and deployment** memilih **Deploy from a branch**, branch `main`, folder `/(root)`. Setiap perubahan di `main` akan diterbitkan oleh GitHub Pages.

GitHub Pages hanya menyajikan berkas statis dan tidak menjalankan endpoint `/api/analyze`. Karena itu, situs GitHub Pages menyediakan **mode demo** untuk menguji tampilan; contoh hasilnya tidak menganalisis foto. PDF sumber dan tautan Kementerian Pariwisata tetap tersedia pada menu **Tentang**. Untuk analisis gambar AI sungguhan, gunakan deploy server yang menjalankan fungsi API.

## Deploy analisis AI sungguhan ke Vercel dari GitHub

1. Push folder proyek ini ke repository GitHub.
2. Import repository tersebut di Vercel dengan root directory proyek ini.
3. Di **Project Settings → Environment Variables**, tambahkan `GEMINI_API_KEY` untuk Production (dan Preview bila dipakai).
4. Deploy atau redeploy. Vercel menyajikan `index.html` dan otomatis menjalankan fungsi di `api/`.

`server.js` hanya untuk pengembangan lokal. Di Vercel, endpoint analisis berjalan sebagai serverless function.

