'use strict';
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'checkliste-bestaetigen.html'),'utf8'),script=Array.from(html.matchAll(/<script>([\s\S]*?)<\/script>/g),m=>m[1]).join('\n');
function harness({token='a'.repeat(64),fdisk=false,old=false,notRequired=false,statusOverride=null}={}){
 const elements={},calls=[],history=[];let saved=false,fail=false;
 const get=id=>elements[id]??={id,value:'',checked:false,disabled:false,textContent:'',required:false,min:'',max:'',handlers:{},classList:{values:new Set(),add(c){this.values.add(c);},remove(c){this.values.delete(c);},toggle(c,on){on?this.values.add(c):this.values.delete(c);},contains(c){return this.values.has(c);}},addEventListener(type,fn){this.handlers[type]=fn;}};
 const context=vm.createContext({document:{getElementById:get},window:{GA_API_URL:'https://api.example.test'},location:{hash:'#token='+token,pathname:'/grundausbildung/checkliste-bestaetigen.html'},history:{replaceState:(...args)=>history.push(args)},URLSearchParams,AbortController,Intl,Date,setTimeout,clearTimeout,
 fetch:async(url,opts)=>{const req=JSON.parse(opts.body);calls.push({url,opts,req});if(fail)throw Error('offline');const [action,data]=req.args;
  if(action==='confirmMailAction'){assert.equal(data.Bestaetigt,true);assert.equal(data.LinkToken,token);assert.equal(req.args[2],'');saved=true;}
  const value={Version:old?undefined:1,Name:'Anna <script>bad</script>',Aufgabe:fdisk?'Erste-Hilfe-Nachweis in FDISK eingetragen':'Dienstbekleidung erhalten',Erledigt:saved,Status:saved?(statusOverride||(notRequired?'Nicht erforderlich':'Erledigt')):'Offen',NichtErforderlichAktion:notRequired,DatumErforderlich:fdisk,AktuellesDatum:'2026-01-01',BestaetigtesDatum:saved&&fdisk?data.Datum:'',Kursdatum:'2026-10-01',Ablauf:'04.12.2026'};
  return {ok:true,json:async()=>({ok:true,value})};}});
 vm.runInContext(script,context,{filename:'checkliste-bestaetigen.html'});
 return {get,calls,history,context,setFail:v=>{fail=v;}};
}
const settle=()=>new Promise(resolve=>setImmediate(resolve));
(async()=>{
 const h=harness();await settle();assert.equal(h.calls.length,1);assert.equal(h.calls[0].req.args[0],'previewMailAction');assert.equal(h.calls[0].opts.cache,'no-store');assert.equal(h.calls[0].opts.method,'POST');
 assert.equal(h.get('person').textContent,'Anna <script>bad</script>');assert.equal(h.get('confirmButton').disabled,false);assert(!h.get('confirmForm').classList.contains('hidden'));
 assert.equal(h.history[0][2],'/grundausbildung/checkliste-bestaetigen.html');assert(!html.includes('localStorage'));assert(!html.includes('sessionStorage'));assert(html.includes('no-referrer'));
 assert.equal(h.calls.length,1,'A link scanner opening the page can only preview, never confirm');
 await h.get('confirmForm').handlers.submit({preventDefault(){}});assert.equal(h.calls.length,2);assert.equal(h.calls[1].req.args[0],'confirmMailAction');assert(!h.get('success').classList.contains('hidden'));assert(h.get('confirmForm').classList.contains('hidden'));
 await h.get('confirmForm').handlers.submit({preventDefault(){}});assert.equal(h.calls.length,2,'No double submit after confirmed result');
 const d=harness({fdisk:true});await settle();assert(d.get('confirmButton').disabled);await d.get('confirmForm').handlers.submit({preventDefault(){}});assert.equal(d.calls.length,1);
 d.get('entryDate').value='2026-11-04';d.get('entryDate').handlers.input();assert.equal(d.get('confirmButton').disabled,false);await d.get('confirmForm').handlers.submit({preventDefault(){}});
 assert.equal(d.calls[1].req.args[1].Datum,'2026-11-04');assert.equal(d.calls[1].req.args[1].VorherigesDatum,'2026-01-01');assert(d.get('success').textContent.includes('04.11.2026'));
 const no=harness({notRequired:true});await settle();assert.equal(no.get('confirmButton').textContent,'Als nicht erforderlich bestätigen');assert(no.get('confirmationHint').textContent.includes('keine Ausgabe erforderlich'));assert.equal(no.calls.length,1);
 await no.get('confirmForm').handlers.submit({preventDefault(){}});assert(no.get('success').textContent.includes('nicht erforderlich'));assert(no.get('confirmForm').classList.contains('hidden'));assert(!no.calls[1].req.args[1].Status,'The browser cannot choose the target status');
 const opposite=harness({notRequired:true,statusOverride:'Erledigt'});await settle();await opposite.get('confirmForm').handlers.submit({preventDefault(){}});assert(opposite.get('success').textContent.includes('Punkt ist erledigt'));assert(!opposite.get('success').textContent.includes('nicht erforderlich'));
 const bad=harness({token:'invalid'});await settle();assert.equal(bad.calls.length,0);assert(bad.get('error').textContent.includes('unvollständig'));
 const legacy=harness({old:true});await settle();assert(legacy.get('error').textContent.includes('1.13.8'));
 const offline=harness();await settle();offline.setFail(true);await offline.get('confirmForm').handlers.submit({preventDefault(){}});assert(offline.get('confirmForm').classList.contains('hidden'));assert(!offline.get('reload').classList.contains('hidden'));
 console.log('Mail confirmation page: readonly load, no login/storage/referrer leak, explicit submit, exact POST, date requirement, safe text, success/duplicate and network failures passed.');
})().catch(error=>{console.error(error);process.exitCode=1;});
