'use strict';
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'admin-ui.js'),'utf8'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const state={user:{Rolle:'Administrator'},turnusse:[{ID:'g',Bezeichnung:'GAB 2026',Bereich:'Grundausbildung',Aktiv:'JA'}],mitglieder:[{ID:'m',Vorname:'Anna',Nachname:'Beispiel',TurnusID:'g'}],checks:[],checklistenpunkte:[],verwaltungsMails:{Version:1,TransponderEmpfaenger:'access@example.test',BlockBEmpfaenger:'abschluss@example.test',TriggerAktiv:true,Verlauf:[]}};
const handlers={},messages=[],calls=[];
const context=vm.createContext({STATE:state,role:()=>context.STATE.user.Rolle,h:esc,by:(r,id)=>(r||[]).find(x=>x.ID===id),name:m=>m.Vorname+' '+m.Nachname,option:()=>'',gaShortDate:s=>s,dt:esc,
 document:{getElementById:()=>({addEventListener:(event,handler)=>{(handlers[event]??=[]).push(handler);}})},GA_ROLE_PREVIEW:'',confirm:()=>false,api:async(m,d)=>{calls.push({m,d});return {message:'Gesendet'};},tip:s=>messages.push(s),reload:async()=>{}});
vm.runInContext(source,context,{filename:'admin-ui.js'});
let page=context.gaAdminMailPage();assert(page.includes('access@example.test'));assert(page.includes('abschluss@example.test'));assert(page.includes('5 Minuten'));assert(page.includes('data-form="adminMailSettings"'));assert.equal((page.match(/type="email" multiple/g)||[]).length,5);assert(page.includes('Mehrere Adressen mit Komma trennen'));
let form=context.gaMemberForm(null);assert(form.includes('Transponder für Zugang erforderlich'));assert(form.includes('name="TransponderErforderlich"'));
state.checklistenpunkte=[{ID:'point',Titel:'Transponder für Zugang'}];state.checks=[{MitgliedID:'m',PunktID:'point',Status:'Offen'}];
form=context.gaTransponderFields(state.mitglieder[0]);assert.match(form,/TransponderErforderlich" value="JA" checked/);
state.checks[0].Status='Erledigt';form=context.gaTransponderFields(state.mitglieder[0]);assert(form.includes('bereits erledigt'));assert(!form.includes('name="TransponderErforderlich"'));
state.verwaltungsMails.Verlauf=[{ID:'queue',Art:'transponder',Status:'Fehler',Name:'<img onerror=alert(1)>',Hinweis:'<script>bad</script>'}];
page=context.gaAdminMailPage();assert(!page.includes('<img onerror'));assert(!page.includes('<script>bad'));assert(page.includes('&lt;script&gt;bad'));
assert(page.includes('data-admin-mail-retry="queue"'));
state.user.Rolle='Ausbilder';assert.equal(context.gaAdminMailPage(),'');assert.equal(context.gaTransponderFields(null),'');
state.user.Rolle='Organisator Erweiterte Ausbildung';assert.equal(context.gaAdminMailPage(),'');
state.user.Rolle='Administrator';const current=state.verwaltungsMails;delete state.verwaltungsMails;
assert(context.gaAdminMailPage().includes('Code.gs 1.13.8'));assert(!context.gaTransponderFields(null).includes('name="TransponderErforderlich"'));state.verwaltungsMails=current;
assert(html.includes("data.TransponderErforderlich=fd.has('TransponderErforderlich')?'JA':'NEIN'"));
assert(html.includes("['adminMails','Verwaltungs-Mails']"));assert(html.includes("type==='adminMailSettings'"));
(async()=>{
 const retry=handlers.click.find(fn=>String(fn).includes('[data-admin-mail-retry]')),button={disabled:false,dataset:{adminMailRetry:'queue'}};
 await retry({target:{closest:()=>button}});assert.equal(calls.length,0,'Cancel must not send mail');
 context.confirm=()=>true;await retry({target:{closest:()=>button}});assert.equal(calls.length,1);assert.equal(calls[0].m,'retryAdminMail');
 context.GA_ROLE_PREVIEW='person';await retry({target:{closest:()=>button}});assert.equal(calls.length,1,'Role preview stays read only');
 console.log('Administration mail UI: settings, optional checkbox, completed protection, roles, backend fallback, escaped status and explicit retry passed.');
})().catch(e=>{console.error(e);process.exitCode=1;});

state.user.Rolle='Administrator';state.verwaltungsMails.BlaulichtSMSLea=true;state.verwaltungsMails.BlaulichtEmpfaenger='lea@example.test';
state.checklistenpunkte.push({ID:'lea',Titel:'Blaulicht SMS/Lea'});
let leaForm=context.gaBlaulichtFields(state.mitglieder[0]);assert(leaForm.includes('name="BlaulichtErforderlich"'));assert(leaForm.includes('Registrierung und Zuordnung erforderlich'));
state.checks.push({MitgliedID:'m',PunktID:'lea',Status:'Offen'});leaForm=context.gaBlaulichtFields(state.mitglieder[0]);assert.match(leaForm,/BlaulichtErforderlich" value="JA" checked/);
state.checks.at(-1).Status='Erledigt';leaForm=context.gaBlaulichtFields(state.mitglieder[0]);assert(leaForm.includes('bereits registriert und zugeordnet'));assert(!leaForm.includes('name="BlaulichtErforderlich"'));
assert(context.gaAdminMailPage().includes('lea@example.test'));assert(html.includes("data.BlaulichtErforderlich=fd.has('BlaulichtErforderlich')?'JA':'NEIN'"));
state.verwaltungsMails.BlaulichtSMSLea=false;assert(!context.gaBlaulichtFields(null).includes('name="BlaulichtErforderlich"'));assert(context.gaBlaulichtFields(null).includes('1.13.9'));
state.user.Rolle='Ausbilder';assert.equal(context.gaBlaulichtFields(null),'');state.user.Rolle='Administrator';
