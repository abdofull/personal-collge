const mongoose = require('mongoose');
const dns = require('node:dns');

// تجنب مشكلة فشل استعلام DNS SRV على الشبكات المحلية
try {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (dnsErr) {
    console.warn('DNS server override failed, continuing with system default:', dnsErr.message);
}

const conectToDataBase = async () => {

    mongoose.connect(process.env.MONGO_URL)
    .then((c)=>console.log(`connected to database ${c.connection.host}`))
    .catch((err)=>
    {
        console.log(err);
        process.exit(1);//هذا يعني إيقاف الأتصال في حال كان هناك خطأ
    });
};

module.exports = conectToDataBase;