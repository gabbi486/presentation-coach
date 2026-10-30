const crypto=require('node:crypto');
module.exports=async function(req,res){
 res.setHeader('Cache-Control','no-store');
 const started=Date.now();let http=null,stage='validation';
 const send=(status,data)=>res.status(status).json({revision:'interactions-minimal-1',model:'gemini-3.8-flash',providerHttp:http,elapsedMs:Date.now()-started,stage,...data});
 if(req.method!=='POST')return send(405,{success:false,code:'METHOD_NOT_ALLOWED'});
 const secret=process.env.DEMO_ACCESS_TOKEN,token=req.headers['x-demo-token'];
 if(!secret||typeof token!=='string'||!crypto.timingSafeEqual(crypto.createHash('sha256').update(secret).digest(),crypto.createHash('sha256').update(token).digest()))return send(401,{success:false,code:'UNAUTHORIZED',message:'기존 시연 암호를 확인하세요.'});
 if(process.env.AI_ENABLED!=='true'||!process.env.GEMINI_API_KEY)return send(503,{success:false,code:'CONFIG_REQUIRED',message:'AI_ENABLED 및 서버 API 키를 확인하세요.'});
 if(req.body?.consent!==true)return send(400,{success:false,code:'CONSENT_REQUIRED'});
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),40000);
 try{
 stage='waiting_headers';
 const response=await fetch('https://generativelanguage.googleapis.com/v1beta/interactions',{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':process.env.GEMINI_API_KEY},body:JSON.stringify({model:'gemini-3.8-flash',input:'Reply with only OK.',store:false,generation_config:{thinking_level:'low',max_output_tokens:256}}),signal:controller.signal});
 http=response.status;stage='reading_body';const data=await response.json();
 if(!response.ok){const code=typeof data.error?.status==='string'&&/^[A-Z_]{1,80}$/.test(data.error.status)?data.error.status:'PROVIDER_ERROR';const messages={400:'요청 규격이 거절됐습니다.',401:'API 인증 실패',403:'프로젝트 또는 모델 접근 권한 오류',404:'API 또는 모델을 찾지 못했습니다.',429:'할당량 또는 요청 빈도 제한'};return send(502,{success:false,code,message:messages[http]||'제공자 서버 오류. 원본 응답은 비밀정보 보호를 위해 표시하지 않습니다.'});}
 stage='parsing_result';const texts=[];
 for(const step of data.steps||[]){if(step.type!=='model_output')continue;for(const c of typeof step.content==='string'?[{type:'text',text:step.content}]:Array.isArray(step.content)?step.content:[]){if(c.type==='text'&&typeof c.text==='string')texts.push(c.text);}}
 for(const c of data.outputs||[]){if(c.type==='text'&&typeof c.text==='string')texts.push(c.text);}
 const exactOK=texts.some(t=>t.trim()==='OK');
 return send(200,{success:exactOK,code:exactOK?'OK':'UNEXPECTED_RESPONSE',message:exactOK?'최소 생성 요청 성공':'HTTP 요청은 성공했으나 OK 텍스트를 확인하지 못했습니다.',interactionStatus:typeof data.status==='string'&&/^[a-z_]{1,40}$/.test(data.status)?data.status:null,hasText:!!texts.length});
 }catch(e){return send(502,{success:false,code:controller.signal.aborted?'TIMEOUT':e.name==='SyntaxError'?'INVALID_JSON':'CONNECTION_ERROR',message:controller.signal.aborted?'40초 제한 초과':'연결 또는 응답 해석 실패. 원본 오류는 노출하지 않습니다.'});}
 finally{clearTimeout(timer);}
};
