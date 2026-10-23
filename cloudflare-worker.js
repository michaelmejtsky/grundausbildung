/**
 * Grundausbildung - Cloudflare Worker V1.1
 *
 * Environment in Cloudflare:
 *   GA_SCRIPT_URL      = https://script.google.com/macros/s/.../exec
 *   GA_WORKER_SECRET   = identischer geheimer Schlüssel aus Apps Script (Secret)
 * CORS ausschließlich für die eigene GitHub-Pages-Seite.
 */
const ALLOWED_ORIGIN='https://michaelmejtsky.github.io';
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
export default {
 async fetch(request,env){
  const origin=request.headers.get('Origin');
  if(request.method==='OPTIONS'){
    if(origin!==ALLOWED_ORIGIN)return new Response(null,{status:403});
    return new Response(null,{status:204,headers:cors()});
  }
  if(request.method!=='POST')return reply({ok:false,error:'Nur POST erlaubt.'},405);
  if(origin!==ALLOWED_ORIGIN)return reply({ok:false,error:'Unzulässiger Ursprung.'},403);
  if(!env.GA_SCRIPT_URL||!/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(env.GA_SCRIPT_URL))
    return reply({ok:false,error:'Backend ist noch nicht konfiguriert.'},503);
  if(!env.GA_WORKER_SECRET||env.GA_WORKER_SECRET.length<48)
    return reply({ok:false,error:'Worker-Schlüssel fehlt.'},503);
  try{
    const type=request.headers.get('Content-Type')||'';
    if(!type.startsWith('application/json'))return reply({ok:false,error:'Ungültiger Inhaltstyp.'},415);
    if(Number(request.headers.get('content-length')||0)>120000)return reply({ok:false,error:'Anfrage ist zu groß.'},413);
    const json=await request.json();
    if(!json||!['gaLogin','gaApi','gaCheckInvite','gaAcceptInvite'].includes(json.method)||!Array.isArray(json.args))
      return reply({ok:false,error:'Ungültige Anfrage.'},400);
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),45000);
    let upstream;
    try{
      upstream=await fetch(env.GA_SCRIPT_URL,{
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
