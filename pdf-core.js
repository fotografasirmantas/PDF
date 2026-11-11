'use strict';
/* Mano PDF: bibliotekos, raktas, AI pasirinkimas */
const APP_VER='v2';
const AM_BASE='https://anymodel.org/v1';

/* ===== CSS pataisymai ===== */
(()=>{const s=document.createElement('style');s.textContent=`
.ann-resize{position:absolute;width:14px;height:14px;border-radius:50%;background:var(--a);border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.3);z-index:5}
.ann-resize.nw{top:-7px;left:-7px;cursor:nw-resize}
.ann-resize.ne{top:-7px;right:-7px;cursor:ne-resize}
.ann-resize.sw{bottom:-7px;left:-7px;cursor:sw-resize}
.ann-resize.se{bottom:-7px;right:-7px;cursor:se-resize}
.ann.txt{overflow:hidden;border:1.5px solid var(--a);border-radius:6px;background:rgba(255,255,255,.92);padding:4px 8px;line-height:1.4;word-break:break-word;position:absolute;cursor:move;box-sizing:border-box}
.ann.hl{position:absolute;cursor:move;background:rgba(255,220,0,.4);border-radius:3px}
.draw-layer{position:absolute;inset:0;pointer-events:none;z-index:2}
.page-wrap{position:relative;overflow:visible}
.etool{cursor:pointer;border:0}
.etool.on{background:rgba(255,255,255,.18)!important;color:#fff}
#bPres,#bPages{color:var(--toolbartx)}
.aifoot{display:flex;flex-direction:column}
.aibox{display:flex;align-items:flex-end;gap:6px;background:var(--bg2);border:1px solid var(--ln);border-radius:24px;padding:6px 6px 6px 14px}
.aibtn{display:inline-flex;align-items:center;gap:6px;background:var(--a);color:#fff;border:0;border-radius:10px;padding:7px 13px;font:inherit;font-size:.88rem;cursor:pointer;margin-top:8px}
#aiAttBar{display:none;gap:8px;overflow-x:auto;padding:4px 14px 8px;flex-wrap:nowrap}
.scrim{z-index:31}.drawer{z-index:32}.sheet{z-index:33}
.top .ib:nth-child(2),.top .ib:nth-child(3){display:none}
`;document.head.appendChild(s)})();

/* ===== PDF bibliotekos ===== */
function loadScript(src){return new Promise((res,rej)=>{const s=document.createElement('script');s.src=src;s.onload=res;s.onerror=()=>rej(new Error(src));document.head.appendChild(s)})}
const libsReady=Promise.all([
 loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js').then(()=>{pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'}),
 loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js')
]).catch(()=>toast('PDF bibliotekos neįsikėlė. Patikrinkite internetą.',6000));

/* ===== AI sąrašas ===== */
async function fetchModelList(key){const r=await fetch(AM_BASE+'/models',{headers:{Authorization:'Bearer '+key}});const d=await r.json().catch(()=>({}));
 if(!r.ok)throw new Error(d.error?.message||('HTTP '+r.status));
 const l=(d.data||d.models||[]).map(m=>m.id||m.name||m).filter(x=>typeof x==='string');if(!l.length)throw new Error('Sąrašas tuščias');return[...new Set(l)]}

/* ===== AI modelio pasirinkimas ===== */
const aiTitle=document.querySelector('.aititle');
function updateModelLabel(){if(aiTitle)aiTitle.innerHTML='AI: <span style="color:var(--a)">'+(cfg.model||'pasirinkti')+'</span> ▾'}
function modelPicker(){const draw=q=>cfg.models.filter(m=>m.toLowerCase().includes(q.toLowerCase())).map(m=>`<div class="item" data-act="pick" data-id="${esc(m)}">${m===cfg.model?'✅ ':''}<span class="t"><span class="tt">${esc(m)}</span></span></div>`).join('')||'<p style="padding:12px;color:var(--mu)">Nerasta</p>';
 openSheet(`<h3>Pasirinkite AI</h3><input class="in" id="mq" placeholder="Ieškoti..."><div id="mList" style="margin-top:8px">${draw('')}</div><button class="btn w" data-act="refresh" style="margin-top:8px">🔄 Atnaujinti sąrašą</button>`,{
  pick:m=>{cfg.model=m;saveCfg();updateModelLabel();closeSheet();toast('Pasirinkta: '+m)},
  refresh:async()=>{if(!cfg.apiKey)return toast('Įveskite raktą');toast('Kraunama...',5000);
   try{cfg.models=await fetchModelList(cfg.apiKey);saveCfg();if($('mList'))$('mList').innerHTML=draw($('mq').value||'');toast('Rasta: '+cfg.models.length+' AI')}catch(e){toast('Klaida: '+e.message)}}});
 $('mq').addEventListener('input',e=>{if($('mList'))$('mList').innerHTML=draw(e.target.value)})}
if(aiTitle)aiTitle.onclick=modelPicker;

/* ===== Nustatymai ===== */
openSettings=function(){const has=!!cfg.apiKey;
 openSheet(`<h3>Nustatymai</h3>
<div class="card" style="padding:12px 14px">
<b style="font-size:.85rem;color:var(--mu)">API RAKTAS</b>
<div style="padding:8px 0;font-size:.9rem">${has?'🔒 Išsaugotas (…'+esc(cfg.apiKey.slice(-4))+')':'🔓 Neįvestas'}</div>
<input class="in" id="kIn" type="password" autocomplete="off" placeholder="${has?'Naujas raktas':'Įklijuokite raktą iš anymodel.org'}">
<div class="btns" style="margin-top:8px"><button class="btn p" data-act="key">Išsaugoti ir gauti AI sąrašą</button>${has?'<button class="btn d" data-act="delKey">Ištrinti</button>':''}</div></div>
<div class="card" style="padding:12px 14px"><b style="font-size:.85rem;color:var(--mu)">AI MODELIS</b>
<select class="in" id="mSel" style="margin-top:8px">${cfg.models.map(m=>`<option${m===cfg.model?' selected':''}>${esc(m)}</option>`).join('')}</select></div>
<div class="card" style="padding:12px 14px"><b style="font-size:.85rem;color:var(--mu)">IŠVAIZDA</b>
<div class="seg" style="margin-top:8px">${[['light','Šviesi'],['dark','Tamsi'],['auto','Auto']].map(([k,n])=>`<button class="${cfg.theme===k?'on':''}" data-th="${k}">${n}</button>`).join('')}</div>
<div style="margin-top:12px;font-size:.85rem;color:var(--mu)">Teksto dydis: <span id="fsv">${cfg.fs}</span> px</div>
<input type="range" id="sfr" min="13" max="22" value="${cfg.fs}" style="width:100%;margin-top:4px;accent-color:var(--a)"></div>
<p style="text-align:center;color:var(--mu);font-size:.75rem;margin:16px 0 0;padding:12px 0 0;border-top:1px solid var(--ln)">Mano PDF · Versija ${APP_VER}</p>`,{
 key:async()=>{const v=$('kIn').value.trim()||cfg.apiKey;if(!v||v.length<8)return toast('Įklijuokite raktą');toast('Tikrinama...',8000);
  try{const l=await fetchModelList(v);cfg.apiKey=v;cfg.models=l;if(!l.includes(cfg.model))cfg.model=l[0];saveCfg();updateModelLabel();closeSheet();toast('Raktas veikia. Rasta AI: '+l.length)}catch(e){toast('Raktas netinka: '+e.message,5000)}},
 delKey:()=>{if(confirm('Ištrinti raktą?')){cfg.apiKey='';saveCfg();openSettings()}},
 theme:k=>{cfg.theme=k;saveCfg();applyLook();document.querySelectorAll('[data-th]').forEach(x=>x.classList.toggle('on',x.dataset.th===k))}});
 $('mSel')?.addEventListener('change',e=>{cfg.model=e.target.value;saveCfg();updateModelLabel()});
 $('sfr')?.addEventListener('input',e=>{cfg.fs=+e.target.value;$('fsv').textContent=e.target.value;applyLook();saveCfg()});
 document.querySelectorAll('[data-th]').forEach(b=>b.addEventListener('click',()=>openSettings._H?.theme(b.dataset.th)));
 openSettings._H={theme:k=>{cfg.theme=k;saveCfg();applyLook();openSettings()}}};

/* ===== Šoninis meniu ===== */
function renderDrawer(){drawerEl.innerHTML=`<div class="dscroll">
<div style="padding:16px 12px 8px;display:flex;align-items:center;gap:10px"><div style="width:40px;height:40px;border-radius:14px;background:var(--a);color:#fff;display:grid;place-items:center">${ic('pdf')}</div><b style="font-size:1.1rem">Mano PDF</b></div>
<div class="item" data-act="newDoc">${ic('newf')}<span class="t">Naujas dokumentas</span></div>
<div class="item" data-act="openDoc">${ic('open')}<span class="t">Atidaryti PDF</span></div>
<div class="item" data-act="tplDoc">${ic('tpl')}<span class="t">Iš šablono</span></div>
<div class="sec">Dokumentai (${docs.length})</div>
${docs.slice(0,30).map(d=>`<div class="item" data-act="loadDoc" data-id="${d.id}">${ic('pdf')}<span class="t"><span class="tt">${esc(d.title)}</span><small>${fmtD(d.updated)}</small></span></div>`).join('')||'<p style="padding:12px;color:var(--mu);font-size:.9rem">Dokumentų dar nėra</p>'}
</div>
<div style="border-top:1px solid var(--ln);padding:8px"><div class="item" data-act="settings">⚙️<span class="t" style="margin-left:12px">Raktas ir nustatymai</span></div></div>`}
drawerEl.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b)return;closeDrawer();
 const A={newDoc:()=>{const t=prompt('Pavadinimas:','Naujas dokumentas');if(t)newDoc(t)},
  openDoc:()=>$('fPDF').click(),tplDoc:()=>openTemplates(),
  loadDoc:()=>{const d=docs.find(x=>x.id===b.dataset.id);if(d){curDoc=d;curPage=0;undoStack=[];redoStack=[];showViewer()}},
  settings:()=>openSettings()};
 A[b.dataset.act]?.()});

/* ===== PDF atidarymas ===== */
$('fPDF').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;
 toast('Atidaroma: '+f.name+'...',30000);
 try{await libsReady;if(!window.pdfjsLib)throw new Error('PDF.js biblioteka neįsikėlė');
  const ab=await f.arrayBuffer();
  const pdf=await pdfjsLib.getDocument({data:ab}).promise;
  toast('Skaitoma '+pdf.numPages+' puslapiai...',30000);const pages=[];
  for(let i=1;i<=pdf.numPages;i++){const pg=await pdf.getPage(i);
   const vp=pg.getViewport({scale:1});const scale=W/vp.width;const vp2=pg.getViewport({scale});
   const cv=document.createElement('canvas');cv.width=Math.round(vp2.width);cv.height=Math.round(vp2.height);
   await pg.render({canvasContext:cv.getContext('2d'),viewport:vp2}).promise;
   const txt=(await pg.getTextContent()).items.map(x=>x.str).join(' ');
   pages.push({annotations:[{id:uid(),type:'img',src:cv.toDataURL('image/jpeg',.88),x:0,y:0,w:W,h:cv.height}],sourceText:txt})}
  curDoc={id:uid(),title:f.name.replace(/\.pdf$/i,''),created:Date.now(),updated:Date.now(),pages,source:'upload'};
  undoStack=[];redoStack=[];curPage=0;docs.unshift(curDoc);saveDocs();showViewer();toast('Atidarytas ✅ ('+pages.length+' psl.)')}
 catch(err){toast('Klaida: '+err.message,6000)}};

/* ===== PDF išsaugojimas ===== */
function loadImg(src){return new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>r(null);i.crossOrigin='anonymous';i.src=src})}
async function pageCanvas(pg){const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,W,H);
 for(const a of pg.annotations||[]){
  if(a.type==='img'&&a.src){const im=await loadImg(a.src);if(im)x.drawImage(im,a.x,a.y,a.w||200,a.h||150)}
  else if(a.type==='txt'){const fs=a.fontSize||18;x.font=fs+'px system-ui,sans-serif';x.fillStyle=a.color||'#000';String(a.text||'').split('\n').forEach((l,k)=>x.fillText(l,a.x,a.y+20+k*fs*1.3))}
  else if(a.type==='hl'){x.fillStyle='rgba(255,220,0,.4)';x.fillRect(a.x,a.y,a.w||100,a.h||24)}
  else if(a.type==='draw'&&a.points?.length){x.save();x.strokeStyle=a.color||'#e5484d';x.lineWidth=a.width||3;x.lineCap='round';x.lineJoin='round';x.beginPath();a.points.forEach((p,i)=>i?x.lineTo(p.x,p.y):x.moveTo(p.x,p.y));x.stroke();x.restore()}}
 return c}
async function buildPdf(){await libsReady;if(!window.jspdf)throw new Error('jsPDF biblioteka neįsikėlė');
 const doc=new jspdf.jsPDF({unit:'pt',format:'a4'}),pw=doc.internal.pageSize.getWidth(),ph=doc.internal.pageSize.getHeight();
 for(let i=0;i<curDoc.pages.length;i++){if(i)doc.addPage();const c=await pageCanvas(curDoc.pages[i]);doc.addImage(c.toDataURL('image/jpeg',.92),'JPEG',0,0,pw,ph)}
 return doc}
const pdfName=()=>(curDoc?.title||'dokumentas').replace(/[\\/:*?"<>|]/g,'_')+'.pdf';
$('tSave').onclick=async()=>{if(!curDoc)return toast('Nėra dokumento');toast('Kuriamas PDF...',15000);
 try{(await buildPdf()).save(pdfName());toast('Išsaugota: '+pdfName())}catch(e){toast('Klaida: '+e.message)}};
$('tShare').onclick=async()=>{if(!curDoc)return toast('Nėra dokumento');toast('Ruošiama...',15000);
 try{const blob=(await buildPdf()).output('blob'),file=new File([blob],pdfName(),{type:'application/pdf'});
  if(navigator.canShare?.({files:[file]})){await navigator.share({files:[file],title:curDoc.title})}
  else{const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=pdfName();a.click();URL.revokeObjectURL(u);toast('Failas atsisiųstas')}}
 catch(e){if(e.name!=='AbortError')toast('Klaida: '+e.message)}};

/* ===== Paleidimas ===== */
updateModelLabel();
if(!cfg.apiKey)setTimeout(()=>{toast('👋 Įveskite API raktą: ⚙️ Nustatymai',5000)},1000);
/* ===== pdf-core.js pabaiga ===== */
