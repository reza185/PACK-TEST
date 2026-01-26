// وضعیت برنامه
let appState = {
    mode: 'check-in', // 'check-in' یا 'check-out'
    lastScan: null,
    isScanning: false
};

// صداها
const sounds = {
    success: new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ'),
    error: new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ')
};

// صدای ساده برای موفقیت
function playBeep(type = 'success') {
    try {
        const context = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(context.destination);
        
        oscillator.frequency.value = type === 'success' ? 800 : 400;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.5);
        
        oscillator.start(context.currentTime);
        oscillator.stop(context.currentTime + 0.5);
    } catch (e) {
        // اگر Web Audio API کار نکرد، از ویبره استفاده کن
        vibrate(type === 'success' ? [100, 50, 100] : [200]);
    }
}

// ویبره
function vibrate(pattern = [100]) {
    if (navigator.vibrate) {
        navigator.vibrate(pattern);
    }
}

// بررسی پشتیبانی NFC
function checkNFCSupport() {
    if (!('nfc' in navigator)) {
        showStatus('مرورگر شما از NFC پشتیبانی نمی‌کند. از Chrome اندروید استفاده کنید.', 'error');
        document.getElementById('scanButton').disabled = true;
        document.getElementById('buttonText').textContent = 'NFC پشتیبانی نمی‌شود';
        return false;
    }
    return true;
}

// شروع اسکن NFC
async function startNFCScan() {
    // بررسی پشتیبانی
    if (!checkNFCSupport()) return;
    
    if (appState.isScanning) return;
    
    appState.isScanning = true;
    const scanButton = document.getElementById('scanButton');
    const buttonText = document.getElementById('buttonText');
    
    // تغییر وضعیت دکمه
    scanButton.classList.remove('pulse');
    scanButton.disabled = true;
    buttonText.textContent = 'در حال اسکن... کارت را نزدیک کنید';
    showStatus('کارت NFC را پشت گوشی قرار دهید', 'waiting');
    
    try {
        const ndef = new NDEFReader();
        
        // شروع اسکن با timeout
        const timeout = setTimeout(() => {
            resetScanButton();
            showStatus('زمان اسکن به پایان رسید', 'error');
            playBeep('error');
        }, 15000);
        
        await ndef.scan();
        
        // رویداد خواندن کارت
        ndef.addEventListener("reading", ({ message, serialNumber }) => {
            clearTimeout(timeout);
            handleNFCCard(serialNumber, message.records);
            resetScanButton();
        });
        
        // خطای خواندن
        ndef.addEventListener("readingerror", () => {
            clearTimeout(timeout);
            resetScanButton();
            showStatus('خطا در خواندن کارت', 'error');
            playBeep('error');
        });
        
    } catch (error) {
        resetScanButton();
        showStatus(`خطا: ${error.message}`, 'error');
        playBeep('error');
    }
}

// بازنشانی دکمه اسکن
function resetScanButton() {
    appState.isScanning = false;
    const scanButton = document.getElementById('scanButton');
    const buttonText = document.getElementById('buttonText');
    
    scanButton.classList.add('pulse');
    scanButton.disabled = false;
    buttonText.textContent = 'اسکن کارت NFC';
}

// پردازش کارت NFC
function handleNFCCard(serialNumber, records) {
    try {
        // استخراج اطلاعات از کارت
        let cardData = {
            id: serialNumber,
            name: 'کاربر',
            timestamp: new Date()
        };
        
        // خواندن داده‌های کارت
        for (const record of records) {
            if (record.recordType === "text") {
                const textDecoder = new TextDecoder();
                const text = textDecoder.decode(record.data);
                
                try {
                    // سعی می‌کنیم JSON را parse کنیم
                    const jsonData = JSON.parse(text);
                    if (jsonData.name) {
                        cardData.name = jsonData.name;
                    }
                } catch {
                    // اگر JSON نیست، از متن ساده استفاده می‌کنیم
                    cardData.name = text || 'کاربر';
                }
            }
        }
        
        // ذخیره آخرین اسکن
        appState.lastScan = {
            ...cardData,
            mode: appState.mode,
            time: cardData.timestamp.toLocaleTimeString('fa-IR'),
            date: cardData.timestamp.toLocaleDateString('fa-IR')
        };
        
        // نمایش اطلاعات
        displayLastScan();
        
        // پخش صدای موفقیت
        playBeep('success');
        
        // ویبره
        vibrate([100, 50, 100]);
        
        // نمایش پیام موفقیت
        showStatus(
            `${cardData.name} - ${appState.mode === 'check-in' ? 'ورود' : 'خروج'} ثبت شد`,
            'success'
        );
        
        // لاگ در کنسول
        console.log('✅ NFC Scan Successful:', {
            id: serialNumber,
            name: cardData.name,
            mode: appState.mode,
            time: new Date().toLocaleString('fa-IR')
        });
        
    } catch (error) {
        console.error('❌ Error processing NFC card:', error);
        showStatus('خطا در پردازش کارت', 'error');
        playBeep('error');
    }
}

// نمایش آخرین اسکن
function displayLastScan() {
    if (!appState.lastScan) return;
    
    const scan = appState.lastScan;
    
    // به روزرسانی UI
    document.getElementById('lastName').textContent = scan.name;
    document.getElementById('lastStatus').textContent = scan.mode === 'check-in' ? 'ورود' : 'خروج';
    document.getElementById('lastTime').textContent = `${scan.time} - ${scan.date}`;
    document.getElementById('lastId').textContent = 
        scan.id.substring(0, 8) + '...' + scan.id.substring(scan.id.length - 4);
    
    // رنگ‌آمیزی وضعیت
    const statusElement = document.getElementById('lastStatus');
    statusElement.style.color = scan.mode === 'check-in' ? '#28a745' : '#dc3545';
}

// تغییر حالت ورود/خروج
function toggleMode() {
    appState.mode = appState.mode === 'check-in' ? 'check-out' : 'check-in';
    updateModeUI();
    playBeep('success');
    vibrate([50]);
    
    // نمایش پیام
    const modeText = appState.mode === 'check-in' ? 'ورود' : 'خروج';
    showStatus(`حالت تغییر کرد به: ${modeText}`, 'success');
}

// به روزرسانی نمایش حالت
function updateModeUI() {
    const modeIndicator = document.getElementById('modeIndicator');
    const modeText = document.getElementById('modeText');
    const modeTime = document.getElementById('modeTime');
    
    if (appState.mode === 'check-in') {
        modeIndicator.className = 'mode-indicator check-in';
        modeText.textContent = 'ورود';
        modeText.style.color = '#28a745';
    } else {
        modeIndicator.className = 'mode-indicator check-out';
        modeText.textContent = 'خروج';
        modeText.style.color = '#dc3545';
    }
    
    // نمایش زمان آخرین تغییر
    const now = new Date();
    modeTime.textContent = `آخرین تغییر: ${now.toLocaleTimeString('fa-IR')}`;
}

// نمایش وضعیت
function showStatus(message, type = 'info') {
    const statusElement = document.getElementById('statusMessage');
    
    // پاک کردن کلاس‌های قبلی
    statusElement.className = 'status';
    
    // اضافه کردن کلاس جدید
    switch (type) {
        case 'success':
            statusElement.classList.add('status-success');
            break;
        case 'error':
            statusElement.classList.add('status-error');
            break;
        case 'waiting':
            statusElement.classList.add('status-waiting');
            break;
    }
    
    // نمایش پیام
    statusElement.textContent = message;
    
    // پاک کردن خودکار بعد از 3 ثانیه
    if (type !== 'waiting') {
        setTimeout(() => {
            if (statusElement.textContent === message) {
                statusElement.textContent = 'آماده اسکن';
                statusElement.className = 'status';
            }
        }, 3000);
    }
}

// اولیه‌سازی برنامه
function initializeApp() {
    // بررسی پشتیبانی NFC
    checkNFCSupport();
    
    // به روزرسانی UI اولیه
    updateModeUI();
    
    // نمایش پیام خوشامدگویی
    setTimeout(() => {
        showStatus('سیستم آماده است. برای شروع اسکن کنید.', 'success');
    }, 1000);
    
    // ذخیره نمونه‌ای برای نمایش اولیه
    appState.lastScan = {
        name: 'نمونه',
        mode: 'check-in',
        time: '--:--',
        date: '--/--/----',
        id: '000000000000'
    };
    displayLastScan();
    
    // اضافه کردن اطلاعات دستگاه به کنسول
    console.log('📱 NFC Attendance PWA Started');
    console.log('🌐 User Agent:', navigator.userAgent);
    console.log('🔧 NFC Support:', 'nfc' in navigator);
}

// رویداد بارگذاری صفحه
window.addEventListener('DOMContentLoaded', initializeApp);

// رویداد visibility change (برای وقتی که برگشتیم به اپ)
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        updateModeUI();
        showStatus('سیستم فعال شد', 'success');
    }
});

// رویداد قبل از بسته شدن
window.addEventListener('beforeunload', (event) => {
    if (appState.isScanning) {
        event.preventDefault();
        event.returnValue = 'در حال اسکن هستید. آیا مطمئنید می‌خواهید خارج شوید؟';
        return event.returnValue;
    }
});

// نمونه‌سازی کارت برای تست
function simulateNFCCard() {
    const testData = {
        id: 'test_' + Date.now(),
        name: 'کاربر تست',
        timestamp: new Date()
    };
    
    appState.lastScan = {
        ...testData,
        mode: appState.mode,
        time: testData.timestamp.toLocaleTimeString('fa-IR'),
        date: testData.timestamp.toLocaleDateString('fa-IR')
    };
    
    displayLastScan();
    playBeep('success');
    showStatus(`${testData.name} - ${appState.mode === 'check-in' ? 'ورود' : 'خروج'} تست ثبت شد`, 'success');
    
    console.log('🔧 Test NFC Scan:', testData);
}

// برای تست: اضافه کردن دکمه تست در کنسول
console.log('برای تست از دستور simulateNFCCard() استفاده کنید');