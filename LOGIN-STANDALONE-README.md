# Halaman Login Standalone

Dokumentasi untuk halaman login terpisah yang berfungsi penuh tanpa framework Aurelia.

## File yang Dibuat

### 1. login-standalone.html
Halaman login sederhana dengan desain modern dan fungsionalitas penuh.

**Fitur:**
- ✅ Autentikasi langsung ke API auth service
- ✅ Enkripsi kredensial menggunakan RSA (JSEncrypt)
- ✅ Validasi input form
- ✅ Remember me functionality
- ✅ Responsive design
- ✅ Loading states dan animasi
- ✅ Error handling
- ✅ Auto-redirect setelah login sukses
- ✅ Check session existing
- ✅ Toast notifications

**Cara Menggunakan:**
1. Buka file `login-standalone.html` di browser
2. Masukkan username dan password
3. Klik "Sign In"
4. Setelah berhasil, akan redirect ke halaman utama (`/`)

### 2. login-advanced.html
Halaman login dengan desain lebih advanced dan fitur tambahan.

**Fitur Tambahan:**
- ✅ Split screen design dengan ilustrasi
- ✅ Environment badge (DEV/UAT/PRODUCTION)
- ✅ Multi-environment configuration
- ✅ Font Awesome icons
- ✅ Forgot password link
- ✅ Loading overlay
- ✅ Keyboard shortcuts (Ctrl+K untuk focus username)
- ✅ Profile fetching setelah login
- ✅ Better error messages

**Konfigurasi Environment:**

Edit bagian ini di dalam file untuk mengganti environment:

```javascript
const CURRENT_ENV = 'dev'; // Ubah ke 'dev', 'uat', atau 'production'
```

Environment URLs yang tersedia:
- **dev**: `https://com-danliris-service-auth-v8-dev.azurewebsites.net/v1/`
- **uat**: `https://com-danliris-service-auth-v8-uat.azurewebsites.net/v1/`
- **production**: `https://com-danliris-service-auth-v8.azurewebsites.net/v1/`

## Cara Kerja Autentikasi

1. **Input Credentials**: User memasukkan username dan password
2. **Encryption**: Kredensial dienkripsi menggunakan RSA public key
   ```javascript
   {
     username: "user",
     password: "pass",
     nonce: "uuid-v4",
     timestamp: "ISO-8601"
   }
   ```
3. **API Call**: POST ke `/authenticate` dengan `authEncrypted`
4. **Token Response**: Server mengembalikan JWT token
5. **Profile Fetch**: GET ke `/me` dengan Bearer token
6. **Storage**: Token dan profile disimpan ke localStorage
   - `aurelia_token`: JWT token
   - `aurelia_profile`: User profile JSON
   - `login_timestamp`: Waktu login
7. **Redirect**: Redirect ke aplikasi utama

## Integrasi dengan Aplikasi Aurelia

Token yang disimpan menggunakan key yang sama dengan Aurelia Authentication:
- `aurelia_token` - Kompatibel dengan aurelia-authentication plugin
- `aurelia_profile` - Format yang sama dengan profile store

Aplikasi Aurelia akan otomatis mengenali session yang sudah login.

## Testing

### Test dengan Browser
1. Buka file HTML di browser
2. Buka Developer Console (F12)
3. Login dengan kredensial valid
4. Check localStorage untuk melihat token tersimpan

### Test API Connection
Pastikan API endpoint dapat diakses:
```javascript
// Test di browser console
fetch('https://com-danliris-service-auth-v8-dev.azurewebsites.net/v1/')
  .then(r => console.log('API OK'))
  .catch(e => console.log('API Error:', e))
```

## Keamanan

1. **RSA Encryption**: Password tidak pernah dikirim plain text
2. **Nonce**: Mencegah replay attacks
3. **Timestamp**: Validasi freshness request
4. **HTTPS**: Semua komunikasi melalui HTTPS
5. **Token Storage**: JWT token di localStorage (standard untuk SPA)

## Customization

### Mengubah Warna Theme
Edit CSS gradient di bagian:
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### Mengubah Logo/Branding
Ganti bagian header dan logo di HTML

### Mengubah Redirect URL
Edit di konfigurasi:
```javascript
redirectUrl: '/'  // Ubah ke URL yang diinginkan
```

### Menambah Validasi Custom
Tambahkan validasi di fungsi `handleLogin()` sebelum `setLoading(true)`

## Troubleshooting

### Login Gagal
- ✓ Check koneksi internet
- ✓ Verify API endpoint di Network tab
- ✓ Check console untuk error messages
- ✓ Pastikan credentials benar

### Token Tidak Tersimpan
- ✓ Check browser localStorage quota
- ✓ Verify browser tidak dalam mode incognito
- ✓ Check browser console untuk errors

### Redirect Tidak Bekerja
- ✓ Verify `redirectUrl` configuration
- ✓ Check bahwa token tersimpan di localStorage
- ✓ Pastikan tidak ada error di console

## Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## Dependencies

### External Libraries
- **JSEncrypt 3.3.2**: RSA encryption library
  - CDN: `https://cdn.jsdelivr.net/npm/jsencrypt@3.3.2/bin/jsencrypt.min.js`
- **Font Awesome 5.15.4** (login-advanced.html only)
  - CDN: `https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css`

Tidak ada dependency lain - pure HTML, CSS, dan JavaScript!

## Migration dari Aurelia Login

Jika ingin mengganti login Aurelia dengan standalone:

1. Update routing untuk skip Aurelia login route
2. Set `login-standalone.html` atau `login-advanced.html` sebagai entry point
3. Pastikan token key compatibility (`aurelia_token`)
4. No code changes needed di aplikasi Aurelia

## License

Sesuai dengan lisensi project Dan Liris.

---

**Created**: November 2025  
**Version**: 1.0.0  
**Author**: GitHub Copilot
