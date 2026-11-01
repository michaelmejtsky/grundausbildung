'use strict';
// Dashboard-Prüfung ausschließlich im Speicher; keine Produktivkonten oder Sheets.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const base=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(base,'index.html'),'utf8');
function extract(name){const start=html.indexOf('function '+name+'(');assert(start>=0,name);
 const end=name==='gaTrainingUpcoming'?html.indexOf('\n\nconst name=',start):html.indexOf('\nfunction ',start+1);
 assert(end>start,name);return html.slice(start,end);}
const h=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ctx=vm.createContext({console,Date,Intl,Set,Map,h,VIEW:'overview',
 document:{getElementById:()=>null},by:(rows,id)=>(rows||[]).find(x=>x.ID===id),
 STATE:{user:{ID:'admin',Name:'Michael Beispiel',Rolle:'Administrator'},rechte:{},meMember:null,
  mitglieder:[{ID:'m1',Aktiv:'JA'},{ID:'m2',Aktiv:'JA'},{ID:'m3',Aktiv:'NEIN'}],
  qualifikationen:[{MitgliedID:'m1',Name:'Eins Beispiel',GABAbgeschlossen:true,ErsteHilfeStatus:'Bestätigt'},
   {MitgliedID:'m2',Name:'<script>offen</script>',GABAbgeschlossen:false,ErsteHilfeStatus:'Ausständig',GABHinweis:'Block B offen'},
   {MitgliedID:'m3',Name:'Inaktiv',GABAbgeschlossen:false,ErsteHilfeStatus:'Ausständig'}],
  checks:[{MitgliedID:'m1',Status:'Offen'},{MitgliedID:'m1',Status:'Offen'},{MitgliedID:'m2',Status:'Erledigt'},{MitgliedID:'m3',Status:'Offen'}],
  ersteHilfeNachweise:[{MitgliedID:'m1',Status:'Eingereicht'},{MitgliedID:'m2',Status:'Eingereicht'},
   {MitgliedID:'m3',Status:'Eingereicht'},{MitgliedID:'m1',Status:'Bestätigt'}],
  kursProjekte:[{ID:'p1',Status:'Zur Prüfung'},{ID:'p2',Status:'Veröffentlicht'}],
  meldungen:[{ID:'r1',Status:'Offen'},{ID:'r2',Status:'In Bearbeitung'},{ID:'r3',Status:'Erledigt'}],
  kurse:[{ID:'g',Titel:'GAB Modul',Bereich:'Grundausbildung'},{ID:'e',Titel:'Erweiterter Kurs',Bereich:'Erweiterte Ausbildung'}],
  turnusse:[{ID:'gt',Bezeichnung:'GAB',Bereich:'Grundausbildung'},{ID:'et',Bezeichnung:'Erweitert',Bereich:'Erweiterte Ausbildung'}],
  termine:[{ID:'past',KursID:'g',TurnusID:'gt',Beginn:'2026-10-29T08:00',Ende:'2026-10-29T10:00',Status:'Geplant'},
   {ID:'future',KursID:'g',TurnusID:'gt',Beginn:'2026-11-03T08:00',Ende:'2026-11-03T10:00',Status:'Geplant'},
   {ID:'ongoing',KursID:'e',TurnusID:'et',Beginn:'2026-11-01T08:00',Ende:'2026-11-01T12:00',Status:'Geplant'},
   {ID:'finished',KursID:'g',TurnusID:'gt',Beginn:'2026-11-04T08:00',Status:'Durchgeführt'}],
  benachrichtigungen:[{ID:'n1',Titel:'<Mitteilung>',GelesenAm:'',ErstelltAm:'2026-10-31T12:00'},
   {ID:'n2',Titel:'Schon gelesen',GelesenAm:'2026-10-31T12:00'}]}});
ctx.role=()=>ctx.STATE?.user?.Rolle;
vm.runInContext(['gaTrainingTimestamp','gaTrainingUpcoming','gaTrainerTime','navs'].map(extract).join('\n'),ctx);
vm.runInContext(fs.readFileSync(path.join(base,'admin-ui.js'),'utf8'),ctx,{filename:'admin-ui.js'});
vm.runInContext(fs.readFileSync(path.join(base,'organizer-ui.js'),'utf8'),ctx,{filename:'organizer-ui.js'});
const now=new Date(2026,10,1,9,0).getTime(),before=JSON.stringify(ctx.STATE),admin=ctx.overview(now);
assert(admin.includes('Servus, Michael!'));assert(admin.includes('Aktive Mitglieder'));assert(admin.includes('Offene Checklistenpunkte'));
assert(admin.includes('2 offene')||admin.includes('>2</strong><span>Offene Checklistenpunkte'));
assert(admin.includes('1 Mitglieder mit Aufgaben'));assert(admin.includes('>1</span><span><strong>Erste-Hilfe-Nachweise'));
assert(admin.includes('>2</span><span><strong>Mängel &amp; Ideen'));assert(admin.includes('1 GAB abgeschlossen · 1 noch offen'));
assert(admin.includes('data-go-qual="m2"'));assert(!admin.includes('Inaktiv'));assert(!admin.includes('<script>offen</script>'));
assert(admin.includes('&lt;script&gt;offen&lt;/script&gt;'));assert(admin.includes('&lt;Mitteilung&gt;'));assert(!admin.includes('Schon gelesen'));
assert(admin.includes('data-training-open="ongoing"'));assert(admin.includes('data-training-open="future"'));
assert(!admin.includes('data-training-open="past"'));assert(!admin.includes('data-training-open="finished"'));
assert(admin.indexOf('data-training-open="ongoing"')<admin.indexOf('data-training-open="future"'));
assert.equal(JSON.stringify(ctx.STATE),before);
function verifyNavigation(page){const allowed=new Set(Array.from(ctx.navs(),x=>x[0]));
 for(const match of page.matchAll(/data-view="([^"]+)"/g))assert(allowed.has(match[1]),'Inaccessible shortcut: '+match[1]);}
verifyNavigation(admin);
ctx.STATE={...ctx.STATE,user:{ID:'org',Name:'Anna Beispiel',Rolle:'Organisator Erweiterte Ausbildung'},organisatorErweitert:true,
 mitglieder:[{ID:'x',Aktiv:'JA'},{ID:'y',Aktiv:'NEIN'}],
 kurse:[{ID:'e',Titel:'Erweiterter Kurs',Bereich:'Erweiterte Ausbildung'}],
 turnusse:[{ID:'et',Bezeichnung:'Erweitert',Bereich:'Erweiterte Ausbildung'}],
 termine:[{ID:'only-extended',KursID:'e',TurnusID:'et',Beginn:'2026-11-03T08:00',Status:'Geplant'}],
 gabAbgeschlossen:[{ID:'a',Vorname:'<A>',Nachname:'Beispiel',ErweiterteTurnusIDs:[]},
  {ID:'b',Vorname:'Schon',Nachname:'Zugeordnet',ErweiterteTurnusIDs:['et']}],
 kursProjekte:[{Status:'Zur Prüfung'},{Status:'Veröffentlicht'}],meldungen:[{Status:'Offen'},{Status:'Erledigt'}],
 benachrichtigungen:[{Titel:'Eine Nachricht',GelesenAm:'',ErstelltAm:'2026-10-30T12:00'}]};
const orgBefore=JSON.stringify(ctx.STATE),org=ctx.gaOrganizerOverview(now);
assert(org.includes('Servus, Anna!'));assert(org.includes('1 noch ohne erweiterten Turnus'));
assert(org.includes('&lt;A&gt; Beispiel'));assert(!org.includes('Schon Zugeordnet'));
assert(org.includes('data-training-open="only-extended"'));assert(!org.includes('GAB Modul'));
assert(org.includes('data-view="advReady"'));assert(org.includes('data-view="advMembers"'));
assert(org.includes('Eine Nachricht'));assert.equal(JSON.stringify(ctx.STATE),orgBefore);verifyNavigation(org);
delete ctx.STATE.gabAbgeschlossen;const legacy=ctx.gaOrganizerOverview(now);
assert(legacy.includes('Derzeit nicht verfügbar'));assert(legacy.includes('Übersicht ist mit dem aktuell verbundenen Backend noch nicht verfügbar'));
assert(!legacy.includes('Derzeit warten keine GAB-Absolventen'));
console.log('Dashboard homes: counts, active members, handover, old backend, escaping, dates, navigation and read-only data passed.');
