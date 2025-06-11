const globleError = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;// تحديد رقم الخطأ
    err.status = err.status || "error"; // تحديد نوع الخطأ
    if(process.env.NODE_ENV === "development"){ // إذا كان الخطأ في الوضع التطويري
        sendErrorDev(err , res);
    }else{
        sendErrorProd(err , res); //إذا كان الخطأ في الوضع الإنتاجي
    }
    
   };
// إذا كان الخطأ في الوضع التطويري
const sendErrorDev  = (err , res)=>{
   return res.status(err.statusCode).json({
        status: err.status,
        error : err,
        message: err.message,
        stack: err.stack
      });
};

//إذا كان الخطأ في الوضع الإنتاجي
const sendErrorProd = (err , res) => {
    return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
}

module.exports = { globleError };// module.exports = globleError; // تصدير الخطأ