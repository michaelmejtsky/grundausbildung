// Nur statische GitHub-Dateien cachen, niemals Mitglieder- oder Anmeldedaten.
const CACHE='ga-shell-v2.9';
const CORE=['./','./index.html','./quiz-ui.js','./aid-ui.js','./admin-ui.js','./admin-ui.css','./config.js','./manifest.webmanifest','./feuerwehrauto-safe-v2-512.png','./feuerwehrauto-safe-v2-192.png'];
self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    // Fehlende Offline-Dateien dürfen die Installation des Push-Dienstes nicht blockieren.
    try{
      const cache=await caches.open(CACHE);
      await Promise.allSettled(CORE.map(url=>cache.add(url)));
    }catch(error){
      console.warn('Offline-Cache nicht vollständig verfügbar:',error);
    }
    await self.skipWaiting();
  })());
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

/* System-Push auch bei geschlossener App und gezieltes Öffnen der Nachricht. */
self.addEventListener('push',event=>{
 let data={};
 try{data=event.data?event.data.json():{}}catch{data={title:'Grundausbildung',body:'Neue Mitteilung'};}
 const title=String(data.title||'Grundausbildung').slice(0,90);
 // Bisherige Cloudflare-Version sendet die Benachrichtigungs-ID im Tag.
 const raw=String(data.id||String(data.tag||'').replace(/^grundausbildung-/,''));
 const id=/^[a-f0-9-]{8,90}$/i.test(raw)?raw:'';
 const target='./'+(id?'?notification='+encodeURIComponent(id):'');
 event.waitUntil(self.registration.showNotification(title,{
  body:String(data.body||'Du hast eine neue Mitteilung.').slice(0,180),
  icon:'./feuerwehrauto-safe-v2-192.png',
  badge:'./feuerwehrauto-safe-v2-192.png',
  tag:id?'grundausbildung-'+id:'grundausbildung-mitteilung',
  data:{id,url:target}
 }));
});
self.addEventListener('notificationclick',event=>{
 event.notification.close();
 event.waitUntil((async()=>{
   const info=event.notification.data||{};
   const id=/^[a-f0-9-]{8,90}$/i.test(String(info.id||''))?String(info.id):'';
   const base=new URL('./',self.location.href);
   const dest=new URL('./'+(id?'?notification='+encodeURIComponent(id):''),base);
   const list=await clients.matchAll({type:'window',includeUncontrolled:true});
   for(const client of list){
     let path='';
     try{const opened=new URL(client.url);if(opened.origin!==base.origin)continue;path=opened.pathname;}catch{continue;}
     if(path!==base.pathname&&path!==base.pathname+'index.html')continue;
     // Bereits geöffnete App: Nachricht anzeigen, ohne die Benutzersitzung zu verlieren.
     if(id&&client.postMessage)client.postMessage({type:'ga-open-notification',id});
     if('focus' in client)return client.focus();
   }
   if(clients.openWindow)return clients.openWindow(dest.href);
 })());
});
