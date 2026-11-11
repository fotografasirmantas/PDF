const C='pdf-v4';
const FILES=['./','index.html','style.css','manifest.json','icon-512.png','app.js','pdf-core.js','pdf-edit.js'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(FILES).catch(()=>{})))});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET')return;
 if(u.origin!==location.origin&&!['cdnjs.cloudflare.com','cdn.jsdelivr.net'].includes(u.hostname))return;
 e.respondWith(fetch(e.request).then(r=>{if(r.ok){const cp=r.clone();caches.open(C).then(ch=>ch.put(e.request,cp))}return r}).catch(()=>caches.match(e.request,{ignoreSearch:true})))});
