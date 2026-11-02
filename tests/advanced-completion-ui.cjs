'use strict';
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'organizer-ui.js'),'utf8'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const handlers={},calls=[],messages=[];let accepted=false,reloads=0;
const app={addEventListener:(type,fn)=>{(handlers[type]??=[]).push(fn);}};
const person={ID:'guest',Vorname:'Alex',Nachname:'Beispiel',Aktiv:'JA',TurnusID:'g',Ausbildungsweg:'GAB-Gast'};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ctx=vm.createContext({console,Date,JSON,Set,Map,document:{getElementById:id=>id==='app'?app:null},
 STATE:{user:{ID:'org',Rolle:'Organisator Erweiterte Ausbildung'},mitglieder:[person],kurse:[],termine:[],teilnahmen:[],quizVersuche:[],quizKurse:[],erweiterteZuordnungen:[],erweiterteAbschluesse:[]},
 GA_ROLE_PREVIEW:'',h:esc,name:m=>m.Vorname+' '+m.Nachname,gaTrainerTime:x=>String(x||''),
 confirm:()=>accepted,tip:(m,error)=>messages.push({m,error}),reload:async()=>{reloads++;},
 api:async(method,payload)=>{calls.push({method,payload});return {ok:true,benachrichtigt:true,message:'Gespeichert'};}});
vm.runInContext(source,ctx,{filename:'organizer-ui.js'});
let output=ctx.gaOrganizerQualifications();assert(output.includes('data-adv-complete="guest"'));
assert(output.includes('GAB-Dokumentation bleibt verborgen'));
delete ctx.STATE.erweiterteAbschluesse;output=ctx.gaOrganizerQualifications();assert(output.includes('Code.gs 1.13.4'));assert(!output.includes('data-adv-complete="guest"'));
ctx.STATE.erweiterteAbschluesse=[{MitgliedID:'guest',AbgeschlossenAm:'2026-11-02',Benachrichtigt:true}];
output=ctx.gaOrganizerQualifications();assert(output.includes('Erweiterte Ausbildung abgeschlossen'));assert(!output.includes('data-adv-complete="guest"'));
ctx.STATE.erweiterteAbschluesse=[{MitgliedID:'guest',AbgeschlossenAm:'2026-11-02',Benachrichtigt:false}];
assert(ctx.gaOrganizerQualifications().includes('Glückwunsch erneut prüfen'));
ctx.STATE.erweiterteAbschluesse=[{MitgliedID:'guest',Fehler:'beschädigt'}];
assert(ctx.gaOrganizerQualifications().includes('Administrator geprüft'));assert(!ctx.gaOrganizerQualifications().includes('data-adv-complete="guest"'));
ctx.STATE.erweiterteAbschluesse=[];
const button={dataset:{advComplete:'guest',advOpen:'1'},disabled:false},event={target:{closest:()=>button}};
(async()=>{
 ctx.GA_ROLE_PREVIEW='org';await handlers.click[0](event);assert.equal(calls.length,0);
 ctx.GA_ROLE_PREVIEW='';accepted=false;await handlers.click[0](event);assert.equal(calls.length,0);
 accepted=true;await handlers.click[0](event);assert.equal(calls.length,1);assert.equal(calls[0].method,'completeAdvancedTraining');
 assert.equal(calls[0].payload.MitgliedID,'guest');assert.equal(reloads,1);assert.equal(button.disabled,false);
 // Participant sees only a completion delivered in their own state.
 const start=html.indexOf('function mine(){'),end=html.indexOf('\nfunction myterms()',start);assert(start>=0&&end>start);
 const pc=vm.createContext({console,Date,JSON,Set,Map,h:esc,STATE:{user:{Name:'Alex'},meMember:{...person},
  qualifikationen:[],teilnahmen:[],checks:[],erweiterteZuordnungen:[],termine:[],kurse:[],quizKurse:[],checklistenpunkte:[],
  erweiterteAbschluesse:[{MitgliedID:'guest',AbgeschlossenAm:'2026-11-02'}]},
 arr:x=>Array.isArray(x)?x:[],by:(rows,id)=>(rows||[]).find(x=>x.ID===id),gaTrainingUpcoming:()=>false,
 gaTrainerTime:x=>String(x),gaStatusBadge:(b,a,c)=>b?a:c,gaParticipantDiagnosticBox:()=>'',aidPanel:()=>'',dt:x=>String(x||''),qCourseBadge:()=>''});
 vm.runInContext(html.slice(start,end),pc);assert(pc.mine().includes('Erweiterte Ausbildung abgeschlossen'));
 pc.STATE.erweiterteAbschluesse=[{MitgliedID:'another',AbgeschlossenAm:'2026-11-02'}];assert(!pc.mine().includes('Erweiterte Ausbildung abgeschlossen'));
 console.log('Advanced completion UI: scoped status, backend compatibility, safe action and participant view passed.');
})().catch(e=>{console.error(e);process.exitCode=1;});
