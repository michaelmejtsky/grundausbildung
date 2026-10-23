// Nur statische GitHub-Dateien cachen, niemals Mitglieder- oder Anmeldedaten.
const CACHE='ga-shell-v2.2';
const CORE=['./','./index.html','./config.js','./manifest.webmanifest','./feuerwehrauto-safe-v2-512.png','./feuerwehrauto-safe-v2-192.png','./feuerwehrauto-safe-v2-512.png'];
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

/* Echte System-Pushnachrichten werden auch verarbeitet, wenn die App geschlossen ist. */
self.addEventListener('push',event=>{
 let data={};
 try{data=event.data?event.data.json():{}}catch{data={title:'Grundausbildung',body:'Neue Mitteilung'};}
 const title=String(data.title||'Grundausbildung').slice(0,90);
 event.waitUntil(self.registration.showNotification(title,{
  body:String(data.body||'Du hast eine neue Mitteilung.').slice(0,180),
  icon:'./feuerwehrauto-safe-v2-192.png',
  badge:'./feuerwehrauto-safe-v2-192.png',
  tag:'grundausbildung-'+String(data.id||'meldung').slice(0,75),
  data:{url:'./'}
 }));
});
self.addEventListener('notificationclick',event=>{
 event.notification.close();
 event.waitUntil((async()=>{
   const target=new URL('./',self.location.href).href;
   const clientsList=await clients.matchAll({type:'window',includeUncontrolled:true});
   for(const client of clientsList){
     if(client.url.startsWith(target)){
       if('focus' in client)return client.focus();
     }
   }
   if(clients.openWindow)return clients.openWindow(target);
 })());
});
