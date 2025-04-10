
// هذا الكود يقوم بتصدير الخطأ الذي يحدث في حالة حدوث خطأ في الطلب الذي يتم ارساله من العميل الى السيرفر
// ويتم تصدير الخطأ برقم الخطأ والرسالة التي توضح الخطأ
// ويتم تحديد نوع الخطأ اذا كان خطأ في الطلب او خطأ في السيرفر
// ويتم تحديد اذا كان الخطأ يمكن التعامل معه ام لا
// ويتم تصدير الخطأ ليتم استخدامه في اي مكان في المشروع
// ويتم استدعاء الخطأ في اي مكان في المشروع عند حدوث خطأ
class ApiError extends Error {
    constructor(statusCode, message) {
      super(message);
      this.statusCode = statusCode;
      this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";// تحديد نوع الخطأ 
      this.isOperational = true;
    }
  }
  
  module.exports = ApiError;
  // module.exports = ApiError; // تصدير الخطأ