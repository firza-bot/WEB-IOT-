// Data akun demo (opsional)
const demoAccounts = {
    'admin@iot-rainwater.com': {
        password: 'admin123',
        name: 'Administrator',
        role: 'Administrator',
        permissions: ['read', 'write', 'control', 'settings']
    },
    'operator@iot-rainwater.com': {
        password: 'operator123',
        name: 'Operator Sistem',
        role: 'Operator',
        permissions: ['read', 'write', 'control']
    },
    'teknisi@iot-rainwater.com': {
        password: 'teknisi123',
        name: 'Teknisi Lapangan',
        role: 'Teknisi',
        permissions: ['read', 'write']
    }
};

// Konfigurasi login
const loginConfig = {
    allowDemoAccounts: false,     // Disable demo accounts untuk UI yang clean
    allowPersonalEmails: true,    // Enable email pribadi
    defaultRole: 'User',          // Role default untuk email pribadi
    defaultPermissions: ['read', 'write'], // Permission default lebih banyak
    requirePasswordValidation: false, // Validasi password simple
    minPasswordLength: 6
};

// State management
let currentUser = null;
let isLoggedIn = false;

// Simulasi data real-time
let pumpActive = false;
let filterActive = false;
let autoMode = false;

// Data grafik pengumpulan air (7 hari terakhir)
let chartData = {
    labels: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'],
    waterCollection: [45, 67, 89, 123, 78, 156, 134], // dalam Liter
    rainfall: [5, 12, 18, 25, 15, 32, 28], // dalam mm
    temperature: [28, 29, 27, 30, 28, 26, 29], // dalam °C
    humidity: [75, 82, 78, 85, 79, 88, 83] // dalam %
};

// Data historis untuk trending
let historicalData = [];

// Inisialisasi data historis
function initializeHistoricalData() {
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
        const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
        historicalData.push({
            date: date,
            waterCollection: Math.floor(Math.random() * 100) + 50,
            rainfall: Math.floor(Math.random() * 30) + 5,
            temperature: Math.floor(Math.random() * 8) + 25,
            humidity: Math.floor(Math.random() * 20) + 70
        });
    }
}

// Check if user is already logged in (simulate session)
window.addEventListener('load', function() {
    // Inisialisasi data grafik
    initializeHistoricalData();
    
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        isLoggedIn = true;
        showDashboard();
    } else {
        showLoginModal();
    }
});

// Login form handler
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    login();
});

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Whether email is valid
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {boolean} Whether password meets requirements
 */
function isValidPassword(password) {
    if (!loginConfig.requirePasswordValidation) {
        return password.length >= loginConfig.minPasswordLength;
    }
    
    // Untuk validasi yang lebih ketat (opsional)
    const hasMinLength = password.length >= loginConfig.minPasswordLength;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    
    return hasMinLength && hasUpperCase && hasLowerCase && hasNumbers;
}

/**
 * Generate user data for personal email
 * @param {string} email - User email
 * @returns {Object} User data object
 */
function generatePersonalUserData(email) {
    // Extract name from email (before @)
    const emailName = email.split('@')[0];
    const displayName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
    
    return {
        email: email,
        name: displayName,
        role: loginConfig.defaultRole,
        permissions: [...loginConfig.defaultPermissions]
    };
}

/**
 * Fill demo account credentials (disabled for clean UI)
 * @param {string} type - Type of demo account (admin, operator, teknisi)
 */
function fillDemoAccount(type) {
    // Demo accounts disabled untuk UI yang clean
    console.log('Demo accounts are disabled for clean UI');
    return;
}

/**
 * Handle user login with support for both demo and personal accounts
 */
function login() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const loginBtn = document.getElementById('loginBtn');
    const loginBtnText = document.getElementById('loginBtnText');

    // Validasi input
    if (!email || !password) {
        alert('❌ Mohon masukkan email dan password!');
        return;
    }

    if (!isValidEmail(email)) {
        alert('❌ Format email tidak valid!');
        return;
    }

    if (!isValidPassword(password)) {
        let message = `❌ Password harus minimal ${loginConfig.minPasswordLength} karakter`;
        if (loginConfig.requirePasswordValidation) {
            message += ' dan mengandung huruf besar, huruf kecil, dan angka';
        }
        alert(message);
        return;
    }

    // Show loading state
    loginBtn.disabled = true;
    loginBtnText.innerHTML = '<span class="loading"></span> Memverifikasi...';

    // Simulate authentication delay
    setTimeout(() => {
        let userData = null;

        // Check demo accounts first (if enabled)
        if (loginConfig.allowDemoAccounts && demoAccounts[email] && demoAccounts[email].password === password) {
            userData = {
                email: email,
                name: demoAccounts[email].name,
                role: demoAccounts[email].role,
                permissions: demoAccounts[email].permissions,
                accountType: 'demo'
            };
        }
        // Allow personal emails (if enabled)
        else if (loginConfig.allowPersonalEmails) {
            userData = {
                ...generatePersonalUserData(email),
                accountType: 'personal'
            };
        }

        if (userData) {
            // Successful login
            currentUser = userData;
            isLoggedIn = true;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            showDashboard();
            
            // Show welcome message for personal accounts
            if (userData.accountType === 'personal') {
                setTimeout(() => {
                    alert(`🎉 Selamat datang, ${userData.name}!\n\nAnda login sebagai ${userData.role} dengan akses: ${userData.permissions.join(', ')}`);
                }, 1000);
            }
        } else {
            // Failed login
            let errorMessage = '❌ Login gagal!\n\n';
            
            if (!loginConfig.allowPersonalEmails && !demoAccounts[email]) {
                errorMessage += 'Email tidak terdaftar. Silakan gunakan akun demo yang tersedia.';
            } else if (demoAccounts[email] && demoAccounts[email].password !== password) {
                errorMessage += 'Password salah untuk akun demo ini.';
            } else {
                errorMessage += 'Terjadi kesalahan dalam proses login.';
            }
            
            alert(errorMessage);
            loginBtn.disabled = false;
            loginBtnText.textContent = 'Masuk ke Dashboard';
        }
    }, 1500);
}

/**
 * Handle user logout
 */
function logout() {
    if (confirm('Apakah Anda yakin ingin keluar dari sistem?')) {
        currentUser = null;
        isLoggedIn = false;
        localStorage.removeItem('currentUser');
        
        // Stop real-time updates
        if (window.dataUpdateInterval) {
            clearInterval(window.dataUpdateInterval);
            window.dataUpdateInterval = null;
        }
        
        // Hide dashboard and show login
        document.getElementById('dashboardContent').classList.add('hidden');
        document.getElementById('userInfoBar').classList.add('hidden');
        document.getElementById('loginModal').classList.remove('hidden');
        
        // Reset form
        document.getElementById('loginForm').reset();
    }
}

/**
 * Show login modal
 */
function showLoginModal() {
    document.getElementById('loginModal').classList.remove('hidden');
    document.getElementById('dashboardContent').classList.add('hidden');
    document.getElementById('userInfoBar').classList.add('hidden');
}

/**
 * Show dashboard after successful login
 */
function showDashboard() {
    // Hide login modal
    document.getElementById('loginModal').classList.add('hidden');
    
    // Show dashboard content
    document.getElementById('dashboardContent').classList.remove('hidden');
    
    // Update user info bar
    updateUserInfoBar();
    document.getElementById('userInfoBar').classList.remove('hidden');
    
    // Start real-time updates
    if (!window.dataUpdateInterval) {
        window.dataUpdateInterval = setInterval(updateData, 5000);
    }
    
    // Inisialisasi grafik
    updateChartVisualization();
}

/**
 * Update user information in the user info bar
 */
function updateUserInfoBar() {
    if (currentUser) {
        document.getElementById('userAvatar').textContent = currentUser.name.charAt(0).toUpperCase();
        document.getElementById('userName').textContent = currentUser.name;
        document.getElementById('userRole').textContent = currentUser.role;
    }
}

/**
 * Update sensor data with simulated values
 */
function updateData() {
    if (!isLoggedIn) return;
    
    // Simulasi update nilai sensor
    const totalWater = document.getElementById('totalWater');
    const dailyCollection = document.getElementById('dailyCollection');
    const temperature = document.getElementById('temperature');
    const humidity = document.getElementById('humidity');

    // Update dengan variasi kecil
    if (totalWater) {
        totalWater.textContent = (parseInt(totalWater.textContent.replace(',', '')) + Math.floor(Math.random() * 5)).toLocaleString();
        dailyCollection.textContent = Math.max(0, parseInt(dailyCollection.textContent) + Math.floor(Math.random() * 3 - 1));
        temperature.textContent = (27 + Math.random() * 4).toFixed(1) + '°C';
        humidity.textContent = Math.floor(70 + Math.random() * 20) + '%';
    }

    // Update data grafik secara real-time
    updateChartData();
}

/**
 * Update chart data dengan nilai baru
 */
function updateChartData() {
    // Simulasi data baru
    const newWaterCollection = Math.floor(Math.random() * 50) + 80;
    const newRainfall = Math.floor(Math.random() * 15) + 10;
    const newTemp = Math.floor(Math.random() * 5) + 27;
    const newHumidity = Math.floor(Math.random() * 15) + 75;

    // Update data hari ini (indeks terakhir)
    const lastIndex = chartData.waterCollection.length - 1;
    chartData.waterCollection[lastIndex] = newWaterCollection;
    chartData.rainfall[lastIndex] = newRainfall;
    chartData.temperature[lastIndex] = newTemp;
    chartData.humidity[lastIndex] = newHumidity;

    // Update visualisasi grafik
    updateChartVisualization();
}

/**
 * Update visualisasi grafik di UI
 */
function updateChartVisualization() {
    const chartLine = document.querySelector('.chart-line');
    if (chartLine) {
        // Hitung tinggi berdasarkan data terbaru
        const maxValue = Math.max(...chartData.waterCollection);
        const currentValue = chartData.waterCollection[chartData.waterCollection.length - 1];
        const heightPercentage = (currentValue / maxValue) * 80; // max 80% tinggi container
        
        chartLine.style.height = `${heightPercentage}%`;
        
        // Update gradient berdasarkan performa
        if (currentValue > maxValue * 0.8) {
            chartLine.style.background = 'linear-gradient(180deg, rgba(120, 120, 120, 0.3) 0%, rgba(180, 180, 180, 0.8) 100%)';
        } else if (currentValue > maxValue * 0.5) {
            chartLine.style.background = 'linear-gradient(180deg, rgba(120, 120, 120, 0.2) 0%, rgba(160, 160, 160, 0.7) 100%)';
        } else {
            chartLine.style.background = 'linear-gradient(180deg, rgba(100, 100, 100, 0.2) 0%, rgba(140, 140, 140, 0.6) 100%)';
        }
    }
}

/**
 * Generate chart data untuk periode tertentu
 * @param {number} days - Jumlah hari ke belakang
 * @returns {Object} Data grafik
 */
function generateChartData(days = 7) {
    const data = {
        labels: [],
        waterCollection: [],
        rainfall: [],
        temperature: [],
        humidity: []
    };

    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
        const dayName = dayNames[date.getDay()];
        
        data.labels.push(dayName);
        data.waterCollection.push(Math.floor(Math.random() * 100) + 50);
        data.rainfall.push(Math.floor(Math.random() * 30) + 5);
        data.temperature.push(Math.floor(Math.random() * 8) + 25);
        data.humidity.push(Math.floor(Math.random() * 20) + 70);
    }

    return data;
}

/**
 * Export data grafik ke format CSV
 * @returns {string} Data dalam format CSV
 */
function exportChartDataToCSV() {
    let csv = 'Hari,Pengumpulan Air (L),Curah Hujan (mm),Suhu (°C),Kelembaban (%)\n';
    
    for (let i = 0; i < chartData.labels.length; i++) {
        csv += `${chartData.labels[i]},${chartData.waterCollection[i]},${chartData.rainfall[i]},${chartData.temperature[i]},${chartData.humidity[i]}\n`;
    }
    
    return csv;
}

/**
 * Get statistik dari data grafik
 * @returns {Object} Statistik data
 */
function getChartStatistics() {
    const stats = {
        waterCollection: {
            total: chartData.waterCollection.reduce((a, b) => a + b, 0),
            average: chartData.waterCollection.reduce((a, b) => a + b, 0) / chartData.waterCollection.length,
            max: Math.max(...chartData.waterCollection),
            min: Math.min(...chartData.waterCollection)
        },
        rainfall: {
            total: chartData.rainfall.reduce((a, b) => a + b, 0),
            average: chartData.rainfall.reduce((a, b) => a + b, 0) / chartData.rainfall.length,
            max: Math.max(...chartData.rainfall),
            min: Math.min(...chartData.rainfall)
        }
    };
    
    return stats;
}

/**
 * Toggle pump status
 */
function togglePump() {
    if (!currentUser.permissions.includes('control')) {
        alert('❌ Anda tidak memiliki izin untuk mengontrol pompa!');
        return;
    }
    
    pumpActive = !pumpActive;
    const button = document.getElementById('pumpStatus');
    if (pumpActive) {
        button.innerHTML = '<span class="loading"></span> Pompa Aktif';
        button.parentElement.style.background = 'rgba(100, 100, 100, 0.9)';
    } else {
        button.textContent = 'Aktifkan Pompa';
        button.parentElement.style.background = 'rgba(80, 80, 80, 0.9)';
    }
}

/**
 * Toggle filter status
 */
function toggleFilter() {
    if (!currentUser.permissions.includes('control')) {
        alert('❌ Anda tidak memiliki izin untuk mengontrol filter!');
        return;
    }
    
    filterActive = !filterActive;
    const button = document.getElementById('filterStatus');
    if (filterActive) {
        button.innerHTML = '<span class="loading"></span> Filter Berjalan';
        button.parentElement.style.background = 'rgba(80, 80, 80, 0.9)';
    } else {
        button.textContent = 'Mulai Penyaringan';
        button.parentElement.style.background = 'rgba(60, 60, 60, 0.9)';
    }
}

/**
 * Toggle automatic mode
 */
function toggleAuto() {
    if (!currentUser.permissions.includes('control')) {
        alert('❌ Anda tidak memiliki izin untuk mengaktifkan mode otomatis!');
        return;
    }
    
    autoMode = !autoMode;
    const button = document.getElementById('autoStatus');
    if (autoMode) {
        button.innerHTML = '<span class="loading"></span> Mode Auto Aktif';
        button.parentElement.style.background = 'rgba(90, 90, 90, 0.9)';
    } else {
        button.textContent = 'Aktifkan Auto Mode';
        button.parentElement.style.background = 'rgba(70, 70, 70, 0.9)';
    }
}

/**
 * Check and adjust layout for mobile devices
 */
function checkMobile() {
    if (window.innerWidth <= 768) {
        document.querySelectorAll('.status-item').forEach(item => {
            item.style.minWidth = '100%';
        });
    } else {
        document.querySelectorAll('.status-item').forEach(item => {
            item.style.minWidth = '200px';
        });
    }
}

// Event listeners
window.addEventListener('resize', checkMobile);
window.addEventListener('load', checkMobile);

// Initialize mobile check
checkMobile();

// Utility functions for future enhancements

/**
 * Show notification to user
 * @param {string} message - Message to display
 * @param {string} type - Type of notification (success, warning, error, info)
 */
function showNotification(message, type = 'info') {
    // This can be enhanced with a proper notification system
    console.log(`[${type.toUpperCase()}] ${message}`);
}

/**
 * Format date for display
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
function formatDate(date) {
    return new Intl.DateTimeFormat('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

/**
 * Validate user permissions
 * @param {string} action - Action to validate
 * @returns {boolean} Whether user has permission
 */
function hasPermission(action) {
    return currentUser && currentUser.permissions.includes(action);
}

/**
 * Get current system status
 * @returns {Object} Current status of all systems
 */
function getSystemStatus() {
    return {
        pump: pumpActive,
        filter: filterActive,
        autoMode: autoMode,
        user: currentUser,
        timestamp: new Date()
    };
}

// Debug functions (remove in production)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.debugDashboard = {
        getCurrentUser: () => currentUser,
        getSystemStatus: getSystemStatus,
        getChartData: () => chartData,
        getChartStats: getChartStatistics,
        exportCSV: exportChartDataToCSV,
        generateNewData: (days) => {
            chartData = generateChartData(days);
            updateChartVisualization();
        },
        // Login configuration
        getLoginConfig: () => loginConfig,
        setLoginConfig: (newConfig) => {
            Object.assign(loginConfig, newConfig);
            console.log('Login config updated:', loginConfig);
        },
        // Quick login functions
        loginAsPersonal: (email, password = '123456') => {
            document.getElementById('email').value = email;
            document.getElementById('password').value = password;
            login();
        },
        forceLogin: (email) => {
            if (demoAccounts[email]) {
                currentUser = {
                    email: email,
                    name: demoAccounts[email].name,
                    role: demoAccounts[email].role,
                    permissions: demoAccounts[email].permissions,
                    accountType: 'demo'
                };
            } else {
                currentUser = {
                    ...generatePersonalUserData(email),
                    accountType: 'personal'
                };
            }
            isLoggedIn = true;
            showDashboard();
        },
        resetData: () => {
            localStorage.clear();
            location.reload();
        }
    };
    
    console.log('🐛 Debug functions available:', Object.keys(window.debugDashboard));
    console.log('📊 Chart data sample:', chartData);
    console.log('⚙️ Login config:', loginConfig);
    console.log('💡 Try: debugDashboard.loginAsPersonal("john@gmail.com")');
}