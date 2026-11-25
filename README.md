# Sho Shop

Sho Shop adalah aplikasi toko online demo untuk produk skincare dan makeup. Website ini memiliki antarmuka berbahasa Indonesia dan Inggris, keranjang belanja, halaman detail produk, autentikasi pengguna, serta alur checkout yang menyimpan pesanan ke database SQLite.

## Fitur

- **Katalog produk** — pencarian, filter kategori, pengurutan, dan detail produk.
- **Keranjang belanja** — tambah produk dan atur jumlah item; isi keranjang disimpan di browser.
- **Checkout** — checkout sebagai tamu atau pengguna terdaftar, dengan ongkir dan total yang dihitung ulang oleh server.
- **Akun pengguna** — daftar, masuk, keluar, dan melihat riwayat pesanan setelah masuk.
- **Dua bahasa** — beralih antara Bahasa Indonesia dan English; pilihan bahasa disimpan di browser.
- **Penyimpanan data** — produk, pengguna, sesi, pesanan, dan item pesanan disimpan di SQLite.
- **Tampilan responsif** — halaman toko, login, dan daftar dapat digunakan di layar desktop maupun ponsel.

## Teknologi

- HTML, CSS, dan JavaScript
- Node.js dan Express.js
- SQLite melalui modul bawaan `node:sqlite`

## Persyaratan

- Node.js **22.13 atau lebih baru**
- npm

## Menjalankan secara lokal

Dari direktori proyek, jalankan:

```bash
npm install
npm start
```

Kemudian buka [http://127.0.0.1:3000](http://127.0.0.1:3000).

Saat server pertama kali dijalankan, aplikasi membuat database `data/sho-shop.sqlite` dan memasukkan katalog contoh. Database lokal tidak perlu dibuat secara manual.

## Konfigurasi server

Semua konfigurasi bersifat opsional:

| Variabel | Default | Keterangan |
| --- | --- | --- |
| `PORT` | `3000` | Port HTTP Express |
| `HOST` | `127.0.0.1` | Alamat jaringan tempat server mendengarkan |
| `SHO_SHOP_DB` | `data/sho-shop.sqlite` | Lokasi file database SQLite |

Contoh mengubah port di PowerShell:

```powershell
$env:PORT = "4000"
npm start
```

## API

Semua endpoint mengembalikan JSON, kecuali endpoint logout yang mengembalikan respons kosong.

| Metode | Endpoint | Keterangan |
| --- | --- | --- |
| `GET` | `/api/products` | Mengambil katalog produk |
| `GET` | `/api/auth/me` | Memeriksa sesi pengguna saat ini |
| `POST` | `/api/auth/register` | Membuat akun baru |
| `POST` | `/api/auth/login` | Masuk ke akun |
| `POST` | `/api/auth/logout` | Mengakhiri sesi |
| `GET` | `/api/orders` | Mengambil riwayat pesanan pengguna yang masuk |
| `POST` | `/api/orders` | Membuat pesanan baru; dapat digunakan oleh tamu |

Contoh body untuk membuat pesanan:

```json
{
  "customer": {
    "name": "Nama Penerima",
    "phone": "08123456789",
    "address": "Alamat pengiriman",
    "city": "Jakarta",
    "postalCode": "12345"
  },
  "payment": "cod",
  "items": [
    {
      "productId": "dew-diary-cleanser",
      "quantity": 1
    }
  ],
  "note": ""
}
```

Nilai `payment` yang tersedia: `cod`, `bank_transfer`, dan `qris`.

## Database dan keamanan akun

Database membuat tabel `products`, `users`, `sessions`, `orders`, dan `order_items` secara otomatis. Harga produk diambil dari database saat pesanan dibuat, sehingga subtotal, ongkir, dan total tidak mempercayai nilai harga dari browser. Ongkir demo adalah Rp15.000 dan gratis untuk subtotal minimal Rp250.000.

Kata sandi akun disimpan sebagai hash scrypt dengan salt. Sesi menggunakan cookie `HttpOnly`. File database lokal berada di folder `data/` dan diabaikan oleh Git.

## Batasan demo

- Produk yang tersedia merupakan katalog contoh yang di-seed saat server pertama kali dijalankan. Belum tersedia panel admin atau endpoint untuk mengelola produk.
- Pilihan pembayaran hanya simulasi; tidak ada pembayaran nyata atau integrasi payment gateway.
- Proyek ini ditujukan untuk demonstrasi dan pengembangan lokal. Sebelum digunakan sebagai layanan produksi, diperlukan konfigurasi dan pemeriksaan keamanan tambahan.
