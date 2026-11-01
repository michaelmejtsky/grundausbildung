'use strict';
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const start=html.indexOf('async function api(action,payload={})'),end=html.indexOf('\nfunction role()',start);
assert(start>=0&&end>start);
const elements={},messages=[],calls=[],savedHandlers={};
function element(id){return elements[id]??=(function(){const classes=new Set();return {id,disabled:false,value:'',textContent:'',innerHTML:'',
 classList:{add:c=>classes.add(c),remove:c=>classes.delete(c),toggle:(c,on)=>{if(on===undefined){if(classes.has(c)){classes.delete(c);return false;}classes.add(c);return true;}on?classes.add(c):classes.delete(c);return on;},contains:c=>classes.has(c)},
 addEventListener:(type,fn,capture)=>{savedHandlers[id+':'+type+(capture?':capture':'')]=fn;}};})();}
const admin={ID:'a',Name:'Admin',Rolle:'Administrator'},participant={ID:'p',Name:'Teilnehmer',Rolle:'Teilnehmer'};
const roster=[{...admin,Email:'a@example.test',Aktiv:'JA'}, {...participant,Email:'p@example.test',Aktiv:'JA'},
 {ID:'o',Name:'Org',Rolle:'Organisator Erweiterte Ausbildung',Email:'o@example.test',Aktiv:'JA'},
 {ID:'i',Name:'Inaktiv',Rolle:'Ausbilder',Aktiv:'NEIN'}];
let legacy=false,resolveSlow=null;
const context=vm.createContext({console,Set,JSON,document:{body:{classList:{remove(){}}}},$:element,
 h:s=>String(s??'').replaceAll('<','&lt;').replaceAll('>','&gt;'),
 TOKEN:'token',STATE:{user:admin,benutzer:roster},VIEW:'overview',FORM:'',EDIT:null,TERM:null,PROJECT_REVIEW_ID:'',
 GA_ROLE_PREVIEW:'',GA_ADMIN_ADV_VIEW:false,GA_ADMIN_USERS:[],GA_VIEW_BUSY:false,
 role:()=>context.STATE?.user?.Rolle,render:()=>{context.rendered=(context.rendered||0)+1;},tip:(s,error)=>messages.push({s,error}),
 rpc:async(_fn,method,data,token)=>{calls.push({method,data,token});if(method==='slow')return new Promise(resolve=>{resolveSlow=resolve;});
  if(method!=='state')return {ok:true};
  if(legacy)return {user:admin,benutzer:roster};
  if(data._gaRolePreview)return {administratorRollenvorschau:true,user:roster.find(x=>x.ID===data._gaRolePreview)};
  if(data._gaAdvancedView)return {administratorErweitert:true,organisatorErweitert:true,user:{...admin,Rolle:'Organisator Erweiterte Ausbildung'}};
  return {user:admin,benutzer:roster};}
});
vm.runInContext(html.slice(start,end),context,{filename:'index-view-switch.js'});
(async()=>{
 context.gaUpdateViewControls();assert.equal(element('gaViewButton').textContent,'👁 Ansicht wechseln');
 savedHandlers['gaViewButton:click']();assert(element('gaViewAccount').innerHTML.includes('Teilnehmer'));
 assert(element('gaViewAccount').innerHTML.includes('Organisator Erweiterte Ausbildung'));assert(!element('gaViewAccount').innerHTML.includes('Inaktiv'));
 await context.gaSwitchView('preview','p');assert.equal(context.STATE.user.ID,'p');assert.equal(context.GA_ROLE_PREVIEW,'p');
 context.gaUpdateViewControls();assert.match(element('gaViewBanner').textContent,/Schreibgeschützte Vorschau/);
 await context.api('state');assert.equal(calls.at(-1).data._gaRolePreview,'p');
 await assert.rejects(context.api('saveQualification',{}),/schreibgeschützt/);
 let prevented=false,stopped=false;savedHandlers['app:submit:capture']({target:{closest:()=>({})},preventDefault:()=>{prevented=true;},stopImmediatePropagation:()=>{stopped=true;}});
 assert(prevented&&stopped);
 await context.gaSwitchView('admin');assert.equal(context.STATE.user.Rolle,'Administrator');assert.equal(context.GA_ROLE_PREVIEW,'');
 await context.gaSwitchView('advanced');assert.equal(context.GA_ADMIN_ADV_VIEW,true);assert.equal(context.STATE.user.ID,'a');
 await context.api('saveAdvancedEnrollment',{MitgliedID:'m'});assert.equal(calls.at(-1).data._gaAdvancedView,true);
 await context.gaSwitchView('admin');assert.equal(context.GA_ADMIN_ADV_VIEW,false);
 legacy=true;const before=context.STATE;await context.gaSwitchView('preview','p');assert.equal(context.STATE,before);
 assert.equal(context.GA_ROLE_PREVIEW,'');assert.match(messages.at(-1).s,/Code.gs 1\.13\.3/);
 legacy=false;
 // A pending old-scope refresh may not overwrite a newly switched role.
 const originalRpc=context.rpc;let complete;
 context.rpc=(_fn,method,data)=>method==='state'&&Object.keys(data).length===0?new Promise(resolve=>{complete=resolve;}):originalRpc(_fn,method,data,'token');
 const refreshing=context.reload();await context.gaSwitchView('preview','p');complete({user:admin,benutzer:roster});await refreshing;
 assert.equal(context.STATE.user.ID,'p');
 console.log('Role UI: selection, read-only guards, advanced scope, legacy backend and refresh races passed.');
})().catch(e=>{console.error(e);process.exitCode=1;});
