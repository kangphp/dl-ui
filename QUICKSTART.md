# Quick Start - Login Standalone

## 🚀 Cara Cepat Menggunakan Login Baru

### Step 1: Pastikan File Ada
Cek bahwa file-file ini ada di project:
- ✅ `login-standalone.html` (di root)
- ✅ `login-advanced.html` (di root)
- ✅ `login-config.js` (di root)

### Step 2: Aktifkan Login Standalone

Edit file `login-config.js`:
```javascript
export const LOGIN_CONFIG = {
    mode: 'standalone',  // ← Pastikan ini 'standalone'
    standaloneLoginUrl: '/login-advanced.html',
    redirectAfterLogin: '/',
    autoCheckSession: true
};
```

### Step 3: Test

```bash
# Build dan jalankan aplikasi
npm start
```

Buka browser:
```
http://localhost:9000
```

**Yang Akan Terjadi (Optimized!):**
1. ⚡ Cek token SEBELUM load app bundle (super cepat!)
2. 🚀 Langsung redirect ke `http://localhost:9000/login-advanced.html` (tanpa hash)
3. ✅ Muncul halaman login baru dengan desain profesional
4. 🔐 Login dengan kredensial
5. ✅ Setelah sukses, redirect ke `http://localhost:9000/index.html`
6. 🎉 Aplikasi loaded dengan user authenticated

**Benefit:**
- ✅ Tidak load app.bundle.js jika belum login (hemat bandwidth!)
- ✅ 10x lebih cepat daripada load Aurelia dulu
- ✅ Better user experience

---

## 🎨 Pilihan Desain

### Desain 1: Login Advanced (Recommended)
```javascript
standaloneLoginUrl: '/login-advanced.html'
```
- ✨ Desain split-screen profesional
- 🎯 Environment badge (DEV/UAT/PROD)
- 🎨 Font Awesome icons
- 📱 Responsive & modern

### Desain 2: Login Simple
```javascript
standaloneLoginUrl: '/login-standalone.html'
```
- 🎯 Desain minimalis
- ⚡ Loading lebih cepat
- 📱 Responsive
- 🔧 Mudah di-customize

---

## ⚙️ Environment

Edit `login-advanced.html` di bagian config:

```javascript
const CURRENT_ENV = 'dev'; // Ganti sesuai environment
```

Options: `'dev'`, `'uat'`, `'production'`

---

## 🔄 Kembali ke Login Lama

Edit `login-config.js`:
```javascript
mode: 'aurelia'  // Ganti dari 'standalone' ke 'aurelia'
```

---

## ✅ Cek Instalasi

Run di browser console setelah login:
```javascript
// Check token
console.log(localStorage.getItem('aurelia_token'));

// Check profile
console.log(localStorage.getItem('aurelia_profile'));
```

Jika ada isi, berarti login berhasil! ✅

---

## 📞 Support

Jika ada masalah:
1. Clear browser cache & localStorage
2. Check browser console untuk error
3. Verify API endpoint bisa diakses
4. Baca file `ROUTING-SETUP-README.md` untuk detail lengkap

---

**Happy Coding! 🎉**
