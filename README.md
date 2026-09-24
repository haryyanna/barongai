# BARONG AI

Website analisis visual Barong Bali. Analisis visual menggunakan Gemini melalui endpoint server di `api/analyze.js`; API key tidak dikirim ke browser.

## Menjalankan analisis di komputer

1. Pastikan Node.js 18 atau lebih baru terpasang.
2. Salin `.env.example` menjadi `.env.local`, lalu isi `GEMINI_API_KEY` dengan API key Gemini.
3. Jalankan `node server.js` dari folder proyek.
4. Buka `http://127.0.0.1:3000`.

Jangan mengunggah `.env.local` ke GitHub.

## Website GitHub Pages

Branch `main` menerbitkan website statis. Setiap perubahan yang dikirim ke branch ini akan diterbitkan GitHub Pages. GitHub Actions juga dapat membangun atau menerbitkan berkas statis, tetapi secret Actions hanya tersedia selama workflow berjalan. Secret tersebut tidak tersedia saat pengunjung memakai website, dan workflow bukan server API yang terus aktif untuk menerima foto.

Karena itu, analisis Gemini online membutuhkan endpoint server yang aktif. API key tidak boleh ditanamkan ke HTML atau JavaScript publik karena dapat dilihat dan disalahgunakan pengunjung. Tanpa server API, website tidak akan menampilkan hasil analisis palsu; pengguna akan mendapat keterangan bahwa layanan belum tersedia.

