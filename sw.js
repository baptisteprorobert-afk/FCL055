/* Service worker : fonctionnement hors ligne */
const CACHE='fcl055-v1';
const FILES=['./','index.html','manifest.webmanifest','icon-180.png','icon-192.png','icon-512.png',
 'js/util.js','js/data-vocab.js','js/data-clear.js','js/data-text.js','js/data-photos.js','js/data-courses.js','js/app.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{
    const copy=res.clone();caches.open(CACHE).then(c=>c.put(e.request,copy)).catch(()=>{});return res;
  }).catch(()=>caches.match('index.html'))));
});
