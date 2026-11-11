'use strict';
const $=id=>document.getElementById(id);
const te=new TextEncoder();
const msgsEl=$('aiMsgs'),inputEl=$('aiInput'),aiPanel=$('aiPanel'),drawerEl=$('drawer'),sheetEl=$('sheet'),scrimEl=$('scrim');

/* ===== Ikonos ===== */
const P={
menu:'<path d="M4 8h16M4 16h10"/>',
newf:'<path d="M12 5v14M5 12h14"/>',
open:'<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>',
ai:'<path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4z"/>',
close:'<path d="M18 6 6 18M6 6l12 12"/>',
save:'<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/>',
share:'<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="m16 6-4-4-4 4"/><path d="M12 2v13"/>',
undo:'<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
redo:'<path d="m15 14 5-5-5-5"/><path d="M19 9H8.5a5.5 5.5 0 0 0 0 11H13"/>',
txt:'<path d="M4 7V4h16v3M9 20h6M12 4v16"/>',
img:'<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
draw:'<path d="M2 22l4-4L20 4a2 2 0 0 1 3 3L9 21z"/>',
hl:'<path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18"/>',
trash:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
addpg:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8M8 12h8"/>',
mic:'<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
send:'<path d="M12 19V5M5 12l7-7 7 7"/>',
gear:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
pdf:'<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h1.5a1.5 1.5 0 0 1 0 3H9v-3zM9 16v2"/><path d="M14 13h2m-2 3h1.5"/>',
tpl:'<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/>',
back:'<path d="M15 18l-6-6 6-6"/>',
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
function setIcons(){$('bMenu').innerHTML=ic('menu');$('bNew').innerHTML=ic('newf');$('bOpen').innerHTML=ic('open');$('bAI').innerHTML=ic('ai');
 $('tClose').innerHTML=ic('close');$('tUndo').innerHTML=ic('undo');$('tRedo').innerHTML=ic('redo');$('tShare').innerHTML=ic('share');$('tSave').innerHTML=ic('save');
 $('aiClose').innerHTML=ic('close');$('aiMic').innerHTML=ic('mic');$('aiSend').innerHTML=ic('send');
 $('emptyLogo').innerHTML=ic('pdf');$('eNewIc').innerHTML=ic('newf');$('eOpenIc').innerHTML=ic('open');$('eTplIc').innerHTML=ic('tpl');
 $('eTxt').innerHTML=ic('txt')+'<span>Tekstas</span>';$('eImg').innerHTML=ic('img')+'<span>Nuotrauka</span>';
 $('eDraw').innerHTML=ic('draw')+'<span>Piešti</span>';$('eHL').innerHTML=ic('hl')+'<span>Pažymėti</span>';
 $('eDel').innerHTML=ic('trash')+'<span>Trinti</span>';$('eAddPg').innerHTML=ic('addpg')+'<span>Puslapis</span>'}

/* ===== Dokumentų istorija ===== */
let docs=[];try{docs=JSON.parse(localStorage.getItem('pdf_docs')||'[]')}catch{}
const saveDocs=()=>{try{const l=docs.map(d=>({id:d.id,title:d.title,created:d.created,updated:d.updated,pages:d.pages}));localStorage.setItem('pdf_docs',JSON.stringify(l))}catch{}}

/* ===== Pokalbio AI ===== */
let aiHistory=[],aiOpen=false,aiCtrl=null,aiRec=null,aiRecOn=false;
function mdAI(s){return String(s||'').split('```').map((p,i)=>{if(i%2)return '<pre><code>'+esc(p.replace(/^[^\n]*\n/,''))+'</code></pre>';
 const e=t=>esc(t);return e(p).replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<b>$1</b>').split(/\n{2,}/).map(x=>x.trim()?'<p>'+x.trim().replace(/\n/g,'<br>')+'</p>':'').join('')}).join('')}
function addMsg(role,txt,btns){const d=document.createElement('div');d.className='aimsg '+role;
 if(role==='ai')d.innerHTML=mdAI(txt)+(btns||[]).map(b=>`<br><button class="aibtn" data-act="${b.act}">${b.label}</button>`).join('');
 else d.textContent=txt;
 msgsEl.appendChild(d);msgsEl.scrollTop=msgsEl.scrollHeight;return d}
function openAI(){if(aiOpen)return;aiOpen=true;aiPanel.hidden=false;$('bAI').classList.add('on');
 if(!aiHistory.length)addMsg('ai','Labas! Aš esu AI asistentas. Galiu padėti:\n\n- Kurti naują PDF ar prezentaciją\n- Redaguoti atidarytą dokumentą\n- Rašyti ir taisyti tekstą\n- Sutvarkyti puslapių tvarką\n\nKo norėtumėte?')}
function closeAI(){aiOpen=false;aiPanel.hidden=true;$('bAI').classList.remove('on')}

function getPdfContext(){if(!curDoc)return'(dokumentas neatidarytas)';
 const txt=curDoc.pages.map((p,i)=>{const ann=p.annotations||[];const t=ann.filter(a=>a.type==='txt').map(a=>a.text).join(' ');return`[${i+1} puslapis]${t?' '+t:''}`}).join('\n');
 return`Dokumentas: "${curDoc.title}", ${curDoc.pages.length} puslapiai.\n${txt||'(tekstas nepridėtas)'}`}

async function sendAI(txt){txt=txt.trim();if(!txt)return;
 if(!cfg.apiKey){toast('Įveskite API raktą nustatymuose');openSettings();return}
 inputEl.value='';grow();aiHistory.push({role:'user',content:txt});addMsg('user',txt);
 const el=addMsg('ai','');el.innerHTML='<div class="aidots"><i></i><i></i><i></i></div>';
 aiCtrl=new AbortController();
 try{const ep=cfg.eps.find(x=>x.id===cfg.ep)||cfg.eps[0];
  const sys=`Tu esi AI asistentas programėlėje "Mano PDF". Pagalbi redaguoti PDF dokumentus. Kai siūlai pakeitimą, pateik jį kaip konkrečią instrukciją ir pridėk mygtuką "Pritaikyti".\n\nDabartinis dokumentas:\n${getPdfContext()}`;
  const r=await fetch(ep.url,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+cfg.apiKey},body:JSON.stringify({model:cfg.model,messages:[{role:'system',content:sys},...aiHistory.slice(-20)]}),signal:aiCtrl.signal});
  const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error?.message||'HTTP '+r.status);
  const ans=d.choices?.[0]?.message?.content||d.content?.[0]?.text||'(tuščias atsakymas)';
  aiHistory.push({role:'assistant',content:ans});
  const btns=[];
  if(ans.toLowerCase().includes('pritaikyti')||ans.toLowerCase().includes('įterpti')||ans.toLowerCase().includes('pridėti'))btns.push({act:'applyAI',label:'✅ Pritaikyti'});
  el.innerHTML=mdAI(ans)+btns.map(b=>`<button class="aibtn" data-act="${b.act}" data-txt="${esc(ans)}">${b.label}</button>`).join('')}
 catch(e){if(e.name!=='AbortError')el.innerHTML='<span style="color:var(--red)">Klaida: '+esc(e.message)+'</span>'}
 aiCtrl=null}
msgsEl.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b)return;
 if(b.dataset.act==='applyAI')applyAISuggestion(b.dataset.txt)});
function applyAISuggestion(txt){if(!curDoc){toast('Pirma atidarykite arba sukurkite dokumentą');return}
 const lines=txt.split('\n').filter(l=>l.trim());
 for(const l of lines){if(/pridėk|įterpk|parašyk/i.test(l)){const m=l.match(/["„]([^"""]+)["""]/);if(m)addAnnotation(curPage||0,'txt',m[1])}}
 toast('Pritaikyta');renderPages()}

/* ===== Dokumentas ===== */
let curDoc=null,curPage=0,undoStack=[],redoStack=[],activeTool='';
function newDoc(title,pages){curDoc={id:uid(),title:title||'Naujas dokumentas',created:Date.now(),updated:Date.now(),pages:pages||[{annotations:[]}]};
 undoStack=[];redoStack=[];curPage=0;docs.unshift(curDoc);saveDocs();showViewer()}
function snapshot(){undoStack.push(JSON.stringify(curDoc.pages));if(undoStack.length>30)undoStack.shift();redoStack=[];curDoc.updated=Date.now()}
function undo(){if(!undoStack.length)return;redoStack.push(JSON.stringify(curDoc.pages));curDoc.pages=JSON.parse(undoStack.pop());renderPages();toast('Atšaukta')}
function redo(){if(!redoStack.length)return;undoStack.push(JSON.stringify(curDoc.pages));curDoc.pages=JSON.parse(redoStack.pop());renderPages();toast('Pakartota')}
function addAnnotation(pageIdx,type,val){if(!curDoc||!curDoc.pages[pageIdx])return;snapshot();
 const a={id:uid(),type,x:50,y:50};
 if(type==='txt'){a.text=val||'Tekstas';a.fontSize=18;a.color='#000'}
 else if(type==='img'){a.src=val;a.w=200;a.h=150}
 else if(type==='hl'){a.x=val.x;a.y=val.y;a.w=val.w;a.h=val.h}
 curDoc.pages[pageIdx].annotations.push(a);curDoc.updated=Date.now();renderPages();saveDocs()}
function delAnnotation(pageIdx,id){if(!curDoc)return;snapshot();curDoc.pages[pageIdx].annotations=curDoc.pages[pageIdx].annotations.filter(a=>a.id!==id);renderPages();saveDocs()}
function addPage(){if(!curDoc)return;snapshot();curDoc.pages.push({annotations:[]});curPage=curDoc.pages.length-1;renderPages();toast('Puslapis pridėtas')}
function delPage(){if(!curDoc||curDoc.pages.length<2)return toast('Paskutinio puslapio ištrinti negalima');
 if(!confirm('Ištrinti šį puslapį?'))return;snapshot();curDoc.pages.splice(curPage,1);curPage=Math.min(curPage,curDoc.pages.length-1);renderPages();toast('Puslapis ištrintas')}

/* ===== Peržiūra (canvas) ===== */
const W=794,H=1123;
function showViewer(){$('empty').hidden=true;$('viewer').hidden=false;$('editBar').hidden=false;$('docTitle').textContent=curDoc.title;renderPages()}
function hideViewer(){$('empty').hidden=false;$('viewer').hidden=true;$('editBar').hidden=true;curDoc=null}
function renderPages(){const wrap=$('pages');wrap.innerHTML='';
 curDoc.pages.forEach((pg,pi)=>{const outer=document.createElement('div');outer.className='page-wrap'+(pi===curPage?' sel':'');outer.style.cssText=`width:${W}px;max-width:calc(100vw - 32px);aspect-ratio:${W}/${H}`;
  outer.addEventListener('click',()=>{curPage=pi;renderPages()});
  const sc=outer.style.maxWidth==='calc(100vw - 32px)'?(innerWidth-32)/W:1;
  const cv=document.createElement('canvas');cv.width=W;cv.height=H;cv.style.cssText=`width:100%;height:100%;display:block`;
  const ctx=cv.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,W,H);
  (pg.annotations||[]).forEach(a=>{if(a.type==='txt'){ctx.save();ctx.font=`${a.fontSize||18}px system-ui`;ctx.fillStyle=a.color||'#000';ctx.fillText(a.text||'',a.x,a.y+20);ctx.restore()}
   else if(a.type==='img'&&a.src){const img=new Image();img.onload=()=>{ctx.drawImage(img,a.x,a.y,a.w||200,a.h||150)};img.src=a.src}
   else if(a.type==='hl'){ctx.save();ctx.fillStyle='rgba(255,220,0,0.4)';ctx.fillRect(a.x,a.y,a.w||100,a.h||24);ctx.restore()}});
  outer.appendChild(cv);wrap.appendChild(outer)});
 wrap.scrollTop=curPage*200}

/* ===== Įrankiai ===== */
function setTool(t){activeTool=activeTool===t?'':t;['eTxt','eImg','eDraw','eHL'].forEach(id=>$(id)?.classList.toggle('on',$(id)&&$(id).getAttribute('aria-label')==={eTxt:'Tekstas',eImg:'Nuotrauka',eDraw:'Piešti',eHL:'Pažymėti'}[id]&&activeTool===t))}
$('eTxt').onclick=()=>{if(!curDoc)return;const t=prompt('Tekstas:');if(t)addAnnotation(curPage,'txt',t)};
$('eImg').onclick=()=>{if(!curDoc)return;$('fImg2').click()};
$('fImg2').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f||!curDoc)return;const r=new FileReader();r.onload=()=>addAnnotation(curPage,'img',r.result);r.readAsDataURL(f)};
$('eDraw').onclick=()=>toast('Pieštuko funkcija bus pridėta kitoje versijoje');
$('eHL').onclick=()=>toast('Pažymėjimo funkcija bus pridėta kitoje versijoje');
$('eDel').onclick=()=>delPage();
$('eAddPg').onclick=()=>addPage();
$('tUndo').onclick=undo;$('tRedo').onclick=redo;

/* ===== PDF atidarymas ===== */
$('fPDF').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;
 toast('Atidaroma...',10000);
 try{const ab=await f.arrayBuffer();if(typeof window.pdfjsLib==='undefined')throw new Error('PDF biblioteka dar kraunasi. Palaukite ir bandykite dar kartą.');
  const pdf=await pdfjsLib.getDocument({data:ab}).promise;const pages=[];
  for(let i=1;i<=pdf.numPages;i++){const pg=await pdf.getPage(i);const vp=pg.getViewport({scale:1});const cv=document.createElement('canvas');cv.width=vp.width;cv.height=vp.height;await pg.render({canvasContext:cv.getContext('2d'),viewport:vp}).promise;
   const txt=await pg.getTextContent();const tStr=txt.items.map(x=>x.str).join(' ');
   pages.push({annotations:[{id:uid(),type:'img',src:cv.toDataURL('image/jpeg',.9),x:0,y:0,w:W,h:H}],sourceText:tStr})}
  curDoc={id:uid(),title:f.name.replace('.pdf',''),created:Date.now(),updated:Date.now(),pages,source:'upload'};
  undoStack=[];redoStack=[];curPage=0;docs.unshift(curDoc);saveDocs();showViewer();toast('Atidarytas: '+f.name)}
 catch(err){toast('Klaida: '+err.message)}}

/* ===== Išsaugojimas ir siuntimas ===== */
async function saveDoc(){if(!curDoc){toast('Nėra dokumento');return}
 try{if(typeof window.jspdf==='undefined'&&typeof window.jsPDF==='undefined')throw new Error('PDF biblioteka kraunasi. Palaukite.');
  const {jsPDF}=window.jspdf||{jsPDF:window.jsPDF};const doc=new jsPDF({orientation:'portrait',unit:'pt',format:'a4'});
  const pw=doc.internal.pageSize.getWidth(),ph=doc.internal.pageSize.getHeight();
  for(let pi=0;pi<curDoc.pages.length;pi++){if(pi>0)doc.addPage();const pg=curDoc.pages[pi];
   doc.setFillColor(255,255,255);doc.rect(0,0,pw,ph,'F');
   for(const a of pg.annotations||[]){
    if(a.type==='img'&&a.src){try{const ix=a.x/W*pw,iy=a.y/H*ph,iw=(a.w||W)/W*pw,ih=(a.h||H)/H*ph;const fmt=a.src.includes('image/png')?'PNG':'JPEG';doc.addImage(a.src,fmt,ix,iy,iw,ih)}catch{}}
    else if(a.type==='txt'){doc.setFontSize(a.fontSize||18);doc.setTextColor(a.color||'#000000');doc.text(a.text||'',a.x/W*pw,(a.y+20)/H*ph)}
    else if(a.type==='hl'){doc.setFillColor(255,220,0);doc.setGState(doc.GState({opacity:.4}));doc.rect(a.x/W*pw,a.y/H*ph,(a.w||100)/W*pw,(a.h||24)/H*ph,'F');doc.setGState(doc.GState({opacity:1}))}}}
  const name=(curDoc.title||'dokumentas').replace(/[^a-zA-Z0-9ąčęėįšųūžĄČĘĖĮŠŲŪŽ\s_-]/g,'_')+'.pdf';
  doc.save(name);toast('Išsaugota: '+name)}
 catch(err){toast('Klaida išsaugant: '+err.message)}}
async function shareDoc(){if(!curDoc)return toast('Nėra dokumento');
 try{if(typeof window.jspdf==='undefined'&&typeof window.jsPDF==='undefined')throw new Error('PDF biblioteka kraunasi.');
  const{jsPDF}=window.jspdf||{jsPDF:window.jsPDF};const doc=new jsPDF({orientation:'portrait',unit:'pt',format:'a4'});
  const pw=doc.internal.pageSize.getWidth(),ph=doc.internal.pageSize.getHeight();
  for(let pi=0;pi<curDoc.pages.length;pi++){if(pi>0)doc.addPage();const pg=curDoc.pages[pi];
   for(const a of pg.annotations||[]){
    if(a.type==='img'&&a.src){try{const ix=a.x/W*pw,iy=a.y/H*ph,iw=(a.w||W)/W*pw,ih=(a.h||H)/H*ph;const fmt=a.src.includes('image/png')?'PNG':'JPEG';doc.addImage(a.src,fmt,ix,iy,iw,ih)}catch{}}
    else if(a.type==='txt'){doc.setFontSize(a.fontSize||18);doc.setTextColor(a.color||'#000000');doc.text(a.text||'',a.x/W*pw,(a.y+20)/H*ph)}}}
  const blob=doc.output('blob');const file=new File([blob],(curDoc.title||'dokumentas')+'.pdf',{type:'application/pdf'});
  if(navigator.share&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title:curDoc.title})}
  else{const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=(curDoc.title||'dokumentas')+'.pdf';a.click();URL.revokeObjectURL(url);toast('Failas atsisiųstas')}}
 catch(err){toast('Klaida: '+err.message)}}
$('tSave').onclick=saveDoc;$('tShare').onclick=shareDoc;

/* ===== Meniu ir langeliai ===== */
const pushO=()=>{if(!history.state?.o)history.pushState({o:1},'')};
const syncScrim=()=>{scrimEl.hidden=!(drawerEl.classList.contains('open')||!sheetEl.hidden)};
function openDrawer(){renderDrawer();drawerEl.classList.add('open');syncScrim();pushO()}
function closeDrawer(){drawerEl.classList.remove('open');syncScrim()}
function openSheet(html,H){sheetEl.innerHTML=html;sheetEl._H=H||{};sheetEl.hidden=false;syncScrim();pushO()}
function closeSheet(){sheetEl.hidden=true;sheetEl.innerHTML='';sheetEl._H={};syncScrim()}
scrimEl.onclick=()=>{closeDrawer();closeSheet()};
sheetEl.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(b&&sheetEl._H[b.dataset.act])sheetEl._H[b.dataset.act](b.dataset.id)});
addEventListener('popstate',()=>{if(!sheetEl.hidden)closeSheet();else if(!aiPanel.hidden)closeAI();else if(drawerEl.classList.contains('open'))closeDrawer()});

/* ===== Šoninis meniu ===== */
function renderDrawer(){drawerEl.innerHTML=`<div class="dscroll">
<div style="padding:16px 12px 8px;display:flex;align-items:center;gap:10px"><div style="width:40px;height:40px;border-radius:14px;background:var(--a);color:#fff;display:grid;place-items:center">${ic('pdf')}</div><b style="font-size:1.1rem">Mano PDF</b></div>
<div class="item" data-act="newDoc">${ic('newf')}<span class="t">Naujas dokumentas</span></div>
<div class="item" data-act="openDoc">${ic('open')}<span class="t">Atidaryti PDF</span></div>
<div class="item" data-act="tplDoc">${ic('tpl')}<span class="t">Iš šablono</span></div>
<div class="sec">Dokumentai</div>
${docs.slice(0,20).map(d=>`<div class="item" data-act="loadDoc" data-id="${d.id}">${ic('pdf')}<span class="t"><span class="tt">${esc(d.title)}</span><small>${fmtD(d.updated)}</small></span></div>`).join('')||'<p style="padding:12px;color:var(--mu);font-size:.9rem">Dokumentų dar nėra</p>'}
</div>
<div style="border-top:1px solid var(--ln);padding:8px"><div class="item" data-act="settings">${ic('gear')}<span class="t">Nustatymai</span></div></div>`;
 drawerEl.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b)return;closeDrawer();
  ({newDoc:()=>{const t=prompt('Dokumento pavadinimas:','Naujas dokumentas');if(t)newDoc(t)},
    openDoc:()=>$('fPDF').click(),tplDoc:openTemplates,
    loadDoc:()=>{const d=docs.find(x=>x.id===b.dataset.id);if(d){curDoc=d;curPage=0;undoStack=[];redoStack=[];showViewer()}},
    settings:openSettings})[b.dataset.act]?.()})}

/* ===== Šablonai ===== */
const TEMPLATES=[{id:'pres',name:'Prezentacija',ic:'tpl',desc:'5 skaidrių šablonas',slides:5},{id:'cv',name:'CV',ic:'open',desc:'Gyvenimo aprašymas',slides:1},{id:'broch',name:'Brošiūra',ic:'pdf',desc:'Lankstinukas A4',slides:2},{id:'card',name:'Vizitinė kortelė',ic:'img',desc:'Kompaktinis formatas',slides:1},{id:'report',name:'Ataskaita',ic:'pdf',desc:'Oficialus dokumentas',slides:3},{id:'poster',name:'Plakatas',ic:'img',desc:'A4 plakatas',slides:1}];
function openTemplates(){openSheet(`<h3>Pasirinkite šabloną</h3><div class="tpl-grid">${TEMPLATES.map(t=>`<button class="tpl" data-act="tpl" data-id="${t.id}">${ic(t.ic)}<b>${t.name}</b><small>${t.desc}</small></button>`).join('')}</div>`,
 {tpl:id=>{closeSheet();const T=TEMPLATES.find(x=>x.id===id);if(!T)return;
  const title=prompt('Pavadinimas:',T.name)||T.name;
  const pages=Array.from({length:T.slides},(_,i)=>{const a=[];
   if(id==='pres'){a.push({id:uid(),type:'txt',x:80,y:120,text:i===0?title:`${i+1} skaidrė`,fontSize:i===0?36:28,color:'#1e1e2e'})}
   else if(id==='cv'){a.push({id:uid(),type:'txt',x:60,y:80,text:'Vardas Pavardė',fontSize:32,color:'#1e1e2e'},{id:uid(),type:'txt',x:60,y:150,text:'El. paštas | Tel. numeris',fontSize:16,color:'#555'})}
   else a.push({id:uid(),type:'txt',x:60,y:100,text:title,fontSize:28,color:'#1e1e2e'});
   return{annotations:a}});
  newDoc(title,pages);toast(T.name+' sukurtas')}})}

/* ===== Nustatymai ===== */
function openSettings(){const has=!!cfg.apiKey;
 openSheet(`<h3>Nustatymai</h3>
<div class="card"><div class="row col" style="flex-direction:column;align-items:stretch;gap:8px">
<b style="font-size:.85rem;color:var(--mu)">API RAKTAS</b>
<div style="display:flex;align-items:center;gap:8px;padding:8px 0;font-size:.9rem">${has?'<span style="color:#1f9d55">✅ Išsaugotas</span>':'<span style="color:var(--mu)">⚠️ Neįvestas</span>'}</div>
<input class="in" id="sk" type="password" placeholder="${has?'Naujas raktas, jei norite pakeisti':'Įklijuokite raktą iš anymodel.org'}">
<button class="btn p" id="saveKey">Išsaugoti raktą</button></div></div>
<div class="card"><div class="row"><div class="t">Modelis</div><select class="in" id="sm" style="max-width:160px">${cfg.models.map(m=>`<option${m===cfg.model?' selected':''}>${esc(m)}</option>`).join('')}</select></div>
<div class="row"><div class="t">Pokalbių adresas</div><select class="in" id="sep" style="max-width:160px">${cfg.eps.map(x=>`<option value="${x.id}"${x.id===cfg.ep?' selected':''}>${esc(x.name)}</option>`).join('')}</select></div></div>
<div class="card"><div class="row"><div class="t">Tema</div><div class="seg" style="max-width:200px">${[['light','Šviesi'],['dark','Tamsi'],['auto','Auto']].map(([k,n])=>`<button class="${cfg.theme===k?'on':''}" data-th="${k}">${n}</button>`).join('')}</div></div>
<div class="row"><div class="t">Teksto dydis: <span id="fsv">${cfg.fs}</span>px</div><input type="range" id="sfr" min="13" max="22" value="${cfg.fs}" style="max-width:120px"></div></div>`,{});
 setTimeout(()=>{$('saveKey')?.addEventListener('click',()=>{const v=$('sk').value.trim();if(!v)return toast('Įveskite raktą');cfg.apiKey=v;saveCfg();toast('Raktas išsaugotas');closeSheet()});
  $('sm')?.addEventListener('change',e=>{cfg.model=e.target.value;saveCfg()});
  $('sep')?.addEventListener('change',e=>{cfg.ep=e.target.value;saveCfg()});
  $('sfr')?.addEventListener('input',e=>{cfg.fs=+e.target.value;$('fsv').textContent=e.target.value;applyLook();saveCfg()});
  document.querySelectorAll('[data-th]').forEach(b=>b.addEventListener('click',()=>{cfg.theme=b.dataset.th;saveCfg();applyLook();document.querySelectorAll('[data-th]').forEach(x=>x.classList.toggle('on',x.dataset.th===cfg.theme))}))},50)}

/* ===== AI mikrofonas ===== */
function dictateAI(){const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR)return toast('Mikrofonas nepalaikomas');
 if(aiRecOn){aiRec.stop();return}aiRec=new SR();aiRec.lang=cfg.voiceLang;aiRec.interimResults=false;
 aiRec.onresult=e=>{inputEl.value=e.results[0][0].transcript;grow()};
 aiRec.onerror=()=>{aiRecOn=false;$('aiMic').classList.remove('on')};
 aiRec.onend=()=>{aiRecOn=false;$('aiMic').classList.remove('on')};
 aiRec.start();aiRecOn=true;$('aiMic').classList.add('on')}

/* ===== Prisegti mygtukai ===== */
$('bMenu').onclick=openDrawer;$('bNew').onclick=()=>{const t=prompt('Dokumento pavadinimas:','Naujas dokumentas');if(t)newDoc(t)};$('bOpen').onclick=()=>$('fPDF').click();$('bAI').onclick=()=>aiOpen?closeAI():openAI();
$('tClose').onclick=()=>{if(confirm('Uždaryti dokumentą?'))hideViewer()};
$('aiClose').onclick=closeAI;$('aiMic').onclick=dictateAI;
$('aiSend').onclick=()=>sendAI(inputEl.value);
inputEl.addEventListener('input',grow);inputEl.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&innerWidth>600){e.preventDefault();sendAI(inputEl.value)}});
$('eNew').onclick=()=>{const t=prompt('Dokumento pavadinimas:','Naujas dokumentas');if(t)newDoc(t)};
$('eOpen').onclick=()=>$('fPDF').click();$('eTemplate').onclick=openTemplates;

/* ===== Teksto lauko augimas ===== */
function grow(){inputEl.style.height='auto';inputEl.style.height=Math.min(inputEl.scrollHeight,120)+'px'}

/* ===== Paleidimas ===== */
applyLook();setIcons();
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
toast('Mano PDF įkelta ✅',2000);
