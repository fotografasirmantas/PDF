'use strict';
/* Mano PDF: peržiūra, puslapių tvarkymas, anotacijų redagavimas. Veikia su app.js */

/* ===== Puslapių sąrašas (peržiūra) ===== */
(()=>{const btn=document.createElement('button');btn.id='bPages';btn.className='ib';btn.setAttribute('aria-label','Puslapiai');btn.innerHTML=ic('tpl');$('tClose').after(btn);btn.onclick=openPageList})();
function openPageList(){if(!curDoc)return;
 openSheet(`<h3>Puslapiai (${curDoc.pages.length})</h3><div id="pgList" style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:12px"></div><div class="btns"><button class="btn p" data-act="addPg">Pridėti puslapį</button></div>`,{addPg:()=>{addPage();closeSheet()}});
 const list=$('pgList');curDoc.pages.forEach((pg,i)=>{const c=document.createElement('canvas');c.width=W;c.height=H;c.style.cssText='width:100%;aspect-ratio:'+W+'/'+H+';border-radius:8px;border:2px solid '+(i===curPage?'var(--a)':'var(--ln)');const ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);(pg.annotations||[]).forEach(a=>{if(a.type==='txt'){ctx.font=(a.fontSize||18)+'px system-ui';ctx.fillStyle=a.color||'#000';ctx.fillText(a.text||'',a.x,a.y+20)}else if(a.type==='img'&&a.src){const im=new Image();im.onload=()=>ctx.drawImage(im,a.x,a.y,a.w||W,a.h||H);im.src=a.src}});
  const wrap=document.createElement('div');wrap.style.cssText='display:flex;flex-direction:column;gap:4px;align-items:center';
  const lbl=document.createElement('div');lbl.style.cssText='font-size:.75rem;color:var(--mu)';lbl.textContent=(i+1)+' psl.';
  const del=document.createElement('button');del.style.cssText='font-size:.72rem;color:var(--red);background:none;border:0;padding:2px';del.textContent='Ištrinti';del.onclick=()=>{if(curDoc.pages.length<2)return toast('Paskutinio negalima ištrinti');if(!confirm('Ištrinti '+(i+1)+' puslapį?'))return;snapshot();curDoc.pages.splice(i,1);curPage=Math.min(curPage,curDoc.pages.length-1);saveDocs();renderPages();closeSheet()};
  c.onclick=()=>{curPage=i;renderPages();closeSheet()};
  wrap.appendChild(c);wrap.appendChild(lbl);wrap.appendChild(del);list.appendChild(wrap)})}

/* ===== Redaguojamos anotacijos ===== */
const _renderPages=renderPages;
renderPages=function(){_renderPages();setTimeout(makeAnnotsEditable,80)};
function makeAnnotsEditable(){if(!curDoc)return;
 document.querySelectorAll('.page-wrap').forEach((pw,pi)=>{if(!curDoc.pages[pi])return;
  const scale=(pw.offsetWidth||W)/W;
  (curDoc.pages[pi].annotations||[]).forEach(a=>{if(a.type==='img')return;
   const el=document.createElement('div');el.className='ann '+(a.type==='txt'?'txt':'hl');
   el.style.cssText=`left:${a.x*scale}px;top:${a.y*scale}px;`+(a.type==='txt'?`font-size:${(a.fontSize||18)*scale}px;color:${a.color||'#000'};min-width:60px`:`width:${(a.w||100)*scale}px;height:${(a.h||24)*scale}px`);
   if(a.type==='txt'){el.contentEditable='true';el.textContent=a.text||'';el.oninput=()=>{a.text=el.textContent;curDoc.updated=Date.now();saveDocs()};el.onblur=()=>saveDocs()}
   const rz=document.createElement('div');rz.className='ann-resize';el.appendChild(rz);
   makeDraggable(el,a,pi,scale);pw.appendChild(el)})})}
function makeDraggable(el,a,pi,scale){let sx,sy,ax,ay;
 el.addEventListener('pointerdown',e=>{if(e.target.classList.contains('ann-resize')||e.target.isContentEditable&&el.textContent){}
  sx=e.clientX;sy=e.clientY;ax=a.x;ay=a.y;
  const mm=e2=>{const dx=(e2.clientX-sx)/scale,dy=(e2.clientY-sy)/scale;a.x=Math.max(0,ax+dx);a.y=Math.max(0,ay+dy);el.style.left=a.x*scale+'px';el.style.top=a.y*scale+'px'};
  const mu=()=>{document.removeEventListener('pointermove',mm);document.removeEventListener('pointerup',mu);saveDocs()};
  document.addEventListener('pointermove',mm);document.addEventListener('pointerup',mu)},{passive:true});
 const rz=el.querySelector('.ann-resize');if(!rz)return;
 rz.addEventListener('pointerdown',e=>{e.stopPropagation();const sx2=e.clientX,sy2=e.clientY,ow=a.w||(a.fontSize||18)*5,oh=a.h||24;
  const mm=e2=>{a.w=Math.max(40,(ow+(e2.clientX-sx2))/scale);a.h=Math.max(16,(oh+(e2.clientY-sy2))/scale);el.style.width=a.w*scale+'px';el.style.height=a.h*scale+'px'};
  const mu=()=>{document.removeEventListener('pointermove',mm);document.removeEventListener('pointerup',mu);saveDocs()};
  document.addEventListener('pointermove',mm);document.addEventListener('pointerup',mu)},{passive:true});
 el.addEventListener('dblclick',e=>{if(!e.target.classList.contains('ann-resize'))return;if(!confirm('Ištrinti šią anotaciją?'))return;delAnnotation(pi,a.id)})}

/* ===== Teksto spalva ir dydis ===== */
(()=>{const bar=document.createElement('div');bar.style.cssText='display:flex;gap:8px;padding:8px 12px;background:var(--bg);border-top:1px solid var(--ln);overflow-x:auto;flex-wrap:nowrap';
 bar.innerHTML=`<select id="fSz" style="border:1px solid var(--ln);border-radius:8px;padding:4px 6px;background:var(--bg);font-size:.85rem"><option>12</option><option>14</option><option selected>18</option><option>24</option><option>28</option><option>32</option><option>36</option><option>48</option></select>
<input type="color" id="fClr" value="#000000" title="Spalva" style="width:34px;height:34px;border:1px solid var(--ln);border-radius:8px;cursor:pointer">
<button id="bBold" style="padding:4px 10px;border:1px solid var(--ln);border-radius:8px;font-weight:700;background:var(--bg)">B</button>
<button id="bItalic" style="padding:4px 10px;border:1px solid var(--ln);border-radius:8px;font-style:italic;background:var(--bg)">I</button>`;
 $('editBar').before(bar);
 $('fSz').onchange=e=>{const sel=document.activeElement;if(!sel?.classList.contains('ann'))return;const pi=+[...$('pages').querySelectorAll('.page-wrap')].findIndex(pw=>pw.contains(sel));if(pi<0)return;const a=curDoc?.pages[pi]?.annotations.find(x=>x.id===sel.dataset.id);if(a){a.fontSize=+e.target.value;sel.style.fontSize=+e.target.value*(($('pages').querySelector('.page-wrap')?.offsetWidth||W)/W)+'px';saveDocs()}};
 $('fClr').oninput=e=>{const sel=document.activeElement;if(!sel?.classList.contains('ann'))return;const pi=[...$('pages').querySelectorAll('.page-wrap')].findIndex(pw=>pw.contains(sel));const a=curDoc?.pages[pi]?.annotations.find(x=>x.id===sel.dataset.id);if(a){a.color=e.target.value;sel.style.color=e.target.value;saveDocs()}}})();
/* ===== pdf-preview.js pabaiga ===== */
