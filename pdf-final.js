'use strict';
/* Mano PDF: galutiniai pataisymai, versija, APK paruošimas. Veikia su visais failais */
const APP_VER='v1';

/* ===== Versijos užrašas nustatymuose ===== */
const _openSettings3=openSettings;
openSettings=function(){_openSettings3();setTimeout(()=>{
 const foot=document.createElement('p');foot.style.cssText='text-align:center;color:var(--mu);font-size:.75rem;margin:20px 0 0;padding:12px 0 0;border-top:1px solid var(--ln)';
 foot.innerHTML=`Mano PDF · Versija ${APP_VER}<br><a href="https://fotografasirmantas.github.io/PDF/" style="color:var(--a);text-decoration:none" target="_blank">fotografasirmantas.github.io/PDF</a>`;
 document.querySelector('.sheet')?.appendChild(foot)},60)};

/* ===== Pataisymai ===== */
// 1. Užtikrinti, kad bibliotekos įsikrauna pirma bet kokio veiksmo
const _newDoc=newDoc;
newDoc=async function(title,pages){await libsReady;_newDoc(title,pages)};
const _openPDF=$('fPDF').onclick;
$('fPDF').onclick=async function(){await libsReady;if(_openPDF)_openPDF()};

// 2. Jei rakto nėra, kai bandoma siųsti AI, iškart atidaryti nustatymus
const _sendAI2=sendAI;
sendAI=async function(txt){if(!cfg.apiKey){closeAI();setTimeout(()=>{toast('Įveskite API raktą iš anymodel.org');openSettings()},200);return}return _sendAI2(txt)};

// 3. Automatinis dokumentų saugojimas kas 30 sek., jei yra pakeitimų
let lastSave=Date.now();
setInterval(()=>{if(curDoc&&Date.now()-lastSave>30000){saveDocs();lastSave=Date.now()}},30000);

// 4. Užtikrinti, kad curDoc.pages visada yra masyvas
const _showViewer=showViewer;
showViewer=function(){if(!curDoc.pages)curDoc.pages=[];_showViewer()};

// 5. Pataisyti canvas renderinimą, jei nuotrauka dar neįsikrovė
window.pageCanvas=async function(pg){const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,W,H);
 const imgs=(pg.annotations||[]).filter(a=>a.type==='img'&&a.src);
 const loaded=await Promise.all(imgs.map(a=>loadImg(a.src)));
 (pg.annotations||[]).forEach((a,i)=>{
  if(a.type==='img'&&loaded[imgs.indexOf(a)]){x.drawImage(loaded[imgs.indexOf(a)],a.x,a.y,a.w||200,a.h||150)}
  else if(a.type==='txt'){const fs=a.fontSize||18;x.font=fs+'px system-ui,sans-serif';x.fillStyle=a.color||'#000';String(a.text||'').split('\n').forEach((l,k)=>x.fillText(l,a.x,a.y+20+k*fs*1.3))}
  else if(a.type==='hl'){x.fillStyle='rgba(255,220,0,.4)';x.fillRect(a.x,a.y,a.w||100,a.h||24)}});
 return c};

// 6. AI komandų patikrinimas
const _CMD=CMD;
Object.assign(CMD,{
 addText:({page,text,x,y,size,color})=>{if(!curDoc){toast('Pirma sukurkite dokumentą');return}const pi=typeof page==='number'?page:curPage;if(!curDoc.pages[pi])return;addAnnotation(pi,'txt',text);const a=curDoc.pages[pi].annotations[curDoc.pages[pi].annotations.length-1];a.x=x??80;a.y=y??100;a.fontSize=size??18;a.color=color??'#000';renderPages()},
 deletePage:({page})=>{if(!curDoc)return;curPage=typeof page==='number'?page:curPage;delPage()},
 addPage:()=>{if(!curDoc)return;addPage()},
 setTitle:({text})=>{if(curDoc&&text){curDoc.title=text.slice(0,80);$('docTitle').textContent=curDoc.title;saveDocs();toast('Pavadinimas pakeistas')}},
 highlight:({page,x,y,w,h})=>{if(!curDoc)return;addAnnotation(typeof page==='number'?page:curPage,'hl',{x:x??50,y:y??50,w:w??200,h:h??30})},
 reorder:({order})=>{if(!curDoc||!Array.isArray(order))return;snapshot();const old=[...curDoc.pages];curDoc.pages=order.map(i=>old[i]).filter(Boolean);renderPages();saveDocs();toast('Puslapių tvarka pakeista')},
 build:({slides})=>{if(!curDoc||!Array.isArray(slides))return;if(!confirm('Pakeisti dokumentą naujais '+slides.length+' puslapiais?'))return;snapshot();
  curDoc.pages=slides.map(s=>({annotations:[{id:uid(),type:'txt',x:80,y:120,text:s.title||'',fontSize:s.titleSize??28,color:s.titleColor??'#1e1e2e'},...(s.body?[{id:uid(),type:'txt',x:80,y:200,text:s.body,fontSize:s.bodySize??16,color:s.bodyColor??'#444'}]:[]),...(s.img?[{id:uid(),type:'img',src:s.img,x:400,y:120,w:300,h:220}]:[])]}));
  curPage=0;renderPages();saveDocs();toast('Dokumentas atstatytas')}
});

// 7. Automatinis modelio pasirinkimas, jei sąraše yra tik vienas
if(cfg.models.length===1&&!cfg.model){cfg.model=cfg.models[0];saveCfg();updateModelLabel()}

// 8. Jei dokumentų sąrašas per ilgas, palikti tik 100 naujausių
if(docs.length>100){docs=docs.slice(0,100);saveDocs()}

// 9. Pataisyti AI pokalbio slinkimą
const _addMsg=addMsg;
addMsg=function(role,txt,btns){const m=_addMsg(role,txt,btns);setTimeout(()=>msgsEl.scrollTop=msgsEl.scrollHeight,50);return m};

// 10. Jei šoninis meniu tuščias, rodyti pasiūlymą
const _renderDrawer2=renderDrawer;
renderDrawer=function(){_renderDrawer2();if(!docs.length){const hint=document.createElement('div');hint.style.cssText='padding:16px 12px;color:var(--mu);font-size:.9rem;line-height:1.5';hint.innerHTML='<b>Pradėkite čia:</b><br>· Naujas dokumentas<br>· Atidaryti PDF<br>· Iš šablono';document.querySelector('.sec')?.after(hint)}};

// 11. Išsaugoti naują dokumento versiją prieš didelius pakeitimus
['deletePage','reorder','build'].forEach(k=>{const orig=CMD[k];CMD[k]=function(args){snapshot();return orig(args)}});

// 12. Jei AI grąžina kelias komandas, visas vykdyti iš eilės
msgsEl.addEventListener('click',e=>{const b=e.target.closest('[data-act="apply"]');if(!b||b.disabled)return;
 if(!curDoc){toast('Pirma sukurkite arba atidarykite dokumentą');return}
 b.disabled=true;b.textContent='⏳ Vykdoma...';
 setTimeout(()=>{try{const cmds=JSON.parse(b.closest('.aimsg')?.dataset.cmds||'[]');let done=0;
  for(const c of cmds){const cmd=c.cmd||Object.keys(c).find(k=>CMD[k]);if(cmd&&CMD[cmd]){CMD[cmd](c[cmd]??c);done++}}
  if(done){toast('Pritaikyta ✅ ('+done+' komandos)');b.textContent='✅ Pritaikyta'}else{toast('Komandų nerasta');b.textContent='❌ Klaida';b.disabled=false}}
 catch(e){toast('Klaida vykdant: '+e.message);b.textContent='❌ Klaida';b.disabled=false}},100)},true);

// 13. Pranešimas apie sėkmingą įkėlimą
console.log('%c✅ Mano PDF '+APP_VER+' įkelta','color:#0866ff;font-size:16px;font-weight:bold');
console.log('Failai: index.html, style.css, app.js, pdf-core.js, ai-editor.js, pdf-preview.js, pdf-present.js, pdf-final.js');

// 14. Service Worker versija
if('serviceWorker' in navigator){navigator.serviceWorker.getRegistration().then(reg=>{if(reg)reg.update()})}

// 15. Jei ekranas per mažas, sumažinti canvas dydį
if(innerWidth<400){const style=document.createElement('style');style.textContent='.page-wrap{max-width:calc(100vw - 24px)!important}';document.head.appendChild(style)}

// 16. Paskutinis tikrinimas
setTimeout(()=>{if(typeof pdfjsLib==='undefined'||typeof jspdf==='undefined'){toast('PDF bibliotekos dar kraunasi. Jei nepasirodo per minutę, perkraukite puslapį.',8000)}},3000);

// 17. APK paruošimas: patikrinti manifest ir sw
fetch('manifest.json').then(r=>r.json()).then(m=>{if(!m.name||!m.icons?.length)console.warn('manifest.json turi trūkumų')}).catch(()=>console.warn('manifest.json nerastas'));
fetch('sw.js').then(r=>r.text()).then(t=>{if(t.length<100)console.warn('sw.js tuščias arba per trumpas')}).catch(()=>console.warn('sw.js nerastas'));

// 18. Jei yra neišsaugotų pakeitimų ir bandoma uždaryti, įspėti
window.addEventListener('beforeunload',e=>{if(curDoc&&undoStack.length>0){e.preventDefault();e.returnValue='Turite neišsaugotų pakeitimų'}});

// 19. Automatinis užraktas po 10 min neaktyvumo (pasirinktinai)
let lastActivity=Date.now();
['pointerdown','keydown','touchstart'].forEach(ev=>document.addEventListener(ev,()=>{lastActivity=Date.now()},true));
setInterval(()=>{if(cfg.autoLock&&curDoc&&Date.now()-lastActivity>600000){if(confirm('10 minučių neaktyvumo. Uždaryti dokumentą?'))hideViewer()}},60000);

// 20. Pranešimas vartotojui
setTimeout(()=>{if(!cfg.apiKey)toast('👋 Sveiki! Pradėkite nuo ☰ → Nustatymai → įveskite API raktą.',6000);else toast('Mano PDF paruoštas ✅',2000)},800);

/* ===== pdf-final.js pabaiga ===== */
