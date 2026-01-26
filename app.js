// وضعیت برنامه
const state = {
    mode: 'checkin',
    nfcSupported: false,
    nfcPermission: 'prompt',
    isScanning: false,
    lastScan: null,
    logs: [],
    employees: {}
};

// المنت‌های DOM
const elements = {
    nfcStatus: document.getElementById('nfcStatus'),
    nfcStatusText: document.getElementById('nfcStatusText'),
    scanBtn: document.getElementById('scanBtn'),
    scanText: document.getElementById('scanText'),
    scanIcon: document.getElementById('scanIcon'),
    modeCheckin: document.getElementById('modeCheckin'),
    modeCheckout: document.getElementById('modeCheckout'),
    scanResult: document.getElementById('scanResult'),
    scanTime: document.getElementById('scanTime'),
    todayLogs: document.getElementById('todayLogs'),
    todayCount: document.getElementById('todayCount')
};

// شروع برنامه
window.addEventListener('DOMContentLoaded', initApp);

// اولیه‌سازی برنامه
async function initApp() {
    console.log('🚀 شروع برنامه...');
    
    // بارگذاری داده‌های ذخیره شده
    loadData();
    
    // بررسی و درخواست مجوز NFC
    await checkNFCSupport();
    
    // به‌روزرسانی UI
    updateUI();
    
    // رویداد visibility change
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) updateUI();
    });
}

// بارگذاری داده‌ها
function loadData() {
    try {
        const savedLogs = localStorage.getItem('nfc_logs');
        if (savedLogs) state.logs = JSON.parse(savedLogs);
        
        const savedEmployees = localStorage.getItem('nfc_employees');
        if (savedEmployees) state.employees = JSON.parse(savedEmployees);
        
        const savedLastScan = localStorage.getItem('nfc_lastScan');
        if (savedLastScan) state.lastScan = JSON.parse(savedLastScan);
        
        console.log('📂 داده‌ها بارگذاری شدند');
    } catch (e) {
        console.error('❌ خطا در بارگذاری:', e);
    }
}

// ذخیره داده‌ها
function saveData() {
    try {
        localStorage.setItem('nfc_logs', JSON.stringify(state.logs));
        localStorage.setItem('nfc_employees', JSON.stringify(state.employees));
        if (state.lastScan) {
            localStorage.setItem('nfc_lastScan', JSON.stringify(state.lastScan));
        }
    } catch (e) {
        console.error('❌ خطا در ذخیره:', e);
    }
}

// بررسی پشتیبانی NFC
async function checkNFCSupport() {
    if (!('NDEFReader' in window)) {
        updateStatus('❌ Web NFC پشتیبانی نمی‌شود. از Chrome Android استفاده کنید.', 'error');
        elements.scanBtn.disabled = true;
        return;
    }
    
    updateStatus('✅ NFC پشتیبانی می‌شود', 'success');
    state.nfcSupported = true;
    
    // تست مجوز
    await testNFCPermission();
}

// تست مجوز NFC
async function testNFCPermission() {
    try {
        const ndef = new NDEFReader();
        await ndef.scan();
        state.nfcPermission = 'granted';
        updateStatus('✅ مجوز NFC داده شده', 'success');
    } catch (error) {
        if (error.name === 'NotAllowedError') {
            state.nfcPermission = 'denied';
            updateStatus('❌ دسترسی NFC رد شده. لطفاً مجوز دهید.', 'error');
            showPermissionGuide();
        } else {
            state.nfcPermission = 'prompt';
            updateStatus('🔒 لطفاً مجوز NFC را بدهید', 'info');
        }
    }
}

// نمایش راهنمای مجوز
function showPermissionGuide() {
    const guide = `
        <div style="margin-top: 15px; padding: 15px; background: #fff3cd; border-radius: 8px; color: #856404;">
            <strong>راهنمای دادن مجوز:</strong>
            <ol style="margin-top: 10px; padding-right: 20px;">
                <li>روی آدرس بار (URL) در بالا کلیک کنید</li>
                <li>آیکون 🔒 یا "Not secure" را بزنید</li>
                <li>"Site settings" را انتخاب کنید</li>
                <li>به پایین اسکرول کنید و "NFC" را پیدا کنید</li>
                <li>آن را به "Allow" تغییر دهید</li>
                <li>صفحه را رفرش کنید</li>
            </ol>
            <button onclick="location.reload()" style="
                margin-top: 10px;
                padding: 8px 16px;
                background: #856404;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
            ">
                🔄 رفرش صفحه
            </button>
        </div>
    `;
    
    elements.nfcStatus.innerHTML += guide;
}

// به‌روزرسانی وضعیت
function updateStatus(message, type = 'info') {
    elements.nfcStatusText.textContent = message;
    elements.nfcStatus.className = 'status-card';
    
    if (type === 'success') elements.nfcStatus.classList.add('status-success');
    if (type === 'error') elements.nfcStatus.classList.add('status-error');
}

// شروع اسکن NFC
async function startNFCScan() {
    if (!state.nfcSupported) {
        alert('NFC پشتیبانی نمی‌شود');
        return;
    }
    
    if (state.isScanning) return;
    
    state.isScanning = true;
    updateScanButton(true);
    updateStatus('🔄 در حال اسکن... کارت را نزدیک کنید', 'info');
    
    try {
        const ndef = new NDEFReader();
        
        // Timeout برای جلوگیری از انتظار بی‌پایان
        const timeoutId = setTimeout(() => {
            stopScanning();
            updateStatus('⏰ زمان اسکن به پایان رسید', 'error');
        }, 30000);
        
        console.log('🔄 شروع اسکن NFC...');
        
        // درخواست مجوز و شروع اسکن
        await ndef.scan();
        
        ndef.onreading = (event) => {
            clearTimeout(timeoutId);
            console.log('✅ کارت خوانده شد:', event);
            
            try {
                processNFCTag(event);
                updateStatus('✅ کارت با موفقیت خوانده شد', 'success');
                stopScanning();
            } catch (error) {
                console.error('❌ خطا در پردازش:', error);
                updateStatus('❌ خطا در پردازش کارت', 'error');
                stopScanning();
            }
        };
        
        ndef.onreadingerror = (error) => {
            clearTimeout(timeoutId);
            console.error('❌ خطای NFC:', error);
            updateStatus('❌ خطا در خواندن کارت', 'error');
            stopScanning();
        };
        
    } catch (error) {
        console.error('❌ خطای اسکن:', error);
        
        if (error.name === 'NotAllowedError') {
            updateStatus('❌ دسترسی رد شده. لطفاً مجوز دهید.', 'error');
            showPermissionGuide();
        } else {
            updateStatus(`❌ خطا: ${error.message}`, 'error');
        }
        
        stopScanning();
    }
}

// توقف اسکن
function stopScanning() {
    state.isScanning = false;
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
function processNFCTag(event) {
    console.log('🔍 پردازش کارت...');
    
    // استخراج اطلاعات
    const tagId = event.serialNumber || `tag_${Date.now()}`;
    let employeeName = 'کاربر ناشناس';
    let tagData = {};
    
    // خواندن رکوردهای کارت
    for (const record of event.message.records) {
        if (record.recordType === "text") {
            const decoder = new TextDecoder();
            const text = decoder.decode(record.data);
            
            try {
                const jsonData = JSON.parse(text);
                if (jsonData.name) employeeName = jsonData.name;
                tagData = { ...jsonData };
            } catch {
                employeeName = text || employeeName;
            }
        }
    }
    
    // پیدا کردن یا ایجاد کارمند
    if (!state.employees[tagId]) {
        state.employees[tagId] = {
            id: tagId,
            name: employeeName,
            firstSeen: new Date().toISOString()
        };
    }
    
    const employee = state.employees[tagId];
    
    // ایجاد رکورد حضور/غیاب
    const now = new Date();
    const logEntry = {
        id: `log_${Date.now()}`,
        employeeId: tagId,
        employeeName: employee.name,
        type: state.mode,
        timestamp: now.toISOString(),
        time: now.toLocaleTimeString('fa-IR'),
        date: now.toLocaleDateString('fa-IR'),
        rawData: tagData
    };
    
    // اضافه کردن به تاریخچه
    state.logs.unshift(logEntry);
    
    // ذخیره آخرین اسکن
    state.lastScan = {
        employee: employee,
        log: logEntry,
        timestamp: now.toISOString()
    };
    
    // ذخیره داده‌ها
    saveData();
    
    // نمایش نتیجه
    showScanResult(employee, logEntry);
    
    // به‌روزرسانی UI
    updateUI();
    
    // بازخورد
    provideFeedback();
    
    console.log('📝 رکورد ثبت شد:', logEntry);
}

// نمایش نتیجه اسکن
function showScanResult(employee, log) {
    const typeText = log.type === 'checkin' ? 'ورود' : 'خروج';
    const typeClass = log.type === 'checkin' ? 'checkin' : 'checkout';
    
    elements.scanResult.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <strong>${employee.name}</strong>
            <span class="log-type ${typeClass}">${typeText}</span>
        </div>
        <div style="margin-top: 5px; font-size: 14px; color: #6b7280;">
            شناسه: ${employee.id.substring(0, 8)}...
        </div>
    `;
    
    elements.scanTime.textContent = `${log.time} - ${log.date}`;
}

// بازخورد
function provideFeedback() {
    // ویبره
    if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
    }
    
    // صدای بیپ
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
        console.log('🔇 صدا پشتیبانی نمی‌شود');
    }
}

// تغییر حالت
function setMode(mode) {
    state.mode = mode;
    
    elements.modeCheckin.classList.toggle('active', mode === 'checkin');
    elements.modeCheckout.classList.toggle('active', mode === 'checkout');
    
    console.log(`🔀 حالت تغییر کرد به: ${mode === 'checkin' ? 'ورود' : 'خروج'}`);
}

// به‌روزرسانی UI
function updateUI() {
    // به‌روزرسانی تعداد امروز
    const today = new Date().toISOString().split('T')[0];
    const todayItems = state.logs.filter(log => 
        log.timestamp.startsWith(today)
    );
    
    elements.todayCount.textContent = todayItems.length;
    elements.todayCount.className = `badge ${todayItems.length > 0 ? 'badge-success' : 'badge-error'}`;
    
    // نمایش لاگ‌های امروز
    renderTodayLogs(todayItems);
    
    // نمایش آخرین اسکن
    if (state.lastScan) {
        const { employee, log } = state.lastScan;
        showScanResult(employee, log);
    }
}

// رندر لاگ‌های امروز
function renderTodayLogs(logs) {
    if (logs.length === 0) {
        elements.todayLogs.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #6b7280;">
                📭 امروز هیچ رویدادی ثبت نشده
            </div>
        `;
        return;
    }
    
    elements.todayLogs.innerHTML = logs.map(log => `
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

// خروجی داده‌ها
function exportData() {
    if (state.logs.length === 0) {
        alert('داده‌ای برای خروجی وجود ندارد');
        return;
    }
    
    try {
        // ساخت CSV
        let csv = 'نام,نوع,زمان,تاریخ,شناسه کارت\n';
        
        state.logs.forEach(log => {
            csv += `"${log.employeeName}",`;
            csv += `${log.type === 'checkin' ? 'ورود' : 'خروج'},`;
            csv += `"${log.time}",`;
            csv += `"${log.date}",`;
            csv += `"${log.employeeId}"\n`;
        });
        
        // ایجاد فایل
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `attendance_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        alert('✅ فایل با موفقیت دانلود شد');
        
    } catch (error) {
        console.error('❌ خطا در خروجی:', error);
        alert('خطا در ایجاد فایل خروجی');
    }
}

// پاک‌سازی داده‌ها
function clearData() {
    if (confirm('آیا مطمئن هستید؟ همه داده‌ها پاک خواهند شد.')) {
        state.logs = [];
        state.employees = {};
        state.lastScan = null;
        
        localStorage.clear();
        updateUI();
        
        elements.scanResult.innerHTML = 'هنوز اسکنی انجام نشده';
        elements.scanTime.textContent = '';
        
        alert('✅ داده‌ها پاک شدند');
    }
}

// تست NFC
function testNFC() {
    console.log('🧪 شروع تست NFC...');
    
    // تست مجوز
    if (!state.nfcSupported) {
        alert('NFC پشتیبانی نمی‌شود');
        return;
    }
    
    // شبیه‌سازی کارت
    const testEvent = {
        serialNumber: 'test_' + Date.now(),
        message: {
            records: [{
                recordType: "text",
                data: new TextEncoder().encode(JSON.stringify({
                    name: 'کاربر تست',
                    id: '001',
                    department: 'تست'
                }))
            }]
        }
    };
    
    // پردازش کارت تست
    processNFCTag(testEvent);
    
    alert('✅ تست موفقیت‌آمیز بود! اطلاعات نمایش داده شد.');
}

// Service Worker برای PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('✅ ServiceWorker ثبت شد:', registration.scope);
            })
            .catch(error => {
                console.log('❌ ثبت ServiceWorker ناموفق:', error);
            });
    });
}
