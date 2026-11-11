'use strict';
/* Mano PDF: AI redagavimas. Veikia kartu su app.js ir pdf-core.js */

/* ===== AI komandų vykdymas ===== */
const CMD={
 addText:({page,text,x,y,size,color})=>{const pi=page??curPage;addAnnotation(pi,'txt',text);const pg=curDoc?.pages[pi];if(pg){const a=pg.annotations[pg.annotations.length-1];a.x=x??80;a.y=y??100;a.fontSize=size??18;a.color=color??'#000'}renderPages()},
 addImage:({page,src})=>{if(src)addAnnotation(page??curPage,'img',src)},
 deletePage:({page})=>{curPage=page??curPage;delPage()},
 addPage:()=>addPage(),
 setTitle:({text})=>{if(curDoc&&text){curDoc.title=text.slice(0,80);$('docTitle').textContent=curDoc.title;saveDocs()}},
 highlight:({page,x,y,w,h})=>addAnnotation(page??curPage,'hl',{x:x??50,y:y??50,w:w??200,h:h??30}),
 reorder:({order})=>{if(!curDoc||!Array.isArray(order))return;snapshot();const old=[...curDoc.pages];curDoc.pages=order.map(i=>old[i]).filter(Boolean);renderPages();saveDocs()},
 build:({slides})=>{if(!curDoc||!Array.isArray(slides))return;snapshot();curDoc.pages=slides.map(s=>({annotations:[{id:uid(),type:'txt',x:80,y:120,text:s.title||'',fontSize:s.titleSize??28,color:s.titleColor??'#1e1e2e'},...(s.body?[{id:uid(),type:'txt',x:80,y:200,text:s.body,fontSize:s.bodySize??16,color:s.bodyColor??'#444'}]:[]),...(s.img?[{id:uid(),type:'img',src:s.img,x:400,y:120,w:300,h:220}]:[])]}));curPage=0;renderPages();saveDocs()}};

/* ===== Prisegtos nuotraukos AI ===== */
let aiAttach=[];
function renderAIAttach(){const bar=$('aiAttBar');if(!bar)return;bar.innerHTML=aiAttach.map((a,i)=>`<div style="position:relative;flex:none"><img src="${esc(a.src)}" style="width:52px;height:52px;object-fit:cover;border-radius:10px;display:block"><button style="position:absolute;top:-5px;right:-5px;width:18px;height:18px;border-radius:50%;background:var(--tx);color:var(--bg);border:0;font-size:11px;display:grid;place-items:center" data-rm="${i}">✕</button></div>`).join('');bar.style.display=aiAttach.length?'flex':'none'}
(()=>{const bar=document.createElement('div');bar.id='aiAttBar';bar.style.cssText='display:none;gap:8px;overflow-x:auto;padding:4px 14px 8px';bar.addEventListener('click',e=>{const b=e.target.closest('[data-rm]');if(b){aiAttach.splice(+b.dataset.rm,1);renderAIAttach()}});$('aifoot')?.prepend(bar);const btn=document.createElement('label');btn.style.cssText='width:38px;height:38px;border-radius:50%;display:grid;place-items:center;cursor:pointer;flex:none;color:var(--mu)';btn.innerHTML=ic('img');const inp=document.createElement('input');inp.type='file';inp.accept='image/*';inp.multiple=true;inp.hidden=true;inp.onchange=async e=>{for(const f of e.target.files){const r=new FileReader();await new Promise(res=>{r.onload=()=>{aiAttach.push({src:r.result,name:f.name});res()};r.readAsDataURL(f)})};e.target.value='';renderAIAttach()};btn.appendChild(inp);$('aibox')?.querySelector('.go')?.before(btn)})();

/* ===== Geresnis AI atsakymas ===== */
const _sendAI=sendAI;
sendAI=async function(txt){txt=txt.trim();if(!txt&&!aiAttach.length)return;
 if(!cfg.apiKey){toast('Įveskite raktą');openSettings();return}
 const att=[...aiAttach];aiAttach=[];renderAIAttach();inputEl.value='';grow();
 const msgTxt=txt+(att.length?' ['+att.length+' nuotraukos]':'');aiHistory.push({role:'user',content:txt,images:att.map(a=>a.src)});addMsg('user',msgTxt);
 const el=addMsg('ai','');el.innerHTML='<div class="aidots"><i></i><i></i><i></i></div>';
 aiCtrl=new AbortController();
 try{const ep=cfg.eps.find(x=>x.id===cfg.ep)||cfg.eps[0];
  const ctx=curDoc?`Dokumentas: "${curDoc.title}", ${curDoc.pages.length} puslapiai.\n`+curDoc.pages.map((p,i)=>{const t=p.annotations?.filter(a=>a.type==='txt').map(a=>a.text).join(' ')||'';return`[${i+1} psl.]${t?' '+t:''}`}).join('\n'):'(nėra dokumento)';
  const sys=`Tu esi AI asistentas programėlėje "Mano PDF". Gali vykdyti komandas PDF dokumente.\n\nKomandos JSON formatu (rašyk po atsakymo, atskirai bloke \`\`\`json ... \`\`\`):\n- addText: {page,text,x,y,size,color}\n- deletePage: {page}\n- addPage: {}\n- setTitle: {text}\n- highlight: {page,x,y,w,h}\n- reorder: {order:[0,2,1,...]}\n- build: {slides:[{title,body,titleSize,bodySize,titleColor,bodyColor}]}\n\nDokumentas:\n${ctx}\n\nJei vartotojas prašo pakeitimo, pateik komandą JSON bloke ir trumpai paaiškink ką darys. Jei tik klausia, atsakyk tekstu be JSON.`;
  const msgs=[{role:'system',content:sys},...aiHistory.slice(-16).map(m=>({role:m.role,content:m.images?.length?[{type:'text',text:m.content||''},...m.images.map(src=>({type:'image_url',image_url:{url:src}}))]:m.content}))];
  const r=await fetch(ep.url,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+cfg.apiKey},body:JSON.stringify({model:cfg.model,messages:msgs}),signal:aiCtrl.signal});
  const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error?.message||'HTTP '+r.status);
  const ans=d.choices?.[0]?.message?.content||d.content?.[0]?.text||'(tuščias atsakymas)';aiHistory.push({role:'assistant',content:ans});
  const jm=ans.match(/```json\s*([\s\S]*?)```/);let cmds=null;
  if(jm){try{const o=JSON.parse(jm[1].trim());cmds=Array.isArray(o)?o:[o]}catch{}}
  const clean=ans.replace(/```json[\s\S]*?```/g,'').trim();
  el.innerHTML=mdAI(clean)+(cmds?`<button class="aibtn" data-act="apply">✅ Pritaikyti pakeitimą</button>`:'');
  el.dataset.cmds=cmds?JSON.stringify(cmds):''}
 catch(e){if(e.name!=='AbortError')el.innerHTML='<span style="color:var(--red)">Klaida: '+esc(e.message)+'</span>'}
 aiCtrl=null};

/* ===== Pritaikyti mygtukas ===== */
msgsEl.addEventListener('click',e=>{const b=e.target.closest('[data-act="apply"]');if(!b)return;
 if(!curDoc){toast('Pirma atidarykite arba sukurkite dokumentą');return}
 try{const cmds=JSON.parse(b.closest('.aimsg')?.dataset.cmds||'[]');let done=0;
  for(const c of cmds){const fn=CMD[c.cmd||Object.keys(c)[0]]||CMD[Object.keys(c)[0]];if(fn){fn(c[c.cmd||Object.keys(c)[0]]??c);done++}}
  if(done){toast('Pritaikyta ✅');b.textContent='✅ Pritaikyta';b.disabled=true}else toast('Komandos nerasta')}
 catch(e){toast('Klaida: '+e.message)}},true);
/* ===== ai-editor.js pabaiga ===== */
