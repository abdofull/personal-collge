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

        let message;
        if (action === 'like') {
            message = 'شكرًا! نحن سعداء أنك وجدت النصيحة مفيدة! 🎉';
        } else if (action === 'dislike') {
            message = 'شكرًا على ملاحظتك! سنعمل على تحسين النصائح المستقبلية. 🙁';
        }

        Swal.fire({
            position: "top-end",
            title: message,
            showConfirmButton: false,
            timer: 2000
        });

        loadEducationalTips(); // تحديث واجهة النصائح
    } catch (error) {
        const errorMsg = error.response?.data?.message || 'حدث خطأ أثناء التقييم';
        showNotification(errorMsg, 'error');
    }
};

// دالة تطبيق النصيحة
// async function markTipAsApplied(tipId) {
//     try {
//         const response = await axios.post(`${url}api/educational-notifications/${tipId}/apply`);
//         showNotification(`لقد كسبت ${response.data.points} نقطة!`, 'success');
//         loadEducationalTips();
//     } catch (error) {
//         showNotification(error.response?.data?.message || 'حدث خطأ', 'error');
//     }
// };

// async function loadUserPoints() {
//     try {
//         const response = await axios.get(`${url}api/user/points`);
//         document.getElementById('userPoints').textContent = response.data.points;
//     } catch (error) {
//         console.error('فشل تحميل النقاط:', error);
//     }
// }

// استدعاء الدالة عند تحميل الصفحة
window.onload = function() {
    applyBackgroundColor();

};

// استدعاء الدالة عند تحميل الصفحة
window.onload = function() {
        loadEducationalTips();
    loadUserPoints();
};

// استدعاء الدالة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', loadEducationalTips);


