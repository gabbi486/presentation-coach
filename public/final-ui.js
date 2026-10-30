(()=>{
'use strict';
const byId=id=>document.getElementById(id),review=byId('view-review');if(!review)return;
document.title='발표코치 · 준비부터 코칭까지';
const style=document.createElement('style');style.textContent=`#view-review #analyzeAI{display:inline-flex!important;align-items:center;justify-content:center;background:#103765;color:white;border:0;padding:14px 22px;font-size:15px}#view-review #analyzeAI:disabled{opacity:.5}#view-review .ai-connected{background:#edf4ff;border:1px solid #cddff6;border-radius:12px;padding:20px;margin:20px 0}#view-review label{display:block;margin:12px 0}#feedbackCards article{background:white;border:1px solid #dbe5f2;border-radius:12px;padding:20px;margin:16px 0}#feedbackCards blockquote{white-space:pre-wrap;border-left:3px solid #89acd7;padding-left:14px;margin:12px 0;color:#425d7c}.ai-flow-note{color:#486482;line-height:1.9;font-size:13px}`;document.head.append(style);
for(const id of ['analyzeAI','demoToken','aiConsent']){const el=byId(id);if(!el)continue;el.hidden=false;const label=el.closest('label');if(label)label.hidden=false;}
const analyze=byId('analyzeAI');analyze.textContent='AI 발표 코칭 받기';analyze.onclick=()=>runAI('analyze');
const transcribe=byId('transcribeAI');if(transcribe)transcribe.hidden=true;
const title=byId('coachTitle');if(title)title.textContent='AI 발표 코칭';
const intro=title?.parentElement.querySelector('p.small');if(intro)intro.textContent='저장한 전사문과 발표 자료를 비교해 원문 근거가 있는 코칭을 최대 3개 제공합니다. 전사문을 수정했다면 먼저 저장하세요. 실제 목소리의 억양·어조를 분석하는 기능은 아직 제공하지 않습니다.';
const banner=document.createElement('div');banner.className='ai-connected';const heading=document.createElement('strong');heading.textContent='연습의 마지막 단계, 근거 있는 피드백';const description=document.createElement('p');description.className='ai-flow-note';description.textContent='세션 열기 → 전사문 확인·저장 → 전송 동의 → AI 코칭. 요청에 약 30~50초가 걸릴 수 있습니다. 자동 재시도하지 않으며, 실패해도 기존 녹음과 전사문은 유지됩니다.';banner.append(heading,description);title?.after(banner);
const consent=byId('aiConsent'),token=byId('demoToken');if(token){token.placeholder='기존 시연 암호 (API 키 아님)';token.autocomplete='off';}
if(consent){const label=consent.closest('label');if(label){for(const n of [...label.childNodes])if(n!==consent)n.remove();label.append(document.createTextNode(' 선택한 세션의 자료 텍스트·전사문·설정을 Gemini로 전송하는 데 동의합니다. 무료 서비스 입력·응답은 제품 개선 및 사람 검토에 사용될 수 있습니다.'));}}
const honest=document.querySelector('.honest');if(honest){const strong=honest.querySelector('strong'),p=honest.querySelector('p');if(strong)strong.textContent='자료 준비부터 실제 AI 코칭까지';if(p)p.textContent='PDF 원본을 보며 녹음하고 Chrome 실시간 전사를 저장하세요. 발표 돌아보기에서 자료와 발언을 비교하는 AI 코칭을 받을 수 있습니다. 음성의 어조 분석은 아직 지원하지 않습니다.';}
const side=document.querySelector('.side-note span');if(side)side.textContent='AI 코칭 · 발표 돌아보기';
const status=byId('coachStatus');if(status)status.textContent='연습 기록에서 세션을 연 뒤 전사문과 자료를 확인하세요. AI 코칭은 전송 동의 후에만 실행됩니다.';
const oldRunAI=runAI;runAI=async function(kind){if(kind!=='analyze')return;if(token&&token.value&&!/^[\x20-\x7e]+$/.test(token.value)){coachNotice('시연 암호는 Vercel에 등록한 영문·숫자 암호를 입력하세요. API 키가 아닙니다.',true);return;}await oldRunAI(kind);};
const labels=review.querySelectorAll('[data-route="practice"]');for(const b of labels)b.textContent='다시 연습하기 →';
if(typeof controls==='function')controls();
})();
