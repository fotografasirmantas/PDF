'use strict';
/* Mano PDF: pilnas redagavimas (PDF tekstas, elementai, piešimas, AI komandos). Įkelti po app.js ir pdf-core.js */
(()=>{
const FONT='Roboto, Arial, sans-serif';
const BG=new Map();
const OV=new Set(['txt','hl','img','rect']);
const pagesEl=$('pages');
let sel=null,fixMode=false,lastAtt=[],penColor='#e5484d',drag=null,io=null,saveT=0,rzT=0;
const ph=pg=>(pg&&pg.h)||H;
P.fix='<path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3z"/><path d="M13.5 6.5l3 3"/><path d="M14 20h6"/>';

/* ===== Stiliai ===== */
(()=>{const s=document.createElement('style');s.textContent=`
.page-wrap{position:relative;background:#fff;overflow:visible;flex:none}
.page-wrap>canvas.pc{position:absolute;inset:0;width:100%;height:100%;display:block}
.pages.tool .page-wrap{touch-action:none}
.ov{position:absolute;box-sizing:border-box;touch-action:none;cursor:move;z-index:2}
.ov.sel{outline:2px solid var(--a);outline-offset:1px}
.ov.txt{white-space:pre-wrap;overflow-wrap:break-word;line-height:1.35;font-family:${FONT}}
.ov.txt:not(.sel){outline:1px dashed rgba(8,102,255,.35)}
.ov.img img{width:100%;height:100%;display:block;pointer-events:none}
.ov.hl{background:rgba(255,220,0,.4)}
.ov .hd{display:none;position:absolute;width:20px;height:20px;border-radius:50%;background:var(--a);border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4);z-index:3}
.ov.sel .hd{display:block}
.hd.nw{left:-11px;top:-11px}.hd.ne{right:-11px;top:-11px}.hd.sw{left:-11px;bottom:-11px}.hd.se{right:-11px;bottom:-11px}
.lnb{position:absolute;z-index:2;border:1.5px dashed var(--a);background:rgba(8,102,255,.07);border-radius:3px}
.lnb.ed{border-color:#1a9e5c;background:rgba(26,158,92,.14)}
.etool{padding:8px 2px!important;min-width:0!important;flex:1}
#selBar{position:fixed;left:8px;right:8px;bottom:calc(78px + env(safe-area-inset-bottom));z-index:12;display:flex;gap:4px;justify-content:center;flex-wrap:wrap;background:var(--toolbar);border-radius:16px;padding:6px;box-shadow:0 4px 18px rgba(0,0,0,.35)}
#selBar button{color:#fff;padding:9px 12px;border-radius:10px;font-size:.9rem;background:rgba(255,255,255,.08)}
#selBar button:active{background:rgba(255,255,255,.22)}
.aichips{display:flex;gap:6px;padding:6px 16px;border-bottom:1px solid var(--ln);flex-wrap:wrap}
.chip2{border:1px solid var(--ln);border-radius:99px;padding:5px 11px;font-size:.8rem}
.chip2.on{background:var(--a);border-color:var(--a);color:#fff}
.attchip{display:inline-flex;align-items:center;gap:6px;background:var(--bg2);border:1px solid var(--ln);border-radius:12px;padding:6px 10px;font-size:.8rem;flex:none}
.toast{white-space:normal!important}
`;document.head.appendChild(s)})();

/* ===== Saugojimas (IndexedDB) ===== */
const dbP=new Promise((res,rej)=>{const r=indexedDB.open('manopdf',1);r.onupgradeneeded=()=>r.result.createObjectStore('docs');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});
const idb=(mode,fn)=>dbP.then(db=>new Promise((res,rej)=>{const t=db.transaction('docs',mode),r=fn(t.objectStore('docs'));t.oncomplete=()=>res(r&&r.result);t.onerror=()=>rej(t.error)}));
function putDoc(d){const bgs={};d.pages.forEach(p=>{if(p.bg&&BG.has(p.bg.id))bgs[p.bg.id]=BG.get(p.bg.id)});return idb('readwrite',s=>s.put({...d,bgs},d.id))}
const getDoc=id=>idb('readonly',s=>s.get(id));
const delDocDB=id=>idb('readwrite',s=>s.delete(id));
saveDocs=function(){
 try{localStorage.setItem('pdf_docs_meta',JSON.stringify(docs.map(d=>({id:d.id,title:d.title,created:d.created,updated:d.updated}))))}catch{}
 clearTimeout(saveT);const d=curDoc;if(d)saveT=setTimeout(()=>putDoc(d).catch(e=>toast('Nepavyko išsaugoti: '+e.message)),600)};
function migrate(d){if(!d||!Array.isArray(d.pages))return d;
 if(d.bgs){for(const k in d.bgs)BG.set(k,d.bgs[k]);delete d.bgs}
 d.pages.forEach(p=>{p.annotations=p.annotations||[];
  if(!p.bg){const i=p.annotations.findIndex(a=>a.type==='img'&&a.x===0&&a.y===0&&a.w===W);
   if(i>=0&&d.source==='upload'){const a=p.annotations.splice(i,1)[0],id=uid();BG.set(id,a.src);p.bg={id};p.h=a.h||H}}});
 return d}
async function openStored(id){let d=docs.find(x=>x.id===id);
 if(!d||!Array.isArray(d.pages)||!d.pages.length){d=null;try{d=await getDoc(id)}catch{}
  if(!d){try{d=JSON.parse(localStorage.getItem('pdf_doc_'+id)||'null')}catch{}}}
 if(!d||!Array.isArray(d.pages)||!d.pages.length)return toast('Šio dokumento turinio nepavyko rasti');
 migrate(d);const i=docs.findIndex(x=>x.id===id);if(i>=0)docs[i]=d;else docs.unshift(d);
 curDoc=d;curPage=0;undoStack=[];redoStack=[];sel=null;fixMode=false;activeTool='';showViewer()}
function docMenu(id){const d=docs.find(x=>x.id===id);if(!d)return;
 openSheet(`<h3>${esc(d.title)}</h3><div class="item" data-act="ren">✏️<span class="t">Pervadinti</span></div><div class="item" data-act="del" style="color:var(--red)">🗑<span class="t">Ištrinti</span></div>`,{
  ren:()=>{const t=prompt('Naujas pavadinimas',d.title);if(t&&t.trim()){d.title=t.trim().slice(0,80);
    if(curDoc&&curDoc.id===id){curDoc.title=d.title;$('docTitle').textContent=d.title}
    else getDoc(id).then(f=>{if(f){f.title=d.title;idb('readwrite',s=>s.put(f,id))}}).catch(()=>{});saveDocs()}closeSheet()},
  del:()=>{if(!confirm('Ištrinti „'+d.title+'“?'))return;clearTimeout(saveT);docs.splice(docs.indexOf(d),1);delDocDB(id).catch(()=>{});
   try{localStorage.removeItem('pdf_doc_'+id)}catch{}if(curDoc&&curDoc.id===id)hideViewer();saveDocs();closeSheet();toast('Ištrinta')}})}

/* ===== Šoninis meniu ===== */
renderDrawer=function(){drawerEl.innerHTML=`<div class="dscroll">
<div style="padding:16px 12px 8px;display:flex;align-items:center;gap:10px"><div style="width:40px;height:40px;border-radius:14px;background:var(--a);color:#fff;display:grid;place-items:center">${ic('pdf')}</div><b style="font-size:1.1rem">Mano PDF</b></div>
<div class="item" data-act="newDoc">${ic('newf')}<span class="t">Naujas dokumentas</span></div>
<div class="item" data-act="openDoc">${ic('open')}<span class="t">Atidaryti PDF</span></div>
<div class="item" data-act="tplDoc">${ic('tpl')}<span class="t">Iš šablono</span></div>
<div class="sec">Dokumentai (${docs.length})</div>
${docs.map(d=>`<div class="item" data-act="loadDoc2" data-id="${esc(d.id)}">${ic('pdf')}<span class="t"><span class="tt">${esc(d.title)}</span><small>${fmtD(d.updated||d.created)}</small></span><button class="ib" data-act="docMore" data-id="${esc(d.id)}" aria-label="Daugiau" style="width:34px;height:34px">${ic('more')}</button></div>`).join('')||'<p style="padding:12px 16px;color:var(--mu);font-size:.9rem">Dokumentų dar nėra</p>'}
</div><div style="border-top:1px solid var(--ln);padding:8px"><div class="item" data-act="settings">${ic('gear')}<span class="t">Raktas ir nustatymai</span></div></div>`};
drawerEl.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b)return;
 if(b.dataset.act==='loadDoc2')openStored(b.dataset.id);
 if(b.dataset.act==='docMore')setTimeout(()=>docMenu(b.dataset.id),50)});

/* ===== PDF atidarymas su teksto eilutėmis ===== */
function toLines(items,vp){const raw=[];
 for(const it of items){if(!it.str||!it.str.trim()||!it.transform)continue;
  const t=pdfjsLib.Util.transform(vp.transform,it.transform),fs=Math.hypot(t[2],t[3])||10;
  raw.push({x:t[4],b:t[5],w:(it.width||0)*vp.scale||it.str.length*fs*.5,fs,str:it.str})}
 raw.sort((a,b)=>a.b-b.b||a.x-b.x);const L=[];
 for(const r of raw){const l=L.find(l=>Math.abs(l.b-r.b)<Math.max(l.fs,r.fs)*.45&&r.x>l.x+l.w-r.fs&&r.x-(l.x+l.w)<Math.max(l.fs,r.fs)*2.5);
  if(l){const gap=r.x-(l.x+l.w);l.str+=(gap>l.fs*.12&&!/\s$/.test(l.str)&&!/^\s/.test(r.str)?' ':'')+r.str;l.w=Math.max(l.w,r.x+r.w-l.x);l.fs=Math.max(l.fs,r.fs)}
  else L.push({...r})}
 L.sort((a,b)=>a.b-b.b||a.x-b.x);
 return L.map((l,i)=>{const s=l.str.trim().replace(/\s+/g,' ');return{id:i+1,x:+l.x.toFixed(1),y:+(l.b-l.fs*.85).toFixed(1),w:Math.max(l.w,l.fs),h:+(l.fs*1.15).toFixed(1),fs:+l.fs.toFixed(1),orig:s,text:s}})}
$('fPDF').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;
 try{toast('Atidaroma…',60000);await libsReady;if(!window.pdfjsLib)throw new Error('PDF biblioteka neįsikėlė. Patikrinkite internetą.');
  const pdf=await pdfjsLib.getDocument({data:new Uint8Array(await f.arrayBuffer())}).promise;const pages=[];let n=0;
  for(let i=1;i<=pdf.numPages;i++){toast(`Skaitomas ${i} iš ${pdf.numPages} puslapio…`,60000);
   const pg=await pdf.getPage(i),v0=pg.getViewport({scale:1}),s=W/v0.width,vT=pg.getViewport({scale:s}),vI=pg.getViewport({scale:s*2});
   const c=document.createElement('canvas');c.width=Math.round(vI.width);c.height=Math.round(vI.height);
   const cx=c.getContext('2d');cx.fillStyle='#fff';cx.fillRect(0,0,c.width,c.height);
   await pg.render({canvasContext:cx,viewport:vI}).promise;const id=uid();BG.set(id,c.toDataURL('image/jpeg',.85));c.width=c.height=0;
   const lines=toLines((await pg.getTextContent()).items,vT);n+=lines.length;
   pages.push({h:Math.round(vT.height),bg:{id},lines,annotations:[]})}
  curDoc={id:uid(),title:f.name.replace(/\.pdf$/i,''),created:Date.now(),updated:Date.now(),pages,source:'upload',nSeq:0};
  undoStack=[];redoStack=[];curPage=0;sel=null;fixMode=false;activeTool='';docs.unshift(curDoc);saveDocs();showViewer();
  toast(n?`✅ Atidaryta (${pages.length} psl.). Tekstą taisykite mygtuku „Taisyti“ arba per AI.`:'✅ Atidaryta. Teksto sluoksnio nėra (nuskenuota), taisykite per AI.',5000)}
 catch(err){toast('Nepavyko atidaryti: '+err.message,8000)}};

/* ===== Piešimas ant drobės ===== */
function wrapText(x,t,
/* ===== pdf-edit.js pabaiga ===== */
