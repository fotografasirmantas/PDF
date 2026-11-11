'use strict';
/* Mano PDF: bibliotekos, raktas, AI, išsaugojimas. Veikia su app.js */
const APP_VER='v3';
const AM_BASE='https://anymodel.org/v1';

/* ===== Stiliai ===== */
(()=>{const s=document.createElement('style');s.textContent=`
.ann{position:absolute;cursor:move;user-select:none;-webkit-user-select:none;box-sizing:border-box}
.ann.txt{border:1.5px solid var(--a);border-radius:6px;background:rgba(255,255,255,.93);padding:4px 8px;line-height:1.4;overflow:hidden;word-break:break-word}
.ann.txt:focus-within{overflow:auto;outline:2px solid var(--a)}
.ann.hl{background:rgba(255,220,0,.4);border-radius:3px}
.ann-resize{position:absolute;width:16px;height:16px;border-radius:50%;background:var(--a);border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35);z-index:5;touch-action:none}
.ann-resize.nw{top:-8px;left:-8px;cursor:nw-resize}
.ann-resize.ne{top:-8px;right:-8px;cursor:ne-resize}
.ann-resize.sw{bottom:-8px;left:-8px;cursor:sw-resize}
.ann-resize.se{bottom:-8px;right:-8px;cursor:se-resize}
.page-wrap{position:relative;overflow:visible!important}
.page-wrap canvas{display:block;width:100%;height:auto}
.etool span{font-size:.7rem;display:block;margin-top:2px}
.etool.on{background:rgba(255,255,255,.18)!important}
.aibtn{display:inline-flex;align-items:center;gap:6px;background:var(--a);color:#fff;border:0;border-radius:10px;padding:7px 13px;font:inherit;font-size:.88rem;cursor:pointer;margin-top:8px}
.aibtn:disabled{opacity:.5}
.aidots{display:flex;gap:5px;padding:4px 0}
.aidots i{width:7px;height:7px;border-radius:50%;background:var(--mu);animation:bd 1.2s infinite;display:inline-block}
.aidots i:nth-child(2){animation-delay:.15s}.aidots i:nth-child(3){animation-delay:.3s}
@keyframes bd{0%,60%,100%{opacity:.3;transform:none}30%{opacity:1;transform:translateY(-4px)}}
#aiAttBar{display:none;gap:8px;overflow-x:auto;padding:4px 14px 8px}
.aifoot{display:flex;flex-direction:column;padding:8px 12px 12px;border-top:1px solid var(--ln);gap:4px}
.aibox{display:flex;align-items:flex-end;gap:6px;background:var(--bg2);border:1px solid var(--ln);border-radius:24px;padding:6px 6px 6px 14px}
#aiInput{flex:1;border:0;background:none;resize:none;font-size:.95rem;max-height:100px;line-height:1.45;outline:none}
#aiInput::placeholder{color:var(--mu)}
.scrim{z-index:29!important}.drawer{z-index:30!important}.sheet{z-index:31!important}.aipanel{z-index:28!important}
`;document.head.appendChild(s)})();

/* ===== PDF bibliotekos ===== */
function loadScript(src){return new Promise((res,rej)=>{const s=document.createElement('script');s.src=src;s.onload=res;s.onerror=()=>rej(new Error('Nepavyko įkelti: '+src));document.head.appendChild(s)})}
const libsReady=Promise.all([
 loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js').then(()=>{pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'}),
 loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js')
]).catch(e=>toast('PDF bibliotekos neįsikėlė: '+e.message,8000));

/* ===== AI modelio pasirinkimas viršuje ===== */
const aiTitle=document.querySelector('.aititle');
function updateModelLabel(){if(aiTitle)aiTitle.innerHTML='AI: <span style="color:var(--a);font-size:.9em">'+(cfg.model||'pasirinkti')+'</span> ▾'}
function modelPicker(){
 const draw=q=>(cfg.models||[]).filter(m=>m.toLowerCase().includes(q.toLowerCase())).map(m=>`<div class="item" data-act="pick" data-id="${esc(m)}" style="cursor:pointer">${m===cfg.model?ic('check'):ic('ai')}<span class="t"><span class="tt">${esc(m)}</span></span></div>`).join('')||'<p style="padding:12px;color:var(--mu)">Nerasta</p>';
 openSheet(`<h3>Pasirinkite AI modelį</h3><input class="in" id="mq" placeholder="Ieškoti modelio..." style="margin-bottom:8px"><div id="mList">${draw('')}</div><div class="btns" style="margin-top:10px"><button class="btn p" data-act="refresh">🔄 Atnaujinti sąrašą</button></div>`,{
  pick:m=>{cfg.model=m;saveCfg();updateModelLabel();closeSheet();toast('Pasirinkta: '+m)},
  refresh:async()=>{if(!cfg.apiKey)return toast('Įveskite raktą');toast('Kraunama...',8000);
   try{cfg.models=await fetchModelList(cfg.apiKey);saveCfg();if($('mList'))$('mList').innerHTML=draw($('mq')?.value||'');toast('Rasta AI: '+cfg.models.length)}catch(e){toast('Klaida: '+e.message,5000)}}});
 setTimeout(()=>{$('mq')?.addEventListener('input',e=>{if($('mList'))$('mList').innerHTML=draw(e.target.value)})},50)}
if(aiTitle){aiTitle.style.cursor='pointer';aiTitle.onclick=modelPicker}

/* ===== AI modelių sąrašas ===== */
async function fetchModelList(key){const r=await fetch(AM_BASE+'/models',{headers:{Authorization:'Bearer '+key}});const d=await r.json().catch(()=>({}));
 if(!r.ok)throw new Error(d.error?.message||'HTTP '+r.status);
 const l=(d.data||d.models||[]).map(m=>m.id||m.name||m).filter(x=>typeof x==='string'&&x.length>1);if(!l.length)throw new Error('Sąrašas tuščias');return[...new Set(l)]}

/* ===== Nustatymai ===== */
function openSettings(){const has=!!cfg.apiKey;
 openSheet(`<h3>Nustatymai</h3>
<div class="card" style="padding:14px">
<b style="font-size:.82rem;color:var(--mu);text-transform:uppercase;letter-spacing:.05em">API raktas</b>
<div style="margin:8px 0;font-size:.9rem;display:flex;align-items:center;gap:8px">${has?'<span style="color:#1a9e5c;font-weight:600">🔒 Išsaugotas (…'+esc(cfg.apiKey.slice(-4))+')</span>':'<span style="color:var(--mu)">🔓 Neįvestas</span>'}</div>
<input class="in" id="kIn" type="password" autocomplete="off" placeholder="${has?'Naujas raktas, jei norite pakeisti':'Įklijuokite raktą iš anymodel.org'}">
<div class="btns" style="margin-top:8px">
<button class="btn p" data-act="key">💾 Išsaugoti ir gauti AI sąrašą</button>
${has?'<button class="btn d" data-act="delKey">Ištrinti</button>':''}</div></div>
<div class="card" style="padding:14px">
<b style="font-size:.82rem;color:var(--mu);text-transform:uppercase;letter-spacing:.05em">AI modelis</b>
<select class="in" id="mSel" style="margin-top:8px">${(cfg.models||[]).map(m=>`<option${m===cfg.model?' selected':''}>${esc(m)}</option>`).join('')}</select>
<div style="margin-top:8px">
<select class="in" id="epSel">${cfg.eps.map(x=>`<option value="${x.id}"${x.id===cfg.ep?' selected':''}>${esc(x.name)}</option>`).join('')}</select></div></div>
<div class="card" style="padding:14px">
<b style="font-size:.82rem;color:var(--mu);text-transform:uppercase;letter-spacing:.05em">Išvaizda</b>
<div class="seg" style="margin-top:8px">${[['light','☀️ Šviesi'],['dark','🌙 Tamsi'],['auto','🔄 Auto']].map(([k,n])=>`<button class="${cfg.theme===k?'on':''}" data-th="${k}">${n}</button>`).join('')}</div>
<div style="margin-top:12px;font-size:.85rem;color:var(--mu)">Teksto dydis: <span id="fsv">${cfg.fs}</span> px</div>
<input type="range" id="sfr" min="13" max="22" value="${cfg.fs}" style="width:100%;margin-top:4px;accent-color:var(--a)"></div>
<p style="text-align:center;color:var(--mu);font-size:.75rem;margin:16px 0 0;padding-top:12px;border-top:1px solid var(--ln)">Mano PDF · Versija ${APP_VER}</p>`,{
 key:async()=>{const v=($('kIn')?.value||'').trim()||cfg.apiKey;if(!v||v.length<8)return toast('Įklijuokite raktą');
  toast('Tikrinama...',8000);try{const l=await fetchModelList(v);cfg.apiKey=v;cfg.models=l;if(!l.includes(cfg.model))cfg.model=l[0];saveCfg();updateModelLabel();closeSheet();toast('✅ Raktas veikia. Rasta AI: '+l.length)}catch(e){toast('Raktas netinka: '+e.message,5000)}},
 delKey:()=>{if(confirm('Ištrinti raktą?')){cfg.apiKey='';saveCfg();openSettings()}}});
 setTimeout(()=>{
  $('mSel')?.addEventListener('change',e=>{cfg.model=e.target.value;saveCfg();updateModelLabel()});
  $('epSel')?.addEventListener('change',e=>{cfg.ep=e.target.value;saveCfg()});
  $('sfr')?.addEventListener('input',e=>{cfg.fs=+e.target.value;if($('fsv'))$('fsv').textContent=e.target.value;applyLook();saveCfg()});
  document.querySelectorAll('[data-th]').forEach(b=>b.addEventListener('click',()=>{cfg.theme=b.dataset.th;saveCfg();applyLook();document.querySelectorAll('[data-th]').forEach(x=>x.classList.toggle('on',x.dataset.th===cfg.theme))}))},50)}

/* ===== Šoninis meniu ===== */
function renderDrawer(){drawerEl.innerHTML=`<div class="dscroll">
<div style="padding:16px 12px 8px;display:flex;align-items:center;gap:10px">
<div style="width:40px;height:40px;border-radius:14px;background:var(--a);color:#fff;display:grid;place-items:center">${ic('pdf')}</div>
<b style="font-size:1.1rem">Mano PDF</b></div>
<div class="item" data-act="newDoc">${ic('newf')}<span class="t">Naujas dokumentas</span></div>
<div class="item" data-act="openDoc">${ic('open')}<span class="t">Atidaryti PDF</span></div>
<div class="item" data-act="tplDoc">${ic('tpl')}<span class="t">Iš šablono</span></div>
<div class="sec">Dokumentai (${docs.length})</div>
${docs.slice(0,30).map(d=>`<div class="item" data-act="loadDoc" data-id="${d.id}">${ic('pdf')}<span class="t"><span class="tt">${esc(d.title)}</span><small>${fmtD(d.updated||d.created)}</small></span></div>`).join('')||'<p style="padding:12px 16px;color:var(--mu);font-size:.9rem">Dokumentų dar nėra</p>'}
</div>
<div style="border-top:1px solid var(--ln);padding:8px">
<div class="item" data-act="settings">${ic('gear')}<span class="t">Raktas ir nustatymai</span></div></div>`}
drawerEl.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b)return;closeDrawer();
 ({newDoc:()=>{const t=prompt('Pavadinimas:','Naujas dokumentas');if(t?.trim())newDoc(t.trim())},
   openDoc:()=>setTimeout(()=>$('fPDF').click(),100),
   tplDoc:()=>setTimeout(openTemplates,100),
   loadDoc:()=>{const full=localStorage.getItem('pdf_doc_'+b.dataset.id);const d=full?JSON.parse(full):docs.find(x=>x.id===b.dataset.id);if(d){curDoc=d;if(!Array.isArray(curDoc.pages))curDoc.pages=[];curPage=0;undoStack=[];redoStack=[];showViewer()}},
   settings:()=>setTimeout(openSettings,100)})[b.dataset.act]?.()});

/* ===== PDF atidarymas ===== */
$('fPDF').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;
 toast('Atidaroma: '+f.name+'...',60000);
 try{await libsReady;if(!window.pdfjsLib)throw new Error('PDF.js biblioteka neįsikėlė. Patikrinkite internetą ir perkraukite.');
  const ab=await f.arrayBuffer();
  const pdf=await pdfjsLib.getDocument({data:new Uint8Array(ab)}).promise;
  toast('Skaitoma '+pdf.numPages+' psl...',60000);const pages=[];
  for(let i=1;i<=pdf.numPages;i++){
   const pg=await pdf.getPage(i);
   const vp0=pg.getViewport({scale:1});
   const scale=Math.min(W/vp0.width,H/vp0.height,2);
   const vp=pg.getViewport({scale});
   const cv=document.createElement('canvas');cv.width=Math.round(vp.width);cv.height=Math.round(vp.height);
   await pg.render({canvasContext:cv.getContext('2d'),viewport:vp}).promise;
   const txt=(await pg.getTextContent()).items.map(x=>x.str||'').join(' ').trim();
   pages.push({annotations:[{id:uid(),type:'img',src:cv.toDataURL('image/jpeg',.85),x:0,y:0,w:W,h:Math.round(vp.height*(W/vp.width))}],sourceText:txt.slice(0,500)})}
  curDoc={id:uid(),title:f.name.replace(/\.pdf$/i,''),created:Date.now(),updated:Date.now(),pages,source:'upload'};
  undoStack=[];redoStack=[];curPage=0;docs.unshift(curDoc);saveDocs();showViewer();toast('✅ Atidarytas ('+pages.length+' psl.)')}
 catch(err){toast('Klaida atidarant: '+err.message,8000)}};

/* ===== PDF išsaugojimas ===== */
function loadImg(src){return new Promise(r=>{const i=new Image();i.crossOrigin='anonymous';i.onload=()=>r(i);i.onerror=()=>r(null);i.src=src})}
async function pageToCanvas(pg){const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,W,H);
 for(const a of(pg.annotations||[])){
  if(a.type==='img'&&a.src){const im=await loadImg(a.src);if(im)x.drawImage(im,a.x,a.y,a.w||W,a.h||H)}
  else if(a.type==='txt'&&a.text){const fs=a.fontSize||20;x.font=fs+'px system-ui,sans-serif';x.fillStyle=a.color||'#000';String(a.text).split('\n').forEach((l,k)=>x.fillText(l,a.x,a.y+22+k*fs*1.35))}
  else if(a.type==='hl'){x.fillStyle='rgba(255,220,0,.4)';x.fillRect(a.x,a.y,a.w||200,a.h||30)}
  else if(a.type==='draw'&&a.points?.length>1){x.save();x.strokeStyle=a.color||'#e5484d';x.lineWidth=a.lineWidth||3;x.lineCap='round';x.lineJoin='round';x.beginPath();a.points.forEach((p,k)=>k?x.lineTo(p.x,p.y):x.moveTo(p.x,p.y));x.stroke();x.restore()}}
 return c}
async function buildPdf(){await libsReady;if(!window.jspdf?.jsPDF)throw new Error('jsPDF neįsikėlė. Patikrinkite internetą.');
 const doc=new jspdf.jsPDF({unit:'pt',format:'a4',compress:true});
 const pw=doc.internal.pageSize.getWidth(),ph=doc.internal.pageSize.getHeight();
 for(let i=0;i<curDoc.pages.length;i++){if(i)doc.addPage();const c=await pageToCanvas(curDoc.pages[i]);doc.addImage(c.toDataURL('image/jpeg',.9),'JPEG',0,0,pw,ph)}
 return doc}
const pdfName=()=>(curDoc?.title||'dokumentas').replace(/[\\/:*?"<>|]/g,'_')+'.pdf';
async function savePDF(){if(!curDoc)return toast('Nėra dokumento');toast('Kuriamas PDF...',20000);
 try{(await buildPdf()).save(pdfName());toast('✅ Išsaugota: '+pdfName())}catch(e){toast('Klaida: '+e.message,6000)}}
async function sharePDF(){if(!curDoc)return toast('Nėra dokumento');toast('Ruošiama...',20000);
 try{const blob=(await buildPdf()).output('blob');const file=new File([blob],pdfName(),{type:'application/pdf'});
  if(navigator.canShare?.({files:[file]}))await navigator.share({files:[file],title:curDoc.title});
  else{const u=URL.createObjectURL(blob);const a=document.createElement('a');a.href=u;a.download=pdfName();a.click();setTimeout(()=>URL.revokeObjectURL(u),2000);toast('✅ Failas atsisiųstas')}}
 catch(e){if(e.name!=='AbortError')toast('Klaida: '+e.message,5000)}}

/* ===== Paleidimas ===== */
updateModelLabel();
renderDrawer();
window.addEventListener('beforeunload',e=>{if(curDoc&&undoStack.length){e.preventDefault();e.returnValue=''}});
if(!cfg.apiKey)setTimeout(()=>toast('👋 Įveskite API raktą: ☰ → Nustatymai',5000),1000);
/* ===== pdf-core.js pabaiga ===== */
