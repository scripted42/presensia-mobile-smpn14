# Presensia Mobile (SMP Negeri 14 Surabaya)

Aplikasi Android Native untuk sistem absensi sekolah **Presensia**, dibangun menggunakan **React Native + Expo SDK 57** dan terhubung langsung dengan backend **Laravel Sanctum**.

---

## 🚀 Fitur Utama

- **Autentikasi Fleksibel**: Login menggunakan NIS (Siswa), NIK (Pegawai), atau Email dengan token Sanctum.
- **Multi-Role UX**: Tampilan dashboard otomatis menyesuaikan apakah pengguna adalah Siswa atau Guru/Pegawai.
- **Absensi Selfie + GPS**:
  - Mengambil foto selfie langsung melalui kamera depan ponsel (`expo-camera`).
  - Mendeteksi titik koordinat GPS dan nama lokasi secara akurat (`expo-location`).
- **Scan QR Siswa Masal (Guru/Admin)**:
  - Memindai barcode/QR Code kartu siswa secara cepat menggunakan kamera belakang.
  - Mengirimkan absensi masal (*bulk batch sync*) ke server dalam satu kali kirim.
- **Kartu QR Siswa**:
  - Menampilkan QR Code siswa untuk dipindai oleh guru piket saat tiba di sekolah.
- **Riwayat Absensi**:
  - Menampilkan rekap kehadiran bulanan lengkap dengan status Tepat Waktu, Terlambat, dan Izin.
- **Profil & Sesi Aman**:
  - Penyimpanan sesi lokal yang aman (`AsyncStorage`) dan tombol keluar akun (*logout*).

---

## 📱 Cara Menjalankan di Ponsel (Tanpa Android Studio)

### 1. Prasyarat
1. Pasang aplikasi **Expo Go** dari Google Play Store di ponsel Android Anda.
2. Pastikan PC dan ponsel Anda terhubung ke jaringan Wi-Fi yang sama (atau gunakan tethering HP ke PC).

### 2. Jalankan Server Pengembangan
Di terminal PC, masuk ke folder proyek dan jalankan:

```bash
npx expo start
```

### 3. Hubungkan Ponsel
- Buka aplikasi **Expo Go** di ponsel Anda.
- Pilih **Scan QR code** dan arahkan kamera ke QR code yang muncul di terminal PC Anda.
- Aplikasi akan langsung terbuka di ponsel dengan fitur *Fast Refresh / Hot Reload* otomatis.

---

## 🌐 Konfigurasi Server API
Konfigurasi endpoint API berada di `src/api/client.js`:
```javascript
export const BASE_URL = 'https://presensia.smpn14-surabaya.sch.id/api/mobile';
```
Semua permintaan otomatis menyertakan `Bearer Token` setelah login berhasil.
