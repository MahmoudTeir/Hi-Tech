/**
 * Hi-Tech Internet Hotspot Portal - Main Application JavaScript
 * Copyright (c) 2025 Mahmoud. All rights reserved.
 * 
 * Developed by: Mahmoud
 * Website: Hi-Tech Internet Services
 * Description: Main application logic, authentication, and UI management
 * 
 * This software is proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */

/**
 * Handles CHAP authentication for secure login
 * Converts plain text password to MD5 hash using CHAP challenge
 * 
 * @returns {boolean} Always returns true to allow form submission
 */
function doLogin() {
    var chapId = '$(chap-id)';
    var chapChallenge = '$(chap-challenge)';
    
    // Only apply CHAP hashing if challenge is available
    if (chapId && chapChallenge) {
        var form = document.login;
        var password = form.password.value;
        
        // Generate CHAP response: MD5(ID + password + challenge)
        var chapPassword = hex_md5(chapId + password + chapChallenge);
        form.password.value = chapPassword;
    }
    return true;
}

/**
 * Handles package selection UI interaction
 * Updates visual state of selected internet package
 * 
 * @param {HTMLElement} element - The clicked package card element
 */
function selectPackage(element) {
    // Remove selected class from all package cards
    document.querySelectorAll('.package-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Add selected class to clicked element
    element.classList.add('selected');
    
    // Optional: Store selection for form submission
    const packageName = element.querySelector('.package-name')?.textContent;
    if (packageName) {
        console.log('Selected package:', packageName);
    }
}

/**
 * Translate error messages from English to Arabic
 * @param {string} errorText - The error message to translate
 * @returns {string} The translated Arabic message or original if no translation found
 */
function translateError(errorText) {
    if (!errorText) return '';
    
    // Clean the error text (remove extra spaces, convert to lowercase)
    const cleanError = errorText.trim().toLowerCase();
    
    // Check if we have a direct translation
    if (errorTranslations[cleanError]) {
        return errorTranslations[cleanError];
    }
    
    // Check for partial matches (useful for dynamic error messages)
    for (const [key, translation] of Object.entries(errorTranslations)) {
        if (cleanError.includes(key)) {
            return translation;
        }
    }
    
    // Return original message if no translation found
    return errorText;
}

/**
 * Display error message with Arabic translation
 * @param {string} errorText - The error message to display
 */
function showError(errorText) {
    const errorMsg = document.getElementById('errorMessage');
    if (!errorMsg) return;
    
    const translatedError = translateError(errorText);
    errorMsg.innerHTML = `<span>⚠️ ${translatedError}</span>`;
    errorMsg.classList.add('show');
    
    // Auto-hide error after 10 seconds
    setTimeout(() => {
        errorMsg.classList.remove('show');
    }, 10000);
}

/**
 * Update date/time display on login page
 */
function updateDateTime() {
    const now = new Date();
    
    // Update time display
    const timeElement = document.getElementById('currentTime');
    if (timeElement) {
        const timeString = now.toLocaleTimeString('ar-EG', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
        timeElement.textContent = timeString;
    }
    
    // Update date display
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        const dateString = now.toLocaleDateString('ar-EG', options);
        dateElement.textContent = dateString;
    }
}

/**
 * Initialize date/time display
 */
function initDateTime() {
    // Update immediately
    updateDateTime();
    
    // Update every second
    setInterval(updateDateTime, 1000);
}

/**
 * Initialize application when DOM is loaded
 * Sets up animations, error handling, and UI enhancements
 */
window.onload = function() {
    // Generate particles for background animation
    if (typeof generateParticles === 'function') {
        generateParticles();
    }
    
    // Initialize date/time display
    initDateTime();
    
    // Handle error message display with translation
    var errorMsg = document.getElementById('errorMessage');
    if (errorMsg && errorMsg.querySelector('span')) {
        const originalError = errorMsg.querySelector('span').textContent.trim();
        if (originalError) {
            const translatedError = translateError(originalError);
            errorMsg.querySelector('span').innerHTML = `⚠️ ${translatedError}`;
            errorMsg.classList.add('show');
        }
    }
    
    // Add smooth scrolling for better UX
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Optional: Auto-focus first input field
    const firstInput = document.querySelector('input[type="text"], input[type="password"]');
    if (firstInput) {
        firstInput.focus();
    }
};

/**
 * Footer link handlers for additional functionality
 */

/**
 * Arabic language support and error messages
 */
const arabicMessages = {
    forgotPassword: 'لاستعادة كلمة المرور، يرجى التواصل مع الدعم الفني على 0599328821 أو البريد الإلكتروني support@hitech.net وسنساعدك في إعادة تعيين كلمة المرور الخاصة بك.',
    helpCenter: `
دعم هاي تك للإنترنت

📞 الهاتف: 0599328821
📧 البريد الإلكتروني: support@hitech.net  
📍 المكتب: معن، 

ساعات الدعم: 24/7
متوسط وقت الاستجابة: أقل من 5 دقائق

المشاكل الشائعة:
• مشاكل الاتصال
• إدارة الحساب  
• ترقية الباقات
• الدعم الفني
    `
};

/**
 * Error message translations from errors.txt
 * Maps English error keys to Arabic messages
 */
const errorTranslations = {
    'invalid username or password': 'اسم المستخدم أو كلمة المرور غير صحيحة. يرجى التحقق من البيانات والمحاولة مرة أخرى.',
    'user session limit reached': 'لقد وصلت إلى الحد الأقصى لعدد الجلسات المتزامنة. يرجى تسجيل الخروج من الأجهزة الأخرى.',
    'no more sessions are allowed for the user': 'وصل حسابك إلى حد الجلسات المسموح. يرجى الاتصال بالدعم الفني.',
    'session timeout': 'انتهت صلاحية جلستك بسبب عدم النشاط. يرجى تسجيل الدخول مرة أخرى للمتابعة.',
    'radius timeout': 'انتهت مهلة خادم المصادقة. يرجى المحاولة مرة أخرى لاحقاً.',
    'authorization failed': 'فشل في التفويض. يرجى الاتصال بفريق الدعم الفني.',
    'traffic limit reached': 'لقد وصلت إلى حد البيانات المسموح. يرجى ترقية باقتك للمتابعة.',
    'trial time limit reached': 'انتهت فترة التجربة المجانية. يرجى شراء باقة للمتابعة.',
    'trial traffic limit reached': 'تم الوصول إلى حد بيانات التجربة المجانية. يرجى شراء باقة للمتابعة.',
    'your account has been disabled': 'تم إيقاف حسابك. يرجى الاتصال بالدعم الفني للمساعدة.',
    'web-proxy required': 'مطلوب تكوين البروكسي. يرجى الاتصال بالدعم الفني.'
};


/**
 * Show forgot password dialog or redirect to password reset
 */
function showForgotPassword() {
    alert(arabicMessages.forgotPassword);
}

/**
 * Show help center information
 */
function showHelpCenter() {
    alert(arabicMessages.helpCenter);
}

