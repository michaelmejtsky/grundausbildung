/**
 * Grundausbildung - Cloudflare Worker V1.1
 *
 * Environment in Cloudflare:
 *   Apps-Script-URL ist unten bereits eingetragen (kann via GA_SCRIPT_URL überschrieben werden)
 *   GA_WORKER_SECRET   = identischer geheimer Schlüssel aus Apps Script (Secret)
 * CORS ausschließlich für die eigene GitHub-Pages-Seite.
 */
const ALLOWED_ORIGIN='https://michaelmejtsky.github.io';
const DEPLOYED_SCRIPT_URL='https://script.google.com/macros/s/AKfycbw0t9edW1egW27B1dHhen2I73GZji3JfQ8aBSFAjghd5gZXSTu24r7E_iMvTqBe3hhT/exec';
function cors(){
 return {
  'Access-Control-Allow-Origin':ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods':'POST, OPTIONS',
  'Access-Control-Allow-Headers':'Content-Type',
  'Vary':'Origin',
  'Cache-Control':'no-store',
  'X-Content-Type-Options':'nosniff'
 };
}
function reply(body,status=200){
 return new Response(JSON.stringify(body),{status,headers:{...cors(),'Content-Type':'application/json; charset=utf-8'}});
}

/* Native Web Push: Cloudflare Secrets GA_WORKER_SECRET und VAPID_PRIVATE_JWK,
   Worker-Variable VAPID_PUBLIC_KEY, VAPID_SUBJECT. Private Keys nie in GitHub! */
const PUSH_MAX_BATCH=12;
const PUSH_MAX_BYTES=4096;
const PUSH_DOMAINS=['fcm.googleapis.com','updates.push.services.mozilla.com','push.services.mozilla.com','web.push.apple.com'];
const te=new TextEncoder();
/**
 * Sichere VAPID-Diagnose: Liefert nur Wahr/Falsch-Werte, niemals Schlüssel.
 * Damit ist erkennbar, ob eine Variable fehlt, falsch formatiert ist oder
 * öffentlicher/privater Schlüssel nicht zum selben Schlüsselpaar gehören.
 */
function pushConfigurationChecks(env){
 const pub=String(env.VAPID_PUBLIC_KEY||'');
 const raw=String(env.VAPID_PRIVATE_JWK||'');
 const subject=String(env.VAPID_SUBJECT||'');
 const checks={
  publicKeyPresent:pub.length>0,
  publicKeyValid:false,
  privateKeyPresent:raw.length>0,
  privateKeyValid:false,
  subjectPresent:subject.length>0,
  subjectValid:/^mailto:[^@\s]+@[^@\s]+\.[^@\s]+$/.test(subject),
  keyPairMatches:false
 };
 let publicBytes=null,privateJwk=null;
 try{
  publicBytes=pushB64ToBytes(pub);
  checks.publicKeyValid=/^[A-Za-z0-9_-]{86,88}$/.test(pub)&&
    publicBytes.length===65&&publicBytes[0]===4;
 }catch{}
 try{
  privateJwk=JSON.parse(raw);
  checks.privateKeyValid=privateJwk&&privateJwk.kty==='EC'&&privateJwk.crv==='P-256'&&
    ['x','y','d'].every(k=>typeof privateJwk[k]==='string'&&
     /^[A-Za-z0-9_-]+$/.test(privateJwk[k])&&pushB64ToBytes(privateJwk[k]).length===32);
 }catch{}
 if(checks.publicKeyValid&&checks.privateKeyValid){
  try{
   const x=pushB64ToBytes(privateJwk.x),y=pushB64ToBytes(privateJwk.y);
   checks.keyPairMatches=x.every((v,i)=>v===publicBytes[i+1])&&
     y.every((v,i)=>v===publicBytes[i+33]);
  }catch{}
 }
 return checks;
}
function pushConfigured(env){
 return Object.values(pushConfigurationChecks(env)).every(Boolean);
}
function pushB64ToBytes(s){
 const x=String(s||'').replace(/-/g,'+').replace(/_/g,'/');
 const raw=atob(x+'='.repeat((4-x.length%4)%4));
 return Uint8Array.from(raw,c=>c.charCodeAt(0));
}
function pushB64(bytes){
 let s='';for(const b of bytes)s+=String.fromCharCode(b);
 return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
}
function pushJoin(...parts){
 const size=parts.reduce((total,p)=>total+p.length,0),out=new Uint8Array(size);
 let off=0;for(const p of parts){out.set(p,off);off+=p.length;}
 return out;
}
async function pushHmac(key,bytes){
 const k=await crypto.subtle.importKey('raw',key,{name:'HMAC',hash:'SHA-256'},false,['sign']);
 return new Uint8Array(await crypto.subtle.sign('HMAC',k,bytes));
}
async function pushExpand(prk,info,length){
 return (await pushHmac(prk,pushJoin(info,Uint8Array.of(1)))).slice(0,length);
}
function pushDestination(endpoint){
 try{
  const u=new URL(endpoint);
  if(u.protocol!=='https:'||u.username||u.password||u.port||
     !PUSH_DOMAINS.includes(u.hostname.toLowerCase()))return null;
  return u;
 }catch{return null;}
}
function pushValidSubscription(s){
 if(!s||typeof s!=='object'||!pushDestination(s.endpoint))return false;
 try{return pushB64ToBytes(s.p256dh).length===65&&pushB64ToBytes(s.auth).length>=16;}
 catch{return false;}
}
async function pushEncrypt(text,subscription){
 const ua=pushB64ToBytes(subscription.p256dh);
 const auth=pushB64ToBytes(subscription.auth);
 const clientKey=await crypto.subtle.importKey('raw',ua,{name:'ECDH',namedCurve:'P-256'},false,[]);
 const ephemeral=await crypto.subtle.generateKey({name:'ECDH',namedCurve:'P-256'},true,['deriveBits']);
 const as=new Uint8Array(await crypto.subtle.exportKey('raw',ephemeral.publicKey));
 const shared=new Uint8Array(await crypto.subtle.deriveBits({name:'ECDH',public:clientKey},ephemeral.privateKey,256));
 const prk=await pushHmac(auth,shared);
 const ikm=await pushExpand(prk,pushJoin(te.encode('WebPush: info'),Uint8Array.of(0),ua,as),32);
 const salt=crypto.getRandomValues(new Uint8Array(16));
 const base=await pushHmac(salt,ikm);
 const cek=await pushExpand(base,pushJoin(te.encode('Content-Encoding: aes128gcm'),Uint8Array.of(0)),16);
 const nonce=await pushExpand(base,pushJoin(te.encode('Content-Encoding: nonce'),Uint8Array.of(0)),12);
 const key=await crypto.subtle.importKey('raw',cek,'AES-GCM',false,['encrypt']);
 const plaintext=pushJoin(te.encode(text),Uint8Array.of(2));
 const encrypted=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv:nonce},key,plaintext));
 const recordSize=4096;
 const rs=new Uint8Array([recordSize>>>24,(recordSize>>>16)&255,(recordSize>>>8)&255,recordSize&255]);
 const body=pushJoin(salt,rs,Uint8Array.of(as.length),as,encrypted);
 if(body.length>PUSH_MAX_BYTES)throw Error('Push message too long');
 return body;
}
async function pushVapid(env,audience){
 const jwk=JSON.parse(env.VAPID_PRIVATE_JWK);
 const key=await crypto.subtle.importKey('jwk',jwk,{name:'ECDSA',namedCurve:'P-256'},false,['sign']);
 const header=pushB64(te.encode(JSON.stringify({typ:'JWT',alg:'ES256'})));
 const payload=pushB64(te.encode(JSON.stringify({aud:audience,exp:Math.floor(Date.now()/1000)+3600,sub:env.VAPID_SUBJECT})));
 const token=header+'.'+payload;
 const raw=new Uint8Array(await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},key,te.encode(token)));
 // WebCrypto ECDSA signatures are JOSE r||s (64 bytes), as required by JWT ES256.
 if(raw.length!==64)throw Error('Unexpected VAPID signature format');
 return token+'.'+pushB64(raw);
}
async function pushOne(env,entry,notification){
 const s=entry.subscription;
 if(!pushValidSubscription(s))return {id:entry.id,ok:false,invalid:true};
 const destination=pushDestination(s.endpoint);
 const payload=JSON.stringify({
  title:notification.title||'Grundausbildung',
  body:notification.body||'Du hast eine neue Mitteilung.',
  tag:'grundausbildung-'+String(notification.id||'message').slice(0,80),
  url:notification.url||'/',
  kind:notification.kind||'MESSAGE'
 });
 try{
  const [encrypted,jwt]=await Promise.all([
   pushEncrypt(payload,s),
   pushVapid(env,destination.origin)
  ]);
  const res=await fetch(s.endpoint,{
   method:'POST',
   headers:{
    'Content-Encoding':'aes128gcm',
    'Content-Type':'application/octet-stream',
    'Authorization':'vapid t='+jwt+', k='+env.VAPID_PUBLIC_KEY,
    'TTL':'86400',
    'Urgency':'normal'
   },
   body:encrypted,
   // Cloudflare Workers only supports 'follow' and 'manual'; never follow push redirects.
   redirect:'manual',
   signal:AbortSignal.timeout(9000)
  });
  return {id:entry.id,ok:res.status===201||res.status===202||res.status===200,
   gone:[404,410].includes(res.status),status:res.status};
 }catch(err){
  return {id:entry.id,ok:false,status:0,error:String(err.message||err).slice(0,160)};
 }
}

async function gaPushInternal(request,env){
 if(request.method!=='POST')return reply({ok:false,error:'Nur POST erlaubt.'},405);
 if(!env.GA_WORKER_SECRET||env.GA_WORKER_SECRET.length<48)
   return reply({ok:false,error:'Push-Server nicht vorbereitet.'},503);
 if(Number(request.headers.get('content-length')||0)>60000)
   return reply({ok:false,error:'Anfrage zu groß.'},413);
 let body;
 try{body=await request.json();}catch{return reply({ok:false,error:'Ungültige Anfrage.'},400);}
 const ts=Number(body.ts),nonce=String(body.nonce||''),payload=String(body.payload||''),
  signature=String(body.signature||'').toLowerCase();
 if(!Number.isSafeInteger(ts)||Math.abs(Math.floor(Date.now()/1000)-ts)>120||
    !/^[a-f0-9]{32}$/.test(nonce)||!/^[a-f0-9]{64}$/.test(signature)||payload.length>50000)
    return reply({ok:false,error:'Unzulässige Signatur.'},401);
 const key=await crypto.subtle.importKey('raw',te.encode(env.GA_WORKER_SECRET),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const bytes=new Uint8Array(await crypto.subtle.sign('HMAC',key,te.encode(ts+'.'+nonce+'.'+payload)));
 const expected=[...bytes].map(x=>x.toString(16).padStart(2,'0')).join('');
 let diff=0;for(let i=0;i<64;i++)diff|=expected.charCodeAt(i)^signature.charCodeAt(i);
 if(diff!==0)return reply({ok:false,error:'Unzulässige Signatur.'},403);
 if(!pushConfigured(env))return reply({ok:false,error:'VAPID-Schlüssel fehlen.'},503);
 let data;try{data=JSON.parse(payload);}catch{return reply({ok:false,error:'Push-Daten ungültig.'},400);}
 if(!data||!Array.isArray(data.devices)||!data.devices.length||data.devices.length>12||
    !data.notification||typeof data.notification!=='object')return reply({ok:false,error:'Push-Daten ungültig.'},400);
 const notice={title:String(data.notification.title||'Grundausbildung').slice(0,90),
  body:String(data.notification.body||'Neue Mitteilung').slice(0,180),
  id:String(data.notification.id||'mitteilung').slice(0,80),
  kind:String(data.notification.kind||'Nachricht').slice(0,30),
  url:'/grundausbildung/'};
 const results=await Promise.all(data.devices.map(x=>pushOne(env,x,notice)));
 return reply({ok:true,results},200);
}

export default {
 async fetch(request,env){
  const path=new URL(request.url).pathname;
  if(path==='/internal/push')return gaPushInternal(request,env);
  const origin=request.headers.get('Origin');
  if(request.method==='OPTIONS'){
    if(origin!==ALLOWED_ORIGIN)return new Response(null,{status:403});
    return new Response(null,{status:204,headers:cors()});
  }
  if(request.method!=='POST')return reply({ok:false,error:'Nur POST erlaubt.'},405);
  if(origin!==ALLOWED_ORIGIN)return reply({ok:false,error:'Unzulässiger Ursprung.'},403);
  const scriptUrl=env.GA_SCRIPT_URL||DEPLOYED_SCRIPT_URL;
  if(!/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(scriptUrl))
    return reply({ok:false,error:'Backend ist noch nicht konfiguriert.'},503);
  if(!env.GA_WORKER_SECRET||env.GA_WORKER_SECRET.length<48)
    return reply({ok:false,error:'Worker-Schlüssel fehlt.'},503);
  try{
    const type=request.headers.get('Content-Type')||'';
    if(!type.startsWith('application/json'))return reply({ok:false,error:'Ungültiger Inhaltstyp.'},415);
    if(Number(request.headers.get('content-length')||0)>120000)return reply({ok:false,error:'Anfrage ist zu groß.'},413);
    const json=await request.json();
    if(json?.method==='gaPushInfo'&&Array.isArray(json.args)&&json.args.length===0){
      const checks=pushConfigurationChecks(env);
      const configured=Object.values(checks).every(Boolean);
      return reply({ok:true,value:{configured,publicKey:configured?env.VAPID_PUBLIC_KEY:'',
        diagnosticVersion:2,checks}},200);
    }
    if(!json||!['gaLogin','gaApi','gaCheckInvite','gaAcceptInvite'].includes(json.method)||!Array.isArray(json.args))
      return reply({ok:false,error:'Ungültige Anfrage.'},400);
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),45000);
    let upstream;
    try{
      upstream=await fetch(scriptUrl,{
        method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},
        body:JSON.stringify({method:json.method,args:json.args,gatewayKey:env.GA_WORKER_SECRET}),
        redirect:'follow',signal:controller.signal
      });
    }finally{clearTimeout(timer);}
    if(!upstream.ok)return reply({ok:false,error:'Google-Backend nicht verfügbar.'},502);
    const payload=await upstream.text();
    let data;
    try{data=JSON.parse(payload);}catch(e){return reply({ok:false,error:'Backend antwortet nicht mit JSON. Bereitstellung prüfen.'},502);}
    return reply({ok:data.ok===true,value:data.value,error:data.error||null},200);
  }catch(err){
    return reply({ok:false,error:'Verbindung fehlgeschlagen. Bitte Worker- und Apps-Script-Protokolle prüfen.'},502);
  }
 }
};
