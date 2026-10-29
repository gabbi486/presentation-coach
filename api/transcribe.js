const handle=require('../lib/ai');
module.exports=(req,res)=>handle(req,res,'transcribe');
module.exports.config={api:{bodyParser:{sizeLimit:'3mb'}},maxDuration:60};
