/**
 * GRUNDAUSBILDUNG – Feuerwehr Ausbildungsplattform V1.0
 * Backend: an Google Sheet gebundenes Google Apps Script.
 * Ausführung als Eigentümer, kein Zugriff auf das Sheet für andere Nutzer nötig.
 * Zugang: eigene Benutzerkonten mit Passwort (Pilotbetrieb, siehe README).
 * Wichtig: die Google Tabelle NICHT für Teilnehmer freigeben.
 */
const GA = Object.freeze({
  VERSION: '1.5.2',
  SHEETS: {
    Benutzer: ['ID','Name','Email','Rolle','Bereich','Aktiv','Salt','Hash','ErstelltAm'],
    Turnusse: ['ID','Bezeichnung','Bereich','Aktiv','ErstelltAm'],
    Mitglieder: ['ID','Vorname','Nachname','Email','Telefon','TurnusID','Aktiv','ErstelltAm','Geburtsdatum','Standesbuchnummer','Ausbildungsweg'],
    Kurse: ['ID','Titel','Bereich','Inhalt','Lernziele','Links','Aktiv','ErstelltAm'],
    Termine: ['ID','KursID','TurnusID','Beginn','Ende','Ort','Status','ErstelltAm'],
    Teilnahmen: ['ID','TerminID','MitgliedID','Anwesend','AusbilderIDs','BestaetigtVon','BestaetigtAm'],
    Checklistenpunkte: ['ID','Titel','Bereich','Zustaendig','Aktiv','ErstelltAm'],
    MitgliedChecks: ['ID','MitgliedID','PunktID','Status','Kommentar','GeaendertVon','GeaendertAm'],
    Nachrichten: ['ID','Titel','Text','TurnusID','VonBenutzerID','ErstelltAm'],
    Benachrichtigungen: ['ID','BenutzerID','Typ','Titel','Text','BezugID','ErstelltAm','GelesenAm','PushStatus'],
    Protokoll: ['ID','Zeit','BenutzerID','Aktion','Entitaet','EntitaetID','Details'],
    Einladungen: ['ID','BenutzerID','Email','TokenHash','ExpiresAt','UsedAt','Status','ErstelltVon','ErstelltAm'],
    PushGeraete: ['ID','BenutzerID','Endpoint','P256DH','Auth','Aktiv','AktualisiertAm'],
    PushRegeln: ['ID','BenutzerID','Nachrichten','Termine','Aufgaben','AktualisiertAm','Bewertungen'],
    Berechtigungen: ['ID','BenutzerID','KurseGestalten','KurseFreigeben','TerminePlanen','MeldungenBearbeiten','BewertungenAnsehen','AktualisiertAm','KurseBearbeiten','FrageboegenBearbeiten'],
    KursProjekte: ['ID','KursID','Titel','Bereich','Typ','Inhalt','Lernziele','PraesentationURL','WeitereLinks','Status','ErstelltVon','ErstelltAm','GeaendertVon','GeaendertAm','GeprueftVon','GeprueftAm','Rueckmeldung'],
    Meldungen: ['ID','Kategorie','Titel','Beschreibung','KursID','Status','ErstelltVon','ErstelltAm','BearbeitetVon','BearbeitetAm','Rueckmeldung'],
    Bewertungen: ['ID','TerminID','KursID','MitgliedID','Sterne','Kommentar','ErstelltAm','AktualisiertAm','FragebogenID','FragebogenVersion','FragenSnapshotJSON','AntwortenJSON','Positives','Verbesserungen','Ideen'],
    QualifikationMitglieder: ['ID','MitgliedID','Geburtsdatum','ErsteHilfeStatus','ErsteHilfeBestaetigtAm','FDISKEintragDatum','GABFreigabe','Notiz','GeprueftVon','GeprueftAm','GABAnerkannt','FDISKPlatzhalter'],
    KursAnforderungen: ['ID','KursID','PflichtGAB','PflichtBSW','AktualisiertVon','AktualisiertAm'],
    Direktnachrichten: ['ID','VonBenutzerID','AnBenutzerID','Titel','Text','ErstelltAm','GelesenAm'],
    BewertungsFrageboegen: ['ID','KursID','FragenJSON','Version','Aktiv','AktualisiertVon','AktualisiertAm']
  },
  ROLES: ['Administrator','Ausbilder','Teilnehmer','Fachverwaltung'],
  AREAS: ['Grundausbildung','Erweiterte Ausbildung'],
  CHECK_STATUSES: ['Offen','Erledigt','Nicht erforderlich']
});

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Grundausbildung')
    .addItem('1 · Tabellen prüfen/erstellen','gaEinrichten')
    .addItem('2 · Ersten Administrator einrichten','gaErstenAdminEinrichten')
    .addItem('3 · Systemprüfung','gaSystemPruefen')
    .addItem('4 · Worker-Schlüssel einrichten','gaWorkerSchluesselEinrichten')
    .addItem('5 · Push-Speicher und Trigger einrichten','gaPushEinrichten').addToUi();
}

function gaSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Dieses Skript muss über Erweiterungen → Apps Script an die Grundausbildung-Tabelle gebunden werden.');
  return ss;
}
function gaEinrichten() {
  const ss=gaSheet_();
  Object.keys(GA.SHEETS).forEach(name=>{
    let sh=ss.getSheetByName(name);
    if(!sh) sh=ss.insertSheet(name);
    const headers=GA.SHEETS[name];
    if(sh.getLastRow()===0) sh.getRange(1,1,1,headers.length).setValues([headers]);
    else {
      const got=sh.getRange(1,1,1,headers.length).getDisplayValues()[0];
      if(headers.some((h,i)=>h!==got[i])) throw new Error('Unerwartete Spalten in '+name+' – aus Sicherheitsgründen nicht überschrieben.');
    }
    sh.setFrozenRows(1);
    sh.getRange(1,1,1,headers.length).setBackground('#E8EDF3').setFontWeight('bold');
  });
  const courses=gaRows_('Kurse');
  if(!courses.some(c=>c.Titel==='Wasserführende Armaturen')) gaAppend_('Kurse',{
    ID:gaId_(),Titel:'Wasserführende Armaturen',Bereich:'Grundausbildung',
    Inhalt:'Armaturen kennen lernen; Aufbau einer Löschleitung; praktische Anwendung',
    Lernziele:'Armaturen sicher benennen und anwenden',Links:'',Aktiv:'JA',ErstelltAm:gaNow_()
  });
  const defaults=[
    ['Einsatzbekleidung erhalten','Alle','Zeugkammer'],
    ['Dienstbekleidung erhalten','Alle','Zeugkammer'],
    ['FDISK-Stammdaten geprüft','Alle','Administration'],
    ['Feuerwehr-E-Mail eingerichtet','Alle','Administration'],
    ['Erste-Hilfe-Bescheinigung abgegeben','Grundausbildung','Administration']
  ];
  const existing=gaRows_('Checklistenpunkte').map(x=>x.Titel);
  defaults.forEach(v=>{if(!existing.includes(v[0]))gaAppend_('Checklistenpunkte',{
    ID:gaId_(),Titel:v[0],Bereich:v[1],Zustaendig:v[2],Aktiv:'JA',ErstelltAm:gaNow_()
  });});
  SpreadsheetApp.getUi().alert('Grundausbildung bereit: '+Object.keys(GA.SHEETS).length+' Datentabellen, Beispielkurs und Checklistenpunkte geprüft. Vorhandene Daten wurden nicht gelöscht.');
}
function gaErstenAdminEinrichten() {
  const ui=SpreadsheetApp.getUi();
  if(!gaSheet_().getSheetByName('Benutzer')) throw new Error('Zuerst Menüpunkt 1 ausführen.');
  if(gaRows_('Benutzer').some(u=>u.Rolle==='Administrator'&&u.Aktiv==='JA')) {
    ui.alert('Es existiert bereits ein aktiver Administrator. Es wird kein weiterer Erstzugang erstellt.');return;
  }
  const em=ui.prompt('Erster Administrator','Deine E-Mail-Adresse (für die Anmeldung):',ui.ButtonSet.OK_CANCEL);
  if(em.getSelectedButton()!==ui.Button.OK) return;
  const name=ui.prompt('Erster Administrator','Name des Administrators:',ui.ButtonSet.OK_CANCEL);
  if(name.getSelectedButton()!==ui.Button.OK) return;
  const pw=ui.prompt('Erster Administrator','Sicheres Passwort (mind. 12 Zeichen). Achtung: Dieses Dialog-Eingabefeld zeigt die Eingabe sichtbar an.',ui.ButtonSet.OK_CANCEL);
  if(pw.getSelectedButton()!==ui.Button.OK) return;
  const password=pw.getResponseText();
  if(!gaEmail_(em.getResponseText())||password.length<12) throw new Error('Gültige E-Mail und Passwort mit mindestens 12 Zeichen erforderlich.');
  const salt=gaId_()+gaId_();
  gaAppend_('Benutzer',{ID:gaId_(),Name:gaText_(name.getResponseText(),120),Email:em.getResponseText().trim().toLowerCase(),
    Rolle:'Administrator',Bereich:'Administration',Aktiv:'JA',Salt:salt,Hash:gaHash_(password,salt),ErstelltAm:gaNow_()});
  ui.alert('Administrator eingerichtet! Benutze diese E-Mail und dein Passwort im Web-App-Login. Bitte die Google Tabelle privat halten.');
}
function gaSystemPruefen() {
  const names=Object.keys(GA.SHEETS);
  const missing=names.filter(n=>!gaSheet_().getSheetByName(n));
  SpreadsheetApp.getUi().alert(missing.length?'Fehlende Tabellen: '+missing.join(', '):
    'OK · '+names.length+' Tabellen; '+gaRows_('Benutzer').length+' Benutzer; '+gaRows_('Kurse').length+' Kurse; '+gaRows_('Mitglieder').length+' Mitglieder.');
}
function doGet(){return ContentService.createTextOutput('Grundausbildung API – Oberfläche über GitHub Pages öffnen.');}

function gaId_(){return Utilities.getUuid();}
function gaNow_(){return Utilities.formatDate(new Date(),Session.getScriptTimeZone()||'Europe/Vienna',"yyyy-MM-dd'T'HH:mm:ss");}
function gaText_(x,max){return String(x===undefined||x===null?'':x).trim().slice(0,max||3000);}
function gaCell_(x){const v=String(x===undefined||x===null?'':x);return /^[\s]*[=+@-]/.test(v)?"'"+v:v;}
function gaEmail_(x){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(x||'').trim());}
function gaBool_(x){return String(x).toUpperCase()==='JA';}
function gaRows_(name){
  const sh=gaSheet_().getSheetByName(name); if(!sh)throw new Error('Fehlendes Blatt '+name+'. Bitte zuerst einrichten.');
  const last=sh.getLastRow(); if(last<2)return [];
  const h=GA.SHEETS[name],v=sh.getRange(2,1,last-1,h.length).getDisplayValues();
  return v.filter(r=>r[0]).map(r=>Object.fromEntries(h.map((k,i)=>[k,r[i]])));
}
function gaAppend_(name,obj){const sh=gaSheet_().getSheetByName(name);sh.appendRow(GA.SHEETS[name].map(k=>gaCell_(obj[k])));return obj;}
function gaReplace_(name,id,changes){
  const sh=gaSheet_().getSheetByName(name),rows=gaRows_(name),at=rows.findIndex(x=>x.ID===id);
  if(at<0)throw new Error('Eintrag nicht gefunden.');
  const row=Object.assign({},rows[at],changes);
  sh.getRange(at+2,1,1,GA.SHEETS[name].length).setValues([GA.SHEETS[name].map(k=>gaCell_(row[k]))]);return row;
}
function gaFind_(name,id){return gaRows_(name).find(x=>x.ID===id);}
function gaLog_(actor,action,entity,id,details){gaAppend_('Protokoll',{ID:gaId_(),Zeit:gaNow_(),BenutzerID:actor||'SYSTEM',Aktion:action,Entitaet:entity,EntitaetID:id||'',Details:JSON.stringify(details||{}).slice(0,1500)});}

// PBKDF2-HMAC-SHA256, 6000 Iterationen, 256 Bit. Mindestpasswortlänge 12 Zeichen.
function gaHash_(password,salt){
  const key=Utilities.newBlob(password).getBytes(),s=Utilities.newBlob(salt).getBytes();
  let u=Utilities.computeHmacSha256Signature(s.concat([0,0,0,1]),key),out=u.map(x=>x&255);
  for(let i=1;i<6000;i++){u=Utilities.computeHmacSha256Signature(u,key);for(let k=0;k<out.length;k++)out[k]^=(u[k]&255);}
  return Utilities.base64Encode(out);
}
function gaSame_(a,b){a=String(a);b=String(b);let diff=a.length^b.length;for(let i=0;i<Math.max(a.length,b.length);i++)diff|=(a.charCodeAt(i)||0)^(b.charCodeAt(i)||0);return diff===0;}
function gaTokenKey_(token){return 's_'+Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,token)).slice(0,52);}
function gaSession_(token){
  if(!token||typeof token!=='string')throw new Error('Bitte anmelden.');
  const uid=CacheService.getScriptCache().get(gaTokenKey_(token));
  const u=uid&&gaFind_('Benutzer',uid);
  if(!u||!gaBool_(u.Aktiv))throw new Error('Sitzung abgelaufen. Bitte erneut anmelden.');
  return u;
}
function gaLogin(email,password){
  email=gaText_(email,240).toLowerCase();password=String(password||'');
  const cache=CacheService.getScriptCache();
  const fail='f_'+Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,email)).slice(0,50);
  if(Number(cache.get(fail)||0)>=8)throw new Error('Zu viele Versuche. Bitte in 15 Minuten erneut versuchen.');
  const u=gaRows_('Benutzer').find(v=>v.Email.toLowerCase()===email&&gaBool_(v.Aktiv));
  if(!u||!u.Hash||!u.Salt||!gaSame_(gaHash_(password,u.Salt),u.Hash)){
    cache.put(fail,String(Number(cache.get(fail)||0)+1),900);
    throw new Error('E-Mail oder Passwort ungültig.');
  }
  cache.remove(fail);
  const token=gaId_().replace(/-/g,'')+gaId_().replace(/-/g,'');
  cache.put(gaTokenKey_(token),u.ID,21600);
  gaLog_(u.ID,'LOGIN','Benutzer',u.ID,{});
  return {token,user:gaPublicUser_(u),version:GA.VERSION};
}
function gaPublicUser_(u){return {ID:u.ID,Name:u.Name,Email:u.Email,Rolle:u.Rolle,Bereich:u.Bereich,Aktiv:u.Aktiv};}
function gaRequire_(u,roles){if(!roles.includes(u.Rolle))throw new Error('Keine Berechtigung für diese Funktion.');}
function gaLock_(callback){const l=LockService.getScriptLock();l.waitLock(20000);try{return callback();}finally{l.releaseLock();}}
function gaApi(method,data,token){
  const u=gaSession_(token),d=data||{};
  if(method==='state')return gaState_(u);
  if(method==='logout'){CacheService.getScriptCache().remove(gaTokenKey_(token));return {ok:true};}
  if(method==='saveTurnus')return gaLock_(()=>gaSaveTurnus_(u,d));
  if(method==='saveCourse')return gaLock_(()=>gaSaveCourse_(u,d));
  if(method==='saveQuestionnaire')return gaLock_(()=>gaSaveQuestionnaire_(u,d));
  if(method==='saveTermin')return gaLock_(()=>gaSaveTermin_(u,d));
  if(method==='saveMember')return gaLock_(()=>gaSaveMember_(u,d));
  if(method==='removeMember')return gaLock_(()=>gaRemoveMember_(u,d));
  if(method==='saveQualification')return gaLock_(()=>gaSaveQualification_(u,d));
  if(method==='setCourseRequirement')return gaLock_(()=>gaSetCourseRequirement_(u,d));
  if(method==='setAttendanceMember')return gaLock_(()=>gaSetAttendanceMember_(u,d));
  if(method==='sendDirect')return gaLock_(()=>gaSendDirect_(u,d));
  if(method==='readDirect')return gaLock_(()=>gaReadDirect_(u,d));
  if(method==='setPermission')return gaLock_(()=>gaSetPermission_(u,d));
  if(method==='saveProject')return gaLock_(()=>gaSaveProject_(u,d));
  if(method==='submitProject')return gaLock_(()=>gaSubmitProject_(u,d));
  if(method==='reviewProject')return gaLock_(()=>gaReviewProject_(u,d));
  if(method==='submitReport')return gaLock_(()=>gaSubmitReport_(u,d));
  if(method==='setReportStatus')return gaLock_(()=>gaSetReportStatus_(u,d));
  if(method==='saveRating')return gaLock_(()=>gaSaveRating_(u,d));
  if(method==='saveChecklistItem')return gaLock_(()=>gaSaveChecklistItem_(u,d));
  if(method==='setCheck')return gaLock_(()=>gaSetCheck_(u,d));
  if(method==='saveAttendance')return gaLock_(()=>gaSaveAttendance_(u,d));
  if(method==='inviteUser')return gaLock_(()=>gaInviteUser_(u,d));
  if(method==='sendMessage')return gaLock_(()=>gaSendMessage_(u,d));
  if(method==='readNotification')return gaLock_(()=>gaReadNotification_(u,d));
  if(method==='registerPush')return gaLock_(()=>gaRegisterPush_(u,d));
  if(method==='removePush')return gaLock_(()=>gaRemovePush_(u,d));
  if(method==='setPushRule')return gaLock_(()=>gaSetPushRule_(u,d));
  if(method==='testPush')return gaLock_(()=>gaTestPush_(u));
  throw new Error('Unbekannte Aktion.');
}
function gaState_(u){
 const admin=u.Rolle==='Administrator',trainer=u.Rolle==='Ausbilder',
  special=u.Rolle==='Fachverwaltung',participant=u.Rolle==='Teilnehmer';
 const allTurnusse=gaRows_('Turnusse'),allKurse=gaRows_('Kurse'),
  allTermine=gaRows_('Termine'),allMembers=gaRows_('Mitglieder'),
  allItems=gaRows_('Checklistenpunkte'),allChecks=gaRows_('MitgliedChecks');
 const own=participant?allMembers.find(m=>m.Email&&m.Email.toLowerCase()===u.Email.toLowerCase()&&gaBool_(m.Aktiv)):null;
 const rightsRows=(admin||trainer)?gaOptionalRows_('Berechtigungen'):[];
 const rights=gaPermissions_(u,rightsRows);
 const users=(admin||trainer)?gaRows_('Benutzer'):[];
 const projects=(admin||trainer)?gaOptionalRows_('KursProjekte'):[];
 const reports=(admin||trainer)?gaOptionalRows_('Meldungen'):[];
 const ratings=(participant||rights.BewertungenAnsehen)?gaOptionalRows_('Bewertungen'):[];
 const questionnaires=(admin||trainer||participant)?gaOptionalRows_('BewertungsFrageboegen'):[];
 const devices=gaOptionalRows_('PushGeraete'),pushRulesRows=gaOptionalRows_('PushRegeln');
 const ownTerm=participant&&own?allTermine.filter(t=>t.TurnusID===own.TurnusID):[];
 const ownAttendance=participant&&own?gaRows_('Teilnahmen').filter(t=>t.MitgliedID===own.ID):[];
 const ownRatings=participant&&own?ratings.filter(r=>r.MitgliedID===own.ID):[];
 const notifications=gaRows_('Benachrichtigungen').filter(n=>n.BenutzerID===u.ID).slice(-100).reverse();
 const qrows=gaOptionalRows_('QualifikationMitglieder'),reqs=gaOptionalRows_('KursAnforderungen'),att=gaRows_('Teilnahmen');
 const qualifikationen=(admin||trainer?allMembers.filter(m=>gaBool_(m.Aktiv)):own?[own]:[])
  .map(m=>gaQualificationStatus_(m,qrows,reqs,allKurse,allTermine,att,allTurnusse));
 const direktnachrichten=gaOptionalRows_('Direktnachrichten').filter(n=>n.VonBenutzerID===u.ID||n.AnBenutzerID===u.ID).slice(-200).reverse();
 return {
  version:GA.VERSION,user:gaPublicUser_(u),rechte:rights,
  turnusse:admin||trainer?allTurnusse:participant&&own?allTurnusse.filter(t=>t.ID===own.TurnusID):[],
  kurse:admin||trainer?allKurse:participant?allKurse.filter(c=>ownTerm.some(t=>t.KursID===c.ID)):[],
  termine:admin||trainer?allTermine:ownTerm,
  mitglieder:admin||trainer?allMembers:special?allMembers.filter(m=>gaBool_(m.Aktiv)).map(({ID,Vorname,Nachname,Telefon,TurnusID})=>({ID,Vorname,Nachname,Telefon,TurnusID})):own?[own]:[],
  checklistenpunkte:admin?allItems:special?allItems.filter(i=>i.Zustaendig===u.Bereich):participant?allItems:[],
  checks:admin?allChecks:special?allChecks.filter(ch=>allItems.some(it=>it.ID===ch.PunktID&&it.Zustaendig===u.Bereich)):
    participant&&own?allChecks.filter(ch=>ch.MitgliedID===own.ID):[],
  teilnahmen:admin||trainer?gaRows_('Teilnahmen'):ownAttendance,
  nachrichten:admin?gaRows_('Nachrichten'):participant&&own?gaRows_('Nachrichten').filter(n=>!n.TurnusID||n.TurnusID===own.TurnusID||n.TurnusID==='M:'+own.ID):[],
  benachrichtigungen:notifications,
  pushEigeneRegeln:gaPushRule_(u.ID,pushRulesRows),
  pushGeraeteAnzahl:devices.filter(x=>x.BenutzerID===u.ID&&gaBool_(x.Aktiv)).length,
  pushRegeln:admin?users.filter(x=>gaBool_(x.Aktiv)).map(x=>({BenutzerID:x.ID,Name:x.Name,Rolle:x.Rolle,...gaPushRule_(x.ID,pushRulesRows),
   Geraete:devices.filter(d=>d.BenutzerID===x.ID&&gaBool_(d.Aktiv)).length})):[],
  benutzer:admin?users.map(gaPublicUser_):trainer?users.filter(x=>x.Rolle==='Ausbilder'&&gaBool_(x.Aktiv)).map(gaPublicUser_):[],
  kursProjekte:admin?projects:trainer?projects.filter(x=>x.ErstelltVon===u.ID||rights.KurseGestalten||rights.KurseFreigeben):[],
  berechtigungen:admin?users.filter(x=>x.Rolle==='Ausbilder'&&gaBool_(x.Aktiv)).map(x=>({BenutzerID:x.ID,Name:x.Name,...gaPermissions_(x,rightsRows)})):[],
  meldungen:admin||rights.MeldungenBearbeiten?reports:trainer?reports.filter(x=>x.ErstelltVon===u.ID):[],
  bewertungen:rights.BewertungenAnsehen?ratings:[],
  eigeneBewertungen:ownRatings,
  frageboegen:questionnaires.filter(x=>x.Aktiv==='JA'),
  offeneBewertungen:participant&&own?ownAttendance.filter(t=>gaBool_(t.Anwesend)).map(t=>allTermine.find(term=>term.ID===t.TerminID)).filter(term=>
    term&&term.Status==='Durchgeführt'&&allKurse.some(c=>c.ID===term.KursID&&gaBool_(c.Aktiv))&&
    !ownRatings.some(r=>r.TerminID===term.ID)):[],
  meMember:participant&&own?own:null,
  qualifikationen,
  kursAnforderungen:admin?reqs:[],
  direktnachrichten,
  nachrichtenEmpfaenger:admin||trainer?users.filter(x=>gaBool_(x.Aktiv)).map(gaPublicUser_):
    gaRows_('Benutzer').filter(x=>gaBool_(x.Aktiv)&&['Administrator','Ausbilder','Fachverwaltung'].includes(x.Rolle)).map(gaPublicUser_)
 };
}
function gaNeed_(value,name,max){let v=gaText_(value,max);if(!v)throw new Error(name+' ist erforderlich.');return v;}
function gaChoice_(v,allowed,name){if(!allowed.includes(v))throw new Error('Ungültiger Wert für '+name+'.');return v;}
function gaSaveTurnus_(u,d){gaRequire_(u,['Administrator']);let val={Bezeichnung:gaNeed_(d.Bezeichnung,'Bezeichnung',130),Bereich:gaChoice_(d.Bereich,GA.AREAS,'Bereich'),Aktiv:'JA'};
  if(d.ID){gaReplace_('Turnusse',d.ID,val);gaLog_(u.ID,'BEARBEITEN','Turnus',d.ID,val);return {ok:true};}
  val.ID=gaId_();val.ErstelltAm=gaNow_();gaAppend_('Turnusse',val);gaLog_(u.ID,'ANLEGEN','Turnus',val.ID,val);return {ok:true};}
function gaLinks_(x){const text=gaText_(x,5000);const lines=text.split(/\n/).map(s=>s.trim()).filter(Boolean);if(lines.length>12)throw new Error('Maximal 12 Links.');for(const l of lines){if(!/^https:\/\//i.test(l))throw new Error('Unterlagen müssen HTTPS-Links sein (ein Link pro Zeile).');}return lines.join('\n');}
function gaSaveCourse_(u,d){
 gaRequireRight_(u,'KurseBearbeiten');
 const id=gaNeed_(d.ID,'Kurs-ID',100),old=gaFind_('Kurse',id);
 if(!old||!gaBool_(old.Aktiv))throw new Error('Veröffentlichter Kurs nicht gefunden.');
 const val={Titel:gaNeed_(d.Titel,'Kurstitel',160),Bereich:gaChoice_(d.Bereich,GA.AREAS,'Bereich'),
 Inhalt:gaNeed_(d.Inhalt,'Ausbildungsinhalt',8000),Lernziele:gaText_(d.Lernziele,3000),
 Links:gaLinks_(d.Links),Aktiv:'JA'};
 gaReplace_('Kurse',id,val);
 gaLog_(u.ID,'KURS_NACH_VEROEFFENTLICHUNG_BEARBEITEN','Kurs',id,{Vorher:old,Nachher:val});
 return {ok:true,message:'Veröffentlichter Kurs aktualisiert. Änderung protokolliert.'};
}
function gaDateTime_(s){s=gaText_(s,30);if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s)||Number.isNaN(Date.parse(s)))throw new Error('Datum/Uhrzeit ungültig.');return s;}
function gaNotify_(userId,type,title,message,reference){
  const category=type==='Nachricht'?'Nachrichten':type==='Termin'?'Termine':type==='Bewertung'?'Bewertungen':'Aufgaben';
  const allowed=gaPushRule_(userId)[category];
  const hasDevice=gaOptionalRows_('PushGeraete').some(x=>x.BenutzerID===userId&&gaBool_(x.Aktiv));
  const pushStatus=!allowed?'Vom Administrator deaktiviert':hasDevice?'Wartend':'Kein Gerät registriert';
  gaAppend_('Benachrichtigungen',{ID:gaId_(),BenutzerID:userId,Typ:type,Titel:title,Text:message,BezugID:reference||'',ErstelltAm:gaNow_(),GelesenAm:'',PushStatus:pushStatus});
}
function gaNotifyTurnus_(turnusId,type,title,text,ref){const emails=gaRows_('Mitglieder').filter(m=>m.TurnusID===turnusId&&gaBool_(m.Aktiv)).map(m=>m.Email.toLowerCase());gaRows_('Benutzer').filter(x=>x.Rolle==='Teilnehmer'&&gaBool_(x.Aktiv)&&emails.includes(x.Email.toLowerCase())).forEach(x=>gaNotify_(x.ID,type,title,text,ref));}
function gaSaveTermin_(u,d){gaRequireRight_(u,'TerminePlanen');const course=gaFind_('Kurse',d.KursID),turnus=gaFind_('Turnusse',d.TurnusID);
  if(!course||!gaBool_(course.Aktiv))throw new Error('Der Kurs ist noch nicht veröffentlicht.');if(!course||!turnus||!(course.Bereich===turnus.Bereich||(turnus.Bereich==='Grundausbildung'&&course.Bereich==='Erweiterte Ausbildung')))throw new Error('Dieser Kurs kann dem gewählten Turnus nicht zugeordnet werden. GAB-Turnusse dürfen auch erweiterte Ausbildungen besuchen.');
  const begin=gaDateTime_(d.Beginn),end=gaDateTime_(d.Ende);if(end<=begin)throw new Error('Das Ende muss nach dem Beginn liegen.');
  const val={KursID:d.KursID,TurnusID:d.TurnusID,Beginn:begin,Ende:end,Ort:gaText_(d.Ort,160),Status:'Geplant'};
  if(d.ID){gaReplace_('Termine',d.ID,val);gaLog_(u.ID,'BEARBEITEN','Termin',d.ID,val);return {ok:true};}
  val.ID=gaId_();val.ErstelltAm=gaNow_();gaAppend_('Termine',val);gaLog_(u.ID,'ANLEGEN','Termin',val.ID,val);
  gaNotifyTurnus_(val.TurnusID,'Termin','Neuer Ausbildungstermin',course.Titel+' · '+val.Beginn,val.ID);gaPushQueue_(5);return {ok:true};}
function gaSaveMember_(u,d){
  gaRequire_(u,['Administrator']);
  const turnus=gaFind_('Turnusse',d.TurnusID);
  if(!turnus||!gaBool_(turnus.Aktiv))throw new Error('Bitte einen gültigen aktiven Turnus wählen.');
  const email=gaText_(d.Email,240).toLowerCase();
  if(email&&!gaEmail_(email))throw new Error('E-Mail-Adresse ungültig.');
  const val={Vorname:gaNeed_(d.Vorname,'Vorname',100),Nachname:gaNeed_(d.Nachname,'Nachname',100),
    Email:email,Telefon:gaText_(d.Telefon,60),TurnusID:d.TurnusID,Aktiv:'JA',Geburtsdatum:gaDateOnly_(d.Geburtsdatum),Standesbuchnummer:gaText_(d.Standesbuchnummer,35),Ausbildungsweg:gaChoice_(d.Ausbildungsweg||turnus.Bereich,GA.AREAS,'Ausbildungsweg')};
  const rows=gaRows_('Mitglieder');
  if(val.Standesbuchnummer&&rows.some(m=>m.ID!==d.ID&&m.Standesbuchnummer===val.Standesbuchnummer))throw new Error('Diese Standesbuchnummer wird bereits verwendet.');
  if(email&&rows.some(m=>m.ID!==d.ID&&m.Email.toLowerCase()===email))
    throw new Error('Diese Mitglieds-E-Mail ist bereits vergeben.');
  if(d.ID){
    const existing=rows.find(m=>m.ID===d.ID);
    if(!existing)throw new Error('Mitglied wurde nicht gefunden.');
    if(String(existing.Email||'').toLowerCase()!==email&&
       gaRows_('Benutzer').some(x=>x.Rolle==='Teilnehmer'&&x.Email.toLowerCase()===String(existing.Email||'').toLowerCase())){
      throw new Error('Dieses Mitglied hat bereits einen Teilnehmerzugang. Die E-Mail kann erst geändert werden, wenn der alte Zugang durch den Administrator getrennt wurde.');
    }
    gaReplace_('Mitglieder',d.ID,val);
    const checks=gaRows_('MitgliedChecks');
    gaRows_('Checklistenpunkte').filter(i=>gaBool_(i.Aktiv)&&(i.Bereich==='Alle'||i.Bereich===turnus.Bereich))
      .filter(i=>!checks.some(ch=>ch.MitgliedID===d.ID&&ch.PunktID===i.ID))
      .forEach(i=>gaAppend_('MitgliedChecks',{ID:gaId_(),MitgliedID:d.ID,PunktID:i.ID,Status:'Offen',Kommentar:'',GeaendertVon:u.ID,GeaendertAm:gaNow_()}));
    gaLog_(u.ID,'BEARBEITEN','Mitglied',d.ID,{Vorher:existing.Vorname+' '+existing.Nachname,
      Nachher:val.Vorname+' '+val.Nachname,TurnusVorher:existing.TurnusID,TurnusNachher:val.TurnusID});
    return {ok:true,message:'Mitglied aktualisiert. Bestehende Ausbildungsnachweise bleiben erhalten.'};
  }
  val.ID=gaId_();val.ErstelltAm=gaNow_();gaAppend_('Mitglieder',val);
  gaRows_('Checklistenpunkte').filter(i=>gaBool_(i.Aktiv)&&(i.Bereich==='Alle'||i.Bereich===turnus.Bereich)).forEach(i=>
    gaAppend_('MitgliedChecks',{ID:gaId_(),MitgliedID:val.ID,PunktID:i.ID,Status:'Offen',Kommentar:'',GeaendertVon:u.ID,GeaendertAm:gaNow_()}));
  const candidates=gaRows_('Checklistenpunkte');
  gaRows_('Benutzer').filter(x=>x.Rolle==='Fachverwaltung'&&gaBool_(x.Aktiv)&&candidates.some(i=>i.Zustaendig===x.Bereich)).forEach(x=>
    gaNotify_(x.ID,'Aufgabe','Neues Mitglied: '+val.Vorname+' '+val.Nachname,'Offene Checklistenpunkte prüfen.',val.ID));
  gaLog_(u.ID,'ANLEGEN','Mitglied',val.ID,{Vorname:val.Vorname,Nachname:val.Nachname,TurnusID:val.TurnusID});
  return {ok:true,message:'Mitglied aufgenommen.'};
}
function gaRemoveMember_(u,d){
  gaRequire_(u,['Administrator']);
  const member=gaFind_('Mitglieder',gaText_(d.ID,100));
  if(!member)throw new Error('Mitglied nicht gefunden.');
  if(!gaBool_(member.Aktiv))return {ok:true,message:'Mitglied ist bereits deaktiviert.'};
  gaReplace_('Mitglieder',member.ID,{Aktiv:'NEIN'});
  const linked=gaRows_('Benutzer').filter(x=>x.Rolle==='Teilnehmer'&&
    x.Email.toLowerCase()===String(member.Email||'').toLowerCase());
  linked.forEach(x=>{
    gaReplace_('Benutzer',x.ID,{Aktiv:'NEIN'});
    gaOptionalRows_('PushGeraete').filter(g=>g.BenutzerID===x.ID&&gaBool_(g.Aktiv)).forEach(g=>gaReplace_('PushGeraete',g.ID,{Aktiv:'NEIN',AktualisiertAm:gaNow_()}));
  });
  gaLog_(u.ID,'DEAKTIVIEREN','Mitglied',member.ID,{Name:member.Vorname+' '+member.Nachname,ZugangGesperrt:linked.length>0});
  return {ok:true,message:'Mitglied aus der aktiven Liste entfernt. Teilnehmerzugang gesperrt; Ausbildungsnachweise erhalten.'};
}
function gaSaveChecklistItem_(u,d){gaRequire_(u,['Administrator']);const val={Titel:gaNeed_(d.Titel,'Checklistenpunkt',160),Bereich:gaChoice_(d.Bereich,['Alle'].concat(GA.AREAS),'Bereich'),Zustaendig:gaNeed_(d.Zustaendig,'Zuständigkeit',100),Aktiv:'JA'};
  if(d.ID){gaReplace_('Checklistenpunkte',d.ID,val);gaLog_(u.ID,'BEARBEITEN','Checklistenpunkt',d.ID,val);return {ok:true};}
  val.ID=gaId_();val.ErstelltAm=gaNow_();gaAppend_('Checklistenpunkte',val);
  const turnusse=gaRows_('Turnusse');gaRows_('Mitglieder').forEach(m=>{
    const turnus=turnusse.find(t=>t.ID===m.TurnusID);
    if(turnus&&(val.Bereich==='Alle'||turnus.Bereich===val.Bereich))gaAppend_('MitgliedChecks',{ID:gaId_(),MitgliedID:m.ID,PunktID:val.ID,Status:'Offen',Kommentar:'',GeaendertVon:u.ID,GeaendertAm:gaNow_()});
  });gaLog_(u.ID,'ANLEGEN','Checklistenpunkt',val.ID,val);return {ok:true};}
function gaSetCheck_(u,d){gaRequire_(u,['Administrator','Fachverwaltung']);const ch=gaFind_('MitgliedChecks',d.ID),item=ch&&gaFind_('Checklistenpunkte',ch.PunktID);
  if(!item)throw new Error('Checklistenpunkt nicht gefunden.');if(u.Rolle==='Fachverwaltung'&&item.Zustaendig!==u.Bereich)throw new Error('Dieser Punkt gehört nicht zu deinem Verwaltungsbereich.');
  const val={Status:gaChoice_(d.Status,GA.CHECK_STATUSES,'Status'),Kommentar:gaText_(d.Kommentar,500),GeaendertVon:u.ID,GeaendertAm:gaNow_()};
  gaReplace_('MitgliedChecks',ch.ID,val);gaLog_(u.ID,'STATUS','MitgliedCheck',ch.ID,{von:ch.Status,auf:val.Status});
  const member=gaFind_('Mitglieder',ch.MitgliedID);
  gaRows_('Benutzer').filter(x=>x.Rolle==='Teilnehmer'&&member&&x.Email.toLowerCase()===member.Email.toLowerCase()&&gaBool_(x.Aktiv)).forEach(x=>gaNotify_(x.ID,'Checkliste','Checkliste aktualisiert',item.Titel+': '+val.Status,ch.ID));return {ok:true};}
function gaSaveAttendance_(u,d){gaRequire_(u,['Administrator','Ausbilder']);const term=gaFind_('Termine',d.TerminID);if(!term)throw new Error('Termin nicht gefunden.');
  const members=gaRows_('Mitglieder').filter(m=>m.TurnusID===term.TurnusID&&gaBool_(m.Aktiv));
  if(!Array.isArray(d.Anwesend)||d.Anwesend.length!==members.length)throw new Error('Die Anwesenheitsliste ist unvollständig.');
  const answers=new Map(d.Anwesend.map(x=>[String(x.MitgliedID),x.Anwesend===true]));
  if(members.some(m=>!answers.has(m.ID)))throw new Error('Anwesenheit für jedes Mitglied erforderlich.');
  const trainerIds=Array.isArray(d.AusbilderIDs)?d.AusbilderIDs:[];
  const qualified=gaRows_('Benutzer').filter(x=>['Ausbilder','Administrator'].includes(x.Rolle)&&gaBool_(x.Aktiv)).map(x=>x.ID);
  if(!trainerIds.length||trainerIds.some(id=>!qualified.includes(id)))throw new Error('Mindestens einen gültigen Ausbilder auswählen.');
  if(u.Rolle==='Ausbilder'&&!trainerIds.includes(u.ID))throw new Error('Der bestätigende Ausbilder muss selbst angeführt sein.');
  const previous=gaRows_('Teilnahmen');
  members.forEach(m=>{
    const existing=previous.find(x=>x.TerminID===term.ID&&x.MitgliedID===m.ID);
    const entry={Anwesend:answers.get(m.ID)?'JA':'NEIN',AusbilderIDs:trainerIds.join(','),BestaetigtVon:u.ID,BestaetigtAm:gaNow_()};
    if(existing)gaReplace_('Teilnahmen',existing.ID,entry);else gaAppend_('Teilnahmen',Object.assign({ID:gaId_(),TerminID:term.ID,MitgliedID:m.ID},entry));
  });gaReplace_('Termine',term.ID,{Status:'Durchgeführt'});
  gaLog_(u.ID,'BESTAETIGEN','Termin',term.ID,{AusbilderIDs:trainerIds,Anwesend:members.filter(m=>answers.get(m.ID)).length,Total:members.length});
  const course=gaFind_('Kurse',term.KursID);
  const completed=gaOptionalRows_('Bewertungen');
  const users=gaRows_('Benutzer').filter(x=>x.Rolle==='Teilnehmer'&&gaBool_(x.Aktiv));
  const firstTime=members.filter(m=>answers.get(m.ID)&&!previous.some(t=>
    t.TerminID===term.ID&&t.MitgliedID===m.ID&&gaBool_(t.Anwesend)));
  firstTime.filter(m=>!completed.some(b=>b.TerminID===term.ID&&b.MitgliedID===m.ID)).forEach(m=>{
    const user=users.find(x=>x.Email.toLowerCase()===String(m.Email||'').toLowerCase());
    if(user)gaNotify_(user.ID,'Bewertung','Bewerte deinen letzten Kurs',
      'Du hast an „'+(course?course.Titel:'Ausbildung')+'“ teilgenommen. Du kannst den Kurs jetzt in der App bewerten.',term.ID);
  });
  gaPushQueue_(5);
  return {ok:true,message:'Anwesenheit bestätigt. '+firstTime.length+' neue Bewertungsbenachrichtigungen vorbereitet.'};
}
function gaSaveUser_(u,d){gaRequire_(u,['Administrator']);const name=gaNeed_(d.Name,'Name',140),email=gaText_(d.Email,240).toLowerCase(),pwd=String(d.Passwort||'');
  if(!gaEmail_(email)||pwd.length<12)throw new Error('Gültige E-Mail und Passwort mit mindestens 12 Zeichen erforderlich.');
  if(gaRows_('Benutzer').some(x=>x.Email.toLowerCase()===email))throw new Error('Benutzer existiert bereits.');
  const role=gaChoice_(d.Rolle,GA.ROLES,'Rolle'),bereich=role==='Fachverwaltung'?gaNeed_(d.Bereich,'Zuständigkeit',100):gaText_(d.Bereich,100);
  const salt=gaId_()+gaId_();const val={ID:gaId_(),Name:name,Email:email,Rolle:role,Bereich:bereich,Aktiv:'JA',Salt:salt,Hash:gaHash_(pwd,salt),ErstelltAm:gaNow_()};
  gaAppend_('Benutzer',val);gaLog_(u.ID,'ANLEGEN','Benutzer',val.ID,{Email:email,Rolle:role});return {ok:true};}
function gaSendMessage_(u,d){
  gaRequire_(u,['Administrator']);
  const title=gaNeed_(d.Titel,'Betreff',160),message=gaNeed_(d.Text,'Nachricht',3000);
  const mode=gaChoice_(d.EmpfaengerArt||(d.TurnusID?'TURNUS':'ALLE'),['ALLE','TURNUS','MITGLIED'],'Empfängerart');
  const members=gaRows_('Mitglieder').filter(m=>gaBool_(m.Aktiv));
  let target='',recipients=[];
  if(mode==='TURNUS'){
    const id=gaNeed_(d.TurnusID,'Turnus',100);
    if(!gaFind_('Turnusse',id))throw new Error('Turnus nicht gefunden.');
    target=id;recipients=members.filter(m=>m.TurnusID===id);
  }else if(mode==='MITGLIED'){
    const id=gaNeed_(d.MitgliedID,'Mitglied',100);
    const member=members.find(m=>m.ID===id);
    if(!member)throw new Error('Mitglied nicht gefunden oder nicht aktiv.');
    target='M:'+id;recipients=[member];
  }else recipients=members;
  const emails=new Set(recipients.map(m=>String(m.Email||'').toLowerCase()).filter(Boolean));
  const users=gaRows_('Benutzer').filter(x=>x.Rolle==='Teilnehmer'&&gaBool_(x.Aktiv)&&emails.has(x.Email.toLowerCase()));
  const id=gaId_();
  gaAppend_('Nachrichten',{ID:id,Titel:title,Text:message,TurnusID:target,VonBenutzerID:u.ID,ErstelltAm:gaNow_()});
  users.forEach(x=>gaNotify_(x.ID,'Nachricht',title,message.slice(0,240),id));
  gaLog_(u.ID,'SENDEN','Nachricht',id,{EmpfaengerArt:mode,ZielID:target,Empfaenger:users.length});
  gaPushQueue_(5);
  return {ok:true,message:'Nachricht gespeichert. '+users.length+' aktive Teilnehmer benachrichtigt.'};
}
function gaReadNotification_(u,d){const n=gaFind_('Benachrichtigungen',d.ID);if(!n||n.BenutzerID!==u.ID)throw new Error('Benachrichtigung nicht gefunden.');gaReplace_('Benachrichtigungen',n.ID,{GelesenAm:gaNow_()});return {ok:true};}

/**
 * Einmalige Einladungen statt vom Admin vergebener Startpasswörter.
 * Einladungstokens liegen NUR als SHA-256-Digest in der privaten Tabelle.
 * Keine Zugangsdaten im GitHub-Repository speichern!
 */
function gaInviteDigest_(token) {
  return Utilities.base64EncodeWebSafe(
    Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(token), Utilities.Charset.UTF_8)
  );
}
function gaInviteLink_(token) {
  const appUrl = PropertiesService.getScriptProperties().getProperty('GA_APP_URL') ||
    'https://michaelmejtsky.github.io/grundausbildung/';
  if(!/^https:\/\/[a-z0-9.-]+\/[\w./-]*\/?$/i.test(appUrl))
    throw new Error('GA_APP_URL ist ungültig; nur HTTPS-App-Adressen sind erlaubt.');
  // Eigene Aktivierungsseite statt App-Startseite: unabhängig vom PWA-Cache.
  const base=appUrl.split('#')[0].replace(/(?:index\.html)?\/?$/i,'/');
  return base+'einladung.html#invite='+encodeURIComponent(token);
}
function gaInviteUser_(actor,d) {
  gaRequire_(actor,['Administrator']);
  const name=gaNeed_(d.Name,'Name',140);
  const email=gaText_(d.Email,240).toLowerCase();
  if(!gaEmail_(email))throw new Error('Bitte gültige E-Mail angeben.');
  const role=gaChoice_(d.Rolle,GA.ROLES,'Rolle');
  const bereich=role==='Fachverwaltung'?gaNeed_(d.Bereich,'Zuständigkeit',100):gaText_(d.Bereich,100);
  if(role==='Teilnehmer'&&!gaRows_('Mitglieder').some(m=>gaBool_(m.Aktiv)&&m.Email.toLowerCase()===email))
    throw new Error('Für Teilnehmer zuerst das Mitglied mit derselben E-Mail in der Mitgliederverwaltung anlegen.');
  const others=gaRows_('Benutzer'),existing=others.find(x=>x.Email.toLowerCase()===email);
  if(existing&&gaBool_(existing.Aktiv))throw new Error('Dieser Benutzer ist bereits aktiv.');
  if(existing&&existing.Rolle!==role)throw new Error('Eine offene Einladung für eine andere Rolle besteht. Bitte Administrator prüfen lassen.');
  if(existing) gaReplace_('Benutzer',existing.ID,{Name:name,Bereich:bereich});
  else gaAppend_('Benutzer',{ID:gaId_(),Name:name,Email:email,Rolle:role,Bereich:bereich,Aktiv:'NEIN',Salt:'',Hash:'',ErstelltAm:gaNow_()});
  const user=existing||gaRows_('Benutzer').find(x=>x.Email===email);
  const token=gaId_().replace(/-/g,'')+gaId_().replace(/-/g,'');
  const invite={ID:gaId_(),BenutzerID:user.ID,Email:email,TokenHash:gaInviteDigest_(token),
    ExpiresAt:String(Date.now()+7*24*60*60*1000),UsedAt:'',Status:'Offen',ErstelltVon:actor.ID,ErstelltAm:gaNow_()};
  const all=gaRows_('Einladungen');
  all.filter(i=>i.BenutzerID===user.ID&&i.Status==='Offen')
    .forEach(i=>gaReplace_('Einladungen',i.ID,{Status:'Ersetzt'}));
  gaAppend_('Einladungen',invite);
  const link=gaInviteLink_(token);
  try {
    MailApp.sendEmail({
      to:email,subject:'Feuerwehr St. Pölten – Einladung zur Ausbildungsplattform',
      body:'Hallo '+name+',\n\n'+
        'du wurdest zur Ausbildungsplattform der Feuerwehr St. Pölten eingeladen.\n'+
        'Öffne diesen persönlichen Einladungslink und lege dein eigenes Passwort fest:\n\n'+
        link+'\n\n'+
        'Der Einladungslink ist einmalig nutzbar und 7 Tage gültig.\n'+
        'Bitte den Link nicht weiterleiten.\n\n'+
        'Feuerwehr St. Pölten – Ausbildung'
    });
  } catch(e) {
    gaReplace_('Einladungen',invite.ID,{Status:'Versandfehler'});
    gaLog_(actor.ID,'EINLADUNG_FEHLER','Benutzer',user.ID,{Email:email});
    throw new Error('Einladung wurde angelegt, aber E-Mail-Versand ist fehlgeschlagen. Bitte Berechtigung/Sendekontingent prüfen.');
  }
  gaLog_(actor.ID,'EINLADUNG_GESENDET','Benutzer',user.ID,{Email:email,Rolle:role});
  return {ok:true,message:'Einladung per E-Mail gesendet (7 Tage gültig).'};
}
function gaInviteCheck_(token){
  token=String(token||'');
  if(!/^[a-fA-F0-9]{64}$/.test(token))throw new Error('Ungültiger Einladungslink.');
  const digest=gaInviteDigest_(token);
  const item=gaRows_('Einladungen').find(i=>gaSame_(i.TokenHash,digest));
  if(!item||item.Status!=='Offen'||Number(item.ExpiresAt)<Date.now())
    throw new Error('Dieser Einladungslink ist ungültig, abgelaufen oder bereits verwendet. Bitte einen neuen anfordern.');
  const user=gaFind_('Benutzer',item.BenutzerID);
  if(!user||gaBool_(user.Aktiv))throw new Error('Einladung nicht mehr gültig.');
  return {Name:user.Name,Email:user.Email,Rolle:user.Rolle,Bereich:user.Bereich};
}
function gaCheckInvite(token){return gaInviteCheck_(token);}
function gaAcceptInvite(token,password){
  return gaLock_(()=>{
    const info=gaInviteCheck_(token);
    password=String(password||'');
    if(password.length<12||password.length>256)
      throw new Error('Das Passwort muss 12 bis 256 Zeichen lang sein.');
    const digest=gaInviteDigest_(token);
    const item=gaRows_('Einladungen').find(i=>gaSame_(i.TokenHash,digest)&&i.Status==='Offen');
    const user=gaFind_('Benutzer',item.BenutzerID);
    if(user.Email!==info.Email)throw new Error('Einladung konnte nicht zugeordnet werden.');
    const salt=gaId_()+gaId_();
    gaReplace_('Benutzer',user.ID,{Salt:salt,Hash:gaHash_(password,salt),Aktiv:'JA'});
    gaReplace_('Einladungen',item.ID,{Status:'Verwendet',UsedAt:gaNow_()});
    gaLog_(user.ID,'EINLADUNG_ANGENOMMEN','Benutzer',user.ID,{});
    return {ok:true};
  });
}


/** Cloudflare Worker sendet POST mit serverseitigem gemeinsamen Geheimnis.
 * Keine Geheimnisse in GitHub/config.js oder als URL-Parameter speichern!
 * Die Weiterleitung gibt keine CORS-Freigaben direkt an Browser.
 */
function doPost(e){
  const response=(obj)=>ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
  try{
    if(!e||!e.postData||!e.postData.contents)throw new Error('Keine Anfrage.');
    const q=JSON.parse(e.postData.contents);
    const secret=PropertiesService.getScriptProperties().getProperty('GA_WORKER_SECRET');
    if(!secret||secret.length<48||typeof q.gatewayKey!=='string'||!gaSame_(q.gatewayKey,secret))
      throw new Error('Zugriff auf API nicht gestattet.');
    const args=Array.isArray(q.args)?q.args:[];
    let result;
    switch(q.method){
      case 'gaLogin':result=gaLogin(args[0],args[1]);break;
      case 'gaApi':result=gaApi(args[0],args[1],args[2]);break;
      case 'gaCheckInvite':result=gaCheckInvite(args[0]);break;
      case 'gaAcceptInvite':result=gaAcceptInvite(args[0],args[1]);break;
      default:throw new Error('Unbekannte Aktion.');
    }
    return response({ok:true,value:result});
  }catch(err){
    return response({ok:false,error:String(err&&err.message||'Serverfehler')});
  }
}

/** Einmalig im Apps-Script-Editor ausführen und den Schlüssel
 * anschließend im Cloudflare Worker als verschlüsselte Variable speichern.
 * Der Schlüssel wird nicht in Tabellen/GitHub abgelegt.
 */
function gaWorkerSchluesselEinrichten(){
  const ui=SpreadsheetApp.getUi();
  const store=PropertiesService.getScriptProperties();
  if(store.getProperty('GA_WORKER_SECRET')){
    ui.alert('Es existiert bereits ein Worker-Schlüssel. Nicht neu erstellen, sonst bricht die Verbindung ab.');
    return;
  }
  const key=[gaId_(),gaId_(),gaId_()].join('').replace(/-/g,'');
  store.setProperty('GA_WORKER_SECRET',key);
  ui.alert('WICHTIG: Einmaliger Cloudflare-Worker-Schlüssel. Jetzt sicher kopieren und als Worker-Secret GA_WORKER_SECRET speichern. Er wird in diesem Dialog angezeigt und danach nicht erneut.\\n\\n'+key);
}


/** Push V1.2 – Geräte/Präferenzen immer privat in der Tabelle, niemals in GitHub.
 * Die Serverzustellung läuft ausschließlich signiert über den Cloudflare-Worker.
 */
function gaOptionalRows_(name){return gaSheet_().getSheetByName(name)?gaRows_(name):[];}
function gaPushRule_(userId,pushRows){
  const row=(pushRows||gaOptionalRows_('PushRegeln')).find(x=>x.BenutzerID===userId);
  return {
    Nachrichten:row?gaBool_(row.Nachrichten):true,
    Termine:row?gaBool_(row.Termine):true,
    Aufgaben:row?gaBool_(row.Aufgaben):true,
    Bewertungen:row&&String(row.Bewertungen).trim()?gaBool_(row.Bewertungen):true
  };
}
function gaSetPushRule_(actor,d){
  gaRequire_(actor,['Administrator']);
  const person=gaRows_('Benutzer').find(x=>x.ID===gaText_(d.BenutzerID,100)&&gaBool_(x.Aktiv));
  if(!person)throw new Error('Aktiver Benutzer für Push-Einstellungen nicht gefunden.');
  const val={Nachrichten:d.Nachrichten===true||d.Nachrichten==='JA'?'JA':'NEIN',
    Termine:d.Termine===true||d.Termine==='JA'?'JA':'NEIN',
    Aufgaben:d.Aufgaben===true||d.Aufgaben==='JA'?'JA':'NEIN',
    Bewertungen:d.Bewertungen===true||d.Bewertungen==='JA'?'JA':'NEIN',
    AktualisiertAm:gaNow_()};
  const row=gaOptionalRows_('PushRegeln').find(x=>x.BenutzerID===person.ID);
  if(row)gaReplace_('PushRegeln',row.ID,val);
  else gaAppend_('PushRegeln',{ID:gaId_(),BenutzerID:person.ID,...val});
  gaLog_(actor.ID,'PUSH_REGEL','Benutzer',person.ID,val);
  return {ok:true,message:'Push-Empfängerregeln gespeichert.'};
}
function gaRegisterPush_(user,d){
  if(!gaSheet_().getSheetByName('PushGeraete'))throw new Error('Bitte zuerst im Tabellenmenü „Push-Speicher und Trigger einrichten“ ausführen.');
  const endpoint=gaText_(d.Endpoint,600),p256dh=gaText_(d.P256DH,150),auth=gaText_(d.Auth,100);
  if(!/^https:\/\/(?:fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|push\.services\.mozilla\.com|(?:[a-z0-9.-]+\.)?push\.apple\.com)\//i.test(endpoint)||
    !/^[A-Za-z0-9_-]{86,88}$/.test(p256dh)||!/^[A-Za-z0-9_-]{20,40}$/.test(auth))
    throw new Error('Push-Gerätedaten ungültig.');
  const devices=gaOptionalRows_('PushGeraete'),existing=devices.find(x=>x.Endpoint===endpoint);
  if(existing&&existing.BenutzerID!==user.ID)throw new Error('Dieses Gerät ist mit einem anderen Zugang verknüpft. Bitte vorher abmelden.');
  if(!existing&&devices.filter(x=>x.BenutzerID===user.ID&&gaBool_(x.Aktiv)).length>=6)
    throw new Error('Maximal 6 registrierte Geräte pro Benutzer.');
  const fields={Endpoint:endpoint,P256DH:p256dh,Auth:auth,Aktiv:'JA',AktualisiertAm:gaNow_()};
  if(existing)gaReplace_('PushGeraete',existing.ID,fields);
  else gaAppend_('PushGeraete',{ID:gaId_(),BenutzerID:user.ID,...fields});
  gaLog_(user.ID,'PUSH_GERAET_AN','Benutzer',user.ID,{});
  return {ok:true,message:'Push für dieses Gerät angemeldet.'};
}
function gaRemovePush_(user,d){
  const endpoint=gaText_(d.Endpoint,600);
  gaOptionalRows_('PushGeraete').filter(x=>x.BenutzerID===user.ID&&x.Endpoint===endpoint)
    .forEach(x=>gaReplace_('PushGeraete',x.ID,{Aktiv:'NEIN',AktualisiertAm:gaNow_()}));
  gaLog_(user.ID,'PUSH_GERAET_AUS','Benutzer',user.ID,{});
  return {ok:true};
}
function gaTestPush_(user){
  gaNotify_(user.ID,'Nachricht','Grundausbildung – Test-Push','Dein Gerät kann Benachrichtigungen empfangen.','');
  const result=gaPushQueue_(5);
  return {ok:true,message:'Test-Benachrichtigung erstellt. '+result};
}
function gaPushQueue_(limit){
  const key=PropertiesService.getScriptProperties().getProperty('GA_WORKER_SECRET');
  if(!key||key.length<48)return 'Push-Server nicht eingerichtet.';
  const url='https://grundausbildung.michael-mejtsky.workers.dev/internal/push';
  const devices=gaOptionalRows_('PushGeraete').filter(x=>gaBool_(x.Aktiv));
  const pending=gaRows_('Benachrichtigungen').filter(n=>n.PushStatus==='Wartend').slice(0,Math.max(1,Math.min(10,limit||5)));
  for(const n of pending){
    const allowed=gaPushRule_(n.BenutzerID)[n.Typ==='Nachricht'?'Nachrichten':n.Typ==='Termin'?'Termine':n.Typ==='Bewertung'?'Bewertungen':'Aufgaben'];
    const selected=devices.filter(x=>x.BenutzerID===n.BenutzerID);
    if(!allowed||!selected.length){
      gaReplace_('Benachrichtigungen',n.ID,{PushStatus:allowed?'Kein Gerät registriert':'Vom Administrator deaktiviert'});
      continue;
    }
    const data={devices:selected.slice(0,6).map(d=>({id:d.ID,subscription:{endpoint:d.Endpoint,p256dh:d.P256DH,auth:d.Auth}})),
      notification:{title:gaText_(n.Titel,90),body:gaText_(n.Text,180),id:n.ID,url:'/grundausbildung/',kind:n.Typ}};
    const ts=Math.floor(Date.now()/1000),nonce=(gaId_().replace(/-/g,'')),payload=JSON.stringify(data);
    const signature=Utilities.computeHmacSha256Signature(ts+'.'+nonce+'.'+payload,key,Utilities.Charset.UTF_8)
      .map(b=>('0'+(b&255).toString(16)).slice(-2)).join('');
    try{
      const res=UrlFetchApp.fetch(url,{method:'post',contentType:'application/json',
        payload:JSON.stringify({ts,nonce,payload,signature}),muteHttpExceptions:true,
        followRedirects:false});
      const result=JSON.parse(res.getContentText());
      if(res.getResponseCode()===200&&result.ok){
        const good=(result.results||[]).filter(x=>x.ok).length;
        const gone=new Set((result.results||[]).filter(x=>x.gone).map(x=>x.id));
        devices.filter(d=>gone.has(d.ID)).forEach(d=>gaReplace_('PushGeraete',d.ID,{Aktiv:'NEIN',AktualisiertAm:gaNow_()}));
        gaReplace_('Benachrichtigungen',n.ID,{PushStatus:good?'Gesendet ('+good+')':'Nicht zugestellt'});
      }else{
        gaReplace_('Benachrichtigungen',n.ID,{PushStatus:'Fehlgeschlagen; Push-Konfiguration prüfen'});
      }
    }catch(err){
      gaReplace_('Benachrichtigungen',n.ID,{PushStatus:'Fehlgeschlagen; Verbindung prüfen'});
    }
  }
  return pending.length+' Nachricht(en) bearbeitet.';
}
function gaPushJob_(){gaLock_(()=>gaPushQueue_(8));}
function gaPushEinrichten(){
  gaEinrichten();
  const current=ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()==='gaPushJob_');
  if(!current.length)ScriptApp.newTrigger('gaPushJob_').timeBased().everyMinutes(5).create();
  SpreadsheetApp.getUi().alert('Push-Speicher eingerichtet. Versandprüfung alle 5 Minuten. Für echte Push-Nachrichten noch VAPID-Schlüssel im Cloudflare-Worker hinterlegen.');
}


/** Rollenrechte (nur Admin vergibt Rechte; beim Trainer grundsätzlich alles AUS). */
const GA_RIGHTS=['KurseGestalten','KurseFreigeben','TerminePlanen','MeldungenBearbeiten','BewertungenAnsehen','KurseBearbeiten','FrageboegenBearbeiten'];
function gaPermissions_(user,rightsRows){
 if(user.Rolle==='Administrator')return Object.fromEntries(GA_RIGHTS.map(k=>[k,true]));
 if(user.Rolle!=='Ausbilder')return Object.fromEntries(GA_RIGHTS.map(k=>[k,false]));
 const own=(rightsRows||gaOptionalRows_('Berechtigungen')).find(x=>x.BenutzerID===user.ID);
 return Object.fromEntries(GA_RIGHTS.map(k=>[k,!!own&&gaBool_(own[k])]));
}
function gaCan_(user,right){return !!gaPermissions_(user)[right];}
function gaRequireRight_(user,right){if(!gaCan_(user,right))throw new Error('Für diese Funktion fehlt die Berechtigung: '+right+'.');}
function gaSetPermission_(actor,d){
 gaRequire_(actor,['Administrator']);
 const user=gaRows_('Benutzer').find(x=>x.ID===gaText_(d.BenutzerID,100)&&x.Rolle==='Ausbilder'&&gaBool_(x.Aktiv));
 if(!user)throw new Error('Bitte einen aktiven Ausbilder wählen.');
 const values={};GA_RIGHTS.forEach(k=>values[k]=d[k]===true||d[k]==='JA'?'JA':'NEIN');
 values.AktualisiertAm=gaNow_();
 const old=gaOptionalRows_('Berechtigungen').find(x=>x.BenutzerID===user.ID);
 if(old)gaReplace_('Berechtigungen',old.ID,values);
 else gaAppend_('Berechtigungen',{ID:gaId_(),BenutzerID:user.ID,...values});
 gaLog_(actor.ID,'BERECHTIGUNG','Benutzer',user.ID,values);
 return {ok:true,message:'Ausbilderberechtigungen gespeichert.'};
}

/** Kursprojekte: Ausarbeitung -> Prüfung -> Genehmigung. */
function gaProjectData_(d){
 const type=gaChoice_(d.Typ,['Theorie','Praxis'],'Kursart');
 const url=gaText_(d.PraesentationURL,1500);
 if(url&&!/^https:\/\/[^\s]+$/i.test(url))throw new Error('Präsentationslink muss mit https:// beginnen.');
 return {
  Titel:gaNeed_(d.Titel,'Kurstitel',160),
  Bereich:gaChoice_(d.Bereich,GA.AREAS,'Ausbildungsbereich'),Typ:type,
  Inhalt:gaText_(d.Inhalt,8000),Lernziele:gaText_(d.Lernziele,4000),
  PraesentationURL:url,WeitereLinks:gaLinks_(d.WeitereLinks)
 };
}
function gaProjectComplete_(p){
 if(!p.Inhalt||!p.Inhalt.trim())throw new Error('Ein Ausbildungsinhalt ist immer Pflicht.');
 if(p.Typ==='Theorie'&&!p.PraesentationURL)throw new Error('Bei einem Theorie-Kurs ist eine Präsentation verpflichtend. Bei einer Praxisschulung reicht der Ausbildungsinhalt.');
}
function gaSaveProject_(u,d){
 gaRequireRight_(u,'KurseGestalten');
 const input=gaProjectData_(d),existing=d.ID?gaFind_('KursProjekte',gaText_(d.ID,100)):null;
 if(d.ID&&!existing)throw new Error('Kursprojekt nicht gefunden.');
 if(existing){
  if(existing.Status==='Veröffentlicht'||existing.Status==='Zur Prüfung')throw new Error('Dieses Projekt ist zur Prüfung eingereicht oder bereits veröffentlicht.');
  // Alle Ausbilder mit Gestaltungsrecht dürfen gemeinsam an noch offenen Projekten arbeiten.
  const status=gaChoice_(d.Status||existing.Status,['Neu','In Ausarbeitung','Zurück zur Bearbeitung'],'Projektstatus');
  gaReplace_('KursProjekte',existing.ID,{...input,Status:status,GeaendertVon:u.ID,GeaendertAm:gaNow_()});
  gaLog_(u.ID,'PROJEKT_BEARBEITEN','Kursprojekt',existing.ID,{Titel:input.Titel,Status:status});
  return {ok:true,message:'Kursprojekt aktualisiert.'};
 }
 const status=gaChoice_(d.Status||'Neu',['Neu','In Ausarbeitung'],'Projektstatus');
 const project={ID:gaId_(),KursID:'',...input,Status:status,ErstelltVon:u.ID,
  ErstelltAm:gaNow_(),GeaendertVon:u.ID,GeaendertAm:gaNow_(),
  GeprueftVon:'',GeprueftAm:'',Rueckmeldung:''};
 gaAppend_('KursProjekte',project);
 gaLog_(u.ID,'PROJEKT_ANLEGEN','Kursprojekt',project.ID,{Titel:input.Titel});
 return {ok:true,message:'Neues Kursprojekt angelegt.'};
}
function gaSubmitProject_(u,d){
 gaRequireRight_(u,'KurseGestalten');
 const project=gaFind_('KursProjekte',gaText_(d.ID,100));
 if(!project||!['Neu','In Ausarbeitung','Zurück zur Bearbeitung'].includes(project.Status))
   throw new Error('Dieses Projekt kann gerade nicht eingereicht werden.');
 // Gestaltungsberechtigte Ausbilder können gemeinsam ausgearbeitete Projekte einreichen.
 gaProjectComplete_(project);
 gaReplace_('KursProjekte',project.ID,{Status:'Zur Prüfung',GeaendertVon:u.ID,GeaendertAm:gaNow_(),Rueckmeldung:''});
 gaRows_('Benutzer').filter(x=>gaBool_(x.Aktiv)&&gaCan_(x,'KurseFreigeben')&&x.ID!==u.ID)
   .forEach(x=>gaNotify_(x.ID,'Aufgabe','Kurs wartet auf Freigabe',project.Titel,project.ID));
 gaLog_(u.ID,'PROJEKT_EINREICHEN','Kursprojekt',project.ID,{Titel:project.Titel});
 return {ok:true,message:'Projekt zur Prüfung eingereicht.'};
}
function gaReviewProject_(u,d){
 gaRequireRight_(u,'KurseFreigeben');
 const project=gaFind_('KursProjekte',gaText_(d.ID,100));
 if(!project||project.Status!=='Zur Prüfung')throw new Error('Es liegt kein freizugebender Entwurf vor.');
 const decision=gaChoice_(d.Entscheidung,['Freigeben','Zurückgeben'],'Entscheidung');
 const notes=gaText_(d.Rueckmeldung,1500);
 if(decision==='Zurückgeben'&&!notes)throw new Error('Bitte einen Grund für die Überarbeitung angeben.');
 if(decision==='Zurückgeben'){
  gaReplace_('KursProjekte',project.ID,{Status:'Zurück zur Bearbeitung',Rueckmeldung:notes,GeprueftVon:u.ID,GeprueftAm:gaNow_()});
 }else{
  gaProjectComplete_(project);
  const links=[project.PraesentationURL,project.WeitereLinks].filter(Boolean).join('\n');
  let courseId=project.KursID;
  const changes={Titel:project.Titel,Bereich:project.Bereich,Inhalt:project.Inhalt,
    Lernziele:project.Lernziele,Links:links,Aktiv:'JA'};
  if(courseId){
   const c=gaFind_('Kurse',courseId);if(!c)throw new Error('Verknüpfter Kurs fehlt.');
   gaReplace_('Kurse',courseId,changes);
  }else{
   courseId=gaId_();gaAppend_('Kurse',{ID:courseId,...changes,ErstelltAm:gaNow_()});
  }
  gaReplace_('KursProjekte',project.ID,{KursID:courseId,Status:'Veröffentlicht',Rueckmeldung:notes,
   GeprueftVon:u.ID,GeprueftAm:gaNow_()});
 }
 const owner=gaFind_('Benutzer',project.ErstelltVon);
 if(owner&&gaBool_(owner.Aktiv))gaNotify_(owner.ID,'Aufgabe',decision==='Freigeben'?'Kurs freigegeben':'Kurs zur Überarbeitung zurückgegeben',project.Titel+(notes?' – '+notes:''),project.ID);
 gaLog_(u.ID,'PROJEKT_'+(decision==='Freigeben'?'FREIGEBEN':'ZURUECKGEBEN'),'Kursprojekt',project.ID,{Rueckmeldung:notes});
 return {ok:true,message:decision==='Freigeben'?'Kurs freigegeben und veröffentlicht.':'Projekt zur Überarbeitung zurückgegeben.'};
}

/** Qualitätssicherung: Ideen, Ausbildungsmängel und App-Mängel. */
function gaSubmitReport_(u,d){
 gaRequire_(u,['Administrator','Ausbilder']);
 const val={Kategorie:gaChoice_(d.Kategorie,['Mangel App','Mangel Ausbildung','Idee Ausbildung','Idee App'],'Kategorie'),
  Titel:gaNeed_(d.Titel,'Titel',180),Beschreibung:gaNeed_(d.Beschreibung,'Beschreibung',5000),
  KursID:gaText_(d.KursID,100),Status:'Offen',ErstelltVon:u.ID,ErstelltAm:gaNow_(),
  BearbeitetVon:'',BearbeitetAm:'',Rueckmeldung:''};
 if(val.KursID&&!gaFind_('Kurse',val.KursID))throw new Error('Ausgewählter Kurs nicht vorhanden.');
 val.ID=gaId_();gaAppend_('Meldungen',val);
 gaLog_(u.ID,'MELDUNG_ANLEGEN','Meldung',val.ID,{Kategorie:val.Kategorie,Titel:val.Titel});
 gaRows_('Benutzer').filter(x=>gaBool_(x.Aktiv)&&gaCan_(x,'MeldungenBearbeiten')&&x.ID!==u.ID)
   .forEach(x=>gaNotify_(x.ID,'Aufgabe','Neue '+val.Kategorie,val.Titel,val.ID));
 return {ok:true,message:'Meldung erfasst.'};
}
function gaSetReportStatus_(u,d){
 gaRequireRight_(u,'MeldungenBearbeiten');
 const old=gaFind_('Meldungen',gaText_(d.ID,100));if(!old)throw new Error('Meldung nicht gefunden.');
 const status=gaChoice_(d.Status,['Offen','In Bearbeitung','Erledigt','Abgelehnt'],'Status'),
  note=gaText_(d.Rueckmeldung,1500);
 gaReplace_('Meldungen',old.ID,{Status:status,Rueckmeldung:note,BearbeitetVon:u.ID,BearbeitetAm:gaNow_()});
 const creator=gaFind_('Benutzer',old.ErstelltVon);
 if(creator&&gaBool_(creator.Aktiv)&&creator.ID!==u.ID)
  gaNotify_(creator.ID,'Aufgabe','Meldung aktualisiert',old.Titel+' – '+status,old.ID);
 gaLog_(u.ID,'MELDUNG_STATUS','Meldung',old.ID,{Status:status});
 return {ok:true,message:'Bearbeitungsstatus gespeichert.'};
}

/** Teilnehmerbewertungen nur für bestätigte Anwesenheiten, 1 pro Termin. */
function gaSaveRating_(u,d){
 gaRequire_(u,['Teilnehmer']);
 const member=gaRows_('Mitglieder').find(m=>gaBool_(m.Aktiv)&&m.Email&&m.Email.toLowerCase()===u.Email.toLowerCase());
 if(!member)throw new Error('Kein aktives Mitgliedsprofil zugeordnet.');
 const term=gaFind_('Termine',gaText_(d.TerminID,100));
 if(!term||term.Status!=='Durchgeführt'||term.TurnusID!==member.TurnusID)
  throw new Error('Der Kurs wurde noch nicht für deinen Turnus durchgeführt.');
 const attendance=gaRows_('Teilnahmen').find(x=>x.TerminID===term.ID&&x.MitgliedID===member.ID&&gaBool_(x.Anwesend));
 if(!attendance)throw new Error('Bewertungen sind nur nach bestätigter Anwesenheit erlaubt.');
 const course=gaFind_('Kurse',term.KursID);
 if(!course||!gaBool_(course.Aktiv))throw new Error('Kurs nicht veröffentlicht.');
 const score=Number(d.Sterne);
 if(!Number.isInteger(score)||score<1||score>5)throw new Error('Bitte eine Bewertung von 1 bis 5 Sternen vergeben.');
 const comment=gaText_(d.Kommentar,2500);
 const form=gaActiveQuestionnaire_(course.ID),answers=d.Antworten||{};
 if(!answers||typeof answers!=='object'||Array.isArray(answers))throw new Error('Bewertungsantworten fehlen.');
 const normalized={};
 form.questions.forEach((q,i)=>{
   const val=Number(answers[String(i)]);
   if(!Number.isInteger(val)||val<1||val>5)throw new Error('Bitte alle Bewertungsfragen (1–5) beantworten.');
   normalized[String(i)]=val;
 });
 const positives=gaText_(d.Positives,1500),improvements=gaText_(d.Verbesserungen,1500),ideas=gaText_(d.Ideen,1500);
 const prev=gaOptionalRows_('Bewertungen').find(x=>x.TerminID===term.ID&&x.MitgliedID===member.ID);
 if(prev)throw new Error('Du hast diesen Termin bereits bewertet.');
 const entry={ID:gaId_(),TerminID:term.ID,KursID:course.ID,MitgliedID:member.ID,
  Sterne:String(score),Kommentar:comment,ErstelltAm:gaNow_(),AktualisiertAm:gaNow_(),
  FragebogenID:form.id,FragebogenVersion:String(form.version),FragenSnapshotJSON:JSON.stringify(form.questions),
  AntwortenJSON:JSON.stringify(normalized),Positives:positives,Verbesserungen:improvements,Ideen:ideas};
 gaAppend_('Bewertungen',entry);
 gaLog_(u.ID,'BEWERTUNG','Termin',term.ID,{KursID:course.ID,Sterne:score});
 return {ok:true,message:'Vielen Dank! Deine Kursbewertung wurde gespeichert.'};
}


/** Qualifikationsfreigaben; keine öffentliche Daten-API. */
function gaDateOnly_(v){const x=gaText_(v,10);if(x&&(!/^\d{4}-\d{2}-\d{2}$/.test(x)||new Date(x+'T12:00:00Z').toISOString().slice(0,10)!==x))throw new Error('Ungültiges Datum.');return x;}
function gaQualificationStatus_(m,qs,rs,courses,terms,attendances,turnusse){
 const q=qs.find(x=>x.MitgliedID===m.ID)||{},valid=x=>gaBool_(x);
 const complete=id=>terms.some(t=>t.KursID===id&&t.TurnusID===m.TurnusID&&t.Status==='Durchgeführt'&&attendances.some(a=>a.TerminID===t.ID&&a.MitgliedID===m.ID&&valid(a.Anwesend)));
 const gab=rs.filter(r=>valid(r.PflichtGAB)),bsw=rs.filter(r=>valid(r.PflichtBSW));
 const gabOpen=gab.filter(r=>!complete(r.KursID)),bswOpen=bsw.filter(r=>!complete(r.KursID));
 const birth=m.Geburtsdatum||q.Geburtsdatum||'',today=Utilities.formatDate(new Date(),'Europe/Vienna','yyyy-MM-dd');
 const age16=/^\d{4}-\d{2}-\d{2}$/.test(birth)&&today>=(Number(birth.slice(0,4))+16)+birth.slice(4);
 const advanced=q.GABAnerkannt==='JA'&&(m.Ausbildungsweg||'')==='Erweiterte Ausbildung',gabDone=valid(m.Aktiv)&&(advanced||(valid(q.GABFreigabe)&&gab.length>0&&gabOpen.length===0));
 // GAB ist die erste Stufe; nach belegtem Abschluss folgt automatisch die Erweiterte Ausbildung.
 // Wer GAB macht, darf bereits vorher freiwillig an erweiterten Kursen teilnehmen.
 const actualPath=gabDone?'Erweiterte Ausbildung':'Grundausbildung';
 const bswDone=valid(m.Aktiv)&&bsw.length>0&&bswOpen.length===0;
 const requirements=[...new Set([...gab,...bsw].map(r=>r.KursID))],done=requirements.filter(complete).length;
 return {MitgliedID:m.ID,Name:m.Vorname+' '+m.Nachname,TurnusID:m.TurnusID,Ausbildungsweg:actualPath,AusbildungswegAufnahme:m.Ausbildungsweg||'Grundausbildung',Standesbuchnummer:m.Standesbuchnummer||'',
  Geburtsdatum:birth,ErsteHilfeStatus:q.ErsteHilfeStatus||'Ausständig',
  ErsteHilfeBestaetigtAm:q.ErsteHilfeBestaetigtAm||'',FDISKEintragDatum:q.FDISKEintragDatum||'',FDISKPlatzhalter:q.FDISKPlatzhalter||'NEIN',
  GABFreigabe:q.GABFreigabe||'NEIN',GABAnerkannt:q.GABAnerkannt||'NEIN',
  GABAbgeschlossen:gabDone,BSWModulAbgeschlossen:bswDone,Alter16:!!age16,
  BSWDienstMoeglich:gabDone&&bswDone&&!!age16,
  Fortschritt:requirements.length?Math.round(done*100/requirements.length):0,
  PflichtGesamt:requirements.length,PflichtAbsolviert:done,
  OffeneGABKurse:advanced?[]:gabOpen.map(r=>courses.find(c=>c.ID===r.KursID)?.Titel||'Pflichtkurs'),
  OffeneBSWKurse:bswOpen.map(r=>courses.find(c=>c.ID===r.KursID)?.Titel||'Pflichtkurs')};
}
function gaSaveQualification_(u,d){
 gaRequire_(u,['Administrator']);const m=gaFind_('Mitglieder',gaText_(d.MitgliedID,100));
 if(!m)throw new Error('Mitglied nicht gefunden.');
 const birth=gaDateOnly_(d.Geburtsdatum),status=gaChoice_(d.ErsteHilfeStatus||'Ausständig',['Ausständig','Bestätigt'],'Erste-Hilfe-Status'),
 aid=gaDateOnly_(d.ErsteHilfeBestaetigtAm),fdisk=gaDateOnly_(d.FDISKEintragDatum);
 if(status==='Bestätigt'&&!aid)throw new Error('Bestätigung der Ersten Hilfe braucht das tatsächliche Kursdatum.');
 const val={Geburtsdatum:birth,ErsteHilfeStatus:status,ErsteHilfeBestaetigtAm:status==='Bestätigt'?aid:'',
  FDISKEintragDatum:fdisk,GABFreigabe:d.GABFreigabe==='JA'?'JA':'NEIN',
  GABAnerkannt:d.GABAnerkannt==='JA'?'JA':'NEIN',FDISKPlatzhalter:d.FDISKPlatzhalter==='JA'?'JA':'NEIN',Notiz:gaText_(d.Notiz,700),
  GeprueftVon:u.ID,GeprueftAm:gaNow_()};
 if(val.GABAnerkannt==='JA'&&m.Ausbildungsweg!=='Erweiterte Ausbildung')
  throw new Error('GAB-Anerkennung ist nur bei erweiterter Ausbildung zulässig.');
 const existing=gaOptionalRows_('QualifikationMitglieder').find(x=>x.MitgliedID===m.ID);
 if(existing)gaReplace_('QualifikationMitglieder',existing.ID,val);
 else gaAppend_('QualifikationMitglieder',{ID:gaId_(),MitgliedID:m.ID,...val});
 // Ein einziges maßgebliches Geburtsdatum im Mitgliedsstamm; sonst würde
 // eine Änderung im Qualifikationsformular den Altersstatus nicht aktualisieren.
 if(birth!==String(m.Geburtsdatum||''))gaReplace_('Mitglieder',m.ID,{Geburtsdatum:birth});
 gaLog_(u.ID,'QUALIFIKATION','Mitglied',m.ID,{GAB:val.GABFreigabe,GABAnerkannt:val.GABAnerkannt,ErsteHilfeStatus:status});
 return {ok:true,message:'Qualifikationsnachweise gespeichert.'};
}
function gaSetCourseRequirement_(u,d){
 gaRequire_(u,['Administrator']);const c=gaFind_('Kurse',gaText_(d.KursID,100));
 if(!c||!gaBool_(c.Aktiv))throw new Error('Nur veröffentlichte Kurse als Pflichtmodul markieren.');
 const val={PflichtGAB:d.PflichtGAB==='JA'?'JA':'NEIN',PflichtBSW:d.PflichtBSW==='JA'?'JA':'NEIN',
  AktualisiertVon:u.ID,AktualisiertAm:gaNow_()};
 const old=gaOptionalRows_('KursAnforderungen').find(x=>x.KursID===c.ID);
 if(old)gaReplace_('KursAnforderungen',old.ID,val);
 else gaAppend_('KursAnforderungen',{ID:gaId_(),KursID:c.ID,...val});
 gaLog_(u.ID,'PFLICHTMODUL','Kurs',c.ID,val);return {ok:true,message:'Pflichtmodulstatus gespeichert.'};
}
function gaSetAttendanceMember_(u,d){
 gaRequire_(u,['Administrator']);const t=gaFind_('Termine',gaText_(d.TerminID,100)),m=gaFind_('Mitglieder',gaText_(d.MitgliedID,100));
 if(!t||!m||t.TurnusID!==m.TurnusID)throw new Error('Termin oder Mitglied nicht zugeordnet.');
 const old=gaRows_('Teilnahmen').find(x=>x.TerminID===t.ID&&x.MitgliedID===m.ID),present=d.Anwesend==='JA';
 const val={Anwesend:present?'JA':'NEIN',AusbilderIDs:old?.AusbilderIDs||u.ID,BestaetigtVon:u.ID,BestaetigtAm:gaNow_()};
 if(old)gaReplace_('Teilnahmen',old.ID,val);
 else gaAppend_('Teilnahmen',{ID:gaId_(),TerminID:t.ID,MitgliedID:m.ID,...val});
 if(t.Status!=='Durchgeführt')gaReplace_('Termine',t.ID,{Status:'Durchgeführt'});
 if(present&&(!old||old.Anwesend!=='JA')){
  const account=gaRows_('Benutzer').find(x=>x.Rolle==='Teilnehmer'&&gaBool_(x.Aktiv)&&x.Email.toLowerCase()===String(m.Email).toLowerCase());
  if(account)gaNotify_(account.ID,'Bewertung','Kursbewertung möglich','Du kannst deinen absolvierten Kurs jetzt bewerten.',t.ID);
 }
 gaLog_(u.ID,'TEILNAHME_ADMIN','Termin',t.ID,{MitgliedID:m.ID,Anwesend:val.Anwesend});
 return {ok:true,message:'Teilnahme gespeichert.'};
}
function gaSendDirect_(u,d){
 const recipient=gaFind_('Benutzer',gaText_(d.AnBenutzerID,100));
 if(!recipient||!gaBool_(recipient.Aktiv)||recipient.ID===u.ID)throw new Error('Empfänger nicht verfügbar.');
 if(u.Rolle==='Teilnehmer'&&!['Administrator','Ausbilder','Fachverwaltung'].includes(recipient.Rolle))
  throw new Error('Teilnehmer können Ausbilder und Verwaltung anschreiben.');
 const item={ID:gaId_(),VonBenutzerID:u.ID,AnBenutzerID:recipient.ID,Titel:gaNeed_(d.Titel,'Betreff',160),
  Text:gaNeed_(d.Text,'Nachricht',3000),ErstelltAm:gaNow_(),GelesenAm:''};
 gaAppend_('Direktnachrichten',item);
 gaNotify_(recipient.ID,'Nachricht',item.Titel,'Du hast eine persönliche Nachricht.',item.ID);
 gaLog_(u.ID,'NACHRICHT','Benutzer',recipient.ID,{ID:item.ID});
 return {ok:true,message:'Persönliche Nachricht gesendet.'};
}
function gaReadDirect_(u,d){
 const n=gaFind_('Direktnachrichten',gaText_(d.ID,100));
 if(!n||n.AnBenutzerID!==u.ID)throw new Error('Nachricht nicht gefunden.');
 gaReplace_('Direktnachrichten',n.ID,{GelesenAm:gaNow_()});return {ok:true};
}

const GA_DEFAULT_QUESTIONS=[
 'Waren die Ausbildungsziele verständlich?',
 'Wurden die Inhalte verständlich erklärt?',
 'War die Ausbildung praxisnah und für den Feuerwehrdienst hilfreich?',
 'War das Tempo der Ausbildung angemessen?',
 'Konntest du ausreichend Fragen stellen?',
 'Waren die eingesetzten Unterlagen und Hilfsmittel hilfreich?',
 'Wie zufrieden warst du insgesamt mit der Ausbildung?'
];
function gaActiveQuestionnaire_(courseId){
 const rows=gaOptionalRows_('BewertungsFrageboegen');
 const custom=rows.find(x=>x.KursID===courseId&&gaBool_(x.Aktiv));
 const fallback=rows.find(x=>x.KursID==='ALLGEMEIN'&&gaBool_(x.Aktiv));
 const selected=custom||fallback;
 if(!selected)return {id:'STANDARD',version:1,questions:GA_DEFAULT_QUESTIONS};
 let questions;try{questions=JSON.parse(selected.FragenJSON);}catch{throw new Error('Ungültige Fragebogen-Daten.');}
 if(!Array.isArray(questions)||questions.length<1||questions.length>15)throw new Error('Fragebogen nicht gültig.');
 return {id:selected.ID,version:Number(selected.Version)||1,questions};
}
function gaSaveQuestionnaire_(u,d){
 gaRequireRight_(u,'FrageboegenBearbeiten');
 const courseId=gaText_(d.KursID,100)||'ALLGEMEIN';
 if(courseId!=='ALLGEMEIN'&&!gaFind_('Kurse',courseId))throw new Error('Kurs nicht gefunden.');
 const raw=Array.isArray(d.Fragen)?d.Fragen:String(d.Fragen||'').split(/\r?\n/);
 const questions=raw.map(q=>gaText_(q,250)).filter(Boolean);
 if(questions.length<1||questions.length>15||new Set(questions.map(q=>q.toLowerCase())).size!==questions.length)
  throw new Error('Bitte 1 bis 15 verschiedene Fragen hinterlegen.');
 const old=gaOptionalRows_('BewertungsFrageboegen').find(x=>x.KursID===courseId&&gaBool_(x.Aktiv));
 const version=old?(Number(old.Version)||1)+1:1;
 if(old)gaReplace_('BewertungsFrageboegen',old.ID,{Aktiv:'NEIN'});
 gaAppend_('BewertungsFrageboegen',{ID:gaId_(),KursID:courseId,FragenJSON:JSON.stringify(questions),
 Version:String(version),Aktiv:'JA',AktualisiertVon:u.ID,AktualisiertAm:gaNow_()});
 gaLog_(u.ID,'FRAGEBOGEN_AKTUALISIERT','Kurs',courseId,{Version:version,Fragen:questions.length});
 return {ok:true,message:'Fragebogen gespeichert. Alte Bewertungen bleiben unverändert.'};
}
