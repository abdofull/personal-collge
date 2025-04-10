const mongoose = require('mongoose');

const conectToDataBase = () => {
    mongoose.connect(process.env.MONGO_URL)
    .then((c)=>console.log(`connected to database ${c.connection.host}`))
    .catch((err)=>
    {
        console.log(err);
        process.exit(1);//هذا يعني إيقاف الأتصال في حال كان هناك خطأ
    });
};

module.exports = conectToDataBase;