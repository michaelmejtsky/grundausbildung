'use strict';
// UI und Nachrichtenversand im isolierten Speicher: keine echten Konten oder Push-Nachrichten.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const start=html.indexOf('function gaGabNoticeSupported()'),end=html.indexOf('\nfunction notifications()',start);
assert(start>=0&&end>start);
let calls=[],renders=0,tips=[],confirmValue=true;
const makeItems=n=>Array.from({length:n},(_,i)=>({MitgliedID:'m'+i,Name:i===0?'<Person>':'Person '+i,Status:'Bereit',BSW:'BSW-Quiz offen und freigeschaltet',Text:'Hallo <Person>! Gratulation.'}));
const ctx=vm.createContext({console,Array,Number,String,Math,Set,Promise,STATE:{version:'1.13.4',user:{Rolle:'Administrator'}},TOKEN:'token',
 GA_ROLE_PREVIEW:'',GA_ADMIN_ADV_VIEW:false,GA_GAB_NOTICE_PREVIEW:null,GA_GAB_NOTICE_BUSY:false,
 h:s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;'),
 role:()=>ctx.STATE?.user?.Rolle,render:()=>{renders++;},tip:(text,error)=>tips.push({text,error}),confirm:()=>confirmValue,
 api:async(method,payload)=>{calls.push({method,payload});
  if(method==='gabCompletionNoticePreview')return {Teilnehmer:makeItems(12)};
  if(method==='sendGabCompletionNotices')return {erstellt:payload.MitgliedIDs.length,uebersprungen:0,fehler:0};
  throw Error('Unexpected '+method);}});
vm.runInContext(html.slice(start,end),ctx,{filename:'gab-notice-ui.js'});
(async()=>{
 let panel=ctx.gaGabNoticeAdminPanel();assert(panel.includes('Empfänger und Texte prüfen'));assert(!panel.includes('data-gab-notice-send'));
 ctx.STATE.version='1.13.3';assert(ctx.gaGabNoticeAdminPanel().includes('Code.gs 1.13.4'));
 ctx.STATE.version='1.13.4';ctx.STATE.user.Rolle='Teilnehmer';assert.equal(ctx.gaGabNoticeAdminPanel(),'');
 ctx.STATE.user.Rolle='Administrator';ctx.GA_ROLE_PREVIEW='other';assert.equal(ctx.gaGabNoticeAdminPanel(),'');ctx.GA_ROLE_PREVIEW='';
 await ctx.gaGabNoticePreview();assert.equal(ctx.GA_GAB_NOTICE_PREVIEW.Teilnehmer.length,12);
 panel=ctx.gaGabNoticeAdminPanel();assert(panel.includes('Gratulation an 12 Teilnehmer senden'));
 assert(panel.includes('&lt;Person&gt;'));assert(!panel.includes('<Person>'));
 confirmValue=false;await ctx.gaGabNoticeSend();assert.equal(calls.filter(x=>x.method==='sendGabCompletionNotices').length,0);
 confirmValue=true;await ctx.gaGabNoticeSend();
 const batches=calls.filter(x=>x.method==='sendGabCompletionNotices').map(x=>x.payload.MitgliedIDs.length);
 assert.deepEqual(batches,[5,5,2]);assert.match(tips.at(-1).text,/12 Abschlussnachrichten erstellt/);
 assert.equal(ctx.GA_GAB_NOTICE_BUSY,false);assert(renders>=4);
 // A changed session cannot display old personal preview results.
 let resolve;ctx.GA_GAB_NOTICE_PREVIEW=null;ctx.api=()=>new Promise(r=>{resolve=r;});
 const loading=ctx.gaGabNoticePreview();ctx.TOKEN='new-token';resolve({Teilnehmer:makeItems(1)});await loading;
 assert.equal(ctx.GA_GAB_NOTICE_PREVIEW,null);
 console.log('GAB notice UI: role gating, backend version, safe preview, explicit send, batching and session race passed.');
})().catch(e=>{console.error(e);process.exitCode=1;});
