'use strict';
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'..','organizer-ui.js'),'utf8');
const ctx=vm.createContext({console,STATE:{user:{ID:'org'},kurse:[],termine:[],mitglieder:[],
 turnusse:[{ID:'adv',Bezeichnung:'Erweitert',Aktiv:'JA'},{ID:'old',Bezeichnung:'Alt',Aktiv:'NEIN'}],
 gabAbgeschlossen:[{ID:'one',Vorname:'Erste',Nachname:'Person',ErweiterteTurnusIDs:[]},
 {ID:'two',Vorname:'Zweite',Nachname:'Person',ErweiterteTurnusIDs:['adv']}]},
 h:s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;'),
 gaTrainingUpcoming:()=>false,gaTrainingTimestamp:()=>0,gaTrainerTime:s=>String(s||''),
 by:(items,id)=>(items||[]).find(x=>x.ID===id),role:()=> 'Organisator Erweiterte Ausbildung',
 gaMetric:(n,label)=>`${n} ${label}`,document:{getElementById:()=>null}});
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','admin-ui.js'),'utf8'),ctx,{filename:'admin-ui.js'});
vm.runInContext(source,ctx,{filename:'organizer-ui.js'});
const overview=ctx.gaOrganizerOverview(),list=ctx.gaOrganizerReady();
assert(overview.includes('1 noch ohne Verwaltungsfreigabe'));assert(overview.includes('data-view="advReady"'));
assert(list.includes('Erste Person'));assert(list.includes('Zweite Person'));assert(list.includes('Noch nicht zugeordnet'));
assert(list.includes('Als Gast zugeordnet · Überstellung offen'));assert(list.includes('name="MitgliedID" value="one"'));
assert(list.includes('Erweiterter Turnus')||list.includes('Turnus auswählen'));
assert(list.includes('value="adv"'));assert(!list.includes('value="old"'));
assert(list.includes('GAB-Turnus'));
delete ctx.STATE.gabAbgeschlossen;assert(ctx.gaOrganizerReady().includes('Code.gs 1.13.3'));
console.log('Organizer handover overview: existing and new assignments, active cohorts and old backend guard passed.');
