'use strict';
/* Mano PDF: bibliotekos, raktas ir AI pasirinkimas. Veikia kartu su app.js */
const AM_BASE='https://anymodel.org/v1';

/* Langų išdėstymas: meniu ir apatiniai langai virš AI lango */
(()=>{const s=document.createElement('style');s.textContent='.scrim{z-index:31}.drawer{z-index:32}.sheet{z-index:33}.aititle{cursor:pointer}';document.head.appendChild(s)})();

/* ===== PDF bibliotekos ===== */
function loadScript(src){return new Promise((res,rej)=>{const s=document.createElement('script');s.src=src;s.onload=res;s.onerror=()=>rej(new Error(src));document.head.appendChild(s)})}
const libsReady=Promise.all([
 loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js').then(()=>{pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'}),
 loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js')
]).catch(()=>toast('Nepavyko įkelti PDF bibliotekų. Patikrinkite internetą.',5000));

/* ===== AI sąrašas iš anymodel.org ===== */
async function fetchModelList(key){const r=await fetch(AM_BASE+'/models',{headers:{Authorization:'Bearer '+key}});const d=await r.json().catch(()=>({}));
 if(!r.ok)throw new Error(d.error?.message||('HTTP '+r.status));
 const l=(d.data||d.models||[]).map(m=>m.id||m.name||m).filter(x=>typeof x==='string');if(!l.length)throw new Error('sąrašas tuščias');return[...new Set(l)]}

/* ===== Pasirinktas AI viršuje ===== */
const aiTitle=document.querySelector('.aititle');
function updateModelLabel(){aiTitle.innerHTML='AI: <span style="color:var(--a)">'+esc(cfg.model||'nepasirinktas')+' ▾</span>'}
function modelPicker(){const draw=q=>cfg.models.filter(m=>m.toLowerCase().includes(q)).map(m=>`<div class="item" data-act="pick" data-id="${esc(m)}">${ic(m===cfg.model?'check':'ai')}<span class="t"><span class="tt">${esc(m)}</span></span></div>`).join('')||'<p style="padding:12px;color:var(--mu)">Nerasta</p>';
 openSheet(`<h3>Pasirinkite AI</h3><input class="in" id="mq" placeholder="Ieškoti..." style="margin-bottom:8px"><div id="mList">${draw('')}</div><div class="btns"><button class="btn" data-act="refresh">Atnaujinti sąrašą</button></div>`,{
  pick:m=>{cfg.model=m;saveCfg();updateModelLabel();closeSheet();toast('Pasirinkta: '+m)},
  refresh:async()=>{if(!cfg.apiKey){closeSheet();return openSettings()}
   try{cfg.models=await fetchModelList(cfg.apiKey);saveCfg();$('mList').innerHTML=draw($('mq').value.toLowerCase());toast('Rasta AI: '+cfg.models.length)}catch(e){toast('Klaida: '+e.message)}}});
 $('mq').addEventListener('input',e=>{$('mList').innerHTML=draw(e.target.value.toLowerCase())})}
aiTitle.onclick=modelPicker;

/* ===== Raktas ir nustatymai ===== */
openSettings=function(){const has=!!cfg.apiKey;
 openSheet(`<h3>Raktas ir AI</h3>
<div class="card" style="padding:12px 14px">
<div style="font-size:.9rem;margin-bottom:8px">${has?'🔒 Raktas išsaugotas (…'+esc(cfg.apiKey.slice(-4))+')':'🔓 Raktas neįvestas'}</div>
<input class="in" id="kIn" type="password" autocomplete="off" placeholder="${has?'Naujas raktas, jei norite pakeisti':'Įklijuokite raktą iš anymodel.org'}">
<div class="btns"><button class="btn p" data-act="key">Išsaugoti ir gauti AI sąrašą</button></div></div>
<div class="card" style="padding:12px 14px">
<div style="font-size:.85rem;color:var(--mu);margin-bottom:6px">Kurį AI naudoti</div>
<select class="in" id="mSel">${cfg.models.map(m=>`<option${m===cfg.model?' selected':''}>${esc(m)}</option>`).join('')}</select></div>
<div class="card" style="padding:12px 14px">
<div style="font-size:.85rem;color:var(--mu);margin-bottom:6px">Tema</div>
<div class="seg">${[['light','Šviesi'],['dark','Tamsi'],['auto','Kaip telefone']].map(([k,n])=>`<button class="${cfg.theme===k?'on':''}" data-act="theme" data-id="${k}">${n}</button>`).join('')}</div>
<div style="font-size:.85rem;color:var(--mu);margin:12px 0 6px">Teksto dydis: <span id="fsv">${cfg.fs}</span> px</div>
<input type="range" id="sfr" min="13" max="22" value="${cfg.fs}" style="width:100%;accent-color:var(--a)"></div>
${has?'<button class="btn d w" data-act="delKey">Ištrinti raktą</button>':''}`,{
 key:async()=>{const v=$('kIn').value.trim()||cfg.apiKey;if(!v||v.length<8)return toast('Įklijuokite raktą');toast('Tikrinama...',10000);
  try{const l=await fetchModelList(v);cfg.apiKey=v;cfg.models=l;if(!l.includes(cfg.model))cfg.model=l[0];saveCfg();updateModelLabel();toast('Raktas veikia. Rasta AI: '+l.length);openSettings()}
  catch(e){toast('Raktas netinka arba nėra ryšio: '+e.message,5000)}},
 theme:k=>{cfg.theme=k;saveCfg();applyLook();openSettings()},
 delKey:()=>{if(confirm('Ištrinti raktą?')){cfg.apiKey='';saveCfg();openSettings()}}});
 $('mSel').addEventListener('change',e=>{cfg.model=e.target.value;saveCfg();updateModelLabel()});
 $('sfr').addEventListener('input',e=>{cfg.fs=+e.target.value;$('fsv').textContent=e.target.value;applyLook();saveCfg()})};

/* ===== Šoninis meniu (be pasikartojančių paspaudimų) ===== */
renderDrawer=function(){drawerEl.innerHTML=`<div class="dscroll">
<div style="padding:16px 12px 8px;display:flex;align-items:center;gap:10px"><div style="width:40px;height:40px;border-radius:14px;background:var(--a);color:#fff;display:grid;place-items:center">${ic('pdf')}</div><b style="font-size:1.1rem">Mano PDF</b></div>
<div class="item" data-act="newDoc">${ic('newf')}<span class="t">Naujas dokumentas</span></div>
<div class="item" data-act="openDoc">${ic('open')}<span class="t">Atidaryti PDF</span></div>
<div class="item" data-act="tplDoc">${ic('tpl')}<span class="t">Iš šablono</span></div>
<div class="sec">Dokumentai</div>
${docs.slice(0,20).map(d=>`<div class="item" data-act="loadDoc" data-id="${d.id}">${ic('pdf')}<span class="t"><span class="tt">${esc(d.title)}</span><small>${fmtD(d.updated)}</small></span></div>`).join('')||'<p style="padding:12px;color:var(--mu);font-size:.9rem">Dokumentų dar nėra</p>'}
</div>
<div style="border-top:1px solid var(--ln);padding:8px"><div class="item" data-act="settings">${ic('gear')}<span class="t">Raktas ir nustatymai</span></div></div>`};
drawerEl.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b)return;closeDrawer();
 ({newDoc:()=>{const t=prompt('Dokumento pavadinimas:','Naujas dokumentas');if(t)newDoc(t)},
  openDoc:()=>$('fPDF').click(),tplDoc:()=>openTemplates(),
  loadDoc:()=>{const d=docs.find(x=>x.id===b.dataset.id);if(d){curDoc=d;curPage=0;undoStack=[];redoStack=[];showViewer()}},
  settings:()=>openSettings()})[b.dataset.act]?.()});

/* ===== PDF išsaugojimas su lietuviškomis raidėmis ===== */
function loadImg(src){return new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>r(null);i.src=src})}
async function pageCanvas(pg){const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,W,H);
 for(const a of pg.annotations||[]){
  if(a.type==='img'&&a.src){const i=await loadImg(a.src);if(i)x.drawImage(i,a.x,a.y,a.w||200,a.h||150)}
  else if(a.type==='txt'){const fs=a.fontSize||18;x.font=fs+'px system-ui,sans-serif';x.fillStyle=a.color||'#000';String(a.text||'').split('\n').forEach((l,k)=>x.fillText(l,a.x,a.y+20+k*fs*1.3))}
  else if(a.type==='hl'){x.fillStyle='rgba(255,220,0,.4)';x.fillRect(a.x,a.y,a.w||100,a.h||24)}}
 return c}
async function buildPdf(){await libsReady;if(!window.jspdf)throw new Error('PDF biblioteka neįsikėlė');
 const doc=new jspdf.jsPDF({unit:'pt',format:'a4'}),pw=doc.internal.pageSize.getWidth(),ph=doc.internal.pageSize.getHeight();
 for(let i=0;i<curDoc.pages.length;i++){if(i)doc.addPage();const c=await pageCanvas(curDoc.pages[i]);doc.addImage(c.toDataURL('image/jpeg',.92),'JPEG',0,0,pw,ph)}
 return doc}
const pdfName=()=>(curDoc.title||'dokumentas').replace(/[\\/:*?"<>|]/g,'_')+'.pdf';
$('tSave').onclick=async()=>{if(!curDoc)return toast('Nėra dokumento');toast('Kuriamas PDF...',10000);
 try{(await buildPdf()).save(pdfName());toast('Išsaugota: '+pdfName())}catch(e){toast('Klaida: '+e.message)}};
$('tShare').onclick=async()=>{if(!curDoc)return toast('Nėra dokumento');toast('Ruošiama...',10000);
 try{const blob=(await buildPdf()).output('blob'),file=new File([blob],pdfName(),{type:'application/pdf'});
  if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title:curDoc.title});toast('Paruošta')}
  else{const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=pdfName();a.click();URL.revokeObjectURL(u);toast('Failas atsisiųstas')}}
 catch(e){if(e.name!=='AbortError')toast('Klaida: '+e.message)}};

/* ===== Paleidimas ===== */
updateModelLabel();
if(!cfg.apiKey)setTimeout(()=>{toast('Įklijuokite raktą iš anymodel.org');openSettings()},600);
/* ===== pdf-core.js pabaiga ===== */
