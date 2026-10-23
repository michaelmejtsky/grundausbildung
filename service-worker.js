// Nur statische GitHub-Dateien cachen, niemals Mitglieder- oder Anmeldedaten.
const CACHE='ga-shell-v1.2';
const CORE=['./','./index.html','./config.js','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(
    keys.filter(k=>k.startsWith('ga-shell-')&&k!==CACHE).map(k=>caches.delete(k))
  )).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
  if(event.request.mode==='navigate'){
    event.respondWith(fetch(event.request).catch(()=>caches.match('./index.html')));
    return;
  }
  event.respondWith(fetch(event.request).then(response=>{
    if(response.ok&&CORE.some(p=>new URL(p,self.location.href).pathname===new URL(event.request.url).pathname)){
      const clone=response.clone();caches.open(CACHE).then(c=>c.put(event.request,clone));
    }
    return response;
  }).catch(()=>caches.match(event.request)));
});
