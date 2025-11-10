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
http://localhost:8080/#/login
```

**Yang Akan Terjadi:**
1. Otomatis redirect ke `/login-advanced.html`
2. Muncul halaman login baru dengan desain profesional
3. Login dengan kredensial
4. Setelah sukses, redirect ke aplikasi utama

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
