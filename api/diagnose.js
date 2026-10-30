const crypto=require('node:crypto');
module.exports=async(req,res)=>{
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return res.status(405).json({message:'POST only'});
 const a=process.env.DEMO_ACCESS_TOKEN,b=req.headers['x-demo-token'];
 if(!a||typeof b!=='string'||!crypto.timingSafeEqual(crypto.createHash('sha256').update(a).digest(),crypto.createHash('sha256').update(b).digest()))return res.status(401).json({message:'시연 암호가 일치하지 않습니다.'});
 if(process.env.AI_ENABLED!=='true'||!process.env.GEMINI_API_KEY||!process.env.GEMINI_MODEL)return res.status(503).json({message:'AI 활성화 및 서버 환경변수 설정이 필요합니다.'});
 const model=process.env.GEMINI_MODEL.trim().replace(/^models\//,'');
 const headers={'x-goog-api-key':process.env.GEMINI_API_KEY,'Content-Type':'application/json'};
 const results=[];
 async function check(label,url,options){const start=Date.now();try{const r=await fetch(url,{...options,headers,signal:AbortSignal.timeout(18000)});const data=await r.json();const raw=data.error?.status;results.push({step:label,http:r.status,seconds:Math.round((Date.now()-start)/1000),status:r.ok?'OK':typeof raw==='string'&&/^[A-Z_]+$/.test(raw)?raw:'PROVIDER_ERROR',...(label==='model'&&r.ok?{generateContent:Array.isArray(data.supportedGenerationMethods)&&data.supportedGenerationMethods.includes('generateContent')}:{}),...(label==='text'&&r.ok?{hasText:!!data.candidates?.some(c=>c.content?.parts?.some(p=>typeof p.text==='string'&&!p.thought&&p.text.trim()))}:{})});return r.ok;}catch(e){results.push({step:label,seconds:Math.round((Date.now()-start)/1000),status:['TimeoutError','AbortError'].includes(e.name)?'TIMEOUT':'CONNECTION_OR_RESPONSE_ERROR'});return false;}}
 const base='https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(model);
 const ok=await check('model',base,{method:'GET'});
 if(ok)await check('text',base+':generateContent',{method:'POST',body:JSON.stringify({contents:[{role:'user',parts:[{text:'Reply with only OK.'}]}],generationConfig:{maxOutputTokens:128,...(/^gemini-3[.-]/.test(model)?{thinkingConfig:{thinkingLevel:'low'}}:{})}})});
 return res.status(200).json({revision:'connection-check-1',model,results,message:'개인 자료를 전송하지 않았습니다. 생성 검사는 고정 문장 한 번만 요청하며 응답 원문은 표시하지 않습니다.'});
};
