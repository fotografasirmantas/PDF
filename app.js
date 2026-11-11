'use strict';
const $=id=>document.getElementById(id);
const msgsEl=$('aiMsgs'),inputEl=$('aiInput'),aiPanel=$('aiPanel'),drawerEl=$('drawer'),sheetEl=$('sheet'),scrimEl=$('scrim');

/* ===== Ikonos ===== */
const P={
menu:'<path d="M4 8h16M4 16h10"/>',
ai:'<path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4z"/>',
close:'<path d="M18 6 6 18M6 6l12 12"/>',
txt:'<path d="M4 7V4h16v3M9 20h6M12 4v16"/>',
img:'<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
draw:'<path d="M2 22l4-4L20 4a2 2 0 0 1 3 3L9 21z"/>',
hl:'<rect x="3" y="11" width="18" height="6" rx="2" fill="rgba(255,220,0,.5)" stroke="none"/><path d="M3 7h9M3 17h18"/>',
addpg:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8M8 12h8"/>',
mic:'<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
send:'<path d="M12 19V5M5 12l7-7 7 7"/>',
pdf:'<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h1.5a1.5 1.5 0 0 1 0 3H9v-3zM14 13h2m-2 3h1"/>',
tpl:'<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/>',
newf:'<path d="M12 5v14M5 12h14"/>',
open:'<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>',
attach:'<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>',
save:'<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/>',
share:'<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="m16 6-4-4-4 4"/><path d="M12 2v13"/>',
undo:'<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
redo:'<path d="m15 14 5-5-5-5"/><path d="M19 9H8.5a5.5 5.5 0 0 0 0 11H13"/>',
pres:'<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>',
pages:'<rect x="3" y="3" width="8" height="10" rx="1.5"/><rect x="13" y="3" width="8" height="10" rx="1.5"/><rect x="3" y="17" width="8" height="4" rx="1"/><rect x="13" y="17" width="8" height="4" rx="1"/>',
gear:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
trash:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
check:'<path d="M20 6 9 17l-5-5"/>',
more:'<circle cx="5" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="19" cy="12" r="1.5" fill="currentColor"/>'};
const ic=n=>`<span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${P[n]||''}</svg></span>`;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2);
const fmtD=t=>new Date(t).toLocaleString('lt-LT',{dateStyle:'short',timeStyle:'short'});
let toastT;
function toast(s,ms=3000){const t=$('toast');t.textContent=s;t.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('show'),ms)}

/* ===== Nustatymai ===== */
const EPS=[{id:'chat',name:'Chat (numatytasis)',url:'https://anymodel.org/v1/chat/completions'},{id:'resp',name:'Responses',url:'https://anymodel.org/v1/responses'},{id:'claude',name:'Claude messages',url:'https://anymodel.org/v1/messages'}];
const DEF={theme:'auto',accent:'#0866ff',fs:16,model:'claude-opus-5-5',models:['claude-opus-5-5','claude-sonnet-5-5','gpt-4o','gpt-4o-mini'],ep:'chat',eps:null,voiceLang:'lt-LT',apiKey:''};
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
function setIcons(){
 $('bMenu').innerHTML=ic('menu');
 $('bAI').innerHTML=ic('ai');
 $('tClose').innerHTML=ic('close');
 $('tPages').innerHTML=ic('pages');
 $('tUndo').innerHTML=ic('undo');
 $('tRedo').innerHTML=ic('redo');
 $('tPres').innerHTML=ic('pres');
 $('tShare').innerHTML=ic('share');
 $('tSave').innerHTML=ic('save');
 $('aiClose').innerHTML=ic('close');
 $('aiNew').innerHTML=ic('newf');
 $('aiMic').innerHTML=ic('mic');
 $('aiSend').innerHTML=ic('send');
 $('aiAttach').innerHTML=ic('attach');
 $('emptyLogo').innerHTML=ic('pdf');
 $('eNewIc').innerHTML=ic('newf');
 $('eOpenIc').innerHTML=ic('open');
 $('eTplIc').innerHTML=ic('tpl');
 $('eTxt').innerHTML=ic('txt')+'<span>Tekstas</span>';
 $('eImg').innerHTML=ic('img')+'<span>Nuotrauka</span>';
 $('eDraw').innerHTML=ic('draw')+'<span>Piešti</span>';
 $('eHL').innerHTML=ic('hl')+'<span>Pažymėti</span>';
 $('eAddPg').innerHTML=ic('addpg')+'<span>Puslapis</span>'}

/* ===== Dokumentų istorija ===== */
let docs=[];
try{const meta=localStorage.getItem('pdf_docs_meta')||localStorage.getItem('pdf_docs')||'[]';docs=JSON.parse(meta)}catch{}
function saveDocs(){try{const l=docs.map(d=>({id:d.id,title:d.title,created:d.created,updated:d.updated}));localStorage.setItem('pdf_docs_meta',JSON.stringify(l));
 if(curDoc){try{localStorage.setItem('pdf_doc_'+curDoc.id,JSON.stringify(curDoc))}catch{}}}catch{}}

/* ===== AI pokalbis ===== */
let aiHistory=[],aiOpen=false,aiCtrl=null,aiAttach=[];
function mdAI(s){return String(s||'').split('```').map((p,i)=>{if(i%2)return '<pre><code>'+esc(p.replace(/^[^\n]*\n/,''))+'</code></pre>';
 return esc(p).replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<b>$1</b>').split(/\n{2,}/).map(x=>x.trim()?'<p>'+x.trim().replace(/\n/g,'<br>')+'</p>':'').join('')}).join('')}
function addMsg(role,txt){const d=document.createElement('div');d.className='aimsg '+role;
 if(role==='ai')d.innerHTML=mdAI(txt);else d.textContent=txt;
 msgsEl.appendChild(d);setTimeout(()=>msgsEl.scrollTop=msgsEl.scrollHeight,30);return d}
function openAI(){if(aiOpen)return;aiOpen=true;aiPanel.hidden=false;$('bAI').classList.add('on')}
function closeAI(){aiOpen=false;aiPanel.hidden=true;$('bAI').classList.remove('on')}
function renderAIAttach(){const bar=$('aiAttBar');if(!bar)return;
 bar.innerHTML=aiAttach.map((a,i)=>`<div style="position:relative;flex:none"><img src="${esc(a.src)}" style="width:52px;height:52px;object-fit:cover;border-radius:10px;display:block"><button style="position:absolute;top:-5px;right:-5px;width:18px;height:18px;border-radius:50%;background:var(--tx);color:var(--bg);border:0;font-size:11px;cursor:pointer;display:grid;place-items:center" data-rm="${i}">✕</button></div>`).join('');
 bar.style.display=aiAttach.length?'flex':'none'}
function getPdfContext(){if(!curDoc)return'(dokumentas neatidarytas)';
 return'Dokumentas: "'+curDoc.title+'", '+curDoc.pages.length+' puslapiai.\n'+curDoc.pages.map((p,i)=>{const t=(p.annotations||[]).filter(a=>a.type==='txt').map(a=>a.text).join(' ');const im=(p.annotations||[]).filter(a=>a.type==='img').length;const st=p.sourceText||'';return'['+(i+1)+' psl.]'+(t?' '+t:'')+(im?' ('+im+' nuotraukos)':'')+(st?' [originalus tekstas: '+st.slice(0,200)+']':'')}).join('\n')}
async function sendAI(txt){txt=(txt||inputEl.value).trim();if(!txt&&!aiAttach.length)return;
 if(!cfg.apiKey){toast('Įveskite raktą');openSettings();return}
 const att=[...aiAttach];aiAttach=[];renderAIAttach();inputEl.value='';grow();
 const msgTxt=txt+(att.length?' ['+att.length+' priedai]':'');
 aiHistory.push({role:'user',content:txt,images:att.map(a=>a.src)});addMsg('user',msgTxt);
 const el=addMsg('ai','');el.innerHTML='<div class="aidots"><i></i><i></i><i></i></div>';
 aiCtrl=new AbortController();
 try{const ep=cfg.eps.find(x=>x.id===cfg.ep)||cfg.eps[0];
  const sys='Tu esi AI asistentas programėlėje "Mano PDF". Gali vykdyti komandas PDF dokumente.\n\nKomandos JSON formatu (rašyk po atsakymo atskirai bloke ```json ... ```):\n- {addText:{page:0,text:"...",x:100,y:100,size:20,color:"#000"}}\n- {addImage:{page:0,src:"url"}}\n- {deletePage:{page:0}}\n- {addPage:{}}\n- {setTitle:{text:"..."}}\n- {highlight:{page:0,x:50,y:50,w:200,h:30}}\n- {build:{slides:[{title:"...",body:"..."}]}}\n\nDokumentas:\n'+getPdfContext()+'\n\nJei vartotojas prašo pakeitimo, pateik komandą JSON bloke ir trumpai paaiškink. Jei klausia, atsakyk tekstu be JSON. Nesisveikin ir nerašyk nieko, kol nepaklausė.';
  const msgs=[{role:'system',content:sys},...aiHistory.slice(-20).map(m=>({role:m.role,content:m.images?.length?[{type:'text',text:m.content||''},...m.images.map(src=>({type:'image_url',image_url:{url:src}}))]:m.content||''}))];
  const r=await fetch(ep.url,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+cfg.apiKey},body:JSON.stringify({model:cfg.model,messages:msgs}),signal:aiCtrl.signal});
  const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error?.message||'HTTP '+r.status);
  const ans=d.choices?.[0]?.message?.content||d.content?.[0]?.text||'(tuščias atsakymas)';
  aiHistory.push({role:'assistant',content:ans});
  const jm=ans.match(/```json\s*([\s\S]*?)```/);let cmds=null;
  if(jm){try{const o=JSON.parse(jm[1].trim());cmds=Array.isArray(o)?o:[o]}catch{}}
  const clean=ans.replace(/```json[\s\S]*?```/g,'').trim();
  el.innerHTML=mdAI(clean)+(cmds?`<button class="aibtn" data-act="apply" data-cmds='${esc(JSON.stringify(cmds))}'>✅ Pritaikyti</button>`:'')}
 catch(e){if(e.name!=='AbortError')el.innerHTML='<span style="color:var(--red)">Klaida: '+esc(e.message)+'</span>'}
 aiCtrl=null}

/* ===== AI komandų vykdymas ===== */
const CMD={
 addText:c=>{if(!curDoc)return;addAnnotation(c.page??curPage,'txt',c.text||'Tekstas');const pg=curDoc.pages[c.page??curPage];if(pg){const a=pg.annotations.slice(-1)[0];a.x=c.x??100;a.y=c.y??100;a.fontSize=c.size??20;a.color=c.color??'#000';a.w=c.w??300;a.h=c.h??40}renderPages()},
 addImage:c=>{if(!curDoc||!c.src)return;addAnnotation(c.page??curPage,'img',c.src)},
 deletePage:c=>{curPage=c.page??curPage;delPage()},
 addPage:()=>addPage(),
 setTitle:c=>{if(curDoc&&c.text){curDoc.title=c.text.slice(0,80);$('docTitle').textContent=curDoc.title;saveDocs();toast('Pavadinimas pakeistas')}},
 highlight:c=>{if(!curDoc)return;addAnnotation(c.page??curPage,'hl',{x:c.x??50,y:c.y??50,w:c.w??200,h:c.h??30})},
 build:c=>{if(!curDoc||!Array.isArray(c.slides))return;if(!confirm('Pakeisti dokumentą '+c.slides.length+' naujų puslapių?'))return;snapshot();
  curDoc.pages=c.slides.map(s=>({annotations:[{id:uid(),type:'txt',x:80,y:120,text:s.title||'',fontSize:s.titleSize??28,color:s.titleColor??'#1e1e2e'},...(s.body?[{id:uid(),type:'txt',x:80,y:200,text:s.body,fontSize:s.bodySize??16,color:s.bodyColor??'#444'}]:[])]}));
  curPage=0;renderPages();saveDocs();toast('Dokumentas sukurtas')}};
msgsEl.addEventListener('click',e=>{const b=e.target.closest('[data-act="apply"]');if(!b||b.disabled)return;
 if(!curDoc){toast('Pirma sukurkite arba atidarykite dokumentą');return}
 b.disabled=true;b.textContent='⏳';
 setTimeout(()=>{try{const cs=JSON.parse(b.dataset.cmds||'[]');let done=0;
  cs.forEach(c=>{const k=c.cmd||Object.keys(c)[0];if(k&&CMD[k]){CMD[k](c[k]??c);done++}});
  b.textContent=done?'✅ Pritaikyta':'❌ Nerasta';toast(done?'Pritaikyta ✅':'Komandų nerasta')}
 catch(err){b.textContent='❌';toast('Klaida: '+err.message)}},100)},true);

/* ===== Dokumentas ===== */
const W=794,H=1123;
let curDoc=null,curPage=0,undoStack=[],redoStack=[],activeTool='',drawPoints=[];
function newDoc(title,pages){curDoc={id:uid(),title:title||'Naujas dokumentas',created:Date.now(),updated:Date.now(),pages:pages||[{annotations:[]}]};
 undoStack=[];redoStack=[];curPage=0;docs.unshift(curDoc);saveDocs();showViewer()}
function snapshot(){if(!curDoc)return;undoStack.push(JSON.stringify(curDoc.pages));if(undoStack.length>30)undoStack.shift();redoStack=[];curDoc.updated=Date.now()}
function addAnnotation(pi,type,val){if(!curDoc||!curDoc.pages[pi])return;snapshot();
 const a={id:uid(),type,x:100,y:100};
 if(type==='txt'){a.text=String(val||'Tekstas');a.fontSize=20;a.color='#000';a.w=300;a.h=50}
 else if(type==='img'){a.src=val;a.w=300;a.h=200}
 else if(type==='hl'){a.x=val.x??100;a.y=val.y??100;a.w=val.w??200;a.h=val.h??30}
 else if(type==='draw'){a.points=val||[];a.color='#e5484d';a.lineWidth=3}
 curDoc.pages[pi].annotations.push(a);curDoc.updated=Date.now();renderPages();saveDocs()}
function delAnnotation(pi,id){if(!curDoc)return;snapshot();curDoc.pages[pi].annotations=curDoc.pages[pi].annotations.filter(a=>a.id!==id);renderPages();saveDocs()}
function addPage(){if(!curDoc)return;snapshot();curDoc.pages.push({annotations:[]});curPage=curDoc.pages.length-1;renderPages();toast('Puslapis pridėtas')}
function delPage(){if(!curDoc||curDoc.pages.length<2)return toast('Paskutinio puslapio negalima ištrinti');if(!confirm('Ištrinti šį puslapį?'))return;snapshot();curDoc.pages.splice(curPage,1);curPage=Math.min(curPage,curDoc.pages.length-1);renderPages();saveDocs();toast('Puslapis ištrintas')}

/* ===== Canvas peržiūra ===== */
function showViewer(){$('empty').hidden=true;$('viewer').hidden=false;$('editBar').hidden=false;$('docTitle').textContent=curDoc?.title||'';renderPages()}
function hideViewer(){$('empty').hidden=false;$('viewer').hidden=true;$('editBar').hidden=true;curDoc=null}
function renderPages(){if(!curDoc)return;const wrap=$('pages');wrap.innerHTML='';
 curDoc.pages.forEach((pg,pi)=>{
  const outer=document.createElement('div');outer.className='page-wrap'+(pi===curPage?' sel':'');
  outer.style.cssText='width:'+W+'px;max-width:calc(100vw - 32px)';
  outer.addEventListener('click',e=>{if(e.target===outer||e.target.tagName==='CANVAS'){curPage=pi;document.querySelectorAll('.page-wrap').forEach((p,i)=>p.classList.toggle('sel',i===pi))}});
  const cv=document.createElement('canvas');cv.width=W;cv.height=H;cv.style.cssText='width:100%;display:block';
  const ctx=cv.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);
  (pg.annotations||[]).forEach(a=>{
   if(a.type==='txt'&&a.text){ctx.save();ctx.font=(a.fontSize||20)+'px system-ui,sans-serif';ctx.fillStyle=a.color||'#000';String(a.text).split('\n').forEach((l,i)=>ctx.fillText(l,a.x,a.y+22+i*(a.fontSize||20)*1.35));ctx.restore()}
   else if(a.type==='img'&&a.src){const im=new Image();im.onload=()=>{ctx.drawImage(im,a.x,a.y,a.w||300,a.h||200);};im.src=a.src}
   else if(a.type==='hl'){ctx.save();ctx.fillStyle='rgba(255,220,0,.4)';ctx.fillRect(a.x,a.y,a.w||200,a.h||30);ctx.restore()}
   else if(a.type==='draw'&&a.points?.length>1){ctx.save();ctx.strokeStyle=a.color||'#e5484d';ctx.lineWidth=a.lineWidth||3;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();a.points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();ctx.restore()}});
  outer.appendChild(cv);wrap.appendChild(outer)});
 setupDrawLayer();setTimeout(makeEditable,100)}

/* ===== Redaguojami elementai ===== */
function makeEditable(){if(!curDoc)return;
 document.querySelectorAll('.page-wrap').forEach((pw,pi)=>{if(!curDoc.pages[pi])return;
  const scale=(pw.offsetWidth||W)/W;
  (curDoc.pages[pi].annotations||[]).forEach(a=>{if(a.type==='img'||a.type==='draw')return;
   const el=document.createElement('div');el.className='ann '+(a.type==='txt'?'txt':'hl');el.dataset.id=a.id;
   el.style.cssText='left:'+(a.x*scale)+'px;top:'+(a.y*scale)+'px;width:'+(( a.w||200)*scale)+'px;height:'+((a.h||40)*scale)+'px'+(a.type==='txt'?';font-size:'+((a.fontSize||20)*scale)+'px;color:'+(a.color||'#000'):'');
   if(a.type==='txt'){el.contentEditable='true';el.textContent=a.text||'';
    el.oninput=()=>{a.text=el.textContent;curDoc.updated=Date.now()};
    el.onblur=()=>{a.text=el.textContent;saveDocs()}}
   ['nw','ne','sw','se'].forEach(d=>{const r=document.createElement('div');r.className='ann-resize '+d;r.dataset.dir=d;el.appendChild(r)});
   el.addEventListener('dblclick',e=>{if(!e.target.classList.contains('ann-resize')){if(confirm('Ištrinti šią anotaciją?'))delAnnotation(pi,a.id)}});
   makeDraggable(el,a,pi,scale);pw.appendChild(el)})})}

function makeDraggable(el,a,pi,scale){let sx,sy,ax,ay,ow,oh,mode='';
 el.addEventListener('pointerdown',e=>{
  if(e.target.classList.contains('ann-resize')){
   mode='resize';const dir=e.target.dataset.dir;
   sx=e.clientX;sy=e.clientY;ax=a.x;ay=a.y;ow=a.w||200;oh=a.h||40;e.preventDefault();e.stopPropagation();
   const mm=e2=>{const dx=(e2.clientX-sx)/scale,dy=(e2.clientY-sy)/scale;
    if(dir==='nw'){a.x=ax+dx;a.y=ay+dy;a.w=Math.max(60,ow-dx);a.h=Math.max(24,oh-dy)}
    else if(dir==='ne'){a.y=ay+dy;a.w=Math.max(60,ow+dx);a.h=Math.max(24,oh-dy)}
    else if(dir==='sw'){a.x=ax+dx;a.w=Math.max(60,ow-dx);a.h=Math.max(24,oh+dy)}
    else{a.w=Math.max(60,ow+dx);a.h=Math.max(24,oh+dy)}
    el.style.left=(a.x*scale)+'px';el.style.top=(a.y*scale)+'px';el.style.width=(a.w*scale)+'px';el.style.height=(a.h*scale)+'px'};
   const mu=()=>{document.removeEventListener('pointermove',mm);document.removeEventListener('pointerup',mu);saveDocs()};
   document.addEventListener('pointermove',mm);document.addEventListener('pointerup',mu);return}
  if(e.target===el||(el.isContentEditable&&!el.textContent.trim())){
   mode='move';sx=e.clientX;sy=e.clientY;ax=a.x;ay=a.y;
   const mm=e2=>{a.x=Math.max(0,ax+(e2.clientX-sx)/scale);a.y=Math.max(0,ay+(e2.clientY-sy)/scale);el.style.left=(a.x*scale)+'px';el.style.top=(a.y*scale)+'px'};
   const mu=()=>{document.removeEventListener('pointermove',mm);document.removeEventListener('pointerup',mu);saveDocs()};
   document.addEventListener('pointermove',mm);document.addEventListener('pointerup',mu)}},{passive:false})}

/* ===== Pieštuko sluoksnis ===== */
function setupDrawLayer(){if(activeTool!=='draw')return;
 document.querySelectorAll('.page-wrap').forEach((pw,pi)=>{pw.style.cursor='crosshair';
  pw.addEventListener('pointerdown',function startD(e){if(activeTool!=='draw'||e.target.classList.contains('ann'))return;
   e.preventDefault();const rect=pw.getBoundingClientRect(),scale=(pw.offsetWidth||W)/W;
   drawPoints=[{x:(e.clientX-rect.left)/scale,y:(e.clientY-rect.top)/scale}];
   const mm=e2=>{if(e2.buttons!==1)return;drawPoints.push({x:(e2.clientX-rect.left)/scale,y:(e2.clientY-rect.top)/scale})};
   const mu=()=>{pw.removeEventListener('pointermove',mm);document.removeEventListener('pointerup',mu);
    if(drawPoints.length>3){addAnnotation(pi,'draw',drawPoints)}
    drawPoints=[];activeTool='';$('eDraw').classList.remove('on');document.querySelectorAll('.page-wrap').forEach(p=>p.style.cursor='')};
   pw.addEventListener('pointermove',mm);document.addEventListener('pointerup',mu)},{once:true,passive:false})})}

/* ===== Įrankiai ===== */
$('eTxt').onclick=()=>{if(!curDoc)return toast('Pirma sukurkite dokumentą');const t=prompt('Teksto turinys:');if(t?.trim())addAnnotation(curPage,'txt',t.trim())};
$('eImg').onclick=()=>{if(!curDoc)return toast('Pirma sukurkite dokumentą');$('fImg2').click()};
$('fImg2').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f||!curDoc)return;const r=new FileReader();r.onload=()=>addAnnotation(curPage,'img',r.result);r.readAsDataURL(f)};
$('eDraw').onclick=()=>{if(!curDoc)return;activeTool=activeTool==='draw'?'':'draw';$('eDraw').classList.toggle('on',activeTool==='draw');if(activeTool==='draw'){toast('Piešk pirštu ant puslapio');setupDrawLayer()}else document.querySelectorAll('.page-wrap').forEach(p=>p.style.cursor='')};
$('eHL').onclick=()=>{if(!curDoc)return;activeTool=activeTool==='hl'?'':'hl';$('eHL').classList.toggle('on',activeTool==='hl');if(activeTool==='hl')toast('Paspausk ir temk ant puslapio, kad pažymėtum')};
$('eAddPg').onclick=addPage;
$('tUndo').onclick=()=>{if(!undoStack.length)return toast('Nėra ko atšaukti');redoStack.push(JSON.stringify(curDoc.pages));curDoc.pages=JSON.parse(undoStack.pop());renderPages();toast('Atšaukta')};
$('tRedo').onclick=()=>{if(!redoStack.length)return toast('Nėra ko pakartoti');undoStack.push(JSON.stringify(curDoc.pages));curDoc.pages=JSON.parse(redoStack.pop());renderPages();toast('Pakartota')};
$('tClose').onclick=()=>{if(undoStack.length&&!confirm('Yra neišsaugotų pakeitimų. Uždaryti?'))return;hideViewer()};
$('tPages').onclick=openPageList;
$('tSave').onclick=()=>savePDF();
$('tShare').onclick=()=>sharePDF();
$('tPres').onclick=()=>startPres();

/* ===== Meniu ir langeliai ===== */
const pushO=()=>{if(!history.state?.o)history.pushState({o:1},'')};
const syncScrim=()=>{scrimEl.hidden=!(drawerEl.classList.contains('open')||!sheetEl.hidden)};
function openDrawer(){renderDrawer();drawerEl.classList.add('open');syncScrim();pushO()}
function closeDrawer(){drawerEl.classList.remove('open');syncScrim()}
function openSheet(html,H){sheetEl.innerHTML=html;sheetEl._H=H||{};sheetEl.hidden=false;syncScrim();pushO()}
function closeSheet(){sheetEl.hidden=true;sheetEl.innerHTML='';sheetEl._H={};syncScrim()}
scrimEl.onclick=()=>{closeDrawer();closeSheet()};
sheetEl.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(b&&sheetEl._H?.[b.dataset.act])sheetEl._H[b.dataset.act](b.dataset.id,b)});
addEventListener('popstate',()=>{if(!sheetEl.hidden)closeSheet();else if(!aiPanel.hidden)closeAI();else if(drawerEl.classList.contains('open'))closeDrawer()});

/* ===== AI priedai ===== */
$('aiAttach').onclick=()=>$('fAIAtt').click();
$('fAIAtt').onchange=async e=>{for(const f of e.target.files){const r=new FileReader();await new Promise(res=>{r.onload=()=>{aiAttach.push({src:r.result,name:f.name});res()};r.readAsDataURL(f)})};e.target.value='';renderAIAttach()};
$('aiAttBar').addEventListener('click',e=>{const b=e.target.closest('[data-rm]');if(b){aiAttach.splice(+b.dataset.rm,1);renderAIAttach()}});

/* ===== AI mygtukai ===== */
$('bMenu').onclick=openDrawer;
$('bAI').onclick=()=>aiOpen?closeAI():openAI();
$('aiClose').onclick=closeAI;
$('aiNew').onclick=()=>{if(aiHistory.length&&!confirm('Išvalyti pokalbio istoriją?'))return;aiHistory=[];msgsEl.innerHTML='';toast('Pokalbis išvalytas')};
$('aiSend').onclick=()=>sendAI(inputEl.value);
$('aiMic').onclick=()=>{const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR)return toast('Mikrofonas nepalaikomas');const r=new SR();r.lang=cfg.voiceLang;r.onresult=e=>{inputEl.value=e.results[0][0].transcript;grow()};r.start();toast('Klausomasi...',3000)};
inputEl.addEventListener('input',grow);
inputEl.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&innerWidth>600){e.preventDefault();sendAI(inputEl.value)}});
$('eNew').onclick=()=>{const t=prompt('Pavadinimas:','Naujas dokumentas');if(t?.trim())newDoc(t.trim())};
$('eOpen').onclick=()=>$('fPDF').click();
$('eTemplate').onclick=()=>openTemplates();
function grow(){inputEl.style.height='auto';inputEl.style.height=Math.min(inputEl.scrollHeight,120)+'px'}

/* ===== Prezentacijos režimas ===== */
let presMode=false,presIdx=0;
function startPres(){if(!curDoc||!curDoc.pages.length)return toast('Nėra dokumento');
 presIdx=curPage;presMode=true;
 const ov=document.createElement('div');ov.id='presOv';ov.style.cssText='position:fixed;inset:0;z-index:50;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center';
 const cv=document.createElement('canvas');cv.id='presCv';cv.style.cssText='max-width:100vw;max-height:85vh;display:block';
 const bar=document.createElement('div');bar.style.cssText='display:flex;gap:16px;padding:16px;align-items:center';
 const mk=(t,fn)=>{const b=document.createElement('button');b.textContent=t;b.style.cssText='color:#fff;background:rgba(255,255,255,.15);border:0;border-radius:10px;padding:10px 20px;font-size:1rem;cursor:pointer';b.onclick=fn;return b};
 const lbl=document.createElement('span');lbl.style.cssText='color:#aaa;font-size:.9rem';
 const draw=()=>{if(!curDoc)return;const pg=curDoc.pages[presIdx];const sc=Math.min(innerWidth/W,(innerHeight*.85)/H);cv.width=W*sc;cv.height=H*sc;const ctx=cv.getContext('2d');ctx.scale(sc,sc);ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);
  (pg.annotations||[]).forEach(a=>{if(a.type==='txt'&&a.text){ctx.save();ctx.font=(a.fontSize||20)+'px system-ui';ctx.fillStyle=a.color||'#000';String(a.text).split('\n').forEach((l,i)=>ctx.fillText(l,a.x,a.y+22+i*(a.fontSize||20)*1.35));ctx.restore()}else if(a.type==='img'&&a.src){const im=new Image();im.onload=()=>ctx.drawImage(im,a.x,a.y,a.w||300,a.h||200);im.src=a.src}});
  lbl.textContent=(presIdx+1)+' / '+curDoc.pages.length};
 bar.append(mk('◀',()=>{presIdx=Math.max(0,presIdx-1);draw()}),lbl,mk('▶',()=>{presIdx=Math.min(curDoc.pages.length-1,presIdx+1);draw()}),mk('✕',()=>{presMode=false;ov.remove();document.removeEventListener('keydown',pk)}));
 ov.append(cv,bar);document.body.appendChild(ov);draw();
 const pk=e=>{if(e.key==='ArrowRight'||e.key===' '){presIdx=Math.min(curDoc.pages.length-1,presIdx+1);draw()}else if(e.key==='ArrowLeft'){presIdx=Math.max(0,presIdx-1);draw()}else if(e.key==='Escape'){presMode=false;ov.remove();document.removeEventListener('keydown',pk)}};
 document.addEventListener('keydown',pk)}

/* ===== Puslapių sąrašas ===== */
function openPageList(){if(!curDoc)return;
 const html='<h3>Puslapiai ('+curDoc.pages.length+')</h3><div id="pgGrid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:12px"></div><button class="btn p w" data-act="add">Pridėti puslapį</button>';
 openSheet(html,{add:()=>{addPage();closeSheet()}});
 const grid=$('pgGrid');
 curDoc.pages.forEach((pg,i)=>{const c=document.createElement('canvas');c.width=W;c.height=H;c.style.cssText='width:100%;aspect-ratio:'+W+'/'+H+';border-radius:8px;border:2px solid '+(i===curPage?'var(--a)':'var(--ln)')+';cursor:pointer;display:block';
  const ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);
  (pg.annotations||[]).forEach(a=>{if(a.type==='txt'&&a.text){ctx.font=(a.fontSize||20)+'px system-ui';ctx.fillStyle=a.color||'#000';ctx.fillText(String(a.text).split('\n')[0],a.x,a.y+22)}else if(a.type==='img'&&a.src){const im=new Image();im.onload=()=>ctx.drawImage(im,a.x,a.y,a.w||300,a.h||200);im.src=a.src}});
  const wrap=document.createElement('div');wrap.style.cssText='display:flex;flex-direction:column;gap:4px';
  const lbl=document.createElement('div');lbl.style.cssText='font-size:.75rem;color:var(--mu);text-align:center';lbl.textContent=(i+1)+' psl.';
  const del=document.createElement('button');del.style.cssText='font-size:.72rem;color:var(--red);background:none;border:0;cursor:pointer';del.textContent='Ištrinti';
  del.onclick=()=>{if(curDoc.pages.length<2)return toast('Paskutinio negalima ištrinti');if(!confirm('Ištrinti '+(i+1)+' puslapį?'))return;snapshot();curDoc.pages.splice(i,1);curPage=Math.min(curPage,curDoc.pages.length-1);renderPages();saveDocs();closeSheet()};
  c.onclick=()=>{curPage=i;renderPages();closeSheet()};
  wrap.append(c,lbl,del);grid.appendChild(wrap)})}

/* ===== Šablonai ===== */
const TEMPLATES=[
 {id:'pres',name:'Prezentacija',ic:'▶',desc:'5 skaidrių šablonas'},
 {id:'cv',name:'CV',ic:'👤',desc:'Gyvenimo aprašymas'},
 {id:'broch',name:'Brošiūra',ic:'📋',desc:'Dvipusis lankstinukas'},
 {id:'card',name:'Vizitinė kortelė',ic:'🪪',desc:'Kompaktinis formatas'},
 {id:'report',name:'Ataskaita',ic:'📊',desc:'Oficialus dokumentas'},
 {id:'poster',name:'Plakatas',ic:'🖼',desc:'A4 plakatas'},
 {id:'invite',name:'Kvietimas',ic:'✉️',desc:'Renginių kvietimas'},
 {id:'menu',name:'Meniu',ic:'🍽',desc:'Restorano / renginio'},
 {id:'cert',name:'Sertifikatas',ic:'🏆',desc:'Pažymėjimas / diplomas'},
 {id:'article',name:'Straipsnis',ic:'📰',desc:'Teksto dokumentas'},
 {id:'flyer',name:'Skrajutė',ic:'📢',desc:'Reklaminė skrajutė'},
 {id:'label',name:'Etiketė',ic:'🏷',desc:'Produkto etiketė'}];
function buildTemplate(id,title){const pages=[];
 if(id==='pres'){for(let i=0;i<5;i++)pages.push({annotations:[{id:uid(),type:'txt',x:80,y:i===0?160:140,text:i===0?title:'Skaidrė '+(i+1),fontSize:i===0?36:28,color:'#1e1e2e',w:600,h:60},{id:uid(),type:'txt',x:80,y:i===0?260:220,text:i===0?'Pateikė: '+new Date().getFullYear():'Čia rašykite turinį',fontSize:18,color:'#555',w:600,h:200}]});
 }else if(id==='cv'){pages.push({annotations:[{id:uid(),type:'txt',x:60,y:80,text:title,fontSize:36,color:'#1e1e2e',w:600,h:50},{id:uid(),type:'txt',x:60,y:150,text:'El. paštas | Tel. numeris | Miestas',fontSize:16,color:'#555',w:600,h:30},{id:uid(),type:'txt',x:60,y:220,text:'APIE MANE',fontSize:18,color:'#0866ff',w:600,h:30},{id:uid(),type:'txt',x:60,y:260,text:'Čia parašykite trumpą savęs pristatymą...',fontSize:16,color:'#333',w:620,h:80},{id:uid(),type:'txt',x:60,y:380,text:'PATIRTIS',fontSize:18,color:'#0866ff',w:600,h:30},{id:uid(),type:'txt',x:60,y:420,text:'Įmonė (metai–metai)\nPareigos ir atsakomybės...',fontSize:16,color:'#333',w:620,h:120},{id:uid(),type:'txt',x:60,y:580,text:'IŠSILAVINIMAS',fontSize:18,color:'#0866ff',w:600,h:30},{id:uid(),type:'txt',x:60,y:620,text:'Universitetas (metai)\nStudijų programa',fontSize:16,color:'#333',w:620,h:80},{id:uid(),type:'txt',x:60,y:740,text:'ĮGŪDŽIAI',fontSize:18,color:'#0866ff',w:600,h:30},{id:uid(),type:'txt',x:60,y:780,text:'• Įgūdis 1   • Įgūdis 2   • Įgūdis 3',fontSize:16,color:'#333',w:620,h:40}]});
 }else if(id==='report'){pages.push({annotations:[{id:uid(),type:'txt',x:80,y:120,text:title,fontSize:32,color:'#1e1e2e',w:620,h:60},{id:uid(),type:'txt',x:80,y:200,text:'Data: '+new Date().toLocaleDateString('lt-LT'),fontSize:16,color:'#555',w:300,h:30},{id:uid(),type:'txt',x:80,y:280,text:'1. ĮVADAS',fontSize:20,color:'#0866ff',w:600,h:30},{id:uid(),type:'txt',x:80,y:320,text:'Čia rašykite įvado tekstą...',fontSize:16,color:'#333',w:620,h:100},{id:uid(),type:'txt',x:80,y:460,text:'2. TURINYS',fontSize:20,color:'#0866ff',w:600,h:30},{id:uid(),type:'txt',x:80,y:500,text:'Čia rašykite pagrindinį turinį...',fontSize:16,color:'#333',w:620,h:200},{id:uid(),type:'txt',x:80,y:740,text:'3. IŠVADOS',fontSize:20,color:'#0866ff',w:600,h:30},{id:uid(),type:'txt',x:80,y:780,text:'Čia rašykite išvadas...',fontSize:16,color:'#333',w:620,h:100}]});
  pages.push({annotations:[{id:uid(),type:'txt',x:80,y:80,text:'4. PRIEDAI',fontSize:20,color:'#0866ff',w:600,h:30},{id:uid(),type:'txt',x:80,y:120,text:'Priedų turinys...',fontSize:16,color:'#333',w:620,h:200}]});
 }else if(id==='invite'){pages.push({annotations:[{id:uid(),type:'txt',x:80,y:200,text:'Jus maloniai kviečiame į',fontSize:22,color:'#555',w:620,h:35},{id:uid(),type:'txt',x:80,y:260,text:title,fontSize:38,color:'#0866ff',w:620,h:60},{id:uid(),type:'txt',x:80,y:360,text:'📅 Data: ____________________',fontSize:18,color:'#333',w:620,h:35},{id:uid(),type:'txt',x:80,y:410,text:'📍 Vieta: ____________________',fontSize:18,color:'#333',w:620,h:35},{id:uid(),type:'txt',x:80,y:460,text:'🕐 Laikas: ____________________',fontSize:18,color:'#333',w:620,h:35},{id:uid(),type:'txt',x:80,y:560,text:'Laukiame Jūsų!',fontSize:24,color:'#0866ff',w:620,h:40}]});
 }else if(id==='cert'){pages.push({annotations:[{id:uid(),type:'txt',x:80,y:120,text:'SERTIFIKATAS',fontSize:42,color:'#0866ff',w:620,h:60},{id:uid(),type:'txt',x:80,y:220,text:'Suteikiamas',fontSize:22,color:'#555',w:620,h:35},{id:uid(),type:'txt',x:80,y:280,text:title,fontSize:34,color:'#1e1e2e',w:620,h:55},{id:uid(),type:'txt',x:80,y:360,text:'už sėkmingą dalyvavimą ir puikius rezultatus',fontSize:20,color:'#555',w:620,h:35},{id:uid(),type:'txt',x:80,y:500,text:'Data: '+new Date().toLocaleDateString('lt-LT'),fontSize:18,color:'#333',w:300,h:30},{id:uid(),type:'txt',x:400,y:500,text:'Parašas: _______________',fontSize:18,color:'#333',w:300,h:30}]});
 }else if(id==='poster'){pages.push({annotations:[{id:uid(),type:'txt',x:80,y:160,text:title,fontSize:48,color:'#1e1e2e',w:620,h:80},{id:uid(),type:'txt',x:80,y:280,text:'Čia rašykite pagrindinę žinutę',fontSize:24,color:'#555',w:620,h:60},{id:uid(),type:'txt',x:80,y:420,text:'📅 Data ir vieta',fontSize:22,color:'#0866ff',w:620,h:40},{id:uid(),type:'txt',x:80,y:580,text:'Daugiau info: www.example.lt',fontSize:20,color:'#0866ff',w:620,h:35}]});
 }else if(id==='flyer'){pages.push({annotations:[{id:uid(),type:'txt',x:60,y:100,text:'🔥 '+title.toUpperCase(),fontSize:36,color:'#e5484d',w:660,h:60},{id:uid(),type:'txt',x:60,y:200,text:'Čia rašykite pagrindinę žinutę ir pasiūlymą',fontSize:22,color:'#1e1e2e',w:660,h:80},{id:uid(),type:'txt',x:60,y:340,text:'✅ Privalumas 1\n✅ Privalumas 2\n✅ Privalumas 3',fontSize:20,color:'#333',w:660,h:120},{id:uid(),type:'txt',x:60,y:520,text:'📞 Tel: ____________\n📧 El. paštas: ____________',fontSize:18,color:'#0866ff',w:660,h:80}]});
 }else if(id==='menu'){pages.push({annotations:[{id:uid(),type:'txt',x:80,y:80,text:title,fontSize:38,color:'#1e1e2e',w:620,h:55},{id:uid(),type:'txt',x:80,y:180,text:'UŽKANDŽIAI',fontSize:22,color:'#0866ff',w:620,h:35},{id:uid(),type:'txt',x:80,y:220,text:'• Patiekalas 1 .............. €\n• Patiekalas 2 .............. €',fontSize:17,color:'#333',w:620,h:70},{id:uid(),type:'txt',x:80,y:330,text:'PAGRINDINIAI PATIEKALAI',fontSize:22,color:'#0866ff',w:620,h:35},{id:uid(),type:'txt',x:80,y:370,text:'• Patiekalas 1 .............. €\n• Patiekalas 2 .............. €\n• Patiekalas 3 .............. €',fontSize:17,color:'#333',w:620,h:100},{id:uid(),type:'txt',x:80,y:510,text:'DESERTAI',fontSize:22,color:'#0866ff',w:620,h:35},{id:uid(),type:'txt',x:80,y:550,text:'• Desertas 1 .............. €\n• Desertas 2 .............. €',fontSize:17,color:'#333',w:620,h:70}]});
 }else if(id==='article'){pages.push({annotations:[{id:uid(),type:'txt',x:80,y:80,text:title,fontSize:34,color:'#1e1e2e',w:620,h:55},{id:uid(),type:'txt',x:80,y:160,text:'Autorius | '+new Date().toLocaleDateString('lt-LT'),fontSize:15,color:'#888',w:620,h:25},{id:uid(),type:'txt',x:80,y:220,text:'Įvadas. Čia rašykite įvado paragrafą...',fontSize:17,color:'#333',w:620,h:80},{id:uid(),type:'txt',x:80,y:340,text:'Pagrindinis turinys. Čia rašykite pagrindinį straipsnio tekstą...',fontSize:17,color:'#333',w:620,h:300},{id:uid(),type:'txt',x:80,y:680,text:'Išvados. Čia rašykite išvadas...',fontSize:17,color:'#333',w:620,h:100}]});
 }else if(id==='broch'){pages.push({annotations:[{id:uid(),type:'txt',x:60,y:120,text:title,fontSize:36,color:'#0866ff',w:300,h:55},{id:uid(),type:'txt',x:60,y:200,text:'Čia rašykite aprašymą',fontSize:17,color:'#333',w:300,h:200},{id:uid(),type:'txt',x:420,y:120,text:'Kontaktai',fontSize:22,color:'#0866ff',w:300,h:35},{id:uid(),type:'txt',x:420,y:170,text:'📞 Tel. numeris\n📧 El. paštas\n🌐 www.example.lt',fontSize:17,color:'#333',w:300,h:100}]});
 }else if(id==='card'){pages.push({annotations:[{id:uid(),type:'txt',x:60,y:120,text:title,fontSize:28,color:'#1e1e2e',w:400,h:45},{id:uid(),type:'txt',x:60,y:185,text:'Pareigos',fontSize:18,color:'#0866ff',w:400,h:30},{id:uid(),type:'txt',x:60,y:260,text:'📞 Tel. numeris\n📧 el.pastas@example.lt\n🌐 www.example.lt',fontSize:16,color:'#555',w:400,h:90}]});
 }else if(id==='label'){pages.push({annotations:[{id:uid(),type:'txt',x:60,y:100,text:title,fontSize:32,color:'#1e1e2e',w:660,h:50},{id:uid(),type:'txt',x:60,y:180,text:'Aprašymas: ____________________',fontSize:18,color:'#555',w:660,h:35},{id:uid(),type:'txt',x:60,y:240,text:'Kiekis: _____ | Data: ___________',fontSize:18,color:'#555',w:660,h:35},{id:uid(),type:'txt',x:60,y:340,text:'Brūkšninis kodas: _______________',fontSize:16,color:'#888',w:660,h:35}]});
 }else{pages.push({annotations:[{id:uid(),type:'txt',x:80,y:160,text:title,fontSize:32,color:'#1e1e2e',w:620,h:55}]})}
 return pages}
function openTemplates(){openSheet(`<h3>Pasirinkite šabloną</h3><div class="tpl-grid">${TEMPLATES.map(t=>`<button class="tpl" data-act="tpl" data-id="${t.id}">${t.ic}<b>${t.name}</b><small>${t.desc}</small></button>`).join('')}</div>`,
 {tpl:id=>{closeSheet();const T=TEMPLATES.find(x=>x.id===id);if(!T)return;const title=prompt('Pavadinimas:',T.name)||T.name;newDoc(title,buildTemplate(id,title));toast(T.name+' sukurtas')}})}

/* ===== Paleidimas ===== */
applyLook();setIcons();
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
/* ===== app.js pabaiga ===== */
