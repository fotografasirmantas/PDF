'use strict';
const $=id=>document.getElementById(id);
const te=new TextEncoder();
const msgsEl=$('aiMsgs'),inputEl=$('aiInput'),aiPanel=$('aiPanel'),drawerEl=$('drawer'),sheetEl=$('sheet'),scrimEl=$('scrim');

/* ===== Ikonos ===== */
const P={
menu:'<path d="M4 8h16M4 16h10"/>',
ai:'<path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4z"/>',
close:'<path d="M18 6 6 18M6 6l12 12"/>',
txt:'<path d="M4 7V4h16v3M9 20h6M12 4v16"/>',
img:'<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
draw:'<path d="M2 22l4-4L20 4a2 2 0 0 1 3 3L9 21z"/>',
hl:'<path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18"/>',
addpg:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8M8 12h8"/>',
mic:'<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
send:'<path d="M12 19V5M5 12l7-7 7 7"/>',
pdf:'<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>',
tpl:'<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/>',
newf:'<path d="M12 5v14M5 12h14"/>',
open:'<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>',
attach:'<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>',
trash:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'};
const ic=n=>`<span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${P[n]||''}</svg></span>`;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2);
const fmtD=t=>new Date(t).toLocaleString('lt-LT',{dateStyle:'short',timeStyle:'short'});
let toastT;
function toast(s,ms=3000){const t=$('toast');t.textContent=s;t.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('show'),ms)}

/* ===== Nustatymai ===== */
const EPS=[{id:'chat',name:'Chat (numatytasis)',url:'https://anymodel.org/v1/chat/completions'}];
const DEF={theme:'auto',accent:'#0866ff',fs:16,model:'claude-opus-5-5',models:['claude-opus-5-5','claude-sonnet-5-5','gpt-4o','gpt-4o-mini','gemini-2.0-flash-exp'],ep:'chat',eps:null,voiceLang:'lt-LT',apiKey:''};
let cfg;try{cfg={...DEF,...JSON.parse(localStorage.getItem('pdf_cfg')||'{}')};}catch{cfg={...DEF}}
if(!Array.isArray(cfg.eps)||!cfg.eps.length)cfg.eps=JSON.parse(JSON.stringify(EPS));
const saveCfg=()=>{try{localStorage.setItem('pdf_cfg',JSON.stringify(cfg))}catch{}};

/* ===== Išvaizda ===== */
function applyLook(){const dark=cfg.theme==='dark'||(cfg.theme==='auto'&&matchMedia('(prefers-color-scheme:dark)').matches);
 document.documentElement.dataset.theme=dark?'dark':'light';
 document.documentElement.style.setProperty('--a',cfg.accent);
 document.documentElement.style.setProperty('--fs',cfg.fs+'px');
 document.querySelector('meta[name=theme-color]').content=dark?'#171717':'#ffffff'}
matchMedia('(prefers-color-scheme:dark)').addEventListener('change',applyLook);

/* ===== Ikonų nustatymas ===== */
function setIcons(){$('bMenu').innerHTML=ic('menu');$('bAI').innerHTML=ic('ai');$('tClose').innerHTML=ic('close');
 $('aiClose').innerHTML=ic('close');$('aiMic').innerHTML=ic('mic');$('aiSend').innerHTML=ic('send');$('aiAttach').innerHTML=ic('attach');
 $('emptyLogo').innerHTML=ic('pdf');$('eNewIc').innerHTML=ic('newf');$('eOpenIc').innerHTML=ic('open');$('eTplIc').innerHTML=ic('tpl');
 $('eTxt').innerHTML=ic('txt')+'<span>Tekstas</span>';$('eImg').innerHTML=ic('img')+'<span>Nuotrauka</span>';
 $('eDraw').innerHTML=ic('draw')+'<span>Piešti</span>';$('eHL').innerHTML=ic('hl')+'<span>Pažymėti</span>';
 $('eAddPg').innerHTML=ic('addpg')+'<span>Puslapis</span>'}

/* ===== Dokumentų istorija ===== */
let docs=[];try{docs=JSON.parse(localStorage.getItem('pdf_docs')||'[]')}catch{}
const saveDocs=()=>{try{const l=docs.map(d=>({id:d.id,title:d.title,created:d.created,updated:d.updated}));localStorage.setItem('pdf_docs',JSON.stringify(l))}catch{}}

/* ===== Pokalbio AI ===== */
let aiHistory=[],aiOpen=false,aiCtrl=null,aiAttach=[];
function mdAI(s){return String(s||'').split('```').map((p,i)=>{if(i%2)return '<pre><code>'+esc(p.replace(/^[^\n]*\n/,''))+'</code></pre>';
 const e=t=>esc(t);return e(p).replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<b>$1</b>').split(/\n{2,}/).map(x=>x.trim()?'<p>'+x.trim().replace(/\n/g,'<br>')+'</p>':'').join('')}).join('')}
function addMsg(role,txt){const d=document.createElement('div');d.className='aimsg '+role;
 if(role==='ai')d.innerHTML=mdAI(txt);else d.textContent=txt;
 msgsEl.appendChild(d);msgsEl.scrollTop=msgsEl.scrollHeight;return d}
function openAI(){if(aiOpen)return;aiOpen=true;aiPanel.hidden=false;$('bAI').classList.add('on')}
function closeAI(){aiOpen=false;aiPanel.hidden=true;$('bAI').classList.remove('on')}

function getPdfContext(){if(!curDoc)return'(dokumentas neatidarytas)';
 const txt=curDoc.pages.map((p,i)=>{const ann=p.annotations||[];const t=ann.filter(a=>a.type==='txt').map(a=>a.text).join(' ');const im=ann.filter(a=>a.type==='img').length;return`[${i+1} psl.]${t?' '+t:''}${im?' ('+im+' nuotraukos)':''}`}).join('\n');
 return`Dokumentas: "${curDoc.title}", ${curDoc.pages.length} puslapiai.\n${txt||'(tekstas nepridėtas)'}`}

async function sendAI(txt){txt=txt.trim();if(!txt&&!aiAttach.length)return;
 if(!cfg.apiKey){toast('Įveskite raktą');openSettings();return}
 const att=[...aiAttach];aiAttach=[];renderAIAttach();inputEl.value='';grow();
 const msgTxt=txt+(att.length?' ['+att.length+' priedai]':'');aiHistory.push({role:'user',content:txt,images:att.map(a=>a.src)});addMsg('user',msgTxt);
 const el=addMsg('ai','');el.innerHTML='<div class="aidots"><i></i><i></i><i></i></div>';
 aiCtrl=new AbortController();
 try{const ep=cfg.eps.find(x=>x.id===cfg.ep)||cfg.eps[0];
  const ctx=getPdfContext();
  const sys=`Tu esi AI asistentas programėlėje "Mano PDF". Gali vykdyti komandas PDF dokumente.\n\nKomandos JSON formatu (rašyk po atsakymo atskirai bloke \`\`\`json ... \`\`\`):\n- addText: {page,text,x,y,size,color}\n- addImage: {page,src}\n- deletePage: {page}\n- addPage: {}\n- setTitle: {text}\n- highlight: {page,x,y,w,h}\n\nDokumentas:\n${ctx}\n\nJei vartotojas prašo pakeitimo, pateik komandą JSON bloke. Jei tik klausia, atsakyk tekstu be JSON.`;
  const msgs=[{role:'system',content:sys},...aiHistory.slice(-16).map(m=>({role:m.role,content:m.images?.length?[{type:'text',text:m.content||''},...m.images.map(src=>({type:'image_url',image_url:{url:src}}))]:m.content}))];
  const r=await fetch(ep.url,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+cfg.apiKey},body:JSON.stringify({model:cfg.model,messages:msgs}),signal:aiCtrl.signal});
  const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error?.message||'HTTP '+r.status);
  const ans=d.choices?.[0]?.message?.content||d.content?.[0]?.text||'(tuščias atsakymas)';aiHistory.push({role:'assistant',content:ans});
  const jm=ans.match(/```json\s*([\s\S]*?)```/);let cmds=null;
  if(jm){try{const o=JSON.parse(jm[1].trim());cmds=Array.isArray(o)?o:[o]}catch{}}
  const clean=ans.replace(/```json[\s\S]*?```/g,'').trim();
  el.innerHTML=mdAI(clean)+(cmds?`<button class="aibtn" data-act="apply" data-cmds='${esc(JSON.stringify(cmds))}'>✅ Pritaikyti</button>`:'');
 }catch(e){if(e.name!=='AbortError')el.innerHTML='<span style="color:var(--red)">Klaida: '+esc(e.message)+'</span>'}
 aiCtrl=null}

/* ===== Dokumentas ===== */
const W=794,H=1123;
let curDoc=null,curPage=0,undoStack=[],redoStack=[];
function newDoc(title,pages){curDoc={id:uid(),title:title||'Naujas dokumentas',created:Date.now(),updated:Date.now(),pages:pages||[{annotations:[]}]};
 undoStack=[];redoStack=[];curPage=0;docs.unshift(curDoc);saveDocs();showViewer()}
function snapshot(){undoStack.push(JSON.stringify(curDoc.pages));if(undoStack.length>30)undoStack.shift();redoStack=[];curDoc.updated=Date.now()}
function addAnnotation(pageIdx,type,val){if(!curDoc||!curDoc.pages[pageIdx])return;snapshot();
 const a={id:uid(),type,x:100,y:100};
 if(type==='txt'){a.text=val||'Tekstas';a.fontSize=20;a.color='#000';a.w=300;a.h=40}
 else if(type==='img'){a.src=val;a.w=200;a.h=150}
 else if(type==='hl'){a.x=val.x;a.y=val.y;a.w=val.w||200;a.h=val.h||30}
 else if(type==='draw'){a.points=val||[];a.color='#e5484d';a.width=3}
 curDoc.pages[pageIdx].annotations.push(a);curDoc.updated=Date.now();renderPages();saveDocs()}
function delAnnotation(pageIdx,id){if(!curDoc)return;snapshot();curDoc.pages[pageIdx].annotations=curDoc.pages[pageIdx].annotations.filter(a=>a.id!==id);renderPages();saveDocs()}
function addPage(){if(!curDoc)return;snapshot();curDoc.pages.push({annotations:[]});curPage=curDoc.pages.length-1;renderPages();toast('Puslapis pridėtas')}

/* ===== Peržiūra ===== */
function showViewer(){$('empty').hidden=true;$('viewer').hidden=false;$('editBar').hidden=false;$('docTitle').textContent=curDoc.title;renderPages()}
function hideViewer(){$('empty').hidden=false;$('viewer').hidden=true;$('editBar').hidden=true;curDoc=null}
function renderPages(){const wrap=$('pages');wrap.innerHTML='';
 curDoc.pages.forEach((pg,pi)=>{const outer=document.createElement('div');outer.className='page-wrap'+(pi===curPage?' sel':'');
  outer.style.cssText=`width:${W}px;max-width:calc(100vw - 32px);aspect-ratio:${W}/${H}`;
  outer.addEventListener('click',e=>{if(e.target===outer||e.target.tagName==='CANVAS'){curPage=pi;renderPages()}});
  const cv=document.createElement('canvas');cv.width=W;cv.height=H;cv.style.cssText=`width:100%;height:100%;display:block`;
  const ctx=cv.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,W,H);
  (pg.annotations||[]).forEach(a=>{
   if(a.type==='txt'){ctx.save();ctx.font=`${a.fontSize||18}px system-ui`;ctx.fillStyle=a.color||'#000';String(a.text||'').split('\n').forEach((l,i)=>ctx.fillText(l,a.x,a.y+20+i*(a.fontSize||18)*1.3));ctx.restore()}
   else if(a.type==='img'&&a.src){const img=new Image();img.onload=()=>{ctx.drawImage(img,a.x,a.y,a.w||200,a.h||150)};img.src=a.src}
   else if(a.type==='hl'){ctx.save();ctx.fillStyle='rgba(255,220,0,0.4)';ctx.fillRect(a.x,a.y,a.w||100,a.h||24);ctx.restore()}
   else if(a.type==='draw'&&a.points?.length){ctx.save();ctx.strokeStyle=a.color||'#e5484d';ctx.lineWidth=a.width||3;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();a.points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();ctx.restore()}});
  outer.appendChild(cv);wrap.appendChild(outer)});
 setTimeout(makeEditable,80)}

/* ===== Įrankiai ===== */
let activeTool='',drawPoints=[];
$('eTxt').onclick=()=>{const t=prompt('Tekstas:');if(t){addAnnotation(curPage,'txt',t);activeTool=''}};
$('eImg').onclick=()=>$('fImg2').click();
$('fImg2').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f||!curDoc)return;const r=new FileReader();r.onload=()=>addAnnotation(curPage,'img',r.result);r.readAsDataURL(f)};
$('eDraw').onclick=()=>{activeTool=activeTool==='draw'?'':'draw';$('eDraw').classList.toggle('on',activeTool==='draw')};
$('eHL').onclick=()=>{activeTool=activeTool==='hl'?'':'hl';$('eHL').classList.toggle('on',activeTool==='hl')};
$('eAddPg').onclick=addPage;

/* ===== Redaguojami elementai ===== */
function makeEditable(){if(!curDoc)return;
 document.querySelectorAll('.page-wrap').forEach((pw,pi)=>{if(!curDoc.pages[pi])return;const scale=(pw.offsetWidth||W)/W;
  (curDoc.pages[pi].annotations||[]).forEach(a=>{if(a.type==='img'||a.type==='draw')return;
   const el=document.createElement('div');el.className='ann '+(a.type==='txt'?'txt':'hl');el.dataset.id=a.id;
   el.style.cssText=`left:${a.x*scale}px;top:${a.y*scale}px;width:${(a.w||100)*scale}px;height:${(a.h||40)*scale}px;`+(a.type==='txt'?`font-size:${(a.fontSize||18)*scale}px;color:${a.color||'#000'}`:'');
   if(a.type==='txt'){el.contentEditable='true';el.textContent=a.text||'';el.oninput=()=>{a.text=el.textContent;curDoc.updated=Date.now()};el.onblur=saveDocs}
   ['nw','ne','sw','se'].forEach(d=>{const r=document.createElement('div');r.className='ann-resize '+d;el.appendChild(r)});
   el.addEventListener('dblclick',e=>{if(e.target.classList.contains('ann-resize'))return;if(confirm('Ištrinti?'))delAnnotation(pi,a.id)});
   makeDraggable(el,a,pi,scale);pw.appendChild(el)})});
 const cur=document.querySelector('.page-wrap.sel');if(cur&&activeTool==='draw'){cur.style.cursor='crosshair';cur.addEventListener('pointerdown',startDraw)}}
function makeDraggable(el,a,pi,scale){let sx,sy,ax,ay,mode='move';
 el.addEventListener('pointerdown',e=>{if(e.target.classList.contains('ann-resize')){mode='resize';const dir=e.target.className.split(' ')[1];
  const sx2=e.clientX,sy2=e.clientY,ox=a.x,oy=a.y,ow=a.w||100,oh=a.h||40;
  const mm=e2=>{const dx=(e2.clientX-sx2)/scale,dy=(e2.clientY-sy2)/scale;
   if(dir==='nw'){a.x=ox+dx;a.y=oy+dy;a.w=ow-dx;a.h=oh-dy}else if(dir==='ne'){a.y=oy+dy;a.w=ow+dx;a.h=oh-dy}else if(dir==='sw'){a.x=ox+dx;a.w=ow-dx;a.h=oh+dy}else{a.w=ow+dx;a.h=oh+dy}
   a.w=Math.max(40,a.w);a.h=Math.max(20,a.h);el.style.left=a.x*scale+'px';el.style.top=a.y*scale+'px';el.style.width=a.w*scale+'px';el.style.height=a.h*scale+'px'};
  const mu=()=>{document.removeEventListener('pointermove',mm);document.removeEventListener('pointerup',mu);saveDocs()};
  document.addEventListener('pointermove',mm);document.addEventListener('pointerup',mu);return}
  if(el.isContentEditable&&el.textContent&&!e.shiftKey)return;mode='move';sx=e.clientX;sy=e.clientY;ax=a.x;ay=a.y;
  const mm=e2=>{const dx=(e2.clientX-sx)/scale,dy=(e2.clientY-sy)/scale;a.x=Math.max(0,ax+dx);a.y=Math.max(0,ay+dy);el.style.left=a.x*scale+'px';el.style.top=a.y*scale+'px'};
  const mu=()=>{document.removeEventListener('pointermove',mm);document.removeEventListener('pointerup',mu);saveDocs()};
  document.addEventListener('pointermove',mm);document.addEventListener('pointerup',mu)},{passive:true})}
function startDraw(e){if(!curDoc||activeTool!=='draw')return;e.preventDefault();const pw=e.currentTarget,rect=pw.getBoundingClientRect(),scale=(pw.offsetWidth||W)/W;
 drawPoints=[];const mm=e2=>{drawPoints.push({x:(e2.clientX-rect.left)/scale,y:(e2.clientY-rect.top)/scale})};
 const mu=()=>{pw.removeEventListener('pointermove',mm);pw.removeEventListener('pointerup',mu);if(drawPoints.length>2){addAnnotation(curPage,'draw',drawPoints)}drawPoints=[];activeTool='';$('eDraw').classList.remove('on')};
 pw.addEventListener('pointermove',mm);pw.addEventListener('pointerup',mu)}

/* ===== AI priedai ===== */
function renderAIAttach(){const bar=$('aiAttBar');if(!bar)return;bar.innerHTML=aiAttach.map((a,i)=>`<div style="position:relative;flex:none"><img src="${esc(a.src)}" style="width:52px;height:52px;object-fit:cover;border-radius:10px;display:block"><button style="position:absolute;top:-5px;right:-5px;width:18px;height:18px;border-radius:50%;background:var(--tx);color:var(--bg);border:0;font-size:11px;display:grid;place-items:center" data-rm="${i}">✕</button></div>`).join('');bar.style.display=aiAttach.length?'flex':'none'}
$('aiAttach').onclick=()=>$('fAIAtt').click();
$('fAIAtt').onchange=async e=>{for(const f of e.target.files){const r=new FileReader();await new Promise(res=>{r.onload=()=>{aiAttach.push({src:r.result,name:f.name});res()};r.readAsDataURL(f)})};e.target.value='';renderAIAttach()};
document.getElementById('aiAttBar')?.addEventListener('click',e=>{const b=e.target.closest('[data-rm]');if(b){aiAttach.splice(+b.dataset.rm,1);renderAIAttach()}});

/* ===== Meniu, langeliai ===== */
const pushO=()=>{if(!history.state?.o)history.pushState({o:1},'')};
const syncScrim=()=>{scrimEl.hidden=!(drawerEl.classList.contains('open')||!sheetEl.hidden)};
function openDrawer(){renderDrawer();drawerEl.classList.add('open');syncScrim();pushO()}
function closeDrawer(){drawerEl.classList.remove('open');syncScrim()}
function openSheet(html,H){sheetEl.innerHTML=html;sheetEl._H=H||{};sheetEl.hidden=false;syncScrim();pushO()}
function closeSheet(){sheetEl.hidden=true;sheetEl.innerHTML='';sheetEl._H={};syncScrim()}
scrimEl.onclick=()=>{closeDrawer();closeSheet()};
sheetEl.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(b&&sheetEl._H[b.dataset.act])sheetEl._H[b.dataset.act](b.dataset.id)});
addEventListener('popstate',()=>{if(!sheetEl.hidden)closeSheet();else if(!aiPanel.hidden)closeAI();else if(drawerEl.classList.contains('open'))closeDrawer()});

/* ===== Mygtukai ===== */
$('bMenu').onclick=openDrawer;$('bAI').onclick=()=>aiOpen?closeAI():openAI();
$('tClose').onclick=()=>{if(confirm('Uždaryti?'))hideViewer()};
$('aiClose').onclick=closeAI;$('aiSend').onclick=()=>sendAI(inputEl.value);
inputEl.addEventListener('input',grow);
inputEl.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&innerWidth>600){e.preventDefault();sendAI(inputEl.value)}});
$('eNew').onclick=()=>{const t=prompt('Pavadinimas:','Naujas dokumentas');if(t)newDoc(t)};
$('eOpen').onclick=()=>$('fPDF').click();
$('eTemplate').onclick=openTemplates;
function grow(){inputEl.style.height='auto';inputEl.style.height=Math.min(inputEl.scrollHeight,120)+'px'}

/* ===== Paleidimas ===== */
applyLook();setIcons();
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
const bar=document.createElement('div');bar.id='aiAttBar';bar.style.cssText='display:none;gap:8px;overflow-x:auto;padding:4px 14px 8px';$('aifoot')?.prepend(bar);
msgsEl.addEventListener('click',e=>{const b=e.target.closest('[data-act="apply"]');if(!b||b.disabled||!curDoc)return;b.disabled=true;b.textContent='⏳';
 setTimeout(()=>{try{const cs=JSON.parse(b.dataset.cmds||'[]');cs.forEach(c=>{const fn=Object.keys(c)[0];if(fn==='addText'){addAnnotation(c.page??curPage,'txt',c.text);const a=curDoc.pages[c.page??curPage].annotations.slice(-1)[0];a.x=c.x??100;a.y=c.y??100;a.fontSize=c.size??20;a.color=c.color??'#000'}else if(fn==='addImage')addAnnotation(c.page??curPage,'img',c.src);else if(fn==='addPage')addPage();else if(fn==='setTitle'){curDoc.title=c.text;$('docTitle').textContent=c.text}});b.textContent='✅';toast('Pritaikyta')}catch(e){b.textContent='❌';toast('Klaida')}},100)},true);
/* ===== app.js pabaiga ===== */
