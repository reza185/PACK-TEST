// ================================================
// سیستم حضور و غیاب NFC پیشرفته
// ================================================

// تنظیمات اولیه
const TEHRAN_TIMEZONE = 'Asia/Tehran';
const WORK_START_HOUR = 6;   // 6 صبح
const WORK_END_HOUR = 21;     // 9 شب

// داده‌های پرسنل (در حالت واقعی از سرور یا localStorage می‌آید)
let employees = [];
let attendanceLogs = [];
let currentMode = 'checkin'; // 'checkin' یا 'checkout'
let nfcSupported = false;

// ================================================
// داده‌های پایه پرسنل (برای تست روی کارت‌ها)
// ================================================
const EMPLOYEE_DATA = {
    // فرمت: [cardId] = { name, code, avatar, leaveDays }
    // برای تست، این مقادیر را روی کارت‌های NFC خود بنویسید
    "CARD001": {
        name: "علی محمدی",
        code: "1001",
        avatar: "👨‍💻",
        leaveDays: [
            { date: "2024-01-20", type: "مرخصی" },
            { date: "2024-01-21", type: "غیبت" }
        ]
    },
    "CARD002": {
        name: "سارا احمدی",
        code: "1002",
        avatar: "👩‍💼",
        leaveDays: [
            { date: "2024-01-22", type: "مرخصی" }
        ]
    },
    "CARD003": {
        name: "محمد رضایی",
        code: "1003",
        avatar: "👨‍🔧",
        leaveDays: []
    },
    "CARD004": {
        name: "فاطمه کریمی",
        code: "1004",
        avatar: "👩‍🎓",
        leaveDays: [
            { date: "2024-01-23", type: "مرخصی" },
            { date: "2024-01-24", type: "مرخصی" }
        ]
    },
    "CARD005": {
        name: "رضا حسینی",
        code: "1005",
        avatar: "👨‍🏫",
        leaveDays: []
    }
};

// ================================================
// توابع کمکی
// ================================================

// دریافت تاریخ امروز به فرمت YYYY-MM-DD
function getTodayDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// دریافت زمان فعلی به فرمت HH:MM
function getCurrentTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

// بررسی در ساعات کاری
function isWithinWorkHours() {
    const now = new Date();
    const hour = now.getHours();
    return hour >= WORK_START_HOUR && hour < WORK_END_HOUR;
}

// محاسبه مجموع ساعات کار
function calculateTotalWorkHours(checkin, checkout) {
    if (!checkin || !checkout) return 0;
    
    const [inHour, inMin] = checkin.split(':').map(Number);
    const [outHour, outMin] = checkout.split(':').map(Number);
    
    let totalMinutes = (outHour * 60 + outMin) - (inHour * 60 + inMin);
    if (totalMinutes < 0) totalMinutes += 24 * 60; // اگر شب گذشته
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    return { hours, minutes, total: totalMinutes };
}

// ================================================
// مدیریت داده‌ها
// ================================================

// بارگذاری داده‌ها از localStorage
function loadData() {
    try {
        const savedLogs = localStorage.getItem('attendanceLogs');
        if (savedLogs) {
            attendanceLogs = JSON.parse(savedLogs);
        } else {
            attendanceLogs = [];
        }
        
        // بارگذاری پرسنل
        const savedEmployees = localStorage.getItem('employees');
        if (savedEmployees) {
            employees = JSON.parse(savedEmployees);
        } else {
            // تبدیل داده‌های پایه به آرایه
            employees = Object.keys(EMPLOYEE_DATA).map(cardId => ({
                cardId: cardId,
                ...EMPLOYEE_DATA[cardId]
            }));
            saveEmployees();
        }
        
        updateStats();
        updateTodayLogs();
    } catch (e) {
        console.error('خطا در بارگذاری داده‌ها:', e);
        attendanceLogs = [];
        employees = Object.keys(EMPLOYEE_DATA).map(cardId => ({
            cardId: cardId,
            ...EMPLOYEE_DATA[cardId]
        }));
    }
}

// ذخیره لاگ‌ها
function saveLogs() {
    localStorage.setItem('attendanceLogs', JSON.stringify(attendanceLogs));
    updateTodayLogs();
    updateStats();
}

// ذخیره پرسنل
function saveEmployees() {
    localStorage.setItem('employees', JSON.stringify(employees));
}

// ================================================
// توابع مربوط به NFC
// ================================================

// بررسی پشتیبانی NFC
function checkNFCSupport() {
    if ('NDEFReader' in window) {
        nfcSupported = true;
        document.getElementById('nfcStatus').className = 'status-card status-success';
        document.getElementById('nfcStatusText').innerHTML = '✅ NFC فعال است - آماده اسکن';
        document.getElementById('scanBtn').disabled = false;
    } else {
        nfcSupported = false;
        document.getElementById('nfcStatus').className = 'status-card status-error';
        document.getElementById('nfcStatusText').innerHTML = '❌ NFC پشتیبانی نمی‌شود (فقط در اندروید با کروم)';
        document.getElementById('scanBtn').disabled = true;
    }
}

// شروع اسکن NFC
async function startNFCScan() {
    if (!nfcSupported) {
        alert('مرورگر شما از NFC پشتیبانی نمی‌کند');
        return;
    }
    
    if (!isWithinWorkHours()) {
        alert(`ساعت کاری از ${WORK_START_HOUR} صبح تا ${WORK_END_HOUR} شب می‌باشد`);
        return;
    }
    
    try {
        const scanBtn = document.getElementById('scanBtn');
        const scanText = document.getElementById('scanText');
        const originalText = scanText.innerText;
        
        scanText.innerText = 'در انتظار کارت...';
        scanBtn.disabled = true;
        
        const reader = new NDEFReader();
        await reader.scan();
        
        reader.onreading = event => {
            try {
                const decoder = new TextDecoder('utf-8');
                let cardData = '';
                
                for (const record of event.message.records) {
                    if (record.recordType === 'text') {
                        cardData = decoder.decode(record.data);
                        break;
                    }
                }
                
                if (cardData) {
                    processCardData(cardData.trim());
                } else {
                    showResult('خطا: داده‌ای روی کارت یافت نشد', 'error');
                }
                
                reader.stop();
                scanText.innerText = originalText;
                scanBtn.disabled = false;
                
            } catch (e) {
                console.error('خطا در خواندن کارت:', e);
                showResult('خطا در خواندن کارت', 'error');
                reader.stop();
                scanText.innerText = originalText;
                scanBtn.disabled = false;
            }
        };
        
        reader.onerror = error => {
            console.error('خطای NFC:', error);
            showResult('خطا در اسکن: ' + error.message, 'error');
            scanText.innerText = originalText;
            scanBtn.disabled = false;
        };
        
    } catch (error) {
        console.error('خطا:', error);
        showResult('خطا: ' + error.message, 'error');
        document.getElementById('scanText').innerText = 'اسکن کارت NFC';
        document.getElementById('scanBtn').disabled = false;
    }
}

// پردازش داده کارت
function processCardData(cardId) {
    // جستجوی پرسنل با کارت ID
    const employee = employees.find(e => e.cardId === cardId);
    
    if (!employee) {
        showResult('کارت ثبت نشده است: ' + cardId, 'error');
        return;
    }
    
    const today = getTodayDate();
    const now = getCurrentTime();
    
    // بررسی لاگ امروز
    const todayLog = attendanceLogs.find(log => 
        log.cardId === cardId && log.date === today
    );
    
    // بررسی ساعات کاری
    if (!isWithinWorkHours()) {
        showModal(employee, todayLog);
        alert(`ساعت کاری از ${WORK_START_HOUR} صبح تا ${WORK_END_HOUR} شب می‌باشد`);
        return;
    }
    
    if (currentMode === 'checkin') {
        // ثبت ورود
        if (todayLog) {
            if (todayLog.checkin) {
                showModal(employee, todayLog);
                alert('ورود امروز قبلاً ثبت شده است');
                return;
            }
        }
        
        // ثبت ورود جدید
        const newLog = todayLog || {
            cardId: cardId,
            date: today,
            checkin: now,
            checkout: null
        };
        
        if (!todayLog) {
            newLog.checkin = now;
            attendanceLogs.push(newLog);
        } else {
            todayLog.checkin = now;
        }
        
        saveLogs();
        showResult(`✅ ورود ${employee.name} در ساعت ${now} ثبت شد`, 'success');
        showModal(employee, { ...newLog, checkin: now });
        
    } else {
        // ثبت خروج
        if (!todayLog || !todayLog.checkin) {
            showModal(employee, todayLog);
            alert('ابتدا باید ورود ثبت شود');
            return;
        }
        
        if (todayLog.checkout) {
            showModal(employee, todayLog);
            alert('خروج امروز قبلاً ثبت شده است');
            return;
        }
        
        // ثبت خروج
        todayLog.checkout = now;
        saveLogs();
        showResult(`🔴 خروج ${employee.name} در ساعت ${now} ثبت شد`, 'success');
        showModal(employee, todayLog);
    }
}

// نمایش نتیجه ساده
function showResult(message, type) {
    const resultDiv = document.getElementById('simpleResult');
    const resultContent = document.getElementById('scanResult');
    const resultTime = document.getElementById('scanTime');
    
    resultDiv.classList.remove('hidden');
    resultContent.innerHTML = message;
    resultTime.innerHTML = new Date().toLocaleTimeString('fa-IR');
    
    if (type === 'success') {
        resultDiv.style.borderColor = '#22c55e';
        resultDiv.style.background = '#f0fdf4';
    } else {
        resultDiv.style.borderColor = '#ef4444';
        resultDiv.style.background = '#fef2f2';
    }
}

// ================================================
// توابع مودال (پاپاپ)
// ================================================

// نمایش مودال اطلاعات پرسنل
function showModal(employee, log = null) {
    document.getElementById('employeeName').innerText = employee.name;
    document.getElementById('employeeCode').innerText = `کد پرسنلی: ${employee.code}`;
    document.getElementById('employeeAvatar').innerHTML = employee.avatar || '👤';
    
    // زمان‌ها
    const checkinTime = log?.checkin || '--:--';
    const checkoutTime = log?.checkout || '--:--';
    
    document.getElementById('checkinTime').innerText = checkinTime;
    document.getElementById('checkoutTime').innerText = checkoutTime;
    
    // محاسبه مجموع ساعات
    if (log?.checkin && log?.checkout) {
        const total = calculateTotalWorkHours(log.checkin, log.checkout);
        document.getElementById('totalHours').innerHTML = 
            `⏱️ مجموع ساعات کار: ${total.hours} ساعت و ${total.minutes} دقیقه`;
    } else {
        document.getElementById('totalHours').innerHTML = '⏱️ مجموع ساعات کار: -- ساعت';
    }
    
    // نمایش روزهای غیبت/مرخصی
    const absenceContainer = document.getElementById('absenceContainer');
    const absenceList = document.getElementById('absenceList');
    
    if (employee.leaveDays && employee.leaveDays.length > 0) {
        absenceContainer.classList.remove('hidden');
        absenceList.innerHTML = employee.leaveDays.map(day => `
            <div class="absence-item">
                <span class="absence-date">${day.date}</span>
                <span class="absence-type">${day.type}</span>
            </div>
        `).join('');
    } else {
        absenceList.innerHTML = '<div class="absence-item">⏺️ بدون غیبت/مرخصی</div>';
    }
    
    // نمایش مودال
    document.getElementById('employeeModal').classList.remove('hidden');
}

// بستن مودال
function closeModal() {
    document.getElementById('employeeModal').classList.add('hidden');
}

// ================================================
// توابع آماری و نمایش
// ================================================

// به‌روزرسانی آمار
function updateStats() {
    const today = getTodayDate();
    
    // لاگ‌های امروز
    const todayLogs = attendanceLogs.filter(log => log.date === today);
    
    // حاضرین امروز (کسانی که ورود دارند)
    const presentToday = todayLogs.filter(log => log.checkin).length;
    
    // غایبین و مرخصی‌ها
    let absentCount = 0;
    let leaveCount = 0;
    
    employees.forEach(emp => {
        const hasLog = todayLogs.some(log => log.cardId === emp.cardId);
        if (!hasLog) {
            // بررسی مرخصی
            const isLeave = emp.leaveDays?.some(day => day.date === today);
            if (isLeave) {
                leaveCount++;
            } else {
                absentCount++;
            }
        }
    });
    
    document.getElementById('totalEmployees').innerText = employees.length;
    document.getElementById('presentToday').innerText = presentToday;
    document.getElementById('absentToday').innerText = absentCount;
    document.getElementById('leaveToday').innerText = leaveCount;
}

// به‌روزرسانی تاریخچه امروز
function updateTodayLogs() {
    const today = getTodayDate();
    const todayLogs = attendanceLogs
        .filter(log => log.date === today)
        .sort((a, b) => {
            if (a.checkin && b.checkin) {
                return a.checkin.localeCompare(b.checkin);
            }
            return 0;
        });
    
    const container = document.getElementById('todayLogs');
    const countSpan = document.getElementById('todayCount');
    
    countSpan.innerText = todayLogs.length;
    
    if (todayLogs.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 20px; color: #64748b;">📭 هیچ رویدادی ثبت نشده</div>';
        return;
    }
    
    container.innerHTML = todayLogs.map(log => {
        const employee = employees.find(e => e.cardId === log.cardId);
        const name = employee ? employee.name : 'ناشناس';
        
        return `
            <div class="log-item">
                <div>
                    <span class="log-name">${name}</span>
                    <div class="log-time">ورود: ${log.checkin || '--'}</div>
                    <div class="log-time">خروج: ${log.checkout || '--'}</div>
                </div>
                <div>
                    ${log.checkin ? '<span class="log-type checkin">ورود</span>' : ''}
                    ${log.checkout ? '<span class="log-type checkout">خروج</span>' : ''}
                </div>
            </div>
        `;
    }).join('');
}

// ================================================
// توابع کنترلی
// ================================================

// تغییر حالت (ورود/خروج)
function setMode(mode) {
    currentMode = mode;
    
    document.getElementById('modeCheckin').classList.remove('active');
    document.getElementById('modeCheckout').classList.remove('active');
    
    if (mode === 'checkin') {
        document.getElementById('modeCheckin').classList.add('active');
        document.getElementById('scanText').innerText = 'اسکن برای ورود';
        document.getElementById('scanIcon').innerHTML = '✅';
    } else {
        document.getElementById('modeCheckout').classList.add('active');
        document.getElementById('scanText').innerText = 'اسکن برای خروج';
        document.getElementById('scanIcon').innerHTML = '❌';
    }
}

// خروجی گرفتن
function exportData() {
    const data = {
        employees: employees,
        attendanceLogs: attendanceLogs,
        exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${getTodayDate()}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// پاکسازی داده‌ها
function clearData() {
    if (confirm('آیا از پاکسازی تمام داده‌ها اطمینان دارید؟')) {
        localStorage.removeItem('attendanceLogs');
        attendanceLogs = [];
        updateTodayLogs();
        updateStats();
        alert('داده‌ها پاکسازی شدند');
    }
}

// تست NFC (برای شبیه‌سازی)
function testNFC() {
    const testCardId = prompt('کد کارت تست را وارد کنید (مثلاً CARD001 تا CARD005):', 'CARD001');
    if (testCardId) {
        processCardData(testCardId);
    }
}

// ================================================
// مقداردهی اولیه
// ================================================
document.addEventListener('DOMContentLoaded', () => {
    checkNFCSupport();
    loadData();
    
    // تنظیم حالت پیش‌فرض
    setMode('checkin');
    
    // نمایش راهنمای تست
    console.log('برای تست، از کارت‌های CARD001 تا CARD005 استفاده کنید');
});
