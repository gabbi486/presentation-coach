const crypto = require('node:crypto');
module.exports = async (req, res) => {
 res.setHeader('Cache-Control', 'no-store');
 if (req.method !== 'POST') return res.status(405).json({message:'POST only'});
 const a=process.env.DEMO_ACCESS_TOKEN,b=req.headers['x-demo-token'];
 if(!a||typeof b!=='string'||!crypto.timingSafeEqual(crypto.createHash('sha256').update(a).digest(),crypto.createHash('sha256').update(b).digest()))return res.status(401).json({message:'시연 암호가 일치하지 않습니다.'});
 if(process.env.AI_ENABLED!=='true'||!process.env.GEMINI_API_KEY||!process.env.GEMINI_MODEL)return res.status(503).json({message:'서버 환경변수 확인이 필요합니다.'});
 const model=process.env.GEMINI_MODEL.trim().replace(/^models\//,'');
 const results=[];let stage='waiting_headers';const started=Date.now();
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),18000);
 try {
  const response=await fetch('https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(model)+':streamGenerateContent?alt=sse',{
   method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':process.env.GEMINI_API_KEY},
   body:JSON.stringify({contents:[{role:'user',parts:[{text:'Reply with only OK.'}]}],generationConfig:{maxOutputTokens:128,...(/^gemini-3[.-]/.test(model)?{thinkingConfig:{thinkingLevel:'low'}}:{})}}),signal:controller.signal
  });
  stage='reading_body';
  const result={step:'stream_text',http:response.status,headersSeconds:Math.round((Date.now()-started)/1000),status:response.ok?'PENDING':'PROVIDER_ERROR',hasText:false};results.push(result);
  if(!response.ok){await response.body?.cancel();}
  else {
   const reader=response.body.getReader(),decoder=new TextDecoder();let buffer='',bytes=0;
   outer: while(true){const {value,done}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>1048576){result.status='RESPONSE_LIMIT';await reader.cancel();break;}
    buffer+=decoder.decode(value,{stream:true});const lines=buffer.split('\n');buffer=lines.pop();
    for(const line of lines){if(!line.startsWith('data:'))continue;const payload=line.slice(5).trim();if(!payload||payload==='[DONE]')continue;let data;try{data=JSON.parse(payload);}catch{continue;}
     if(data.candidates?.some(c=>c.content?.parts?.some(p=>!p.thought&&typeof p.text==='string'&&p.text.trim()))){result.hasText=true;result.status='OK';await reader.cancel();break outer;}
    }
   }
   if(result.status==='PENDING')result.status='NO_TEXT';
  }
  result.seconds=Math.round((Date.now()-started)/1000);
 }catch(e){results.push({step:'stream_text',stage,seconds:Math.round((Date.now()-started)/1000),status:controller.signal.aborted?'TIMEOUT':'CONNECTION_OR_RESPONSE_ERROR'});}
 finally{clearTimeout(timer);}
 return res.status(200).json({revision:'connection-check-stream-2',model,results,message:'고정 텍스트 1회 스트리밍 검사입니다. 개인 자료·원본 AI 응답·키는 반환하지 않습니다.'});
};
