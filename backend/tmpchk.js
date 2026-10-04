const mongoose=require('mongoose');
mongoose.set('bufferCommands', false);
require('dotenv').config();
(async()=>{
  try{
    await mongoose.connect(process.env.MONGODB_URI);
    const History=require('./src/models/History');
    let d=await History.findOne({seedKey:'history-08'});
    if(!d){console.log('no');process.exit(0);}
    let o=d.toObject();
    console.log(typeof o.year);
    console.log(typeof o.entries[0].year);
  }catch(e){console.log('e');}finally{mongoose.connection.close();}
})();
