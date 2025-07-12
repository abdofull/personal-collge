// const url = 'https://personal-accountant2.onrender.com/';
const url = 'http://localhost:9050/';

let currentUser = null;
let currentPage = 1;
let totalPages = 1;
let currentPostId = null;

// التحقق من حالة تسجيل الدخول عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    loadPosts();
});

// التحقق من حالة المصادقة
function checkAuthStatus() {
    const token = localStorage.getItem('token');
    const userData = JSON.parse(localStorage.getItem('userData'));
    
    if (token && userData) {
        currentUser = userData;
        showCreatePostSection();
        hideLoginPrompt();
    } else {
        currentUser = null;
        hideCreatePostSection();
        showLoginPrompt();
    }
}

// إظهار قسم إنشاء المنشور
function showCreatePostSection() {
    document.getElementById('createPostSection').style.display = 'block';
}

// إخفاء قسم إنشاء المنشور
function hideCreatePostSection() {
    document.getElementById('createPostSection').style.display = 'none';
}

// إظهار رسالة تسجيل الدخول
function showLoginPrompt() {
    document.getElementById('loginPrompt').style.display = 'block';
}

// إخفاء رسالة تسجيل الدخول
function hideLoginPrompt() {
    document.getElementById('loginPrompt').style.display = 'none';
}

// تحميل المنشورات
async function loadPosts(page = 1) {
    try {
        const response = await axios.get(`${url}api/posts?page=${page}&limit=10`);
        
        if (response.data.success) {
            displayPosts(response.data.data);
            updatePagination(response.data.pagination);
        }
    } catch (error) {
        console.error('خطأ في تحميل المنشورات:', error);
        showError('حدث خطأ في تحميل المنشورات');
    }
}

// عرض المنشورات
function displayPosts(posts) {
    const container = document.getElementById('postsContainer');
    
    if (posts.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-comments fa-3x text-muted mb-3"></i>
                <h4>لا توجد منشورات حتى الآن</h4>
                <p class="text-muted">كن أول من ينشر في المنتدى!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = posts.map(post => createPostHTML(post)).join('');
}

// إنشاء HTML للمنشور
function createPostHTML(post) {
    const isAuthor = currentUser && currentUser.id === post.author._id;
    const isLiked = currentUser && post.likes.some(like => like.user._id === currentUser.id);
    const likesCount = post.likes.length;
    const commentsCount = post.comments.length;
    
    return `
        <div class="post-card" data-post-id="${post._id}">
            <div class="post-header">
                <div class="author-info">
                    <img src="${post.author.profileImage || '/uploads/profileImages/default-avatar.png'}" 
                         alt="${post.author.username}" class="author-avatar">
                    <div class="author-details">
                        <h6>${post.author.username}</h6>
                        <div class="post-date">${formatDate(post.createdAt)}</div>
                    </div>
                    ${isAuthor ? `
                        <div class="ms-auto">
                            <button class="btn btn-sm btn-outline-danger" onclick="deletePost('${post._id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
            <div class="post-content">
                <h5 class="post-title">${post.title}</h5>
                <p class="post-text">${post.content}</p>
                ${post.image ? `<img src="${post.image}" alt="صورة المنشور" class="post-image">` : ''}
            </div>
            <div class="post-actions">
                <div class="d-flex gap-3">
                    <button class="action-btn ${isLiked ? 'liked' : ''}" 
                            onclick="toggleLike('${post._id}')" 
                            ${!currentUser ? 'disabled' : ''}>
                        <i class="fas fa-heart"></i>
                        <span>${likesCount}</span>
                    </button>
                    <button class="action-btn" onclick="showComments('${post._id}')">
                        <i class="fas fa-comment"></i>
                        <span>${commentsCount}</span>
                    </button>
                </div>
                <div class="post-date">${formatDate(post.createdAt)}</div>
            </div>
        </div>
    `;
}

// تنسيق التاريخ
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
        return 'منذ يوم واحد';
    } else if (diffDays < 7) {
        return `منذ ${diffDays} أيام`;
    } else {
        return date.toLocaleDateString('ar-SA');
    }
}

// تحديث التنقل بين الصفحات
function updatePagination(pagination) {
    currentPage = pagination.currentPage;
    totalPages = pagination.totalPages;
    
    const container = document.getElementById('paginationContainer');
    
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let paginationHTML = '<nav><ul class="pagination">';
    
    // زر الصفحة السابقة
    if (pagination.hasPrev) {
        paginationHTML += `
            <li class="page-item">
                <a class="page-link" href="#" onclick="loadPosts(${currentPage - 1})">السابق</a>
            </li>
        `;
    }
    
    // أرقام الصفحات
    for (let i = 1; i <= totalPages; i++) {
        paginationHTML += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" onclick="loadPosts(${i})">${i}</a>
            </li>
        `;
    }
    
    // زر الصفحة التالية
    if (pagination.hasNext) {
        paginationHTML += `
            <li class="page-item">
                <a class="page-link" href="#" onclick="loadPosts(${currentPage + 1})">التالي</a>
            </li>
        `;
    }
    
    paginationHTML += '</ul></nav>';
    container.innerHTML = paginationHTML;
}

// إنشاء منشور جديد
document.getElementById('createPostForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    if (!currentUser) {
        showError('يجب تسجيل الدخول أولاً');
        return;
    }
    
    const formData = new FormData(this);
    const token = localStorage.getItem('token');
    
    try {
        const response = await axios.post(`${url}api/posts`, formData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
            }
        });
        
        if (response.data.success) {
            showSuccess('تم نشر المنشور بنجاح');
            this.reset();
            loadPosts(1); // إعادة تحميل الصفحة الأولى
        }
    } catch (error) {
        console.error('خطأ في إنشاء المنشور:', error);
        showError(error.response?.data?.message || 'حدث خطأ في نشر المنشور');
    }
});

// تبديل الإعجاب
async function toggleLike(postId) {
    if (!currentUser) {
        showError('يجب تسجيل الدخول أولاً');
        return;
    }
    
    const token = localStorage.getItem('token');
    
    try {
        const response = await axios.post(`${url}api/posts/${postId}/like`, {}, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.data.success) {
            // تحديث المنشور في الواجهة
            loadPosts(currentPage);
        }
    } catch (error) {
        console.error('خطأ في الإعجاب:', error);
        showError('حدث خطأ في الإعجاب');
    }
}

// حذف منشور
async function deletePost(postId) {
    if (!currentUser) {
        showError('يجب تسجيل الدخول أولاً');
        return;
    }
    
    const result = await Swal.fire({
        title: 'هل أنت متأكد؟',
        text: 'لن تتمكن من التراجع عن هذا الإجراء!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'نعم، احذف!',
        cancelButtonText: 'إلغاء'
    });
    
    if (result.isConfirmed) {
        const token = localStorage.getItem('token');
        
        try {
            const response = await axios.delete(`${url}api/posts/${postId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.data.success) {
                showSuccess('تم حذف المنشور بنجاح');
                loadPosts(currentPage);
            }
        } catch (error) {
            console.error('خطأ في حذف المنشور:', error);
            showError('حدث خطأ في حذف المنشور');
        }
    }
}

// عرض التعليقات
async function showComments(postId) {
    currentPostId = postId;
    
    try {
        const response = await axios.get(`${url}api/posts/${postId}`);
        
        if (response.data.success) {
            const post = response.data.data;
            displayComments(post.comments);
            
            // إظهار قسم إضافة التعليق للمستخدمين المسجلين
            if (currentUser) {
                document.getElementById('addCommentSection').style.display = 'block';
            } else {
                document.getElementById('addCommentSection').style.display = 'none';
            }
            
            // إظهار النافذة المنبثقة
            const modal = new bootstrap.Modal(document.getElementById('commentsModal'));
            modal.show();
        }
    } catch (error) {
        console.error('خطأ في تحميل التعليقات:', error);
        showError('حدث خطأ في تحميل التعليقات');
    }
}

// عرض التعليقات
function displayComments(comments) {
    const container = document.getElementById('commentsContainer');
    
    if (comments.length === 0) {
        container.innerHTML = `
            <div class="text-center py-3">
                <i class="fas fa-comment fa-2x text-muted mb-2"></i>
                <p class="text-muted">لا توجد تعليقات حتى الآن</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = comments.map(comment => `
        <div class="comment-item">
            <div class="comment-header">
                <div class="d-flex align-items-center gap-2">
                    <img src="${comment.user.profileImage || '/uploads/profileImages/default-avatar.png'}" 
                         alt="${comment.user.username}" 
                         style="width: 30px; height: 30px; border-radius: 50%; object-fit: cover;">
                    <span class="comment-author">${comment.user.username}</span>
                </div>
                <div class="d-flex align-items-center gap-2">
                    <span class="comment-date">${formatDate(comment.createdAt)}</span>
                    ${currentUser && currentUser.id === comment.user._id ? `
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteComment('${comment._id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
            <div class="comment-content">${comment.content}</div>
        </div>
    `).join('');
}

// إضافة تعليق
document.getElementById('addCommentForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    if (!currentUser || !currentPostId) {
        showError('حدث خطأ في إضافة التعليق');
        return;
    }
    
    const content = document.getElementById('commentContent').value;
    const token = localStorage.getItem('token');
    
    try {
        const response = await axios.post(`${url}api/posts/${currentPostId}/comments`, 
            { content }, 
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        if (response.data.success) {
            showSuccess('تم إضافة التعليق بنجاح');
            document.getElementById('commentContent').value = '';
            
            // إعادة تحميل التعليقات
            showComments(currentPostId);
            
            // تحديث عدد التعليقات في المنشور
            loadPosts(currentPage);
        }
    } catch (error) {
        console.error('خطأ في إضافة التعليق:', error);
        showError(error.response?.data?.message || 'حدث خطأ في إضافة التعليق');
    }
});

// حذف تعليق
async function deleteComment(commentId) {
    if (!currentUser || !currentPostId) {
        showError('حدث خطأ في حذف التعليق');
        return;
    }
    
    const result = await Swal.fire({
        title: 'هل أنت متأكد؟',
        text: 'لن تتمكن من التراجع عن هذا الإجراء!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'نعم، احذف!',
        cancelButtonText: 'إلغاء'
    });
    
    if (result.isConfirmed) {
        const token = localStorage.getItem('token');
        
        try {
            const response = await axios.delete(`${url}api/posts/${currentPostId}/comments/${commentId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.data.success) {
                showSuccess('تم حذف التعليق بنجاح');
                
                // إعادة تحميل التعليقات
                showComments(currentPostId);
                
                // تحديث عدد التعليقات في المنشور
                loadPosts(currentPage);
            }
        } catch (error) {
            console.error('خطأ في حذف التعليق:', error);
            showError('حدث خطأ في حذف التعليق');
        }
    }
}

// عرض رسالة نجاح
function showSuccess(message) {
    Swal.fire({
        icon: 'success',
        title: 'نجح!',
        text: message,
        timer: 2000,
        showConfirmButton: false
    });
}

// عرض رسالة خطأ
function showError(message) {
    Swal.fire({
        icon: 'error',
        title: 'خطأ!',
        text: message
    });
}

// دالة تسجيل الخروج (من main.js)
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    localStorage.removeItem('userId');
    window.location.href = 'login.html';
}

