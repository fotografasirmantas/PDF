'use strict';
/* Mano PDF: PDF teksto taisymas, slaptažodžiai, AI redagavimas. Įkelti po app.js ir pdf-core.js */
const FONT='Arial, Helvetica, sans-serif';
const BG=new Map(),CMDS=new Map();
let fixMode=false,lastAtt=[],saveT=0;
const ph=pg=>(pg&&pg.h)||H;
P.fix='<path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3z"/><path d="M13.5 6.5l3 3"/><path d="M14 20h6"/>';
if(cfg.aiSee===undefined)cfg.aiSee=true;
if(cfg.aiAuto===undefined)cfg.aiAuto=false;

(()=>{const s=document.createElement('style');s.textContent=`
.lnb{position:absolute;z-index:3;border:1.5px dashed var(--a);background:rgba(8,102,255,.08);border-radius:3px;cursor:pointer}
.lnb.ed{border-color:#1a9e5c;background:rgba(26,158,92,.15)}
.etool{flex:1;min-width:0!important;padding:8px 2px!important}
.aichips{display:flex;gap:6px;padding:6px 16px;border-bottom:1px solid var(--ln);flex-wrap:wrap}
.chip2{border:1px solid var(--ln);border-radius:99px;padding:5px 11px;font-size:.8rem}
.chip2.on{background:var(--a);border-color:var(--a);color:#fff}
.attchip{display:inline-flex;align-items:center;gap:6px;background:var(--bg2);border:1px solid var(--ln);border-radius:12px;padding:6px 10px;font-size:.8rem;flex:none}
.aibtn.aibtn2{background:var(--bg3);color:var(--tx)}
.toast{white-space:normal!important}`;document.head.appendChild(s)})();

/* ===== Saugojimas telefone (IndexedDB) ===== */
const dbP=new Promise((res,rej)=>{const r=indexedDB.open('manopdf',1);r.onupgradeneeded=()=>r.result.createObjectStore('docs');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});
function idb(mode,fn){return dbP.then(db=>new Promise((res,rej)=>{const t=db.transaction('docs',mode),r=fn(t.objectStore('docs'));t.oncomplete=()=>res(r&&r.result);t.onerror=()=>rej(t.error)}))}
function putDoc(d){const bgs={};(d.pages||[]).forEach(p=>{if(p.bg&&BG.has(p.bg.id))bgs[p.bg.id]=BG.get(p.bg.id)});return idb('readwrite',s=>s.put({...d,bgs},d.id))}
saveDocs=function(){
 try{localStorage.setItem('pdf_docs_meta',JSON.stringify(docs.map(d=>({id:d.id,title:d.title,created:d.created,updated:d.updated}))))}catch{}
 const d=curDoc;if(!d)return;clearTimeout(saveT);saveT=setTimeout(()=>putDoc(d).catch(e=>toast('Nepavyko išsaugoti: '+e.message,5000)),500)};
async function openStored(id){let d=docs.find(x=>x.id===id);
 if(!d||!Array.isArray(d.pages)||!d.pages.length){d=null;try{d=await idb('readonly',s=>s.get(id))}catch{}}
 if(!d){try{d=JSON.parse(localStorage.getItem('pdf_doc_'+id)||'null')}catch{}}
 if(!d||!Array.isArray(d.pages)||!d.pages.length)return toast('Šio dokumento turinio nerasta. Atidarykite PDF iš naujo.',5000);
 if(d.bgs){for(const k in d.bgs)BG.set(k,d.bgs[k]);delete d.bgs}
 const i=docs.findIndex(x=>x.id===id);if(i>=0)docs[i]=d;else docs.unshift(d);
 curDoc=d;curPage=0;undoStack=[];redoStack=[];fixMode=false;setFixBtn();showViewer()}
drawerEl.addEventListener('click',e=>{const b=e.target.closest('[data-act="loadDoc"]');if(!b)return;e.stopPropagation();closeDrawer();openStored(b.dataset.id)},true);

/* ===== Slaptažodžio langas ===== */
function askPass(name,wrong){return new Promise(res=>{let fin=false,t=0;const done=v=>{if(fin)return;fin=true;clearInterval(t);closeSheet();res(v)};
 openSheet(`<h3>🔒 PDF apsaugotas slaptažodžiu</h3><p style="color:var(--mu);margin:0 0 10px;overflow-wrap:anywhere">${esc(name)}</p>${wrong?'<p style="color:var(--red);margin:0 0 10px;font-weight:600">Neteisingas slaptažodis. Bandykite dar kartą.</p>':''}
<input class="in" id="pdfPass" type="password" autocomplete="off" placeholder="Įveskite PDF slaptažodį">
<label style="display:flex;gap:8px;align-items:center;margin-top:10px;font-size:.9rem"><input type="checkbox" id="pdfShow"> Rodyti slaptažodį</label>
<div class="btns"><button class="btn" data-act="no">Atšaukti</button><button class="btn p" data-act="ok">🔓 Atidaryti</button></div>`,{ok:()=>done($('pdfPass').value),no:()=>done(null)});
 t=setInterval(()=>{if(sheetEl.hidden)done(null)},300);
 setTimeout(()=>{const i=$('pdfPass');if(!i)return;i.focus();i.onkeydown=e=>{if(e.key==='Enter')done(i.value)};$('pdfShow').onchange=e=>{i.type=e.target.checked?'text':'password'}},80)})}
async function loadPdf(data,name){await libsReady;if(!window.pdfjsLib)throw new Error('PDF biblioteka neįsikėlė. Patikrinkite internetą.');
 const task=pdfjsLib.getDocument({data});let cancel=false;
 task.onPassword=(update,reason)=>{askPass(name,reason===pdfjsLib.PasswordResponses.INCORRECT_PASSWORD).then(p=>{if(p===null){cancel=true;task.destroy()}else update(p)})};
 try{return await task.promise}catch(e){throw cancel?new Error('cancel'):e}}

/* ===== PDF atidarymas su teksto eilutėmis ===== */
function toLines(items,vp){const R=[];
 for(const it of items){if(!it.str||!it.str.trim()||!it.transform)continue;const t=pdfjsLib.Util.transform(vp.transform,it.transform),fs=Math.hypot(t[2],t[3])||10;
  R.push({x:t[4],b:t[5],w:(it.width||0)*vp.scale||it.str.length*fs*.5,fs,s:it.str})}
 R.sort((a,b)=>a.b-b.b||a.x-b.x);const L=[];
 for(const r of R){const l=L.find(l=>Math.abs(l.b-r.b)<Math.max(l.fs,r.fs)*.4&&r.x>l.x+l.w-r.fs&&r.x-(l.x+l.w)<Math.max(l.fs,r.fs)*1.5);
  if(l){const g=r.x-(l.x+l.w);l.s+=(g>l.fs*.15&&!/\s$/.test(l.s)&&!/^\s/.test(r.s)?' ':'')+r.s;l.w=Math.max(l.w,r.x+r.w-l.x);l.fs=Math.max(l.fs,r.fs)}else L.push({...r})}
 L.sort((a,b)=>a.b-b.b||a.x-b.x);
 return L.map((l,i)=>{const s=l.s.replace(/\s+/g,' ').trim();return{id:i+1,x:+l.x.toFixed(1),base:+l.b.toFixed(1),top:+(l.b-l.fs*.92).toFixed(1),w:+Math.max(l.w,l.fs).toFixed(1),h:+(l.fs*1.22).toFixed(1),fs:+l.fs.toFixed(1),orig:s,text:s}})}
$('fPDF').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;
 try{toast('Atidaroma…',60000);const pdf=await loadPdf(new Uint8Array(await f.arrayBuffer()),f.name);const pages=[];let n=0;
  for(let i=1;i<=pdf.numPages;i++){toast(`Skaitomas ${i} iš ${pdf.numPages} psl.…`,60000);
   const pg=await pdf.getPage(i),v0=pg.getViewport({scale:1}),s=W/v0.width,vT=pg.getViewport({scale:s}),vI=pg.getViewport({scale:s*1.6});
   const c=document.createElement('canvas');c.width=Math.round(vI.width);c.height=Math.round(vI.height);const cx=c.getContext('2d');cx.fillStyle='#fff';cx.fillRect(0,0,c.width,c.height);
   await pg.render({canvasContext:cx,viewport:vI}).promise;const id=uid();BG.set(id,c.toDataURL('image/jpeg',.85));c.width=c.height=0;
   const lines=toLines((await pg.getTextContent()).items,vT);n+=lines.length;pages.push({h:Math.round(vT.height),bg:{id},lines,annotations:[]})}
  curDoc={id:uid(),title:f.name.replace(/\.pdf$/i,''),created:Date.now(),updated:Date.now(),pages,source:'upload'};
  undoStack=[];redoStack=[];curPage=0;fixMode=false;setFixBtn();docs.unshift(curDoc);saveDocs();showViewer();
  toast(n?`✅ Atidaryta (${pages.length} psl.). Tekstą taisykite mygtuku „Taisyti“ arba per AI.`:'✅ Atidaryta. Šis PDF nuskenuotas (be teksto sluoksnio). AI mato puslapio vaizdą ir gali pridėti naują tekstą.',6000)}
 catch(err){toast(err.message==='cancel'?'Atidarymas atšauktas':'Nepavyko atidaryti: '+err.message,6000)}};

/* ===== Puslapio piešimas ===== */
function wrapLines(ctx,text,maxW){const out=[];String(text||'').split('\n').forEach(par=>{let cur='';par.split(' ').forEach(w=>{const t=cur?cur+' '+w:w;if(cur&&ctx.measureText(t).width>maxW){out.push(cur);cur=w}else cur=t});out.push(cur)});return out}
async function drawPage(ctx,pg,full){const h=ph(pg);ctx.fillStyle='#fff';ctx.fillRect(0,0,W,h);
 if(pg.bg&&BG.has(pg.bg.id)){const im=await loadImg(BG.get(pg.bg.id));if(im)ctx.drawImage(im,0,0,W,h)}
 for(const l of pg.lines||[]){if(l.text===l.orig&&!l.del)continue;ctx.fillStyle='#fff';ctx.fillRect(l.x-2,l.top-2,l.w+4,l.h+4);if(l.del||!l.text)continue;
  let fs=l.fs;ctx.font=fs+'px '+FONT;const mw=Math.max(l.w,W-l.x-20),tw=ctx.measureText(l.text).width;if(tw>mw){fs*=mw/tw;ctx.font=fs+'px '+FONT}
  if(tw>l.w){ctx.fillStyle='#fff';ctx.fillRect(l.x-2,l.top-2,Math.min(tw,mw)+4,l.h+4)}ctx.fillStyle=l.color||'#000';ctx.fillText(l.text,l.x,l.base)}
 for(const a of pg.annotations||[]){
  if(a.type==='img'&&a.src){const im=await loadImg(a.src);if(im)ctx.drawImage(im,a.x,a.y,a.w||300,a.h||200)}
  else if(a.type==='draw'&&a.points?.length>1){ctx.save();ctx.strokeStyle=a.color||'#e5484d';ctx.lineWidth=a.lineWidth||3;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();a.points.forEach((p,k)=>k?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();ctx.restore()}
  else if(full&&a.type==='hl'){ctx.fillStyle='rgba(255,220,0,.4)';ctx.fillRect(a.x,a.y,a.w||200,a.h||30)}
  else if(full&&a.type==='txt'&&a.text){const fs=a.fontSize||20;ctx.font=(a.bold?'bold ':'')+fs+'px '+FONT;ctx.fillStyle=a.color||'#000';wrapLines(ctx,a.text,(a.w||300)-16).forEach((t,k)=>ctx.fillText(t,a.x+8,a.y+4+fs*1.05+k*fs*1.4))}}}
renderPages=function(){if(!curDoc)return;const wrap=$('pages'),st=wrap.scrollTop;wrap.innerHTML='';
 curDoc.pages.forEach((pg,pi)=>{const h=ph(pg),o=document.createElement('div');o.className='page-wrap'+(pi===curPage?' sel':'');
  o.style.cssText=`width:${W}px;max-width:calc(100vw - 32px);aspect-ratio:${W}/${h}`;
  o.addEventListener('click',e=>{if(e.target===o||e.target.tagName==='CANVAS'){curPage=pi;document.querySelectorAll('.page-wrap').forEach((p,i)=>p.classList.toggle('sel',i===pi))}});
  const c=document.createElement('canvas');c.width=W;c.height=h;c.style.cssText='width:100%;height:100%;display:block';o.appendChild(c);wrap.appendChild(o);drawPage(c.getContext('2d'),pg,false)});
 wrap.scrollTop=st;setupDrawLayer();setTimeout(()=>{makeEditable();showLineBoxes()},100)};
pageToCanvas=async function(pg){const h=ph(pg),c=document.createElement('canvas');c.width=W*2;c.height=h*2;const x=c.getContext('2d');x.scale(2,2);await drawPage(x,pg,true);return c};
buildPdf=async function(){await libsReady;if(!window.jspdf?.jsPDF)throw new Error('jsPDF neįsikėlė. Patikrinkite internetą.');let doc;
 for(const pg of curDoc.pages){const pw=595.28,hh=pw*ph(pg)/W,o=hh>=pw?'p':'l';
  if(!doc)doc=new jspdf.jsPDF({unit:'pt',format:[pw,hh],orientation:o,compress:true});else doc.addPage([pw,hh],o);
  const c=await pageToCanvas(pg);doc.addImage(c.toDataURL('image/jpeg',.9),'JPEG',0,0,pw,hh)}
 return doc};

/* ===== Mygtukas „Taisyti“ ===== */
const fixBtn=document.createElement('button');fixBtn.className='etool';fixBtn.id='eFix';fixBtn.innerHTML=ic('fix')+'<span>Taisyti</span>';$('editBar').prepend(fixBtn);
function setFixBtn(){fixBtn.classList.toggle('on',fixMode)}
fixBtn.onclick=()=>{if(!curDoc)return;fixMode=!fixMode;setFixBtn();
 if(fixMode&&!curDoc.pages.some(p=>(p.lines||[]).length)){fixMode=false;setFixBtn();return toast('Šiame dokumente nėra taisomo PDF teksto. Jei PDF atidarėte anksčiau, atidarykite jį iš naujo. Nuskenuotą PDF taisykite per AI.',7000)}
 showLineBoxes();if(fixMode)toast('Palieskite eilutę, kurią norite pakeisti')};
function showLineBoxes(){document.querySelectorAll('.lnb').forEach(x=>x.remove());if(!fixMode||!curDoc)return;
 document.querySelectorAll('.page-wrap').forEach((pw,pi)=>{const pg=curDoc.pages[pi];if(!pg)return;const s=pw.offsetWidth/W;
  (pg.lines||[]).forEach(l=>{const b=document.createElement('div');b.className='lnb'+(l.text!==l.orig||l.del?' ed':'');
   b.style.cssText=`left:${(l.x-2)*s}px;top:${(l.top-2)*s}px;width:${(l.w+4)*s}px;height:${(l.h+4)*s}px`;
   b.onclick=e=>{e.stopPropagation();curPage=pi;editLine(pi,l)};pw.appendChild(b)})})}
function editLine(pi,l){const done=()=>{closeSheet();renderPages();saveDocs()};
 openSheet(`<h3>Taisyti eilutę (${pi+1} psl.)</h3>${l.text!==l.orig||l.del?`<p style="color:var(--mu);font-size:.85rem;margin:0 0 6px">Originalas: ${esc(l.orig)}</p>`:''}
<textarea class="in" id="lnIn" rows="3">${esc(l.del?'':l.text)}</textarea>
<div class="btns"><button class="btn p" data-act="ok">Išsaugoti</button><button class="btn d" data-act="del">Ištrinti eilutę</button>${l.text!==l.orig||l.del?'<button class="btn" data-act="orig">Grąžinti originalą</button>':''}</div>`,{
  ok:()=>{snapshot();l.text=$('lnIn').value.replace(/\s+/g,' ').trim();l.del=!l.text;done()},
  del:()=>{snapshot();l.del=true;done()},orig:()=>{snapshot();l.text=l.orig;l.del=false;done()}});
 setTimeout(()=>$('lnIn')?.focus(),80)}

/* ===== AI jungikliai ===== */
const chips=document.createElement('div');chips.className='aichips';document.querySelector('.aihead').after(chips);
function drawChips(){chips.innerHTML=`<button class="chip2${cfg.aiSee?' on':''}" data-k="aiSee">👁 Mato puslapį</button><button class="chip2${cfg.aiAuto?' on':''}" data-k="aiAuto">⚡ Daro iškart</button>`}
chips.onclick=e=>{const b=e.target.closest('[data-k]');if(!b)return;cfg[b.dataset.k]=!cfg[b.dataset.k];saveCfg();drawChips()};drawChips();

/* ===== AI priedai (nuotraukos, PDF su slaptažodžiu, tekstas) ===== */
async function shrink(f){const u=URL.createObjectURL(f);try{const im=await loadImg(u);if(!im)throw new Error('nuotraukos nepavyko atidaryti');
 const s=Math.min(1,1600/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.round(im.width*s);c.height=Math.round(im.height*s);
 c.getContext('2d').drawImage(im,0,0,c.width,c.height);return c.toDataURL('image/jpeg',.85)}finally{URL.revokeObjectURL(u)}}
renderAIAttach=function(){const bar=$('aiAttBar');if(!bar)return;
 bar.innerHTML=aiAttach.map((a,i)=>a.kind==='txt'?`<span class="attchip">📄 ${esc(a.name)} <button data-rm="${i}">✕</button></span>`
  :`<div style="position:relative;flex:none"><img src="${esc(a.src)}" style="width:52px;height:52px;object-fit:cover;border-radius:10px;display:block"><button data-rm="${i}" style="position:absolute;top:-5px;right:-5px;width:18px;height:18px;border-radius:50%;background:var(--tx);color:var(--bg);font-size:11px">✕</button></div>`).join('');
 bar.style.display=aiAttach.length?'flex':'none'};
$('fAIAtt').onchange=async e=>{const fs=[...e.target.files];e.target.value='';
 for(const f of fs){try{
  if(f.type.startsWith('image/'))aiAttach.push({kind:'img',src:await shrink(f),name:f.name});
  else if(f.type==='application/pdf'||/\.pdf$/i.test(f.name)){toast('Skaitomas '+f.name+'…',30000);const pdf=await loadPdf(new Uint8Array(await f.arrayBuffer()),f.name);let t='';
   for(let i=1;i<=pdf.numPages&&t.length<40000;i++){const pg=await pdf.getPage(i);t+=`\n[${i} psl.] `+(await pg.getTextContent()).items.map(x=>x.str).join(' ')}
   aiAttach.push({kind:'txt',name:f.name,text:t.slice(0,40000)||'(teksto nerasta)'});toast('Pridėta: '+f.name)}
  else if(/\.docx?$/i.test(f.name))toast('Word failo perskaityti negaliu. Išsaugokite jį kaip PDF ir prisekite.',6000);
  else aiAttach.push({kind:'txt',name:f.name,text:(await f.text()).slice(0,40000)})}
 catch(err){toast(err.message==='cancel'?'Atšaukta':'Nepavyko: '+err.message,5000)}}
 renderAIAttach()};

/* ===== Ką AI mato ===== */
getPdfContext=function(){if(!curDoc)return'(dokumentas neatidarytas)';let o=`Pavadinimas: „${curDoc.title}“. Puslapių: ${curDoc.pages.length}. Dabar rodomas ${curPage+1} psl.\n`;
 curDoc.pages.forEach((p,i)=>{o+=`\n=== ${i+1} psl. ===\n`;const L=(p.lines||[]).filter(l=>!l.del),A=p.annotations||[];
  L.forEach(l=>{o+=`L${l.id}: ${l.text}\n`});
  A.forEach((a,k)=>{if(a.type==='txt')o+=`T${k} (pridėtas tekstas, x${Math.round(a.x)} y${Math.round(a.y)}, ${a.fontSize||18}px): ${a.text}\n`;
   else if(a.type==='img')o+=`T${k}: nuotrauka x${Math.round(a.x)} y${Math.round(a.y)} ${Math.round(a.w||0)}×${Math.round(a.h||0)}\n`;
   else if(a.type==='hl')o+=`T${k}: geltonas žymėjimas\n`;else if(a.type==='draw')o+=`T${k}: piešinys\n`});
  if(!L.length&&!A.length)o+=p.bg?'(teksto sluoksnio nėra, žiūrėk puslapio vaizdą)\n':'(tuščias puslapis)\n'});
 return o.length>60000?o.slice(0,60000)+'\n…(sutrumpinta)':o};
async function pageShot(){const c=await pageToCanvas(curDoc.pages[curPage]),d=document.createElement('canvas');d.width=900;d.height=Math.round(c.height*900/c.width);
 d.getContext('2d').drawImage(c,0,0,d.width,d.height);return d.toDataURL('image/jpeg',.7)}
const SYS=`Tu esi AI asistentas programėlėje „Mano PDF“ ir PATS redaguoji dokumentą komandomis. Kai vartotojas prašo ką nors pakeisti, pataisyti, parašyti, įterpti, ištrinti, pažymėti ar sudėlioti, VISADA tai padaryk komandomis ir niekada nesakyk, kad negali. Jei prašo tik patarimo, atsakyk tekstu.
Prieš komandas trumpai lietuviškai parašyk, ką padarei. Komandas pateik atsakymo pabaigoje viename bloke \`\`\`json [ ... ] \`\`\`. Puslapiai numeruojami nuo 1. Puslapio plotis 794, A4 aukštis 1123.
L5 yra originalaus PDF eilutė, T2 yra pridėtas elementas (index 2).
{"replaceLine":{"page":1,"line":5,"text":"naujas tekstas"}}
{"deleteLine":{"page":1,"line":5}}
{"restoreLine":{"page":1,"line":5}}
{"replaceAll":{"find":"senas","replace":"naujas"}}
{"addText":{"page":1,"text":"...","x":80,"y":100,"size":18,"color":"#000000","w":630,"bold":false}}
{"editAnn":{"page":1,"index":2,"text":"...","size":18,"color":"#000000","x":80,"y":100}}
{"deleteAnn":{"page":1,"index":2}}
{"addImage":{"page":1,"att":1,"x":80,"y":300,"w":300,"h":200}}  (att = vartotojo prisegtos nuotraukos numeris #)
{"highlightLine":{"page":1,"line":5}}
{"addPage":{"after":1}}
{"deletePage":{"page":2}}
{"movePage":{"from":3,"to":1}}
{"setTitle":{"text":"..."}}
{"slides":{"replace":false,"items":[{"title":"...","body":"..."}]}}
Taisydamas klaidas, kiekvienai pakeistai eilutei naudok replaceLine ir išlaikyk panašų ilgį. Ilgą naują tekstą dėk su addText laisvoje vietoje arba naujame puslapyje. Nesisveikink.`;

/* ===== AI užklausa ===== */
async function callAI(msgs){const ep=cfg.eps.find(x=>x.id===cfg.ep)||cfg.eps[0],url=/chat\/completions/.test(ep.url)?ep.url:'https://anymodel.org/v1/chat/completions';
 aiCtrl=new AbortController();
 const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+cfg.apiKey},body:JSON.stringify({model:cfg.model,messages:msgs}),signal:aiCtrl.signal});
 const d=await r.json().catch(()=>({}));if(!r.ok){const e=new Error(d.error?.message||('HTTP '+r.status));e.status=r.status;throw e}
 const m=d.choices?.[0]?.message?.content;return typeof m==='string'?m:Array.isArray(m)?m.map(p=>p.text||'').join(''):(d.content?.[0]?.text||'')}
function estH(t,fs,w){const per=Math.max(1,Math.floor((w-16)/(fs*.52)));const n=String(t||'').split('\n').reduce((s,p)=>s+Math.max(1,Math.ceil(p.length/per)),0);return Math.ceil(n*fs*1.4+12)}
const plainText=s=>String(s||'').replace(/\*\*([^*]+)\*\*/g,'$1').replace(/^#+\s*/gm,'').replace(/`/g,'').trim();
sendAI=async function(txt){txt=String(txt??inputEl.value).trim();const att=[...aiAttach];if(!txt&&!att.length)return;
 if(!cfg.apiKey){toast('Įveskite API raktą');openSettings();return}
 aiAttach=[];renderAIAttach();inputEl.value='';grow();
 let content=txt;const tags=[];
 att.forEach(a=>{lastAtt.push(a);const n=lastAtt.length;tags.push('📎 #'+n+' '+a.name);
  content+=a.kind==='txt'?`\n\n--- Prisegtas failas #${n} „${a.name}“ ---\n${a.text}`:`\n[Prisegta nuotrauka #${n} „${a.name}“]`});
 aiHistory.push({role:'user',content,images:att.filter(a=>a.kind!=='txt').map(a=>a.src)});
 addMsg('user',txt+(tags.length?'\n'+tags.join('\n'):''));
 const el=addMsg('ai','');el.innerHTML='<div class="aidots"><i></i><i></i><i></i></div>';
 try{const shot=cfg.aiSee&&curDoc?await pageShot().catch(()=>null):null;
  const build=withShot=>{const Hh=aiHistory.slice(-16),last=Hh.length-1;
   return[{role:'system',content:SYS+'\n\nDOKUMENTAS:\n'+getPdfContext()},...Hh.map((m,i)=>{
    const imgs=i===last?[...(m.images||[]),...(withShot&&shot?[shot]:[])]:[];
    const t=(m.content||'')+(i===last&&withShot&&shot?`\n[Pridėtas dabar rodomo ${curPage+1} psl. vaizdas]`:'');
    return{role:m.role,content:imgs.length?[{type:'text',text:t},...imgs.map(u=>({type:'image_url',image_url:{url:u}}))]:t}})]};
  let ans;try{ans=await callAI(build(true))}catch(e){if(shot&&e.status===400)ans=await callAI(build(false));else throw e}
  ans=ans||'(tuščias atsakymas)';aiHistory.push({role:'assistant',content:ans});
  let cmds=null;const jm=ans.match(/```json\s*([\s\S]*?)```/i);
  if(jm){try{const o=JSON.parse(jm[1].trim());cmds=Array.isArray(o)?o:Array.isArray(o.commands)?o.commands:[o]}catch{}}
  const clean=ans.replace(/```json[\s\S]*?```/gi,'').trim()||(cmds?'Paruošiau pakeitimus.':'');
  const k=uid();CMDS.set(k,{cmds,text:clean});let btns='';
  if(cmds&&cfg.aiAuto&&curDoc){const n=execCmds(cmds);btns=`<p style="color:#1a9e5c;font-weight:600;margin-top:6px">✅ Pritaikyta (${n}). Atšaukti galite ↶</p>`}
  else if(cmds)btns=`<button class="aibtn" data-act="apply2" data-k="${k}">✅ Pritaikyti</button> `;
  if(curDoc&&clean)btns+=`<button class="aibtn aibtn2" data-act="ins" data-k="${k}">➕ Įterpti tekstą į PDF</button>`;
  el.innerHTML=mdAI(clean)+btns}
 catch(e){if(e.name!=='AbortError')el.innerHTML='<span style="color:var(--red)">Klaida: '+esc(e.message)+'</span>'}
 aiCtrl=null;msgsEl.scrollTop=msgsEl.scrollHeight};
msgsEl.addEventListener('click',e=>{const b=e.target.closest('[data-act="apply2"],[data-act="ins"]');if(!b||b.disabled)return;const v=CMDS.get(b.dataset.k);if(!v)return;
 if(!curDoc)return toast('Pirma atidarykite arba sukurkite dokumentą');
 if(b.dataset.act==='apply2'){const n=execCmds(v.cmds);b.disabled=true;b.textContent=n?'✅ Pritaikyta ('+n+')':'❌ Nepavyko';toast(n?'Pritaikyta. Atšaukti: ↶':'Komandų pritaikyti nepavyko')}
 else{snapshot();const t=plainText(v.text),w=W-120;curDoc.pages[curPage].annotations.push({id:uid(),type:'txt',text:t,x:60,y:80,fontSize:16,color:'#000',w,h:estH(t,16,w)});
  renderPages();saveDocs();toast('Tekstas įterptas į '+(curPage+1)+' psl. Jį galite perkelti ir keisti.')}});

/* ===== AI komandų vykdymas ===== */
const num=v=>+String(v??'').replace(/[^\d]/g,'');
const lineOf=(c,P)=>{const p=P(c.page);return p<0?null:(curDoc.pages[p].lines||[]).find(l=>l.id===num(c.line))};
const annOf=(c,P)=>{const p=P(c.page);return p<0?null:curDoc.pages[p].annotations[num(c.index)]};
const OPS={
 replaceLine:(c,P)=>{const l=lineOf(c,P);if(!l)return false;l.text=String(c.text??'').replace(/\s+/g,' ').trim();l.del=!l.text},
 deleteLine:(c,P)=>{const l=lineOf(c,P);if(!l)return false;l.del=true},
 restoreLine:(c,P)=>{const l=lineOf(c,P);if(!l)return false;l.text=l.orig;l.del=false},
 replaceAll:c=>{if(!c.find)return false;let n=0;const r=String(c.replace??'');curDoc.pages.forEach(p=>{
  (p.lines||[]).forEach(l=>{if(!l.del&&l.text.includes(c.find)){l.text=l.text.split(c.find).join(r);n++}});
  (p.annotations||[]).forEach(a=>{if(a.type==='txt'&&a.text?.includes(c.find)){a.text=a.text.split(c.find).join(r);n++}})});return n>0},
 addText:(c,P)=>{const p=P(c.page);if(p<0)return false;const fs=+c.size||18,x=+c.x||80,w=+c.w||Math.max(120,Math.min(630,W-x-20)),t=String(c.text||'');
  curDoc.pages[p].annotations.push({id:uid(),type:'txt',text:t,x,y:+c.y||80,fontSize:fs,color:c.color||'#000',bold:!!c.bold,w,h:+c.h||estH(t,fs,w)})},
 editAnn:(c,P)=>{const a=annOf(c,P);if(!a)return false;if(c.text!=null){a.text=String(c.text);a.h=Math.max(a.h||0,estH(a.text,a.fontSize||18,a.w||300))}
  if(c.size)a.fontSize=+c.size;if(c.color)a.color=c.color;if(c.x!=null)a.x=+c.x;if(c.y!=null)a.y=+c.y},
 deleteAnn:(c,P)=>{const p=P(c.page),arr=p<0?null:curDoc.pages[p].annotations,i=num(c.index);if(!arr||!arr[i])return false;arr.splice(i,1)},
 addImage:(c,P)=>{const p=P(c.page),a=lastAtt[(num(c.att)||lastAtt.length)-1];if(p<0||!a||a.kind==='txt')return false;
  curDoc.pages[p].annotations.push({id:uid(),type:'img',src:a.src,x:+c.x||80,y:+c.y||120,w:+c.w||320,h:+c.h||220})},
 highlightLine:(c,P)=>{const l=lineOf(c,P);if(!l)return false;curDoc.pages[P(c.page)].annotations.push({id:uid(),type:'hl',x:l.x-2,y:l.top-2,w:l.w+4,h:l.h+4})},
 addPage:c=>{const i=c.after!=null?Math.min(num(c.after),curDoc.pages.length):curDoc.pages.length;curDoc.pages.splice(i,0,{annotations:[],lines:[]});curPage=i},
 deletePage:(c,P)=>{const p=P(c.page);if(p<0||curDoc.pages.length<2)return false;curDoc.pages.splice(p,1);curPage=Math.min(curPage,curDoc.pages.length-1)},
 movePage:c=>{const f=num(c.from)-1,t=num(c.to)-1,L=curDoc.pages;if(!L[f]||t<0||t>=L.length)return false;L.splice(t,0,L.splice(f,1)[0]);curPage=t},
 setTitle:c=>{if(!c.text)return false;curDoc.title=String(c.text).slice(0,80);$('docTitle').textContent=curDoc.title},
 slides:c=>{const it=Array.isArray(c.items)?c.items:Array.isArray(c)?c:[];if(!it.length)return false;const w=W-140;
  const pages=it.map(s=>({lines:[],annotations:[{id:uid(),type:'txt',text:s.title||'',x:70,y:90,fontSize:34,bold:true,color:s.color||'#1e1e2e',w,h:estH(s.title||'',34,w)},
   ...(s.body?[{id:uid(),type:'txt',text:s.body,x:70,y:230,fontSize:20,color:'#333',w,h:estH(s.body,20,w)}]:[])]}));
  if(c.replace){curDoc.pages=pages;curPage=0}else{curDoc.pages.push(...pages);curPage=curDoc.pages.length-pages.length}}};
OPS.build=c=>OPS.slides({items:c.slides,replace:c.replace});
function execCmds(list){if(!curDoc||!Array.isArray(list))return 0;snapshot();let n=0;
 const P=v=>{const i=(v==null||v===''?curPage+1:num(v))-1;return curDoc.pages[i]?i:-1};
 for(const c of list){if(!c||typeof c!=='object')continue;const k=Object.keys(c).find(x=>OPS[x]);if(!k)continue;
  try{if(OPS[k](c[k]||{},P)!==false)n++}catch(e){console.warn(k,e)}}
 curDoc.updated=Date.now();renderPages();saveDocs();return n}
/* ===== pdf-edit.js pabaiga ===== */
