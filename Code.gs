/**
 * GRUNDAUSBILDUNG – Feuerwehr Ausbildungsplattform V1.0
 * Backend: an Google Sheet gebundenes Google Apps Script.
 * Ausführung als Eigentümer, kein Zugriff auf das Sheet für andere Nutzer nötig.
 * Zugang: eigene Benutzerkonten mit Passwort (Pilotbetrieb, siehe README).
 * Wichtig: die Google Tabelle NICHT für Teilnehmer freigeben.
 */
const GA = Object.freeze({
  VERSION: '1.1.0',
  SHEETS: {
    Benutzer: ['ID','Name','Email','Rolle','Bereich','Aktiv','Salt','Hash','ErstelltAm'],
    Turnusse: ['ID','Bezeichnung','Bereich','Aktiv','ErstelltAm'],
    Mitglieder: ['ID','Vorname','Nachname','Email','Telefon','TurnusID','Aktiv','ErstelltAm'],
    Kurse: ['ID','Titel','Bereich','Inhalt','Lernziele','Links','Aktiv','ErstelltAm'],
    Termine: ['ID','KursID','TurnusID','Beginn','Ende','Ort','Status','ErstelltAm'],
    Teilnahmen: ['ID','TerminID','MitgliedID','Anwesend','AusbilderIDs','BestaetigtVon','BestaetigtAm'],
    Checklistenpunkte: ['ID','Titel','Bereich','Zustaendig','Aktiv','ErstelltAm'],
    MitgliedChecks: ['ID','MitgliedID','PunktID','Status','Kommentar','GeaendertVon','GeaendertAm'],
    Nachrichten: ['ID','Titel','Text','TurnusID','VonBenutzerID','ErstelltAm'],
    Benachrichtigungen: ['ID','BenutzerID','Typ','Titel','Text','BezugID','ErstelltAm','GelesenAm','PushStatus'],
    Protokoll: ['ID','Zeit','BenutzerID','Aktion','Entitaet','EntitaetID','Details'],
    Einladungen: ['ID','BenutzerID','Email','TokenHash','ExpiresAt','UsedAt','Status','ErstelltVon','ErstelltAm']
  },
  ROLES: ['Administrator','Ausbilder','Teilnehmer','Fachverwaltung'],
  AREAS: ['Grundausbildung','Erweiterte Ausbildung'],
  CHECK_STATUSES: ['Offen','Erledigt','Nicht erforderlich']
});

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Grundausbildung')
    .addItem('1 · Tabellen prüfen/erstellen','gaEinrichten')
    .addItem('2 · Ersten Administrator einrichten','gaErstenAdminEinrichten')
    .addItem('3 · Systemprüfung','gaSystemPruefen').addToUi();
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
  SpreadsheetApp.getUi().alert('Grundausbildung bereit: 11 Tabellenblätter, Beispielkurs und Checklistenpunkte geprüft. Vorhandene Daten wurden nicht gelöscht.');
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
function doGet(){return HtmlService.createHtmlOutputFromFile('Bridge').setTitle('Grundausbildung · API').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);}

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
  if(method==='saveTermin')return gaLock_(()=>gaSaveTermin_(u,d));
  if(method==='saveMember')return gaLock_(()=>gaSaveMember_(u,d));
  if(method==='saveChecklistItem')return gaLock_(()=>gaSaveChecklistItem_(u,d));
  if(method==='setCheck')return gaLock_(()=>gaSetCheck_(u,d));
  if(method==='saveAttendance')return gaLock_(()=>gaSaveAttendance_(u,d));
  if(method==='inviteUser')return gaLock_(()=>gaInviteUser_(u,d));
  if(method==='sendMessage')return gaLock_(()=>gaSendMessage_(u,d));
  if(method==='readNotification')return gaLock_(()=>gaReadNotification_(u,d));
  throw new Error('Unbekannte Aktion.');
}
function gaState_(u){
  const admin=u.Rolle==='Administrator',trainer=u.Rolle==='Ausbilder',special=u.Rolle==='Fachverwaltung',participant=u.Rolle==='Teilnehmer';
  const allTurnusse=gaRows_('Turnusse'), allKurse=gaRows_('Kurse'),allTermine=gaRows_('Termine'),
    allMembers=gaRows_('Mitglieder'),allItems=gaRows_('Checklistenpunkte'),allChecks=gaRows_('MitgliedChecks');
  const own=allMembers.find(m=>m.Email&&m.Email.toLowerCase()===u.Email.toLowerCase()&&gaBool_(m.Aktiv));
  let members=admin||trainer?allMembers:special?allMembers.map(({ID,Vorname,Nachname,Telefon,TurnusID})=>({ID,Vorname,Nachname,Telefon,TurnusID})):own?[own]:[];
  let terms=admin||trainer?allTermine:participant&&own?allTermine.filter(t=>t.TurnusID===own.TurnusID):[];
  let courses=admin||trainer?allKurse:participant?allKurse.filter(c=>terms.some(t=>t.KursID===c.ID)):[];
  let checks=admin?allChecks:special?allChecks.filter(ch=>allItems.some(it=>it.ID===ch.PunktID&&it.Zustaendig===u.Bereich)):
    participant&&own?allChecks.filter(ch=>ch.MitgliedID===own.ID):[];
  const notifications=gaRows_('Benachrichtigungen').filter(n=>n.BenutzerID===u.ID).slice(-100).reverse();
  return {
    version:GA.VERSION,user:gaPublicUser_(u),
    turnusse:admin||trainer?allTurnusse:participant&&own?allTurnusse.filter(t=>t.ID===own.TurnusID):[],
    kurse:courses,termine:terms,mitglieder:members,
    checklistenpunkte:admin?allItems:special?allItems.filter(i=>i.Zustaendig===u.Bereich):participant?allItems:[],
    checks,
    teilnahmen:admin||trainer?gaRows_('Teilnahmen'):participant&&own?gaRows_('Teilnahmen').filter(t=>t.MitgliedID===own.ID):[],
    nachrichten:admin?gaRows_('Nachrichten'):participant&&own?gaRows_('Nachrichten').filter(n=>!n.TurnusID||n.TurnusID===own.TurnusID):[],
    benachrichtigungen:notifications,
    benutzer:admin?gaRows_('Benutzer').map(gaPublicUser_):trainer?gaRows_('Benutzer').filter(x=>x.Rolle==='Ausbilder'&&gaBool_(x.Aktiv)).map(gaPublicUser_):[],
    // Ausgabe von Personenprofilen nur nach Login und rollenbasiert.
    meMember:participant&&own?own:null
  };
}
function gaNeed_(value,name,max){let v=gaText_(value,max);if(!v)throw new Error(name+' ist erforderlich.');return v;}
function gaChoice_(v,allowed,name){if(!allowed.includes(v))throw new Error('Ungültiger Wert für '+name+'.');return v;}
function gaSaveTurnus_(u,d){gaRequire_(u,['Administrator']);let val={Bezeichnung:gaNeed_(d.Bezeichnung,'Bezeichnung',130),Bereich:gaChoice_(d.Bereich,GA.AREAS,'Bereich'),Aktiv:'JA'};
  if(d.ID){gaReplace_('Turnusse',d.ID,val);gaLog_(u.ID,'BEARBEITEN','Turnus',d.ID,val);return {ok:true};}
  val.ID=gaId_();val.ErstelltAm=gaNow_();gaAppend_('Turnusse',val);gaLog_(u.ID,'ANLEGEN','Turnus',val.ID,val);return {ok:true};}
function gaLinks_(x){const text=gaText_(x,5000);const lines=text.split(/\n/).map(s=>s.trim()).filter(Boolean);if(lines.length>12)throw new Error('Maximal 12 Links.');for(const l of lines){if(!/^https:\/\//i.test(l))throw new Error('Unterlagen müssen HTTPS-Links sein (ein Link pro Zeile).');}return lines.join('\n');}
function gaSaveCourse_(u,d){gaRequire_(u,['Administrator']);let val={Titel:gaNeed_(d.Titel,'Kurstitel',160),Bereich:gaChoice_(d.Bereich,GA.AREAS,'Bereich'),Inhalt:gaText_(d.Inhalt,5000),Lernziele:gaText_(d.Lernziele,3000),Links:gaLinks_(d.Links),Aktiv:'JA'};
  if(d.ID){gaReplace_('Kurse',d.ID,val);gaLog_(u.ID,'BEARBEITEN','Kurs',d.ID,{Titel:val.Titel});return {ok:true};}
  val.ID=gaId_();val.ErstelltAm=gaNow_();gaAppend_('Kurse',val);gaLog_(u.ID,'ANLEGEN','Kurs',val.ID,{Titel:val.Titel});return {ok:true};}
function gaDateTime_(s){s=gaText_(s,30);if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s)||Number.isNaN(Date.parse(s)))throw new Error('Datum/Uhrzeit ungültig.');return s;}
function gaNotify_(userId,type,title,message,reference){gaAppend_('Benachrichtigungen',{ID:gaId_(),BenutzerID:userId,Typ:type,Titel:title,Text:message,BezugID:reference||'',ErstelltAm:gaNow_(),GelesenAm:'',PushStatus:'Nur In-App · Push nicht eingerichtet'});}
function gaNotifyTurnus_(turnusId,type,title,text,ref){const emails=gaRows_('Mitglieder').filter(m=>m.TurnusID===turnusId&&gaBool_(m.Aktiv)).map(m=>m.Email.toLowerCase());gaRows_('Benutzer').filter(x=>x.Rolle==='Teilnehmer'&&gaBool_(x.Aktiv)&&emails.includes(x.Email.toLowerCase())).forEach(x=>gaNotify_(x.ID,type,title,text,ref));}
function gaSaveTermin_(u,d){gaRequire_(u,['Administrator']);const course=gaFind_('Kurse',d.KursID),turnus=gaFind_('Turnusse',d.TurnusID);if(!course||!turnus||course.Bereich!==turnus.Bereich)throw new Error('Kurs und Turnus müssen demselben Ausbildungsbereich zugehören.');
  const begin=gaDateTime_(d.Beginn),end=gaDateTime_(d.Ende);if(end<=begin)throw new Error('Das Ende muss nach dem Beginn liegen.');
  const val={KursID:d.KursID,TurnusID:d.TurnusID,Beginn:begin,Ende:end,Ort:gaText_(d.Ort,160),Status:'Geplant'};
  if(d.ID){gaReplace_('Termine',d.ID,val);gaLog_(u.ID,'BEARBEITEN','Termin',d.ID,val);return {ok:true};}
  val.ID=gaId_();val.ErstelltAm=gaNow_();gaAppend_('Termine',val);gaLog_(u.ID,'ANLEGEN','Termin',val.ID,val);
  gaNotifyTurnus_(val.TurnusID,'Termin','Neuer Ausbildungstermin',course.Titel+' · '+val.Beginn,val.ID);return {ok:true};}
function gaSaveMember_(u,d){gaRequire_(u,['Administrator']);if(!gaFind_('Turnusse',d.TurnusID))throw new Error('Bitte einen gültigen Turnus wählen.');
  const email=gaText_(d.Email,240).toLowerCase();if(email&&!gaEmail_(email))throw new Error('E-Mail-Adresse ungültig.');
  const val={Vorname:gaNeed_(d.Vorname,'Vorname',100),Nachname:gaNeed_(d.Nachname,'Nachname',100),Email:email,Telefon:gaText_(d.Telefon,60),TurnusID:d.TurnusID,Aktiv:'JA'};
  const rows=gaRows_('Mitglieder');if(email&&rows.some(m=>m.ID!==d.ID&&m.Email.toLowerCase()===email))throw new Error('Diese Mitglieds-E-Mail existiert bereits.');
  if(d.ID){gaReplace_('Mitglieder',d.ID,val);gaLog_(u.ID,'BEARBEITEN','Mitglied',d.ID,{Vorname:val.Vorname,Nachname:val.Nachname});return {ok:true};}
  val.ID=gaId_();val.ErstelltAm=gaNow_();gaAppend_('Mitglieder',val);
  const turnus=gaFind_('Turnusse',val.TurnusID);gaRows_('Checklistenpunkte').filter(i=>gaBool_(i.Aktiv)&&(i.Bereich==='Alle'||i.Bereich===turnus.Bereich)).forEach(i=>{
    gaAppend_('MitgliedChecks',{ID:gaId_(),MitgliedID:val.ID,PunktID:i.ID,Status:'Offen',Kommentar:'',GeaendertVon:u.ID,GeaendertAm:gaNow_()});
  });
  gaRows_('Benutzer').filter(x=>x.Rolle==='Fachverwaltung'&&gaBool_(x.Aktiv)&&gaRows_('Checklistenpunkte').some(i=>i.Zustaendig===x.Bereich)).forEach(x=>
    gaNotify_(x.ID,'Aufgabe','Neues Mitglied: '+val.Vorname+' '+val.Nachname,'Offene Checklistenpunkte prüfen.',val.ID));
  gaLog_(u.ID,'ANLEGEN','Mitglied',val.ID,{Vorname:val.Vorname,Nachname:val.Nachname,TurnusID:val.TurnusID});return {ok:true};}
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
  gaNotifyTurnus_(term.TurnusID,'Teilnahme','Ausbildung dokumentiert','Die Anwesenheit wurde erfasst.',term.ID);return {ok:true};}
function gaSaveUser_(u,d){gaRequire_(u,['Administrator']);const name=gaNeed_(d.Name,'Name',140),email=gaText_(d.Email,240).toLowerCase(),pwd=String(d.Passwort||'');
  if(!gaEmail_(email)||pwd.length<12)throw new Error('Gültige E-Mail und Passwort mit mindestens 12 Zeichen erforderlich.');
  if(gaRows_('Benutzer').some(x=>x.Email.toLowerCase()===email))throw new Error('Benutzer existiert bereits.');
  const role=gaChoice_(d.Rolle,GA.ROLES,'Rolle'),bereich=role==='Fachverwaltung'?gaNeed_(d.Bereich,'Zuständigkeit',100):gaText_(d.Bereich,100);
  const salt=gaId_()+gaId_();const val={ID:gaId_(),Name:name,Email:email,Rolle:role,Bereich:bereich,Aktiv:'JA',Salt:salt,Hash:gaHash_(pwd,salt),ErstelltAm:gaNow_()};
  gaAppend_('Benutzer',val);gaLog_(u.ID,'ANLEGEN','Benutzer',val.ID,{Email:email,Rolle:role});return {ok:true};}
function gaSendMessage_(u,d){gaRequire_(u,['Administrator']);const title=gaNeed_(d.Titel,'Betreff',160),message=gaNeed_(d.Text,'Nachricht',3000);
  const turnusId=gaText_(d.TurnusID,100);if(turnusId&&!gaFind_('Turnusse',turnusId))throw new Error('Turnus nicht gefunden.');
  const id=gaId_();gaAppend_('Nachrichten',{ID:id,Titel:title,Text:message,TurnusID:turnusId,VonBenutzerID:u.ID,ErstelltAm:gaNow_()});
  if(turnusId)gaNotifyTurnus_(turnusId,'Nachricht',title,message.slice(0,240),id);
  else gaRows_('Benutzer').filter(x=>x.Rolle==='Teilnehmer'&&gaBool_(x.Aktiv)).forEach(x=>gaNotify_(x.ID,'Nachricht',title,message.slice(0,240),id));
  gaLog_(u.ID,'SENDEN','Nachricht',id,{TurnusID:turnusId});return {ok:true};}
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
  const base=appUrl.split('#')[0];
  return base + (base.includes('#') ? '' : '#') + 'invite=' + encodeURIComponent(token);
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
