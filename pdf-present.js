'use strict';
/* Mano PDF: prezentacijos, eksportas, importas. Veikia su app.js */

/* ===== Prezentacijos rodymas ===== */
let presMode=false,presIdx=0;
(()=>{const btn=document.createElement('button');btn.id='bPres';btn.className='ib';btn.setAttribute('aria-label','Prezentacija');btn.innerHTML=ic('share');$('tShare').before(btn);btn.onclick=startPres})();
function startPres(){if(!curDoc||curDoc.pages.length<1)return toast('Nėra dokumento');
 presMode=true;presIdx=curPage;
 const ov=document.createElement('div');ov.id='presOv';ov.style.cssText='position:fixed;inset:0;z-index:50;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center';
 const cv=document.createElement('canvas');cv.id='presCv';cv.style.cssText='max-width:100vw;max-height:100vh;display:block';
 const bar=document.createElement('div');bar.style.cssText='position:fixed;bottom:0;left:0;right:0;display:flex;justify-content:center;gap:16px;padding:16px;background:rgba(0,0,0,.5)';
 const mk=(t,fn)=>{const b=document.createElement('button');b.textContent=t;b.style.cssText='color:#fff;background:rgba(255,255,255,.15);border:0;border-radius:10px;padding:10px 20px;font-size:1rem;cursor:pointer';b.onclick=fn;return b};
 bar.append(mk('◀',()=>{presIdx=Math.max(0,presIdx-1);drawPres(cv)}),mk('▶',()=>{presIdx=Math.min(curDoc.pages.length-1,presIdx+1);drawPres(cv)}),mk('✕',stopPres));
 ov.append(cv,bar);document.body.appendChild(ov);
 document.addEventListener('keydown',presKey);drawPres(cv)}
function drawPres(cv){if(!curDoc)return;const pg=curDoc.pages[presIdx];const sc=Math.min(innerWidth/W,innerHeight/H);cv.width=W*sc;cv.height=H*sc;const ctx=cv.getContext('2d');ctx.scale(sc,sc);ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);
 (pg.annotations||[]).forEach(a=>{if(a.type==='txt'){ctx.save();ctx.font=(a.fontSize||18)+'px system-ui,sans-serif';ctx.fillStyle=a.color||'#000';String(a.text||'').split('\n').forEach((l,k)=>ctx.fillText(l,a.x,a.y+20+k*(a.fontSize||18)*1.3));ctx.restore()}
  else if(a.type==='img'&&a.src){const im=new Image();im.onload=()=>{ctx.drawImage(im,a.x,a.y,a.w||200,a.h||150);};im.src=a.src}
  else if(a.type==='hl'){ctx.fillStyle='rgba(255,220,0,.4)';ctx.fillRect(a.x,a.y,a.w||100,a.h||24)}});
 document.querySelector('#presOv div')?.querySelector('span')?.remove();const lbl=document.createElement('span');lbl.style.cssText='color:#fff;position:fixed;top:16px;right:16px;font-size:.9rem;background:rgba(0,0,0,.5);padding:4px 10px;border-radius:8px';lbl.textContent=(presIdx+1)+'/'+curDoc.pages.length;document.getElementById('presOv')?.appendChild(lbl)}
function stopPres(){presMode=false;document.getElementById('presOv')?.remove();document.removeEventListener('keydown',presKey)}
function presKey(e){if(!presMode)return;if(e.key==='ArrowRight'||e.key===' '){presIdx=Math.min(curDoc.pages.length-1,presIdx+1);drawPres(document.getElementById('presCv'))}else if(e.key==='ArrowLeft'){presIdx=Math.max(0,presIdx-1);drawPres(document.getElementById('presCv'))}else if(e.key==='Escape')stopPres()}

/* ===== PDF importas (geresnis) ===== */
const _fPDF=$('fPDF');
_fPDF.onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;
 toast('Atidaroma: '+f.name+'...',30000);
 try{await libsReady;if(!window.pdfjsLib)throw new Error('PDF.js biblioteka neįsikėlė. Patikrinkite internetą.');
  const ab=await f.arrayBuffer();const pdf=await pdfjsLib.getDocument({data:ab}).promise;
  toast('Skaitoma '+pdf.numPages+' puslapiai...',30000);const pages=[];
  for(let i=1;i<=pdf.numPages;i++){const pg=await pdf.getPage(i);const vp=pg.getViewport({scale:W/pg.getViewport({scale:1}).width});
   const cv=document.createElement('canvas');cv.width=Math.round(vp.width);cv.height=Math.round(vp.height);
   await pg.render({canvasContext:cv.getContext('2d'),viewport:vp}).promise;
   const txt=(await pg.getTextContent()).items.map(x=>x.str).join(' ');
   pages.push({annotations:[{id:uid(),type:'img',src:cv.toDataURL('image/jpeg',.88),x:0,y:0,w:W,h:H}],sourceText:txt})}
  curDoc={id:uid(),title:f.name.replace(/\.pdf$/i,''),created:Date.now(),updated:Date.now(),pages,source:'upload'};
  undoStack=[];redoStack=[];curPage=0;docs.unshift(curDoc);saveDocs();showViewer();
  if(curDoc.pages.some(p=>p.sourceText?.trim()))addMsg('ai','PDF atidarytas: "'+curDoc.title+'" ('+curDoc.pages.length+' puslapiai).\n\nTeksto turinys rastas – galiu atsakyti į klausimus apie dokumentą arba padėti jį redaguoti.');
  toast('Atidarytas ✅')}
 catch(err){toast('Klaida atidarant: '+err.message,6000)}};

/* ===== Eksportas kaip nuotraukos ===== */
(()=>{const btn=document.createElement('button');btn.className='btn w';btn.style.cssText='margin-top:8px';btn.innerHTML=ic('img')+' Eksportuoti kaip nuotraukas';btn.onclick=async()=>{if(!curDoc)return toast('Nėra dokumento');toast('Kuriamos nuotraukos...',10000);
 for(let i=0;i<curDoc.pages.length;i++){const c=await pageCanvas(curDoc.pages[i]);const a=document.createElement('a');a.href=c.toDataURL('image/jpeg',.95);a.download=curDoc.title+'_'+(i+1)+'.jpg';a.click();await new Promise(r=>setTimeout(r,300))}
 toast('Nuotraukos išsaugotos')};
 const _openSettings2=openSettings;openSettings=function(){_openSettings2();setTimeout(()=>$('kIn')?.closest('.card')?.after(btn),50)}})();

/* ===== Dokumentų saugojimas (geresnis) ===== */
const _saveDocs=saveDocs;
saveDocs=function(){try{const l=docs.map(d=>({id:d.id,title:d.title,created:d.created,updated:d.updated,pageCount:d.pages?.length||0}));localStorage.setItem('pdf_docs_meta',JSON.stringify(l));
 if(curDoc){try{const key='pdf_doc_'+curDoc.id;const pgs=curDoc.pages.map(p=>({annotations:(p.annotations||[]).map(a=>a.type==='img'&&a.src?.length>50000?{...a,src:a.src.slice(0,50000)+'...'}:a),sourceText:p.sourceText}));localStorage.setItem(key,JSON.stringify({...curDoc,pages:pgs}))}catch{}}
}catch(e){console.warn('Išsaugoti nepavyko:',e)}};
const _loadDocs=()=>{try{const meta=JSON.parse(localStorage.getItem('pdf_docs_meta')||'[]');docs=meta.map(m=>{try{const d=JSON.parse(localStorage.getItem('pdf_doc_'+m.id)||'null');return d||{...m,pages:[]}}catch{return{...m,pages:[]}}});if(!docs.length){const old=JSON.parse(localStorage.getItem('pdf_docs')||'[]');docs=old}}catch{docs=[]}};
_loadDocs();

/* ===== Peržiūra prieš išsaugant ===== */
const _tSave=$('tSave');
_tSave.onclick=async()=>{if(!curDoc)return toast('Nėra dokumento');
 const ov=document.createElement('div');ov.style.cssText='position:fixed;inset:0;z-index:40;background:rgba(0,0,0,.7);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:20px';
 const title=document.createElement('p');title.style.cssText='color:#fff;font-size:1.1rem;font-weight:600';title.textContent='Peržiūra prieš išsaugant';
 const cv=document.createElement('canvas');const pg=curDoc.pages[curPage];cv.style.cssText='max-width:min(600px,90vw);max-height:60vh;border-radius:12px;background:#fff;display:block';
 const sc=Math.min(600/W,.7);cv.width=W*sc;cv.height=H*sc;const ctx=cv.getContext('2d');ctx.scale(sc,sc);ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);
 (pg.annotations||[]).forEach(a=>{if(a.type==='txt'){ctx.font=(a.fontSize||18)+'px system-ui';ctx.fillStyle=a.color||'#000';ctx.fillText(a.text||'',a.x,a.y+20)}else if(a.type==='img'&&a.src){const im=new Image();im.onload=()=>ctx.drawImage(im,a.x,a.y,a.w||W,a.h||H);im.src=a.src}});
 const bar=document.createElement('div');bar.style.cssText='display:flex;gap:12px';
 const mkB=(t,p,fn)=>{const b=document.createElement('button');b.textContent=t;b.style.cssText=`padding:12px 24px;border-radius:12px;border:0;font-size:1rem;cursor:pointer;background:${p?'var(--a)':'rgba(255,255,255,.15)'};color:#fff`;b.onclick=fn;return b};
 ov.append(title,cv,bar);
 bar.append(mkB('✅ Išsaugoti PDF',true,async()=>{ov.remove();toast('Kuriamas PDF...',10000);try{(await buildPdf()).save(pdfName());toast('Išsaugota: '+pdfName())}catch(e){toast('Klaida: '+e.message)}}),mkB('↗ Siųsti',false,async()=>{ov.remove();$('tShare').click()}),mkB('✕ Atšaukti',false,()=>ov.remove()));
 document.body.appendChild(ov)};

/* ===== Laikinas pokalbis ===== */
(()=>{const btn=document.createElement('button');btn.id='bTemp';btn.className='ib';btn.setAttribute('aria-label','Naujas pokalbis');btn.innerHTML=ic('newf');btn.title='Išvalyti pokalbį';btn.onclick=()=>{if(!confirm('Išvalyti pokalbio istoriją?'))return;aiHistory=[];msgsEl.innerHTML='';addMsg('ai','Pokalbis išvalytas. Kuo galiu padėti?')};$('aiClose').before(btn)})();
/* ===== pdf-present.js pabaiga ===== */
