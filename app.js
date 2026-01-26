// اضافه کردن این کد در ابتدای app.js
async function fixNFCPermission() {
    // 1. بررسی آیا قبلاً مجوز داده شده
    if (localStorage.getItem('nfc_permission_granted') === 'true') {
        AppState.nfcPermission = 'granted';
        return;
    }
    
    // 2. ایجاد دکمه مجوز بزرگ
    const permissionOverlay = document.createElement('div');
    permissionOverlay.id = 'permissionOverlay';
    permissionOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
    `;
    
    permissionOverlay.innerHTML = `
        <div style="
            background: white;
            padding: 30px;
            border-radius: 20px;
            max-width: 400px;
            text-align: center;
        ">
            <h2 style="color: #4f46e5;">🔓 مجوز NFC مورد نیاز است</h2>
            <p style="margin: 20px 0;">برای استفاده از سیستم حضور و غیاب، باید اجازه دسترسی به NFC را بدهید.</p>
            
            <div style="background: #f0f9ff; padding: 15px; border-radius: 10px; margin: 20px 0;">
                <strong>راهنمای سریع:</strong>
                <p style="font-size: 14px; margin-top: 10px;">
                    1. دکمه زیر را بزنید<br>
                    2. پنجره مجوز را تایید کنید<br>
                    3. اگر پنجره نیامد، مراحل راهنما را دنبال کنید
                </p>
            </div>
            
            <button id="grantPermissionBtn" style="
                padding: 15px 30px;
                background: #4f46e5;
                color: white;
                border: none;
                border-radius: 10px;
                font-size: 16px;
                cursor: pointer;
                width: 100%;
                margin-bottom: 10px;
            ">
                ✅ دادن مجوز NFC
            </button>
            
            <button onclick="location.reload()" style="
                padding: 10px 20px;
                background: #6b7280;
                color: white;
                border: none;
                border-radius: 10px;
                cursor: pointer;
            ">
                🔄 رفرش بعد از دادن مجوز
            </button>
        </div>
    `;
    
    document.body.appendChild(permissionOverlay);
    
    // دکمه مجوز
    document.getElementById('grantPermissionBtn').onclick = async () => {
        try {
            const ndef = new NDEFReader();
            await ndef.scan();
            
            // موفقیت‌آمیز
            localStorage.setItem('nfc_permission_granted', 'true');
            permissionOverlay.remove();
            
            // رفرش صفحه
            location.reload();
            
        } catch (error) {
            // خطا - نمایش راهنمای بیشتر
            permissionOverlay.innerHTML = `
                <div style="
                    background: white;
                    padding: 30px;
                    border-radius: 20px;
                    max-width: 400px;
                    text-align: right;
                ">
                    <h2 style="color: #dc2626;">⚠️ نیاز به تنظیم دستی</h2>
                    <p>لطفاً این مراحل را دنبال کنید:</p>
                    
                    <ol style="padding-right: 20px; margin: 20px 0;">
                        <li>روی آدرس بار کلیک کنید (بالای صفحه)</li>
                        <li>آیکون 🔒 یا "Not secure" را بزنید</li>
                        <li>"Site settings" را انتخاب کنید</li>
                        <li>به پایین اسکرول کنید تا NFC را ببینید</li>
                        <li>روی NFC کلیک کرده و "Allow" را انتخاب کنید</li>
                        <li>صفحه را رفرش کنید (F5 یا دکمه زیر)</li>
                    </ol>
                    
                    <div style="text-align: center;">
                        <button onclick="location.reload()" style="
                            padding: 12px 25px;
                            background: #4f46e5;
                            color: white;
                            border: none;
                            border-radius: 10px;
                            font-size: 16px;
                            cursor: pointer;
                            margin: 10px;
                        ">
                            🔄 رفرش صفحه
                        </button>
                    </div>
                </div>
            `;
        }
    };
}

// در initApp فراخوانی کنید:
// if (AppState.nfcPermission !== 'granted') {
//     fixNFCPermission();
// }
// وضعیت برنامه
const AppState = {
    mode: 'checkin', // 'checkin' یا 'checkout'
    nfcSupported: false,
    isScanning: false,
    lastScan: null,
    todayLogs: [],
    employees: {},
    settings: {
        companyName: 'شرکت من',
        autoExport: false
    }
};

// المنت‌های DOM
const elements = {
    scanBtn: null,
    scanText: null,
    scanIcon: null,
    nfcStatus: null,
    nfcStatusText: null,
    lastScanCard: null,
    lastScanResult: null,
    lastScanTime: null,
    todayLogs: null,
    todayCount: null,
    modeCheckin: null,
    modeCheckout: null
};

// اولیه‌سازی برنامه
async function initApp() {
    // ذخیره المنت‌ها
    cacheElements();
    
    // بارگذاری داده‌های ذخیره شده
    loadSavedData();
    
    // بررسی پشتیبانی NFC
    await checkNFCSupport();
    
    // به‌روزرسانی UI
    updateUI();
    
    // رویداد visibility change
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    console.log('🚀 اپلیکیشن آماده است');
}

// ذخیره المنت‌ها در cache
function cacheElements() {
    elements.scanBtn = document.getElementById('scanBtn');
    elements.scanText = document.getElementById('scanText');
    elements.scanIcon = document.getElementById('scanIcon');
    elements.nfcStatus = document.getElementById('nfcStatus');
    elements.nfcStatusText = document.getElementById('nfcStatusText');
    elements.lastScanCard = document.getElementById('lastScanCard');
    elements.lastScanResult = document.getElementById('lastScanResult');
    elements.lastScanTime = document.getElementById('lastScanTime');
    elements.todayLogs = document.getElementById('todayLogs');
    elements.todayCount = document.getElementById('todayCount');
    elements.modeCheckin = document.getElementById('modeCheckin');
    elements.modeCheckout = document.getElementById('modeCheckout');
}

// بارگذاری داده‌های ذخیره شده
function loadSavedData() {
    try {
        // بارگذاری تنظیمات
        const savedSettings = localStorage.getItem('nfcAttendance_settings');
        if (savedSettings) {
            AppState.settings = { ...AppState.settings, ...JSON.parse(savedSettings) };
        }
        
        // بارگذاری لاگ‌های امروز
        const savedLogs = localStorage.getItem('nfcAttendance_logs');
        if (savedLogs) {
            AppState.todayLogs = JSON.parse(savedLogs);
        }
        
        // بارگذاری اطلاعات کارمندان
        const savedEmployees = localStorage.getItem('nfcAttendance_employees');
        if (savedEmployees) {
            AppState.employees = JSON.parse(savedEmployees);
        }
        
        // بارگذاری آخرین اسکن
        const savedLastScan = localStorage.getItem('nfcAttendance_lastScan');
        if (savedLastScan) {
            AppState.lastScan = JSON.parse(savedLastScan);
        }
        
        console.log('📂 داده‌ها بارگذاری شدند');
    } catch (error) {
        console.error('❌ خطا در بارگذاری داده‌ها:', error);
    }
}

// ذخیره داده‌ها
function saveData() {
    try {
        localStorage.setItem('nfcAttendance_settings', JSON.stringify(AppState.settings));
        localStorage.setItem('nfcAttendance_logs', JSON.stringify(AppState.todayLogs));
        localStorage.setItem('nfcAttendance_employees', JSON.stringify(AppState.employees));
        if (AppState.lastScan) {
            localStorage.setItem('nfcAttendance_lastScan', JSON.stringify(AppState.lastScan));
        }
    } catch (error) {
        console.error('❌ خطا در ذخیره داده‌ها:', error);
    }
}

// بررسی پشتیبانی NFC
async function checkNFCSupport() {
    try {
        if (!('NDEFReader' in window)) {
            throw new Error('Web NFC API پشتیبانی نمی‌شود');
        }
        
        // تست دسترسی
        const ndef = new NDEFReader();
        
        // درخواست مجوز از کاربر (با timeout)
        const abortController = new AbortController();
        const timeoutId = setTimeout(() => abortController.abort(), 1000);
        
        try {
            await ndef.scan({ signal: abortController.signal });
            clearTimeout(timeoutId);
            
            AppState.nfcSupported = true;
            updateNFCStatus('✅ NFC پشتیبانی می‌شود', 'success');
            console.log('✅ Web NFC پشتیبانی می‌شود');
        } catch (scanError) {
            if (scanError.name === 'AbortError') {
                // Timeout - احتمالاً کاربر دسترسی نداده
                AppState.nfcSupported = true;
                updateNFCStatus('🔄 منتظر دسترسی NFC...', 'info');
                console.log('⚠️ منتظر دسترسی کاربر');
            } else {
                throw scanError;
            }
        }
        
    } catch (error) {
        AppState.nfcSupported = false;
        updateNFCStatus(`❌ خطا: ${error.message}`, 'error');
        console.error('❌ خطای NFC:', error);
    }
}

// به‌روزرسانی وضعیت NFC
function updateNFCStatus(message, type = 'info') {
    elements.nfcStatusText.textContent = message;
    elements.nfcStatus.className = 'status-card';
    
    if (type === 'success') {
        elements.nfcStatus.classList.add('success');
    } else if (type === 'error') {
        elements.nfcStatus.classList.add('error');
    }
}

// شروع اسکن NFC
async function startNFCScan() {
    if (AppState.isScanning) return;
    if (!AppState.nfcSupported) {
        alert('NFC پشتیبانی نمی‌شود. لطفاً از Chrome Android 89+ استفاده کنید.');
        return;
    }
    
    // شروع اسکن
    AppState.isScanning = true;
    updateScanButton(true);
    updateNFCStatus('🔄 در حال اسکن... کارت را نزدیک کنید', 'info');
    
    try {
        const ndef = new NDEFReader();
        
        // Timeout برای جلوگیری از انتظار بی‌پایان
        const timeoutId = setTimeout(() => {
            stopNFCScan();
            updateNFCStatus('⏰ زمان اسکن به پایان رسید', 'error');
            showNotification('زمان اسکن به پایان رسید');
        }, 15000);
        
        // شروع اسکن
        await ndef.scan();
        
        // رویداد خواندن کارت
        ndef.onreading = async (event) => {
            clearTimeout(timeoutId);
            
            try {
                // پردازش کارت
                await processNFCTag(event);
                
                // توقف اسکن
                stopNFCScan();
                
            } catch (error) {
                console.error('❌ خطا در پردازش کارت:', error);
                updateNFCStatus('❌ خطا در پردازش کارت', 'error');
                showNotification('خطا در پردازش کارت');
                stopNFCScan();
            }
        };
        
        // رویداد خطا
        ndef.onreadingerror = (error) => {
            clearTimeout(timeoutId);
            console.error('❌ خطای خواندن NFC:', error);
            updateNFCStatus('❌ خطا در خواندن کارت', 'error');
            showNotification('خطا در خواندن کارت');
            stopNFCScan();
        };
        
    } catch (error) {
        console.error('❌ خطای شروع اسکن:', error);
        updateNFCStatus(`❌ خطا: ${error.message}`, 'error');
        showNotification(`خطا: ${error.message}`);
        stopNFCScan();
    }
}

// توقف اسکن
function stopNFCScan() {
    AppState.isScanning = false;
    updateScanButton(false);
}

// به‌روزرسانی دکمه اسکن
function updateScanButton(isScanning) {
    if (isScanning) {
        elements.scanBtn.disabled = true;
        elements.scanText.textContent = 'در حال اسکن...';
        elements.scanIcon.textContent = '⏳';
        elements.scanBtn.classList.remove('pulse');
    } else {
        elements.scanBtn.disabled = false;
        elements.scanText.textContent = 'اسکن کارت NFC';
        elements.scanIcon.textContent = '📲';
        elements.scanBtn.classList.add('pulse');
    }
}

// پردازش کارت NFC
async function processNFCTag(event) {
    console.log('📱 کارت NFC خوانده شد:', event);
    
    // استخراج اطلاعات کارت
    const tagData = extractTagData(event);
    
    // پیدا کردن یا ایجاد کارمند
    const employee = await findOrCreateEmployee(tagData);
    
    // ثبت حضور/غیاب
    const attendanceRecord = createAttendanceRecord(employee);
    
    // ذخیره در تاریخچه
    AppState.todayLogs.unshift(attendanceRecord);
    
    // ذخیره آخرین اسکن
    AppState.lastScan = {
        employee: employee,
        record: attendanceRecord,
        timestamp: new Date().toISOString()
    };
    
    // ذخیره داده‌ها
    saveData();
    
    // به‌روزرسانی UI
    updateUI();
    
    // نمایش نتیجه
    showScanResult(employee, attendanceRecord);
    
    // بازخورد صوتی/لمسی
    provideFeedback('success');
    
    console.log('✅ حضور/غیاب ثبت شد:', attendanceRecord);
}

// استخراج اطلاعات از کارت NFC
function extractTagData(event) {
    const tagId = event.serialNumber || `tag_${Date.now()}`;
    let tagName = 'کاربر ناشناس';
    let tagData = {};
    
    // بررسی رکوردهای کارت
    for (const record of event.message.records) {
        if (record.recordType === "text") {
            const textDecoder = new TextDecoder();
            const textData = textDecoder.decode(record.data);
            
            try {
                // تلاش برای پارس JSON
                const jsonData = JSON.parse(textData);
                if (jsonData.name) tagName = jsonData.name;
                tagData = { ...tagData, ...jsonData };
            } catch {
                // اگر JSON نیست، استفاده از متن ساده
                tagName = textData || tagName;
            }
        }
    }
    
    return {
        id: tagId,
        name: tagName,
        rawData: tagData,
        timestamp: new Date().toISOString()
    };
}

// پیدا کردن یا ایجاد کارمند
async function findOrCreateEmployee(tagData) {
    // اگر کارمند از قبل وجود دارد
    if (AppState.employees[tagData.id]) {
        return AppState.employees[tagData.id];
    }
    
    // ایجاد کارمند جدید
    const newEmployee = {
        id: tagData.id,
        name: tagData.name,
        cardId: tagData.id,
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        totalCheckins: 0,
        totalCheckouts: 0
    };
    
    // ذخیره کارمند
    AppState.employees[tagData.id] = newEmployee;
    
    // نمایش پیام
    showNotification(`کارمند جدید ثبت شد: ${tagData.name}`);
    
    return newEmployee;
}

// ایجاد رکورد حضور/غیاب
function createAttendanceRecord(employee) {
    const now = new Date();
    
    // به‌روزرسانی آمار کارمند
    if (AppState.mode === 'checkin') {
        employee.totalCheckins = (employee.totalCheckins || 0) + 1;
    } else {
        employee.totalCheckouts = (employee.totalCheckouts || 0) + 1;
    }
    employee.lastSeen = now.toISOString();
    
    return {
        id: `log_${Date.now()}`,
        employeeId: employee.id,
        employeeName: employee.name,
        type: AppState.mode,
        timestamp: now.toISOString(),
        time: now.toLocaleTimeString('fa-IR'),
        date: now.toLocaleDateString('fa-IR'),
        dateISO: now.toISOString().split('T')[0]
    };
}

// نمایش نتیجه اسکن
function showScanResult(employee, record) {
    // نمایش در کارت آخرین اسکن
    elements.lastScanResult.innerHTML = `
        <strong>${employee.name}</strong>
        <span class="badge ${record.type === 'checkin' ? 'success' : 'error'}">
            ${record.type === 'checkin' ? 'ورود' : 'خروج'}
        </span>
    `;
    elements.lastScanTime.textContent = `${record.time} - ${record.date}`;
    
    // هایلایت کارت
    elements.lastScanCard.classList.add('success');
    setTimeout(() => {
        elements.lastScanCard.classList.remove('success');
    }, 2000);
    
    // نمایش نوتیفیکیشن
    showNotification(
        `${employee.name} - ${record.type === 'checkin' ? 'ورود' : 'خروج'} ثبت شد`,
        'success'
    );
}

// بازخورد صوتی/لمسی
function provideFeedback(type) {
    // ویبره
    if (navigator.vibrate) {
        const pattern = type === 'success' ? [100, 50, 100] : [200];
        navigator.vibrate(pattern);
    }
    
    // صدای بیپ (با Web Audio API)
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = type === 'success' ? 800 : 400;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
        // اگر Web Audio API کار نکرد
        console.log('🔇 Web Audio API پشتیبانی نمی‌شود');
    }
}

// نمایش نوتیفیکیشن
function showNotification(message, type = 'info') {
    // استفاده از Notification API اگر اجازه داده شده
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('حضور و غیاب NFC', {
            body: message,
            icon: 'icons/icon-192.png'
        });
    }
    
    // یا نمایش alert ساده
    console.log(`📢 ${message}`);
}

// تغییر حالت ورود/خروج
function setMode(mode) {
    AppState.mode = mode;
    
    // به‌روزرسانی UI
    elements.modeCheckin.classList.toggle('active', mode === 'checkin');
    elements.modeCheckout.classList.toggle('active', mode === 'checkout');
    
    // نمایش پیام
    const modeText = mode === 'checkin' ? 'ورود' : 'خروج';
    showNotification(`حالت تغییر کرد به: ${modeText}`);
}

// به‌روزرسانی UI
function updateUI() {
    // به‌روزرسانی تعداد لاگ‌های امروز
    const today = new Date().toISOString().split('T')[0];
    const todayCount = AppState.todayLogs.filter(log => 
        log.dateISO === today
    ).length;
    
    elements.todayCount.textContent = todayCount;
    elements.todayCount.className = `badge ${todayCount > 0 ? 'success' : 'error'}`;
    
    // نمایش لاگ‌های امروز
    renderTodayLogs();
    
    // نمایش آخرین اسکن
    if (AppState.lastScan) {
        const { employee, record } = AppState.lastScan;
        elements.lastScanResult.innerHTML = `
            <strong>${employee.name}</strong>
            <span class="badge ${record.type === 'checkin' ? 'success' : 'error'}">
                ${record.type === 'checkin' ? 'ورود' : 'خروج'}
            </span>
        `;
        elements.lastScanTime.textContent = `${record.time} - ${record.date}`;
    }
}

// رندر لاگ‌های امروز
function renderTodayLogs() {
    const today = new Date().toISOString().split('T')[0];
    const todayItems = AppState.todayLogs.filter(log => log.dateISO === today);
    
    if (todayItems.length === 0) {
        elements.todayLogs.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #6b7280;">
                📭 امروز هیچ رویدادی ثبت نشده
            </div>
        `;
        return;
    }
    
    elements.todayLogs.innerHTML = todayItems.map(log => `
        <div class="log-item">
            <div>
                <div class="log-name">${log.employeeName}</div>
                <div class="log-time">${log.time}</div>
            </div>
            <div class="log-type ${log.type}">
                ${log.type === 'checkin' ? 'ورود' : 'خروج'}
            </div>
        </div>
    `).join('');
}

// مدیریت visibility change
function handleVisibilityChange() {
    if (!document.hidden) {
        // وقتی کاربر به اپ برمی‌گردد
        updateUI();
    }
}

// نمایش تنظیمات
function showSettings() {
    document.getElementById('settingsModal').classList.remove('hidden');
}

// پنهان کردن تنظیمات
function hideSettings() {
    document.getElementById('settingsModal').classList.add('hidden');
}

// خروجی داده‌ها به Excel
function exportData() {
    try {
        // ساخت داده‌های CSV
        let csvContent = "data:text/csv;charset=utf-8,\ufeff";
        
        // هدر
        csvContent += "نام,نوع,زمان,تاریخ,شناسه کارت\n";
        
        // داده‌ها
        AppState.todayLogs.forEach(log => {
            const row = [
                `"${log.employeeName}"`,
                log.type === 'checkin' ? 'ورود' : 'خروج',
                `"${log.time}"`,
                `"${log.date}"`,
                `"${log.employeeId}"`
            ].join(',');
            
            csvContent += row + "\n";
        });
        
        // ایجاد لینک دانلود
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `attendance_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification('✅ فایل با موفقیت دانلود شد');
        
    } catch (error) {
        console.error('❌ خطا در خروجی:', error);
        alert('خطا در ایجاد فایل خروجی');
    }
}

// پاک‌سازی اطلاعات
function clearData() {
    if (confirm('آیا مطمئن هستید؟ این عمل همه اطلاعات را پاک می‌کند.')) {
        localStorage.clear();
        AppState.todayLogs = [];
        AppState.employees = {};
        AppState.lastScan = null;
        updateUI();
        showNotification('✅ اطلاعات پاک شدند');
    }
}

// نصب Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('✅ ServiceWorker ثبت شد:', registration.scope);
            })
            .catch(error => {
                console.log('❌ ثبت ServiceWorker ناموفق بود:', error);
            });
    });
}

// درخواست مجوز نوتیفیکیشن
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}

// راه‌اندازی اپ
window.addEventListener('DOMContentLoaded', initApp);

// رویداد قبل از بسته شدن
window.addEventListener('beforeunload', (event) => {
    if (AppState.isScanning) {
        event.preventDefault();
        event.returnValue = 'در حال اسکن هستید. آیا مطمئنید می‌خواهید خارج شوید؟';
    }
});

// اضافه کردن رویداد کلیک برای مودال
document.getElementById('settingsModal').addEventListener('click', (e) => {
    if (e.target.id === 'settingsModal') {
        hideSettings();
    }
});

