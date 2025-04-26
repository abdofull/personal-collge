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





//الجزء الخاص بالإشعارات التوعوية
// دالة لجلب وعرض النصائح التوعوية
async function loadEducationalTips() {
    try {
        const response = await axios.get(`${url}api/educational-notifications/random`);
        
        const tipsContainer = document.getElementById('educationalTips');
        
        if (response.data.length === 0) {
            tipsContainer.innerHTML = `
                <div class="alert alert-info">
                    لا توجد نصائح متاحة حالياً، تحقق لاحقاً!
                </div>
            `;
            return;
        }


        tipsContainer.innerHTML = `
            <div style='color:green;' class="alert alert-${getAlertType(response.data.category)} mb-3">
                <h5 style='color:#CB410B;'>${response.data.title}</h5>
                <p  style='color:#004225;'>${response.data.message}</p>
                <small class="text-muted" style='background-color:#1B1B1B;padding:4px; border-radius:18px;box-shadow: 0 2px 15px rgba(0, 0, 0, 0.3);font-size:19px;color:white;margin-top:6px'><span style="color: red;">ن</span><span style="color: orange;">ص</span><span style="color: yellow;">ي</span><span style="color: green;">ح</span><span style="color: blue;">ة</span> <span style="color: purple;">ا</span><span style="color: pink;">ل</span><span style="color: red;">ي</span><span style="color: orange;">و</span><span style="color: yellow;">م</span></small>
                
                        <span class="badge bg-success me-2">
                            <i class="fas fa-thumbs-up"></i> 
                        </span>
                        <span class="badge bg-danger">
                            <i class="fas fa-thumbs-down"></i> 
                        </span>
                    </div>
                </div>
                <div class="mt-3 d-flex justify-content-between">
                    <button onclick="rateTip('${response.data._id}', 'like')" class="btn btn-sm btn-outline-success">
                        <i class="fas fa-thumbs-up"></i> مفيدة
                    </button>
                    <button onclick="rateTip('${response.data._id}', 'dislike')" class="btn btn-sm btn-outline-danger">
                        <i class="fas fa-thumbs-down"></i> غير مفيدة
                    </button>

                </div>
            </div>

        </div>
        `;
        } catch (error) {
        console.error('فشل تحميل النصائح:', error);
        document.getElementById('educationalTips').innerHTML = `
            <div class="alert alert-danger">
                حدث خطأ أثناء جلب النصائح. يرجى المحاولة لاحقاً.
            </div>
        `;
    }
}

function getAlertType(category) {
    const types = {
        'توفير': 'success',
        'استثمار': 'warning',
        'ديون': 'danger',
        'عام': 'primary'
    };
    return types[category] || 'info';
};

// دالة تقييم النصيحة
async function rateTip(tipId, action) {
    try {
        const response = await axios.post(`${url}api/educational-notifications/${tipId}/rate`, { 
            action 
        }, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        // استخدم response.data.message إذا وجد أو رسالة افتراضية
        // const message = response.data?.message || 'شكراً لتقييمك!';
        // showNotification(message, 'success');
        Swal.fire({
            position: "top-end",
            // icon: "success",
            title: "'شكراً لتقييمك! 🎉😎",
            showConfirmButton: false,
            timer: 1000
          });
        
        loadEducationalTips(); // تحديث واجهة النصائح
    } catch (error) {
        // عرض رسالة الخطأ من السيرفر أو رسالة افتراضية
        const errorMsg = error.response?.data?.message || 'حدث خطأ أثناء التقييم';
        showNotification(errorMsg, 'error');
    }
}

// دالة تطبيق النصيحة
async function markTipAsApplied(tipId) {
    try {
        const response = await axios.post(`${url}api/educational-notifications/${tipId}/apply`);
        showNotification(`لقد كسبت ${response.data.points} نقطة!`, 'success');
        loadEducationalTips();
    } catch (error) {
        showNotification(error.response?.data?.message || 'حدث خطأ', 'error');
    }
};

async function loadUserPoints() {
    try {
        const response = await axios.get(`${url}api/user/points`);
        document.getElementById('userPoints').textContent = response.data.points;
    } catch (error) {
        console.error('فشل تحميل النقاط:', error);
    }
}

// استدعاء الدالة عند تحميل الصفحة
window.onload = function() {
    applyBackgroundColor();
    loadEducationalTips();
    loadUserPoints();
    // باقي الدوال...
};

// استدعاء الدالة عند تحميل الصفحة
// window.onload = function() {
// };

// استدعاء الدالة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', loadEducationalTips);