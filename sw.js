const C='pdf-v1';
const FILES=['./','index.html','style.css','manifest.json','icon-512.png','app.js','pdf-core.js','ai-editor.js','pdf-preview.js','pdf-present.js','pdf-final.js'];
const CDN=['cdnjs.cloudflare.com','cdn.jsdelivr.net','unpkg.com'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(FILES).catch(()=>{})))});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);
 if(e.request.method!=='GET')return;
 if(u.origin!==location.origin&&!CDN.includes(u.hostname))return;
 e.respondWith(fetch(e.request).then(r=>{if(r.ok){const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp))}return r}).catch(()=>caches.match(e.request,{ignoreSearch:true})))});
