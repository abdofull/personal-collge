const url = 'http://localhost:9050/';

function fetchUserData() {
    const userData = JSON.parse(localStorage.getItem('userData'));

    if (!userData) {
        console.error('لم يتم العثور على بيانات المستخدم.');
        return;
    }

    const { username, profileImage } = userData;

    // تحديث الناف بار
    updateNavbar(username, profileImage);
}

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



// استدعاء الدالة عند تحميل الصفحة
window.onload = function() {
    applyBackgroundColor();
};


