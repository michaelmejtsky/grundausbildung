/**
 * GRUNDAUSBILDUNG – Feuerwehr Ausbildungsplattform V1.0
 * Backend: an Google Sheet gebundenes Google Apps Script.
 * Ausführung als Eigentümer, kein Zugriff auf das Sheet für andere Nutzer nötig.
 * Zugang: eigene Benutzerkonten mit Passwort (Pilotbetrieb, siehe README).
 * Wichtig: die Google Tabelle NICHT für Teilnehmer freigeben.
 */
const GA = Object.freeze({
  VERSION: '1.13.11',
  SHEETS: {
    Benutzer: ['ID','Name','Email','Rolle','Bereich','Aktiv','Salt','Hash','ErstelltAm'],
    Turnusse: ['ID','Bezeichnung','Bereich','Aktiv','ErstelltAm'],
    Mitglieder: ['ID','Vorname','Nachname','Email','Telefon','TurnusID','Aktiv','ErstelltAm','Geburtsdatum','Standesbuchnummer','Ausbildungsweg'],
    Kurse: ['ID','Titel','Bereich','Inhalt','Lernziele','Links','Aktiv','ErstelltAm'],
    Termine: ['ID','KursID','TurnusID','Beginn','Ende','Ort','Status','ErstelltAm'],
    Teilnahmen: ['ID','TerminID','MitgliedID','Anwesend','AusbilderIDs','BestaetigtVon','BestaetigtAm'],
    Ausbildungsberichte: ['ID','TerminID','BeginnIst','EndeIst','DauerMinuten','FahrzeugeJSON','AusbilderIDs','Notiz','ErfasstVon','AktualisiertAm'],
    FreieTaetigkeiten: ['ID','Titel','Kategorie','Ort','BeginnIst','EndeIst','DauerMinuten','TeilnehmerIDs','AusbilderIDs','FahrzeugeJSON','Notiz','ErfasstVon','AktualisiertAm','Bereich'],
    ErweiterteZuordnungen: ['ID','MitgliedID','TurnusID','ZugeordnetVon','ZugeordnetAm'],
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
    AbschnittNachweise: ['ID','MitgliedID','KursID','Absolviert','Ausbildungsdatum','PruefungBestanden','Pruefungsdatum','Nachweis','Notiz','BestaetigtVon','BestaetigtAm'],
    Direktnachrichten: ['ID','VonBenutzerID','AnBenutzerID','Titel','Text','ErstelltAm','GelesenAm'],
    BewertungsFrageboegen: ['ID','KursID','FragenJSON','Version','Aktiv','AktualisiertVon','AktualisiertAm'],
    ErsteHilfeNachweise: ['ID','MitgliedID','Kursdatum','Stunden','Dateiname','DriveDateiID','Status','EingereichtVon','EingereichtAm','GeprueftVon','GeprueftAm','Pruefnotiz','EmailStatus','EmailGesendetAm','EmailEmpfaenger'],
    QuizKurse: ['ID','KursID','Aktiv','Pflicht','Bestehensgrenze','MaxVersuche','ZeitlimitMinuten','FragenJSON','Version','AktualisiertVon','AktualisiertAm'],
    QuizVersuche: ['ID','KursID','MitgliedID','TerminID','QuizVersion','Versuch','Status','BegonnenAm','AbgegebenAm','Punkte','MaxPunkte','Prozent','Bestanden','AntwortenJSON','FragenSnapshotJSON'],
    QuizFreigaben: ['ID','KursID','MitgliedID','QuizVersion','ZusatzVersuche','FreigegebenVon','FreigegebenAm'],
    Sitzungen: ['ID','BenutzerID','TokenHash','HashPrefix','AblaufMillis','WiderrufenAm','ErstelltAm']
  },
  ROLES: ['Administrator','Ausbilder','Teilnehmer','Fachverwaltung','Organisator Erweiterte Ausbildung'],
  AREAS: ['Grundausbildung','Erweiterte Ausbildung'],
  CHECK_STATUSES: ['Offen','Erledigt','Nicht erforderlich']
});

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Grundausbildung')
    .addItem('1 · Tabellen prüfen/erstellen','gaEinrichten')
    .addItem('2 · Ersten Administrator einrichten','gaErstenAdminEinrichten')
    .addItem('3 · Systemprüfung','gaSystemPruefen')
    .addItem('4 · Worker-Schlüssel einrichten','gaWorkerSchluesselEinrichten')
    .addItem('5 · Push-Speicher und Trigger einrichten','gaPushEinrichten')
    .addItem('6 · Login- und Quiz-Tabellen einrichten','gaErweiterungenEinrichten')
    .addItem('7 · Tätigkeitsberichte einrichten','gaBerichtsTabellenEinrichten')
    .addItem('8 · Erweiterte Ausbildung vorbereiten','gaErweiterteTabellenEinrichten')
    .addItem('9 · Verwaltungs-Mail-Trigger einrichten','gaVerwaltungsMailEinrichten').addToUi();
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
  defaults.forEach(v=>{if(!existing.includes(v[0])&&!(v[0]==='Erste-Hilfe-Bescheinigung abgegeben'&&gaChecklistNamedItem_(v[0],'GA_EH_CHECK_ID_V1')))gaAppend_('Checklistenpunkte',{
    ID:gaId_(),Titel:v[0],Bereich:v[1],Zustaendig:v[2],Aktiv:'JA',ErstelltAm:gaNow_()
  });});
  const message='Grundausbildung bereit: '+Object.keys(GA.SHEETS).length+' Tabellen geprüft. Vorhandene Daten wurden nicht gelöscht.';
  Logger.log(message);
  ss.toast(message,'Grundausbildung',7);
  return {ok:true,message};
}
/**
 * Zusatzinstallation, ohne bestehende Daten oder Beispielkurse zu verändern.
 * Start: Grundausbildung → 6 · Login- und Quiz-Tabellen einrichten
 */
function gaErweiterungenEinrichten(){
 const ss=gaSheet_();
 const names=['Sitzungen','QuizKurse','QuizVersuche','QuizFreigaben'];
 const created=[],verified=[];
 names.forEach(name=>{
  const header=GA.SHEETS[name];
  if(!header)throw new Error('Schema fehlt: '+name);
  let sh=ss.getSheetByName(name);
  if(!sh){sh=ss.insertSheet(name);created.push(name);}
  else verified.push(name);
  if(sh.getMaxColumns()<header.length)sh.insertColumnsAfter(sh.getMaxColumns(),header.length-sh.getMaxColumns());
  if(sh.getLastRow()===0)sh.getRange(1,1,1,header.length).setValues([header]);
  else {
   const existing=sh.getRange(1,1,1,header.length).getDisplayValues()[0];
   if(existing.some((value,index)=>value!==header[index]))
    throw new Error('Spaltenüberschrift von '+name+' weicht ab. Bestehende Tabelle nicht überschrieben; bitte manuell prüfen.');
  }
  sh.setFrozenRows(1);sh.getRange(1,1,1,header.length).setBackground('#E8EDF3').setFontWeight('bold');
 });
 const message='Zusatz-Tabellen fertig. Neu: '+(created.join(', ')||'keine')+
  '. Bereits vorhanden: '+(verified.join(', ')||'keine')+'. Keine Ausbildungsdaten verändert.';
 Logger.log(message);
 ss.toast(message,'Einrichtung abgeschlossen',7);
 return {ok:true,created,verified,message};
}

/** Erstellt ausschließlich die Ausbildungsberichte-Tabelle; andere Tabellen bleiben unverändert. */
function gaBerichtsTabellenEinrichten(){
 const ss=gaSheet_(),headers=GA.SHEETS.Ausbildungsberichte;
 let sheet=ss.getSheetByName('Ausbildungsberichte'),created=!sheet;
 if(!sheet)sheet=ss.insertSheet('Ausbildungsberichte');
 if(sheet.getMaxColumns()<headers.length)sheet.insertColumnsAfter(sheet.getMaxColumns(),headers.length-sheet.getMaxColumns());
 if(sheet.getLastRow()===0)sheet.getRange(1,1,1,headers.length).setValues([headers]);
 else {
  const current=sheet.getRange(1,1,1,headers.length).getDisplayValues()[0];
  if(headers.some((h,i)=>h!==current[i]))throw new Error('Die Tabelle Ausbildungsberichte hat unerwartete Überschriften. Sie wurde nicht überschrieben.');
 }
 sheet.setFrozenRows(1);
 sheet.getRange(1,1,1,headers.length).setBackground('#E8EDF3').setFontWeight('bold');
 const message=created?'Tabelle Ausbildungsberichte erstellt.':'Tabelle Ausbildungsberichte geprüft; vorhandene Daten bleiben unverändert.';
 Logger.log(message);
 ss.toast(message,'FDISK-Tätigkeitsberichte',6);
 return {ok:true,created,message};
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
function gaOwnMember_(u,members){
 const email=String(u.Email||'').trim().toLowerCase();
 if(!email)return null;
 const matches=(members||gaRows_('Mitglieder')).filter(m=>gaBool_(m.Aktiv)&&String(m.Email||'').trim().toLowerCase()===email);
 return matches.length===1?matches[0]:null;
}
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
 if(!token||typeof token!=='string'||token.length>200)throw new Error('Bitte anmelden.');
 const key=gaTokenKey_(token),cache=CacheService.getScriptCache();
 let packed=cache.get(key)||'';
 let parts=packed.split('|');
 // Sitzungen aus älteren Versionen bleiben für ihre ursprüngliche Cache-Laufzeit gültig.
 let userId='',fp='',expire=0;
 if(parts.length===2){userId=parts[0];fp=parts[1];}
 else if(parts.length===3&&Number(parts[2])>Date.now()){userId=parts[0];fp=parts[1];expire=Number(parts[2]);}
 if(!userId){
  const row=gaOptionalRows_('Sitzungen').find(r=>r.TokenHash===key&&!r.WiderrufenAm&&Number(r.AblaufMillis)>Date.now());
  if(row){userId=row.BenutzerID;fp=row.HashPrefix;expire=Number(row.AblaufMillis);
    const ttl=Math.min(21600,Math.max(1,Math.floor((expire-Date.now())/1000)));
    cache.put(key,userId+'|'+fp+'|'+expire,ttl);
  }
 }
 const user=userId&&gaFind_('Benutzer',userId);
 if(!user||!gaBool_(user.Aktiv)||!user.Hash||fp!==user.Hash.slice(0,24))
   throw new Error('Sitzung abgelaufen. Bitte erneut anmelden.');
 return user;
}
function gaLogin(email,password,remember){
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
 const persistent=remember===true||remember==='JA';
 if(persistent&&!gaSheet_().getSheetByName('Sitzungen'))
  throw new Error('30-Tage-Anmeldung noch nicht eingerichtet. Administrator: Tabellen prüfen/erstellen ausführen.');
 const token=gaId_().replace(/-/g,'')+gaId_().replace(/-/g,'');
 const expires=Date.now()+(persistent?30*86400000:21600000);
 const key=gaTokenKey_(token);
 if(persistent)gaAppend_('Sitzungen',{ID:gaId_(),BenutzerID:u.ID,TokenHash:key,HashPrefix:u.Hash.slice(0,24),
  AblaufMillis:String(expires),WiderrufenAm:'',ErstelltAm:gaNow_()});
 cache.put(key,u.ID+'|'+u.Hash.slice(0,24)+'|'+expires,21600);
 gaLog_(u.ID,'LOGIN','Benutzer',u.ID,{AngemeldetBleiben:persistent});
 return {token,user:gaPublicUser_(u),version:GA.VERSION,rememberUntil:persistent?expires:null};
}
function gaLogoutSession_(token){
 const key=gaTokenKey_(token);
 CacheService.getScriptCache().remove(key);
 const record=gaOptionalRows_('Sitzungen').find(r=>r.TokenHash===key&&!r.WiderrufenAm);
 if(record)gaReplace_('Sitzungen',record.ID,{WiderrufenAm:gaNow_()});
 return {ok:true};
}
function gaPublicUser_(u){return {ID:u.ID,Name:u.Name,Email:u.Email,Rolle:u.Rolle,Bereich:u.Bereich,Aktiv:u.Aktiv};}
function gaRequire_(u,roles){if(!roles.includes(u.Rolle))throw new Error('Keine Berechtigung für diese Funktion.');}
function gaLock_(callback){const l=LockService.getScriptLock();l.waitLock(20000);try{return callback();}finally{l.releaseLock();}}

const GA_ADV_ROLE='Organisator Erweiterte Ausbildung', GA_ADV_AREA='Erweiterte Ausbildung';
function gaIsAdvOrg_(u){return !!u&&u.Rolle===GA_ADV_ROLE;}

/** Bei wichtigen Ereignissen beide Ausbildungsstellen getrennt benachrichtigen. */
function gaNotifyAdvancedOrganizers_(type,title,message,ref){
 gaRows_('Benutzer').filter(x=>gaBool_(x.Aktiv)&&x.Rolle===GA_ADV_ROLE)
  .forEach(x=>gaNotify_(x.ID,type,title,message,ref));
}

function gaAdvancedCourse_(u,id){
 const c=gaFind_('Kurse',gaText_(id,100));
 if(!c||gaIsAdvOrg_(u)&&c.Bereich!==GA_ADV_AREA)throw new Error('Zugriff nur auf Kurse der erweiterten Ausbildung.');
 return c;
}
function gaAdvancedTurnus_(u,id){
 const t=gaFind_('Turnusse',gaText_(id,100));
 if(!t||gaIsAdvOrg_(u)&&t.Bereich!==GA_ADV_AREA)throw new Error('Zugriff nur auf Turnusse der erweiterten Ausbildung.');
 return t;
}
function gaAdvAssignments_(){return gaOptionalRows_('ErweiterteZuordnungen');}
function gaAdvAllowedMembers_(turnusId){
 const ids=new Set(gaAdvAssignments_().filter(x=>x.TurnusID===turnusId).map(x=>x.MitgliedID));
 return gaRows_('Mitglieder').filter(m=>gaBool_(m.Aktiv)&&(m.TurnusID===turnusId||ids.has(m.ID)));
}
function gaAdvMemberAllowed_(m){
 if(!m)return false;
 return gaFind_('Turnusse',m.TurnusID)?.Bereich===GA_ADV_AREA||
  gaAdvAssignments_().some(x=>x.MitgliedID===m.ID&&gaFind_('Turnusse',x.TurnusID)?.Bereich===GA_ADV_AREA);
}
// Der persönliche Abschluss ist eine zusätzliche Bestätigung; bestehende Turnusse und Nachweise bleiben unverändert.
const GA_ADV_COMPLETION_PREFIX='GA_ADV_ABSCHLUSS_V1_';
function gaAdvCompletionKey_(id){return GA_ADV_COMPLETION_PREFIX+encodeURIComponent(gaNeed_(id,'Mitglied',100));}
function gaAdvCompletionRead_(id,all){
 const key=gaAdvCompletionKey_(id),raw=all?all[key]:PropertiesService.getScriptProperties().getProperty(key);
 if(raw===null||raw===undefined)return null;
 let v;try{v=JSON.parse(raw);}catch(e){throw new Error('Gespeicherter Abschluss ist beschädigt und muss geprüft werden.');}
 if(!v||v.Version!==1||typeof v.AbgeschlossenAm!=='string'||!v.AbgeschlossenAm||typeof v.BestaetigtVon!=='string'||!v.BestaetigtVon)
  throw new Error('Gespeicherter Abschluss ist unvollständig und muss geprüft werden.');
 return {MitgliedID:id,AbgeschlossenAm:v.AbgeschlossenAm,BestaetigtVon:v.BestaetigtVon};
}
function gaAdvCompletionVisible_(members){
 const all=PropertiesService.getScriptProperties().getProperties(),records=[];
 for(const m of members||[])try{const r=gaAdvCompletionRead_(m.ID,all);if(r)records.push(r);}
  catch(e){records.push({MitgliedID:m.ID,Fehler:'Gespeicherter Abschluss muss geprüft werden.'});}
 if(!records.some(r=>!r.Fehler))return records;
 const notices=gaRows_('Benachrichtigungen');
 return records.map(r=>r.Fehler?r:{...r,Benachrichtigt:notices.some(n=>n.BezugID==='ADVCOMPLETE:'+r.MitgliedID)});
}
function gaCompleteAdvancedTraining_(u,d){
 gaRequire_(u,['Administrator',GA_ADV_ROLE]);
 const member=gaFind_('Mitglieder',gaNeed_(d.MitgliedID,'Mitglied',100));
 if(!member||!gaBool_(member.Aktiv)||!gaAdvMemberAllowed_(member))
  throw new Error('Nur aktive, der erweiterten Ausbildung zugeordnete Teilnehmer können abgeschlossen werden.');
 const props=PropertiesService.getScriptProperties(),key=gaAdvCompletionKey_(member.ID);
 let record=gaAdvCompletionRead_(member.ID),created=false;
 if(!record){
  const value={Version:1,AbgeschlossenAm:gaNow_(),BestaetigtVon:u.ID};
  props.setProperty(key,JSON.stringify(value));record={MitgliedID:member.ID,...value};created=true;
  try{gaLog_(u.ID,'ERWEITERTE_AUSBILDUNG_ABSCHLIESSEN','Mitglied',member.ID,{AbgeschlossenAm:value.AbgeschlossenAm});}
  catch(e){console.warn('Abschlussprotokoll fehlgeschlagen:',String(e));}
 }
 const ref='ADVCOMPLETE:'+member.ID;
 try{
  if(gaRows_('Benachrichtigungen').some(n=>n.BezugID===ref))
   return {ok:true,bereitsAbgeschlossen:!created,benachrichtigt:true,message:created?'Erweiterte Ausbildung abgeschlossen.':'Abschluss und Glückwunsch sind bereits erfasst.'};
  const allMembers=gaRows_('Mitglieder'),email=String(member.Email||'').trim().toLowerCase();
  const accounts=email?gaRows_('Benutzer').filter(x=>x.Rolle==='Teilnehmer'&&gaBool_(x.Aktiv)&&String(x.Email||'').trim().toLowerCase()===email):[];
  if(accounts.length!==1||gaOwnMember_(accounts[0],allMembers)?.ID!==member.ID)
   return {ok:true,bereitsAbgeschlossen:!created,benachrichtigt:false,message:'Abschluss gespeichert. Kein eindeutig zugeordneter aktiver Teilnehmerzugang – Glückwunsch konnte noch nicht zugestellt werden.'};
  const notification=gaNotify_(accounts[0].ID,'Aufgabe','Erweiterte Ausbildung abgeschlossen – Gratulation!',
   'Hallo '+member.Vorname+'! Deine erweiterte Ausbildung wurde offiziell abgeschlossen. Herzlichen Glückwunsch zu deinem Erfolg!',ref);
  try{gaPushQueue_(1,notification);}catch(e){console.warn('Abschluss-Push wartet:',String(e));}
  return {ok:true,bereitsAbgeschlossen:!created,benachrichtigt:true,message:'Abschluss gespeichert und Glückwunsch als App-Benachrichtigung erstellt.'};
 }catch(e){
  console.warn('Glückwunsch zur erweiterten Ausbildung fehlgeschlagen:',String(e));
  return {ok:true,bereitsAbgeschlossen:!created,benachrichtigt:false,message:'Abschluss gespeichert. Die Benachrichtigung konnte nicht erstellt werden; bitte erneut prüfen.'};
 }
}
function gaSaveAdvancedEnrollment_(u,d){
 gaRequire_(u,['Administrator',GA_ADV_ROLE]);
 const m=gaFind_('Mitglieder',gaNeed_(d.MitgliedID,'Mitglied',100));
 const t=gaAdvancedTurnus_(u,gaNeed_(d.TurnusID,'Erweiterter Turnus',100));
 if(!m||!gaBool_(m.Aktiv)||t.Bereich!==GA_ADV_AREA||!gaBool_(t.Aktiv))throw new Error('Aktives Mitglied und aktiver erweiterter Turnus sind erforderlich.');
 if(m.TurnusID===t.ID||gaAdvAssignments_().some(x=>x.MitgliedID===m.ID&&x.TurnusID===t.ID))
  return {ok:true,message:'Zuordnung bereits vorhanden.'};
 gaAppend_('ErweiterteZuordnungen',{ID:gaId_(),MitgliedID:m.ID,TurnusID:t.ID,ZugeordnetVon:u.ID,ZugeordnetAm:gaNow_()});
 gaLog_(u.ID,'ERWEITERTE_ZUORDNUNG','Mitglied',m.ID,{TurnusID:t.ID,UrspruenglicherTurnus:m.TurnusID});
 return {ok:true,message:'Für erweiterte Ausbildung zugeordnet; GAB-Turnus bleibt unverändert.'};
}
function gaErweiterteTabellenEinrichten(){
 const ss=gaSheet_(),columns=GA.SHEETS.ErweiterteZuordnungen;
 let tab=ss.getSheetByName('ErweiterteZuordnungen');
 if(!tab)tab=ss.insertSheet('ErweiterteZuordnungen');
 if(tab.getMaxColumns()<columns.length)tab.insertColumnsAfter(tab.getMaxColumns(),columns.length-tab.getMaxColumns());
 if(tab.getLastRow()===0)tab.getRange(1,1,1,columns.length).setValues([columns]);
 else if(tab.getRange(1,1,1,columns.length).getDisplayValues()[0].some((v,i)=>v!==columns[i]))
  throw new Error('ErweiterteZuordnungen: Unerwartete Spalten. Nichts überschrieben.');
 tab.setFrozenRows(1);
 const act=ss.getSheetByName('FreieTaetigkeiten');
 if(act){
  const index=GA.SHEETS.FreieTaetigkeiten.length;
  if(act.getMaxColumns()<index)act.insertColumnsAfter(act.getMaxColumns(),index-act.getMaxColumns());
  const header=String(act.getRange(1,index).getDisplayValue()||'').trim();
  if(header&&header!=='Bereich')throw new Error('FreieTaetigkeiten: Bestehende Spalte nicht überschrieben. Bitte Spaltenstruktur prüfen.');
  if(!header)act.getRange(1,index).setValue('Bereich');
 }
 Logger.log('Erweiterte Ausbildung vorbereitet.');ss.toast('Erweiterte Ausbildung vorbereitet.','Grundausbildung',6);
 return {ok:true};
}


function gaAdvancedOrganizerState_(u){
 const allCourses=gaRows_('Kurse'),allTurns=gaRows_('Turnusse'),allMembers=gaRows_('Mitglieder');
 const courses=allCourses.filter(x=>x.Bereich===GA_ADV_AREA),turnusse=allTurns.filter(x=>x.Bereich===GA_ADV_AREA);
 const validity=gaValidityConfig_(),projects=gaOptionalRows_('KursProjekte').filter(x=>x.Bereich===GA_ADV_AREA);
 const courseIDs=new Set(courses.map(x=>x.ID)),turnIDs=new Set(turnusse.map(x=>x.ID));
 const terms=gaRows_('Termine').filter(t=>courseIDs.has(t.KursID)&&turnIDs.has(t.TurnusID)),termIDs=new Set(terms.map(x=>x.ID));
 const assignments=gaAdvAssignments_().filter(x=>turnIDs.has(x.TurnusID));
 const native=allMembers.filter(m=>turnIDs.has(m.TurnusID));
 const guestIDs=new Set(assignments.map(x=>x.MitgliedID));
 const guests=allMembers.filter(m=>guestIDs.has(m.ID)&&!native.some(n=>n.ID===m.ID))
  .map(m=>({ID:m.ID,Vorname:m.Vorname,Nachname:m.Nachname,TurnusID:assignments.find(a=>a.MitgliedID===m.ID).TurnusID,Aktiv:m.Aktiv,Ausbildungsweg:'GAB-Gast'}));
 const gabNamen=allMembers.filter(m=>gaFind_('Turnusse',m.TurnusID)?.Bereich==='Grundausbildung'&&gaBool_(m.Aktiv))
  .map(m=>({ID:m.ID,Vorname:m.Vorname,Nachname:m.Nachname}));
 // Nur der Abschlussstatus und der Name sind für die Übergabe erforderlich.
 const gabQuals=gaOptionalRows_('QualifikationMitglieder'),gabProofs=gaOptionalRows_('AbschnittNachweise');
 const gabAbgeschlossen=allMembers.filter(m=>gaBool_(m.Aktiv)&&
   allTurns.some(t=>t.ID===m.TurnusID&&t.Bereich==='Grundausbildung')&&
   gaGabCompletion_(m,gabQuals,gabProofs).complete)
  .map(m=>({ID:m.ID,Vorname:m.Vorname,Nachname:m.Nachname,
   ErweiterteTurnusIDs:assignments.filter(a=>a.MitgliedID===m.ID).map(a=>a.TurnusID)}));
 const attend=gaRows_('Teilnahmen').filter(a=>termIDs.has(a.TerminID));
 const cfg=gaOptionalRows_('QuizKurse').filter(x=>courseIDs.has(x.KursID));
 const attempts=gaOptionalRows_('QuizVersuche').filter(x=>courseIDs.has(x.KursID));
 const rights={KurseGestalten:true,KurseFreigeben:true,KurseBearbeiten:true,TerminePlanen:true,
  FrageboegenBearbeiten:true,BewertungenAnsehen:true,MeldungenBearbeiten:true};
 return {
  version:GA.VERSION,user:gaPublicUser_(u),rechte:rights,organisatorErweitert:true,
  kurse:courses,turnusse,termine:terms,mitglieder:native.concat(guests),gabNamen,gabAbgeschlossen,
  erweiterteAbschluesse:gaAdvCompletionVisible_(native.concat(guests)),
  erweiterteZuordnungen:assignments.map(x=>({MitgliedID:x.MitgliedID,TurnusID:x.TurnusID})),
  teilnahmen:attend,benutzer:gaRows_('Benutzer').filter(x=>['Administrator','Ausbilder',GA_ADV_ROLE].includes(x.Rolle))
   .map(x=>({ID:x.ID,Name:x.Name,Rolle:x.Rolle,Aktiv:x.Aktiv})),
  kursProjekte:projects,
  kursPlanung:gaCoursePlanVisible_(courses,projects),
  gueltigkeit:gaValidityVisible_(validity,turnusse,courses,projects),
  quizKurse:cfg.map(gaQuizPublicConfig_),
  quizVersuche:attempts.map(x=>({ID:x.ID,KursID:x.KursID,MitgliedID:x.MitgliedID,TerminID:x.TerminID,
   QuizVersion:x.QuizVersion,Versuch:x.Versuch,Status:x.Status,Prozent:x.Prozent,Bestanden:x.Bestanden})),
  quizFreigaben:gaOptionalRows_('QuizFreigaben').filter(x=>courseIDs.has(x.KursID))
   .map(x=>({KursID:x.KursID,MitgliedID:x.MitgliedID,QuizVersion:x.QuizVersion,ZusatzVersuche:x.ZusatzVersuche})),
  frageboegen:gaOptionalRows_('BewertungsFrageboegen').filter(x=>courseIDs.has(x.KursID)&&x.Aktiv==='JA'),
  bewertungen:gaOptionalRows_('Bewertungen').filter(x=>courseIDs.has(x.KursID)),
  qualifikationen:native.filter(x=>gaBool_(x.Aktiv)).map(m=>gaQualificationStatus_(m,
   gaOptionalRows_('QualifikationMitglieder'),gaOptionalRows_('KursAnforderungen'),courses,terms,attend,
   turnusse,cfg,attempts,[],assignments,{},validity)),
  ausbildungsberichte:gaOptionalRows_('Ausbildungsberichte').filter(x=>termIDs.has(x.TerminID)),
  freieTaetigkeiten:gaOptionalRows_('FreieTaetigkeiten').filter(x=>x.Bereich===GA_ADV_AREA),
  meldungen:gaOptionalRows_('Meldungen').filter(x=>x.KursID&&courseIDs.has(x.KursID)||x.ErstelltVon===u.ID),
  nachrichten:gaRows_('Nachrichten').filter(x=>x.VonBenutzerID===u.ID),
  meMember:null,checklistenpunkte:[],checks:[],eigeneBewertungen:[],offeneBewertungen:[],
  ersteHilfeNachweise:[],abschnittNachweise:[],kursAnforderungen:[],berechtigungen:[],
  direktnachrichten:gaOptionalRows_('Direktnachrichten').filter(x=>x.VonBenutzerID===u.ID||x.AnBenutzerID===u.ID).slice(-100).reverse().map(x=>{
   const sender=gaFind_('Benutzer',x.VonBenutzerID);
   const member=gaRows_('Mitglieder').find(m=>m.Email&&m.Email.toLowerCase()===String(sender?.Email||'').toLowerCase());
   return {...x,VonName:sender?.Name||'Teilnehmer',AntwortMoeglich:sender?.Rolle==='Teilnehmer'&&gaAdvMemberAllowed_(member)};
  }),nachrichtenEmpfaenger:[],
  pushEigeneRegeln:gaPushRule_(u.ID),pushGeraeteAnzahl:gaOptionalRows_('PushGeraete').filter(x=>x.BenutzerID===u.ID&&gaBool_(x.Aktiv)).length,pushRegeln:[],
  benachrichtigungen:gaRows_('Benachrichtigungen').filter(n=>n.BenutzerID===u.ID).slice(-100).reverse()
 };
}


function gaOrganizerGuard_(u,method,d){
 if(!gaIsAdvOrg_(u))return;
 if(['saveCourse','saveQuiz','getQuizEdit','unlockQuiz','saveQuestionnaire','exportTrainingPdf'].includes(method)){
  const id=gaText_(d.KursID||((method==='saveCourse')?d.ID:''),100)||(d.TerminID?gaFind_('Termine',d.TerminID)?.KursID:'');
  if(id)gaAdvancedCourse_(u,id);
  if(d.TerminID){
   const term=gaFind_('Termine',d.TerminID);
   if(!term)throw new Error('Termin nicht gefunden.');
   gaAdvancedTurnus_(u,term.TurnusID);
  }
 }
 if(['saveTermin','saveAttendance'].includes(method)){
  const term=d.TerminID?gaFind_('Termine',d.TerminID):d.ID?gaFind_('Termine',d.ID):null;
  if(method==='saveAttendance'&&!term)throw new Error('Ausbildungstermin nicht gefunden.');
  // Bei Änderungen auch die neuen Ziel-IDs prüfen, um fremde GAB-Daten zu schützen.
  if(term){gaAdvancedCourse_(u,term.KursID);gaAdvancedTurnus_(u,term.TurnusID);}
  const course=gaAdvancedCourse_(u,method==='saveTermin'?d.KursID:term.KursID);
  const turn=gaAdvancedTurnus_(u,method==='saveTermin'?d.TurnusID:term.TurnusID);
  if(course.Bereich!==GA_ADV_AREA||turn.Bereich!==GA_ADV_AREA)throw new Error('Nur erweiterte Kurstermine.');
 }
 if(method==='saveTurnus'){
  if(d.Bereich!==GA_ADV_AREA)throw new Error('Nur erweiterte Turnusse.');
  if(d.ID)gaAdvancedTurnus_(u,d.ID);
 }
 if(method==='saveMember'){
  gaAdvancedTurnus_(u,d.TurnusID);
  if(d.ID){
   const m=gaFind_('Mitglieder',d.ID);
   if(!m||gaFind_('Turnusse',m.TurnusID)?.Bereich!==GA_ADV_AREA)
    throw new Error('Bestehende GAB-Mitglieder nicht bearbeiten. Nutze die zusätzliche Zuordnung.');
  }
  if(d.Ausbildungsweg!==GA_ADV_AREA)throw new Error('Nur Erweiterte Ausbildung.');
 }
 if(['saveProject','submitProject','reviewProject'].includes(method)){
  if(method==='saveProject'&&d.Bereich!==GA_ADV_AREA)throw new Error('Nur erweiterte Kursprojekte.');
  if(d.ID){
   const p=gaFind_('KursProjekte',d.ID);
   if(!p||p.Bereich!==GA_ADV_AREA)throw new Error('Fremdes Kursprojekt.');
  }
 }
 if(method==='saveFreeActivity'){
  if(d.ID&&gaFind_('FreieTaetigkeiten',d.ID)?.Bereich!==GA_ADV_AREA)
    throw new Error('Fremde Tätigkeit.');
  if(d.TeilnehmerIDs?.some(id=>!gaAdvMemberAllowed_(gaFind_('Mitglieder',id))))
    throw new Error('Teilnehmer gehört nicht zur erweiterten Ausbildung.');
 }
 if(method==='exportFreeActivityPdf'&&gaFind_('FreieTaetigkeiten',d.ID)?.Bereich!==GA_ADV_AREA)
  throw new Error('Kein Zugriff auf diesen Bericht.');
 if(method==='setReportStatus'){
  const report=gaFind_('Meldungen',d.ID),course=report?.KursID?gaFind_('Kurse',report.KursID):null;
  if(!report||!(course?.Bereich===GA_ADV_AREA||report.ErstelltVon===u.ID))
   throw new Error('Fremde Meldung.');
 }
 if(method==='submitReport'&&d.KursID)gaAdvancedCourse_(u,d.KursID);
 if(method==='inviteUser'){
  if(d.Rolle!=='Teilnehmer')throw new Error('Nur Teilnehmerzugänge einladen.');
  const member=gaFind_('Mitglieder',d.MitgliedID);
  if(!gaAdvMemberAllowed_(member))throw new Error('Mitglied nicht der erweiterten Ausbildung zugeordnet.');
 }
 if(method==='sendMessage'){
  if(d.EmpfaengerArt==='TURNUS')gaAdvancedTurnus_(u,d.TurnusID);
  if(d.EmpfaengerArt==='MITGLIED'&&!gaAdvMemberAllowed_(gaFind_('Mitglieder',d.MitgliedID)))
   throw new Error('Mitglied nicht für erweiterte Ausbildung zugeordnet.');
 }
}

/** Ausbilder bleiben Ausbilder; Ausbildungsbereiche ergänzen ihre Funktionsrechte. */
const GA_TRAINER_AREAS_PREFIX='GA_TRAINER_AREAS_V1_';
function gaTrainerAreas_(u){
 if(u.Rolle!=='Ausbilder')return [];
 const raw=PropertiesService.getScriptProperties().getProperty(GA_TRAINER_AREAS_PREFIX+encodeURIComponent(u.ID));
 // Bestehende Ausbilder hatten Zugriff auf beide Bereiche. Bis zur expliziten Vergabe bleibt dieser erhalten.
 if(raw===null)return GA.AREAS.includes(u.Bereich)?[u.Bereich]:GA.AREAS.slice();
 let list;try{list=JSON.parse(raw);}catch(e){throw new Error('Ausbildungsbereiche beschädigt. Bitte Administrator kontaktieren.');}
 if(!Array.isArray(list)||!list.length||list.some(a=>!GA.AREAS.includes(a)))
  throw new Error('Ausbildungsbereiche ungültig. Bitte Administrator kontaktieren.');
 return [...new Set(list)];
}
function gaStaffAreaAllowed_(u,area){
 return u.Rolle==='Administrator'||u.Rolle==='Ausbilder'&&gaTrainerAreas_(u).includes(area)||gaIsAdvOrg_(u)&&area===GA_ADV_AREA;
}
function gaTrainerContext_(u,requested){
 if(u.Rolle!=='Ausbilder')return u;
 const areas=gaTrainerAreas_(u);
 if(requested&&!areas.includes(requested))throw new Error('Keine Berechtigung für diesen Ausbildungsbereich. Bitte Bereich erneut auswählen.');
 return {...u,_gaTrainerArea:requested||(areas.length===1?areas[0]:'')};
}
function gaTrainerMixedAllowed_(u){return u._gaTrainerArea===GA_ADV_AREA&&gaTrainerAreas_(u).includes('Grundausbildung');}
function gaTrainerMembers_(area,u){
 const turns=gaRows_('Turnusse'),assignments=gaAdvAssignments_(),turnIds=new Set(turns.filter(t=>t.Bereich===area).map(t=>t.ID));
 if(u&&gaTrainerMixedAllowed_(u)){const courseIds=new Set(gaRows_('Kurse').filter(c=>c.Bereich===area).map(c=>c.ID));gaRows_('Termine').filter(t=>courseIds.has(t.KursID)&&turns.some(g=>g.ID===t.TurnusID&&g.Bereich==='Grundausbildung')).forEach(t=>turnIds.add(t.TurnusID));}
 return gaRows_('Mitglieder').filter(m=>turnIds.has(m.TurnusID)||area===GA_ADV_AREA&&assignments.some(a=>a.MitgliedID===m.ID&&turnIds.has(a.TurnusID)));
}
function gaTrainerGuard_(u,method,d){
 if(u.Rolle!=='Ausbilder')return;
 const area=u._gaTrainerArea;
 if(['state','logout'].includes(method))return;
 if(!area)throw new Error('Bitte zuerst den Ausbildungsbereich auswählen.');
 const neutral=['readDirect','readNotification','registerPush','removePush','setPushRule','testPush','submitAidProof','readAidPdf','pdfTemplateInfo'];
 if(neutral.includes(method))return; // Diese Funktionen prüfen zusätzlich das eigene Konto / den eigenen Nachweis.
 const supported=['saveCourse','saveQuiz','getQuizEdit','unlockQuiz','saveQuestionnaire','saveTermin','saveAttendance',
  'saveProject','submitProject','reviewProject','submitReport','setReportStatus','exportTrainingPdf','saveFreeActivity','exportFreeActivityPdf','sendDirect','startQuiz','submitQuiz','saveRating'];
 if(!supported.includes(method))throw new Error('Keine Berechtigung als Ausbilder für diese Aktion.');
 const check=(table,id)=>{const row=id?gaFind_(table,id):null;if(!row||row.Bereich!==area)throw new Error('Kein Zugriff außerhalb des gewählten Ausbildungsbereichs.');return row;};
 const turn=id=>{const t=gaFind_('Turnusse',id);if(!t||!(t.Bereich===area||gaTrainerMixedAllowed_(u)&&t.Bereich==='Grundausbildung'))throw new Error('Kein Zugriff auf diesen Turnus.');return t;};
 const term=id=>{const t=gaFind_('Termine',id);if(!t)throw new Error('Termin nicht gefunden.');check('Kurse',t.KursID);turn(t.TurnusID);return t;};
 if(method==='saveCourse'){
  if(d.ID)check('Kurse',d.ID);
  if(d.Bereich!==area)throw new Error('Kurs muss im gewählten Ausbildungsbereich bleiben.');
 }
 if(['saveQuiz','getQuizEdit','unlockQuiz','saveQuestionnaire'].includes(method))check('Kurse',d.KursID);
 if(method==='unlockQuiz'&&!gaTrainerMembers_(area,u).some(m=>m.ID===d.MitgliedID))throw new Error('Teilnehmer gehört nicht zu diesem Ausbildungsbereich.');
 if(method==='saveTermin'){
  if(d.ID)term(d.ID);check('Kurse',d.KursID);turn(d.TurnusID);
 }
 if(['saveAttendance','saveRating'].includes(method))term(d.TerminID);
 if(method==='startQuiz')check('Kurse',d.KursID);
 if(method==='submitQuiz'){const attempt=gaFind_('QuizVersuche',d.VersuchID);if(!attempt)throw new Error('Quizversuch nicht gefunden.');check('Kurse',attempt.KursID);}
 if(['saveAttendance','saveFreeActivity'].includes(method)&&Array.isArray(d.AusbilderIDs)){
  const users=gaRows_('Benutzer');
  if(d.AusbilderIDs.some(id=>!users.some(x=>x.ID===id&&gaStaffAreaAllowed_(x,area))))
   throw new Error('Ein ausgewählter Ausbilder ist nicht für diesen Bereich freigegeben.');
 }
 if(['saveProject','submitProject','reviewProject'].includes(method)){
  if(d.ID)check('KursProjekte',d.ID);
  if(method!=='saveProject'&&!d.ID)throw new Error('Kursprojekt fehlt.');
  if(method==='saveProject'&&d.Bereich!==area)throw new Error('Kursprojekt muss im gewählten Bereich bleiben.');
 }
 if(method==='submitReport'&&d.KursID)check('Kurse',d.KursID);
 if(method==='setReportStatus'){
  const r=gaFind_('Meldungen',d.ID);if(!r)throw new Error('Meldung nicht gefunden.');
  if(r.KursID)check('Kurse',r.KursID);else if(r.ErstelltVon!==u.ID)throw new Error('Allgemeine fremde Meldungen bearbeitet die Administration.');
 }
 if(method==='exportTrainingPdf'){
  if(d.TerminID)term(d.TerminID);if(d.KursID)check('Kurse',d.KursID);
 }
 const free=id=>{const r=gaFind_('FreieTaetigkeiten',id);if(!r||!(r.Bereich===area||!r.Bereich&&r.ErfasstVon===u.ID))throw new Error('Kein Zugriff auf diesen Tätigkeitsbericht.');};
 if(method==='exportFreeActivityPdf')free(d.ID);
 if(method==='saveFreeActivity'){
  if(d.ID)free(d.ID);
  if(d.Bereich&&d.Bereich!==area)throw new Error('Tätigkeit gehört zu einem anderen Ausbildungsbereich.');
  d.Bereich=area;
  const ids=new Set(gaTrainerMembers_(area,u).map(m=>m.ID));
  if(Array.isArray(d.TeilnehmerIDs)&&d.TeilnehmerIDs.some(id=>!ids.has(id)))throw new Error('Teilnehmer gehört nicht zu diesem Ausbildungsbereich.');
 }
 if(method==='sendDirect'){
  const recipient=gaFind_('Benutzer',d.AnBenutzerID);
  if(recipient?.Rolle==='Teilnehmer'){
   const member=gaOwnMember_(recipient);
   if(!member||!gaTrainerMembers_(area,u).some(m=>m.ID===member.ID))throw new Error('Teilnehmer gehört nicht zu diesem Ausbildungsbereich.');
  }
 }
}
function gaTrainerState_(u){
 const areas=gaTrainerAreas_(u),area=u._gaTrainerArea;
 if(!area)return {version:GA.VERSION,user:gaPublicUser_(u),rechte:gaPermissions_(u),ausbilderBereiche:areas,ausbilderBereich:'',ausbilderBereichAuswahlNoetig:true};
 const s=gaBaseState_(u),courseIds=new Set(s.kurse.filter(c=>c.Bereich===area).map(c=>c.ID)),
  turnIds=new Set(s.turnusse.filter(t=>t.Bereich===area||gaTrainerMixedAllowed_(u)&&t.Bereich==='Grundausbildung').map(t=>t.ID));
 s.kurse=s.kurse.filter(c=>courseIds.has(c.ID));s.turnusse=s.turnusse.filter(t=>turnIds.has(t.ID));
 s.termine=s.termine.filter(t=>courseIds.has(t.KursID)&&turnIds.has(t.TurnusID));
 const termIds=new Set(s.termine.map(t=>t.ID)),members=gaTrainerMembers_(area,u),memberIds=new Set(members.map(m=>m.ID));
 // Historische Namen für eigene Bereichsberichte erhalten, ohne fremde Stammdaten mitzuliefern.
 const historyIds=new Set(s.teilnahmen.filter(a=>termIds.has(a.TerminID)).map(a=>a.MitgliedID));
 s.mitglieder=s.mitglieder.filter(m=>memberIds.has(m.ID)||historyIds.has(m.ID)).map(m=>{
  if(s.turnusse.some(t=>t.ID===m.TurnusID&&t.Bereich===area))return m;
  const assignment=s.erweiterteZuordnungen.find(a=>a.MitgliedID===m.ID&&turnIds.has(a.TurnusID));
  return {ID:m.ID,Vorname:m.Vorname,Nachname:m.Nachname,TurnusID:assignment?.TurnusID||(turnIds.has(m.TurnusID)?m.TurnusID:''),Aktiv:m.Aktiv,Ausbildungsweg:assignment||memberIds.has(m.ID)?'GAB-Gast':'Historischer Teilnehmer'};
 });
 s.teilnahmen=s.teilnahmen.filter(a=>termIds.has(a.TerminID));
 s.kursProjekte=s.kursProjekte.filter(p=>p.Bereich===area);
 s.ausbildungsberichte=s.ausbildungsberichte.filter(r=>termIds.has(r.TerminID));
 s.freieTaetigkeiten=s.freieTaetigkeiten.filter(r=>r.Bereich===area||!r.Bereich&&r.ErfasstVon===u.ID);
 s.meldungen=s.meldungen.filter(r=>r.KursID?courseIds.has(r.KursID):r.ErstelltVon===u.ID);
 s.bewertungen=s.bewertungen.filter(r=>courseIds.has(r.KursID)&&(!r.TerminID||termIds.has(r.TerminID)));
 s.eigeneBewertungen=s.eigeneBewertungen.filter(r=>courseIds.has(r.KursID));
 s.frageboegen=s.frageboegen.filter(r=>r.KursID==='ALLGEMEIN'||courseIds.has(r.KursID));
 s.quizKurse=s.quizKurse.filter(r=>courseIds.has(r.KursID));
 for(const key of ['quizFreigaben','quizVersuche'])s[key]=s[key].filter(r=>courseIds.has(r.KursID)&&(memberIds.has(r.MitgliedID)||historyIds.has(r.MitgliedID))&&(!r.TerminID||termIds.has(r.TerminID)));
 s.erweiterteZuordnungen=s.erweiterteZuordnungen.filter(a=>area===GA_ADV_AREA&&turnIds.has(a.TurnusID)&&memberIds.has(a.MitgliedID));
 // Ausbilder verwalten keine persönlichen GAB-Qualifikationen ihrer erweiterten Gäste.
 s.qualifikationen=s.qualifikationen.filter(q=>s.meMember&&q.MitgliedID===s.meMember.ID);s.erweiterteAbschluesse=s.erweiterteAbschluesse.filter(q=>s.meMember&&q.MitgliedID===s.meMember.ID);
 const users=gaRows_('Benutzer');
 s.benutzer=users.filter(x=>gaStaffAreaAllowed_(x,area)).map(x=>({ID:x.ID,Name:x.Name,Rolle:x.Rolle,Aktiv:x.Aktiv,Ausbildungsbereiche:x.Rolle==='Ausbilder'?gaTrainerAreas_(x):[]}));
 s.nachrichtenEmpfaenger=s.nachrichtenEmpfaenger.filter(x=>x.Rolle!=='Teilnehmer'||(()=>{const m=gaOwnMember_(x);return !!m&&memberIds.has(m.ID);})()).map(x=>({ID:x.ID,Name:x.Name,Rolle:x.Rolle,Aktiv:x.Aktiv}));
 s.kursPlanung=gaCoursePlanVisible_(s.kurse,s.kursProjekte);
 s.gueltigkeit=gaValidityVisible_(gaValidityConfig_(),s.turnusse,s.kurse,s.kursProjekte);
 return {...s,ausbilderBereiche:areas,ausbilderBereich:area,ausbilderBereichAuswahlNoetig:false};
}
function gaState_(u){
 if(u.Rolle==='Ausbilder')return gaTrainerState_(gaTrainerContext_(u,u._gaTrainerArea));
 return gaBaseState_(u);
}

function gaApi(method,data,token){
  const d=data||{};
  if(['previewMailAction','confirmMailAction'].includes(method)&&(d._gaRolePreview||d._gaAdvancedView))throw new Error('Mail-Bestätigungen sind keine Aktion der Rollenvorschau.');
  if(method==='previewMailAction')return gaPreviewMailAction_(d);
  if(method==='confirmMailAction')return gaLock_(()=>gaConfirmMailAction_(d));
  const actor=gaSession_(token);
  if((d._gaAdvancedView||d._gaRolePreview)&&actor.Rolle!=='Administrator')
    throw new Error('Nur Administratoren können Ansichten wechseln.');
  if(d._gaAdvancedView&&d._gaRolePreview)throw new Error('Ungültige Ansicht.');
  let u=actor;
  if(d._gaRolePreview){
    if(!['state','getQuizEdit','participantStatus'].includes(method))
      throw new Error('Die Rollenvorschau ist schreibgeschützt.');
    u=gaFind_('Benutzer',gaNeed_(d._gaRolePreview,'Benutzer',100));
    if(!u||!gaBool_(u.Aktiv))throw new Error('Aktives Benutzerkonto nicht gefunden.');
  }else if(d._gaAdvancedView){
    // Keine Änderung am Benutzerkonto. Aktionen werden mit der echten Admin-ID protokolliert.
    u={...actor,Rolle:GA_ADV_ROLE};
  }
  const trainerReset=method==='state'&&u.Rolle==='Ausbilder'&&d._gaTrainerArea&&!gaTrainerAreas_(u).includes(d._gaTrainerArea);
  u=gaTrainerContext_(u,trainerReset?'':d._gaTrainerArea);
  gaTrainerGuard_(u,method,d);
  gaOrganizerGuard_(u,method,d);
  const locked=fn=>gaLock_(()=>{if(u.Rolle==='Ausbilder'){u=gaTrainerContext_(u,u._gaTrainerArea);gaTrainerGuard_(u,method,d);}return fn();});
  if(gaIsAdvOrg_(u)&&!['state','logout','saveTurnus','setValidity','saveCourse','saveTermin','saveMember','inviteUser',
   'saveAdvancedEnrollment','completeAdvancedTraining','saveProject','submitProject','reviewProject','getQuizEdit','saveQuiz','unlockQuiz','saveQuestionnaire',
   'saveAttendance','exportTrainingPdf','pdfTemplateInfo','saveFreeActivity','exportFreeActivityPdf',
   'sendMessage','sendDirect','readDirect','submitReport','setReportStatus','readNotification','registerPush','removePush','setPushRule','testPush'].includes(method))
    throw new Error('Keine Berechtigung außerhalb der erweiterten Ausbildung.');
  if(method==='state'){
    const state={...gaState_(u),...(trainerReset?{ausbilderBereichNeuWaehlen:true}:{})};
    return d._gaRolePreview?{...state,administratorRollenvorschau:true}:
      d._gaAdvancedView?{...state,administratorErweitert:true}:state;
  }
  if(method==='setChecklistItemActive')return locked(()=>gaSetChecklistItemActive_(u,d));
  if(method==='sendZeugkammerRequest')return locked(()=>gaSendZeugkammerRequest_(u,d));
  if(method==='renewChecklistMail')return locked(()=>gaRenewChecklistMail_(u,d));
  if(method==='saveAdminMailSettings')return locked(()=>gaSaveAdminMailSettings_(u,d));
  if(method==='retryAdminMail')return locked(()=>gaRetryAdminMail_(u,d));
  if(method==='participantStatus')return gaParticipantStatus_(u);
  if(method==='gabCompletionNoticePreview')return gaGabCompletionNoticePreview_(u);
  if(method==='sendGabCompletionNotices')return locked(()=>gaSendGabCompletionNotices_(u,d));
  if(method==='logout')return gaLogoutSession_(token);
  if(method==='saveAdvancedEnrollment')return locked(()=>gaSaveAdvancedEnrollment_(u,d));
  if(method==='completeAdvancedTraining')return locked(()=>gaCompleteAdvancedTraining_(u,d));
  if(method==='saveTurnus')return locked(()=>gaSaveTurnus_(u,d));
  if(method==='setValidity')return locked(()=>gaSetValidity_(u,d));
  if(method==='saveCourse')return locked(()=>gaSaveCourse_(u,d));
  if(method==='saveQuiz')return locked(()=>gaSaveQuiz_(u,d));
  if(method==='getQuizEdit')return gaGetQuizEdit_(u,d);
  if(method==='startQuiz')return locked(()=>gaStartQuiz_(u,d));
  if(method==='submitQuiz')return locked(()=>gaSubmitQuiz_(u,d));
  if(method==='unlockQuiz')return locked(()=>gaUnlockQuiz_(u,d));
  if(method==='saveQuestionnaire')return locked(()=>gaSaveQuestionnaire_(u,d));
  if(method==='saveTermin')return locked(()=>gaSaveTermin_(u,d));
  if(method==='saveMember')return locked(()=>gaSaveMember_(u,d));
  if(method==='removeMember')return locked(()=>gaRemoveMember_(u,d));
  if(method==='saveQualification')return locked(()=>gaSaveQualification_(u,d));
  if(method==='saveAbschnittNachweis')return locked(()=>gaSaveAbschnittNachweis_(u,d));
  if(method==='setCourseRequirement')return locked(()=>gaSetCourseRequirement_(u,d));
  if(method==='setAttendanceMember')return locked(()=>gaSetAttendanceMember_(u,d));
  if(method==='sendDirect')return locked(()=>gaSendDirect_(u,d));
  if(method==='readDirect')return locked(()=>gaReadDirect_(u,d));
  if(method==='setPermission')return locked(()=>gaSetPermission_(u,d));
  if(method==='saveProject')return locked(()=>gaSaveProject_(u,d));
  if(method==='submitProject')return locked(()=>gaSubmitProject_(u,d));
  if(method==='reviewProject')return locked(()=>gaReviewProject_(u,d));
  if(method==='submitReport')return locked(()=>gaSubmitReport_(u,d));
  if(method==='setReportStatus')return locked(()=>gaSetReportStatus_(u,d));
  if(method==='saveRating')return locked(()=>gaSaveRating_(u,d));
  if(method==='saveChecklistItem')return locked(()=>gaSaveChecklistItem_(u,d));
  if(method==='setCheck')return locked(()=>gaSetCheck_(u,d));
  if(method==='saveAttendance')return locked(()=>gaSaveAttendance_(u,d));
  if(method==='pdfTemplateInfo'){
    gaRequire_(u,['Administrator','Ausbilder',GA_ADV_ROLE]);
    return {ok:true,backendVersion:GA.VERSION,template:'FDISK-DESIGN-2',message:'Aktuelle PDF-Vorlage mit dunkelblauem Kopf und Kennzahlen.'};
  }
  if(method==='exportTrainingPdf')return gaExportTrainingPdf_(u,d);
  if(method==='saveFreeActivity')return locked(()=>gaSaveFreeActivity_(u,d));
  if(method==='exportFreeActivityPdf')return gaExportFreeActivityPdf_(u,d);
  if(method==='inviteUser')return locked(()=>gaInviteUser_(u,d));
  if(method==='resetPassword')return locked(()=>gaResetPassword_(u,d));
  if(method==='changeUserRole')return locked(()=>gaChangeUserRole_(u,d));
  if(method==='sendMessage')return locked(()=>gaSendMessage_(u,d));
  if(method==='readNotification')return locked(()=>gaReadNotification_(u,d));
  if(method==='registerPush')return locked(()=>gaRegisterPush_(u,d));
  if(method==='removePush')return locked(()=>gaRemovePush_(u,d));
  if(method==='setPushRule')return locked(()=>gaSetPushRule_(u,d));
  if(method==='testPush')return locked(()=>gaTestPush_(u));
  if(method==='saveAidSettings')return gaSaveAidSettings_(u,d);
  if(method==='submitAidProof')return locked(()=>gaSubmitAidProof_(u,d));
  if(method==='reviewAidProof')return locked(()=>gaReviewAidProof_(u,d));
  if(method==='resendAidEmail')return locked(()=>gaResendAidEmail_(u,d));
  if(method==='readAidPdf')return gaReadAidPdf_(u,d);
  throw new Error('Unbekannte Aktion.');
}

/** Teilnehmer erhalten nur eigene Termine und daraus ableitbare persönliche Kurse. */
function gaPersonalCourseScope_(member,assignments,terms,attendance,attempts,abschnitt){
 if(!member)return {terms:[],courseIds:new Set(),turnIds:new Set()};
 const turnIds=new Set([member.TurnusID,...(assignments||[])
  .filter(a=>a.MitgliedID===member.ID).map(a=>a.TurnusID)].filter(Boolean));
 const oldTermIds=new Set((attendance||[]).filter(a=>a.MitgliedID===member.ID).map(a=>a.TerminID));
 const ownAttempts=(attempts||[]).filter(a=>a.MitgliedID===member.ID);
 ownAttempts.forEach(a=>{if(a.TerminID)oldTermIds.add(a.TerminID);});
 const ownTerms=(terms||[]).filter(t=>turnIds.has(t.TurnusID)||oldTermIds.has(t.ID));
 const courseIds=new Set(ownTerms.map(t=>t.KursID).filter(Boolean));
 ownAttempts.forEach(a=>{if(a.KursID)courseIds.add(a.KursID);});
 (abschnitt||[]).filter(a=>a.MitgliedID===member.ID&&a.KursID).forEach(a=>courseIds.add(a.KursID));
 ownTerms.forEach(t=>{if(t.TurnusID)turnIds.add(t.TurnusID);});
 return {terms:ownTerms,courseIds,turnIds};
}
function gaParticipantCourseText_(value){
 return String(value||'').replace(/(?:https?:\/\/|www\.|(?:drive|docs)\.google\.com\/)[^\s<>"']+/gi,'[Link nur für das Ausbildungsteam]');
}
function gaParticipantCourse_(course){
 return {ID:course.ID,Titel:gaParticipantCourseText_(course.Titel),Bereich:course.Bereich,
  Inhalt:gaParticipantCourseText_(course.Inhalt),Lernziele:gaParticipantCourseText_(course.Lernziele),Aktiv:course.Aktiv};
}

/** Selbstdiagnose ohne persönliche Daten Dritter. Beweist, welche Backend-Version der Teilnehmer erreicht. */
function gaParticipantStatus_(u){
 gaRequire_(u,['Teilnehmer']);
 const member=gaOwnMember_(u);
 if(!member)return {ok:true,backendVersion:GA.VERSION,mitgliedGefunden:false,
  termine:0,kurse:0,qualifikationen:0,nachrichten:0,benachrichtigungen:0,
  hinweis:'Kein eindeutig zugeordnetes aktives Mitglied gefunden. Bitte E-Mail und mögliche doppelte Mitgliedseinträge prüfen.'};
 const allTerms=gaRows_('Termine'),courses=gaRows_('Kurse'),assignments=gaAdvAssignments_();
 const turnIDs=new Set([member.TurnusID,...assignments.filter(x=>x.MitgliedID===member.ID).map(x=>x.TurnusID)]);
 const scope=gaPersonalCourseScope_(member,assignments,allTerms,gaRows_('Teilnahmen'),
  gaOptionalRows_('QuizVersuche'),gaOptionalRows_('AbschnittNachweise'));
 const terms=scope.terms,allowedCourses=courses.filter(c=>scope.courseIds.has(c.ID));
 const visibleMessages=gaRows_('Nachrichten').filter(n=>!n.TurnusID||turnIDs.has(n.TurnusID)||
  n.TurnusID==='M:'+member.ID||(n.TurnusID==='ADV:ALLE'&&gaAdvMemberAllowed_(member)));
 return {ok:true,backendVersion:GA.VERSION,mitgliedGefunden:true,
  termine:terms.length,kurse:allowedCourses.length,
  qualifikationen:gaRows_('QualifikationMitglieder').filter(x=>x.MitgliedID===member.ID).length,
  nachrichten:visibleMessages.length,
  benachrichtigungen:gaRows_('Benachrichtigungen').filter(x=>x.BenutzerID===u.ID).length,
  hinweis:'Aktuelle Datensätze in der verbundenen Ausbildungsdatenbank.'};
}

function gaBaseState_(u){
 if(gaIsAdvOrg_(u))return gaAdvancedOrganizerState_(u);
 const admin=u.Rolle==='Administrator',trainer=u.Rolle==='Ausbilder',
  special=u.Rolle==='Fachverwaltung',participant=u.Rolle==='Teilnehmer';
 const allTurnusse=gaRows_('Turnusse'),allKurse=gaRows_('Kurse'),
  allTermine=gaRows_('Termine'),allMembers=gaRows_('Mitglieder'),
  allItems=gaRows_('Checklistenpunkte'),allChecks=gaRows_('MitgliedChecks');
 const liveChecks=allChecks.filter(ch=>gaChecklistInScope_(allItems.find(i=>i.ID===ch.PunktID),allMembers.find(m=>m.ID===ch.MitgliedID),allTurnusse));
 const liveCheckIds=new Set(liveChecks.map(ch=>ch.ID));
 const own=gaOwnMember_(u,allMembers);
 const aidRows=admin||!!own?gaOptionalRows_('ErsteHilfeNachweise'):[];
 const aidRowsVisible=(admin?aidRows:own?aidRows.filter(x=>x.MitgliedID===own.ID):[])
   .map(({DriveDateiID,EmailEmpfaenger,...r})=>({...r,...(admin?{EmailEmpfaenger}:{}),mailBestaetigung:gaAidMailAck_(r.ID)}));
 const rightsRows=(admin||trainer)?gaOptionalRows_('Berechtigungen'):[];
 const rights=gaPermissions_(u,rightsRows);
 const users=(admin||trainer)?gaRows_('Benutzer'):[];
 const projects=(admin||trainer)?gaOptionalRows_('KursProjekte'):[];
 const reports=(admin||trainer)?gaOptionalRows_('Meldungen'):[];
 const ratings=(participant||rights.BewertungenAnsehen)?gaOptionalRows_('Bewertungen'):[];
 const questionnaires=(admin||trainer||participant)?gaOptionalRows_('BewertungsFrageboegen'):[];
 const devices=gaOptionalRows_('PushGeraete'),pushRulesRows=gaOptionalRows_('PushRegeln');
 const assignments=gaAdvAssignments_();
 const extraTurns=own?new Set(assignments.filter(x=>x.MitgliedID===own.ID).map(x=>x.TurnusID)):new Set();
 const att=gaRows_('Teilnahmen'),ownAttendance=own?att.filter(t=>t.MitgliedID===own.ID):[];
 const ownRatings=own?ratings.filter(r=>r.MitgliedID===own.ID):[];
 const notifications=gaRows_('Benachrichtigungen').filter(n=>n.BenutzerID===u.ID).slice(-100).reverse();
 const qrows=gaOptionalRows_('QualifikationMitglieder'),reqs=gaOptionalRows_('KursAnforderungen');
 const quizCfg=gaOptionalRows_('QuizKurse'),quizAttempts=gaOptionalRows_('QuizVersuche'),quizUnlocks=gaOptionalRows_('QuizFreigaben');
 const abschnitt=gaOptionalRows_('AbschnittNachweise');
 const trainingReports=admin||trainer?gaOptionalRows_('Ausbildungsberichte'):[];
 const freeActivities=admin||trainer?gaOptionalRows_('FreieTaetigkeiten'):[];
 const predecessors=gaCoursePredecessors_();
 const validity=gaValidityConfig_();
 const personalScope=gaPersonalCourseScope_(own,assignments,allTermine,ownAttendance,quizAttempts,abschnitt);
 const ownTerm=personalScope.terms;
 const visibleTurns=admin||trainer?allTurnusse:allTurnusse.filter(t=>personalScope.turnIds.has(t.ID));
 const visibleCourses=admin||trainer?allKurse:
  allKurse.filter(c=>personalScope.courseIds.has(c.ID)).map(gaParticipantCourse_);
 const visibleCourseIds=new Set(visibleCourses.map(c=>c.ID));
 const visibleProjects=admin?projects:trainer?projects.filter(x=>x.ErstelltVon===u.ID||rights.KurseGestalten||rights.KurseFreigeben):[];
 const qualifikationen=(admin||trainer?allMembers.filter(m=>gaBool_(m.Aktiv)):own?[own]:[])
  .map(m=>gaQualificationStatus_(m,qrows,reqs,allKurse,allTermine,att,allTurnusse,quizCfg,quizAttempts,abschnitt,assignments,predecessors,validity));
 if(!admin&&!trainer)qualifikationen.forEach(q=>{
  q.OffeneGABKurse=(q.OffeneGABKurse||[]).map(gaParticipantCourseText_);
  q.OffeneBSWKurse=(q.OffeneBSWKurse||[]).map(gaParticipantCourseText_);
 });
 const direktnachrichten=gaOptionalRows_('Direktnachrichten').filter(n=>n.VonBenutzerID===u.ID||n.AnBenutzerID===u.ID).slice(-200).reverse();
 return {
  version:GA.VERSION,user:gaPublicUser_(u),rechte:rights,
  ...(admin?{verwaltungsMails:gaAdminMailState_()}:{}),
  turnusse:visibleTurns,
  // Das Ausbildungsteam erhält den Katalog mit Unterlagen. Teilnehmer erhalten
  // ausschließlich eigene Kursinformationen ohne Präsentations- oder Dokumentenlinks.
  kurse:visibleCourses,
  gueltigkeit:gaValidityVisible_(validity,visibleTurns,visibleCourses,visibleProjects),
  termine:admin||trainer?allTermine:ownTerm,
  mitglieder:admin||trainer?allMembers:special?allMembers.filter(m=>gaBool_(m.Aktiv)).map(({ID,Vorname,Nachname,Telefon,TurnusID})=>({ID,Vorname,Nachname,Telefon,TurnusID})):own?[own]:[],
  checklistenpunkte:admin?allItems:special?allItems.filter(i=>gaBool_(i.Aktiv)&&i.Zustaendig===u.Bereich):participant?allItems.filter(i=>gaBool_(i.Aktiv)):[],
  checkArchiv:admin?allChecks.filter(ch=>!liveCheckIds.has(ch.ID)):[],
  checks:admin?liveChecks:special?liveChecks.filter(ch=>allItems.some(it=>it.ID===ch.PunktID&&it.Zustaendig===u.Bereich)):
    participant&&own?liveChecks.filter(ch=>ch.MitgliedID===own.ID):[],
  teilnahmen:admin||trainer?gaRows_('Teilnahmen'):ownAttendance,
  nachrichten:admin?gaRows_('Nachrichten'):participant&&own?gaRows_('Nachrichten').filter(n=>!n.TurnusID||n.TurnusID===own.TurnusID||extraTurns.has(n.TurnusID)||n.TurnusID==='M:'+own.ID||(n.TurnusID==='ADV:ALLE'&&gaAdvMemberAllowed_(own))):[],
  benachrichtigungen:notifications,
  pushEigeneRegeln:gaPushRule_(u.ID,pushRulesRows),
  pushGeraeteAnzahl:devices.filter(x=>x.BenutzerID===u.ID&&gaBool_(x.Aktiv)).length,
  pushRegeln:admin?users.filter(x=>gaBool_(x.Aktiv)).map(x=>({BenutzerID:x.ID,Name:x.Name,Rolle:x.Rolle,...gaPushRule_(x.ID,pushRulesRows),
   Geraete:devices.filter(d=>d.BenutzerID===x.ID&&gaBool_(d.Aktiv)).length})):[],
  benutzer:admin?users.map(x=>({...gaPublicUser_(x),...(x.Rolle==='Ausbilder'?{Ausbildungsbereiche:gaTrainerAreas_(x)}:{})})):trainer?users.filter(x=>['Ausbilder','Administrator',GA_ADV_ROLE].includes(x.Rolle)).map(x=>({ID:x.ID,Name:x.Name,Rolle:x.Rolle,Aktiv:x.Aktiv})):[],
  kursProjekte:visibleProjects,
  ...(admin||trainer?{kursPlanung:gaCoursePlanVisible_(visibleCourses,visibleProjects)}:{}),
  berechtigungen:admin?users.filter(x=>x.Rolle==='Ausbilder').map(x=>({BenutzerID:x.ID,Name:x.Name,...gaPermissions_(x,rightsRows),Ausbildungsbereiche:gaTrainerAreas_(x)})):[],
  meldungen:admin||rights.MeldungenBearbeiten?reports:trainer?reports.filter(x=>x.ErstelltVon===u.ID):[],
  bewertungen:rights.BewertungenAnsehen?ratings:[],
  eigeneBewertungen:ownRatings,
  frageboegen:questionnaires.filter(x=>x.Aktiv==='JA'&&(admin||trainer||!!own&&(x.KursID==='ALLGEMEIN'||visibleCourseIds.has(x.KursID)))),
  offeneBewertungen:participant&&own?ownAttendance.filter(t=>gaBool_(t.Anwesend)).map(t=>allTermine.find(term=>term.ID===t.TerminID)).filter(term=>
    term&&term.Status==='Durchgeführt'&&allKurse.some(c=>c.ID===term.KursID&&gaBool_(c.Aktiv))&&
    !ownRatings.some(r=>r.TerminID===term.ID)):[],
  meMember:own,
  erweiterteAbschluesse:gaAdvCompletionVisible_(admin?allMembers:own?[own]:[]),
  qualifikationen,
  abschnittNachweise:(admin?abschnitt:own?abschnitt.filter(a=>a.MitgliedID===own.ID):[]),
  erweiterteZuordnungen:(admin||trainer?assignments:own?assignments.filter(x=>x.MitgliedID===own.ID):[]).map(x=>({MitgliedID:x.MitgliedID,TurnusID:x.TurnusID})),
  ausbildungsberichte:trainingReports,
  freieTaetigkeiten:freeActivities,
  quizKurse:quizCfg.filter(c=>admin||trainer||!!own&&visibleCourseIds.has(c.KursID)).map(c=>{
   const data=gaQuizPublicConfig_(c);
   if(!participant||!own)return data;
   const course=allKurse.find(x=>x.ID===c.KursID);
   if(!gaValidityQuizDate_(validity,c.KursID))return {...data,GueltigkeitStatus:'legacy'};
   let status=course?gaValidityQuizAttendance_(course,own,validity,allTurnusse,assignments,allTermine,ownAttendance):'unknown';
   if(status==='not-attended'&&course&&gaValidityQuizDate_(validity,c.KursID))
    status=gaValidityForMember_(course,own,validity,allTurnusse,assignments,'quiz');
   return {...data,GueltigkeitStatus:status,Pflicht:status==='exempt'?'NEIN':data.Pflicht};
  }),
  quizFreigaben:(admin||trainer?quizUnlocks:own?quizUnlocks.filter(x=>x.MitgliedID===own.ID):[]).map(x=>({KursID:x.KursID,MitgliedID:x.MitgliedID,QuizVersion:x.QuizVersion,ZusatzVersuche:x.ZusatzVersuche,FreigegebenAm:x.FreigegebenAm})),
  quizVersuche:(admin||trainer?quizAttempts:own?quizAttempts.filter(a=>a.MitgliedID===own.ID):[]).map(a=>({ID:a.ID,KursID:a.KursID,MitgliedID:a.MitgliedID,TerminID:a.TerminID,QuizVersion:a.QuizVersion,Versuch:a.Versuch,Status:a.Status,BegonnenAm:a.BegonnenAm,AbgegebenAm:a.AbgegebenAm,Punkte:a.Punkte,MaxPunkte:a.MaxPunkte,Prozent:a.Prozent,Bestanden:a.Bestanden})),
  ersteHilfeNachweise:aidRowsVisible,
  ersteHilfeMail:admin?gaAidSettings_():null,
  kursAnforderungen:admin?reqs:[],kursVorgaenger:admin?predecessors:{},
  direktnachrichten,
  nachrichtenEmpfaenger:admin||trainer?users.filter(x=>gaBool_(x.Aktiv)).map(gaPublicUser_):
    gaRows_('Benutzer').filter(x=>gaBool_(x.Aktiv)&&(['Administrator','Ausbilder','Fachverwaltung'].includes(x.Rolle)||(x.Rolle===GA_ADV_ROLE&&gaAdvMemberAllowed_(own)))).map(gaPublicUser_)
 };
}
function gaNeed_(value,name,max){let v=gaText_(value,max);if(!v)throw new Error(name+' ist erforderlich.');return v;}
function gaChoice_(v,allowed,name){if(!allowed.includes(v))throw new Error('Ungültiger Wert für '+name+'.');return v;}
// Optionale interne Kursplanung wird getrennt von Teilnehmer- und Nachweistabellen gespeichert.
const GA_COURSE_PLAN_PREFIX='GA_KURS_PLAN_V1_';
function gaCoursePlanKey_(kind,id){
 if(!['kurs','projekt'].includes(kind)||!id)throw new Error('Ungültige Kursplanung.');
 return GA_COURSE_PLAN_PREFIX+kind+'_'+encodeURIComponent(String(id));
}
function gaCoursePlanRead_(kind,id,all){
 const key=gaCoursePlanKey_(kind,id),raw=all?all[key]:PropertiesService.getScriptProperties().getProperty(key);
 if(raw===null||raw===undefined)return null;
 let value;try{value=JSON.parse(raw);}catch(e){throw new Error('Gespeicherte Kursplanung ist beschädigt. Bitte Administrator kontaktieren.');}
 if(!value||typeof value.MaterialNotiz!=='string'||!Array.isArray(value.VerantwortlicheIDs)||
  value.VerantwortlicheIDs.some(x=>typeof x!=='string'||!x))
  throw new Error('Gespeicherte Kursplanung ist unvollständig. Bitte Administrator kontaktieren.');
 return {MaterialNotiz:value.MaterialNotiz,VerantwortlicheIDs:value.VerantwortlicheIDs};
}
function gaCoursePlanVisible_(courses,projects){
 const all=PropertiesService.getScriptProperties().getProperties(),out={kurse:Object.create(null),projekte:Object.create(null)};
 for(const [kind,rows,target] of [['kurs',courses,out.kurse],['projekt',projects,out.projekte]])
  for(const row of rows||[])try{const value=gaCoursePlanRead_(kind,row.ID,all);if(value)target[row.ID]=value;}
   catch(e){target[row.ID]={Fehler:'Die gespeicherte Kursplanung muss geprüft werden.'};}
 return out;
}
function gaCoursePlanInput_(d,kind,id,area){
 const hasMaterial=Object.prototype.hasOwnProperty.call(d,'MaterialNotiz');
 const hasTrainers=Object.prototype.hasOwnProperty.call(d,'VerantwortlicheIDs');
 if(!hasMaterial&&!hasTrainers)return null; // Ältere App-Versionen ändern die Planung nicht.
 const old=id?gaCoursePlanRead_(kind,id):null;
 const material=hasMaterial?String(d.MaterialNotiz||'').trim():(old?.MaterialNotiz||'');
 if(material.length>2000)throw new Error('Arbeitsmaterial darf höchstens 2000 Zeichen enthalten.');
 if(hasTrainers&&!Array.isArray(d.VerantwortlicheIDs))throw new Error('Bitte gültige zuständige Ausbilder auswählen.');
 const ids=hasTrainers?[...new Set(d.VerantwortlicheIDs.map(x=>String(x||'').trim()).filter(Boolean))]:(old?.VerantwortlicheIDs||[]);
 if(ids.length>30||ids.some(x=>x.length>100))throw new Error('Bitte höchstens 30 gültige Ausbilder auswählen.');
 const previous=new Set(old?.VerantwortlicheIDs||[]),users=gaRows_('Benutzer');
 if(ids.some(id=>!previous.has(id)&&!users.some(u=>u.ID===id&&
  gaStaffAreaAllowed_(u,area))))
  throw new Error('Mindestens eine zuständige Person ist für diesen Ausbildungsbereich nicht auswählbar.');
 const value={MaterialNotiz:material,VerantwortlicheIDs:ids};
 if(Utilities.newBlob(JSON.stringify(value)).getBytes().length>8500)throw new Error('Arbeitsmaterial oder Ausbilderliste ist zu umfangreich.');
 return value;
}
function gaCoursePlanWithRollback_(kind,id,value,write){
 const props=PropertiesService.getScriptProperties(),key=gaCoursePlanKey_(kind,id),old=props.getProperty(key);
 props.setProperty(key,JSON.stringify(value));
 try{return write();}catch(error){if(old===null)props.deleteProperty(key);else props.setProperty(key,old);throw error;}
}
function gaSaveTurnus_(u,d){
 gaRequire_(u,['Administrator',GA_ADV_ROLE]);
 const val={Bezeichnung:gaNeed_(d.Bezeichnung,'Bezeichnung',130),Bereich:gaChoice_(d.Bereich,GA.AREAS,'Bereich'),Aktiv:'JA'};
 const meta=gaValidityConfig_();
 if(d.ID){
  const existing=gaFind_('Turnusse',d.ID);if(!existing)throw new Error('Turnus nicht gefunden.');
  if(existing.Bereich!==val.Bereich&&(gaValidityHasAreaRule_(existing.Bereich,meta)||gaValidityHasAreaRule_(val.Bereich,meta)))
   throw new Error('Der Bereich dieses Turnus kann bei vorhandenen Datumsregeln nicht geändert werden.');
  if(!meta.turnus[d.ID]&&gaValidityHasAreaRule_(val.Bereich,meta))throw new Error('Bitte zuerst das tatsächliche Turnus-Startdatum eintragen.');
  gaReplace_('Turnusse',d.ID,val);gaLog_(u.ID,'BEARBEITEN','Turnus',d.ID,val);return {ok:true};
 }
 const start=String(d.Startdatum||'').trim();
 if(!gaValidityValidDate_(start))throw new Error('Bitte das tatsächliche Startdatum des neuen Turnus eintragen.');
 val.ID=gaId_();val.ErstelltAm=gaNow_();
 gaValidityWithRollback_('turnus',val.ID,start,()=>gaAppend_('Turnusse',val));
 gaLog_(u.ID,'ANLEGEN','Turnus',val.ID,{...val,Startdatum:start});return {ok:true};
}
function gaLinks_(x){const text=gaText_(x,5000);const lines=text.split(/\n/).map(s=>s.trim()).filter(Boolean);if(lines.length>12)throw new Error('Maximal 12 Links.');for(const l of lines){if(!/^https:\/\//i.test(l))throw new Error('Unterlagen müssen HTTPS-Links sein (ein Link pro Zeile).');}return lines.join('\n');}
function gaSaveCourse_(u,d){
 gaRequireRight_(u,'KurseBearbeiten');
 const id=gaNeed_(d.ID,'Kurs-ID',100),old=gaFind_('Kurse',id);
 if(!old||!gaBool_(old.Aktiv))throw new Error('Veröffentlichter Kurs nicht gefunden.');
 const val={Titel:gaNeed_(d.Titel,'Kurstitel',160),Bereich:gaChoice_(d.Bereich,GA.AREAS,'Bereich'),
 Inhalt:gaNeed_(d.Inhalt,'Ausbildungsinhalt',8000),Lernziele:gaText_(d.Lernziele,3000),
 Links:gaLinks_(d.Links),Aktiv:'JA'};
 if(gaIsAdvOrg_(u)&&(old.Bereich!==GA_ADV_AREA||val.Bereich!==GA_ADV_AREA))throw new Error('Kursteil gehört nicht zur erweiterten Ausbildung.');
 const meta=gaValidityConfig_(),hasDate=Object.prototype.hasOwnProperty.call(d,'GueltigAb');
 const date=hasDate?String(d.GueltigAb||'').trim():(meta.kurs[id]||'');
 if(date&&!gaValidityValidDate_(date))throw new Error('Bitte ein gültiges Gültigkeitsdatum auswählen.');
 if(hasDate&&date!==(meta.kurs[id]||''))gaRequire_(u,['Administrator',GA_ADV_ROLE]);
 if(old.Bereich!==val.Bereich&&(meta.kurs[id]||meta.quiz[id]||date))throw new Error('Der Ausbildungsbereich eines datierten Kurses kann nicht geändert werden.');
 if(hasDate&&date)gaValidityRequireTurnDates_(val.Bereich,meta);
 const plan=gaCoursePlanInput_(d,'kurs',id,val.Bereich),write=()=>gaReplace_('Kurse',id,val);
 const save=()=>plan?gaCoursePlanWithRollback_('kurs',id,plan,write):write();
 if(hasDate)gaValidityWithRollback_('kurs',id,date,save);else save();
 gaLog_(u.ID,'KURS_NACH_VEROEFFENTLICHUNG_BEARBEITEN','Kurs',id,{Vorher:old,Nachher:val});
 return {ok:true,message:'Veröffentlichter Kurs aktualisiert. Änderung protokolliert.'};
}
function gaDateTime_(s){s=gaText_(s,30);if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s)||Number.isNaN(Date.parse(s)))throw new Error('Datum/Uhrzeit ungültig.');return s;}
function gaNotify_(userId,type,title,message,reference){
  const category=type==='Nachricht'?'Nachrichten':type==='Termin'?'Termine':type==='Bewertung'?'Bewertungen':'Aufgaben';
  const allowed=gaPushRule_(userId)[category];
  const hasDevice=gaOptionalRows_('PushGeraete').some(x=>x.BenutzerID===userId&&gaBool_(x.Aktiv));
  const pushStatus=!allowed?'Vom Administrator deaktiviert':hasDevice?'Wartend':'Kein Gerät registriert';
  const id=gaId_();
  gaAppend_('Benachrichtigungen',{ID:id,BenutzerID:userId,Typ:type,Titel:title,Text:message,BezugID:reference||'',ErstelltAm:gaNow_(),GelesenAm:'',PushStatus:pushStatus});
  return id;
}

function gaQuizNoticeContext_(){
 return {members:gaRows_('Mitglieder'),attempts:gaOptionalRows_('QuizVersuche'),meta:gaValidityConfig_(),
  turns:gaRows_('Turnusse'),assignments:gaAdvAssignments_(),terms:gaRows_('Termine'),
  attendance:gaRows_('Teilnahmen'),courses:gaRows_('Kurse'),quizzes:gaOptionalRows_('QuizKurse')};
}
function gaQuizNoticeEligible_(user,course,quiz,ctx){
 if(!user||!course||!quiz||!gaBool_(quiz.Aktiv))return false;
 ctx=ctx||gaQuizNoticeContext_();
 const member=gaOwnMember_(user,ctx.members);
 if(!member)return false;
 if(ctx.attempts.some(a=>a.MitgliedID===member.ID&&a.KursID===course.ID&&gaBool_(a.Bestanden)))return false;
 if(gaValidityQuizDate_(ctx.meta,course.ID)){
  const status=gaValidityQuizAttendance_(course,member,ctx.meta,ctx.turns,ctx.assignments,ctx.terms,ctx.attendance);
  if(status!=='applies')return false;
 }
 return true;
}

/** Send a course quiz announcement only once per member, version and quiz type. */
function gaNotifyQuizAvailable_(user,course,quiz,known,ctx){
 if(!gaQuizNoticeEligible_(user,course,quiz,ctx))return false;
 const required=gaBool_(quiz.Pflicht);
 const ref='QUIZREADY:'+course.ID+':'+String(quiz.Version||'1')+':'+(required?'P':'F');
 const notices=known||gaRows_('Benachrichtigungen');
 if(notices.some(n=>n.BenutzerID===user.ID&&n.BezugID===ref))return false;
 gaNotify_(user.ID,'Aufgabe',
  required?'Pflichtquiz ist eröffnet!':'Freiwilliges Quiz verfügbar!',
  'Deine Kursteilnahme an „'+course.Titel+'“ wurde bestätigt. '+(required?
   'Das Pflichtquiz ist jetzt unter „Meine Wissenstests“ verfügbar.':
   'Das freiwillige Quiz ist jetzt unter „Meine Wissenstests“ verfügbar.'),
  ref);
 notices.push({BenutzerID:user.ID,BezugID:ref});
 return true;
}

/** Parse training dates from either Apps Script or formatted Sheet rows as Vienna-local time. */
function gaCourseDate_(value){
 const stamp=String(value||'').trim().replace('T',' ').slice(0,16);
 if(!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(stamp))return null;
 try{
  const zone='Europe/Vienna',date=Utilities.parseDate(stamp,zone,'yyyy-MM-dd HH:mm');
  return Utilities.formatDate(date,zone,'yyyy-MM-dd HH:mm')===stamp?date:null;
 }catch(e){return null;}
}

/** Once per scheduled start and account, approximately eight hours before the course. */
function gaQueueCourseReminders_(now){
 const current=now||new Date(),ms=current.getTime(),before=8*60*60*1000,lateTolerance=20*60*1000;
 const terms=gaRows_('Termine').filter(t=>{
  if(t.Status!=='Geplant')return false;
  const start=gaCourseDate_(t.Beginn);
  if(!start)return false;
  const until=start.getTime()-ms;
  return until<=before&&until>before-lateTolerance;
 });
 if(!terms.length)return 0;
 const courses=new Map(gaRows_('Kurse').map(c=>[c.ID,c]));
 const accounts=new Map(gaRows_('Benutzer').filter(u=>u.Rolle==='Teilnehmer'&&gaBool_(u.Aktiv)&&u.Email)
  .map(u=>[String(u.Email).toLowerCase(),u]));
 const members=gaRows_('Mitglieder').filter(m=>gaBool_(m.Aktiv)&&m.Email);
 const assignments=gaAdvAssignments_();
 const known=new Set(gaRows_('Benachrichtigungen').filter(n=>String(n.BezugID||'').startsWith('TERM8H:'))
  .map(n=>n.BenutzerID+'|'+n.BezugID));
 let queued=0;
 for(const term of terms){
  const course=courses.get(term.KursID);if(!course)continue;
  const date=gaCourseDate_(term.Beginn);
  const dateString=Utilities.formatDate(date,'Europe/Vienna','dd.MM.yyyy');
  const timeString=Utilities.formatDate(date,'Europe/Vienna','HH:mm');
  const ref='TERM8H:'+term.ID+':'+String(term.Beginn).trim().replace(' ','T').slice(0,16);
  const isToday=Utilities.formatDate(current,'Europe/Vienna','yyyy-MM-dd')===
   Utilities.formatDate(date,'Europe/Vienna','yyyy-MM-dd');
  const title=(isToday?'Heute: ':'Morgen: ')+course.Titel;
  const message='Erinnerung: „'+course.Titel+'“ findet '+(isToday?'heute':'morgen')+
   ', '+dateString+' um '+timeString+' Uhr statt'+(term.Ort?' (Ort: '+term.Ort+')':'')+'.';
  for(const member of members){
   if(member.TurnusID!==term.TurnusID&&!assignments.some(a=>a.MitgliedID===member.ID&&a.TurnusID===term.TurnusID))continue;
   const account=accounts.get(String(member.Email).toLowerCase());
   if(!account||known.has(account.ID+'|'+ref))continue;
   gaNotify_(account.ID,'Termin',title,message,ref);
   known.add(account.ID+'|'+ref);queued++;
  }
 }
 return queued;
}

function gaNotifyTurnus_(turnusId,type,title,text,ref){const emails=gaAdvAllowedMembers_(turnusId).map(m=>String(m.Email||'').toLowerCase());gaRows_('Benutzer').filter(x=>x.Rolle==='Teilnehmer'&&gaBool_(x.Aktiv)&&emails.includes(x.Email.toLowerCase())).forEach(x=>gaNotify_(x.ID,type,title,text,ref));}
function gaSaveTermin_(u,d){gaRequireRight_(u,'TerminePlanen');const course=gaFind_('Kurse',d.KursID),turnus=gaFind_('Turnusse',d.TurnusID);
  if(!course||!gaBool_(course.Aktiv))throw new Error('Der Kurs ist noch nicht veröffentlicht.');if(!course||!turnus||!(course.Bereich===turnus.Bereich||(turnus.Bereich==='Grundausbildung'&&course.Bereich==='Erweiterte Ausbildung')))throw new Error('Dieser Kurs kann dem gewählten Turnus nicht zugeordnet werden. GAB-Turnusse dürfen auch erweiterte Ausbildungen besuchen.');
  const begin=gaDateTime_(d.Beginn),end=gaDateTime_(d.Ende);if(end<=begin)throw new Error('Das Ende muss nach dem Beginn liegen.');
  const val={KursID:d.KursID,TurnusID:d.TurnusID,Beginn:begin,Ende:end,Ort:gaText_(d.Ort,160),Status:'Geplant'};
  if(d.ID){gaReplace_('Termine',d.ID,val);gaLog_(u.ID,'BEARBEITEN','Termin',d.ID,val);return {ok:true};}
  val.ID=gaId_();val.ErstelltAm=gaNow_();gaAppend_('Termine',val);gaLog_(u.ID,'ANLEGEN','Termin',val.ID,val);
  gaNotifyTurnus_(val.TurnusID,'Termin','Neuer Ausbildungstermin',course.Titel+' · '+val.Beginn,val.ID);
  if(course.Bereich===GA_ADV_AREA)gaNotifyAdvancedOrganizers_('Termin','Erweiterter Ausbildungstermin',course.Titel+' · '+val.Beginn,val.ID);
  gaPushQueue_(5);return {ok:true};}
/** Verwaltungs-Mails: optionale Transponder und gebündelte Block-B-Abschlüsse. */
const GA_ADMINMAIL_SETTINGS='GA_ADMINMAIL_SETTINGS_V1',GA_ADMINMAIL_QUEUE='GA_ADMINMAIL_QUEUE_V1_',
 GA_ADMINMAIL_B_SENT='GA_ADMINMAIL_BLOCKB_SENT_V1_',GA_TRANSPONDER_TITLE='Transponder für Zugang',GA_BLAULICHT_TITLE='Blaulicht SMS/Lea',GA_PAGER_TITLE='Pager';
/** Einmalige, eng begrenzte Mail-Aktionen. GET/Preview ändern niemals einen Nachweis. */
const GA_MAIL_ACTION_PREFIX='GA_MAIL_ACTION_V1_',GA_AID_MAIL_ACK_PREFIX='GA_AID_MAIL_ACK_V1_';
function gaMailHtml_(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function gaMailActionRecipients_(art){
 if(art==='ersteHilfe'){const s=gaAidSettings_();return s.Aktiv?gaAdminMailAddress_(s.Empfaenger):'';}
 const s=gaAdminMailSettings_();return gaAdminMailAddress_(art==='pager'?s.PagerEmpfaenger:art==='blaulicht'?s.BlaulichtEmpfaenger:art==='transponder'?s.TransponderEmpfaenger:art==='zeugkammer'?s.ZeugkammerEmpfaenger:'');
}
function gaMailActionLink_(delivery,action){
 const token=gaId_().replace(/-/g,'')+gaId_().replace(/-/g,''),digest=gaInviteDigest_(token),
  target={...action,MailKey:delivery.key,MailVersion:delivery.LinkVersion,Art:delivery.Art,
   EmpfaengerHash:gaInviteDigest_(delivery.Art+'\n'+gaMailActionRecipients_(delivery.Art).split(',').sort().join(',')),AblaufMillis:Date.now()+30*86400000,VerwendetAm:''};
 gaAdminMailWrite_(GA_MAIL_ACTION_PREFIX+digest,target);
 const url=gaInviteLink_(token).replace('einladung.html#invite=','checkliste-bestaetigen.html#token=');
 return {...action,url};
}
function gaMailActionExtras_(delivery,actions,body,previewOnly){
 if(previewOnly)return {body};
 const links=actions.map(a=>gaMailActionLink_(delivery,a)),intro='Ausgabe bzw. Erfassung bestätigen: Der Link öffnet eine Bestätigungsseite. Erst die ausdrückliche Bestätigung dort ändert den Status. Links sind 30 Tage gültig und nur für die jeweilige Person und Aufgabe bestimmt.';
 const plain=body+'\n\n'+intro+'\n\n'+links.map(a=>a.Label+':\n'+a.url).join('\n\n');
 const html='<div style="font-family:Arial,sans-serif;color:#193047;max-width:660px"><h2>Feuerwehr St. Pölten-Stadt</h2><div style="white-space:pre-wrap">'+gaMailHtml_(body)+'</div><p>'+gaMailHtml_(intro)+'</p>'+links.map(a=>'<p style="margin:18px 0"><a href="'+gaMailHtml_(a.url)+'" style="display:inline-block;background:#175eae;color:white;text-decoration:none;border-radius:8px;padding:13px 18px;font-weight:bold">'+gaMailHtml_(a.Label)+'</a></p>').join('')+'</div>';
 return {body:plain,htmlBody:html};
}
function gaZeugkammerChecks_(member){
 const turns=gaRows_('Turnusse'),items=gaRows_('Checklistenpunkte');
 return gaRows_('MitgliedChecks').filter(c=>c.MitgliedID===member.ID&&c.Status==='Offen'&&items.some(i=>i.ID===c.PunktID&&i.Zustaendig==='Zeugkammer'&&gaChecklistInScope_(i,member,turns)));
}
function gaZeugkammerInput_(u,d,member,turnus){
 if(!Object.prototype.hasOwnProperty.call(d,'ZeugkammerAnfordern'))return false;
 gaRequire_(u,['Administrator']);
 if(![true,false,'JA','NEIN'].includes(d.ZeugkammerAnfordern))throw new Error('Ungültige Zeugkammer-Auswahl.');
 const requested=d.ZeugkammerAnfordern===true||d.ZeugkammerAnfordern==='JA';if(!requested)return false;
 // Ein erneutes Speichern darf eine bereits versendete Anforderung nicht wiederholen.
 const previous=d.ID?gaAdminMailRead_(gaAdminMailKey_('zeugkammer',d.ID)):null;
 if(previous)return true;
 if(!gaAdminMailSettings_().ZeugkammerEmpfaenger)throw new Error('Bitte zuerst unter Verwaltungs-Mails die Empfängeradresse der Zeugkammer hinterlegen.');
 const items=gaRows_('Checklistenpunkte').filter(i=>i.Zustaendig==='Zeugkammer'&&gaChecklistInScope_(i,{...member,TurnusID:turnus.ID},[turnus]));
 if(!items.length)throw new Error('Für diesen Ausbildungsbereich fehlen aktive Checklistenpunkte mit Zuständigkeit Zeugkammer. Bitte die bestehenden Bekleidungs-Punkte prüfen.');
 if(d.ID&&!gaZeugkammerChecks_({...member,ID:d.ID}).length)throw new Error('Für dieses Mitglied bestehen keine offenen Zeugkammer-Aufgaben. Bereits erledigte Ausgaben bleiben erhalten.');
 return true;
}
function gaSendZeugkammerRequest_(u,d){
 gaRequire_(u,['Administrator']);const member=gaFind_('Mitglieder',gaNeed_(d.MitgliedID,'Mitglied',100));
 if(!member||!gaBool_(member.Aktiv))throw new Error('Aktives Mitglied nicht gefunden.');
 if(!gaAdminMailSettings_().ZeugkammerEmpfaenger)throw new Error('Bitte zuerst die Empfängeradresse der Zeugkammer hinterlegen.');
 if(!gaZeugkammerChecks_(member).length)throw new Error('Für dieses Mitglied bestehen keine offenen Zeugkammer-Aufgaben.');
 const message=gaQueueZeugkammerMail_(member);
 return {ok:true,message:message||'Die Zeugkammer-Mail ist bereits vorgemerkt oder versendet. Für neue Links bei Bedarf „Offene Bestätigungslinks neu senden“ verwenden.'};
}
function gaQueueZeugkammerMail_(member){
 try{
  if(!gaAdminMailSettings_().ZeugkammerEmpfaenger||!gaZeugkammerChecks_(member).length)return '';
  const key=gaAdminMailKey_('zeugkammer',member.ID);if(gaAdminMailRead_(key))return '';
  gaAdminMailWrite_(key,{Art:'zeugkammer',MitgliedID:member.ID,Name:member.Vorname+' '+member.Nachname,Status:'Wartend',FaelligMillis:Date.now(),AktualisiertMillis:Date.now()});
  return gaAdminMailDispatch_(key)?' Zeugkammer-Mail mit Bestätigungslinks versendet.':' Zeugkammer-Anforderung gespeichert; Versandstatus unter Verwaltungs-Mails prüfen.';
 }catch(e){console.warn('Zeugkammer-Mail fehlgeschlagen:',String(e));return ' Mitglied gespeichert; Zeugkammer-Mail konnte nicht vollständig angelegt werden. Bitte Verwaltungs-Mails prüfen.';}
}
function gaZeugkammerDraft_(r,footer,previewOnly){
 const to=gaMailActionRecipients_('zeugkammer');if(!to)return {pause:true};
 const m=gaFind_('Mitglieder',r.MitgliedID);if(!m||!gaBool_(m.Aktiv))return {cancel:true};
 const checks=gaZeugkammerChecks_(m),items=gaRows_('Checklistenpunkte');if(!checks.length)return {cancel:true};
 const body=['Dieses Mitglied wurde in die '+(gaFind_('Turnusse',m.TurnusID)?.Bereich||'Ausbildung')+' aufgenommen und benötigt noch die folgenden Ausgaben durch die Zeugkammer.','',
  'Name: '+gaAdminMailLine_(m.Vorname)+' '+gaAdminMailLine_(m.Nachname),'Standesbuchnummer: '+(gaAdminMailLine_(m.Standesbuchnummer)||'nicht hinterlegt'),
  'Telefonnummer: '+(gaAdminMailLine_(m.Telefon)||'nicht hinterlegt'),'E-Mail: '+(gaAdminMailLine_(m.Email)||'nicht hinterlegt'),
  'Turnus: '+gaAdminMailLine_(gaFind_('Turnusse',m.TurnusID)?.Bezeichnung),'',...checks.map(c=>'• '+items.find(i=>i.ID===c.PunktID).Titel),'',footer].join('\n');
 const actions=checks.map(c=>({Aktion:'check',CheckID:c.ID,MitgliedID:m.ID,PunktID:c.PunktID,Label:items.find(i=>i.ID===c.PunktID).Titel+' bestätigen'}));
 return {to,subject:'Zeugkammer – '+gaAdminMailLine_(m.Vorname)+' '+gaAdminMailLine_(m.Nachname),memberIds:[m.ID],...gaMailActionExtras_(r,actions,body,previewOnly)};
}
function gaAidMailAck_(proofId){return gaAdminMailRead_(GA_AID_MAIL_ACK_PREFIX+encodeURIComponent(proofId))||{};}
function gaMailActionTarget_(token){
 if(typeof token!=='string'||!/^[a-f0-9]{64}$/i.test(token))throw new Error('Dieser Bestätigungslink ist ungültig.');
 const key=GA_MAIL_ACTION_PREFIX+gaInviteDigest_(token),grant=gaAdminMailRead_(key);
 if(!grant||!Number.isFinite(Number(grant.AblaufMillis))||Number(grant.AblaufMillis)<Date.now())throw new Error('Dieser Bestätigungslink ist ungültig oder abgelaufen. Bitte einen neuen Link anfordern.');
 const delivery=gaAdminMailRead_(grant.MailKey),recipients=gaMailActionRecipients_(grant.Art);
 if(!delivery||delivery.Art!==grant.Art||delivery.MitgliedID!==grant.MitgliedID||delivery.LinkVersion!==grant.MailVersion||delivery.Status!=='Gesendet'||!recipients||
  !gaSame_(grant.EmpfaengerHash,gaInviteDigest_(grant.Art+'\n'+recipients.split(',').sort().join(','))))throw new Error('Dieser Bestätigungslink wurde ersetzt oder deaktiviert. Bitte einen aktuellen Link verwenden.');
 const member=gaFind_('Mitglieder',grant.MitgliedID);if(!member||!gaBool_(member.Aktiv))throw new Error('Dieses Mitglied ist nicht mehr aktiv.');
 if(['check','check-not-required'].includes(grant.Aktion)){
  if(!['transponder','pager','blaulicht','zeugkammer'].includes(grant.Art))throw new Error('Ungültige Bestätigung.');
  const choice=grant.AbschlussAuswahl===true&&['transponder','pager'].includes(grant.Art);
  if(grant.Aktion==='check-not-required'&&!choice)throw new Error('Diese Aufgabe darf nicht über die Mail als nicht erforderlich bestätigt werden.');
  const check=gaFind_('MitgliedChecks',grant.CheckID),item=gaFind_('Checklistenpunkte',grant.PunktID);
  if(!check||check.MitgliedID!==member.ID||check.PunktID!==grant.PunktID||!gaChecklistInScope_(item,member,gaRows_('Turnusse'))||
   grant.Art==='zeugkammer'&&item.Zustaendig!=='Zeugkammer'||grant.Art==='transponder'&&!gaIsTransponderItem_(item)||grant.Art==='pager'&&!gaIsPagerItem_(item)||grant.Art==='blaulicht'&&!gaIsBlaulichtItem_(item))
   throw new Error('Dieser Checklistenpunkt ist nicht mehr für diese Bestätigung freigegeben.');
  if(check.Status==='Nicht erforderlich'&&!choice)throw new Error('Dieser Checklistenpunkt ist nicht erforderlich.');
  if(!(choice?['Offen','Erledigt','Nicht erforderlich']:['Offen','Erledigt']).includes(check.Status))throw new Error('Der aktuelle Checklistenstatus kann nicht bestätigt werden.');
  if((grant.VerwendetAm||choice&&delivery.AbgeschlosseneChecks?.[check.ID])&&check.Status==='Offen')throw new Error('Dieser Link wurde bereits verwendet. Für eine erneute Ausgabe ist ein neuer Link erforderlich.');
  return {key,grant,member,check,item,delivery,choice,targetStatus:grant.Aktion==='check-not-required'?'Nicht erforderlich':'Erledigt',done:check.Status==='Erledigt'||choice&&check.Status==='Nicht erforderlich',label:grant.Aktion==='check-not-required'?(grant.Art==='pager'?'Pager':'Transponder / Schlüssel')+': nicht erforderlich':grant.Art==='pager'?'Pager ausgegeben':grant.Art==='blaulicht'?'Blaulicht SMS/Lea: registriert und zugeordnet':grant.Art==='transponder'?'Transponder / Schlüssel ausgegeben':item.Titel};
 }
 if(grant.Art!=='ersteHilfe'||!['aid-filed','aid-fdisk'].includes(grant.Aktion))throw new Error('Ungültige Bestätigung.');
 const proof=gaFind_('ErsteHilfeNachweise',grant.NachweisID);
 if(delivery.NachweisID!==grant.NachweisID)throw new Error('Ungültige Nachweisbestätigung.');
 if(!proof||proof.MitgliedID!==member.ID||gaAidLatest_(member.ID)?.ID!==proof.ID||proof.Status==='Abgelehnt')throw new Error('Dieser Erste-Hilfe-Nachweis wurde ersetzt oder abgelehnt. Bitte die aktuelle Mail verwenden.');
 const ack=gaAidMailAck_(proof.ID),qual=gaOptionalRows_('QualifikationMitglieder').find(q=>q.MitgliedID===member.ID);
 const done=grant.Aktion==='aid-filed'?!!ack.AbgelegtAm:!!ack.FDISKBestaetigtAm;
 if(grant.VerwendetAm&&!done)throw new Error('Dieser Link wurde bereits verwendet. Bitte einen neuen Link anfordern.');
 return {key,grant,member,proof,ack,qual,done,label:grant.Aktion==='aid-filed'?'Erste-Hilfe-Zertifikat abgelegt':'Erste-Hilfe-Nachweis in FDISK eingetragen'};
}
function gaPreviewMailAction_(d){
 const t=gaMailActionTarget_(d.LinkToken);
 return {Version:1,Name:t.member.Vorname+' '+t.member.Nachname,Aufgabe:t.label,Erledigt:t.done,Status:t.check?.Status||'',NichtErforderlichAktion:t.grant.Aktion==='check-not-required',DatumErforderlich:t.grant.Aktion==='aid-fdisk',
  AktuellesDatum:t.qual?.FDISKEintragDatum||'',BestaetigtesDatum:t.ack?.FDISKEintragDatum||'',Kursdatum:t.proof?.Kursdatum||'',
  Ablauf:gaAdminMailDate_(Utilities.formatDate(new Date(Number(t.grant.AblaufMillis)),'Europe/Vienna','yyyy-MM-dd'))};
}
function gaConfirmMailAction_(d){
 if(d.Bestaetigt!==true)throw new Error('Bitte die tatsächliche Ausgabe bzw. Erfassung ausdrücklich bestätigen.');
 const t=gaMailActionTarget_(d.LinkToken);if(t.done)return {...gaPreviewMailAction_(d),message:'Diese Aufgabe ist bereits bestätigt.'};
 let date='';if(t.grant.Aktion==='aid-fdisk'){
  date=String(d.Datum||'');if(!gaValidityValidDate_(t.proof.Kursdatum))throw new Error('Für diesen Nachweis fehlt ein gültiges Kursdatum. Bitte die Administration informieren.');
  if(!gaValidityValidDate_(date)||date>Utilities.formatDate(new Date(),'Europe/Vienna','yyyy-MM-dd')||date<t.proof.Kursdatum)
   throw new Error('Bitte das tatsächliche FDISK-Eintragsdatum zwischen Kursdatum und heute angeben.');
  if(String(d.VorherigesDatum||'')!==String(t.qual?.FDISKEintragDatum||''))throw new Error('Das FDISK-Datum wurde inzwischen geändert. Bitte die Seite neu öffnen und prüfen.');
 }
 const props=PropertiesService.getScriptProperties(),used={...t.grant,VerwendetAm:gaNow_()};
 gaAdminMailWrite_(t.key,used);
 try{
  if(t.check){
   if(t.choice)gaAdminMailWrite_(t.grant.MailKey,{...t.delivery,AbgeschlosseneChecks:{...t.delivery.AbgeschlosseneChecks,[t.check.ID]:t.targetStatus}});
   gaReplace_('MitgliedChecks',t.check.ID,{Status:t.targetStatus,GeaendertVon:'EMAIL_LINK',GeaendertAm:gaNow_()});
  }
  else{
   const ack={...t.ack,...(t.grant.Aktion==='aid-filed'?{AbgelegtAm:gaNow_()}:{FDISKBestaetigtAm:gaNow_(),FDISKEintragDatum:date})};
   if(t.grant.Aktion==='aid-fdisk'){
    const value={FDISKEintragDatum:date,FDISKPlatzhalter:'NEIN'};
    if(t.qual)gaReplace_('QualifikationMitglieder',t.qual.ID,value);
    else gaAppend_('QualifikationMitglieder',{ID:gaId_(),MitgliedID:t.member.ID,...value});
   }
   gaAdminMailWrite_(GA_AID_MAIL_ACK_PREFIX+encodeURIComponent(t.proof.ID),ack);
  }
 }catch(error){
  // Bei einem Schreibfehler keinen vorhandenen Status zurücksetzen; die Administration kann den tatsächlichen Stand prüfen.
  const saved=t.check?gaFind_('MitgliedChecks',t.check.ID)?.Status===t.targetStatus:
   t.grant.Aktion==='aid-filed'?!!gaAidMailAck_(t.proof.ID).AbgelegtAm:!!gaAidMailAck_(t.proof.ID).FDISKBestaetigtAm;
  if(!saved)try{gaAdminMailWrite_(t.key,t.grant);if(t.choice)gaAdminMailWrite_(t.grant.MailKey,t.delivery);}catch(e){console.warn('Mail-Link konnte nicht erneut freigegeben werden.');}
  throw new Error('Die Bestätigung konnte nicht vollständig gespeichert werden. Bitte den angezeigten Status prüfen oder die Administration informieren.');
 }
 try{gaLog_('EMAIL_LINK','MAIL_AUSGABE_BESTAETIGT',t.grant.Aktion,t.check?.ID||t.proof.ID,{MitgliedID:t.member.ID,Datum:date});}catch(e){console.warn('Mail-Bestätigungsprotokoll konnte nicht geschrieben werden.');}
 if(t.check)try{
  const accounts=gaRows_('Benutzer').filter(u=>u.Rolle==='Teilnehmer'&&gaBool_(u.Aktiv)&&String(u.Email||'').trim().toLowerCase()===String(t.member.Email||'').trim().toLowerCase());
  if(accounts.length===1&&gaOwnMember_(accounts[0])?.ID===t.member.ID)gaNotify_(accounts[0].ID,'Checkliste','Checkliste aktualisiert',t.item.Titel+': '+t.targetStatus,t.check.ID);
 }catch(e){console.warn('Checkliste bestätigt; Teilnehmernachricht konnte nicht erstellt werden.');}
 return {...gaPreviewMailAction_(d),message:'Bestätigung gespeichert.'+(t.check?' Status: '+t.targetStatus+'.':'')};
}
function gaRenewChecklistMail_(u,d){
 gaRequire_(u,['Administrator']);const key=gaNeed_(d.ID,'Mail',300);
 if(!key.startsWith(GA_ADMINMAIL_QUEUE))throw new Error('Mail nicht gefunden.');
 const row=gaAdminMailRead_(key);if(!row||!['transponder','pager','blaulicht','zeugkammer','ersteHilfe'].includes(row.Art))throw new Error('Keine Ausgabe-Mail.');
 if(row.Art==='ersteHilfe')return gaResendAidEmail_(u,{ID:row.NachweisID});
 const draft=gaAdminMailDraft_({...row,key},true);if(draft.pause||draft.cancel)throw new Error('Kein aktueller Empfänger oder keine offenen Ausgaben vorhanden.');
 gaAdminMailWrite_(key,{...row,Status:'Wartend',FaelligMillis:Date.now(),AktualisiertMillis:Date.now()});
 return {ok:true,message:gaAdminMailDispatch_(key)?'Mail mit neuen Bestätigungslinks versendet. Bisherige Links wurden ersetzt.':'Versand konnte nicht bestätigt werden. Bitte Status prüfen.'};
}
function gaCleanupMailActions_(){
 const props=PropertiesService.getScriptProperties(),all=props.getProperties();
 Object.keys(all).filter(k=>k.startsWith(GA_MAIL_ACTION_PREFIX)).filter(k=>{try{return Number(JSON.parse(all[k]).AblaufMillis)<Date.now();}catch(e){return false;}}).slice(0,100).forEach(k=>props.deleteProperty(k));
}
function gaAdminMailRead_(key){
 const raw=PropertiesService.getScriptProperties().getProperty(key);if(!raw)return null;
 try{return JSON.parse(raw);}catch(e){throw new Error('Gespeicherte Verwaltungs-Mail-Daten sind beschädigt. Bitte Administration informieren.');}
}
function gaAdminMailSettings_(){
 const s=gaAdminMailRead_(GA_ADMINMAIL_SETTINGS)||{};
 return {PagerEmpfaenger:s.PagerEmpfaenger||'',BlaulichtEmpfaenger:s.BlaulichtEmpfaenger||'',TransponderEmpfaenger:s.TransponderEmpfaenger||'',BlockBEmpfaenger:s.BlockBEmpfaenger||'',BerichtEmpfaenger:s.BerichtEmpfaenger||'',ZeugkammerEmpfaenger:s.ZeugkammerEmpfaenger||''};
}
function gaAdminMailAddress_(v){
 const text=String(v||'').trim().toLowerCase();if(!text)return '';
 const addresses=text.split(',').map(a=>a.trim());
 if(text.length>5000||addresses.length>20)throw new Error('Bitte höchstens 20 Empfängeradressen je Feld mit Komma getrennt eingeben.');
 if(addresses.some(a=>!a||a.length>240||!gaEmail_(a)||/[\s,;<>:()\[\]\\"]/.test(a)))
  throw new Error('Bitte gültige Empfänger-E-Mail-Adressen mit Komma getrennt eingeben.');
 return [...new Set(addresses)].join(',');
}
function gaAdminMailEnsureTrigger_(){
 if(!ScriptApp.getProjectTriggers().some(t=>t.getHandlerFunction()==='gaVerwaltungsMailJob_'))
  ScriptApp.newTrigger('gaVerwaltungsMailJob_').timeBased().everyMinutes(5).create();
}
function gaVerwaltungsMailEinrichten(){
 gaAdminMailEnsureTrigger_();
 SpreadsheetApp.getUi().alert('Verwaltungs-Mail-Prüfung eingerichtet (alle 5 Minuten). Empfänger in der App unter Verwaltungs-Mails hinterlegen. Es wurden keine Mails versendet.');
}
function gaSaveAdminMailSettings_(u,d){
 gaRequire_(u,['Administrator']);
 const old=gaAdminMailSettings_(),s={};
 for(const field of ['PagerEmpfaenger','BlaulichtEmpfaenger','TransponderEmpfaenger','BlockBEmpfaenger','BerichtEmpfaenger','ZeugkammerEmpfaenger'])s[field]=gaAdminMailAddress_(Object.prototype.hasOwnProperty.call(d,field)?d[field]:old[field]);
 if(s.PagerEmpfaenger||s.BlaulichtEmpfaenger||s.TransponderEmpfaenger||s.BlockBEmpfaenger||s.BerichtEmpfaenger||s.ZeugkammerEmpfaenger)gaAdminMailEnsureTrigger_();
 PropertiesService.getScriptProperties().setProperty(GA_ADMINMAIL_SETTINGS,JSON.stringify(s));
 gaLog_(u.ID,'VERWALTUNGSMAIL_EINSTELLUNGEN','System','',{PagerAktiv:!!s.PagerEmpfaenger,BlaulichtAktiv:!!s.BlaulichtEmpfaenger,TransponderAktiv:!!s.TransponderEmpfaenger,BlockBAktiv:!!s.BlockBEmpfaenger,BerichteAktiv:!!s.BerichtEmpfaenger});
 return {ok:true,message:'Empfänger gespeichert. Wartende Meldungen verwenden die aktuell hinterlegten Adressen. Bereits versendete Mails werden nicht wiederholt.'};
}
function gaAdminMailKey_(kind,id,date){return GA_ADMINMAIL_QUEUE+kind+'_'+encodeURIComponent(id)+(date?'_'+date:'');}
function gaAdminMailWrite_(key,row){
 const raw=JSON.stringify(row);if(raw.length>8000)throw new Error('Verwaltungs-Mail-Datensatz ist zu umfangreich.');
 PropertiesService.getScriptProperties().setProperty(key,raw);
}
function gaAdminMailRows_(){
 const all=PropertiesService.getScriptProperties().getProperties(),rows=[];
 for(const key of Object.keys(all).filter(k=>k.startsWith(GA_ADMINMAIL_QUEUE))){
  try{const row=JSON.parse(all[key]);if(row&&['transponder','pager','blaulicht','zeugkammer','blockB','ausbildungsbericht','freieTaetigkeit','ersteHilfe'].includes(row.Art))rows.push({key,...row});}
  catch(e){rows.push({key,Art:'unknown',Status:'Beschädigt',Hinweis:'Verwaltungs-Mail-Datensatz muss geprüft werden.'});}
 }
 return rows;
}
function gaAdminMailState_(){
 const s=gaAdminMailSettings_();let trigger=false;
 try{trigger=typeof ScriptApp!=='undefined'&&ScriptApp.getProjectTriggers().some(t=>t.getHandlerFunction()==='gaVerwaltungsMailJob_');}catch(e){console.warn('Verwaltungs-Mail-Trigger noch nicht autorisiert.');}
 let point=null,pointError='';try{point=gaTransponderItem_(false);}catch(e){pointError=String(e.message||e);}
 let blaulicht=null,blaulichtError='';try{blaulicht=gaBlaulichtItem_(false);}catch(e){blaulichtError=String(e.message||e);}
 let pager=null,pagerError='';try{pager=gaPagerItem_(false);}catch(e){pagerError=String(e.message||e);}
 return {...s,Version:6,PagerAuswahl:true,MailNichtErforderlich:true,PagerPunktID:pager?.ID||'',PagerPunktFehler:pagerError,PagerPunktArchiviert:!!pager&&!gaBool_(pager.Aktiv),ZeugkammerAuswahl:true,BlaulichtSMSLea:true,BlaulichtPunktID:blaulicht?.ID||'',BlaulichtPunktFehler:blaulichtError,BlaulichtPunktArchiviert:!!blaulicht&&!gaBool_(blaulicht.Aktiv),MailBestaetigungen:true,MehrereEmpfaenger:true,TransponderPunktFehler:pointError,TransponderPunktID:point?.ID||'',TransponderPunktArchiviert:!!point&&!gaBool_(point.Aktiv),TriggerAktiv:trigger,
  Verlauf:gaAdminMailRows_().sort((a,b)=>Number(b.AktualisiertMillis||0)-Number(a.AktualisiertMillis||0)).slice(0,40)
   .map(r=>({ID:r.key,Art:r.Art,Status:r.Status,Hinweis:r.Hinweis||'',MitgliedID:r.MitgliedID||'',BerichtID:r.BerichtID||'',TurnusID:r.TurnusID||'',Datum:r.Datum||'',
    Anzahl:r.Anzahl||0,Name:r.Name||'',GesendetAm:r.GesendetAm||'',FaelligMillis:r.FaelligMillis||0}))};
}
function gaTransponderItem_(create){
 const item=gaChecklistNamedItem_(GA_TRANSPONDER_TITLE,'GA_TRANSPONDER_CHECK_ID_V1');
 if(item||!create)return item;
 const value={ID:gaId_(),Titel:GA_TRANSPONDER_TITLE,Bereich:'Grundausbildung',Zustaendig:'Administration',Aktiv:'JA',ErstelltAm:gaNow_()};
 gaAppend_('Checklistenpunkte',value);gaChecklistRememberIdentity_(value);return value;
}
function gaTransponderInput_(u,d,m,turnus){
 if(!Object.prototype.hasOwnProperty.call(d,'TransponderErforderlich'))return null; // Alte Formulare verändern diese Auswahl nicht.
 gaRequire_(u,['Administrator']);
 const required=d.TransponderErforderlich===true||d.TransponderErforderlich==='JA';
 const item=gaTransponderItem_(false),checks=item?gaRows_('MitgliedChecks').filter(c=>c.MitgliedID===d.ID&&c.PunktID===item.ID):[];
 if(checks.length>1)throw new Error('Mehrere Transponder-Checklisten für dieses Mitglied. Bitte Administration prüfen lassen.');
 if(checks[0]?.Status==='Erledigt')return {required:true,complete:true};
 if(required){
  if(item&&!gaBool_(item.Aktiv))throw new Error('Der Transponder-Checklistenpunkt ist archiviert. Bitte unter Checklisten → Checklistenpunkte verwalten wiederherstellen.');
  if(turnus.Bereich!=='Grundausbildung')throw new Error('Die Transponder-Aufnahmemeldung ist für die Grundausbildung vorgesehen.');
  if(!m.Standesbuchnummer||!m.Telefon)throw new Error('Für die Transponder-Anforderung bitte Standesbuchnummer und Telefonnummer ergänzen.');
  const sent=d.ID?gaAdminMailRead_(gaAdminMailKey_('transponder',d.ID)):null;
  if(sent?.Status!=='Gesendet'&&!gaAdminMailSettings_().TransponderEmpfaenger)
   throw new Error('Bitte zuerst unter Verwaltungs-Mails eine Empfängeradresse für Transponder hinterlegen.');
 }
 return {required,complete:false};
}
function gaTransponderApply_(u,m,input){
 if(!input)return '';
 try{
  const item=gaTransponderItem_(input.required);if(!item)return '';
  const old=gaRows_('MitgliedChecks').find(c=>c.MitgliedID===m.ID&&c.PunktID===item.ID);
  if(old?.Status==='Erledigt'||input.complete)return '';
  if(old){if(input.required&&old.Status==='Nicht erforderlich'||!input.required&&old.Status==='Offen')
   gaReplace_('MitgliedChecks',old.ID,{Status:input.required?'Offen':'Nicht erforderlich',GeaendertVon:u.ID,GeaendertAm:gaNow_()});}
  else if(input.required)gaAppend_('MitgliedChecks',{ID:gaId_(),MitgliedID:m.ID,PunktID:item.ID,Status:'Offen',Kommentar:'Transponder bei Aufnahme angefordert.',GeaendertVon:u.ID,GeaendertAm:gaNow_()});
  const key=gaAdminMailKey_('transponder',m.ID),previous=gaAdminMailRead_(key);
  if(!input.required){if(previous&&['Wartend','Fehler'].includes(previous.Status))gaAdminMailWrite_(key,{...previous,Status:'Nicht erforderlich',AktualisiertMillis:Date.now()});return '';}
  if(previous&&['Gesendet','Versand läuft','Fehler'].includes(previous.Status))return previous.Status==='Fehler'?' Transponder-Mail noch nicht versendet; bitte unter Verwaltungs-Mails prüfen.':'';
  gaAdminMailWrite_(key,{Art:'transponder',MitgliedID:m.ID,Name:m.Vorname+' '+m.Nachname,Status:'Wartend',FaelligMillis:Date.now(),AktualisiertMillis:Date.now()});
  return gaAdminMailDispatch_(key)?' Transponder-Anforderung per E-Mail versendet.':' Transponder-Anforderung gespeichert; Versandstatus unter Verwaltungs-Mails prüfen.';
 }catch(e){console.warn('Transponder-Nachbearbeitung fehlgeschlagen:',String(e));return ' Mitglied gespeichert. Transponder-Checkliste oder Mail konnte nicht vollständig angelegt werden; bitte prüfen und die Transponder-Auswahl erneut speichern.';}
}
function gaPagerItem_(create){
 const item=gaChecklistNamedItem_(GA_PAGER_TITLE,'GA_PAGER_CHECK_ID_V1');
 if(item||!create)return item;
 const value={ID:gaId_(),Titel:GA_PAGER_TITLE,Bereich:'Grundausbildung',Zustaendig:'Administration',Aktiv:'JA',ErstelltAm:gaNow_()};
 gaAppend_('Checklistenpunkte',value);gaChecklistRememberIdentity_(value);return value;
}
function gaPagerInput_(u,d,m,turnus){
 if(!Object.prototype.hasOwnProperty.call(d,'PagerErforderlich'))return null; // Alte Formulare verändern diese Auswahl nicht.
 gaRequire_(u,['Administrator']);
 const required=d.PagerErforderlich===true||d.PagerErforderlich==='JA';
 const item=gaPagerItem_(false),checks=item?gaRows_('MitgliedChecks').filter(c=>c.MitgliedID===d.ID&&c.PunktID===item.ID):[];
 if(checks.length>1)throw new Error('Mehrere Pager-Checklisten für dieses Mitglied. Bitte Administration prüfen lassen.');
 if(checks[0]?.Status==='Erledigt')return {required:true,complete:true};
 if(required){
  if(item&&!gaBool_(item.Aktiv))throw new Error('Der Pager-Checklistenpunkt ist archiviert. Bitte unter Checklisten → Checklistenpunkte verwalten wiederherstellen.');
  if(turnus.Bereich!=='Grundausbildung')throw new Error('Die Pager-Aufnahmemeldung ist für die Grundausbildung vorgesehen.');
  if(!m.Standesbuchnummer||!m.Telefon)throw new Error('Für die Pager-Anforderung bitte Standesbuchnummer und Telefonnummer ergänzen.');
  const sent=d.ID?gaAdminMailRead_(gaAdminMailKey_('pager',d.ID)):null;
  if(sent?.Status!=='Gesendet'&&!gaAdminMailSettings_().PagerEmpfaenger)
   throw new Error('Bitte zuerst unter Verwaltungs-Mails eine Empfängeradresse für Pager hinterlegen.');
 }
 return {required,complete:false};
}
function gaPagerApply_(u,m,input){
 if(!input)return '';
 try{
  const item=gaPagerItem_(input.required);if(!item)return '';
  const old=gaRows_('MitgliedChecks').find(c=>c.MitgliedID===m.ID&&c.PunktID===item.ID);
  if(old?.Status==='Erledigt'||input.complete)return '';
  if(old){if(input.required&&old.Status==='Nicht erforderlich'||!input.required&&old.Status==='Offen')
   gaReplace_('MitgliedChecks',old.ID,{Status:input.required?'Offen':'Nicht erforderlich',GeaendertVon:u.ID,GeaendertAm:gaNow_()});}
  else if(input.required)gaAppend_('MitgliedChecks',{ID:gaId_(),MitgliedID:m.ID,PunktID:item.ID,Status:'Offen',Kommentar:'Pager bei Aufnahme angefordert.',GeaendertVon:u.ID,GeaendertAm:gaNow_()});
  const key=gaAdminMailKey_('pager',m.ID),previous=gaAdminMailRead_(key);
  if(!input.required){if(previous&&['Wartend','Fehler'].includes(previous.Status))gaAdminMailWrite_(key,{...previous,Status:'Nicht erforderlich',AktualisiertMillis:Date.now()});return '';}
  if(previous&&['Gesendet','Versand läuft','Fehler'].includes(previous.Status))return previous.Status==='Fehler'?' Pager-Mail noch nicht versendet; bitte unter Verwaltungs-Mails prüfen.':'';
  gaAdminMailWrite_(key,{Art:'pager',MitgliedID:m.ID,Name:m.Vorname+' '+m.Nachname,Status:'Wartend',FaelligMillis:Date.now(),AktualisiertMillis:Date.now()});
  return gaAdminMailDispatch_(key)?' Pager-Anforderung per E-Mail versendet.':' Pager-Anforderung gespeichert; Versandstatus unter Verwaltungs-Mails prüfen.';
 }catch(e){console.warn('Pager-Nachbearbeitung fehlgeschlagen:',String(e));return ' Mitglied gespeichert. Pager-Checkliste oder Mail konnte nicht vollständig angelegt werden; bitte prüfen und die Pager-Auswahl erneut speichern.';}
}
function gaBlaulichtItem_(create){
 const item=gaChecklistNamedItem_(GA_BLAULICHT_TITLE,'GA_BLAULICHT_CHECK_ID_V1');
 if(item||!create)return item;
 const value={ID:gaId_(),Titel:GA_BLAULICHT_TITLE,Bereich:'Grundausbildung',Zustaendig:'IT',Aktiv:'JA',ErstelltAm:gaNow_()};
 gaAppend_('Checklistenpunkte',value);gaChecklistRememberIdentity_(value);return value;
}
function gaBlaulichtInput_(u,d,m,turnus){
 if(!Object.prototype.hasOwnProperty.call(d,'BlaulichtErforderlich'))return null; // Alte Formulare verändern diese Auswahl nicht.
 gaRequire_(u,['Administrator']);
 const required=d.BlaulichtErforderlich===true||d.BlaulichtErforderlich==='JA';
 const item=gaBlaulichtItem_(false),checks=item?gaRows_('MitgliedChecks').filter(c=>c.MitgliedID===d.ID&&c.PunktID===item.ID):[];
 if(checks.length>1)throw new Error('Mehrere Blaulicht-Checklisten für dieses Mitglied. Bitte Administration prüfen lassen.');
 if(checks[0]?.Status==='Erledigt')return {required:true,complete:true};
 if(required){
  if(item&&!gaBool_(item.Aktiv))throw new Error('Der Blaulicht-Checklistenpunkt ist archiviert. Bitte unter Checklisten → Checklistenpunkte verwalten wiederherstellen.');
  if(turnus.Bereich!=='Grundausbildung')throw new Error('Die Blaulicht-Aufnahmemeldung ist für die Grundausbildung vorgesehen.');
  if(!m.Standesbuchnummer||!m.Telefon)throw new Error('Für die Blaulicht SMS/Lea-Anforderung bitte Standesbuchnummer und Telefonnummer ergänzen.');
  const sent=d.ID?gaAdminMailRead_(gaAdminMailKey_('blaulicht',d.ID)):null;
  if(sent?.Status!=='Gesendet'&&!gaAdminMailSettings_().BlaulichtEmpfaenger)
   throw new Error('Bitte zuerst unter Verwaltungs-Mails eine Empfängeradresse für Blaulicht hinterlegen.');
 }
 return {required,complete:false};
}
function gaBlaulichtApply_(u,m,input){
 if(!input)return '';
 try{
  const item=gaBlaulichtItem_(input.required);if(!item)return '';
  const old=gaRows_('MitgliedChecks').find(c=>c.MitgliedID===m.ID&&c.PunktID===item.ID);
  if(old?.Status==='Erledigt'||input.complete)return '';
  if(old){if(input.required&&old.Status==='Nicht erforderlich'||!input.required&&old.Status==='Offen')
   gaReplace_('MitgliedChecks',old.ID,{Status:input.required?'Offen':'Nicht erforderlich',GeaendertVon:u.ID,GeaendertAm:gaNow_()});}
  else if(input.required)gaAppend_('MitgliedChecks',{ID:gaId_(),MitgliedID:m.ID,PunktID:item.ID,Status:'Offen',Kommentar:'Registrierung und Zuordnung in Blaulicht SMS/Lea angefordert.',GeaendertVon:u.ID,GeaendertAm:gaNow_()});
  const key=gaAdminMailKey_('blaulicht',m.ID),previous=gaAdminMailRead_(key);
  if(!input.required){if(previous&&['Wartend','Fehler'].includes(previous.Status))gaAdminMailWrite_(key,{...previous,Status:'Nicht erforderlich',AktualisiertMillis:Date.now()});return '';}
  if(previous&&['Gesendet','Versand läuft','Fehler'].includes(previous.Status))return previous.Status==='Fehler'?' Blaulicht-Mail noch nicht versendet; bitte unter Verwaltungs-Mails prüfen.':'';
  gaAdminMailWrite_(key,{Art:'blaulicht',MitgliedID:m.ID,Name:m.Vorname+' '+m.Nachname,Status:'Wartend',FaelligMillis:Date.now(),AktualisiertMillis:Date.now()});
  return gaAdminMailDispatch_(key)?' Blaulicht SMS/Lea-Anforderung per E-Mail versendet.':' Blaulicht SMS/Lea-Anforderung gespeichert; Versandstatus unter Verwaltungs-Mails prüfen.';
 }catch(e){console.warn('Blaulicht-Nachbearbeitung fehlgeschlagen:',String(e));return ' Mitglied gespeichert. Blaulicht-Checkliste oder Mail konnte nicht vollständig angelegt werden; bitte prüfen und die Blaulicht SMS/Lea-Auswahl erneut speichern.';}
}
function gaBlockBPositive_(proof){return !!proof&&gaBool_(proof.Absolviert)&&gaBool_(proof.PruefungBestanden)&&/^\d{4}-\d{2}-\d{2}$/.test(String(proof.Pruefungsdatum||''));}
function gaQueueBlockBMail_(m,previous,next){
 if(!gaBlockBPositive_(next)||(gaBlockBPositive_(previous)&&previous.Pruefungsdatum===next.Pruefungsdatum))return '';
 const turnus=gaFind_('Turnusse',m.TurnusID);if(turnus?.Bereich!=='Grundausbildung')return '';
 try{
  if(!gaAdminMailSettings_().BlockBEmpfaenger)return '';
  if(gaAdminMailRead_(GA_ADMINMAIL_B_SENT+encodeURIComponent(m.ID)))return '';
  const key=gaAdminMailKey_('blockB',turnus.ID,next.Pruefungsdatum),old=gaAdminMailRead_(key);
  if(old&&['Versand läuft','Fehler'].includes(old.Status))return ' Die Block-B-Sammelmail benötigt eine Prüfung unter Verwaltungs-Mails.';
  gaAdminMailWrite_(key,{Art:'blockB',TurnusID:turnus.ID,Datum:next.Pruefungsdatum,Status:'Wartend',FaelligMillis:Date.now()+5*60*1000,AktualisiertMillis:Date.now()});
  return ' Block-B-Sammelmail vorgemerkt (5 Minuten nach dem letzten neuen Abschluss, Versandprüfung alle 5 Minuten).';
 }catch(e){console.warn('Block-B-Mail konnte nicht vorgemerkt werden:',String(e));return ' Abschluss gespeichert; die Block-B-Sammelmail konnte nicht vorgemerkt werden. Bitte Verwaltungs-Mails prüfen.';}
}
function gaQueueReportMail_(kind,id,isNewCompletion){
 if(!isNewCompletion)return '';
 try{
  if(!gaAdminMailSettings_().BerichtEmpfaenger)return '';
  const key=gaAdminMailKey_(kind,id),old=gaAdminMailRead_(key);
  if(old)return old.Status==='Fehler'?' Bericht gespeichert; PDF-Mail unter Verwaltungs-Mails prüfen.':'';
  gaAdminMailWrite_(key,{Art:kind,BerichtID:id,Status:'Wartend',FaelligMillis:Date.now(),AktualisiertMillis:Date.now()});
  return ' Der fertige Tätigkeitsbericht ist für den automatischen PDF-Mailversand vorgemerkt.';
 }catch(e){console.warn('Berichts-Mail konnte nicht vorgemerkt werden:',String(e));return ' Tätigkeitsbericht gespeichert; PDF-Mail konnte nicht vorgemerkt werden. Bitte Administration informieren.';}
}
function gaReportParticipantName_(m){
 if(!m)return '[Mitglied nicht gefunden – Standesbuchnummer unbekannt]';
 return gaAdminMailLine_(m.Nachname)+', '+gaAdminMailLine_(m.Vorname)+' · Stb.-Nr. '+(gaAdminMailLine_(m.Standesbuchnummer)||'nicht hinterlegt');
}
function gaReportMailDraft_(r,settings,footer){
 if(!settings.BerichtEmpfaenger)return {pause:true};
 const isTraining=r.Art==='ausbildungsbericht',term=isTraining?gaFind_('Termine',r.BerichtID):null,
  report=isTraining?gaOptionalRows_('Ausbildungsberichte').find(x=>x.TerminID===r.BerichtID):gaFind_('FreieTaetigkeiten',r.BerichtID),
  course=term?gaFind_('Kurse',term.KursID):null;
 if(!report||isTraining&&(!term||term.Status!=='Durchgeführt'))return {cancel:true};
 if(!(Number(report.DauerMinuten)>0)||!report.BeginnIst||!report.EndeIst)throw new Error('Der Tätigkeitsbericht ist noch nicht vollständig abgeschlossen.');
 const title=course?.Titel||report.Titel||'Tätigkeit',location=term?.Ort||report.Ort||'nicht hinterlegt',
  participantIds=isTraining?gaRows_('Teilnahmen').filter(x=>x.TerminID===term.ID&&gaBool_(x.Anwesend)).map(x=>x.MitgliedID):String(report.TeilnehmerIDs||'').split(',').filter(Boolean),
  trainers=String(report.AusbilderIDs||'').split(',').filter(Boolean),line=gaAdminMailLine_;
 const result=isTraining?gaExportTrainingPdf_({ID:'SYSTEM',Rolle:'Administrator'},{TerminID:term.ID}):
  gaExportFreeActivityPdf_({ID:'SYSTEM',Rolle:'Administrator'},{ID:report.ID});
 if(!result?.base64||!result.dateiname)throw new Error('Das fertige PDF konnte nicht erstellt werden.');
 const attachment=Utilities.newBlob(Utilities.base64Decode(result.base64),'application/pdf',result.dateiname);
 const body=['Ein Tätigkeitsbericht wurde in der Ausbildungsplattform abgeschlossen. Das vollständige PDF zur Dokumentation und Übertragung nach FDISK befindet sich im Anhang.','',
  'Bericht: '+line(title),'Art: '+(isTraining?'Ausbildung / Kurstermin':line(report.Kategorie||'Freie Tätigkeit')),
  ...(term?['Turnus: '+line(gaFind_('Turnusse',term.TurnusID)?.Bezeichnung)]:[]),
  'Ort: '+line(location),'Beginn: '+gaTrainingDate_(report.BeginnIst),'Ende: '+gaTrainingDate_(report.EndeIst),
  'Dauer: '+gaTrainingHours_(report.DauerMinuten)+' Stunden','Anwesende Teilnehmer: '+participantIds.length,
  'Mitwirkende Ausbilder / Verantwortliche: '+trainers.length,
  'PDF-Datei: '+line(result.dateiname),'',
  'Das PDF enthält Teilnehmernamen mit Standesbuchnummern, dokumentierte Zeiten, Personenstunden und die erfassten Fahrzeuge samt Kilometern.','',footer].join('\n');
 return {to:gaAdminMailAddress_(settings.BerichtEmpfaenger),subject:'Tätigkeitsbericht abgeschlossen – '+line(title)+' – '+gaAdminMailDate_(String(report.BeginnIst).slice(0,10)),body,
  attachments:[attachment],memberIds:[...new Set(participantIds)]};
}
function gaAdminMailLine_(value){return String(value||'').replace(/[\r\n\t]/g,' ').trim();}
function gaAdminMailDate_(value){return /^\d{4}-\d{2}-\d{2}$/.test(String(value||''))?value.slice(8,10)+'.'+value.slice(5,7)+'.'+value.slice(0,4):'nicht hinterlegt';}
function gaEquipmentMailActions_(kind,member,check,item){
 const title=kind==='pager'?'Pager':'Transponder / Schlüssel',base={CheckID:check.ID,MitgliedID:member.ID,PunktID:item.ID,AbschlussAuswahl:true};
 return [{...base,Aktion:'check',Label:title+' ausgegeben bestätigen'},
  {...base,Aktion:'check-not-required',Label:title+' nicht erforderlich bestätigen'}];
}
function gaAdminMailDraft_(r,previewOnly=false){
 const settings=gaAdminMailSettings_(),footer='Diese Nachricht wurde automatisch von der Ausbildungsplattform der Feuerwehr St. Pölten-Stadt erstellt. Bitte nicht auf diese E-Mail antworten.';
 const line=gaAdminMailLine_;
 if(r.Art==='zeugkammer')return gaZeugkammerDraft_(r,footer,previewOnly);
 if(['ausbildungsbericht','freieTaetigkeit'].includes(r.Art))return gaReportMailDraft_(r,settings,footer);
 if(r.Art==='transponder'){
  if(!settings.TransponderEmpfaenger)return {pause:true};
  const m=gaFind_('Mitglieder',r.MitgliedID),item=gaTransponderItem_(false),check=item&&gaRows_('MitgliedChecks').find(c=>c.MitgliedID===r.MitgliedID&&c.PunktID===item.ID);
  if(!m||!gaBool_(m.Aktiv)||gaFind_('Turnusse',m.TurnusID)?.Bereich!=='Grundausbildung'||!gaBool_(item?.Aktiv)||check?.Status!=='Offen')return {cancel:true};
  if(!m.Standesbuchnummer||!m.Telefon)throw new Error('Standesbuchnummer oder Telefonnummer fehlt.');
  const body=['Dieses Mitglied wurde in die Grundausbildung aufgenommen und benötigt noch einen Transponder.','',
   'Name: '+line(m.Vorname)+' '+line(m.Nachname),'Standesbuchnummer: '+line(m.Standesbuchnummer),
   'Telefonnummer: '+line(m.Telefon),'E-Mail-Adresse: '+(line(m.Email)||'nicht hinterlegt'),
   'Turnus: '+line(gaFind_('Turnusse',m.TurnusID)?.Bezeichnung),'',footer].join('\n');
  return {to:gaAdminMailAddress_(settings.TransponderEmpfaenger),subject:'Transponder für Zugang benötigt – '+line(m.Vorname)+' '+line(m.Nachname),memberIds:[m.ID],...gaMailActionExtras_(r,gaEquipmentMailActions_('transponder',m,check,item),body,previewOnly)};
 }
 if(r.Art==='pager'){
  if(!settings.PagerEmpfaenger)return {pause:true};
  const m=gaFind_('Mitglieder',r.MitgliedID),item=gaPagerItem_(false),check=item&&gaRows_('MitgliedChecks').find(c=>c.MitgliedID===r.MitgliedID&&c.PunktID===item.ID);
  if(!m||!gaBool_(m.Aktiv)||gaFind_('Turnusse',m.TurnusID)?.Bereich!=='Grundausbildung'||!gaBool_(item?.Aktiv)||check?.Status!=='Offen')return {cancel:true};
  if(!m.Standesbuchnummer||!m.Telefon)throw new Error('Standesbuchnummer oder Telefonnummer fehlt.');
  const body=['Dieses Mitglied wurde in die Grundausbildung aufgenommen und benötigt noch einen Pager.','',
   'Name: '+line(m.Vorname)+' '+line(m.Nachname),'Standesbuchnummer: '+line(m.Standesbuchnummer),
   'Telefonnummer: '+line(m.Telefon),'E-Mail-Adresse: '+(line(m.Email)||'nicht hinterlegt'),
   'Turnus: '+line(gaFind_('Turnusse',m.TurnusID)?.Bezeichnung),'',footer].join('\n');
  return {to:gaAdminMailAddress_(settings.PagerEmpfaenger),subject:'Pager benötigt – '+line(m.Vorname)+' '+line(m.Nachname),memberIds:[m.ID],...gaMailActionExtras_(r,gaEquipmentMailActions_('pager',m,check,item),body,previewOnly)};
 }
 if(r.Art==='blaulicht'){
  if(!settings.BlaulichtEmpfaenger)return {pause:true};
  const m=gaFind_('Mitglieder',r.MitgliedID),item=gaBlaulichtItem_(false),check=item&&gaRows_('MitgliedChecks').find(c=>c.MitgliedID===r.MitgliedID&&c.PunktID===item.ID);
  if(!m||!gaBool_(m.Aktiv)||gaFind_('Turnusse',m.TurnusID)?.Bereich!=='Grundausbildung'||!gaBool_(item?.Aktiv)||check?.Status!=='Offen')return {cancel:true};
  if(!m.Standesbuchnummer||!m.Telefon)throw new Error('Standesbuchnummer oder Telefonnummer fehlt.');
  const body=['Dieses Mitglied wurde in die Grundausbildung aufgenommen und muss noch in Blaulicht SMS/Lea registriert und zugeordnet werden.','',
   'Name: '+line(m.Vorname)+' '+line(m.Nachname),'Standesbuchnummer: '+line(m.Standesbuchnummer),
   'Telefonnummer: '+line(m.Telefon),'E-Mail-Adresse: '+(line(m.Email)||'nicht hinterlegt'),
   'Turnus: '+line(gaFind_('Turnusse',m.TurnusID)?.Bezeichnung),'',footer].join('\n');
  return {to:gaAdminMailAddress_(settings.BlaulichtEmpfaenger),subject:'Blaulicht SMS/Lea: Registrierung und Zuordnung – '+line(m.Vorname)+' '+line(m.Nachname),memberIds:[m.ID],...gaMailActionExtras_(r,[{Aktion:'check',CheckID:check.ID,MitgliedID:m.ID,PunktID:item.ID,Label:'In Blaulicht SMS/Lea registriert und zugeordnet bestätigen'}],body,previewOnly)};
 }
 if(r.Art!=='blockB')throw new Error('Ungültiger Mail-Typ.');
 if(!settings.BlockBEmpfaenger)return {pause:true};
 const turnus=gaFind_('Turnusse',r.TurnusID);if(!turnus||turnus.Bereich!=='Grundausbildung')return {cancel:true};
 const proofs=gaOptionalRows_('AbschnittNachweise'),members=gaRows_('Mitglieder').filter(m=>gaBool_(m.Aktiv)&&m.TurnusID===r.TurnusID&&
  !gaAdminMailRead_(GA_ADMINMAIL_B_SENT+encodeURIComponent(m.ID))&&proofs.some(p=>p.MitgliedID===m.ID&&p.KursID==='GAB-ABSCHNITT-BLOCK-B'&&gaBlockBPositive_(p)&&p.Pruefungsdatum===r.Datum))
  .sort((a,b)=>(a.Nachname+' '+a.Vorname).localeCompare(b.Nachname+' '+b.Vorname,'de'));
 if(!members.length)return {cancel:true};
 if(members.some(m=>!m.Standesbuchnummer))throw new Error('Bei mindestens einem positiven Teilnehmer fehlt die Standesbuchnummer. Bitte ergänzen und erneut senden.');
 const selected=members.slice(0,100),body=['Folgende Teilnehmer haben den Truppmann-Abschluss Block B im Bezirk absolviert:','',
  'Turnus: '+line(turnus.Bezeichnung),'Datum des Kursabschlusses / der positiven Abschlussprüfung: '+gaAdminMailDate_(r.Datum),'',
  ...selected.map((m,i)=>{const p=proofs.find(p=>p.MitgliedID===m.ID&&p.KursID==='GAB-ABSCHNITT-BLOCK-B'&&gaBlockBPositive_(p)&&p.Pruefungsdatum===r.Datum);
   return (i+1)+'. '+line(m.Vorname)+' '+line(m.Nachname)+' | Standesbuchnummer: '+line(m.Standesbuchnummer)+' | Ausbildungsdatum Block B: '+gaAdminMailDate_(p.Ausbildungsdatum);}),
  '', 'Gemeldet werden ausschließlich bestätigte positive Abschlüsse dieses Turnus und Abschlussdatums. Bereits gemeldete Teilnehmer werden nicht erneut versendet.','',footer].join('\n');
 return {to:gaAdminMailAddress_(settings.BlockBEmpfaenger),subject:'Truppmann-Abschluss Block B – '+line(turnus.Bezeichnung)+' – '+gaAdminMailDate_(r.Datum),body,memberIds:selected.map(m=>m.ID),more:members.length>selected.length};
}
function gaAdminMailDispatch_(key){
 const stored=gaAdminMailRead_(key);if(!stored||stored.Status!=='Wartend')return false;
 const row={...stored,...(['transponder','pager','blaulicht','zeugkammer'].includes(stored.Art)?{key,LinkVersion:gaId_(),AbgeschlosseneChecks:{}}: {})};
 let draft;try{draft=gaAdminMailDraft_(row);}catch(e){gaAdminMailWrite_(key,{...row,Status:'Fehler',Hinweis:String(e.message||e).slice(0,250),AktualisiertMillis:Date.now()});return false;}
 if(draft.pause)return false;
 if(draft.cancel){gaAdminMailWrite_(key,{...row,Status:'Nicht mehr erforderlich',AktualisiertMillis:Date.now()});return false;}
 gaAdminMailWrite_(key,{...row,Status:'Versand läuft',Hinweis:'Bei dauerhaftem Status vor Wiederholung prüfen, ob die Mail bereits angekommen ist.',AktualisiertMillis:Date.now()});
 try{MailApp.sendEmail({to:draft.to,subject:draft.subject,body:draft.body,name:'Feuerwehr St. Pölten-Stadt – Ausbildung',noReply:true,...(draft.attachments?{attachments:draft.attachments}:{}),...(draft.htmlBody?{htmlBody:draft.htmlBody}:{})});}
 catch(e){gaAdminMailWrite_(key,{...row,Status:'Fehler',Hinweis:'Mailversand fehlgeschlagen. Berechtigungen und Kontingent prüfen; vor erneutem Versand den Posteingang kontrollieren.',AktualisiertMillis:Date.now()});return false;}
 const sent={...row,Status:'Gesendet',Hinweis:'',Anzahl:draft.memberIds.length,GesendetAm:gaNow_(),AktualisiertMillis:Date.now()};
 const changes={[key]:JSON.stringify(sent)};
 if(row.Art==='blockB')draft.memberIds.forEach(id=>{changes[GA_ADMINMAIL_B_SENT+encodeURIComponent(id)]=JSON.stringify({Datum:row.Datum,TurnusID:row.TurnusID,GesendetAm:sent.GesendetAm});});
 // Versand vor möglicher Wiederholung dauerhaft festhalten. Bei unklarem Ausgang erfolgt kein automatischer zweiter Versand.
 try{PropertiesService.getScriptProperties().setProperties(changes);}catch(e){console.warn('Verwaltungs-Mail versendet, Statusspeicherung fehlgeschlagen:',String(e));return false;}
 try{gaLog_('SYSTEM','VERWALTUNGSMAIL_GESENDET',row.Art,row.MitgliedID||row.TurnusID||row.BerichtID,{Anzahl:draft.memberIds.length,Datum:row.Datum||''});}catch(e){console.warn('Mail-Protokoll fehlgeschlagen:',String(e));}
 if(draft.more)gaAdminMailWrite_(key,{...row,Status:'Wartend',FaelligMillis:Date.now()+5*60*1000,AktualisiertMillis:Date.now()});
 return true;
}
function gaVerwaltungsMailJob_(){
 return gaLock_(()=>{
  gaCleanupMailActions_();
  const due=gaAdminMailRows_().filter(r=>r.Status==='Wartend'&&Number(r.FaelligMillis)<=Date.now()).slice(0,5);
  for(const row of due)try{gaAdminMailDispatch_(row.key);}catch(e){console.warn('Verwaltungs-Mail-Prüfung fehlgeschlagen:',String(e));}
 });
}
function gaRetryAdminMail_(u,d){
 gaRequire_(u,['Administrator']);const key=gaNeed_(d.ID,'Mail',300);
 if(!key.startsWith(GA_ADMINMAIL_QUEUE))throw new Error('Verwaltungs-Mail nicht gefunden.');
 const row=gaAdminMailRead_(key);if(!row||!['transponder','pager','blaulicht','zeugkammer','blockB','ausbildungsbericht','freieTaetigkeit','ersteHilfe'].includes(row.Art))throw new Error('Verwaltungs-Mail nicht gefunden.');
 if(row.Art==='ersteHilfe')return gaResendAidEmail_(u,{ID:row.NachweisID});
 if(!['Fehler','Versand läuft','Wartend'].includes(row.Status))return {ok:true,message:'Diese Meldung wird nicht erneut versendet.'};
 const draft=gaAdminMailDraft_(row,true);if(draft.pause)throw new Error('Bitte zuerst die Empfängeradresse hinterlegen.');
 if(draft.cancel)throw new Error('Die Meldung ist nicht mehr erforderlich. Es wird keine Mail versendet.');
 gaAdminMailWrite_(key,{...row,Status:'Wartend',FaelligMillis:Date.now(),AktualisiertMillis:Date.now(),Hinweis:''});
 const sent=gaAdminMailDispatch_(key);
 return {ok:true,message:sent?'Verwaltungs-Mail versendet.':'Versand konnte nicht bestätigt werden. Status prüfen.'};
}

function gaSaveMember_(u,d){
  gaRequire_(u,['Administrator',GA_ADV_ROLE]);
  const turnus=gaFind_('Turnusse',d.TurnusID);
  if(!turnus||!gaBool_(turnus.Aktiv))throw new Error('Bitte einen gültigen aktiven Turnus wählen.');
  const email=gaText_(d.Email,240).toLowerCase();
  if(email&&!gaEmail_(email))throw new Error('E-Mail-Adresse ungültig.');
  const val={Vorname:gaNeed_(d.Vorname,'Vorname',100),Nachname:gaNeed_(d.Nachname,'Nachname',100),
    Email:email,Telefon:gaText_(d.Telefon,60),TurnusID:d.TurnusID,Aktiv:'JA',Geburtsdatum:gaDateOnly_(d.Geburtsdatum),Standesbuchnummer:gaText_(d.Standesbuchnummer,35),Ausbildungsweg:gaChoice_(d.Ausbildungsweg||turnus.Bereich,GA.AREAS,'Ausbildungsweg')};
  const transponder=gaTransponderInput_(u,d,val,turnus),blaulicht=gaBlaulichtInput_(u,d,val,turnus),pager=gaPagerInput_(u,d,val,turnus),zeugkammer=gaZeugkammerInput_(u,d,val,turnus);
  const rows=gaRows_('Mitglieder');
  if(val.Standesbuchnummer&&rows.some(m=>m.ID!==d.ID&&m.Standesbuchnummer===val.Standesbuchnummer))throw new Error('Diese Standesbuchnummer wird bereits verwendet.');
  if(email&&rows.some(m=>m.ID!==d.ID&&m.Email.toLowerCase()===email))
    throw new Error('Diese Mitglieds-E-Mail ist bereits vergeben.');
  if(d.ID){
    const existing=rows.find(m=>m.ID===d.ID);
    if(!existing)throw new Error('Mitglied wurde nicht gefunden.');
    const beforeEmail=String(existing.Email||'').trim().toLowerCase();
    const changedEmail=beforeEmail!==email;
    const allAccounts=gaRows_('Benutzer');
    const linked=beforeEmail?allAccounts.filter(x=>String(x.Email||'').trim().toLowerCase()===beforeEmail):[];
    if(changedEmail){
      if(linked.length>1)throw new Error('Mehrere Benutzer verwenden die alte E-Mail. Bitte zunächst die Zugänge prüfen.');
      if(linked.length&&!email)throw new Error('Eine E-Mail mit bestehendem App-Zugang darf nicht geleert werden.');
      if(email&&allAccounts.some(x=>String(x.Email||'').trim().toLowerCase()===email&&x.ID!==linked[0]?.ID))
        throw new Error('Die neue E-Mail wird bereits von einem anderen Benutzer verwendet.');
    }
    // Das Mitglied bleibt über seine unveränderte ID mit sämtlichen Kursen, Nachweisen
    // und Checklisten verbunden. Bei vorhandenem Zugang wird die Login-Mail mitgeändert.
    // Offene Einladungen und Passwort-Reset-Links auf die alte Adresse werden ungültig.
    const user=changedEmail?linked[0]:null;
    const pending=user?gaOptionalRows_('Einladungen').filter(i=>i.BenutzerID===user.ID&&
      ['Offen','Passwortreset'].includes(i.Status)):[];
    const replaced=[];
    try{
      gaReplace_('Mitglieder',d.ID,val);
      replaced.push({sheet:'Mitglieder',id:d.ID,previous:existing});
      if(user){
        gaReplace_('Benutzer',user.ID,{Email:email});
        replaced.push({sheet:'Benutzer',id:user.ID,previous:user});
      }
      pending.forEach(i=>{
        gaReplace_('Einladungen',i.ID,{Status:'Ersetzt'});
        replaced.push({sheet:'Einladungen',id:i.ID,previous:i});
      });
    }catch(error){
      replaced.reverse().forEach(r=>{
        try{gaReplace_(r.sheet,r.id,r.previous);}catch(rollback){Logger.log('E-Mail-Rollback fehlgeschlagen: '+rollback.message);}
      });
      throw new Error('Änderung konnte nicht vollständig gespeichert werden: '+error.message);
    }
    const checks=gaRows_('MitgliedChecks');
    gaRows_('Checklistenpunkte').filter(i=>!gaIsOptionalIntakeItem_(i)&&gaBool_(i.Aktiv)&&(i.Bereich==='Alle'||i.Bereich===turnus.Bereich))
      .filter(i=>!checks.some(ch=>ch.MitgliedID===d.ID&&ch.PunktID===i.ID))
      .forEach(i=>gaAppend_('MitgliedChecks',{ID:gaId_(),MitgliedID:d.ID,PunktID:i.ID,Status:'Offen',Kommentar:'',GeaendertVon:u.ID,GeaendertAm:gaNow_()}));
    gaLog_(u.ID,'BEARBEITEN','Mitglied',d.ID,{Vorher:existing.Vorname+' '+existing.Nachname,
      Nachher:val.Vorname+' '+val.Nachname,TurnusVorher:existing.TurnusID,TurnusNachher:val.TurnusID,
      EMailGeaendert:changedEmail,ZugangAktualisiert:!!user,EinladungenErsetzt:pending.length});
    const transponderMessage=gaTransponderApply_(u,{...val,ID:d.ID},transponder)+gaBlaulichtApply_(u,{...val,ID:d.ID},blaulicht)+gaPagerApply_(u,{...val,ID:d.ID},pager)+(zeugkammer?gaQueueZeugkammerMail_({...val,ID:d.ID}):'');
    return {ok:true,emailGeaendert:changedEmail,zugangAktualisiert:!!user,
      neueEinladungNoetig:pending.length>0,
      message:(changedEmail?
       (user?'E-Mail im Mitglied und App-Zugang aktualisiert. Bestehendes Passwort und Ausbildungsnachweise bleiben erhalten.':
         'Mitglieds-E-Mail aktualisiert. Ausbildungsnachweise bleiben erhalten.')+
        (pending.length?' Bisherige Einladungslinks sind ungültig; bitte an die neue Adresse erneut einladen.':''):
       'Mitglied aktualisiert. Bestehende Ausbildungsnachweise bleiben erhalten.')+transponderMessage};
  }
  val.ID=gaId_();val.ErstelltAm=gaNow_();gaAppend_('Mitglieder',val);
  gaRows_('Checklistenpunkte').filter(i=>!gaIsOptionalIntakeItem_(i)&&gaBool_(i.Aktiv)&&(i.Bereich==='Alle'||i.Bereich===turnus.Bereich)).forEach(i=>
    gaAppend_('MitgliedChecks',{ID:gaId_(),MitgliedID:val.ID,PunktID:i.ID,Status:'Offen',Kommentar:'',GeaendertVon:u.ID,GeaendertAm:gaNow_()}));
  const candidates=gaRows_('Checklistenpunkte');
  gaRows_('Benutzer').filter(x=>x.Rolle==='Fachverwaltung'&&gaBool_(x.Aktiv)&&candidates.some(i=>i.Zustaendig===x.Bereich)).forEach(x=>
    gaNotify_(x.ID,'Aufgabe','Neues Mitglied: '+val.Vorname+' '+val.Nachname,'Offene Checklistenpunkte prüfen.',val.ID));
  gaLog_(u.ID,'ANLEGEN','Mitglied',val.ID,{Vorname:val.Vorname,Nachname:val.Nachname,TurnusID:val.TurnusID});
  return {ok:true,message:'Mitglied aufgenommen.'+gaTransponderApply_(u,val,transponder)+gaBlaulichtApply_(u,val,blaulicht)+gaPagerApply_(u,val,pager)+(zeugkammer?gaQueueZeugkammerMail_(val):'')};
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
/** Checklistenpunkte werden archiviert; Nachweise und Notizen werden nie gelöscht. */
function gaChecklistNamedItem_(title,property){
 const items=gaRows_('Checklistenpunkte'),id=PropertiesService.getScriptProperties().getProperty(property);
 if(id){const item=items.find(x=>x.ID===id);if(!item)throw new Error('Der zugeordnete System-Checklistenpunkt fehlt. Bitte Administration prüfen lassen.');return item;}
 const allMatching=items.filter(x=>x.Titel===title),active=allMatching.filter(x=>gaBool_(x.Aktiv)),matching=active.length?active:allMatching;
 if(matching.length>1)throw new Error('Der Checklistenpunkt „'+title+'“ besteht mehrfach. Bitte Administration prüfen lassen.');
 return matching[0]||null;
}
function gaChecklistRememberIdentity_(item){
 const props=PropertiesService.getScriptProperties();
 if(item.Titel===GA_TRANSPONDER_TITLE)props.setProperty('GA_TRANSPONDER_CHECK_ID_V1',item.ID);
 if(item.Titel===GA_BLAULICHT_TITLE)props.setProperty('GA_BLAULICHT_CHECK_ID_V1',item.ID);
 if(item.Titel===GA_PAGER_TITLE)props.setProperty('GA_PAGER_CHECK_ID_V1',item.ID);
 if(item.Titel==='Erste-Hilfe-Bescheinigung abgegeben')props.setProperty('GA_EH_CHECK_ID_V1',item.ID);
}
function gaIsTransponderItem_(item){return item.Titel===GA_TRANSPONDER_TITLE||item.ID===PropertiesService.getScriptProperties().getProperty('GA_TRANSPONDER_CHECK_ID_V1');}
function gaIsBlaulichtItem_(item){return item.Titel===GA_BLAULICHT_TITLE||item.ID===PropertiesService.getScriptProperties().getProperty('GA_BLAULICHT_CHECK_ID_V1');}
function gaIsPagerItem_(item){return item.Titel===GA_PAGER_TITLE||item.ID===PropertiesService.getScriptProperties().getProperty('GA_PAGER_CHECK_ID_V1');}
function gaIsOptionalIntakeItem_(item){return gaIsTransponderItem_(item)||gaIsBlaulichtItem_(item)||gaIsPagerItem_(item);}
function gaChecklistInScope_(item,member,turns){
 if(!item||!member||!gaBool_(item.Aktiv))return false;
 const turnus=turns.find(t=>t.ID===member.TurnusID);
 return !!turnus&&(item.Bereich==='Alle'||item.Bereich===turnus.Bereich);
}
function gaChecklistFillMissing_(item,actor){
 if(gaIsOptionalIntakeItem_(item)||!gaBool_(item.Aktiv))return;
 const turns=gaRows_('Turnusse'),checks=gaRows_('MitgliedChecks');
 for(const m of gaRows_('Mitglieder').filter(m=>gaBool_(m.Aktiv)&&gaChecklistInScope_(item,m,turns))){
  if(!checks.some(c=>c.MitgliedID===m.ID&&c.PunktID===item.ID))gaAppend_('MitgliedChecks',{ID:gaId_(),MitgliedID:m.ID,PunktID:item.ID,Status:'Offen',Kommentar:'',GeaendertVon:actor.ID,GeaendertAm:gaNow_()});
 }
}
function gaSaveChecklistItem_(u,d){
 gaRequire_(u,['Administrator']);
 const old=d.ID?gaFind_('Checklistenpunkte',gaNeed_(d.ID,'Checklistenpunkt',100)):null;
 if(d.ID&&!old)throw new Error('Checklistenpunkt nicht gefunden.');
 const val={Titel:gaNeed_(d.Titel,'Checklistenpunkt',160),Bereich:gaChoice_(d.Bereich,['Alle'].concat(GA.AREAS),'Bereich'),
  Zustaendig:gaNeed_(d.Zustaendig,'Zuständigkeit',100),Aktiv:old?old.Aktiv:'JA'};
 const reserved=old&&gaIsOptionalIntakeItem_(old)||[GA_TRANSPONDER_TITLE,GA_BLAULICHT_TITLE,GA_PAGER_TITLE].includes(val.Titel);
 if(val.Titel===GA_PAGER_TITLE){const current=gaPagerItem_(false);if(current&&current.ID!==old?.ID)throw new Error('Der optionale Pager-Checklistenpunkt besteht bereits, gegebenenfalls unter einer geänderten Bezeichnung.');}
 if(val.Titel===GA_BLAULICHT_TITLE){const current=gaBlaulichtItem_(false);if(current&&current.ID!==old?.ID)throw new Error('Der optionale Blaulicht SMS/Lea-Checklistenpunkt besteht bereits, gegebenenfalls unter einer geänderten Bezeichnung.');}
 if(val.Titel===GA_TRANSPONDER_TITLE){const current=gaTransponderItem_(false);if(current&&current.ID!==old?.ID)throw new Error('Der optionale Transponder-Checklistenpunkt besteht bereits, gegebenenfalls unter einer geänderten Bezeichnung.');}
 if(val.Titel==='Erste-Hilfe-Bescheinigung abgegeben'){const current=gaChecklistNamedItem_(val.Titel,'GA_EH_CHECK_ID_V1');if(current&&current.ID!==old?.ID)throw new Error('Der automatische Erste-Hilfe-Checklistenpunkt besteht bereits.');}
 if(reserved&&val.Bereich!=='Grundausbildung')throw new Error('Dieser optionale Aufnahme-Punkt gehört zur Grundausbildung.');
 if(val.Titel===GA_TRANSPONDER_TITLE&&gaRows_('Checklistenpunkte').some(i=>i.Titel===GA_TRANSPONDER_TITLE&&i.ID!==d.ID))
  throw new Error('Der optionale Transponder-Checklistenpunkt besteht bereits.');
 let id=old?.ID||gaId_();
 if(old){gaChecklistRememberIdentity_(old);gaReplace_('Checklistenpunkte',id,val);}
 else gaAppend_('Checklistenpunkte',{ID:id,...val,ErstelltAm:gaNow_()});
 const item={ID:id,...val};gaChecklistRememberIdentity_(item);gaChecklistFillMissing_(item,u);
 gaLog_(u.ID,old?'BEARBEITEN':'ANLEGEN','Checklistenpunkt',id,{Titel:val.Titel,Bereich:val.Bereich,Zustaendig:val.Zustaendig});
 return {ok:true,message:old?'Checklistenpunkt aktualisiert. Vorhandene Erledigungen und Notizen bleiben erhalten.':'Checklistenpunkt angelegt.'};
}
function gaSetChecklistItemActive_(u,d){
 gaRequire_(u,['Administrator']);const item=gaFind_('Checklistenpunkte',gaNeed_(d.ID,'Checklistenpunkt',100));
 if(!item)throw new Error('Checklistenpunkt nicht gefunden.');
 const active=d.Aktiv===true||d.Aktiv==='JA';
 if(!['JA','NEIN',true,false].includes(d.Aktiv))throw new Error('Ungültiger Aktivstatus.');
 gaChecklistRememberIdentity_(item);gaReplace_('Checklistenpunkte',item.ID,{Aktiv:active?'JA':'NEIN'});
 if(active)gaChecklistFillMissing_({...item,Aktiv:'JA'},u);
 gaLog_(u.ID,active?'WIEDERHERSTELLEN':'ARCHIVIEREN','Checklistenpunkt',item.ID,{Titel:item.Titel});
 return {ok:true,message:active?'Checklistenpunkt wiederhergestellt. Bestehende Erledigungen bleiben erhalten.':'Checklistenpunkt aus der aktiven Checkliste entfernt. Bestehende Erledigungen und Notizen bleiben im Archiv erhalten.'};
}
function gaSetCheck_(u,d){gaRequire_(u,['Administrator','Fachverwaltung']);const ch=gaFind_('MitgliedChecks',d.ID),item=ch&&gaFind_('Checklistenpunkte',ch.PunktID);
  if(!item)throw new Error('Checklistenpunkt nicht gefunden.');
  const target=gaFind_('Mitglieder',ch.MitgliedID);
  if(!target||!gaBool_(target.Aktiv)||!gaChecklistInScope_(item,target,gaRows_('Turnusse')))throw new Error('Dieser Checklistenpunkt ist archiviert oder für das Mitglied nicht mehr anwendbar.');
  if(u.Rolle==='Fachverwaltung'&&item.Zustaendig!==u.Bereich)throw new Error('Dieser Punkt gehört nicht zu deinem Verwaltungsbereich.');
  const val={Status:gaChoice_(d.Status,GA.CHECK_STATUSES,'Status'),Kommentar:gaText_(d.Kommentar,500),GeaendertVon:u.ID,GeaendertAm:gaNow_()};
  gaReplace_('MitgliedChecks',ch.ID,val);gaLog_(u.ID,'STATUS','MitgliedCheck',ch.ID,{von:ch.Status,auf:val.Status});
  const member=gaFind_('Mitglieder',ch.MitgliedID);
  gaRows_('Benutzer').filter(x=>x.Rolle==='Teilnehmer'&&member&&x.Email.toLowerCase()===member.Email.toLowerCase()&&gaBool_(x.Aktiv)).forEach(x=>gaNotify_(x.ID,'Checkliste','Checkliste aktualisiert',item.Titel+': '+val.Status,ch.ID));return {ok:true};}
/** Form data for practical training and subsequent FDISK reporting. */
function gaTrainingDetails_(d){
 const begin=gaDateTime_(d.BeginnIst),end=gaDateTime_(d.EndeIst);
 const minutes=Math.round((Date.parse(end)-Date.parse(begin))/60000);
 if(!Number.isFinite(minutes)||minutes<1||minutes>72*60)throw new Error('Die tatsächliche Ausbildungsdauer muss zwischen 1 Minute und 72 Stunden liegen.');
 if(!Array.isArray(d.Fahrzeuge)||d.Fahrzeuge.length>12)throw new Error('Maximal zwölf Fahrzeuge je Ausbildung erfassen.');
 const names=new Set();
 const fahrzeuge=d.Fahrzeuge.map((raw,index)=>{
  const Fahrzeug=gaNeed_(raw.Fahrzeug,'Fahrzeug '+(index+1),80);
  const val=String(raw.Kilometer??'').trim().replace(',','.');
  if(!/^\d+(?:\.\d{1,2})?$/.test(val))throw new Error('Kilometer für '+Fahrzeug+' als Zahl eingeben (z. B. 12,5).');
  const Kilometer=Number(val);
  if(!Number.isFinite(Kilometer)||Kilometer>9999)throw new Error('Kilometer für '+Fahrzeug+' müssen zwischen 0 und 9999 liegen.');
  const normalized=Fahrzeug.toLocaleLowerCase('de-AT');
  if(names.has(normalized))throw new Error('Fahrzeug '+Fahrzeug+' ist mehrfach erfasst. Bitte die Kilometer zusammenfassen.');
  names.add(normalized);
  return {Fahrzeug,Kilometer};
 });
 return {BeginnIst:begin,EndeIst:end,DauerMinuten:String(minutes),
  FahrzeugeJSON:JSON.stringify(fahrzeuge),Notiz:gaText_(d.Notiz,1500)};
}
function gaTrainingVehicles_(report){
 try{const list=JSON.parse(report?.FahrzeugeJSON||'[]');return Array.isArray(list)?list:[];}
 catch(e){return [];}
}
function gaTrainingHours_(minutes){return (Math.round(Number(minutes)/6)/10).toLocaleString('de-AT',{minimumFractionDigits:1,maximumFractionDigits:1});}
function gaTrainingDate_(stamp){const s=String(stamp||'');return /^\d{4}-\d{2}-\d{2}/.test(s)?s.slice(8,10)+'.'+s.slice(5,7)+'.'+s.slice(0,4)+(s.length>=16?' '+s.slice(11,16):''):s;}

/** Reads only recorded values, keeping planned and actual times distinct. */
function gaTrainingPdfData_(d,u){
 const termId=gaText_(d.TerminID,100),courseId=gaText_(d.KursID,100);
 if(!termId&&!courseId)throw new Error('Bitte einen Ausbildungstermin oder ein Modul auswählen.');
 if(termId&&courseId)throw new Error('Bitte nur einen Berichtstyp auswählen.');
 const allTerms=gaRows_('Termine'),allCourses=gaRows_('Kurse');
 const matching=termId?allTerms.filter(t=>t.ID===termId):allTerms.filter(t=>t.KursID===courseId);
 // Erweiterte Kurse können auch in GAB-Turnussen stattfinden. Ein Organisator
 // darf deren personenbezogene GAB-Daten nicht im Modulgesamtbericht sehen.
 const selected=(gaIsAdvOrg_(u)||u._gaTrainerArea)?matching.filter(t=>{const a=gaFind_('Turnusse',t.TurnusID)?.Bereich;return a===(u._gaTrainerArea||GA_ADV_AREA)||u.Rolle==='Ausbilder'&&gaTrainerMixedAllowed_(u)&&a==='Grundausbildung';}):matching;
 if(!selected.length)throw new Error('Keine berechtigten Termine für diese Auswahl gefunden.');
 const reportRows=gaOptionalRows_('Ausbildungsberichte'),att=gaRows_('Teilnahmen');
 const members=gaRows_('Mitglieder'),accounts=gaRows_('Benutzer');
 const course=allCourses.find(c=>c.ID===(courseId||selected[0].KursID));
 if(!course)throw new Error('Ausbildungsmodul nicht gefunden.');
 const details=[],participants=new Map(),trainers=new Map(),cars=new Map();
 let minutes=0,participantMinutes=0,trainerMinutes=0,kilometers=0,pending=0;
 const nameMember=id=>gaReportParticipantName_(members.find(x=>x.ID===id));
 const nameTrainer=id=>{const m=accounts.find(x=>x.ID===id);return m?m.Name:'[nicht mehr vorhandener Benutzer]';};
 selected.sort((a,b)=>String(a.Beginn).localeCompare(String(b.Beginn))).forEach(t=>{
  const report=reportRows.find(r=>r.TerminID===t.ID);
  if(!report){pending++;return;}
  const duration=Number(report.DauerMinuten)||0;
  if(duration<=0)return;
  const present=att.filter(x=>x.TerminID===t.ID&&x.Anwesend==='JA').map(x=>({id:x.MitgliedID,name:nameMember(x.MitgliedID)}));
  const trainersIds=String(report.AusbilderIDs||'').split(',').map(v=>v.trim()).filter(Boolean);
  const teacherList=trainersIds.map(id=>({id,name:nameTrainer(id)}));
  const vehicleList=gaTrainingVehicles_(report);
  const km=vehicleList.reduce((sum,x)=>sum+Number(x.Kilometer||0),0);
  details.push({term:t,report,minutes:duration,present,teacherList,vehicleList,kilometers:km});
  minutes+=duration;participantMinutes+=duration*present.length;
  trainerMinutes+=duration*teacherList.length;kilometers+=km;
  present.forEach(p=>{const old=participants.get(p.id)||{name:p.name,minutes:0,terminCount:0};old.minutes+=duration;old.terminCount++;participants.set(p.id,old);});
  teacherList.forEach(p=>{const old=trainers.get(p.id)||{name:p.name,minutes:0,terminCount:0};old.minutes+=duration;old.terminCount++;trainers.set(p.id,old);});
  vehicleList.forEach(v=>{
   const key=String(v.Fahrzeug||'').toLocaleLowerCase('de-AT');
   const old=cars.get(key)||{name:v.Fahrzeug,kilometers:0,usages:0};
   old.kilometers+=Number(v.Kilometer||0);old.usages++;cars.set(key,old);
  });
 });
 return {course,details,minutes,participantMinutes,trainerMinutes,kilometers,pending,
  participants:[...participants.values()].sort((a,b)=>a.name.localeCompare(b.name,'de')),
  trainers:[...trainers.values()].sort((a,b)=>a.name.localeCompare(b.name,'de')),
  vehicles:[...cars.values()].sort((a,b)=>a.name.localeCompare(b.name,'de')),
  isSingle:!!termId};
}

/**
 * Einheitliches, druckfreundliches FDISK-Berichtsdesign (A4, Marineblau).
 * Layout-Helfer nutzen ausschließlich den Google-Docs-Dienst von Apps Script.
 */
const GA_PDF={
 navy:'#17374F',blue:'#21678F',ice:'#EAF3F9',pale:'#F5F9FC',
 ink:'#193C56',muted:'#617A90',line:'#DDE8F0',white:'#FFFFFF',
 amber:'#FFF1D8',amberText:'#895816',teal:'#0B775D'
};
function gaPdfText_(paragraph,size,color,bold){
 const text=paragraph.editAsText();
 text.setFontFamily('Arial').setFontSize(size||10)
   .setForegroundColor(color||GA_PDF.ink).setBold(!!bold);
 paragraph.setSpacingAfter(5);
 return paragraph;
}
function gaPdfLine_(body,text,size,color,bold){
 return gaPdfText_(body.appendParagraph(String(text??'')),size,color,bold);
}
function gaPdfSpace_(body,size){body.appendParagraph(' ').setSpacingAfter(size||5);}
function gaPdfCell_(cell,bg,head){
 cell.setBackgroundColor(bg)
  .setPaddingTop(head?9:7).setPaddingBottom(head?9:7)
  .setPaddingLeft(9).setPaddingRight(9);
 const t=cell.editAsText();
 t.setFontFamily('Arial').setFontSize(head?9:9)
   .setForegroundColor(head?GA_PDF.white:GA_PDF.ink).setBold(!!head);
 return cell;
}
function gaPdfStyleTable_(table){
 table.setBorderColor(GA_PDF.line).setBorderWidth(0.5);
 for(let r=0;r<table.getNumRows();r++){
  for(let c=0;c<table.getRow(r).getNumCells();c++){
   gaPdfCell_(table.getCell(r,c),r===0?GA_PDF.navy:r%2?GA_PDF.white:GA_PDF.pale,r===0);
  }
 }
 return table;
}
function gaTrainingPdfTable_(body,headers,rows){
 const entries=(rows&&rows.length)?rows:[headers.map((_,i)=>i?'—':'Keine Einträge vorhanden')];
 const table=body.appendTable([headers,...entries].map(row=>row.map(x=>String(x??''))));
 gaPdfStyleTable_(table);
 return table;
}
function gaPdfStart_(doc,type,title,subtitle,metadata){
 const body=doc.getBody();
 body.setPageWidth(595.28).setPageHeight(841.89);
 body.setMarginTop(38).setMarginBottom(40).setMarginLeft(43).setMarginRight(43);
 const brand=body.appendTable([['FF ST. PÖLTEN-STADT','AUSBILDUNGSVERWALTUNG']]);
 brand.setBorderWidth(0);
 const left=brand.getCell(0,0),right=brand.getCell(0,1);
 [left,right].forEach(x=>x.setBackgroundColor(GA_PDF.navy)
  .setPaddingTop(13).setPaddingBottom(13).setPaddingLeft(12).setPaddingRight(12));
 left.editAsText().setFontFamily('Arial').setFontSize(12).setBold(true).setForegroundColor(GA_PDF.white);
 right.editAsText().setFontFamily('Arial').setFontSize(8).setBold(true).setForegroundColor('#C6E0EF');
 gaPdfSpace_(body,6);
 gaPdfLine_(body,String(type||'FDISK / TÄTIGKEITSBERICHT').toUpperCase(),9,GA_PDF.blue,true).setSpacingBefore(7);
 gaPdfLine_(body,title||'Tätigkeitsbericht',23,GA_PDF.navy,true).setSpacingAfter(2);
 gaPdfLine_(body,subtitle||'',11,GA_PDF.muted,false).setSpacingAfter(14);
 if(metadata&&metadata.length){
  const pairs=[];
  for(let i=0;i<metadata.length;i+=2){
   const a=metadata[i],b=metadata[i+1];
   pairs.push([a[0]+'  '+a[1],b?b[0]+'  '+b[1]:'']);
  }
  const table=body.appendTable(pairs);
  table.setBorderColor(GA_PDF.line).setBorderWidth(0.5);
  for(let r=0;r<table.getNumRows();r++){
   for(let c=0;c<2;c++){
    const cell=table.getCell(r,c);
    gaPdfCell_(cell,r%2===0?GA_PDF.ice:GA_PDF.pale,false);
    cell.editAsText().setFontSize(9);
   }
  }
  gaPdfSpace_(body,9);
 }
 return body;
}
function gaPdfStats_(body,stats){
 const groups=[];
 for(let i=0;i<stats.length;i+=2){
  const a=stats[i],b=stats[i+1]||['',''];
  groups.push([String(a[0])+'\n'+String(a[1]),String(b[0])+'\n'+String(b[1])]);
 }
 const table=body.appendTable(groups);
 table.setBorderWidth(0);
 for(let r=0;r<groups.length;r++){
  for(let c=0;c<2;c++){
   const cell=table.getCell(r,c),value=String(groups[r][c]).split('\n')[0];
   cell.setBackgroundColor(GA_PDF.ice).setPaddingTop(11).setPaddingBottom(10)
    .setPaddingLeft(14).setPaddingRight(12);
   const text=cell.editAsText();
   text.setFontFamily('Arial').setForegroundColor(GA_PDF.muted).setFontSize(9).setBold(false);
   if(value.length){
    text.setFontSize(0,value.length-1,19);
    text.setForegroundColor(0,value.length-1,GA_PDF.navy);
    text.setBold(0,value.length-1,true);
   }
  }
 }
 gaPdfSpace_(body,8);
 return table;
}
function gaPdfSection_(body,index,title,subtitle){
 const head=body.appendTable([[String(index).padStart(2,'0')+'   '+String(title).toUpperCase()]]);
 head.setBorderWidth(0);
 gaPdfCell_(head.getCell(0,0),GA_PDF.ice,false);
 head.getCell(0,0).editAsText().setForegroundColor(GA_PDF.blue).setFontSize(10).setBold(true);
 if(subtitle)gaPdfLine_(body,subtitle,9,GA_PDF.muted,false).setSpacingBefore(6);
 else gaPdfSpace_(body,3);
}
function gaPdfWarning_(body,message){
 const box=body.appendTable([[String(message)]]);
 box.setBorderWidth(0);
 gaPdfCell_(box.getCell(0,0),GA_PDF.amber,false);
 box.getCell(0,0).editAsText().setForegroundColor(GA_PDF.amberText).setFontSize(9).setBold(true);
 gaPdfSpace_(body,6);
}
function gaPdfFooter_(body,stamp){
 gaPdfSpace_(body,12);
 body.appendHorizontalRule();
 gaPdfLine_(body,'FDISK-BERICHTSDESIGN 2.0  |  Feuerwehr St. Pölten-Stadt',8,GA_PDF.blue,true).setSpacingBefore(7);
 gaPdfLine_(body,'Interner Datenauszug · Nicht automatisch in FDISK übertragen · Vor Übernahme prüfen',8,GA_PDF.muted,false);
 gaPdfLine_(body,'Erstellt am '+gaTrainingDate_(stamp)+'  |  Grundlage: gespeicherte Ist-Zeiten und bestätigte Mitwirkende',8,GA_PDF.muted,false);
}
function gaPdfKm_(n){return Number(n||0).toLocaleString('de-AT',{minimumFractionDigits:1,maximumFractionDigits:2});}


function gaExportTrainingPdf_(u,d){
 gaRequire_(u,['Administrator','Ausbilder',GA_ADV_ROLE]);
 const report=gaTrainingPdfData_(d||{},u);
 const safe=v=>String(v??'').replace(/[\r\n]+/g,' ').slice(0,200);
 const h=gaTrainingHours_,date=gaTrainingDate_,km=gaPdfKm_;
 const filename=('FDISK_Design2_Ausbildung_'+report.course.Titel+
  (report.isSingle?'_'+String(report.details[0]?.term?.Beginn||gaRows_('Termine').find(t=>t.ID===d.TerminID)?.Beginn||'').slice(0,10):'_Gesamt')+'.pdf')
  .replace(/[^\wÄÖÜäöüß.-]+/g,'_').slice(0,135);
 const incomplete=report.pending>0||report.details.length===0;
 let docId=null;
 try{
  const doc=DocumentApp.create('TEMP_FDISK_Ausbildung_'+Utilities.getUuid());
  docId=doc.getId();
  const body=gaPdfStart_(doc,
   report.isSingle?'AUSBILDUNG / TERMINBERICHT':'AUSBILDUNG / MODULBERICHT',
   report.isSingle?'Tätigkeitsbericht':'Modulübersicht',
   report.course.Titel,[
    ['BERICHTSTYP',report.isSingle?'Einzeltermin':'Modulauswertung'],
    ['ERSTELLT',date(gaNow_())],
    ['DOKUMENTIERT',report.details.length+' von '+(report.details.length+report.pending)+' Termin(en)'],
    ['STATUS',incomplete?'UNVOLLSTÄNDIG':'Vollständig dokumentiert']
   ]);
  if(incomplete)gaPdfWarning_(body,
   'VORLÄUFIGER DATENAUSZUG – '+report.pending+' Termin(e) ohne vollständige Ist-Zeiten. Nicht dokumentierte Zeiten/Kilometer sind unbekannt und in den Summen nicht berücksichtigt.');
  gaPdfStats_(body,[
    [h(report.minutes)+' h','AUSBILDUNGSDAUER'],
    [h(report.participantMinutes)+' h','TEILNEHMERSTUNDEN'],
    [h(report.trainerMinutes)+' h','AUSBILDERSTUNDEN'],
    [km(report.kilometers)+' km','FAHRZEUGKILOMETER']
  ]);
  gaPdfSection_(body,1,'Termine im Überblick','Nur dokumentierte Ist-Zeiten zählen in der FDISK-Summe.');
  if(report.details.length){
   gaTrainingPdfTable_(body,['Datum','Ist-Zeit','Dauer','Teiln.','km'],
     report.details.map(x=>[
       date(x.report.BeginnIst).slice(0,10),
       date(x.report.BeginnIst).slice(11)+' – '+date(x.report.EndeIst).slice(11),
       h(x.minutes)+' h',String(x.present.length),km(x.kilometers)
     ]));
  }else{
   gaPdfLine_(body,'Für diese Auswahl sind noch keine abgeschlossenen Tätigkeitsberichte mit Ist-Zeiten vorhanden.',10,GA_PDF.muted,false);
  }
  if(incomplete){
   const done=new Set(report.details.map(x=>x.term.ID));
   const missing=gaRows_('Termine').filter(t=>report.isSingle?t.ID===d.TerminID:t.KursID===d.KursID)
     .filter(t=>!done.has(t.ID));
   if(missing.length){
    gaPdfSpace_(body,8);
    gaPdfLine_(body,'Noch nicht vollständig dokumentierte Termine',10,GA_PDF.amberText,true);
    gaTrainingPdfTable_(body,['Geplanter Beginn','Geplantes Ende','Ort'],missing.map(t=>[
     date(t.Beginn),date(t.Ende),safe(t.Ort||'–')
    ]));
   }
  }
  if(report.details.length){
   gaPdfSpace_(body,7);
   gaPdfSection_(body,2,'Personenstunden für FDISK','Bestätigte Anwesenheiten mit voller dokumentierter Ausbildungsdauer.');
   gaPdfLine_(body,'Teilnehmer',10,GA_PDF.blue,true);
   gaTrainingPdfTable_(body,['Teilnehmer','Termine','Stunden'],
    report.participants.map(x=>[safe(x.name),String(x.terminCount),h(x.minutes)+' h']));
   gaPdfSpace_(body,4);
   gaPdfLine_(body,'Mitwirkende Ausbilder',10,GA_PDF.blue,true);
   gaTrainingPdfTable_(body,['Ausbilder','Termine','Stunden'],
    report.trainers.map(x=>[safe(x.name),String(x.terminCount),h(x.minutes)+' h']));
   gaPdfSpace_(body,7);
   gaPdfSection_(body,3,'Fahrzeuge und Kilometer');
   gaTrainingPdfTable_(body,['Fahrzeug','Verwendungen','Gesamtkilometer'],
    report.vehicles.map(x=>[safe(x.name),String(x.usages),km(x.kilometers)+' km']));
   gaPdfSpace_(body,9);
   gaPdfSection_(body,4,'Details der einzelnen Termine','Einzeln nachvollziehbar für die spätere FDISK-Dokumentation.');
   report.details.forEach((x,i)=>{
    gaPdfLine_(body,(i+1)+'.  '+date(x.report.BeginnIst).slice(0,10)+'  |  '+safe(x.term.Ort||'Ohne Ortsangabe'),
      12,GA_PDF.navy,true).setSpacingBefore(i?14:3);
    gaTrainingPdfTable_(body,['Tatsächlicher Beginn','Tatsächliches Ende','Dauer'],
      [[date(x.report.BeginnIst),date(x.report.EndeIst),h(x.minutes)+' h']]);
    gaPdfLine_(body,'Anwesende Teilnehmer ('+x.present.length+')',9,GA_PDF.blue,true).setSpacingBefore(6);
    gaTrainingPdfTable_(body,['Name','Stunden'],
     x.present.map(p=>[safe(p.name),h(x.minutes)+' h']));
    gaPdfLine_(body,'Mitwirkende Ausbilder ('+x.teacherList.length+')',9,GA_PDF.blue,true).setSpacingBefore(6);
    gaTrainingPdfTable_(body,['Name','Stunden'],
     x.teacherList.map(p=>[safe(p.name),h(x.minutes)+' h']));
    gaPdfLine_(body,'Fahrzeuge ('+x.vehicleList.length+')',9,GA_PDF.blue,true).setSpacingBefore(6);
    gaTrainingPdfTable_(body,['Fahrzeug','Kilometer'],
     x.vehicleList.map(v=>[safe(v.Fahrzeug),km(v.Kilometer)+' km']));
    if(x.report.Notiz){
     gaPdfLine_(body,'Bemerkung',9,GA_PDF.blue,true).setSpacingBefore(6);
     gaPdfLine_(body,String(x.report.Notiz),9,GA_PDF.ink,false);
    }
   });
  }
  gaPdfFooter_(body,gaNow_());
  doc.saveAndClose();
  const bytes=DriveApp.getFileById(docId).getAs(MimeType.PDF).setName(filename).getBytes();
  if(bytes.length>8*1024*1024)throw new Error('PDF zu groß. Bitte einzelne Ausbildungstermine herunterladen.');
  gaLog_(u.ID,'PDF_TAETIGKEITSBERICHT','Kurs',report.course.ID,{Termine:report.details.length,PDF:filename});
  return {ok:true,dateiname:filename,base64:Utilities.base64Encode(bytes),
   pdfDesign:'FDISK-DESIGN-2',backendVersion:GA.VERSION,termine:report.details.length,gesamtKm:report.kilometers,ausbildungsMinuten:report.minutes};
 }finally{
  if(docId)try{DriveApp.getFileById(docId).setTrashed(true);}catch(e){Logger.log('Temporäre PDF-Datei: '+e.message);}
 }
}

/** Eigenständige Feuerwehrtätigkeiten ohne Kurs- und Terminpflicht – unabhängig von GAB. */
function gaSaveFreeActivity_(u,d){
 gaRequire_(u,['Administrator','Ausbilder',GA_ADV_ROLE]);
 if(!gaSheet_().getSheetByName('FreieTaetigkeiten'))
  throw new Error('Die Tabelle FreieTaetigkeiten fehlt. Bitte die neue Code.gs im bestehenden Apps Script aktualisieren und die Tabelle einmalig einrichten.');
 const Titel=gaNeed_(d.Titel,'Tätigkeitsbezeichnung',160);
 const Kategorie=gaChoice_(d.Kategorie,['Ausbildung','Übung','Diensttätigkeit','Sonstige'],'Tätigkeitsart');
 const Ort=gaText_(d.Ort,160),details=gaTrainingDetails_(d);
 const allUsers=gaRows_('Benutzer'),allMembers=gaRows_('Mitglieder');
 const trainers=Array.isArray(d.AusbilderIDs)?[...new Set(d.AusbilderIDs.map(String))]:[];
 if(!trainers.length||trainers.some(id=>!allUsers.some(x=>x.ID===id&&['Ausbilder','Administrator',GA_ADV_ROLE].includes(x.Rolle))))
  throw new Error('Mindestens einen gültigen Ausbilder bzw. Verantwortlichen auswählen.');
 if((u.Rolle==='Ausbilder'||gaIsAdvOrg_(u))&&!trainers.includes(u.ID))
  throw new Error('Der durchführende Ausbilder muss selbst angeführt sein.');
 const participants=Array.isArray(d.TeilnehmerIDs)?[...new Set(d.TeilnehmerIDs.map(String))]:[];
 if(participants.some(id=>!allMembers.some(m=>m.ID===id)))
  throw new Error('Ein Teilnehmer ist im Mitgliederverzeichnis nicht vorhanden.');
 const change={Titel,Kategorie,Ort,...details,Bereich:gaIsAdvOrg_(u)?GA_ADV_AREA:gaText_(d.Bereich,100),AusbilderIDs:trainers.join(','),
  TeilnehmerIDs:participants.join(','),ErfasstVon:u.ID,AktualisiertAm:gaNow_()};
 let id=gaText_(d.ID,100),old=id?gaFind_('FreieTaetigkeiten',id):null;
 if(id&&!old)throw new Error('Die Tätigkeit existiert nicht mehr.');
 if(old){
  if(u.Rolle!=='Administrator'&&old.ErfasstVon!==u.ID)
   throw new Error('Du kannst nur eigene Tätigkeitsberichte ändern.');
  gaReplace_('FreieTaetigkeiten',id,change);
 }else{id=gaId_();gaAppend_('FreieTaetigkeiten',{ID:id,...change});}
 gaLog_(u.ID,old?'FREIE_TAETIGKEIT_AKTUALISIEREN':'FREIE_TAETIGKEIT_ERFASSEN','FreieTaetigkeiten',id,
  {Kategorie,DauerMinuten:details.DauerMinuten,Teilnehmer:participants.length,Ausbilder:trainers.length,
   FahrzeugeJSON:details.FahrzeugeJSON});
 return {ok:true,ID:id,message:'Tätigkeit mit Personalstunden und Fahrzeugkilometern gespeichert.'+gaQueueReportMail_('freieTaetigkeit',id,!old||!(Number(old.DauerMinuten)>0))};
}

function gaExportFreeActivityPdf_(u,d){
 gaRequire_(u,['Administrator','Ausbilder',GA_ADV_ROLE]);
 const entry=gaFind_('FreieTaetigkeiten',gaText_(d?.ID,100));
 if(!entry)throw new Error('Tätigkeitsbericht nicht gefunden.');
 const memberRows=gaRows_('Mitglieder'),userRows=gaRows_('Benutzer');
 const members=String(entry.TeilnehmerIDs||'').split(',').filter(Boolean)
  .map(id=>memberRows.find(m=>m.ID===id)).map(gaReportParticipantName_);
 const trainers=String(entry.AusbilderIDs||'').split(',').filter(Boolean)
  .map(id=>userRows.find(x=>x.ID===id)).map(x=>x?x.Name:'[Benutzer nicht gefunden]');
 const vehicles=gaTrainingVehicles_(entry),mins=Number(entry.DauerMinuten)||0;
 const hours=gaTrainingHours_,date=gaTrainingDate_,km=gaPdfKm_;
 const totalKm=vehicles.reduce((n,v)=>n+Number(v.Kilometer||0),0);
 const filename=('FDISK_Design2_Taetigkeit_'+String(entry.Titel||'')+'_'+String(entry.BeginnIst).slice(0,10)+'.pdf')
  .replace(/[^\wÄÖÜäöüß.-]+/g,'_').slice(0,140);
 let docId=null;
 try{
  const doc=DocumentApp.create('TEMP_FDISK_Taetigkeit_'+Utilities.getUuid());
  docId=doc.getId();
  const body=gaPdfStart_(doc,'DIENSTTÄTIGKEIT / FDISK-AUSZUG','Tätigkeitsbericht',
   String(entry.Titel||''),[
    ['KATEGORIE',String(entry.Kategorie||'Sonstige')],
    ['ORT',String(entry.Ort||'–')],
    ['DATUM',date(entry.BeginnIst).slice(0,10)],
    ['ERSTELLT',date(gaNow_())]
   ]);
  gaPdfStats_(body,[
    [hours(mins)+' h','TÄTIGKEITSDAUER'],
    [hours(mins*members.length)+' h','MITGLIEDERSTUNDEN'],
    [hours(mins*trainers.length)+' h','VERANTWORTLICHENSTUNDEN'],
    [km(totalKm)+' km','FAHRZEUGKILOMETER']
  ]);
  gaPdfSection_(body,1,'Zeit und Tätigkeit');
  gaTrainingPdfTable_(body,['Tatsächlicher Beginn','Tatsächliches Ende','Dauer'],
   [[date(entry.BeginnIst),date(entry.EndeIst),hours(mins)+' h']]);
  if(entry.Notiz){
   gaPdfLine_(body,'Beschreibung / Bemerkungen',10,GA_PDF.blue,true).setSpacingBefore(9);
   gaPdfLine_(body,String(entry.Notiz),9,GA_PDF.ink,false).setSpacingAfter(9);
  }
  gaPdfSection_(body,2,'Beteiligte Mitglieder','Mitgliederstunden bei Anwesenheit über die gesamte Dauer.');
  gaTrainingPdfTable_(body,['Mitglied','Anrechenbare Stunden'],members.map(n=>[n,hours(mins)+' h']));
  gaPdfSpace_(body,8);
  gaPdfSection_(body,3,'Mitwirkende Ausbilder und Verantwortliche');
  gaTrainingPdfTable_(body,['Name','Anrechenbare Stunden'],trainers.map(n=>[n,hours(mins)+' h']));
  gaPdfSpace_(body,8);
  gaPdfSection_(body,4,'Eingesetzte Fahrzeuge');
  gaTrainingPdfTable_(body,['Fahrzeug','Kilometer'],vehicles.map(v=>[String(v.Fahrzeug),km(v.Kilometer)+' km']));
  gaPdfFooter_(body,gaNow_());
  doc.saveAndClose();
  const bytes=DriveApp.getFileById(docId).getAs(MimeType.PDF).setName(filename).getBytes();
  if(bytes.length>8*1024*1024)throw new Error('Das PDF ist zu groß. Bitte Bericht einzeln herunterladen.');
  gaLog_(u.ID,'PDF_FREIE_TAETIGKEIT','FreieTaetigkeiten',entry.ID,{Datei:filename});
  return {ok:true,dateiname:filename,base64:Utilities.base64Encode(bytes),pdfDesign:'FDISK-DESIGN-2',backendVersion:GA.VERSION};
 }finally{
  if(docId)try{DriveApp.getFileById(docId).setTrashed(true);}catch(e){Logger.log('Temporäre PDF-Datei: '+e.message);}
 }
}


function gaSaveAttendance_(u,d){gaRequire_(u,['Administrator','Ausbilder',GA_ADV_ROLE]);const term=gaFind_('Termine',d.TerminID);if(!term)throw new Error('Termin nicht gefunden.');
  if(!gaSheet_().getSheetByName('Ausbildungsberichte'))throw new Error('Tabelle Ausbildungsberichte fehlt. Im Google Sheet Grundausbildung → 7 · Tätigkeitsberichte einrichten ausführen.');
  const details=gaTrainingDetails_(d);
  const turnus=gaFind_('Turnusse',term.TurnusID);
  const allMembers=gaRows_('Mitglieder');
  // Auch GAB-Gäste gehören bei Administrator und Ausbilder zur erweiterten Anwesenheitsliste.
  const members=turnus?.Bereich===GA_ADV_AREA?gaAdvAllowedMembers_(term.TurnusID):
   allMembers.filter(m=>m.TurnusID===term.TurnusID&&gaBool_(m.Aktiv));
  if(!Array.isArray(d.Anwesend)||d.Anwesend.length!==members.length)throw new Error('Die Anwesenheitsliste ist unvollständig.');
  const answers=new Map(d.Anwesend.map(x=>[String(x.MitgliedID),x.Anwesend===true]));
  if(members.some(m=>!answers.has(m.ID)))throw new Error('Anwesenheit für jedes Mitglied erforderlich.');
  const trainerIds=Array.isArray(d.AusbilderIDs)?d.AusbilderIDs:[];
  const qualified=gaRows_('Benutzer').filter(x=>['Ausbilder','Administrator',GA_ADV_ROLE].includes(x.Rolle)).map(x=>x.ID);
  if(!trainerIds.length||trainerIds.some(id=>!qualified.includes(id)))throw new Error('Mindestens einen gültigen Ausbilder auswählen.');
  if((u.Rolle==='Ausbilder'||gaIsAdvOrg_(u))&&!trainerIds.includes(u.ID))throw new Error('Der bestätigende Ausbilder muss selbst angeführt sein.');
  // Vor dem Aktualisieren als Momentaufnahme sichern, sonst erkennt firstTime keine neuen Abschlüsse.
  const previous=gaRows_('Teilnahmen').map(a=>({...a}));
  const saved=gaOptionalRows_('Ausbildungsberichte').find(r=>r.TerminID===term.ID);
  const report={...details,AusbilderIDs:trainerIds.join(','),ErfasstVon:u.ID,AktualisiertAm:gaNow_()};
  if(saved)gaReplace_('Ausbildungsberichte',saved.ID,report);
  else gaAppend_('Ausbildungsberichte',{ID:gaId_(),TerminID:term.ID,...report});
  members.forEach(m=>{
    const existing=previous.find(x=>x.TerminID===term.ID&&x.MitgliedID===m.ID);
    const entry={Anwesend:answers.get(m.ID)?'JA':'NEIN',AusbilderIDs:trainerIds.join(','),BestaetigtVon:u.ID,BestaetigtAm:gaNow_()};
    if(existing)gaReplace_('Teilnahmen',existing.ID,entry);else gaAppend_('Teilnahmen',Object.assign({ID:gaId_(),TerminID:term.ID,MitgliedID:m.ID},entry));
  });gaReplace_('Termine',term.ID,{Status:'Durchgeführt'});
  gaLog_(u.ID,'BESTAETIGEN','Termin',term.ID,{AusbilderIDs:trainerIds,Anwesend:members.filter(m=>answers.get(m.ID)).length,Total:members.length,DauerMinuten:details.DauerMinuten,FahrzeugeJSON:details.FahrzeugeJSON});
  const course=gaFind_('Kurse',term.KursID);
  const completed=gaOptionalRows_('Bewertungen');
  const users=gaRows_('Benutzer').filter(x=>x.Rolle==='Teilnehmer'&&gaBool_(x.Aktiv));
  const accountFor=m=>{
   const email=String(m.Email||'').trim().toLowerCase();
   const matches=email?users.filter(x=>String(x.Email||'').trim().toLowerCase()===email):[];
   return matches.length===1&&gaOwnMember_(matches[0],allMembers)?.ID===m.ID?matches[0]:null;
  };
  const firstTime=members.filter(m=>answers.get(m.ID)&&!previous.some(t=>
    t.TerminID===term.ID&&t.MitgliedID===m.ID&&gaBool_(t.Anwesend)));
  const known=gaRows_('Benachrichtigungen');
  let noticeFailures=0;
  const addNotice=(user,type,title,text,ref)=>{
   try{gaNotify_(user,type,title,text,ref);known.push({BenutzerID:user,BezugID:ref,Titel:title});return true;}
   catch(e){noticeFailures++;console.warn('Kursbenachrichtigung konnte nicht erstellt werden:',String(e));return false;}
  };
  firstTime.filter(m=>!completed.some(b=>b.TerminID===term.ID&&b.MitgliedID===m.ID)).forEach(m=>{
    const user=accountFor(m);
    if(user&&!known.some(n=>n.BenutzerID===user.ID&&n.BezugID===term.ID&&n.Titel==='Bewerte deinen letzten Kurs')){
     addNotice(user.ID,'Bewertung','Bewerte deinen letzten Kurs',
      'Du hast an „'+(course?course.Titel:'Ausbildung')+'“ teilgenommen. Du kannst den Kurs jetzt in der App bewerten.',term.ID);
    }
  });
  if(course?.Bereich===GA_ADV_AREA&&firstTime.length)gaRows_('Benutzer').filter(x=>gaBool_(x.Aktiv)&&x.Rolle===GA_ADV_ROLE).forEach(x=>{
   if(known.some(n=>n.BenutzerID===x.ID&&n.BezugID===term.ID&&['Ausbildung abgeschlossen','Kursteilnahmen bestätigt'].includes(n.Titel)))return;
   addNotice(x.ID,'Aufgabe','Kursteilnahmen bestätigt',course.Titel,term.ID);
  });
  const quiz=gaOptionalRows_('QuizKurse').find(q=>q.KursID===term.KursID&&gaBool_(q.Aktiv));
  const quizContext=quiz&&course?gaQuizNoticeContext_():null;
  firstTime.forEach(m=>{
   const account=accountFor(m);if(!account)return;
   // Bereits verschickte Teilnahmemeldungen bleiben auch bei späteren Korrekturen einmalig.
   if(known.some(n=>n.BenutzerID===account.ID&&n.BezugID===term.ID&&['Kurs abgeschlossen','Kursteilnahme bestätigt'].includes(n.Titel)))return;
   const decision=quizContext&&gaBool_(quiz.Pflicht)?gaValidityForTerm_(course,term,quizContext.meta,quizContext.turns,'quiz'):'exempt';
   const passed=quizContext&&quizContext.attempts.some(a=>a.MitgliedID===m.ID&&a.KursID===term.KursID&&gaBool_(a.Bestanden));
   const waiting=quizContext&&gaBool_(quiz.Pflicht)&&!passed&&decision!=='exempt';
   const title=waiting?'Kursteilnahme bestätigt':'Kurs abgeschlossen';
   const text=waiting?'Deine Teilnahme an „'+(course?.Titel||'Ausbildung')+'“ wurde bestätigt. '+
     (decision==='applies'?'Für den Kursabschluss ist noch das Pflichtquiz zu absolvieren.':'Die Quizpflicht wird noch geprüft.'):
     'Dein Kurs „'+(course?.Titel||'Ausbildung')+'“ wurde abgeschlossen.';
   addNotice(account.ID,'Aufgabe',title,text,term.ID);
  });
  // Both GAB and advanced course participants receive the correct quiz type.
  if(quiz&&course){
   firstTime.forEach(m=>{
    const account=accountFor(m);
    if(account)try{gaNotifyQuizAvailable_(account,course,quiz,known,quizContext);}
     catch(e){noticeFailures++;console.warn('Quizbenachrichtigung konnte nicht erstellt werden:',String(e));}
   });
  }
  try{gaPushQueue_(5);}catch(e){console.warn('Kurs-Push wartet:',String(e));}
  return {ok:true,message:'Anwesenheit bestätigt.'+gaQueueReportMail_('ausbildungsbericht',term.ID,!saved||!(Number(saved.DauerMinuten)>0))+(noticeFailures?' '+noticeFailures+' Benachrichtigung(en) konnten nicht erstellt werden. Bitte die betroffenen Personen informieren.':'')};
}
function gaSaveUser_(u,d){gaRequire_(u,['Administrator']);const name=gaNeed_(d.Name,'Name',140),email=gaText_(d.Email,240).toLowerCase(),pwd=String(d.Passwort||'');
  if(!gaEmail_(email)||pwd.length<12)throw new Error('Gültige E-Mail und Passwort mit mindestens 12 Zeichen erforderlich.');
  if(gaRows_('Benutzer').some(x=>x.Email.toLowerCase()===email))throw new Error('Benutzer existiert bereits.');
  const role=gaChoice_(d.Rolle,GA.ROLES,'Rolle'),bereich=role==='Fachverwaltung'?gaNeed_(d.Bereich,'Zuständigkeit',100):gaText_(d.Bereich,100);
  const salt=gaId_()+gaId_();const val={ID:gaId_(),Name:name,Email:email,Rolle:role,Bereich:bereich,Aktiv:'JA',Salt:salt,Hash:gaHash_(pwd,salt),ErstelltAm:gaNow_()};
  gaAppend_('Benutzer',val);gaLog_(u.ID,'ANLEGEN','Benutzer',val.ID,{Email:email,Rolle:role});return {ok:true};}
function gaSendMessage_(u,d){
  gaRequire_(u,['Administrator',GA_ADV_ROLE]);
  const title=gaNeed_(d.Titel,'Betreff',160),message=gaNeed_(d.Text,'Nachricht',3000);
  const mode=gaChoice_(d.EmpfaengerArt||(d.TurnusID?'TURNUS':'ALLE'),['ALLE','TURNUS','MITGLIED'],'Empfängerart');
  const members=gaRows_('Mitglieder').filter(m=>gaBool_(m.Aktiv)&&(!gaIsAdvOrg_(u)||gaAdvMemberAllowed_(m)));
  let target='',recipients=[];
  if(mode==='TURNUS'){
    const id=gaNeed_(d.TurnusID,'Turnus',100);
    if(!gaFind_('Turnusse',id))throw new Error('Turnus nicht gefunden.');
    if(gaIsAdvOrg_(u))gaAdvancedTurnus_(u,id);
    target=id;recipients=gaIsAdvOrg_(u)?gaAdvAllowedMembers_(id):members.filter(m=>m.TurnusID===id);
  }else if(mode==='MITGLIED'){
    const id=gaNeed_(d.MitgliedID,'Mitglied',100);
    const member=members.find(m=>m.ID===id);
    if(!member)throw new Error('Mitglied nicht gefunden oder nicht aktiv.');
    target='M:'+id;recipients=[member];
  }else{recipients=members;if(gaIsAdvOrg_(u))target='ADV:ALLE';}
  const emails=new Set(recipients.map(m=>String(m.Email||'').toLowerCase()).filter(Boolean));
  const users=gaRows_('Benutzer').filter(x=>x.Rolle==='Teilnehmer'&&gaBool_(x.Aktiv)&&emails.has(x.Email.toLowerCase()));
  const id=gaId_();
  gaAppend_('Nachrichten',{ID:id,Titel:title,Text:message,TurnusID:target,VonBenutzerID:u.ID,ErstelltAm:gaNow_()});
  users.forEach(x=>gaNotify_(x.ID,'Nachricht',title,message,id));
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
  gaRequire_(actor,['Administrator',GA_ADV_ROLE]);
  if(gaIsAdvOrg_(actor)){
   const m=gaFind_('Mitglieder',d.MitgliedID);
   if(!gaAdvMemberAllowed_(m))throw new Error('Nur zugeordnete Mitglieder einladen.');
   d={...d,Name:m.Vorname+' '+m.Nachname,Email:m.Email,Rolle:'Teilnehmer',Bereich:''};
  }
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

/** Eine Person, ein Zugang: Rollenwechsel statt doppeltem Benutzer. */
function gaChangeUserRole_(actor,d){
 gaRequire_(actor,['Administrator']);
 const id=gaNeed_(d.BenutzerID,'Benutzer-ID',100);
 const user=gaFind_('Benutzer',id);
 if(!user)throw new Error('Benutzer nicht gefunden.');
 const next=gaChoice_(gaNeed_(d.Rolle,'Rolle',50),GA.ROLES,'Rolle');
 const area=next==='Fachverwaltung'?
  gaChoice_(gaNeed_(d.Bereich,'Fachbereich',100),['Zeugkammer','Administration','IT','Ausbildungsleitung'],'Fachbereich'):'';
 if(user.ID===actor.ID&&next!=='Administrator')
  throw new Error('Den eigenen Administratorzugang kannst du nicht selbst herabstufen.');
 if(user.Rolle==='Administrator'&&next!=='Administrator'){
  const otherAdmins=gaRows_('Benutzer').filter(x=>x.ID!==id&&x.Rolle==='Administrator'&&gaBool_(x.Aktiv));
  if(!otherAdmins.length)throw new Error('Mindestens ein aktiver Administrator muss erhalten bleiben.');
 }
 if(next==='Teilnehmer'&&!gaRows_('Mitglieder').some(m=>gaBool_(m.Aktiv)&&
  String(m.Email||'').toLowerCase()===String(user.Email||'').toLowerCase()))
   throw new Error('Für eine reine Teilnehmerrolle muss ein aktives Mitglied mit derselben E-Mail existieren.');
 const unchanged=next===user.Rolle&&area===String(user.Bereich||'');
 if(unchanged)return {ok:true,message:'Rolle und Fachbereich sind bereits so eingestellt.'};
 const previous={Rolle:user.Rolle,Bereich:user.Bereich};
 gaReplace_('Benutzer',id,{Rolle:next,Bereich:area});
 // Beim erneuten Einstieg in die Ausbilderrolle keine früheren Berechtigungen ungefragt reaktivieren.
 if(next==='Ausbilder'&&previous.Rolle!=='Ausbilder'){
  const prior=gaOptionalRows_('Berechtigungen').find(x=>x.BenutzerID===id);
  if(prior){
   const reset={AktualisiertAm:gaNow_()};
   GA_RIGHTS.forEach(k=>reset[k]='NEIN');
   gaReplace_('Berechtigungen',prior.ID,reset);
  }
 }
 // Frühere Kursteilnahmen hängen an der Mitglieds-ID, nicht an der Benutzerrolle.
 // Die Passwort-/Login-Daten und das Mitgliederkonto bleiben deshalb unverändert.
 gaLog_(actor.ID,'ROLLENWECHSEL','Benutzer',id,{Vorher:previous,Nachher:{Rolle:next,Bereich:area}});
 return {ok:true,message:'Rolle aktualisiert. Bestehender Login, Kursabschlüsse und Nachweise bleiben erhalten.'};
}

function gaResetPassword_(actor,d){
  gaRequire_(actor,['Administrator']);
  const id=gaNeed_(d.BenutzerID,'Benutzer-ID',100);
  const user=gaFind_('Benutzer',id);
  if(!user||!gaBool_(user.Aktiv)||!gaEmail_(user.Email))
    throw new Error('Für diesen Benutzer gibt es keinen aktiven Zugang.');
  const token=gaId_().replace(/-/g,'')+gaId_().replace(/-/g,'');
  const link=gaInviteLink_(token);
  const invite={ID:gaId_(),BenutzerID:user.ID,Email:user.Email,TokenHash:gaInviteDigest_(token),
    ExpiresAt:String(Date.now()+30*60*1000),UsedAt:'',Status:'Passwortreset',
    ErstelltVon:actor.ID,ErstelltAm:gaNow_()};
  gaRows_('Einladungen')
    .filter(x=>x.BenutzerID===user.ID&&x.Status==='Passwortreset')
    .forEach(x=>gaReplace_('Einladungen',x.ID,{Status:'Ersetzt'}));
  gaAppend_('Einladungen',invite);
  try{
    MailApp.sendEmail({
      to:user.Email,
      subject:'Feuerwehr St. Pölten – Passwort der Ausbildungsplattform zurücksetzen',
      body:'Hallo '+user.Name+',\n\nfür deinen Zugang zur Ausbildungsplattform wurde eine Passwort-Zurücksetzung angefordert.\n'+
        'Über diesen persönlichen Link kannst du selbst ein neues Passwort festlegen:\n\n'+link+
        '\n\nDer Link ist nur einmal verwendbar und 30 Minuten gültig.\n'+
        'Falls du keine Zurücksetzung angefordert hast, informiere bitte die Ausbildungsadministration.\n\nFeuerwehr St. Pölten – Ausbildung'
    });
  }catch(err){
    gaReplace_('Einladungen',invite.ID,{Status:'Versandfehler'});
    gaLog_(actor.ID,'PASSWORTRESET_VERSANDFEHLER','Benutzer',user.ID,{});
    throw new Error('Der Reset-Link konnte nicht per E-Mail zugestellt werden. Mail-Berechtigung oder Kontingent prüfen.');
  }
  gaLog_(actor.ID,'PASSWORTRESET_ANGEFORDERT','Benutzer',user.ID,{});
  return {ok:true,message:'Passwort-Zurücksetzungslink wurde an die hinterlegte E-Mail-Adresse gesendet (30 Minuten gültig).'};
}

/** Öffentlich startbarer Passwortreset. Keine Benutzerexistenz preisgeben. */
function gaRequestPasswordReset(email){
 const e=gaText_(email,240).toLowerCase();
 const neutral={ok:true,message:'Falls ein aktiver Zugang besteht, erhältst du eine E-Mail mit einem Reset-Link (30 Minuten gültig).'};
 if(!gaEmail_(e))return neutral;
 const key='pwdreset_'+Utilities.base64EncodeWebSafe(
  Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,e)).slice(0,42);
 const cache=CacheService.getScriptCache();
 if(cache.get(key))return neutral;
 cache.put(key,'1',3600);
 const user=gaRows_('Benutzer').find(x=>gaBool_(x.Aktiv)&&x.Email.toLowerCase()===e);
 if(!user)return neutral;
 const token=gaId_().replace(/-/g,'')+gaId_().replace(/-/g,'');
 const invite={ID:gaId_(),BenutzerID:user.ID,Email:user.Email,TokenHash:gaInviteDigest_(token),
  ExpiresAt:String(Date.now()+30*60000),UsedAt:'',Status:'Passwortreset',ErstelltVon:'SELF',ErstelltAm:gaNow_()};
 gaRows_('Einladungen').filter(i=>i.BenutzerID===user.ID&&i.Status==='Passwortreset')
  .forEach(i=>gaReplace_('Einladungen',i.ID,{Status:'Ersetzt'}));
 gaAppend_('Einladungen',invite);
 try{
  MailApp.sendEmail({to:user.Email,subject:'Feuerwehr St. Pölten – Passwort zurücksetzen',
   body:'Hallo '+user.Name+',\n\nfür deinen Zugang wurde eine Passwort-Zurücksetzung angefordert.'+
    '\n\nNeues Passwort über diesen persönlichen Link festlegen:\n'+gaInviteLink_(token)+
    '\n\nDer Link ist einmalig gültig und läuft nach 30 Minuten ab.'+
    '\nWenn du das nicht selbst angefordert hast, ignoriere diese Nachricht und informiere bei Bedarf den Administrator.'+
    '\n\nFeuerwehr St. Pölten – Ausbildung'});
  gaLog_(user.ID,'PASSWORTRESET_SELF_SERVICE','Benutzer',user.ID,{});
 }catch(error){
  gaReplace_('Einladungen',invite.ID,{Status:'Versandfehler'});
  gaLog_('SYSTEM','PASSWORTRESET_VERSANDFEHLER','Benutzer',user.ID,{});
 }
 return neutral;
}

function gaInviteCheck_(token){
  token=String(token||'');
  if(!/^[a-fA-F0-9]{64}$/.test(token))throw new Error('Ungültiger Einladungslink.');
  const digest=gaInviteDigest_(token);
  const item=gaRows_('Einladungen').find(i=>gaSame_(i.TokenHash,digest));
  if(!item||!['Offen','Passwortreset'].includes(item.Status)||Number(item.ExpiresAt)<Date.now())
    throw new Error('Dieser Einladungs- oder Reset-Link ist ungültig, abgelaufen oder bereits verwendet. Bitte einen neuen anfordern.');
  const user=gaFind_('Benutzer',item.BenutzerID);
  if(!user||(item.Status==='Offen'&&gaBool_(user.Aktiv))||
     (item.Status==='Passwortreset'&&!gaBool_(user.Aktiv)))
    throw new Error('Dieser Link ist für den aktuellen Zugangsstatus nicht gültig.');
  return {Name:user.Name,Email:user.Email,Rolle:user.Rolle,Bereich:user.Bereich,Zuruecksetzen:item.Status==='Passwortreset'};
}
function gaCheckInvite(token){return gaInviteCheck_(token);}
function gaAcceptInvite(token,password){
  return gaLock_(()=>{
    const info=gaInviteCheck_(token);
    password=String(password||'');
    if(password.length<12||password.length>256)
      throw new Error('Das Passwort muss 12 bis 256 Zeichen lang sein.');
    const digest=gaInviteDigest_(token);
    const item=gaRows_('Einladungen').find(i=>gaSame_(i.TokenHash,digest)&&
      ['Offen','Passwortreset'].includes(i.Status));
    const user=gaFind_('Benutzer',item.BenutzerID);
    if(user.Email!==info.Email)throw new Error('Einladung konnte nicht zugeordnet werden.');
    const isReset=item.Status==='Passwortreset';
    const salt=gaId_()+gaId_();
    gaReplace_('Benutzer',user.ID,{Salt:salt,Hash:gaHash_(password,salt),Aktiv:'JA'});
    gaReplace_('Einladungen',item.ID,{Status:'Verwendet',UsedAt:gaNow_()});
    gaLog_(user.ID,isReset?'PASSWORTRESET_ABGESCHLOSSEN':'EINLADUNG_ANGENOMMEN','Benutzer',user.ID,{});
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
      case 'gaLogin':result=gaLogin(args[0],args[1],args[2]);break;
      case 'gaRequestPasswordReset':result=gaRequestPasswordReset(args[0]);break;
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
  const devices=gaOptionalRows_('PushGeraete').filter(x=>x.BenutzerID===user.ID&&gaBool_(x.Aktiv));
  if(!devices.length)throw new Error('Noch kein Push-Gerät registriert. Zuerst unter Benachrichtigungen auf „Push aktivieren“ tippen.');
  if(!gaPushRule_(user.ID).Nachrichten)throw new Error('Die Push-Art „Nachrichten“ ist für deinen Benutzer deaktiviert. Bitte unter Push-Steuerung freigeben.');
  // Nur die neu erzeugte Testnachricht senden, nicht alte Warteschlangen-Einträge.
  const id=gaNotify_(user.ID,'Nachricht','Grundausbildung – Test-Benachrichtigung',
    'Dies ist eine echte Testnachricht der Grundausbildungsplattform. Öffne sie, um den vollständigen Text in der App zu lesen.','');
  gaPushQueue_(1,id);
  const item=gaFind_('Benachrichtigungen',id);
  const status=String(item&&item.PushStatus||'Unbekannt');
  const accepted=/^Gesendet [(][0-9]+[)]$/.test(status);
  return {ok:accepted,pushStatus:status,
    message:accepted?'✅ Test-Push vom Push-Dienst angenommen ('+status+'). Bitte nun am Handy auf die Mitteilung tippen.':
      '❌ Test-Push nicht erfolgreich: '+status+'. Prüfe Geräteanmeldung und Push-Steuerung. Die Testnachricht bleibt in der App sichtbar.'};
}
function gaPushQueue_(limit,onlyNotificationId){
  const key=PropertiesService.getScriptProperties().getProperty('GA_WORKER_SECRET');
  if(!key||key.length<48)return 'Push-Server nicht eingerichtet.';
  const url='https://grundausbildung.michael-mejtsky.workers.dev/internal/push';
  const devices=gaOptionalRows_('PushGeraete').filter(x=>gaBool_(x.Aktiv));
  const pending=gaRows_('Benachrichtigungen').filter(n=>
    n.PushStatus==='Wartend'&&(!onlyNotificationId||n.ID===onlyNotificationId))
    .slice(0,Math.max(1,Math.min(10,limit||5)));
  let quizContext=null,quizUsers=[],gabContext=null;
  if(pending.some(n=>String(n.BezugID||'').startsWith('QUIZREADY:'))){
    try{quizContext=gaQuizNoticeContext_();quizUsers=gaRows_('Benutzer');}
    catch(error){console.warn('Quiz-Push wartet auf erneute Gültigkeitsprüfung:',String(error));}
  }
  for(const n of pending){
    const ref=String(n.BezugID||'');
    let pushTitle=n.Titel,pushText=n.Text;
    if(ref.startsWith('QUIZREADY:')){
      if(!quizContext)continue;
      const parts=ref.split(':'),course=quizContext.courses.find(c=>c.ID===parts[1]);
      const quiz=quizContext.quizzes.find(c=>c.KursID===parts[1]);
      const user=quizUsers.find(x=>x.ID===n.BenutzerID&&gaBool_(x.Aktiv));
      if(parts.length!==4||!quiz||String(quiz.Version)!==parts[2]||
         (gaBool_(quiz.Pflicht)?'P':'F')!==parts[3]||!gaQuizNoticeEligible_(user,course,quiz,quizContext)){
        gaReplace_('Benachrichtigungen',n.ID,{PushStatus:'Nicht mehr erforderlich'});
        continue;
      }
    }
    // Bei verzögertem Push den aktuellen GAB- und BSW-Stand erneut berücksichtigen.
    if(ref.startsWith('GABCOMPLETE:')){
      try{
        if(!gabContext)gabContext=gaGabNoticeContext_();
        const member=gabContext.members.find(m=>m.ID===ref.slice('GABCOMPLETE:'.length));
        const current=member?gaGabNoticeCandidate_(member,{...gabContext,notices:[]}):null;
        if(!current||current.Status!=='Bereit'||current.BenutzerID!==n.BenutzerID){
          gaReplace_('Benachrichtigungen',n.ID,{PushStatus:'Nicht mehr erforderlich'});continue;
        }
        pushTitle=gaGabNoticeTitle_(current);pushText=current.Text;
      }catch(error){console.warn('GAB-Abschluss-Push wartet auf erneute Prüfung:',String(error));continue;}
    }
    const allowed=gaPushRule_(n.BenutzerID)[n.Typ==='Nachricht'?'Nachrichten':n.Typ==='Termin'?'Termine':n.Typ==='Bewertung'?'Bewertungen':'Aufgaben'];
    const selected=devices.filter(x=>x.BenutzerID===n.BenutzerID);
    if(!allowed||!selected.length){
      gaReplace_('Benachrichtigungen',n.ID,{PushStatus:allowed?'Kein Gerät registriert':'Vom Administrator deaktiviert'});
      continue;
    }
    const data={devices:selected.slice(0,6).map(d=>({id:d.ID,subscription:{endpoint:d.Endpoint,p256dh:d.P256DH,auth:d.Auth}})),
      notification:{title:gaText_(pushTitle,90),body:gaText_(pushText,180),id:n.ID,url:'/grundausbildung/',kind:n.Typ}};
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
        const failed=(result.results||[]).filter(x=>!x.ok);
        const reason=failed.length?' (HTTP '+failed.map(x=>Number(x.status)||0).join(',').slice(0,65)+')':'';
        gaReplace_('Benachrichtigungen',n.ID,{PushStatus:good?'Gesendet ('+good+')':'Nicht zugestellt'+reason});
      }else{
        gaReplace_('Benachrichtigungen',n.ID,{PushStatus:'Fehlgeschlagen; Worker HTTP '+res.getResponseCode()});
      }
    }catch(err){
      gaReplace_('Benachrichtigungen',n.ID,{PushStatus:'Fehlgeschlagen; Verbindung prüfen'});
    }
  }
  return pending.length+' Nachricht(en) bearbeitet.';
}
function gaPushJob_(){gaLock_(()=>{gaQueueCourseReminders_();gaPushQueue_(8);});}
function gaPushEinrichten(){
  gaEinrichten();
  const current=ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()==='gaPushJob_');
  if(!current.length)ScriptApp.newTrigger('gaPushJob_').timeBased().everyMinutes(5).create();
  SpreadsheetApp.getUi().alert('Push-Speicher eingerichtet. Alle 5 Minuten: Kurserinnerungen und wartende Push-Mitteilungen prüfen.');
}


/** Rollenrechte (nur Admin vergibt Rechte; beim Trainer grundsätzlich alles AUS). */
const GA_RIGHTS=['KurseGestalten','KurseFreigeben','TerminePlanen','MeldungenBearbeiten','BewertungenAnsehen','KurseBearbeiten','FrageboegenBearbeiten'];
function gaPermissions_(user,rightsRows){
 if(user.Rolle==='Administrator')return Object.fromEntries(GA_RIGHTS.map(k=>[k,true]));
 if(gaIsAdvOrg_(user))return Object.fromEntries(GA_RIGHTS.map(k=>[k,['KurseGestalten','KurseFreigeben','KurseBearbeiten','TerminePlanen','FrageboegenBearbeiten','BewertungenAnsehen','MeldungenBearbeiten'].includes(k)]));
 if(user.Rolle!=='Ausbilder')return Object.fromEntries(GA_RIGHTS.map(k=>[k,false]));
 const own=(rightsRows||gaOptionalRows_('Berechtigungen')).find(x=>x.BenutzerID===user.ID);
 return Object.fromEntries(GA_RIGHTS.map(k=>[k,!!own&&gaBool_(own[k])]));
}
function gaCan_(user,right){return !!gaPermissions_(user)[right];}
function gaRequireRight_(user,right){if(!gaCan_(user,right))throw new Error('Für diese Funktion fehlt die Berechtigung: '+right+'.');}
function gaSetPermission_(actor,d){
 gaRequire_(actor,['Administrator']);
 const user=gaRows_('Benutzer').find(x=>x.ID===gaText_(d.BenutzerID,100)&&x.Rolle==='Ausbilder');
 if(!user)throw new Error('Bitte einen Benutzer mit der Rolle Ausbilder wählen.');
 // Rechte für noch nicht aktivierte Einladungen dürfen vorbereitet werden;
 // die Anmeldung und damit die Ausübung dieser Rechte bleiben bis zur Aktivierung gesperrt.
 const hasAreas=Object.prototype.hasOwnProperty.call(d,'Ausbildungsbereiche');
 if(hasAreas&&(!Array.isArray(d.Ausbildungsbereiche)||!d.Ausbildungsbereiche.length||d.Ausbildungsbereiche.some(a=>!GA.AREAS.includes(a))))
  throw new Error('Bitte mindestens einen gültigen Ausbildungsbereich auswählen.');
 const areas=hasAreas?[...new Set(d.Ausbildungsbereiche)]:null;
 const props=PropertiesService.getScriptProperties(),key=GA_TRAINER_AREAS_PREFIX+encodeURIComponent(user.ID),oldArea=props.getProperty(key);
 const values={};GA_RIGHTS.forEach(k=>values[k]=d[k]===true||d[k]==='JA'?'JA':'NEIN');
 values.AktualisiertAm=gaNow_();
 const old=gaOptionalRows_('Berechtigungen').find(x=>x.BenutzerID===user.ID);
 if(hasAreas)props.setProperty(key,JSON.stringify(areas));
 try{
  if(old)gaReplace_('Berechtigungen',old.ID,values);
  else gaAppend_('Berechtigungen',{ID:gaId_(),BenutzerID:user.ID,...values});
 }catch(e){if(hasAreas){if(oldArea===null)props.deleteProperty(key);else props.setProperty(key,oldArea);}throw e;}
 if(hasAreas)values.Ausbildungsbereiche=areas;
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
 if(gaIsAdvOrg_(u)&&d.Bereich!==GA_ADV_AREA)throw new Error('Nur erweiterte Kursprojekte.');
 const input=gaProjectData_(d),existing=d.ID?gaFind_('KursProjekte',gaText_(d.ID,100)):null;
 const hasDate=Object.prototype.hasOwnProperty.call(d,'GueltigAb'),date=hasDate?String(d.GueltigAb||'').trim():'';
 if(date&&!gaValidityValidDate_(date))throw new Error('Bitte ein gültiges Gültigkeitsdatum auswählen.');
 if(d.ID&&!existing)throw new Error('Kursprojekt nicht gefunden.');
 if(gaIsAdvOrg_(u)&&existing&&existing.Bereich!==GA_ADV_AREA)throw new Error('Fremdes Kursprojekt.');
 const plan=gaCoursePlanInput_(d,'projekt',existing?.ID||'',input.Bereich);
 if(existing){
  if(existing.Status==='Veröffentlicht'||existing.Status==='Zur Prüfung')throw new Error('Dieses Projekt ist zur Prüfung eingereicht oder bereits veröffentlicht.');
  // Alle Ausbilder mit Gestaltungsrecht dürfen gemeinsam an noch offenen Projekten arbeiten.
  const status=gaChoice_(d.Status||existing.Status,['Neu','In Ausarbeitung','Zurück zur Bearbeitung'],'Projektstatus');
  const update=()=>gaReplace_('KursProjekte',existing.ID,{...input,Status:status,GeaendertVon:u.ID,GeaendertAm:gaNow_()});
  const save=()=>plan?gaCoursePlanWithRollback_('projekt',existing.ID,plan,update):update();
  if(hasDate)gaValidityWithRollback_('projekt',existing.ID,date,save);else save();
  gaLog_(u.ID,'PROJEKT_BEARBEITEN','Kursprojekt',existing.ID,{Titel:input.Titel,Status:status});
  return {ok:true,message:'Kursprojekt aktualisiert.'};
 }
 const status=gaChoice_(d.Status||'Neu',['Neu','In Ausarbeitung'],'Projektstatus');
 const project={ID:gaId_(),KursID:'',...input,Status:status,ErstelltVon:u.ID,
  ErstelltAm:gaNow_(),GeaendertVon:u.ID,GeaendertAm:gaNow_(),
  GeprueftVon:'',GeprueftAm:'',Rueckmeldung:''};
 const create=()=>gaAppend_('KursProjekte',project);
 const save=()=>plan?gaCoursePlanWithRollback_('projekt',project.ID,plan,create):create();
 if(hasDate)gaValidityWithRollback_('projekt',project.ID,date,save);else save();
 gaLog_(u.ID,'PROJEKT_ANLEGEN','Kursprojekt',project.ID,{Titel:input.Titel});
 return {ok:true,message:'Neues Kursprojekt angelegt.'};
}
function gaSubmitProject_(u,d){
 gaRequireRight_(u,'KurseGestalten');
 if(gaIsAdvOrg_(u)&&gaFind_('KursProjekte',d.ID)?.Bereich!==GA_ADV_AREA)throw new Error('Fremdes Projekt.');
 const project=gaFind_('KursProjekte',gaText_(d.ID,100));
 if(!project||!['Neu','In Ausarbeitung','Zurück zur Bearbeitung'].includes(project.Status))
   throw new Error('Dieses Projekt kann gerade nicht eingereicht werden.');
 // Gestaltungsberechtigte Ausbilder können gemeinsam ausgearbeitete Projekte einreichen.
 gaProjectComplete_(project);
 const meta=gaValidityConfig_();
 if(meta.projekt[project.ID])gaValidityRequireTurnDates_(project.Bereich,meta);
 gaReplace_('KursProjekte',project.ID,{Status:'Zur Prüfung',GeaendertVon:u.ID,GeaendertAm:gaNow_(),Rueckmeldung:''});
 gaRows_('Benutzer').filter(x=>gaBool_(x.Aktiv)&&gaCan_(x,'KurseFreigeben')&&x.ID!==u.ID&&gaStaffAreaAllowed_(x,project.Bereich))
   .forEach(x=>gaNotify_(x.ID,'Aufgabe','Kurs wartet auf Freigabe',project.Titel,project.ID));
 gaLog_(u.ID,'PROJEKT_EINREICHEN','Kursprojekt',project.ID,{Titel:project.Titel});
 return {ok:true,message:'Projekt zur Prüfung eingereicht.'};
}
function gaReviewProject_(u,d){
 gaRequireRight_(u,'KurseFreigeben');
 if(gaIsAdvOrg_(u)&&gaFind_('KursProjekte',d.ID)?.Bereich!==GA_ADV_AREA)throw new Error('Kein Zugriff auf GAB-Kursprojekte.');
 const project=gaFind_('KursProjekte',gaText_(d.ID,100));
 if(!project||project.Status!=='Zur Prüfung')throw new Error('Es liegt kein freizugebender Entwurf vor.');
 const decision=gaChoice_(d.Entscheidung,['Freigeben','Zurückgeben'],'Entscheidung');
 const notes=gaText_(d.Rueckmeldung,1500);
 if(decision==='Zurückgeben'&&!notes)throw new Error('Bitte einen Grund für die Überarbeitung angeben.');
 if(decision==='Zurückgeben'){
  gaReplace_('KursProjekte',project.ID,{Status:'Zurück zur Bearbeitung',Rueckmeldung:notes,GeprueftVon:u.ID,GeprueftAm:gaNow_()});
 }else{
  gaProjectComplete_(project);
  const meta=gaValidityConfig_(),date=meta.projekt[project.ID]||'';
  if(date)gaValidityRequireTurnDates_(project.Bereich,meta);
  const links=[project.PraesentationURL,project.WeitereLinks].filter(Boolean).join('\n');
  const plan=gaCoursePlanRead_('projekt',project.ID);
  let courseId=project.KursID;
  const changes={Titel:project.Titel,Bereich:project.Bereich,Inhalt:project.Inhalt,
    Lernziele:project.Lernziele,Links:links,Aktiv:'JA'};
  if(courseId){
   const c=gaFind_('Kurse',courseId);if(!c)throw new Error('Verknüpfter Kurs fehlt.');
   if(date&&date!==(meta.kurs[courseId]||''))gaRequire_(u,['Administrator',GA_ADV_ROLE]);
   if(c.Bereich!==project.Bereich&&(meta.kurs[courseId]||meta.quiz[courseId]||date))
    throw new Error('Der Ausbildungsbereich eines datierten Kurses kann nicht geändert werden.');
   if(plan)gaCoursePlanRead_('kurs',courseId); // Fehlerhafte bestehende Planung nie überschreiben.
   const write=()=>gaReplace_('Kurse',courseId,changes);
   const save=()=>plan?gaCoursePlanWithRollback_('kurs',courseId,plan,write):write();
   if(date)gaValidityWithRollback_('kurs',courseId,date,save);else save();
  }else{
   courseId=gaId_();
   const create=()=>gaAppend_('Kurse',{ID:courseId,...changes,ErstelltAm:gaNow_()});
   const save=()=>plan?gaCoursePlanWithRollback_('kurs',courseId,plan,create):create();
   if(date)gaValidityWithRollback_('kurs',courseId,date,save);else save();
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
 gaRequire_(u,['Administrator','Ausbilder',GA_ADV_ROLE]);
 const val={Kategorie:gaChoice_(d.Kategorie,['Mangel App','Mangel Ausbildung','Idee Ausbildung','Idee App'],'Kategorie'),
  Titel:gaNeed_(d.Titel,'Titel',180),Beschreibung:gaNeed_(d.Beschreibung,'Beschreibung',5000),
  KursID:gaText_(d.KursID,100),Status:'Offen',ErstelltVon:u.ID,ErstelltAm:gaNow_(),
  BearbeitetVon:'',BearbeitetAm:'',Rueckmeldung:''};
 if(val.KursID&&!gaFind_('Kurse',val.KursID))throw new Error('Ausgewählter Kurs nicht vorhanden.');
 val.ID=gaId_();gaAppend_('Meldungen',val);
 gaLog_(u.ID,'MELDUNG_ANLEGEN','Meldung',val.ID,{Kategorie:val.Kategorie,Titel:val.Titel});
 gaRows_('Benutzer').filter(x=>gaBool_(x.Aktiv)&&gaCan_(x,'MeldungenBearbeiten')&&x.ID!==u.ID&&(!val.KursID?x.Rolle==='Administrator':gaStaffAreaAllowed_(x,gaFind_('Kurse',val.KursID)?.Bereich)))
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
 const member=gaOwnMember_(u);
 if(!member)throw new Error('Kein aktives Mitgliedsprofil zugeordnet.');
 const term=gaFind_('Termine',gaText_(d.TerminID,100));
 if(!term||term.Status!=='Durchgeführt'||(term.TurnusID!==member.TurnusID&&!gaAdvAssignments_().some(a=>a.MitgliedID===member.ID&&a.TurnusID===term.TurnusID)))
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


/** Erste-Hilfe-Nachweise V1.5.5: private PDF-Dateien, geprüfte Rollen, Admin-E-Mail. */
function gaAidSettings_(){
 const p=PropertiesService.getScriptProperties();
 return {Empfaenger:p.getProperty('GA_EH_EMPFAENGER')||'',
   Aktiv:p.getProperty('GA_EH_EMAIL_AKTIV')==='JA',MailBestaetigungen:true,MehrereEmpfaenger:true};
}
function gaSaveAidSettings_(u,d){
 gaRequire_(u,['Administrator']);
 const address=gaAdminMailAddress_(d.Empfaenger);
 const enabled=d.Aktiv==='JA'||d.Aktiv===true;
 if(enabled&&!address)throw new Error('Für den aktivierten Versand ist eine E-Mail-Adresse erforderlich.');
 if(enabled)gaAdminMailEnsureTrigger_();
 PropertiesService.getScriptProperties().setProperties({
   GA_EH_EMPFAENGER:address,GA_EH_EMAIL_AKTIV:enabled?'JA':'NEIN'});
 gaLog_(u.ID,'EH_VERSAND_EINSTELLUNGEN','System','',{Aktiv:enabled,EmpfaengerGesetzt:!!address});
 return {ok:true,message:'Erste-Hilfe-E-Mail-Weiterleitung gespeichert.'};
}
function gaAidMember_(u,memberId){
 const id=gaText_(memberId,100);
 if(u.Rolle==='Administrator'){
   const m=gaFind_('Mitglieder',id);
   if(!m||!gaBool_(m.Aktiv))throw new Error('Bitte ein aktives Mitglied auswählen.');
   return m;
 }
 gaRequire_(u,['Teilnehmer']);
 const m=gaOwnMember_(u);
 if(!m||id&&id!==m.ID)throw new Error('Zugriff nur auf das eigene aktive Mitgliedsprofil erlaubt.');
 return m;
}
function gaAidLatest_(memberId){
 return gaOptionalRows_('ErsteHilfeNachweise').filter(x=>x.MitgliedID===memberId).slice(-1)[0]||null;
}
function gaAidSetChecklist_(actor,memberId,complete){
 const item=gaChecklistNamedItem_('Erste-Hilfe-Bescheinigung abgegeben','GA_EH_CHECK_ID_V1');
 if(!item||!gaBool_(item.Aktiv))return;
 const ch=gaOptionalRows_('MitgliedChecks').find(x=>x.MitgliedID===memberId&&x.PunktID===item.ID);
 if(!ch)return;
 gaReplace_('MitgliedChecks',ch.ID,{Status:complete?'Erledigt':'Offen',
   Kommentar:complete?'PDF-Nachweis in der Ausbildungsplattform abgegeben.':'Nachweis muss korrigiert werden.',
   GeaendertVon:actor.ID,GeaendertAm:gaNow_()});
}
function gaAidSendEmail_(proof,member,blob){
 const settings=gaAidSettings_();
 if(!settings.Aktiv||!settings.Empfaenger)return {status:'Nicht aktiviert'};
 const turnus=gaFind_('Turnusse',member.TurnusID);
 const actor=gaFind_('Benutzer',proof.EingereichtVon);
 const body=[
   'Ein Erste-Hilfe-Nachweis wurde in der Ausbildungsplattform hinterlegt.','',
   'Name: '+member.Vorname+' '+member.Nachname,
   'Telefonnummer: '+(member.Telefon||'–'),
   'E-Mail-Adresse: '+(member.Email||'–'),
   'Standesbuchnummer: '+(member.Standesbuchnummer||'–'),
   'Turnus: '+(turnus?turnus.Bezeichnung:'–'),
   'Erste-Hilfe-Kursdatum: '+proof.Kursdatum,
   'Stundenausmaß: '+proof.Stunden+' Stunden',
   'Hochgeladen von: '+(actor?actor.Name:'Administration'),
   'Eingereicht am: '+proof.EingereichtAm,'',
   'Die Erste-Hilfe-Bescheinigung liegt als PDF-Anhang bei.',
   'Diese Nachricht wurde automatisch von der Ausbildungsplattform erstellt. Bitte nicht auf diese E-Mail antworten.'
 ].join('\n');
 const key=gaAdminMailKey_('ersteHilfe',proof.ID),delivery={key,Art:'ersteHilfe',NachweisID:proof.ID,MitgliedID:member.ID,Name:member.Vorname+' '+member.Nachname,LinkVersion:gaId_(),Status:'Versand läuft',AktualisiertMillis:Date.now()};
 try{
   gaAdminMailWrite_(key,delivery);
   const actions=gaAidLatest_(member.ID)?.ID===proof.ID&&proof.Status!=='Abgelehnt'?[
    {Aktion:'aid-filed',NachweisID:proof.ID,MitgliedID:member.ID,Label:'Erste-Hilfe-Zertifikat abgelegt bestätigen'},
    {Aktion:'aid-fdisk',NachweisID:proof.ID,MitgliedID:member.ID,Label:'In FDISK eingetragen – Datum bestätigen'}]:[];
   const extras=actions.length?gaMailActionExtras_(delivery,actions,body,false):{body};
   MailApp.sendEmail({to:gaAdminMailAddress_(settings.Empfaenger),
     subject:'Erste-Hilfe-Bescheinigung – '+member.Vorname+' '+member.Nachname,
     ...extras,attachments:[blob.setName(proof.Dateiname)],name:'Feuerwehr St. Pölten-Stadt – Ausbildung',noReply:true});
   gaReplace_('ErsteHilfeNachweise',proof.ID,{
     EmailStatus:'Gesendet',EmailGesendetAm:gaNow_(),EmailEmpfaenger:settings.Empfaenger});
   gaAdminMailWrite_(key,{...delivery,Status:'Gesendet',GesendetAm:gaNow_(),Anzahl:1,AktualisiertMillis:Date.now()});
   return {status:'Gesendet'};
 }catch(e){
   try{gaAdminMailWrite_(key,{...delivery,Status:'Fehler',Hinweis:'Erste-Hilfe-Mailversand oder Statusspeicherung fehlgeschlagen. Vor erneutem Versand prüfen.',AktualisiertMillis:Date.now()});}catch(_){}
   gaReplace_('ErsteHilfeNachweise',proof.ID,{EmailStatus:'Fehlgeschlagen'});
   gaLog_('SYSTEM','EH_EMAIL_FEHLER','ErsteHilfeNachweis',proof.ID,{
     Meldung:String(e&&e.message||e).slice(0,180)});
   return {status:'Fehlgeschlagen'};
 }
}
function gaSubmitAidProof_(u,d){
 const member=gaAidMember_(u,d.MitgliedID);
 if(!gaSheet_().getSheetByName('ErsteHilfeNachweise'))
   throw new Error('Zuerst das Tabellenmenü „Tabellen prüfen/erstellen“ ausführen.');
 const date=gaDateOnly_(d.Kursdatum);
 if(!date)throw new Error('Bitte das Erste-Hilfe-Kursdatum eingeben.');
 if(date>Utilities.formatDate(new Date(),'Europe/Vienna','yyyy-MM-dd'))
   throw new Error('Ein zukünftiges Kursdatum kann noch nicht nachgewiesen werden.');
 const hours=Number(d.Stunden);
 if(!Number.isFinite(hours)||hours<0.5||hours>80||Math.round(hours*2)!==hours*2)
   throw new Error('Stunden in halben Schritten von 0,5 bis 80 eingeben.');
 const previousId=gaText_(d.ErsatzNachweisID,100);
 const previous=previousId?gaFind_('ErsteHilfeNachweise',previousId):null;
 if(previousId&&(!previous||previous.MitgliedID!==member.ID||
   gaAidLatest_(member.ID)?.ID!==previous.ID))
   throw new Error('Nur der neueste eigene Nachweis kann korrigiert werden.');
 const raw=String(d.PdfBase64||'');
 if(!raw&&!previous)throw new Error('Bitte eine PDF-Datei auswählen.');
 let filename='',original,fileId='',newFile=null;
 if(raw){
   filename=gaNeed_(d.Dateiname,'PDF-Dateiname',120)
     .replace(/[^a-zA-Z0-9._ äöüÄÖÜß-]/g,'_');
   if(!/\.pdf$/i.test(filename))throw new Error('Nur PDF-Dateien sind erlaubt.');
   if(raw.length>5600000||raw.length%4!==0||!/^[A-Za-z0-9+/]+={0,2}$/.test(raw))
     throw new Error('PDF ungültig oder zu groß (maximal 4 MB).');
   let bytes;
   try{bytes=Utilities.base64Decode(raw);}
   catch(e){throw new Error('PDF-Daten konnten nicht gelesen werden.');}
   if(bytes.length<5||bytes.length>4*1024*1024||
     bytes[0]!==37||bytes[1]!==80||bytes[2]!==68||bytes[3]!==70||bytes[4]!==45)
     throw new Error('Bitte ein gültiges PDF mit maximal 4 MB hochladen.');
   original=Utilities.newBlob(bytes,'application/pdf',filename);
   const props=PropertiesService.getScriptProperties();
   const folderId=props.getProperty('GA_ERSTE_HILFE_FOLDER_ID');
   let folder;
   try{if(folderId)folder=DriveApp.getFolderById(folderId);}catch(e){}
   if(!folder){
     folder=DriveApp.createFolder('Grundausbildung - Erste-Hilfe-Nachweise (privat)');
     props.setProperty('GA_ERSTE_HILFE_FOLDER_ID',folder.getId());
   }
   newFile=folder.createFile(original);
   newFile.setName(member.Nachname+'_'+member.Vorname+'_'+date+'_'+gaId_().slice(0,8)+'.pdf');
   fileId=newFile.getId();
 }else{
   filename=previous.Dateiname;
   fileId=previous.DriveDateiID;
   original=DriveApp.getFileById(fileId).getBlob().setName(filename);
 }
 const proof={ID:gaId_(),MitgliedID:member.ID,Kursdatum:date,
   Stunden:String(hours).replace('.',','),Dateiname:filename,
   DriveDateiID:fileId,Status:'Eingereicht',EingereichtVon:u.ID,
   EingereichtAm:gaNow_(),GeprueftVon:'',GeprueftAm:'',Pruefnotiz:'',
   EmailStatus:'Nicht gesendet',EmailGesendetAm:'',EmailEmpfaenger:''};
 try{gaAppend_('ErsteHilfeNachweise',proof);}
 catch(e){if(newFile)newFile.setTrashed(true);throw e;}
 gaAidSetChecklist_(u,member.ID,true);
 gaLog_(u.ID,'EH_PDF_EINGEREICHT','Mitglied',member.ID,{
   NachweisID:proof.ID,Datum:date,Stunden:hours,Dateiname:filename,ErsatzNachweisID:previousId});
 const admins=gaRows_('Benutzer').filter(x=>x.Rolle==='Administrator'&&gaBool_(x.Aktiv)&&x.ID!==u.ID);
 admins.forEach(x=>gaNotify_(x.ID,'Aufgabe','Erste-Hilfe-Nachweis eingereicht',
   member.Vorname+' '+member.Nachname+': bitte PDF prüfen.',proof.ID));
 let mailStatus='Nicht aktiviert';
 const settings=gaAidSettings_();
 if(settings.Aktiv&&(u.Rolle!=='Administrator'||d.Versenden==='JA'||d.Versenden===true))
   mailStatus=gaAidSendEmail_(proof,member,original).status;
 else if(settings.Aktiv){
   mailStatus='Abgewählt';
   gaReplace_('ErsteHilfeNachweise',proof.ID,{EmailStatus:mailStatus});
 }
 if(admins.length)gaPushQueue_(5);
 return {ok:true,message:'Erste-Hilfe-PDF gespeichert und zur Prüfung eingereicht. '+
   (mailStatus==='Gesendet'?'E-Mail mit PDF versendet.':
   mailStatus==='Fehlgeschlagen'?'E-Mail-Versand fehlgeschlagen; der Nachweis bleibt gespeichert.':
   mailStatus==='Abgewählt'?'E-Mail-Versand abgewählt.':'Automatische E-Mail-Weiterleitung ist deaktiviert.')};
}
function gaReviewAidProof_(u,d){
 gaRequire_(u,['Administrator']);
 const proof=gaFind_('ErsteHilfeNachweise',gaText_(d.ID,100));
 if(!proof)throw new Error('Erste-Hilfe-Nachweis nicht gefunden.');
 if(gaAidLatest_(proof.MitgliedID)?.ID!==proof.ID)
   throw new Error('Nur der zuletzt hochgeladene Nachweis kann geprüft werden.');
 const action=gaChoice_(d.Entscheidung,['Bestätigt','Abgelehnt'],'Prüfentscheidung');
 const note=gaText_(d.Pruefnotiz,500);
 if(action==='Abgelehnt'&&!note)throw new Error('Bitte den Ablehnungsgrund eingeben.');
 const member=gaFind_('Mitglieder',proof.MitgliedID);
 if(!member)throw new Error('Mitglied nicht vorhanden.');
 gaReplace_('ErsteHilfeNachweise',proof.ID,{
   Status:action,GeprueftVon:u.ID,GeprueftAm:gaNow_(),Pruefnotiz:note});
 const old=gaOptionalRows_('QualifikationMitglieder').find(x=>x.MitgliedID===member.ID);
 if(action==='Bestätigt'){
   if(old)gaReplace_('QualifikationMitglieder',old.ID,{
     ErsteHilfeStatus:'Bestätigt',ErsteHilfeBestaetigtAm:proof.Kursdatum,
     GeprueftVon:u.ID,GeprueftAm:gaNow_()});
   else gaAppend_('QualifikationMitglieder',{
     ID:gaId_(),MitgliedID:member.ID,ErsteHilfeStatus:'Bestätigt',
     ErsteHilfeBestaetigtAm:proof.Kursdatum,GeprueftVon:u.ID,GeprueftAm:gaNow_()});
 }else{
   const otherConfirmed=gaOptionalRows_('ErsteHilfeNachweise')
     .some(x=>x.MitgliedID===member.ID&&x.ID!==proof.ID&&x.Status==='Bestätigt');
   if(!otherConfirmed){
     gaAidSetChecklist_(u,member.ID,false);
     // Einen bereits unabhängig bestätigten Erste-Hilfe-Kurs nicht wegen
     // eines neu eingereichten, abgelehnten PDFs automatisch aberkennen.
     if(old&&(old.ErsteHilfeStatus!=='Bestätigt'||proof.Status==='Bestätigt'))
       gaReplace_('QualifikationMitglieder',old.ID,{
         ErsteHilfeStatus:'Ausständig',ErsteHilfeBestaetigtAm:''});
   }
 }
 gaLog_(u.ID,'EH_PDF_'+(action==='Bestätigt'?'BESTAETIGT':'ABGELEHNT'),
   'ErsteHilfeNachweis',proof.ID,{Kommentar:note});
 const user=gaRows_('Benutzer').find(x=>x.Rolle==='Teilnehmer'&&gaBool_(x.Aktiv)&&
   member.Email&&x.Email.toLowerCase()===member.Email.toLowerCase());
 if(user){
   gaNotify_(user.ID,'Aufgabe','Erste-Hilfe-Nachweis '+action.toLowerCase(),
     action==='Bestätigt'?'Deine Erste-Hilfe-Bescheinigung wurde bestätigt.':
     'Bitte deine Erste-Hilfe-Bescheinigung korrigieren: '+note,proof.ID);
   gaPushQueue_(5);
 }
 return {ok:true,message:'Erste-Hilfe-Nachweis '+action.toLowerCase()+'.'};
}
function gaReadAidPdf_(u,d){
 const proof=gaFind_('ErsteHilfeNachweise',gaText_(d.ID,100));
 if(!proof)throw new Error('PDF-Nachweis nicht vorhanden.');
 const member=u.Rolle==='Administrator'?gaFind_('Mitglieder',proof.MitgliedID):
   gaAidMember_(u,proof.MitgliedID);
 if(!member||member.ID!==proof.MitgliedID)throw new Error('Keine Berechtigung für dieses PDF.');
 const pdfFile=DriveApp.getFileById(proof.DriveDateiID);
 if(pdfFile.getSize()>4*1024*1024)throw new Error('Das PDF ist zu groß zum Anzeigen.');
 const blob=pdfFile.getBlob();
 return {dateiname:proof.Dateiname,base64:Utilities.base64Encode(blob.getBytes())};
}
function gaResendAidEmail_(u,d){
 gaRequire_(u,['Administrator']);
 if(!gaAidSettings_().Aktiv)throw new Error('Bitte zuerst den E-Mail-Versand aktivieren.');
 const proof=gaFind_('ErsteHilfeNachweise',gaText_(d.ID,100));
 if(!proof)throw new Error('Erste-Hilfe-Nachweis nicht gefunden.');
 const member=gaFind_('Mitglieder',proof.MitgliedID);
 if(!member)throw new Error('Mitglied nicht gefunden.');
 const blob=DriveApp.getFileById(proof.DriveDateiID).getBlob();
 const result=gaAidSendEmail_(proof,member,blob);
 gaLog_(u.ID,'EH_EMAIL_ERNEUT','ErsteHilfeNachweis',proof.ID,{Status:result.status});
 return {ok:result.status==='Gesendet',
   message:result.status==='Gesendet'?'E-Mail mit PDF erneut versendet.':
     'E-Mail-Versand fehlgeschlagen; das PDF ist weiterhin gespeichert.'};
}

/** Qualifikationsfreigaben; keine öffentliche Daten-API. */
function gaDateOnly_(v){const x=gaText_(v,10);if(x&&(!/^\d{4}-\d{2}-\d{2}$/.test(x)||new Date(x+'T12:00:00Z').toISOString().slice(0,10)!==x))throw new Error('Ungültiges Datum.');return x;}

/* Kohortendaten werden ergänzend gespeichert; bestehende Sheet-Spalten bleiben unverändert. */
const GA_VALIDITY_PREFIX='GA_VALIDITY_V1_';
const GA_VALIDITY_TYPES=['turnus','kurs','quiz','projekt'];
function gaValidityKey_(kind,id){
 if(!GA_VALIDITY_TYPES.includes(kind)||!id)throw new Error('Ungültige Gültigkeitsregel.');
 return GA_VALIDITY_PREFIX+kind+'_'+encodeURIComponent(String(id));
}
function gaValidityValidDate_(v){
 const s=String(v||'');if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;
 const d=new Date(s+'T12:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===s;
}
function gaValidityConfig_(){
 const result={turnus:Object.create(null),kurs:Object.create(null),quiz:Object.create(null),projekt:Object.create(null)};
 const all=PropertiesService.getScriptProperties().getProperties();
 for(const kind of GA_VALIDITY_TYPES){
  const prefix=GA_VALIDITY_PREFIX+kind+'_';
  for(const key of Object.keys(all))if(key.startsWith(prefix)){
   let id;try{id=decodeURIComponent(key.slice(prefix.length));}catch(e){throw new Error('Ungültige gespeicherte Gültigkeitsregel.');}
   const value=String(all[key]||'');
   if(!id)throw new Error('Ungültige gespeicherte Gültigkeitsregel.');
   // Fehlerhafte Einträge nie als "kein Datum" auslegen: Auswertung meldet ungeklärt.
   result[kind][id]=value||'INVALID';
  }
 }
 return result;
}
function gaValiditySet_(kind,id,value){
 const props=PropertiesService.getScriptProperties(),key=gaValidityKey_(kind,id),v=String(value||'').trim();
 if(v&&!gaValidityValidDate_(v))throw new Error('Bitte ein gültiges Datum auswählen.');
 if(v)props.setProperty(key,v);else props.deleteProperty(key);
}
function gaValidityWithRollback_(kind,id,value,write){
 const props=PropertiesService.getScriptProperties(),key=gaValidityKey_(kind,id),old=props.getProperty(key);
 gaValiditySet_(kind,id,value);
 try{return write();}catch(error){if(old===null)props.deleteProperty(key);else props.setProperty(key,old);throw error;}
}
function gaValidityDecision_(area,validFrom,memberTurnIds,turns,turnDates){
 if(!validFrom)return 'applies';
 if(!gaValidityValidDate_(validFrom))return 'unknown';
 const ids=new Set((memberTurnIds||[]).filter(Boolean));
 if(!ids.size)return 'unknown';
 const knownIds=new Set((turns||[]).map(t=>t.ID));
 const missingTurn=[...ids].some(id=>!knownIds.has(id));
 const relevant=(turns||[]).filter(t=>ids.has(t.ID)&&t.Bereich===area);
 if(!relevant.length)return missingTurn?'unknown':'unassigned';
 let unknown=missingTurn;
 for(const turn of relevant){
  const start=(turnDates||{})[turn.ID];
  if(!gaValidityValidDate_(start))unknown=true;
  else if(start>=validFrom)return 'applies';
 }
 return unknown?'unknown':'exempt';
}
function gaValidityMemberTurns_(member,assignments){
 return [member?.TurnusID,...(assignments||[]).filter(a=>a.MitgliedID===member?.ID).map(a=>a.TurnusID)].filter(Boolean);
}
function gaValidityQuizDate_(meta,courseId){
 const a=meta.kurs[courseId]||'',b=meta.quiz[courseId]||'';
 if((a&&!gaValidityValidDate_(a))||(b&&!gaValidityValidDate_(b)))return 'INVALID';
 return a>b?a:b;
}
function gaValidityForMember_(course,member,meta,turns,assignments,kind){
 if(!course)return 'unknown';
 const date=kind==='quiz'?gaValidityQuizDate_(meta,course.ID):(meta.kurs[course.ID]||'');
 return gaValidityDecision_(course.Bereich,date,gaValidityMemberTurns_(member,assignments),turns,meta.turnus);
}
function gaValidityForTerm_(course,term,meta,turns,kind){
 if(!course||!term)return 'unknown';
 const date=kind==='quiz'?gaValidityQuizDate_(meta,course.ID):(meta.kurs[course.ID]||'');
 return gaValidityDecision_(course.Bereich,date,[term.TurnusID],turns,meta.turnus);
}
function gaValidityQuizAttendance_(course,member,meta,turns,assignments,terms,attendance){
 if(!course||!member)return 'unknown';
 const allowed=new Set(gaValidityMemberTurns_(member,assignments));
 const matching=(terms||[]).filter(t=>t.KursID===course.ID&&t.Status==='Durchgeführt'&&allowed.has(t.TurnusID)&&
  (attendance||[]).some(a=>a.TerminID===t.ID&&a.MitgliedID===member.ID&&gaBool_(a.Anwesend)));
 if(!matching.length)return 'not-attended';
 const decisions=matching.map(t=>gaValidityForTerm_(course,t,meta,turns,'quiz'));
 if(decisions.includes('applies'))return 'applies';
 return decisions.some(x=>x==='unknown'||x==='unassigned')?'unknown':'exempt';
}
function gaValidityVisible_(meta,turns,courses,projects){
 const result={turnus:Object.create(null),kurs:Object.create(null),quiz:Object.create(null),projekt:Object.create(null)};
 for(const [kind,rows] of [['turnus',turns],['kurs',courses],['quiz',courses],['projekt',projects]])
  for(const row of rows||[])if(meta[kind][row.ID])result[kind][row.ID]=meta[kind][row.ID];
 return result;
}
function gaValidityRequireTurnDates_(area,meta){
 const turns=gaRows_('Turnusse'),members=gaRows_('Mitglieder').filter(m=>gaBool_(m.Aktiv));
 const turnIds=new Set(turns.map(t=>t.ID));
 if(members.some(m=>!m.TurnusID||!turnIds.has(m.TurnusID)))
  throw new Error('Mindestens ein aktives Mitglied hat keinen gültigen Hauptturnus. Bitte zuerst die Turnuszuordnung prüfen.');
 const activeMemberIds=new Set(members.map(m=>m.ID));
 const used=new Set(members.map(m=>m.TurnusID));
 const assignments=gaAdvAssignments_().filter(a=>activeMemberIds.has(a.MitgliedID));
 if(area===GA_ADV_AREA&&assignments.some(a=>!turns.some(t=>t.ID===a.TurnusID&&t.Bereich===GA_ADV_AREA)))
  throw new Error('Eine zusätzliche erweiterte Turnuszuordnung ist ungültig. Bitte zuerst die Zuordnung prüfen.');
 assignments.forEach(a=>used.add(a.TurnusID));
 // Frühere bestätigte Teilnahmen bleiben auch nach einer späteren Umteilung relevant.
 const attendedTerms=new Set(gaRows_('Teilnahmen').filter(a=>activeMemberIds.has(a.MitgliedID)&&gaBool_(a.Anwesend)).map(a=>a.TerminID));
 const historical=gaRows_('Termine').filter(t=>attendedTerms.has(t.ID));
 const areaCourses=new Set(gaRows_('Kurse').filter(c=>c.Bereich===area).map(c=>c.ID));
 if(historical.some(t=>areaCourses.has(t.KursID)&&(!t.TurnusID||!turnIds.has(t.TurnusID))))
  throw new Error('Bei einer bestehenden Teilnahme fehlt ein gültiger Turnus. Bitte die zugehörige Ausbildung prüfen.');
 historical.forEach(t=>used.add(t.TurnusID));
 const missing=turns.filter(t=>t.Bereich===area&&(gaBool_(t.Aktiv)||used.has(t.ID))&&!gaValidityValidDate_(meta.turnus[t.ID]));
 if(missing.length)throw new Error('Bitte zuerst für diese Turnusse das tatsächliche Startdatum eintragen: '+missing.map(t=>t.Bezeichnung||t.ID).join(', ')+'.');
}
function gaValidityHasAreaRule_(area,meta){
 return gaRows_('Kurse').some(c=>c.Bereich===area&&(meta.kurs[c.ID]||meta.quiz[c.ID]));
}
function gaValidityScope_(u,kind,id){
 gaRequire_(u,['Administrator',GA_ADV_ROLE]);
 const name=kind==='turnus'?'Turnusse':kind==='kurs'?'Kurse':null;
 if(!name)throw new Error('Ungültige Einstellung.');
 const row=gaFind_(name,id);if(!row)throw new Error('Eintrag nicht gefunden.');
 if(gaIsAdvOrg_(u)&&row.Bereich!==GA_ADV_AREA)throw new Error('Zugriff nur auf die erweiterte Ausbildung.');
 return row;
}
function gaSetValidity_(u,d){
 const kind=gaChoice_(d.Art,['turnus','kurs'],'Einstellung'),id=gaNeed_(d.ID,'ID',100),row=gaValidityScope_(u,kind,id);
 const value=String(d.Datum||'').trim(),meta=gaValidityConfig_();
 if(value&&!gaValidityValidDate_(value))throw new Error('Bitte ein gültiges Datum eingeben.');
 if(kind==='kurs'&&value)gaValidityRequireTurnDates_(row.Bereich,meta);
 if(kind==='turnus'&&!value&&gaValidityHasAreaRule_(row.Bereich,meta))throw new Error('Startdatum kann nicht entfernt werden, solange in diesem Bereich datierte Kurs- oder Quizregeln bestehen.');
 gaValiditySet_(kind,id,value);
 gaLog_(u.ID,'GUELTIGKEIT_SETZEN',kind,id,{Vorher:meta[kind][id]||'',Datum:value});
 return {ok:true,message:'Datum gespeichert.'};
}
// Ein gemeinsamer Abschlussbegriff für Qualifikation, Übergabeliste und Meldungen.
function gaGabCompletion_(m,qs,abschnitt){
 const q=(qs||[]).find(x=>x.MitgliedID===m.ID)||{};
 const proof=id=>(abschnitt||[]).find(x=>x.MitgliedID===m.ID&&x.KursID===id);
 const a=proof('GAB-ABSCHNITT-BLOCK-A'),b=proof('GAB-ABSCHNITT-BLOCK-B');
 const blockA=!!a&&gaBool_(a.Absolviert),blockB=!!b&&gaBool_(b.Absolviert)&&gaBool_(b.PruefungBestanden);
 const recognized=q.GABAnerkannt==='JA'&&(m.Ausbildungsweg||'')==='Erweiterte Ausbildung';
 return {blockA,blockB,recognized,confirmed:gaBool_(q.GABFreigabe),
  complete:gaBool_(m.Aktiv)&&(recognized||(gaBool_(q.GABFreigabe)&&blockA&&blockB))};
}
function gaNotifyGabCompleted_(m,before,after){
 if(before||!after)return '';
 try{
  if(gaFind_('Turnusse',m.TurnusID)?.Bereich!=='Grundausbildung')return '';
  const ref='GABREADY:'+m.ID,notices=gaRows_('Benachrichtigungen');
  const assigned=gaAdvAssignments_().some(a=>a.MitgliedID===m.ID&&gaFind_('Turnusse',a.TurnusID)?.Bereich===GA_ADV_AREA);
  const recipients=gaRows_('Benutzer').filter(x=>gaBool_(x.Aktiv)&&x.Rolle===GA_ADV_ROLE);
  for(const user of recipients){
   if(notices.some(n=>n.BenutzerID===user.ID&&n.BezugID===ref))continue;
   const id=gaNotify_(user.ID,'Aufgabe','Grundausbildung abgeschlossen',
    m.Vorname+' '+m.Nachname+' hat die Grundausbildung abgeschlossen. '+(assigned?
     'Eine Zuordnung zur erweiterten Ausbildung besteht bereits.':'Die Person kann der erweiterten Ausbildung zugeordnet werden.'),ref);
   try{gaPushQueue_(1,id);}catch(e){console.warn('GAB-Abschluss-Push wartet:',String(e));}
  }
  return '';
 }catch(e){
  console.warn('GAB-Abschluss-Benachrichtigung fehlgeschlagen:',String(e));
  return ' Der Abschluss wurde gespeichert, die Benachrichtigung konnte nicht vollständig erstellt werden. Bitte die erweiterte Ausbildungsleitung informieren.';
 }
}
function gaQualificationStatus_(m,qs,rs,courses,terms,attendances,turnusse,quizCfg,quizAttempts,abschnitt,assignments,predecessors,validity){
 const q=qs.find(x=>x.MitgliedID===m.ID)||{},valid=x=>gaBool_(x);
 validity=validity||{turnus:{},kurs:{},quiz:{},projekt:{}};
 const unclear=new Set();
 const memberTurns=new Set([m.TurnusID,...(assignments||[]).filter(a=>a.MitgliedID===m.ID).map(a=>a.TurnusID)]);
 const ownComplete=(id,cutoff)=>{
   if(id==='GAB-ABSCHNITT-BLOCK-A'||id==='GAB-ABSCHNITT-BLOCK-B'){
     const proof=(abschnitt||[]).find(x=>x.MitgliedID===m.ID&&x.KursID===id);
     return !!proof&&valid(proof.Absolviert)&&(id!=='GAB-ABSCHNITT-BLOCK-B'||valid(proof.PruefungBestanden));
   }
   const attended=terms.filter(t=>t.KursID===id&&(!cutoff||(/^\d{4}-\d{2}-\d{2}/.test(String(t.Beginn||''))&&String(t.Beginn).slice(0,10)<=cutoff))&&(!cutoff?memberTurns.has(t.TurnusID):true)&&t.Status==='Durchgeführt'&&attendances.some(a=>a.TerminID===t.ID&&a.MitgliedID===m.ID&&valid(a.Anwesend)));
   if(!attended.length)return false;
   const config=(quizCfg||[]).find(c=>c.KursID===id&&(!cutoff?valid(c.Aktiv):true)&&valid(c.Pflicht));
   if(!config)return true;
   if((quizAttempts||[]).some(a=>a.MitgliedID===m.ID&&a.KursID===id&&valid(a.Bestanden)))return true;
   if(!gaValidityQuizDate_(validity,id))return false;
   const course=(courses||[]).find(c=>c.ID===id);
   const decisions=attended.map(t=>gaValidityForTerm_(course,t,validity,turnusse,'quiz'));
   if(decisions.some(x=>x==='unknown'||x==='unassigned'))unclear.add(id);
   return decisions.includes('exempt');
 };
 const complete=id=>{
   const seen=new Set();let cutoff='';
   while(id&&!seen.has(id)){
     seen.add(id);
     if(ownComplete(id,cutoff))return true;
     const link=(predecessors||{})[id];
     if(!link||typeof link!=='object'||!link.id||!/^\d{4}-\d{2}-\d{2}$/.test(link.bis||''))break;
     cutoff=cutoff&&cutoff<link.bis?cutoff:link.bis;
     id=link.id;
   }
   return false;
 };
 const effective=field=>{
   const resolved=[],original=rs.filter(r=>valid(r[field]));
   const directIds=new Set(original.map(r=>r.KursID)),expanded=new Set();
   original.forEach(r=>{
     let id=r.KursID;const seen=new Set();
     while(id&&!seen.has(id)){
       seen.add(id);
       const course=(courses||[]).find(c=>c.ID===id);
       const status=validity.kurs[id]?gaValidityForMember_(course,m,validity,turnusse,assignments,'kurs'):'applies';
       if(status==='unassigned'&&field==='PflichtGAB'&&valid(q.GABAnerkannt)&&m.Ausbildungsweg===GA_ADV_AREA)break;
       if(status==='unknown'||status==='unassigned')unclear.add(id);
       if(status!=='exempt'){
        if(id===r.KursID)resolved.push(r);
        else if(!directIds.has(id)&&!expanded.has(id)){resolved.push({...r,KursID:id});expanded.add(id);}
        break;
       }
       id=(predecessors||{})[id]?.id||'';
     }
   });
   const required=resolved;
   const obsolete=new Set();
   required.forEach(r=>{
     let id=r.KursID;const seen=new Set([id]);
     while((predecessors||{})[id]?.id){
       id=predecessors[id].id;if(seen.has(id))break;seen.add(id);obsolete.add(id);
     }
   });
   return required.filter(r=>!obsolete.has(r.KursID));
 };
 const gab=effective('PflichtGAB'),bsw=effective('PflichtBSW');
 const gabOpen=gab.filter(r=>!complete(r.KursID)),bswOpen=bsw.filter(r=>!complete(r.KursID));
 const birth=m.Geburtsdatum||q.Geburtsdatum||'',today=Utilities.formatDate(new Date(),'Europe/Vienna','yyyy-MM-dd');
 const age16=/^\d{4}-\d{2}-\d{2}$/.test(birth)&&today>=(Number(birth.slice(0,4))+16)+birth.slice(4);
 const completion=gaGabCompletion_(m,qs,abschnitt),advanced=completion.recognized;
 // Die ausdrückliche Bestätigung des Administrators ist eine eigenständige Freigabe.
 // Fehlende Pflichtmodule bleiben sichtbar, werden aber nicht als unbeabsichtigte Sperre verwendet.
 const adminConfirmed=completion.confirmed;
 const blockAOk=completion.blockA,blockBOk=completion.blockB;
 // Beide externen Hauptmodule sind zwingend, selbst bei manuell bestätigter GAB.
 // Die explizite Anerkennung bereits absolvierter GAB für erweiterte Ausbildung bleibt als Sonderfall gültig.
 const gabDone=completion.complete;
 const gabDocsComplete=gab.length>0&&gabOpen.length===0;
 const gabNotice=(!blockAOk||!blockBOk)?'Abschnittsmodul Block A und/oder Block B mit Abschluss Truppmann noch ausständig.':
  !gab.length?'Noch keine GAB-Pflichtmodule definiert.':gabOpen.length?
   gabOpen.length+' GAB-Pflichtmodul(e) ohne bestätigten Abschluss.':'Alle definierten GAB-Pflichtmodule absolviert.';
 // GAB ist die erste Stufe; nach belegtem Abschluss folgt automatisch die Erweiterte Ausbildung.
 // Wer GAB macht, darf bereits vorher freiwillig an erweiterten Kursen teilnehmen.
 const actualPath=gabDone?'Erweiterte Ausbildung':'Grundausbildung';
 const bswDone=valid(m.Aktiv)&&bsw.length>0&&bswOpen.length===0;
 const requirements=[...new Set([...gab,...bsw].map(r=>r.KursID))],done=requirements.filter(complete).length;
 return {MitgliedID:m.ID,Name:m.Vorname+' '+m.Nachname,TurnusID:m.TurnusID,Ausbildungsweg:actualPath,AusbildungswegAufnahme:m.Ausbildungsweg||'Grundausbildung',Standesbuchnummer:m.Standesbuchnummer||'',
  GueltigkeitUnklar:[...unclear],
  Geburtsdatum:birth,ErsteHilfeStatus:q.ErsteHilfeStatus||'Ausständig',
  ErsteHilfeBestaetigtAm:q.ErsteHilfeBestaetigtAm||'',FDISKEintragDatum:q.FDISKEintragDatum||'',FDISKPlatzhalter:q.FDISKPlatzhalter||'NEIN',
  GABFreigabe:q.GABFreigabe||'NEIN',GABAnerkannt:q.GABAnerkannt||'NEIN',
  GABAbgeschlossen:gabDone,GABDokuVollstaendig:gabDocsComplete,GABHinweis:gabNotice,GABManuellBestaetigt:adminConfirmed,
  AbschnittBlockA:!!blockAOk,AbschnittBlockB:!!blockBOk,BSWModulAbgeschlossen:bswDone,Alter16:!!age16,
  BSWDienstMoeglich:gabDone&&bswDone&&!!age16,
  Fortschritt:requirements.length?Math.round(done*100/requirements.length):0,
  PflichtGesamt:requirements.length,PflichtAbsolviert:done,
  OffeneGABKurse:advanced?[]:gabOpen.map(r=>courses.find(c=>c.ID===r.KursID)?.Titel||'Pflichtkurs'),
  OffeneBSWKurse:bswOpen.map(r=>courses.find(c=>c.ID===r.KursID)?.Titel||'Pflichtkurs')};
}
// Abschlussnachrichten nur aus bestätigten Daten und eindeutig zugeordneten Teilnehmerkonten.
function gaGabNoticeContext_(){
 return {members:gaRows_('Mitglieder'),users:gaRows_('Benutzer'),turns:gaRows_('Turnusse'),
  courses:gaRows_('Kurse'),terms:gaRows_('Termine'),attendance:gaRows_('Teilnahmen'),
  qualifications:gaOptionalRows_('QualifikationMitglieder'),requirements:gaOptionalRows_('KursAnforderungen'),
  proofs:gaOptionalRows_('AbschnittNachweise'),quizzes:gaOptionalRows_('QuizKurse'),
  attempts:gaOptionalRows_('QuizVersuche'),unlocks:gaOptionalRows_('QuizFreigaben'),
  assignments:gaAdvAssignments_(),predecessors:gaCoursePredecessors_(),meta:gaValidityConfig_(),
  notices:gaRows_('Benachrichtigungen')};
}
function gaGabNoticeQuizReady_(m,account,course,quiz,ctx){
 if(!course||!gaBool_(course.Aktiv)||!quiz||!gaBool_(quiz.Aktiv)||!gaBool_(quiz.Pflicht))return false;
 if(!gaQuizNoticeEligible_(account,course,quiz,ctx))return false;
 if(gaValidityQuizAttendance_(course,m,ctx.meta,ctx.turns,ctx.assignments,ctx.terms,ctx.attendance)!=='applies')return false;
 try{const qs=JSON.parse(quiz.FragenJSON||'[]');if(!Array.isArray(qs)||!qs.length)return false;}catch(_){return false;}
 const all=ctx.attempts.filter(a=>a.MitgliedID===m.ID&&a.KursID===course.ID);
 if(all.some(a=>gaBool_(a.Bestanden)))return false;
 const current=all.filter(a=>String(a.QuizVersion)===String(quiz.Version));
 if(current.some(a=>a.Status==='In Bearbeitung'&&!gaQuizDue_(a,Number(quiz.ZeitlimitMinuten))))return true;
 const extra=ctx.unlocks.filter(x=>x.MitgliedID===m.ID&&x.KursID===course.ID&&String(x.QuizVersion)===String(quiz.Version))
  .reduce((sum,x)=>sum+Math.max(0,Number(x.ZusatzVersuche)||0),0);
 const max=Number(quiz.MaxVersuche);
 return Number.isFinite(max)&&max>0&&current.length<max+extra;
}
function gaGabNoticeCandidate_(m,ctx){
 if(!gaBool_(m.Aktiv)||!ctx.turns.some(t=>t.ID===m.TurnusID&&t.Bereich==='Grundausbildung')||
  !gaGabCompletion_(m,ctx.qualifications,ctx.proofs).complete)return null;
 const ref='GABCOMPLETE:'+m.ID,name=(m.Vorname+' '+m.Nachname).trim();
 if(ctx.notices.some(n=>n.BezugID===ref))return {MitgliedID:m.ID,Name:name,Status:'Bereits benachrichtigt'};
 const email=String(m.Email||'').trim().toLowerCase();
 const matches=email?ctx.users.filter(u=>u.Rolle==='Teilnehmer'&&gaBool_(u.Aktiv)&&String(u.Email||'').trim().toLowerCase()===email):[];
 if(matches.length!==1||gaOwnMember_(matches[0],ctx.members)?.ID!==m.ID)
  return {MitgliedID:m.ID,Name:name,Status:matches.length>1?'Zugang nicht eindeutig':'Kein eindeutig zugeordneter aktiver Zugang'};
 const account=matches[0],q=gaQualificationStatus_(m,ctx.qualifications,ctx.requirements,ctx.courses,ctx.terms,
  ctx.attendance,ctx.turns,ctx.quizzes,ctx.attempts,ctx.proofs,ctx.assignments,ctx.predecessors,ctx.meta);
 let bsw=q.BSWModulAbgeschlossen?'BSW-Modul abgeschlossen':'BSW-Status prüfen',extra='';
 const relevant=new Set(),bswRequirements=ctx.requirements.filter(r=>gaBool_(r.PflichtBSW));
 bswRequirements.forEach(r=>{
  let id=r.KursID;const seen=new Set();while(id&&!seen.has(id)){seen.add(id);relevant.add(id);id=ctx.predecessors[id]?.id||'';}
 });
 const uncertain=(q.GueltigkeitUnklar||[]).some(id=>relevant.has(id));
 if((q.OffeneBSWKurse||[]).length&&!uncertain){
  const openNames=new Set(q.OffeneBSWKurse),relatedCourses=ctx.courses.filter(c=>relevant.has(c.ID));
  // Bei doppelt vergebenen Titeln keine bestimmte Quizpflicht raten.
  const openCourses=relatedCourses.filter(c=>openNames.has(c.Titel)&&relatedCourses.filter(x=>x.Titel===c.Titel).length===1);
  const candidates=openCourses.map(c=>({course:c,quiz:ctx.quizzes.find(z=>z.KursID===c.ID&&gaBool_(z.Aktiv)&&gaBool_(z.Pflicht))}))
   .filter(x=>x.quiz&&!ctx.attempts.some(a=>a.MitgliedID===m.ID&&a.KursID===x.course.ID&&gaBool_(a.Bestanden)));
  if(candidates.some(x=>gaGabNoticeQuizReady_(m,account,x.course,x.quiz,ctx))){
   bsw='BSW-Quiz offen und freigeschaltet';
   extra='\n\nDein Modul Brandsicherheitswache (BSW) ist noch offen. Bitte absolviere das freigeschaltete BSW-Quiz in der App unter Menü → Wissenstests.';
  }else if(candidates.some(x=>gaValidityQuizAttendance_(x.course,m,ctx.meta,ctx.turns,ctx.assignments,ctx.terms,ctx.attendance)==='applies')){
   bsw='BSW offen; Quizzugang prüfen';
   extra='\n\nDein Modul Brandsicherheitswache (BSW) ist noch offen. Bitte melde dich bei der Ausbildungsleitung, falls du für das Quiz einen weiteren Versuch benötigst.';
  }else if(candidates.length){
   bsw='BSW offen; Quiz noch nicht freigeschaltet';
   extra='\n\nDein Modul Brandsicherheitswache (BSW) ist noch offen. Nach bestätigter Kursteilnahme und Freigabe findest du das Quiz in der App unter Menü → Wissenstests.';
  }else{
   bsw='BSW-Modul offen';
   extra='\n\nDein Modul Brandsicherheitswache (BSW) ist noch offen. Bitte prüfe deinen Ausbildungsstand in der App oder wende dich an die Ausbildungsleitung.';
  }
 }else if(uncertain){bsw='BSW-Gültigkeit unklar – bitte prüfen';}
 else if(!bswRequirements.length){bsw='BSW-Status nicht bestimmbar – keine BSW-Pflichtmodule festgelegt';}
 const message='Hallo '+m.Vorname+'! Dein Abschluss der Grundausbildung wurde offiziell bestätigt. Herzlichen Glückwunsch zu deinem Erfolg! '+
  'Du wechselst nun in die erweiterte Ausbildung. Über die nächsten Schritte informieren wir dich in den nächsten Wochen.'+extra;
 return {MitgliedID:m.ID,Name:name,Status:'Bereit',BSW:bsw,Text:message,BenutzerID:account.ID,BezugID:ref};
}
function gaGabCompletionNoticePreview_(u){
 gaRequire_(u,['Administrator']);
 const ctx=gaGabNoticeContext_(),items=ctx.members.map(m=>gaGabNoticeCandidate_(m,ctx)).filter(Boolean)
  .sort((a,b)=>a.Name.localeCompare(b.Name,'de'));
 return {ok:true,backendVersion:GA.VERSION,Teilnehmer:items.map(({BenutzerID,BezugID,...item})=>item)};
}
function gaGabCreateParticipantNotice_(candidate,ctx){
 if(!candidate||candidate.Status!=='Bereit')return false;
 if(ctx.notices.some(n=>n.BezugID===candidate.BezugID))return false;
 const title=gaGabNoticeTitle_(candidate);
 const id=gaNotify_(candidate.BenutzerID,'Aufgabe',title,candidate.Text,candidate.BezugID);
 ctx.notices.push({BezugID:candidate.BezugID,BenutzerID:candidate.BenutzerID});
 try{gaPushQueue_(1,id);}catch(e){console.warn('GAB-Teilnehmer-Push wartet:',String(e));}
 return true;
}
function gaGabNoticeTitle_(candidate){return candidate.BSW==='BSW-Quiz offen und freigeschaltet'?
 'GAB abgeschlossen – BSW-Quiz offen':'Grundausbildung abgeschlossen – Gratulation!';}
function gaSendGabCompletionNotices_(u,d){
 gaRequire_(u,['Administrator']);
 if(!Array.isArray(d.MitgliedIDs)||!d.MitgliedIDs.length||d.MitgliedIDs.length>8)throw new Error('Bitte bis zu acht Teilnehmer auswählen.');
 const ids=[...new Set(d.MitgliedIDs.map(id=>gaNeed_(id,'Mitglied',100)))];
 const ctx=gaGabNoticeContext_();let created=0,skipped=0,failed=0;
 for(const id of ids){
  const member=ctx.members.find(m=>m.ID===id);
  try{const candidate=member?gaGabNoticeCandidate_(member,ctx):null;
   if(gaGabCreateParticipantNotice_(candidate,ctx))created++;else skipped++;
  }catch(e){failed++;console.warn('GAB-Nachricht nicht erstellt:',String(e));}
 }
 try{gaLog_(u.ID,'GAB_ABSCHLUSSNACHRICHT','Mitglieder','',{MitgliedIDs:ids,Erstellt:created,Uebersprungen:skipped,Fehler:failed});}
 catch(e){console.warn('GAB-Nachrichtenprotokoll fehlgeschlagen:',String(e));}
 return {ok:failed===0,erstellt:created,uebersprungen:skipped,fehler:failed};
}
function gaNotifyGabParticipantCompleted_(m,before,after){
 if(before||!after)return '';
 try{
  const ctx=gaGabNoticeContext_(),candidate=gaGabNoticeCandidate_(m,ctx);
  if(!candidate)return '';
  if(candidate.Status==='Bereits benachrichtigt')return '';
  if(candidate.Status!=='Bereit')return ' Für dieses Mitglied konnte keine Abschlussnachricht erstellt werden: '+candidate.Status+'.';
  gaGabCreateParticipantNotice_(candidate,ctx);return '';
 }catch(e){
  console.warn('GAB-Teilnehmernachricht fehlgeschlagen:',String(e));
  return ' Der Abschluss wurde gespeichert, aber die Teilnehmernachricht konnte nicht erstellt werden. Bitte über Benachrichtigungen erneut prüfen.';
 }
}
function gaSaveAbschnittNachweis_(u,d){
 gaRequire_(u,['Administrator']);
 const id=gaNeed_(d.MitgliedID,'Mitglied',100),m=gaFind_('Mitglieder',id);
 const courseId=gaChoice_(d.KursID,['GAB-ABSCHNITT-BLOCK-A','GAB-ABSCHNITT-BLOCK-B'],'Abschnittsmodul');
 if(!m)throw new Error('Mitglied nicht vorhanden.');
 const done=d.Absolviert==='JA',passed=courseId==='GAB-ABSCHNITT-BLOCK-B'&&d.PruefungBestanden==='JA';
 const courseDate=gaDateOnly_(d.Ausbildungsdatum),examDate=gaDateOnly_(d.Pruefungsdatum);
 if(done&&!courseDate)throw new Error('Bitte Datum des Abschnittsmoduls angeben.');
 if(passed&&!done)throw new Error('Block B muss vor der bestandenen Abschlussprüfung absolviert sein.');
 if(passed&&!examDate)throw new Error('Bitte Datum der positiven Abschlussprüfung angeben.');
 const values={Absolviert:done?'JA':'NEIN',Ausbildungsdatum:done?courseDate:'',
  PruefungBestanden:passed?'JA':'NEIN',Pruefungsdatum:passed?examDate:'',
  Nachweis:gaText_(d.Nachweis,500),Notiz:gaText_(d.Notiz,700),
  BestaetigtVon:u.ID,BestaetigtAm:gaNow_()};
 const proofs=gaOptionalRows_('AbschnittNachweise'),quals=gaOptionalRows_('QualifikationMitglieder');
 const before=gaGabCompletion_(m,quals,proofs).complete;
 const existing=proofs.find(x=>x.MitgliedID===id&&x.KursID===courseId);
 if(existing)gaReplace_('AbschnittNachweise',existing.ID,values);
 else gaAppend_('AbschnittNachweise',{ID:gaId_(),MitgliedID:id,KursID:courseId,...values});
 gaLog_(u.ID,'ABSCHNITTSMODUL_NACHWEIS','Mitglied',id,{KursID:courseId,Absolviert:values.Absolviert,PruefungBestanden:values.PruefungBestanden});
 const next=proofs.filter(x=>!(x.MitgliedID===id&&x.KursID===courseId)).concat([{MitgliedID:id,KursID:courseId,...values}]);
 const after=gaGabCompletion_(m,quals,next).complete;
 const warning=gaNotifyGabCompleted_(m,before,after)+gaNotifyGabParticipantCompleted_(m,before,after)+
  (courseId==='GAB-ABSCHNITT-BLOCK-B'?gaQueueBlockBMail_(m,existing,values):'');
 return {ok:true,message:'Abschnittsmodul dokumentiert. GAB-Pflichtfortschritt wurde neu berechnet.'+warning};
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
 const quals=gaOptionalRows_('QualifikationMitglieder'),proofs=gaOptionalRows_('AbschnittNachweise');
 const before=gaGabCompletion_(m,quals,proofs).complete;
 const existing=quals.find(x=>x.MitgliedID===m.ID);
 if(existing)gaReplace_('QualifikationMitglieder',existing.ID,val);
 else gaAppend_('QualifikationMitglieder',{ID:gaId_(),MitgliedID:m.ID,...val});
 // Ein einziges maßgebliches Geburtsdatum im Mitgliedsstamm; sonst würde
 // eine Änderung im Qualifikationsformular den Altersstatus nicht aktualisieren.
 if(birth!==String(m.Geburtsdatum||''))gaReplace_('Mitglieder',m.ID,{Geburtsdatum:birth});
 gaLog_(u.ID,'QUALIFIKATION','Mitglied',m.ID,{GAB:val.GABFreigabe,GABAnerkannt:val.GABAnerkannt,ErsteHilfeStatus:status});
 const next=quals.filter(x=>x.MitgliedID!==m.ID).concat([{MitgliedID:m.ID,...val}]);
 const after=gaGabCompletion_(m,next,proofs).complete;
 const warning=gaNotifyGabCompleted_(m,before,after)+gaNotifyGabParticipantCompleted_(m,before,after);
 return {ok:true,message:'Qualifikationsnachweise gespeichert.'+warning};
}
function gaCoursePredecessors_(){
 const raw=PropertiesService.getScriptProperties().getProperty('GA_KURS_VORGAENGER');
 if(!raw)return {};
 const data=JSON.parse(raw);
 if(!data||typeof data!=='object'||Array.isArray(data))throw new Error('Kursverknüpfungen sind ungültig.');
 return data;
}
function gaSetCourseRequirement_(u,d){
 gaRequire_(u,['Administrator']);const c=gaFind_('Kurse',gaText_(d.KursID,100));
 if(!c||!gaBool_(c.Aktiv))throw new Error('Nur veröffentlichte Kurse als Pflichtmodul markieren.');
 const links=gaCoursePredecessors_();
 if(Object.prototype.hasOwnProperty.call(d,'VorgaengerID')){
  const prior=gaText_(d.VorgaengerID,100);
  if(prior){
   const previous=gaFind_('Kurse',prior);
   if(!previous||previous.ID===c.ID||previous.Bereich!==c.Bereich)throw new Error('Bitte einen anderen Kurs aus demselben Ausbildungsbereich auswählen.');
   let cursor=prior;const visited=new Set([c.ID]);
   while(cursor){if(visited.has(cursor))throw new Error('Diese Verknüpfung würde einen Kreis erzeugen.');visited.add(cursor);cursor=links[cursor]?.id||'';}
   if(links[c.ID]?.id!==prior)links[c.ID]={id:prior,bis:Utilities.formatDate(new Date(),'Europe/Vienna','yyyy-MM-dd')};
  }else delete links[c.ID];
 }
 const val={PflichtGAB:d.PflichtGAB==='JA'?'JA':'NEIN',PflichtBSW:d.PflichtBSW==='JA'?'JA':'NEIN',
  AktualisiertVon:u.ID,AktualisiertAm:gaNow_()};
 const old=gaOptionalRows_('KursAnforderungen').find(x=>x.KursID===c.ID);
 if(old)gaReplace_('KursAnforderungen',old.ID,val);
 else gaAppend_('KursAnforderungen',{ID:gaId_(),KursID:c.ID,...val});
 if(Object.prototype.hasOwnProperty.call(d,'VorgaengerID'))PropertiesService.getScriptProperties().setProperty('GA_KURS_VORGAENGER',JSON.stringify(links));
 gaLog_(u.ID,'PFLICHTMODUL','Kurs',c.ID,{...val,VorgaengerID:links[c.ID]?.id||''});return {ok:true,message:'Pflichtmodulstatus gespeichert.'};
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
 if(u.Rolle==='Teilnehmer'&&!['Administrator','Ausbilder','Fachverwaltung',GA_ADV_ROLE].includes(recipient.Rolle))
  throw new Error('Teilnehmer können Ausbilder und Verwaltung anschreiben.');
 if(u.Rolle==='Teilnehmer'&&gaIsAdvOrg_(recipient)){
  const m=gaRows_('Mitglieder').find(x=>x.Email&&x.Email.toLowerCase()===String(u.Email||'').toLowerCase());
  if(!gaAdvMemberAllowed_(m))throw new Error('Keine Zuordnung zur erweiterten Ausbildung.');
 }
 if(gaIsAdvOrg_(u)){
  const m=gaRows_('Mitglieder').find(x=>x.Email&&x.Email.toLowerCase()===String(recipient.Email||'').toLowerCase());
  if(recipient.Rolle!=='Teilnehmer'||!gaAdvMemberAllowed_(m))throw new Error('Nur zugeordnete Teilnehmer anschreibbar.');
 }
 const item={ID:gaId_(),VonBenutzerID:u.ID,AnBenutzerID:recipient.ID,Titel:gaNeed_(d.Titel,'Betreff',160),
  Text:gaNeed_(d.Text,'Nachricht',3000),ErstelltAm:gaNow_(),GelesenAm:''};
 gaAppend_('Direktnachrichten',item);
 gaNotify_(recipient.ID,'Nachricht',item.Titel,item.Text,item.ID);
 gaPushQueue_(5);
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
 if(gaIsAdvOrg_(u))gaAdvancedCourse_(u,d.KursID);
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


/** Kursquiz V1.6: Antworten ausschließlich im Apps-Script-Backend prüfen. */
function gaQuizInstalled_(){
 if(!gaSheet_().getSheetByName('QuizKurse')||!gaSheet_().getSheetByName('QuizVersuche')||!gaSheet_().getSheetByName('QuizFreigaben'))
  throw new Error('Quiz-Tabellen fehlen. Administrator: Grundausbildung → 1 · Tabellen prüfen/erstellen ausführen.');
}
function gaQuizPublicConfig_(c){
 let questions=[];try{questions=JSON.parse(c.FragenJSON||'[]');}catch(e){}
 return {ID:c.ID,KursID:c.KursID,Aktiv:c.Aktiv,Pflicht:c.Pflicht,Bestehensgrenze:Number(c.Bestehensgrenze)||80,
  MaxVersuche:Number(c.MaxVersuche)||3,ZeitlimitMinuten:Number(c.ZeitlimitMinuten)||0,
  Version:c.Version,FrageAnzahl:Array.isArray(questions)?questions.length:0,AktualisiertAm:c.AktualisiertAm};
}
function gaQuizQuestions_(data){
 if(!Array.isArray(data)||data.length<1||data.length>20)throw new Error('Bitte 1 bis 20 Quizfragen anlegen.');
 return data.map((raw,i)=>{
   const type=gaChoice_(String(raw.typ||''),['single','multi','tf','yn','match'],'Fragetyp');
   const text=gaNeed_(raw.text,'Frage '+(i+1),450);
   if(type==='match'){
     const pairs=raw.pairs;
     if(!Array.isArray(pairs)||pairs.length<2||pairs.length>6)throw new Error('Zuordnung: 2 bis 6 Paare erforderlich.');
     const valid=pairs.map(pair=>{
       if(!Array.isArray(pair)||pair.length!==2)throw new Error('Ungültiges Zuordnungspaar.');
       return [gaNeed_(pair[0],'Zuordnungsbegriff',150),gaNeed_(pair[1],'Zuordnungsantwort',150)];
     });
     if(new Set(valid.map(x=>x[1].toLowerCase())).size!==valid.length)throw new Error('Zuordnungsantworten müssen eindeutig sein.');
     return {typ:type,text,pairs:valid};
   }
   const options=type==='tf'?['Richtig','Falsch']:type==='yn'?['Ja','Nein']:(Array.isArray(raw.options)?raw.options:[]).map(s=>gaNeed_(s,'Antwortmöglichkeit',220));
   if(options.length!==(['tf','yn'].includes(type)?2:4)||new Set(options.map(x=>x.toLowerCase())).size!==options.length)
     throw new Error('Bei Auswahlfragen sind vier verschiedene Antworten erforderlich.');
   const correct=Array.isArray(raw.correct)?raw.correct.map(Number):[];
   if(!correct.length||correct.some(x=>!Number.isInteger(x)||x<0||x>=options.length)||new Set(correct).size!==correct.length)
     throw new Error('Gültige richtige Antworten für Frage '+(i+1)+' festlegen.');
   if(type!=='multi'&&correct.length!==1)throw new Error('Hier muss genau eine Antwort richtig sein.');
   if(type==='multi'&&correct.length<2)throw new Error('Mehrfachauswahl benötigt mindestens zwei richtige Antworten.');
   return {typ:type,text,options,correct:correct.slice().sort((a,b)=>a-b)};
 });
}
function gaQuizPublicQuestions_(questions){
 return questions.map((q,i)=>q.typ==='match'?
  {nr:i+1,typ:q.typ,text:q.text,left:q.pairs.map(p=>p[0]),
   right:q.pairs.map((p,j)=>({id:q.tokens[j],text:p[1]})).reverse()}:
  {nr:i+1,typ:q.typ,text:q.text,options:q.options});
}
function gaGetQuizEdit_(u,d){
 gaQuizRights_(u);gaQuizInstalled_();
 if(gaIsAdvOrg_(u))gaAdvancedCourse_(u,d.KursID);
 const c=gaOptionalRows_('QuizKurse').find(x=>x.KursID===gaNeed_(d.KursID,'Kurs-ID',100));
 if(!c)return null;
 return {...gaQuizPublicConfig_(c),GueltigAb:gaValidityConfig_().quiz[c.KursID]||'',Fragen:JSON.parse(c.FragenJSON||'[]')};
}
function gaQuizRights_(u){if(u.Rolle==='Administrator'||gaIsAdvOrg_(u))return;
 if(u.Rolle!=='Ausbilder'||!(gaCan_(u,'KurseGestalten')||gaCan_(u,'KurseBearbeiten')))
   throw new Error('Kein Recht zum Bearbeiten von Kursquiz.');
}
function gaSaveQuiz_(u,d){
 gaQuizRights_(u);gaQuizInstalled_();
 const id=gaNeed_(d.KursID,'Kurs-ID',100),course=gaFind_('Kurse',id);
 if(!course||!gaBool_(course.Aktiv))throw new Error('Kurs muss vor dem Anlegen eines Quiz veröffentlicht sein.');
 const old=gaOptionalRows_('QuizKurse').find(c=>c.KursID===id);
 const enabled=d.Aktiv===true||d.Aktiv==='JA';
 const required=enabled&&(d.Pflicht===true||d.Pflicht==='JA');
 const pass=Number(d.Bestehensgrenze),limit=Number(d.MaxVersuche),time=Number(d.ZeitlimitMinuten);
 if(!Number.isInteger(pass)||pass<50||pass>100)throw new Error('Bestehensgrenze: 50 bis 100 Prozent.');
 if(!Number.isInteger(limit)||limit<1||limit>10)throw new Error('Versuche: 1 bis 10.');
 if(!Number.isInteger(time)||time<0||time>120)throw new Error('Zeitlimit: 0 bis 120 Minuten (0 = kein Limit).');
 let questions;
 try{questions=gaQuizQuestions_(d.Fragen);}catch(e){if(!enabled&&old){questions=JSON.parse(old.FragenJSON||'[]');}else throw e;}
 const newQuestions=JSON.stringify(questions);
 const majorChange=!!old&&(old.FragenJSON!==newQuestions||Number(old.Bestehensgrenze)!==pass);
 const val={KursID:id,Aktiv:enabled?'JA':'NEIN',Pflicht:required?'JA':'NEIN',
  Bestehensgrenze:String(pass),MaxVersuche:String(limit),ZeitlimitMinuten:String(time),
  FragenJSON:newQuestions,Version:String(old?(majorChange?Number(old.Version||0)+1:Number(old.Version||1)):1),
  AktualisiertVon:u.ID,AktualisiertAm:gaNow_()};
 if(val.FragenJSON.length>36000)throw new Error('Quiz ist zu groß. Fragen kürzen.');
 const meta=gaValidityConfig_(),hasDate=Object.prototype.hasOwnProperty.call(d,'GueltigAb');
 const date=hasDate?String(d.GueltigAb||'').trim():(meta.quiz[id]||'');
 if(date&&!gaValidityValidDate_(date))throw new Error('Bitte ein gültiges Gültigkeitsdatum auswählen.');
 if(hasDate&&date)gaValidityRequireTurnDates_(course.Bereich,meta);
 const save=()=>{if(old)gaReplace_('QuizKurse',old.ID,val);else gaAppend_('QuizKurse',{ID:gaId_(),...val});};
 if(hasDate)gaValidityWithRollback_('quiz',id,date,save);else save();
 gaLog_(u.ID,'QUIZ_SPEICHERN','Kurs',id,{Aktiv:val.Aktiv,Pflicht:val.Pflicht,Version:val.Version,Fragen:questions.length});
 if(enabled){
  if(course.Bereich===GA_ADV_AREA)gaNotifyAdvancedOrganizers_('Aufgabe','Wissenstest veröffentlicht',course.Titel,id);
  // If a quiz is created after a completed course, notify those who attended.
  const quizContext=gaQuizNoticeContext_();
  const finishedIds=new Set(quizContext.terms.filter(t=>t.KursID===id&&t.Status==='Durchgeführt').map(t=>t.ID));
  const attendeeIds=new Set(quizContext.attendance.filter(a=>finishedIds.has(a.TerminID)&&gaBool_(a.Anwesend)).map(a=>a.MitgliedID));
  const emails=new Set(quizContext.members.filter(m=>attendeeIds.has(m.ID)&&gaBool_(m.Aktiv))
   .map(m=>String(m.Email||'').toLowerCase()).filter(Boolean));
  const known=gaRows_('Benachrichtigungen');
  gaRows_('Benutzer').filter(x=>x.Rolle==='Teilnehmer'&&gaBool_(x.Aktiv)&&emails.has(String(x.Email||'').toLowerCase()))
   .forEach(x=>gaNotifyQuizAvailable_(x,course,val,known,quizContext));
  gaPushQueue_(5);
 }
 return {ok:true,message:enabled?'Quiz gespeichert. Neue Quizversion '+val.Version+' ist aktiv.':'Quiz deaktiviert; bisherige Versuche bleiben erhalten.'};
}
function gaQuizMember_(u){
 gaRequire_(u,['Teilnehmer','Ausbilder','Fachverwaltung','Administrator']);
 const m=gaOwnMember_(u);
 if(!m)throw new Error('Dein Mitgliedsprofil wurde nicht gefunden.');
 return m;
}
function gaQuizEligibleTerm_(m,courseId){
 const attendance=gaRows_('Teilnahmen').filter(t=>t.MitgliedID===m.ID&&gaBool_(t.Anwesend));
 const terms=gaRows_('Termine');
 const allowed=new Set([m.TurnusID,...gaAdvAssignments_().filter(x=>x.MitgliedID===m.ID).map(x=>x.TurnusID)]);
 const term=attendance.map(a=>terms.find(t=>t.ID===a.TerminID))
  .filter(t=>t&&t.KursID===courseId&&allowed.has(t.TurnusID)&&t.Status==='Durchgeführt')
  .sort((a,b)=>String(b.Beginn).localeCompare(String(a.Beginn)))[0];
 if(!term)throw new Error('Das Quiz wird erst nach bestätigter Kursteilnahme freigeschaltet.');
 return term;
}
function gaQuizDue_(a,time){
 const start=new Date(a.BegonnenAm).getTime();
 return time>0&&(!Number.isFinite(start)||Date.now()>start+time*60000);
}
function gaQuizExtra_(memberId,courseId,version){return gaOptionalRows_('QuizFreigaben')
 .filter(x=>x.MitgliedID===memberId&&x.KursID===courseId&&x.QuizVersion===version)
 .reduce((sum,x)=>sum+Math.max(0,Number(x.ZusatzVersuche)||0),0);}
function gaQuizAttemptPublic_(row,questions,config){
 return {VersuchID:row.ID,KursID:row.KursID,Version:row.QuizVersion,
  Versuch:Number(row.Versuch),MaxVersuche:Number(config.MaxVersuche)+gaQuizExtra_(row.MitgliedID,row.KursID,row.QuizVersion),
  ZeitlimitMinuten:Number(config.ZeitlimitMinuten),BegonnenAm:row.BegonnenAm,
  Fragen:gaQuizPublicQuestions_(questions)};
}
function gaStartQuiz_(u,d){
 const m=gaQuizMember_(u);gaQuizInstalled_();
 const courseId=gaNeed_(d.KursID,'Kurs-ID',100);
 const course=gaFind_('Kurse',courseId),config=gaOptionalRows_('QuizKurse').find(c=>c.KursID===courseId&&gaBool_(c.Aktiv));
 if(!course||!gaBool_(course.Aktiv)||!config)throw new Error('Für diesen Kurs ist kein aktives Quiz vorhanden.');
 const term=gaQuizEligibleTerm_(m,courseId);
 const validity=gaValidityConfig_();
 if(gaValidityQuizDate_(validity,courseId)){
  const status=gaValidityForTerm_(course,term,validity,gaRows_('Turnusse'),'quiz');
  if(status==='unknown'||status==='unassigned')throw new Error('Für diesen Turnus fehlt ein gültiges Startdatum. Bitte die Ausbildungsleitung informieren.');
 }
 const allAttempts=gaRows_('QuizVersuche').filter(a=>a.MitgliedID===m.ID&&a.KursID===courseId);
 if(allAttempts.some(a=>gaBool_(a.Bestanden)))throw new Error('Du hast dieses Kursquiz bereits erfolgreich bestanden.');
 const list=allAttempts.filter(a=>a.QuizVersion===config.Version);
 const questions=JSON.parse(config.FragenJSON).map(q=>q.typ==='match'?{...q,tokens:q.pairs.map(()=>gaId_())}:q);
 for(const attempt of list.filter(a=>a.Status==='In Bearbeitung')){
  const snapshot=JSON.parse(attempt.FragenSnapshotJSON||'[]');
  if(!gaQuizDue_(attempt,Number(config.ZeitlimitMinuten))){
   return gaQuizAttemptPublic_(attempt,snapshot,config);
  }
  gaReplace_('QuizVersuche',attempt.ID,{Status:'Zeitüberschreitung',AbgegebenAm:gaNow_(),Bestanden:'NEIN'});
 }
 if(list.length>=Number(config.MaxVersuche)+gaQuizExtra_(m.ID,courseId,config.Version))throw new Error('Maximale Versuchszahl erreicht. Bitte Ausbilder kontaktieren.');
 const next={ID:gaId_(),KursID:courseId,MitgliedID:m.ID,TerminID:term.ID,QuizVersion:config.Version,
  Versuch:String(list.length+1),Status:'In Bearbeitung',BegonnenAm:gaNow_(),AbgegebenAm:'',
  Punkte:'',MaxPunkte:'',Prozent:'',Bestanden:'NEIN',AntwortenJSON:'',FragenSnapshotJSON:JSON.stringify(questions)};
 gaAppend_('QuizVersuche',next);
 gaLog_(u.ID,'QUIZ_START','Kurs',courseId,{MitgliedID:m.ID,Versuch:next.Versuch});
 return gaQuizAttemptPublic_(next,questions,config);
}
function gaSubmitQuiz_(u,d){
 const m=gaQuizMember_(u);gaQuizInstalled_();
 const attempt=gaFind_('QuizVersuche',gaNeed_(d.VersuchID,'Versuch',100));
 if(!attempt||attempt.MitgliedID!==m.ID||attempt.Status!=='In Bearbeitung')
  throw new Error('Dieser Quizversuch ist nicht mehr offen.');
 const config=gaOptionalRows_('QuizKurse').find(c=>c.KursID===attempt.KursID);
 if(!config||!gaBool_(config.Aktiv)||config.Version!==attempt.QuizVersion)
  throw new Error('Der Fragenkatalog hat sich geändert. Bitte das Quiz erneut öffnen.');
 gaQuizEligibleTerm_(m,attempt.KursID);
 if(gaQuizDue_(attempt,Number(config.ZeitlimitMinuten))){
  gaReplace_('QuizVersuche',attempt.ID,{Status:'Zeitüberschreitung',AbgegebenAm:gaNow_(),Bestanden:'NEIN'});
  throw new Error('Das Zeitlimit ist abgelaufen. Der Versuch wurde als nicht bestanden erfasst.');
 }
 const qs=JSON.parse(attempt.FragenSnapshotJSON||'[]');
 if(!Array.isArray(d.Antworten)||d.Antworten.length!==qs.length)
   throw new Error('Bitte alle Quizfragen beantworten.');
 let correct=0;
 for(let i=0;i<qs.length;i++){
  const q=qs[i],answer=d.Antworten[i];
  if(q.typ==='match'){
   const validTokens=new Set(q.tokens);
   if(!Array.isArray(answer)||answer.length!==q.pairs.length||answer.some(v=>typeof v!=='string'||!validTokens.has(v)))
     throw new Error('Zuordnungsfragen müssen vollständig beantwortet werden.');
   if(answer.every((v,n)=>v===q.tokens[n]))correct++;
  }else if(q.typ==='multi'){
   if(!Array.isArray(answer)||!answer.length||answer.some(v=>!Number.isInteger(v)||v<0||v>=q.options.length))
     throw new Error('Bitte bei der Mehrfachauswahl eine gültige Antwort auswählen.');
   const unique=[...new Set(answer)].sort((a,b)=>a-b);
   if(JSON.stringify(unique)===JSON.stringify(q.correct))correct++;
  }else{
   if(!Number.isInteger(answer)||answer<0||answer>=q.options.length)
     throw new Error('Bitte jede Frage beantworten.');
   if(q.correct[0]===answer)correct++;
  }
 }
 const percent=Math.round(100*correct/qs.length),passed=percent>=Number(config.Bestehensgrenze);
 const time=gaNow_();
 gaReplace_('QuizVersuche',attempt.ID,{Status:'Abgegeben',AbgegebenAm:time,
  Punkte:String(correct),MaxPunkte:String(qs.length),Prozent:String(percent),
  Bestanden:passed?'JA':'NEIN',AntwortenJSON:JSON.stringify(d.Antworten)});
 let noticeWarning='';
 const warn=()=>{noticeWarning='Dein Ergebnis ist gespeichert. Eine zusätzliche Benachrichtigung konnte nicht erstellt werden.';};
 const owner=gaRows_('Benutzer'),quizCourse=gaFind_('Kurse',attempt.KursID),quizTerm=gaFind_('Termine',attempt.TerminID);
 owner.filter(x=>gaBool_(x.Aktiv)&&(x.Rolle==='Administrator'||(x.Rolle==='Ausbilder'&&gaCan_(x,'KurseGestalten')&&gaStaffAreaAllowed_(x,quizCourse?.Bereich)&&(!quizTerm||gaStaffAreaAllowed_(x,gaFind_('Turnusse',quizTerm.TurnusID)?.Bereich)))))
  .filter(x=>x.ID!==u.ID).forEach(x=>{try{gaNotify_(x.ID,'Aufgabe','Kursquiz abgegeben',
   m.Vorname+' '+m.Nachname+': '+percent+' % ('+(passed?'bestanden':'nicht bestanden')+').',attempt.KursID);}
   catch(e){warn();console.warn('Quizbenachrichtigung fehlgeschlagen:',String(e));}});
 if(quizCourse?.Bereich===GA_ADV_AREA&&quizTerm&&gaFind_('Turnusse',quizTerm.TurnusID)?.Bereich===GA_ADV_AREA&&gaAdvAllowedMembers_(quizTerm.TurnusID).some(member=>member.ID===m.ID))
  try{gaNotifyAdvancedOrganizers_('Aufgabe','Kursquiz abgegeben',m.Vorname+' '+m.Nachname+': '+percent+' % ('+(passed?'bestanden':'nicht bestanden')+').',attempt.KursID);}
  catch(e){warn();console.warn('Quizbenachrichtigung an Organisation fehlgeschlagen:',String(e));}
 gaLog_(u.ID,'QUIZ_ABGEBEN','Kurs',attempt.KursID,{MitgliedID:m.ID,QuizVersion:attempt.QuizVersion,Prozent:percent,Bestanden:passed});
 const attempts=gaRows_('QuizVersuche').filter(x=>x.MitgliedID===m.ID&&x.KursID===attempt.KursID&&x.QuizVersion===config.Version).length;
 const submittedCourse=gaFind_('Kurse',attempt.KursID),submittedTerm=gaFind_('Termine',attempt.TerminID);
 const submittedMeta=gaValidityConfig_();
 const submittedStatus=gaValidityQuizDate_(submittedMeta,attempt.KursID)?
  gaValidityForTerm_(submittedCourse,submittedTerm,submittedMeta,gaRows_('Turnusse'),'quiz'):'applies';
 if(passed&&gaBool_(config.Pflicht)&&submittedStatus==='applies'){
  try{
   const ref='COURSEPASS:'+attempt.KursID+':'+m.ID;
   if(!gaRows_('Benachrichtigungen').some(n=>n.BenutzerID===u.ID&&n.BezugID===ref)){
    const id=gaNotify_(u.ID,'Aufgabe','Kurs bestanden – Gratulation!',
     'Du hast das Pflichtquiz bestanden und den Kurs „'+(submittedCourse?.Titel||'Ausbildung')+'“ erfolgreich abgeschlossen. Herzlichen Glückwunsch!',ref);
    try{gaPushQueue_(1,id);}catch(e){console.warn('Kursabschluss-Push wartet:',String(e));}
   }
  }catch(e){warn();console.warn('Kursabschlussbenachrichtigung fehlgeschlagen:',String(e));}
 }
 try{gaPushQueue_(5);}catch(e){console.warn('Quiz-Benachrichtigung wartet:',String(e));}
 return {ok:true,Bestanden:passed,Punkte:correct,MaxPunkte:qs.length,Prozent:percent,
   Bestehensgrenze:Number(config.Bestehensgrenze),VersucheVerbleibend:Math.max(0,Number(config.MaxVersuche)+gaQuizExtra_(m.ID,attempt.KursID,config.Version)-attempts),
   Pflicht:gaBool_(config.Pflicht)&&submittedStatus==='applies',MitteilungsHinweis:noticeWarning};
}

function gaUnlockQuiz_(u,d){
 gaQuizRights_(u);gaQuizInstalled_();
 if(gaIsAdvOrg_(u))gaAdvancedCourse_(u,d.KursID);
 const courseId=gaNeed_(d.KursID,'Kurs-ID',100),memberId=gaNeed_(d.MitgliedID,'Mitglied-ID',100);
 const member=gaFind_('Mitglieder',memberId),config=gaOptionalRows_('QuizKurse').find(x=>x.KursID===courseId&&gaBool_(x.Aktiv));
 if(!member||!gaBool_(member.Aktiv)||!config)throw new Error('Mitglied oder aktives Kursquiz nicht vorhanden.');
 const completed=gaRows_('QuizVersuche').filter(x=>x.KursID===courseId&&x.MitgliedID===memberId&&x.QuizVersion===config.Version);
 if(!completed.length)throw new Error('Dieses Mitglied hat noch keinen Quizversuch gestartet.');
 const record={ID:gaId_(),KursID:courseId,MitgliedID:memberId,QuizVersion:config.Version,
   ZusatzVersuche:'1',FreigegebenVon:u.ID,FreigegebenAm:gaNow_()};
 gaAppend_('QuizFreigaben',record);
 const participant=gaRows_('Benutzer').find(x=>x.Rolle==='Teilnehmer'&&gaBool_(x.Aktiv)&&String(x.Email||'').toLowerCase()===String(member.Email||'').toLowerCase());
 if(participant)gaNotify_(participant.ID,'Aufgabe','Neuer Quizversuch freigegeben','Für deinen Kurs wurde ein zusätzlicher Quizversuch ermöglicht.',courseId);
 gaLog_(u.ID,'QUIZ_ZUSATZVERSUCH','Kurs',courseId,{MitgliedID:memberId,QuizVersion:config.Version});
 return {ok:true,message:'Ein zusätzlicher Quizversuch wurde freigegeben.'};
}
