/**
 * Login Configuration
 * Konfigurasi untuk memilih jenis login yang digunakan
 */

export const LOGIN_CONFIG = {
    // Pilih mode login:
    // 'standalone' - Menggunakan halaman login standalone (login-advanced.html)
    // 'aurelia' - Menggunakan login Aurelia bawaan (login.js)
    mode: 'standalone',
    
    // URL untuk standalone login
    standaloneLoginUrl: '/login-advanced.html',
    
    // Alternative: gunakan login-standalone.html untuk desain simple
    // standaloneLoginUrl: '/login-standalone.html',
    
    // Redirect URL setelah login berhasil
    redirectAfterLogin: '/',
    
    // Auto check session saat aplikasi dimuat
    autoCheckSession: true
};

export default LOGIN_CONFIG;
