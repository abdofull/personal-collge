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

                    // إعادة توجيه المستخدم إلى صفحة تسجيل الدخول أو الصفحة الرئيسية
                    Swal.fire({
                        icon: 'success',
                        title: 'تم تسجيل الخروج بنجاح',
                        text: 'تم حذف جميع البيانات المرتبطة بحسابك.',
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
    }, 12000);
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

// تهيئة الوضع عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    loadTheme();
    
    // إضافة حدث النقر لزر التبديل (إذا وجد)
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', function(e) {
            e.preventDefault();
            toggleTheme();
        });
    }
});


