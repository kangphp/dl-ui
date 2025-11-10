# Setup Routing ke Login Baru

## Perubahan yang Telah Dilakukan

### 1. File yang Dimodifikasi

#### `src/login.js`
- Ditambahkan import `LOGIN_CONFIG`
- Ditambahkan method `attached()` yang akan redirect ke halaman login standalone jika dikonfigurasi
- Jika `LOGIN_CONFIG.mode === 'standalone'`, akan otomatis redirect ke halaman login baru

#### `auth-config.js`
- Ditambahkan `loginRoute: '/login-advanced.html'`
- Ditambahkan `loginRedirect: '/'`

#### `login-config.js` (File Baru)
- File konfigurasi untuk mengatur mode login
- Bisa switch antara 'standalone' atau 'aurelia'

#### `login-standalone.html`
- Update redirect URL menggunakan `CONFIG.REDIRECT_URL`
- Default redirect ke `/index.html` (aplikasi Aurelia)

#### `login-advanced.html`
- Update semua environment redirect ke `/index.html`
- Redirect otomatis ke aplikasi Aurelia setelah login sukses

---

## Cara Kerja

### Flow Routing:

1. **User mengakses route `/login`**
   - Aurelia router memanggil `src/login.js`

2. **Login.js method `attached()` dijalankan**
   - Cek `LOGIN_CONFIG.mode`
   - Jika `'standalone'`, redirect ke `/login-advanced.html`
   - Jika `'aurelia'`, tetap di halaman Aurelia login

3. **User login di halaman standalone**
   - Kredensial dienkripsi dengan RSA
   - Kirim request ke API auth
   - Token disimpan di localStorage dengan key `aurelia_token`
   - Profile disimpan di localStorage dengan key `aurelia_profile`

4. **Redirect ke aplikasi**
   - Setelah login sukses, redirect ke `/index.html`
   - Aurelia mendeteksi token di localStorage
   - User langsung masuk ke aplikasi (authenticated)

---

## Konfigurasi

### Menggunakan Login Standalone (Default)

Edit `login-config.js`:
```javascript
export const LOGIN_CONFIG = {
    mode: 'standalone',  // ← Mode standalone
    standaloneLoginUrl: '/login-advanced.html',
    redirectAfterLogin: '/',
    autoCheckSession: true
};
```

### Menggunakan Login Aurelia (Lama)

Edit `login-config.js`:
```javascript
export const LOGIN_CONFIG = {
    mode: 'aurelia',  // ← Mode Aurelia
    standaloneLoginUrl: '/login-advanced.html',
    redirectAfterLogin: '/',
    autoCheckSession: true
};
```

### Memilih Desain Login

Anda bisa pilih antara 2 desain:

**1. Login Advanced (Professional)**
```javascript
standaloneLoginUrl: '/login-advanced.html'
```
- Desain split-screen dengan ilustrasi
- Environment badge
- Font Awesome icons
- Loading overlay
- Lebih banyak fitur

**2. Login Simple (Minimalis)**
```javascript
standaloneLoginUrl: '/login-standalone.html'
```
- Desain minimalis dan clean
- Loading state inline
- Responsive
- Lebih ringan

---

## Environment Configuration

### Login Advanced - Multi Environment

Edit di `login-advanced.html`, bagian JavaScript:

```javascript
// Set current environment here
const CURRENT_ENV = 'dev'; // Ubah ke 'dev', 'uat', atau 'production'
```

Environment yang tersedia:
- `'dev'` - Development (default)
- `'uat'` - UAT/Staging  
- `'production'` - Production

### Login Standalone - Single Environment

Edit di `login-standalone.html`, bagian CONFIG:

```javascript
const CONFIG = {
    AUTH_URL: 'https://com-danliris-service-auth-v8-dev.azurewebsites.net/v1/',
    // Ganti URL sesuai environment
};
```

---

## Testing

### 1. Test Redirect dari Aurelia ke Standalone

```bash
# Jalankan aplikasi
npm start
```

Akses: `http://localhost:8080/#/login`

**Expected:**
- Otomatis redirect ke `/login-advanced.html`

### 2. Test Login Standalone

Akses: `http://localhost:8080/login-advanced.html`

**Expected:**
- Halaman login standalone terbuka
- Input username & password
- Klik Sign In
- Loading overlay muncul
- Setelah sukses, redirect ke `/index.html`
- Masuk ke aplikasi Aurelia dengan authenticated

### 3. Test Token Persistence

1. Login ke aplikasi
2. Buka Developer Tools (F12) → Application → Local Storage
3. Check items:
   - `aurelia_token` - Harus ada JWT token
   - `aurelia_profile` - Harus ada profile JSON
   - `login_timestamp` - Timestamp login

### 4. Test Session Check

1. Login ke aplikasi
2. Tutup tab/browser
3. Buka kembali `http://localhost:8080/login-advanced.html`

**Expected:**
- Detect existing session
- Show message "Already logged in. Redirecting..."
- Auto redirect ke aplikasi

---

## Troubleshooting

### Issue: Infinite Redirect Loop

**Penyebab:** 
- Redirect URL salah
- Token tidak tersimpan

**Solusi:**
```javascript
// Check di browser console
console.log(localStorage.getItem('aurelia_token'));

// Clear storage jika perlu
localStorage.clear();
```

### Issue: 404 Not Found - login-advanced.html

**Penyebab:**
- File tidak di root folder
- Webpack tidak copy file HTML

**Solusi:**
1. Pastikan file `login-advanced.html` dan `login-standalone.html` ada di root folder project
2. Check `webpack.config.babel.js` untuk copy static files

### Issue: CORS Error

**Penyebab:**
- API endpoint tidak allow CORS
- Local development tanpa proxy

**Solusi:**
- Pastikan API auth service sudah enable CORS
- Atau setup webpack dev server proxy

### Issue: Login Sukses tapi Tidak Redirect

**Penyebab:**
- `redirectUrl` configuration salah
- JavaScript error

**Solusi:**
1. Check browser console untuk errors
2. Verify `CONFIG.redirectUrl` atau `CONFIG.REDIRECT_URL`
3. Test manual redirect:
   ```javascript
   window.location.href = '/index.html';
   ```

---

## Rollback ke Login Lama

Jika ingin kembali ke login Aurelia lama:

**Opsi 1: Via Konfigurasi (Recommended)**

Edit `login-config.js`:
```javascript
mode: 'aurelia'  // Switch ke mode aurelia
```

**Opsi 2: Hapus Redirect**

Edit `src/login.js`, comment atau hapus method `attached()`:
```javascript
// attached() {
//     if (LOGIN_CONFIG.mode === 'standalone') {
//         window.location.href = LOGIN_CONFIG.standaloneLoginUrl;
//         return;
//     }
// }
```

---

## Production Deployment

### Checklist sebelum deploy:

1. ✅ Set environment yang benar:
   ```javascript
   // login-advanced.html
   const CURRENT_ENV = 'production';
   ```

2. ✅ Verify auth API URL:
   ```javascript
   production: {
       name: 'PRODUCTION',
       authUrl: 'https://com-danliris-service-auth-v8.azurewebsites.net/v1/',
       redirectUrl: '/index.html'
   }
   ```

3. ✅ Test login dengan production credentials

4. ✅ Check HTTPS enabled

5. ✅ Verify token storage works

6. ✅ Test session persistence

---

## Notes

- Token menggunakan key yang sama dengan Aurelia Authentication (`aurelia_token`)
- Profile format compatible dengan existing Aurelia app
- Session akan persist sampai token expired atau user logout
- Remember me menyimpan username di localStorage
- Password tidak pernah disimpan, hanya token yang disimpan

---

**Updated:** November 6, 2025  
**Status:** ✅ Ready for Testing
