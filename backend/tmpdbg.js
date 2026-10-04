const mongoose=require('mongoose');
require('dotenv').config();
(async()=>{try{await mongoose.connect(process.env.MONGODB_URI);const H=require('./src/models/History');const list=await H.find().limit(1);console.log(list.length);}catch(e){console.log('e');}finally{mongoose.connection.close();}})();
