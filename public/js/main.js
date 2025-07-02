// const url = 'https://personal-accountant2.onrender.com/';
const url = 'http://localhost:9050/';
// استدعاء دالة جلب بيانات المستخدم عند تحميل الصفحة
async function fetchUserData() {
  try {
    // **الخطوة 1: الحصول على التوكن من localStorage**
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    if (!token) {
      console.error('لم يتم العثور على التوكن.');
      return;
    }

    // **الخطوة 2: إرسال طلب HTTP لجلب بيانات المستخدم باستخدام التوكن في رأس Authorization**
    const response = await axios.get(`${url}users/${userId}` , { // نفترض أن لديك نقطة نهاية مثل /users/me لجلب بيانات المستخدم الحالي بناءً على التوكن
      headers: {
        Authorization: `Bearer ${token}`, // تنسيق شائع لتضمين التوكن في رأس Authorization
      },
    });
    const userData = JSON.parse(localStorage.getItem("userData")); // صورة الملف الشخصي ستكون في response.data.user.profileImage
    const userDataFromServer = response.data; // بيانات المستخدم ستكون في response.data
    //console.log('بيانات المستخدم:', userDataFromServer.user);
    // **الخطوة 3: استخراج اسم المستخدم وصورة الملف الشخصي**
    const { username } = userDataFromServer.user;

    if (!username) {
      console.error('لم يتم العثور على اسم المستخدم في بيانات الخادم.');
      return;
    }

    // **الخطوة 4: تحديث الناف بار**
    updateNavbar(username, userData.profileImage);

  } catch (error) {
    console.error('حدث خطأ أثناء جلب بيانات المستخدم:', error);
    if (error.response) {
      // يمكنك هنا فحص رمز الحالة للاستجابة (error.response.status)
      console.error('بيانات الخطأ من الخادم:', error.response.data);
    } else if (error.request) {
      console.error('لم يتم تلقي أي استجابة من الخادم:', error.request);
    } else {
      console.error('حدث خطأ أثناء إعداد الطلب:', error.message);
    }
  }
}


// function fetchUserData() {
//     const userData = JSON.parse(localStorage.getItem('userData'));

//     if (!userData) {
//         console.error('لم يتم العثور على بيانات المستخدم.');
//         return;
//     }

//     const { username, profileImage } = userData;

//     // تحديث الناف بار
//     updateNavbar(username, profileImage);
// }

function updateNavbar(username, profileImage) {
    const userElement = document.getElementById('user-info');
    userElement.innerHTML = `
        <img src="${profileImage}" alt="User Image" class="rounded-circle" width="30" height="30">
         <span class="ml-2">${username}</span>
    `;
};

// دالة لتسجيل الخروج
function logout() {
    Swal.fire({
        title: 'هل أنت متأكد؟',
        text: 'لن تتمكن من الوصول إلى حسابك بعد تسجيل الخروج!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'نعم، سجل الخروج',
        cancelButtonText: 'إلغاء',
    }).then((result) => {
        if (result.isConfirmed) {
            const userId = localStorage.getItem('userId');
            const token = localStorage.getItem('token');

            // استدعاء نقطة النهاية لحذف جميع البيانات المرتبطة بالمستخدم
            fetch(`${url}logout/${userId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            })
            .then(response => {
                if (response.ok) {
                    // حذف جميع البيانات من localStorage
                    localStorage.removeItem('userId');
                    localStorage.removeItem('token');
                    localStorage.removeItem('userData'); // هذا سيحذف الكائن بالكامل
                    localStorage.removeItem('initialBalance'); // حذف الرصيد الأولي
                    localStorage.removeItem('backgroundColor'); // حذف لون الخفية  
                    localStorage.removeItem('theme'); // حذف الوضع

                    // تحديث واجهة المستخدم
                    //updateAuthButtons();

                    // إعادة توجيه المستخدم إلى صفحة تسجيل الدخول أو الصفحة الرئيسية
                                      Swal.fire({
                        icon: 'success',
                        title: 'تم تسجيل الخروج بنجاح',
                        text: 'نتمنى أن نراك مرة أخرى قريباً!',
                        timer: 2000,
                        timerProgressBar: true,
                        background: '#1A1E2D',
                        color: '#F8F9FA',
                        iconColor: '#00BF63',
                        confirmButtonColor: '#3A7BD5',
                    }).then(() => {
                        setTimeout(() => {
                            window.location.href = 'index.html'; // إعادة التوجيه
                        }, 1500);
                    });
                } else {
                    throw new Error('فشل تسجيل الخروج');
                }
            })
            .catch(error => {
                Swal.fire({
                    icon: 'error',
                    title: 'خطأ',
                    text: 'حدث خطأ أثناء تسجيل الخروج. يرجى المحاولة لاحقًا.',
                });
                console.error(error);
            });
        }
    });
}






//لتعديل لون الخلفية
// common.js
function applyBackgroundColor() {
    const savedColor = localStorage.getItem('backgroundColor');
    if (savedColor) {
        document.body.style.backgroundColor = savedColor; // تطبيق اللون المخزن
    }
}

//دالة الإشعارات تستقبل 2 بارامتر الاول الرسالة والثاني هو نوع الإشعار (success, error, warning)
function showNotification(message,type) {
    const notificationContainer = document.getElementById('notificationContainer');
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;

        // تحديد لون الخلفية بناءً على نوع الإشعار
    switch (type) {
        case 'success':
            notification.style.background = '#28a745'; // أخضر
            break;
        case 'error':
            notification.style.background = '#dc3545'; // أحمر
            break;
        case 'warning':
            notification.style.background = '#ffc107'; // أصفر
            break;
        default:
            notification.style.background = '#343a40'; // افتراضي
    }

    notificationContainer.appendChild(notification);

    // إخفاء الإشعار بعد 12 ثواني
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notificationContainer.removeChild(notification), 300); // إزالة العنصر بعد التلاشي
    }, 3000);
}

// أضف هذه الدوال في ملف main.js أو في قسم script في نهاية الملف

// theme.js

// دالة التبديل بين الوضعين
function toggleTheme() {
    const body = document.body;
    body.classList.toggle('light-mode');
    
    // حفظ التفضيل في localStorage
    const isLightMode = body.classList.contains('light-mode');
    localStorage.setItem('theme', isLightMode ? 'light' : 'dark');
    
    // تحديث الأيقونة والنص
    updateThemeIcon(isLightMode);
}

// دالة تحديث الأيقونة
function updateThemeIcon(isLightMode) {
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.innerHTML = isLightMode 
            ? '<i class="fas fa-sun"></i> ' 
            : '<i class="fas fa-moon"></i> ';
    }
}

// تحميل الوضع المحفوظ عند فتح الصفحة
function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    const isLightMode = savedTheme === 'light';
    
    if (isLightMode) {
        document.body.classList.add('light-mode');
    }
    
    updateThemeIcon(isLightMode);
}



                // تطبيق الوضع الداكن/الفاتح
        function applyDarkLightMode() {
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                document.documentElement.classList.add('dark');
            }
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
                if (event.matches) {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
            });
        }


function applyConsistentBackground() {
    const color = localStorage.getItem('backgroundColor');
    const isLightMode = document.body.classList.contains('light-mode');

    // إذا لم يختر المستخدم لون خلفية، استخدم الافتراضي حسب الوضع
    let bgColor = color;
    let cardColor = color;

    if (!color) {
        bgColor = isLightMode ? '#f5f5f5' : '#1c1f2b'; // نفس ألوان body في CSS
        cardColor = isLightMode ? '#fff' : '#2a2f40';   // نفس ألوان الكروت في CSS
    } else {
        // إذا كان اللون المختار فاتح جدًا في الوضع الليلي، غمّقه قليلًا للكروت
        if (!isLightMode && isColorLight(color)) {
            cardColor = shadeColor(color, -15); // غمّق اللون قليلاً
        }
        // إذا كان اللون المختار غامق جدًا في الوضع النهاري، افتحه قليلًا للكروت
        if (isLightMode && !isColorLight(color)) {
            cardColor = shadeColor(color, 25); // افتح اللون قليلاً
        }
    }

    document.body.style.backgroundColor = bgColor;

    // طبّق اللون على جميع الكروت والمحتوى الرئيسي
    document.querySelectorAll('.card, .content, .main-progress, .summary-section, .budget-section').forEach(el => {
        el.style.backgroundColor = cardColor;
    });
}

// دالة مساعدة: تحديد إذا كان اللون فاتحًا
function isColorLight(color) {
    // يدعم hex فقط (#fff أو #ffffff)
    let c = color.substring(1); // احذف #
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const rgb = parseInt(c, 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    // معادلة YIQ
    return ((r*299)+(g*587)+(b*114))/1000 > 180;
}

// دالة مساعدة: تغميق أو تفتيح اللون
function shadeColor(color, percent) {
    let c = color.substring(1);
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    let num = parseInt(c,16),
        amt = Math.round(2.55 * percent),
        R = (num >> 16) + amt,
        G = (num >> 8 & 0x00FF) + amt,
        B = (num & 0x0000FF) + amt;
    return "#" + (
        0x1000000 +
        (R<255?R<0?0:R:255)*0x10000 +
        (G<255?G<0?0:G:255)*0x100 +
        (B<255?B<0?0:B:255)
    ).toString(16).slice(1);
}

// تهيئة الوضع عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    loadTheme();
    applyConsistentBackground();    // إضافة حدث النقر لزر التبديل (إذا وجد)
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', function(e) {
            e.preventDefault();
            toggleTheme();
        });
    }
});


