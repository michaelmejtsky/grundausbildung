## Fehlerprüfung 27.10.2026 – Code-Stand und erforderliche Aktivierung

- **GitHub main:** Backend-`Code.gs` abgesichert gegen Verschieben erweiterter Termine in GAB-Kurse/Turnusse; FDISK-Modul-PDF für Organisatoren enthält nur Termine ihrer erweiterten Turnusse. Schutz vor Überschreiben einer anders belegten Spaltenüberschrift.
- **Teilnehmer-App:** Ein laufender GAB-Teilnehmer sieht nach zusätzlicher Zuordnung kommende Termine der erweiterten Ausbildung auch auf der Startseite. PWA-Shell auf `ga-shell-v2.21`.
- **Tests:** 19 gezielte, isolierte Regressionstests mit Beispieldaten erfolgreich (Rollenfilter, Terminänderungen, Berichtsauswahl, GAB-Gastzuordnung, Anwesenheit, Quizfreigabe, Nachrichten). JavaScript-Syntax für Backend, Worker, Frontend und Service Worker geprüft. **Keine** produktiven Push-, PDF- oder Apps-Script-Livetests. Bestehende Google-Sheet-Daten bei der Prüfung nur gelesen.
- **Echte Tabellen:** `ErweiterteZuordnungen` (5 korrekte Spalten) und `FreieTaetigkeiten` (Spalte `Bereich`) im vorhandenen Datenblatt vorhanden. Keine Neuanlage oder Migration erforderlich.
- **Unbedingt noch notwendig:** `Code.gs` aus `main` in das **bestehende, datenbankgebundene** Apps-Script-Projekt übernehmen und die **bestehende Web-App-Bereitstellung** über „Bereitstellungen verwalten“ mit einer neuen Version aktualisieren. Keine neue Datenbank/keine neue getrennte Bereitstellung anlegen.
- **Cloudflare prüfen:** Tatsächlich im produktiven Worker verwendete `GA_SCRIPT_URL` (wenn gesetzt) muss mit genau dieser Apps-Script-`/exec`-URL übereinstimmen; sonst gilt der Fallback `DEPLOYED_SCRIPT_URL` in `cloudflare-worker.js`. GitHub-Updates veröffentlichen den Worker nicht automatisch.
- **Abnahmetest:** In „Tätigkeitsberichte“ → „Aktive PDF-Vorlage testen“ muss **Backend 1.11.0 / FDISK-DESIGN-2** erscheinen. Einen **neuen** Einzeltermin-/Modulbericht erzeugen und den Präfix `FDISK_Design2_` sowie das tatsächliche Layout prüfen. Danach Organisator + GAB-Gast mit echten Testkonten (Termine, Kurs, Quiz, Push) prüfen. Erst dann produktiv freigeben.

## Erweiterte Ausbildung – Organisator V1.11.0

Neue Hauptrolle **Organisator Erweiterte Ausbildung**: eigene Übersicht, bereichsgebundene Kurse/Kursprojekte/Freigaben, erweiterte Turnusse und Termine, Quiz, Fragebögen, Bewertungen, Qualifikationen, Tätigkeitsberichte, Mängel & Ideen und Nachrichten. Die Rechte sind im Apps-Script-Backend geprüft und erzwungen.

GAB-Mitglieder erscheinen für den Organisator zunächst nur mit ID und Namen. Die zusätzliche Zuordnung zu einem erweiterten Turnus steht in `ErweiterteZuordnungen`; ursprüngliche GAB-Turnusse und GAB-Abschlüsse bleiben unverändert. GAB-Gäste können auch vor ihrem GAB-Abschluss an erweiterten Modulen teilnehmen. Das eingeladene Mitglied erhält die Nachricht per registriertem Zugang; die E-Mail des GAB-Gasts wird dem Organisator nicht offenbart.

Nachrichten einzeln, für einen erweiterten Turnus oder für alle zugeordneten Teilnehmer. Persönliche Antworten sind ebenfalls möglich. Push wird bei persönlichen Nachrichten, neuen Terminen, Quizverfügbarkeit und Kursabschluss erzeugt, sofern Geräte und Push-Einstellungen es erlauben.

**Deployment:** Die neueste `Code.gs` muss im vorhandenen, an die Ausbildungsdatenbank gebundenen Apps Script als neue Version der **bestehenden** `/exec`-Bereitstellung veröffentlicht werden. GitHub Pages liefert nur die Oberfläche. Das neue Tabellenblatt `ErweiterteZuordnungen` und die Spalte `Bereich` in `FreieTaetigkeiten` wurden bereits in der bestehenden Ausbildungs-Google-Tabelle erstellt.

**Alte PDF-Version:** Cloudflare Worker benutzt `env.GA_SCRIPT_URL || DEPLOYED_SCRIPT_URL`. Eine gesetzte Worker-Variable `GA_SCRIPT_URL` kann auf eine alte Apps-Script-Bereitstellung zeigen. Im Cloudflare-Dashboard Ziel-`/exec` mit dem tatsächlich neu bereitgestellten Apps Script abgleichen. Weder Apps-Script- noch GitHub-Veröffentlichung allein ändern eine Cloudflare-Umgebungsvariable.

Teststand: unabhängige Testpersonen für GAB und erweiterte Ausbildung, blockierte GAB-Zugriffe, nicht destruktive GAB-Gast-Zuordnung, Anwesenheiten, Nachrichten und Push-Ereignisse geprüft. Produktive PDF- und Push-Zustellung nach Apps-Script-/Worker-Veröffentlichung nicht verifiziert.

## Erweiterte Ausbildung – Organisatorrolle V1.11.0 (27.10.2026)

- Neue eigenständige Hauptrolle **Organisator Erweiterte Ausbildung**, im Administratorbereich **Zugänge & Rollen** auswählbar. Der Organisator erhält eine separate Oberfläche mit Übersicht, Teilnehmer-/Gastverwaltung, Einladungen, Kurskatalog/-projekten, Quiz, Turnussen, Terminen, Tätigkeitserfassung/PDF, Bewertungen/Fragebögen, Nachrichten, Mängel & Ideen.
- Berechtigung und Datenfilter serverseitig: nur `Bereich = Erweiterte Ausbildung`. Daten/Module/Termine/Qualifikationen der GAB werden nicht als vollständige Datensätze geliefert. Für die mögliche Gastzuordnung enthält `gabNamen` nur `ID, Vorname, Nachname`; keine E-Mails, Telefonnummern, Geburtsdaten, Standesbuchnummern, Checklisten oder GAB-Abschlüsse.
- Neue Zuordnungstabelle **`ErweiterteZuordnungen`**: GAB-Mitglieder bleiben mit ihrem bisherigen Mitgliedsprofil und GAB-Turnus erhalten und können parallel einem erweiterten Turnus zugeordnet werden, auch wenn die GAB noch offen ist. Die Zuordnung erlaubt Kursanwesenheit, Terminanzeige und Wissenstest in der erweiterten Ausbildung. Der bisherige Status wird weder verschoben noch automatisch als abgeschlossen markiert. Tabelle in der bestehenden Google-Sheets-Datenbasis bereits angelegt.
- Freie Tätigkeiten erhalten eine `Bereich`-Spalte; bestehende Datensätze bleiben bestehen. Der Organisator sieht seine erweiterten Tätigkeiten, nicht die bisherigen allgemeinen/GAB-Berichte. Die neue Header-Spalte wurde bereits im bestehenden Sheet angelegt.
- Nachrichten an einen erweiterten Turnus, einzelne zugeordnete Mitglieder oder alle zugeordneten Mitglieder. Bei zugeordneten GAB-Gästen löst nur das Backend die registrierte E-Mail auf; die Organisatoroberfläche zeigt diese nicht an. Push wird entsprechend den vorhandenen individuellen Pushregeln für neue Nachrichten, Termine, Quizfreigaben und Kursabschlüsse eingeplant. Zustellung setzt aktive Teilnehmerkonten, registrierte Geräte und Push-Berechtigung voraus.
- Der Organisator darf neue Erweiterte-Kursprojekte verwalten, die dazugehörigen Kurse freigeben und Termine veröffentlichen, Erweiterte-Quiz und Bewertungsfragebögen erstellen, Kursergebnisse ansehen und Mängel/Ideen des erweiterten Bereichs bearbeiten. GAB-Kurs-/Teilnehmer-/Turnusänderungen werden serverseitig abgewiesen.
- **Aktivierung**: GitHub Pages liefert die UI, aber der Nutzer muss die neue `Code.gs` im bereits an die bestehende Datenbasis gebundenen Apps-Script-Projekt als neue Version der **bestehenden Web-App-Bereitstellung** veröffentlichen. Ein komplett neues Deployment wird vom Cloudflare-Worker nicht automatisch verwendet. Unter Cloudflare Worker > Settings > Variables and Secrets die tatsächlich verwendete `GA_SCRIPT_URL` (falls vorhanden) mit der aktiven `/exec`-URL abgleichen. Worker-Fallback liegt in `cloudflare-worker.js`; dieses Repositoryfile aktualisiert den laufenden Worker nicht automatisch. In der App unter Tätigkeitsberichte → Aktive PDF-Vorlage testen muss das Backend `FDISK-DESIGN-2` melden. Der Dateiname neuer PDFs beginnt mit `FDISK_Design2_`.
- **Status**: GitHub-Code und Google-Sheet-Struktur wurden angepasst; produktive Apps-Script-/Cloudflare-Installation sowie reale Pushzustellung mit unterschiedlichen Rollen nach Deployment getrennt prüfen. Keine Userkonten wurden automatisch in die neue Rolle geändert oder Einladungen ausgelöst.

## PDF-Diagnose V1.10.2 – neue oder alte Apps-Script-Bereitstellung feststellen

Der Kurs-PDF-Button ruft `gaApi('exportTrainingPdf')` über die bestehende Cloudflare-Worker-/Apps-Script-Verbindung auf. Die neue serverseitige PDF-Vorlage ist seit V1.10.1 vorhanden, aber der Client kann nicht erkennen, ob der Worker noch mit einem älteren `/exec`-Deployment verbunden ist. Deshalb gibt es jetzt unter **Tätigkeitsberichte → Aktive PDF-Vorlage testen** eine Backend-Prüfung über `gaApi('pdfTemplateInfo')`. Der Server antwortet ab V1.10.2 mit `{backendVersion:'1.10.2',template:'FDISK-DESIGN-2'}`. Alte Bereitstellungen zeigen einen entsprechenden Warnhinweis.

Neu generierte Kurs- und Tätigkeits-PDFs bekommen den eindeutigen Dateinamen-Präfix `FDISK_Design2_` sowie einen Footer `FDISK-BERICHTSDESIGN 2.0` und eine API-Rückgabe `pdfDesign:'FDISK-DESIGN-2'`. Fehlt diese Rückgabe beim tatsächlichen PDF-Download, war die PDF-Vorlage im verbundenen Backend noch alt; die App weist deutlich darauf hin, statt einen alten Export als neues Design auszugeben.

**Wichtig für die Fehleranalyse:** Die Datei `cloudflare-worker.js` enthält als Fallback `DEPLOYED_SCRIPT_URL`. Der tatsächlich laufende Worker kann stattdessen die Umgebungsvariable `GA_SCRIPT_URL` verwenden. Beide Varianten erfordern die **passende bestehende Apps-Script-Bereitstellung** mit einer neuen Version; das Erstellen einer ganz neuen, separaten Bereitstellung ändert nicht automatisch den Worker-Zielendpunkt. Keine Datenbanktabellen oder bestehenden Datensätze müssen angepasst werden.

## PDF-Berichtsvorlagen V1.10.1 – strukturiertes Feuerwehr-Layout

Die bestehenden serverseitigen Funktionen `gaExportTrainingPdf_` und `gaExportFreeActivityPdf_` erzeugen ab dieser Version im **bestehenden Google Apps Script** einen einheitlichen FDISK-Auszug mit: dunkelblauem Feuerwehr-Kopfbereich, großem Titel, Stammdatenfeldern, vier hervorgehobenen Kennzahlen (Tätigkeitsdauer, Teilnehmerstunden, Ausbilderstunden, Fahrzeugkilometer), nummerierten Abschnitten und farbig wechselnden Tabellenzeilen. Mehrere Termine desselben Moduls erhalten zusätzlich eine Personen-/Fahrzeug-Summenübersicht und die zugehörigen Termin-Details.

Berichte ohne vollständige Ist-Zeiten bleiben weiterhin abrufbar, sind aber ausdrücklich **VORLÄUFIG / UNVOLLSTÄNDIG** und enthalten keine erfundenen Leistungswerte. Teilnehmer-, Ausbilder-, Fahrzeug- und Zeitdaten werden unverändert aus den bisherigen Tabellen gelesen. Die Vorlage benötigt keine neuen Tabellen oder Datenmigration. Das Frontend sendet weiter dieselben API-Aktionen (`exportTrainingPdf`, `exportFreeActivityPdf`).

**Aktivierung:** Die neueste `Code.gs` in das vorhandene, an die bisherige Ausbildungs-Google-Tabelle gebundene Apps Script übernehmen und die *bestehende* Web-App-Bereitstellung über „Neue Version“ aktualisieren. **GitHub-Pages-Deploy allein tauscht die PDF-Vorlage nicht aus.** Eine beispielhafte Gestaltungsvorschau mit ausschließlich Demo-Daten ist keine produktive PDF aus Apps Script und dient nur zur visuellen Orientierung.

**Tests:** Funktionsaufrufe mit simuliertem Google-Docs-/Drive-Dienst für Modulauszug, Einzeltermin, freie Tätigkeit und vorläufigen PDF-Bericht ohne Ist-Stunden erfolgreich. Live-Google-Docs-Rendering und das produktive PDF-Konvertierungsergebnis müssen nach Aktualisierung von Apps Script auf einem echten Termin geprüft werden.

## Kurs öffnen, Abschlussdokumentation und freie Tätigkeiten – V1.10.0

**Zwei getrennte Abläufe:** Unter **Termine → Kurs öffnen & Präsentation** wird der Ausbildungsinhalt und der Präsentationslink sofort angezeigt. Der Abschnitt „Ausbildung abschließen“ ist einklappbar und fordert bei Abschluss anwesende Teilnehmer, tatsächlichen Beginn und Ende, mitwirkende Ausbilder und *nur bei ausgewählter Fahrzeugverwendung* die Fahrzeuge samt Kilometern. Einladungen müssen für die Dokumentation eines tatsächlich mitwirkenden Ausbilders noch nicht akzeptiert sein. Die Anmeldung in der App bleibt bis zur Einladungserledigung gesperrt.

**Ohne Kurs:** Unter **Freie Tätigkeiten** können Ausbilder/Administratoren eine Tätigkeit direkt mit Titel, Art (Ausbildung/Übung/Diensttätigkeit/Sonstige), Ort, Ist-Zeiten, beteiligten Mitgliedern, mitwirkenden Ausbildern, optionalen Fahrzeugen und Notizen erfassen. Sie verändert keine Kursteilnahmen oder GAB-Kursabschlüsse. Die Daten liegen in der neuen Tabelle `FreieTaetigkeiten` derselben Ausbildungs-Datenbasis.

**PDF:** Ein vollständiger FDISK-Tätigkeitsbericht steht pro dokumentiertem Termin oder freier Tätigkeit zum Herunterladen bereit. Ein Termin/Modul ohne bereits erfasste Ist-Zeiten liefert nun einen explizit als **vorläufig/unvollständig** gekennzeichneten PDF-Auszug mit den geplanten Terminen, niemals erfundene Stunden. Dokumentierte Stunden und Kilometer werden weiterhin nur aus bestätigten Berichten summiert. Die PDF-Erzeugung setzt Apps-Script-Berechtigungen für Docs/Drive voraus.

**Produktiv stellen:** GitHub Pages liefert die Oberfläche automatisch. Die **aktuelle Code.gs** muss zusätzlich im bestehenden, an die Google-Tabelle gebundenen Apps-Script-Projekt gespeichert und über die bestehende Web-App-Bereitstellung als **Neue Version** veröffentlicht werden. Die Tabelle `FreieTaetigkeiten` wurde bereits in der bestehenden Datenbasis erstellt. Kein neues Apps-Script-Projekt und keine neue Datenbank anlegen.

**Teststand:** Frontend-JavaScript auf Syntax geprüft; Probedaten mit eingeladenem Ausbilder, zweistündiger freier Tätigkeit, Fahrzeugkilometern, vollständiger Kursdokumentation und PDF-Ausgabe ohne bestehende Stunden bestanden. Ein produktiver PDF-Export über den authentifizierten Worker muss nach dem Apps-Script-Deploy gesondert getestet werden.

## Ausbildungs-Tätigkeitsberichte für FDISK (V1.9.0)

- **Ausbilder / Administrator → Durchführung:** Ein bereits geplanter Ausbildungstermin erhält tatsächliche Beginn-/Enduhrzeit (getrennt vom geplanten Termin), anwesende Mitglieder, mitwirkende Ausbilder, beliebig viele bis maximal zwölf benannte Fahrzeuge mit je km und eine optionale Bemerkung.
- Ein Ausbilder muss selbst unter den mitwirkenden Ausbildern angehakt sein. Zeiten und Kilometer werden vor dem Speichern geprüft; eine neue Bestätigung korrigiert denselben Datensatz statt Duplikate anzulegen.
- **Ausbilder / Administrator → Tätigkeitsberichte:** Modulstatistik und pro Termin wie pro Modul erzeugbare PDF-Datenauszüge für die manuelle Übertragung in FDISK. Summiert Ausbildungsdauer, Teilnehmerstunden, Ausbilderstunden und Kilometer je Fahrzeug. Anwesende Teilnehmer und mitwirkende Ausbilder erhalten jeweils die volle Termindauer; individuell abweichende Anwesenheitszeiten werden nicht separat erfasst.
- **Zusätzliches Google-Sheets-Blatt:** `Ausbildungsberichte` mit den Feldern `ID`, `TerminID`, `BeginnIst`, `EndeIst`, `DauerMinuten`, `FahrzeugeJSON`, `AusbilderIDs`, `Notiz`, `ErfasstVon`, `AktualisiertAm`. Das Blatt wurde in der bestehenden Ausbildungs-Datenbasis bereits erstellt; alternativ ist der nicht-destruktive Menüpunkt **Grundausbildung → 7 · Tätigkeitsberichte einrichten** in Apps Script verfügbar.
- PDF-Export erfordert Apps-Script-Berechtigungen für **Google Docs und Drive**, weil das System für die PDF-Konvertierung ein temporäres Google-Docs-Dokument erzeugt und danach in den Papierkorb verschiebt. Keine PDF-Datei wird dauerhaft als Ausbildungsnachweis archiviert; der heruntergeladene Auszug ist ein manueller Export.
- **Deployment:** GitHub Pages aktualisiert nur das Frontend. Damit Speichern, Auswertung und PDF arbeiten, die `Code.gs` im *bestehenden* Apps-Script-Projekt aktualisieren und die **bestehende Web-App-Bereitstellung** auf eine neue Version setzen. Nicht dieselben Daten in ein neues Sheet übertragen.
- Alte, bereits bestätigte Anwesenheiten bleiben erhalten. Für FDISK-Summen zählen aber erst Termine mit einem vollständigen Tätigkeitsbericht und Ist-Zeiten. Sie können nachträglich ergänzt werden; unvollständige Termine werden sichtbar angezeigt.
- Vor produktiver Nutzung mit einem Testtermin Speichern, erneutes Bearbeiten und echten PDF-Download prüfen. Ein JS-/Mock-Test ersetzt die Freigabe der produktiven Apps-Script-Berechtigungen nicht.

## Version 1.8.0 – Rollen, Passwortreset, Quiz- und Sitzungstabellen (26.10.2026)

**Einmalige Aktualisierung des vorhandenen Apps Scripts:** `Code.gs` aus dem Repository komplett in das bisherige, **an die Ausbildungs-Google-Tabelle gebundene** Apps-Script-Projekt übernehmen. Das Originalprojekt und die bestehende Web-App-`/exec`-Bereitstellung beibehalten. Die Web-App über **Bereitstellen → Bereitstellungen verwalten → Bearbeiten → Neue Version** aktualisieren. Die zugehörige Google-Tabelle neu laden und **Grundausbildung → 6 · Login- und Quiz-Tabellen einrichten** ausführen (oder im Skripteditor `gaErweiterungenEinrichten` direkt starten und Berechtigungen erteilen).

Der neue Menüpunkt richtet ausschließlich diese privaten Google-Sheets-Blätter idempotent ein: `Sitzungen` (30-Tage-Anmeldung), `QuizKurse` (Quiz-Fragen und Konfiguration), `QuizVersuche` (Quiz-Antworten/Ergebnisse), `QuizFreigaben` (zusätzliche Quizversuche). Er ändert keine bestehenden Kurs- und Mitgliederdaten, erstellt keine Demo-Kurse und überschreibt keine abweichenden Tabellenüberschriften.

**Zugänge & Rollen:** Administratoren wählen einen vorhandenen aktiven oder eingeladenen Benutzer aus und vergeben die Hauptrolle `Teilnehmer`, `Ausbilder`, `Fachverwaltung` oder `Administrator` mit einem Fachverwaltungsbereich (Zeugkammer, Administration, IT, Ausbildungsleitung). Das bestehende Benutzerkonto, E-Mail/Passwort und das unabhängig geführte Mitgliedsprofil bleiben erhalten. Ein ehemaliger Teilnehmer kann Ausbilder werden, ohne neu eingeladen zu werden oder frühere Ausbildungsnachweise zu verlieren. Die eigene Ausbildung wird bei mit der E-Mail verknüpftem Mitglied weiterhin angezeigt. Für einen Ausbilder werden konkrete Rechte separat im Menü `Ausbilderrechte` vergeben. Die frühere Rechtevergabe wird beim erneuten Wechsel in die Ausbilderrolle zurückgesetzt, damit alte Rechte nicht unerwartet wieder aufleben. Ein Administrator kann nicht den letzten aktiven Administrator herabstufen.

**Passwort vergessen:** Neben dem bereits vorhandenen Admin-Reset im Menü `Zugänge & Rollen` gibt es auf dem Login-Bildschirm einen persönlichen Reset-Link per E-Mail. Die neue öffentliche API-Methode `gaRequestPasswordReset` ist auf neutralen Antworttext und eine Anfrage pro E-Mail/Stunde ausgelegt. Der Link ist einmalig und 30 Minuten gültig. Für diesen neuen Login-Button muss zusätzlich die aktuelle `cloudflare-worker.js` im bestehenden Cloudflare Worker **tatsächlich bereitgestellt** werden. GitHub Pages allein aktualisiert Cloudflare und Apps Script nicht automatisch; die produktiven Secrets müssen unverändert bleiben.

**30-Tage-Anmeldung:** Nur mit aktiviertem Häkchen. Der Browser speichert ein zeitlich begrenztes Sitzungstoken; Google Sheets speichert dessen Hash. Abmelden, Passwortänderung oder Kontosperrung beenden den Zugriff. Auf gemeinsam genutzten Geräten nicht nutzen.

**Freigabe-Status:** Frontend und Github-Quellcode sind implementiert. Erst nach Apps-Script- und für den öffentlichen Reset nach Cloudflare-Deployment sind alle Funktionen im produktiven Backend aktiv.

---
## Verwaltungsübersicht, GAB-Bestätigung und 30-Tage-Anmeldung – V1.7.0

**Stand: 26. Oktober 2026.** Implementiert in GitHub `main`: Gruppierte Navigation mit mobilem Seitenmenü, übersichtliches Admin-Dashboard, gefilterte Mitgliederlisten, nach Turnus/Status filterbare Checklisten und individuelle Qualifikationsformulare. Bei zahlreichen Mitgliedern werden nicht länger sämtliche Editierformulare gleichzeitig geöffnet. Die bestehenden Datensätze bleiben unverändert.

**GAB-Bestätigung:** Der Administrator kann unter **Qualifikationen → Mitglied auswählen** „GAB abgeschlossen und durch die Ausbildungsleitung bestätigt“ aktivieren. Nach Speicherung zählt der GAB-Abschluss auch dann als bestätigt, wenn einzelne GAB-Pflichtmodule noch nicht vollständig nacherfasst wurden. Diese Lücken bleiben als Warnhinweis und in den Pflichtmodulen sichtbar. Bei der BSW-Freigabe gelten weiterhin GAB, BSW-Modul und Altersvoraussetzung. Der Bestätigende wird protokolliert. Dies ist eine ausdrückliche administrative Freigabe, kein automatischer Nachweis über Kursbesuch.

**30-Tage-Anmeldung:** Im Login ist „30 Tage angemeldet bleiben“ optional. Bei Aktivierung erhält der Browser eine zufällige Sitzungskennung mit Ablaufdatum. Serverseitig liegt **nur ein Hash der Kennung** in der neuen privaten Google-Sheets-Tabelle `Sitzungen` (kein Passwort, kein Klartext-Token). Die Sitzung endet bei Logout, Passwortänderung, Kontodeaktivierung oder spätestens nach 30 Tagen. Auf gemeinsam benutzten Geräten nicht einschalten. Ohne Häkchen bleibt die bisherige Kurzsitzung (bis zu 6 Stunden, nicht dauerhaft im Browser gespeichert).

**Pflicht für den Livebetrieb:** Ein GitHub-Pages-Deploy aktualisiert **nur die Oberfläche**. Die aktuelle [Code.gs](https://github.com/michaelmejtsky/grundausbildung/blob/main/Code.gs) im *bestehenden* Apps-Script-Projekt der privaten Ausbildungs-Google-Tabelle vollständig übernehmen und über **Bereitstellungen verwalten → Neue Version → Bereitstellen** aktualisieren. Danach im Tabellenmenü **Grundausbildung → 1 · Tabellen prüfen/erstellen** ausführen, damit die zusätzliche Tabelle `Sitzungen` erstellt wird. Keine bestehenden Tabellen oder Bereitstellungslinks löschen. Bis zur Backend-Aktualisierung bleibt die neue 30-Tage-Anmeldung nicht verfügbar und die alte GAB-Berechnung in der laufenden App maßgeblich.

**Prüfung:** JavaScript-Syntax, Listen mit 120 Mitgliedern/840 Checklisten-Zeilen, manuelle GAB-Freigabe sowie die Logik für Wiederanmeldung nach Cache-Ablauf und Widerruf wurden mit Testdaten geprüft. Ein echter End-to-End-Test der Google-Apps-Script-Bereitstellung muss nach dem Live-Update erfolgen.

## Kursquiz – V1.6.0 (26.10.2026)

- **Quizverwaltung:** Administratoren und Ausbilder mit Kursgestaltungs-/Bearbeitungsrecht können für jeden veröffentlichten Kurs einen Wissenstest mit 1–20 Fragen speichern.
- Fragetypen: eine richtige Antwort, mehrere richtige Antworten, Richtig/Falsch und Zuordnung. Bestehensgrenze (50–100 %), Versuchslimit (1–10) und Zeitlimit (0–120 Minuten) sind einstellbar.
- **Teilnehmer:** Das Quiz ist erst nach bestätigter Kursteilnahme erreichbar. Pflichtquiz gilt für den vollständigen Pflichtmodul-Abschluss erst als absolviert, wenn die aktuelle Quizversion bestanden wurde. Freiwillige Quiz ändern die bisherige Abschlusswertung nicht.
- **Datenschutz/Sicherheit:** Richtige Lösungen bleiben ausschließlich auf dem Apps-Script-Backend; die PWA erhält nur Fragen ohne Lösungsschlüssel. Jeder gestartete Versuch, Punktestand und Antwort-Snapshot wird in privaten Sheets dokumentiert. Ausbilder mit Quiz-Bearbeitungsrecht können einen zusätzlichen Versuch vergeben, ohne frühere Versuche zu löschen. Admins/Ausbilder sehen eine Ergebnisübersicht; die eigenen Ergebnisse sind im Teilnehmerkonto sichtbar.
- **Wichtig:** GitHub Pages veröffentlicht die neue Oberfläche automatisch, **nicht** den Apps-Script-Server. Die aktuelle `Code.gs` muss im bestehenden an die private Ausbildungs-Tabelle gebundenen Apps Script eingespielt und über `Bereitstellungen verwalten → Neue Version` veröffentlicht werden. Danach im Tabellenmenü **Grundausbildung → 1 · Tabellen prüfen/erstellen** einmal ausführen, um die neuen Blätter `QuizKurse`, `QuizVersuche` und `QuizFreigaben` ohne Löschen vorhandener Daten anzulegen. Danach ist die Funktion in der PWA nutzbar.
- Vor produktiver Verwendung mit einem Test-Ausbilder und einem Test-Teilnehmer prüfen. Werden bereits abgeschlossene Kurse nachträglich als Pflichtquiz aktiviert, können vorhandene Pflichtmodul-Freigaben bis zum neuen Quizabschluss vorübergehend als offen angezeigt werden. Deshalb diese Entscheidung bewusst treffen.

## V1.5.5 – Erste-Hilfe-Bescheinigungen (PDF, Teilnehmer/Admin, E-Mail)

- **Teilnehmer:** „Mein Ausbildungsstand“ → Erste-Hilfe-Nachweis: Kursdatum, Stunden (0,5–80 in 0,5-Schritten), PDF bis **4 MB** einreichen. Einreichungen und eigene PDFs bleiben im Profil lesbar. Die letzte Einreichung kann korrigiert werden (Datum/Stunden, PDF optional austauschen); alte Versionen bleiben erhalten.
- **Administrator:** „Qualifikationen“ → Erste-Hilfe-Nachweise für jedes aktive Mitglied selbst hochladen, Daten korrigieren und Dokumente prüfen/bestätigen/mit Begründung ablehnen. Erst die Admin-Bestätigung setzt die Erste-Hilfe-Qualifikation auf „Bestätigt“. Die Checkliste „Bescheinigung abgegeben“ wird bereits bei Einreichung erledigt.
- **E-Mail-Weiterleitung:** Unter „Qualifikationen → E-Mail-Weiterleitung“ als Admin eine **feste Empfängeradresse** wählen und die automatische Weiterleitung einschalten. Bei Teilnehmer-Uploads geht die E-Mail dann automatisch mit Name, Kontakt, Turnus, Standesbuchnummer, Kursdatum, Stundenausmaß **und PDF als Anhang** hinaus. Admin kann Versand bei eigenem Upload abwählen und einzelne gespeicherte Nachweise erneut senden. Versandstatus wird am Eintrag gezeigt. Ohne aktivierte Weiterleitung erfolgt kein E-Mail-Versand.
- **Datenschutz:** PDFs werden privat in einem neu angelegten Google-Drive-Ordner des Apps-Script-Eigentümers gespeichert (Folder-ID in Script Properties `GA_ERSTE_HILFE_FOLDER_ID`); keine Freigabelinks. Ein Teilnehmer darf nur seine eigenen PDFs abrufen. Dokumentänderungen und Prüferentscheidungen werden protokolliert. Empfängeradresse und Versandkonfiguration werden ausschließlich serverseitig gespeichert.
- **Datenbestand:** Eine neue Tabelle `ErsteHilfeNachweise` wird angelegt. Bestehende Stammdaten, Teilnahmen, Qualifikationen und Push-Registrierungen werden nicht überschrieben.

**Zur Inbetriebnahme (alle Schritte erforderlich):**
1. GitHub Pages aktualisiert `index.html`, `aid-ui.js` und `public/` automatisch, sofern das Repository wie bisher veröffentlicht wird.
2. Die aktuelle [Code.gs](https://github.com/michaelmejtsky/grundausbildung/blob/main/Code.gs) **vollständig** ins **bestehende, an die Grundausbildungs-Tabelle gebundene Apps Script** übernehmen. Im Spreadsheet-Menü **Grundausbildung → 1 · Tabellen prüfen/erstellen** einmal ausführen; die neuen Drive-/E-Mail-Berechtigungen bei Bedarf bestätigen. **Kein neues Sheet oder Apps-Script-Projekt erstellen.**
3. Im Apps Script die **bestehende** Web-App-Bereitstellung bearbeiten → **Neue Version** → Bereitstellen. Die vorhandene `/exec`-URL und Skripteigenschaften nicht ändern.
4. Die geänderte [cloudflare-worker.js](https://github.com/michaelmejtsky/grundausbildung/blob/main/cloudflare-worker.js) beim **bestehenden Cloudflare-Worker** bereitstellen (oder die verbundene Pipeline laufen lassen), damit PDF-Nachrichten bis 4 MB statt der bisherigen kleinen Payload-Grenze durchgehen. **VAPID- und GA_WORKER_SECRET-Schlüssel weder löschen noch neu generieren.**
5. In der Admin-App unter **Qualifikationen** die Empfängeradresse hinterlegen und den E-Mail-Versand bei Bedarf aktivieren. Eine PDF-Testbescheinigung mit einem nichtsensiblen Test-Mitglied prüfen: speichern → in der App ansehen → E-Mail samt Anhang → Admin-Bestätigung → Teilnehmeransicht prüfen.

**Status:** GitHub-Quellcode ist implementiert und syntaktisch geprüft; die produktiven Apps-Script-/Cloudflare-Bereitstellungen und der Ende-zu-Ende-Test mit echtem PDF müssen noch durchgeführt werden.

---

## Cloudflare-Production-Variablen gegen Verlust bei Deploy absichern

Die Produktionskonfiguration in `wrangler.jsonc` enthält jetzt `keep_vars: true` und eine Pflichtprüfung für die verschlüsselten Secrets `GA_WORKER_SECRET` und `VAPID_PRIVATE_JWK`. Wrangler kann damit **bei Nutzung genau dieser Wrangler-Datei** normale Dashboard-Variablen bei künftigen Deployments beibehalten und Deployments ohne die beiden erforderlichen Secrets verweigern. Cloudflare-Worker-Secrets selbst sollten laut Dokumentation bereits standardmäßig erhalten bleiben; falls sie trotzdem fehlen, Deployment-Historie und Production/Previews sowie Worker-Namen vergleichen. Eine nicht verwendete `wrangler.jsonc` schützt die Worker-Bereitstellung nicht.

Wichtige Production-Bindings im Worker `grundausbildung` (kein Wert darf im GitHub-Repository stehen):

| Name | Typ | Herkunft |
| --- | --- | --- |
| `GA_WORKER_SECRET` | Secret | Muss **exakt** der Skripteigenschaft `GA_WORKER_SECRET` im bestehenden Google Apps Script entsprechen |
| `VAPID_PRIVATE_JWK` | Secret | Privater Teil des vorhandenen VAPID-Paars, nicht aus öffentlichen Informationen rekonstruierbar |
| `VAPID_PUBLIC_KEY` | Text | Öffentlicher Teil **desselben** VAPID-Paars |
| `VAPID_SUBJECT` | Text | `mailto:` + tatsächliche verantwortliche E-Mail-Adresse |
| `GA_SCRIPT_URL` | Text, optional | Nur nötig, falls vom im Worker hinterlegten Apps-Script-Link abgewichen wird |

Cloudflare: Workers & Pages → `grundausbildung` → Settings → Variables and Secrets → **Production**. Werte setzen → **Deploy**. Bei bereits aktivem Gerät nach Austausch des VAPID-Schlüsselpaares Push neu anmelden. Keine Secrets in Chats, Screenshots, Commits oder Browser-URLs kopieren. Nach dem Deployment in der App unter Benachrichtigungen → Cloudflare-Push prüfen → Push aktivieren → Test-Benachrichtigung senden.

Prüfen, dass alle GitHub-/CI-Deploys **dieselbe `wrangler.jsonc`** benutzen. Für ältere oder manuelle Cloudflare-Editor-Deployments kann das Vorhandensein der GitHub-Datei allein die Variablen nicht schützen.

## V1.5.4 – Push-Test für alle und Nachrichten vollständig lesen

- **Benachrichtigungen → Test-Benachrichtigung senden** ist für alle angemeldeten Benutzer zugänglich. Die Aktion verschickt eine eigene neue Testnachricht **sofort**, statt ältere Warteschlangeneinträge zuerst abzuarbeiten. Das Backend meldet transparent, ob der Push-Dienst den Versand akzeptiert hat oder ob kein Gerät registriert bzw. die Zustellung fehlgeschlagen ist. Die Annahme durch den Push-Dienst garantiert allein noch keine Anzeige durch das Betriebssystem.
- **Push aktivieren** zeigt nun eine dauerhaft sichtbare Rückmeldung im Benachrichtigungsbereich mit Registrierungsschritten, Ergebnissen und möglichen Fehlern. Bei geändertem öffentlichem VAPID-Schlüssel meldet sich ein vorhandenes Gerät mit neuem Push-Abonnement an.
- **Nachrichten** und **Benachrichtigungen** haben aufklappbare Titel mit voller, umbrechender Textanzeige statt eines nur sichtbaren Ausschnitts. Neue Rundnachrichten und Direktnachrichten speichern ihren vollständigen Text auch in der zugehörigen In-App-Benachrichtigung; die systemseitige Push-Vorschau bleibt bewusst kurz.
- Push-Klicks öffnen nach Möglichkeit die vollständige passende In-App-Benachrichtigung (bereits laufende App: direkt; zuvor geschlossene App: nach Anmeldung). Das neue Service-Worker-Verhalten nutzt auch die `tag`-Kennung der vorhandenen Cloudflare-Worker-Version, daher muss Cloudflare **nicht** für dieses Update neu veröffentlicht werden.
- **Deployment erforderlich:** Neue `Code.gs` V1.5.4 ins **bestehende** Apps-Script-Projekt kopieren und unter „Bereitstellungen verwalten“ als neue Version aktualisieren. GitHub Pages aktualisiert die Oberfläche, aber nicht automatisch den produktiven Apps-Script-Backend-Code. Die Push-Cloudflare-Secrets bitte unverändert lassen.
- Für einen echten Test: Handy-App starten → unter Benachrichtigungen **Push aktivieren** → Erfolgsmeldung und registriertes Gerät prüfen → **Test-Benachrichtigung senden** → App verlassen/sperren → Push und Antippen der Mitteilung prüfen.

## Push-Diagnose mit Einzelprüfung (v2)

Bei der Meldung, dass Cloudflare-Push nicht vollständig eingerichtet sei: Die App selbst erreicht dann bereits die Worker-Statusabfrage; mindestens ein VAPID-Feld wird vom **veröffentlichten** Worker nicht als gültig erkannt. In der App unter **Benachrichtigungen → Cloudflare-Push prüfen** zeigt die neue Worker-Version ohne Preisgabe von Schlüsseln, ob `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_JWK` und `VAPID_SUBJECT` vorhanden, syntaktisch gültig und als Schlüsselpaar konsistent sind. Bei Meldung „alte Diagnose“ ist noch eine vorige Worker-Version aktiv.

**GitHub-Update ist kein Cloudflare-Deployment:** Falls Cloudflare die Worker-Datei nicht automatisch aus GitHub übernimmt, muss die aktuelle [cloudflare-worker.js](https://github.com/michaelmejtsky/grundausbildung/blob/main/cloudflare-worker.js) im Worker `grundausbildung` über dessen Code-Editor oder bestehende Deploy-Pipeline veröffentlicht werden. Die bestehenden Werte von `GA_WORKER_SECRET` oder `GA_SCRIPT_URL` weder überschreiben noch ins Repo laden. Für neue VAPID-Schlüssel immer das komplette öffentliche/private Schlüsselpaar aus derselben Erzeugung verwenden. Niemals den privaten Wert in einen Chat schicken. Nach erfolgreicher Statusprüfung zusätzlich Geräteanmeldung und echte Test-Push prüfen.

## V1.5.3 – Passwort zurücksetzen und korrigiertes App-Symbol

- Admin → **Zugänge**: Für aktive Benutzer **Passwort zurücksetzen** wählen. Nur die hinterlegte E-Mail bekommt einen einmaligen 30-Minuten-Link zur selbstständigen Passwortänderung. Passwörter sind nicht auslesbar. Bestehende Anmeldesitzungen werden bei der Passwortänderung ungültig.
- Bestehende Einladung: unverändert 7 Tage und einmalig gültig. Zurücksetzung funktioniert über dieselbe sichere Aktivierungsseite auch bei bereits aktiven Benutzern.
- Nach Aktualisieren der bestehenden Apps-Script-Web-App mit GitHub-`Code.gs` V1.5.3 bitte **neu anmelden**: das erweiterte Sitzungsformat macht vorherige Sitzungen ungültig.
- Neues **Feuerwehrauto-Homescreen-Icon** mit größerem Innenabstand in separaten 192px/512px PNG-Dateien. Geräte mit bereits installierter App: alte Homescreen-Verknüpfung entfernen und neu installieren, falls altes Icon bleibt.
- Für Web-Push: Cloudflare Worker muss aktuelle `cloudflare-worker.js` Version aus GitHub erhalten. In **Workers & Pages → grundausbildung → Settings → Variables and Secrets** VAPID_PUBLIC_KEY (Text), VAPID_PRIVATE_JWK (Secret) und VAPID_SUBJECT (Text, `mailto:`) hinterlegen. Werte paarweise lokal erzeugen über `push-einrichten.html`, Private Key niemals ins GitHub-Repo. Vorherige `GA_WORKER_SECRET` und die Apps-Script-Bereitstellungsadresse unverändert lassen. In der Google-Tabelle Menü „Push-Speicher und Trigger einrichten“ einmal ausführen; danach pro Mobilgerät Push aktivieren und Test schicken. Hintergrundzustellung erst nach echtem End-to-End-Test als funktionierend betrachten.


## V1.5.2 – Ausbildungsstufen und Bewertungsfragebögen
- **Stufenfolge:** Grundausbildung (GAB) → Erweiterte Ausbildung. Motivierte GAB-Teilnehmer dürfen bereits während der GAB an erweiterten Ausbildungsangeboten teilnehmen. Nach bestätigter GAB mit allen definierten Pflichtmodulen wird die **aktuell angezeigte Ausbildungsstufe automatisch** zur Erweiterten Ausbildung. Die vorhandene Turnuszuordnung und bestätigte Kursnachweise bleiben unverändert; ein Wechsel in einen anderen konkreten Turnus ist eine separate Verwaltungsaktion.
- Ein Direkteinstieg als „Erweiterte Ausbildung“ ist möglich, führt aber ohne durch den Admin anerkannte oder nachgewiesene GAB **nicht** zu einer automatischen GAB-/BSW-Freigabe.
- **Kursbewertung:** Sieben allgemeine Bewertungsfragen (1–5), getrennte Freitextfelder für Positives, Verbesserungswünsche, Ideen und sonstige Notizen. Unter „Bewertungsfragebögen“ kann der Administrator oder ein berechtigter Ausbilder eine allgemeine Vorlage oder abweichende Kursfragen (1–15) speichern. Alte Bewertungsantworten behalten ihr jeweiliges Fragen-Snapshot.
- **Veröffentlichte Kurse:** Sofortbearbeitung über separat vergebbares Recht „Veröffentlichte Kurse bearbeiten“ – unabhängig vom Recht, neue Kursprojekte freizugeben. Jede Änderung wird protokolliert.
- **Veröffentlichung:** GitHub Pages ändert nur die Oberfläche. Die bestehende Google Apps Script-Code.gs muss auf V1.5.2 aktualisiert, `gaEinrichten` ausgeführt und die **bestehende** Web-App als neue Version bereitgestellt werden. Cloudflare-Schlüssel nicht ändern. **Echte Push-Zustellung** bleibt ein gesonderter Installationstest.

# Grundausbildung – Feuerwehr St. Pölten Stadt

**Stand: V1.4.1 Pilot / 23.10.2026** · Eigenständige Anwendung · Frühere Apps unverändert



## V1.4.1 – Qualifikationsstatus, Teilnehmerdaten und vollständige Auskunft zum Umsetzungsstand

Die **aktuelle** GitHub-Code.gs ist V1.4.1. Der Code ist noch **nicht automatisch** in der bestehenden Apps-Script-Web-App-Bereitstellung installiert. Für den Produktivbetrieb die bestehende Code.gs übernehmen, Script Properties und /exec-Adresse behalten, `gaEinrichten` ausführen, **bestehende Bereitstellung als neue Version** veröffentlichen.

- Mitgliederstamm: Geburtsdatum und **eine** Standesbuchnummer (identisch mit Dienstnummer), plus Name und Kontaktdaten.
- Admin → Qualifikationen: Einzelne Teilnahmen bestätigen oder verneinen, GAB anerkennen (nur bei Erweiterter Ausbildung), Erste-Hilfe-Nachweis verwalten, Pflichtkurse für GAB/BSW konfigurieren und Status einsehen.
- Die drei unabhängigen Voraussetzungen `GABAbgeschlossen`, `BSWModulAbgeschlossen`, `Alter16` müssen alle wahr sein, damit `BSWDienstMoeglich` wahr ist. Unbekanntes Geburtsdatum, fehlende Pflichtmodule oder fehlende Teilnahme führen nie automatisch zur Freigabe.
- Erste Hilfe hat einen **separaten Status** sowie ein nachgewiesenes Kursdatum. `FDISKPlatzhalter` markiert ausdrücklich, ob ein vorläufiger/fiktiver FDISK-Eintrag für die Anmeldung dokumentiert wurde – dieser ist **kein** Erste-Hilfe-Nachweis und zählt nicht als BSW-Kriterium.
- Admin → Übersicht: Mitglieder, Status GAB, BSW, Mindestalter, BSW-Dienst und Erste Hilfe / FDISK. Teilnehmer → Mein Ausbildungsstand: Fortschrittsbalken, offene Pflichtmodule, Ausbildungscheckliste, bestätigte Ausbildungen, BSW-Freigabe.
- Persönliche Nachrichten können Teilnehmer und Ausbilder/Verwaltung nach Anmeldung aneinander senden. Die Funktion ist ein Postfach, kein ausgereiftes Chat-Thread-System.

**Noch offen:** Ein eigenständiger externer **API-Zugang für die zukünftige Brandsicherheitswachen-Diensteinteilung** ist absichtlich nicht öffentlich freigeschaltet. Zuerst muss die fremde App feststehen und eine sichere Maschinen-Authentifizierung implementiert werden, die ausschließlich minimal notwendige Statusdaten liefert (Standesbuchnummer, Name, GAB ja/nein, BSW-Modul ja/nein, Mindestalter ja/nein, Freigabe ja/nein). Das Geburtsdatum und andere Personendaten sollen nicht unnötig übertragen werden.

**Ebenfalls offen:** Cloudflare Worker + VAPID-Secrets und mobile Push-Zustellung sind erst nach realer Einrichtung / End-to-End-Test vollständig betriebsbereit. JavaScript-Syntax und lokale BSW-Bedingungstests ersetzen keinen Live-Endpunkttest.

---

## V1.3 – Kursprojekt-Freigaben, Ausbilderrechte, Qualitätsmeldungen, Bewertungen, Mitgliedsbearbeitung

**GitHub-Stand: umgesetzt und JavaScript-Syntax geprüft.** Die neue Backend-Funktionalität ist erst aktiv, wenn die aktuelle `Code.gs` in das gebundene Google Apps Script übernommen und unter der **bestehenden /exec-Bereitstellung als neue Version** veröffentlicht wird. Die GitHub Pages Oberfläche aktualisiert sich unabhängig davon. Bis zum Backend-Update nicht mit neuen V1.3-Funktionen produktiv arbeiten.

### Bedienung

- **Mitglieder** → `Bearbeiten` übernimmt alle Felder; `Entfernen` deaktiviert das Mitglied, sperrt den verknüpften Teilnehmerzugang und dessen Push-Geräte, löscht jedoch keine Anwesenheits-, Checklisten- oder Bewertungsnachweise. Bearbeiten eines deaktivierten Eintrags kann ihn reaktivieren. Bei vorhandenem Login ist eine eigenständige Änderung der E-Mail gesperrt, damit nicht versehentlich ein falscher Account verknüpft wird.
- **Ausbilderrechte (Admin)**: fünf getrennte Rechte pro aktivem Ausbilder: `KurseGestalten`, `KurseFreigeben`, `TerminePlanen`, `MeldungenBearbeiten` und `BewertungenAnsehen`. Ohne explizite Freigabe können Ausbilder keine neuen Kurse oder Termine veröffentlichen. Nur Administratoren dürfen Rechte vergeben.
- **Kursprojekte**: Neue Entwürfe `Neu` / `In Ausarbeitung` → `Zur Prüfung` → `Veröffentlicht` oder `Zurück zur Bearbeitung` mit Rückmeldung. Einreichung setzt **Ausbildungsinhalt immer** voraus; bei `Theorie` zusätzlich einen **HTTPS-Präsentationslink**. Bei `Praxis` reicht der Ausbildungsinhalt. Ausbilder mit `KurseGestalten` dürfen gemeinsam an offenen Projekten arbeiten; alle Änderungen werden mit Benutzer und Zeitpunkt protokolliert. Veröffentlichung erfolgt erst nach Prüfung durch Admin oder eine Person mit `KurseFreigeben`; dann wird der Kurs im freigegebenen Katalog verfügbar.
- **Mängel & Ideen**: Ausbilder melden `Mangel App`, `Mangel Ausbildung`, `Idee Ausbildung` oder `Idee App`. Filter für Kategorie/Status und Bearbeitung mit Rückmeldung für Admin bzw. Berechtigte.
- **Kursbewertungen**: Teilnehmer sehen ihre bewertbaren Termine **erst nach bestätigter Anwesenheit** (durchgeführt und Anwesend=JA). Eine Bewertung pro Kurstermin, 1–5 Sterne und optionaler Kommentar; kein Duplikat. Admin bzw. berechtigte Ausbilder werten nach Kurs und Sternen aus. Nach der **ersten** bestätigten Anwesenheit erzeugt das Backend eine Bewertungserinnerung als In-App-/Push-Benachrichtigung. Die Push-Zustellung benötigt weiterhin den eingerichteten Worker, VAPID-Secrets und aktivierte Geräte.
- **Push-Steuerung** ergänzt `Bewertungen` als vierte Kategorie, zusätzlich zu Nachrichten, Terminen und Aufgaben.

### Aktualisierung ohne Datenverlust

1. Bestehende Datenbank: Die vier neuen privaten Blätter `Berechtigungen`, `KursProjekte`, `Meldungen` und `Bewertungen` sowie `PushRegeln!G1 = Bewertungen` sind bereits angelegt. Bestehende Mitgliederdaten wurden dabei nicht verändert. Bitte nicht neu importieren und nicht freigeben.
2. Das zu dieser Tabelle gehörende Apps Script öffnen. Den bisherigen Inhalt von **Code.gs** durch die aktuelle [GitHub-Code.gs](https://github.com/michaelmejtsky/grundausbildung/blob/main/Code.gs) ersetzen; speichern. **Skripteigenschaften wie GA_WORKER_SECRET keinesfalls löschen oder verändern.**
3. Google-Tabelle neu laden. Menü `Grundausbildung → 1 · Tabellen prüfen/erstellen` ausführen (prüft Spalten, löscht keine Einträge). Berechtigungen nur bei Bedarf gewähren.
4. Im Apps Script `Bereitstellen → Bereitstellungen verwalten → Bearbeiten → Version: Neue Version → Bereitstellen`. Die bestehende **/exec**-Adresse muss gleich bleiben. Falls die App noch die alte Version zeigt: mit neuem Login/Seitenaktualisierung testen; der Service Worker wurde auf `ga-shell-v1.5` erhöht.
5. Prüfen: Mitglied bearbeiten/entfernen; Ausbilder ohne Rechte darf keinen Kurs veröffentlichen; Theorie-Projekt ohne Präsentation darf nicht zur Prüfung eingereicht werden; Kursbewertung ohne bestätigte Teilnahme muss abgelehnt werden. Noch keine realen Push-Erfolge zusagen, bevor die Zustellung auf Geräten getestet wurde.

Hinweis: Bereits vor V1.3 existierende veröffentlichte Kursvorlagen bleiben aus Kompatibilitätsgründen verfügbar. Der neue Prüf-Workflow gilt für neu angelegte Kursprojekte. Direkte Admin-Manipulationen in Google Sheets oder Apps Script müssen weiterhin organisatorisch abgesichert werden.


## Neu in V1.2 – gezielte Nachrichten, Soforteinladung, Web-Push

**Live-Installation braucht zwei Updates und die VAPID-Konfiguration.** GitHub Pages veröffentlicht nur das Frontend automatisch. Der im Google-App-Script-Editor bereits installierte Code wird nicht durch den GitHub-Commit aktualisiert.

### 1. Google Apps Script aktualisieren (Pflicht)

1. Die Datei [Code.gs](https://github.com/michaelmejtsky/grundausbildung/blob/main/Code.gs) aus dem Repository vollständig in **Erweiterungen → Apps Script** der bestehenden Grundausbildung-Tabelle übernehmen und speichern. Bestehende Skripteigenschaften, Schlüssel und Tabellen nicht löschen.
2. Die verbundene Google-Tabelle neu laden und **Grundausbildung → 5 · Push-Speicher und Trigger einrichten** einmal ausführen. Dies erzeugt/prüft die privaten Tabellen `PushGeraete` und `PushRegeln` und richtet einen Trigger zur Verarbeitung wartender Push-Nachrichten alle 5 Minuten ein. Fehlende OAuth-Berechtigungen erlauben.
3. Im Apps-Script-Editor **Bereitstellen → Bereitstellungen verwalten → vorhandene Web-App bearbeiten → Version: Neue Version → Bereitstellen**. **Keine neue /exec-URL erzeugen**, sonst zeigt Cloudflare noch auf die alte Bereitstellung.

Die beiden Sheets `PushGeraete` und `PushRegeln` wurden außerdem bereits direkt in der privaten Google-Datenbasis vorbereitet. Sie dürfen nicht öffentlich freigegeben werden.

### 2. Cloudflare Worker bereitstellen und VAPID konfigurieren (für Hintergrund-Push)

1. Beim bestehenden Cloudflare Worker `grundausbildung` unter **Deployments** kontrollieren, ob der Commit mit dem neuen `cloudflare-worker.js` bereitgestellt wurde. Wenn nötig eine neue Bereitstellung aus dem verbundenen GitHub-Repository auslösen. `GA_WORKER_SECRET` unverändert lassen.
2. Öffne die GitHub-Pages-Seite [Push-Schlüssel lokal erzeugen](https://michaelmejtsky.github.io/grundausbildung/push-einrichten.html). Die Werte werden **lokal** im Browser erzeugt, nicht ins Repo hochgeladen.
3. Unter **Cloudflare → Worker grundausbildung → Settings → Variables and Secrets** diese drei Werte hinterlegen:
   - `VAPID_PRIVATE_JWK` — **Secret**, Inhalt aus Feld 2 der Generatorseite. Niemals in GitHub.
   - `VAPID_PUBLIC_KEY` — **Textvariable**, Inhalt aus Feld 1 der Generatorseite.
   - `VAPID_SUBJECT` — **Textvariable**, z. B. `mailto:DEINE_MAIL@DOMAIN.AT` mit der tatsächlichen E-Mail-Adresse.
4. Worker-Einstellungen speichern und bei Bedarf neu deployen. **Nicht** den privaten VAPID-Key im Chat verschicken. Nach einer Schlüsselrotation müssen sich registrierte Geräte neu für Push anmelden.

### 3. Verwenden

- **Administrator → Mitglieder:** optional das Kontrollkästchen `Teilnehmerzugang gleich per E-Mail einladen` nutzen. Bestehende Mitglieder können über `Zugang einladen` in der Mitgliederliste eingeladen werden. Die Person vergibt ihr Passwort selbst.
- **Administrator → Nachrichten:** entweder `Alle Teilnehmer`, `Gesamter Turnus` oder `Einzelnes Mitglied` auswählen. Persönliche Nachrichten sind nur für den jeweiligen Teilnehmer und Administrator sichtbar.
- **Administrator → Push-Steuerung:** für jeden aktiven Benutzer per Kontrollkästchen bestimmen, ob er **Nachrichten**, **Termine** und/oder **Aufgaben** als Hintergrund-Push bekommen darf. Das verändert nicht den In-App-Zugriff auf normale Mitteilungen.
- **Jeder Benutzer → Benachrichtigungen → Push aktivieren:** auf jedem gewünschten Gerät separat zustimmen. Auf **iPhone/iPad** erst als App zum Home-Bildschirm hinzufügen, von dort starten und danach Push erlauben. Ein Administrator kann die Systemfreigabe auf dem fremden Gerät nicht erzwingen. Danach `Push-Steuerung → Test-Push` nutzen.

**Technische Hinweise:** Die Push-Empfängerregeln sind serverseitig wirksam. Push-Endpunkte und Verschlüsselungsdaten bleiben nur in der privaten Google-Tabelle. Die Worker-Zustellung ist zeitgestempelt HMAC-signiert und auf bekannte Push-Service-Hosts beschränkt. End-to-End-Zustellung und Mobile-Berechtigungen müssen nach Konfiguration auf einem echten Gerät getestet werden. Bis dahin sind nur In-App-Benachrichtigungen sicher verfügbar.


## Projektlinks

- **GitHub-Quellcode:** https://github.com/michaelmejtsky/grundausbildung
- **Google-Datenbank (bereits erstellt):** https://docs.google.com/spreadsheets/d/1DZPggVf8T2F-GFIT_57kbqWQcSCF1TA6s5GV01iQXJc/edit
- **Geplante Installations-/Einladungsadresse:** https://michaelmejtsky.github.io/grundausbildung/
- **GitHub Pages Einstellungen:** https://github.com/michaelmejtsky/grundausbildung/settings/pages
- **Apps-Script-Web-App (/exec; Bereitstellung vorhanden):** https://script.google.com/macros/s/AKfycbw0t9edW1egW27B1dHhen2I73GZji3JfQ8aBSFAjghd5gZXSTu24r7E_iMvTqBe3hhT/exec

Die GitHub Pages-Adresse funktioniert erst nach erfolgreicher Pages-Veröffentlichung. In GitHub Free muss das Repository dafür ggf. öffentlich sein; bei bestimmten kostenpflichtigen Tarifen kann ein privates Repo GitHub Pages bereitstellen. **Eine Pages-Seite ist unabhängig von der Repo-Sichtbarkeit öffentlich erreichbar.** Keine Passwörter, Mitgliederlisten oder sonstigen vertraulichen Daten auf GitHub ablegen.

## Zielarchitektur

1. **GitHub Pages:** `index.html`, `manifest.webmanifest`, `service-worker.js`, PNG-Icons = installierbare Web-App (PWA).
2. **Cloudflare Worker:** `cloudflare-worker.js` = HTTPS-API und CORS; schützt die Verbindung zu Apps Script mit einem serverseitigen Secret.
3. **Google Apps Script:** `Code.gs` = Anmeldungen, Einladungen, Rollen und Verwaltungsfunktionen.
4. **Google Sheets:** private Datenspeicherung; nicht direkt an Teilnehmer weitergeben.

Eine einfache direkte `fetch()`-Anbindung von GitHub an Apps Script ist wegen CORS/Weiterleitungen nicht verlässlich. Die früher getestete iframe-Idee ist daher **nicht** die verwendete Architektur.

## Einrichtung – der Reihe nach

### 1. Apps Script an vorhandene Tabelle binden

- Die oben verlinkte Google-Tabelle öffnen.
- **Erweiterungen → Apps Script** und Projekt **Grundausbildung** nennen.
- In Apps Script die Datei `Code.gs` aus diesem Repository vollständig einfügen. **Die GitHub-Datei `index.html` gehört NICHT in Apps Script.**
- Speichern. `gaEinrichten` einmal ausführen, die gefragten Berechtigungen erteilen.
- Tabelle neu laden. Menü **Grundausbildung → 2 · Ersten Administrator einrichten** verwenden. Achtung: Das Standarddialogfeld zeigt Eingaben beim Tippen sichtbar an. Für den Pilottest ein einzigartiges Passwort eingeben und die Umgebung vor Blicken schützen.

### 2. Geheimes Verbindungstoken erzeugen

- Im Tabellenmenü **Grundausbildung → 4 · Worker-Schlüssel einrichten** auswählen. Falls das Menü nach dem Code-Einfügen fehlt: Tabelle neu laden.
- Den erzeugten langen Schlüssel einmal sicher kopieren. **Nicht in GitHub, README, E-Mail oder Chat veröffentlichen.**
- Apps Script speichert ihn als Projekteigenschaft `GA_WORKER_SECRET`.

### 3. Apps Script als Backend bereitstellen

- **Bereitstellen → Neue Bereitstellung → Web-App**.
- **Ausführen als:** Ich (Skripteigentümer).
- **Zugriff:** für die Verbindung über den Worker muss die Web-App ohne Google-Anmeldung erreichbar sein (je nach Workspace-Richtlinien `Jeder`). Das bedeutet ausdrücklich **nicht**, dass die Daten ohne Anmeldung gelesen werden können: `doPost` verlangt einen geheimen Worker-Schlüssel; die eigentlichen Funktionen verlangen außerdem eine passende Sitzung/Rolle. Vor Echtdaten durchprüfen.
- **Bereitstellung vom 23.10.2026 wurde gemeldet.** Die `/exec`-URL steht bereits oben und ist im Worker-Code eingetragen. **Wichtig:** Falls `doPost` bzw. die Einladungsfunktionen nach der Bereitstellung in `Code.gs` geändert wurden, unbedingt in Apps Script eine **neue Version derselben Bereitstellung** veröffentlichen; sonst läuft unter der `/exec`-Adresse noch der alte Code. 
- Die URL allein beweist noch nicht, dass der Zugriff oder der aktuelle Stand funktioniert.

### 4. Cloudflare Worker einrichten

- **Einfacherer GitHub-Weg (bereits vorbereitet):** In Cloudflare → **Workers & Pages** → Create → GitHub → Repository `michaelmejtsky/grundausbildung` auswählen. Projektname `grundausbildung-api`, **Build command leer**, **Deploy command `npx wrangler deploy`**, Preview builds für den ersten Test ausschalten, Cloudflare Access ausschalten und **Deploy** drücken. Die neue Datei `wrangler.jsonc` steuert dabei automatisch die Veröffentlichung von `cloudflare-worker.js` als Worker. Die Datei `index.html` bleibt für GitHub Pages gedacht.
- Die Apps-Script-URL ist in der Datei `cloudflare-worker.js` **bereits eingetragen**. Die optionale Worker-Variable `GA_SCRIPT_URL` ist nur nötig, wenn die Zieladresse später überschrieben werden soll. GitHub-Builds übernehmen Änderungen am Worker-Code automatisch.
- Worker-**Secret** `GA_WORKER_SECRET` = der in Schritt 2 einmalig erzeugte Schlüssel. Den Wert **nie im GitHub-Repository speichern**.
- Worker neu veröffentlichen und dessen HTTPS-Adresse kopieren, z. B. `https://grundausbildung-api.<account>.workers.dev`.
- Die Worker-Adresse ist **kein Geheimnis**; das Secret bleibt nur serverseitig.
- Der Worker akzeptiert Browseranfragen nur vom Ursprung `https://michaelmejtsky.github.io`; die Backend-Aktionen haben zusätzliche Rollen- und Tokenprüfungen.

### 5. GitHub-Oberfläche mit Worker verbinden

- In `config.js` im Repository die Zeile `window.GA_API_URL = '';` durch die **Worker-Adresse** ersetzen (ohne abschließenden Schrägstrich) und speichern.
- In **Settings → Pages**, `Deploy from a branch`, Branch `main`, Ordner `/ (root)` auswählen und speichern.
- Nach erfolgreicher Veröffentlichung `https://michaelmejtsky.github.io/grundausbildung/` öffnen.

**Wichtig:** GitHub und Apps Script synchronisieren sich nicht automatisch. Änderungen in `Code.gs` müssen in Apps Script übernommen und neu bereitgestellt werden. Änderungen an `index.html` werden nach Veröffentlichung automatisch über GitHub Pages aktualisiert.

### 6. Test ohne Echtdaten

1. Als erster Administrator anmelden.
2. Test-Turnus und Test-Mitglied mit E-Mail anlegen.
3. **Zugänge → Benutzer per E-Mail einladen**; für Teilnehmer muss zuvor der gleichnamige Mitgliedseintrag existieren.
4. E-Mail-Link öffnen, eigenes Passwort (mindestens 12 Zeichen) festlegen, anschließend anmelden.
5. Teilnehmerzugang und Fachverwaltung separat prüfen; Anwesenheiten und Protokoll testen.
6. Erst dann Einladung an tatsächliche Mitglieder freigeben.

## App installieren

- **Android (Chrome):** Die GitHub-Pages-Seite öffnen → `App installieren` oder Chrome-Menü → `Zum Startbildschirm hinzufügen`.
- **iPhone (Safari):** Link in Safari öffnen → Teilen → `Zum Home-Bildschirm`.
- **Desktop (Chrome/Edge):** über das Installationssymbol in der Adressleiste oder die Schaltfläche in der Anwendung.

Das ist eine **Progressive Web App (PWA)**, keine APK oder App-Store-App. Mit dem Service Worker wird nur die statische Oberfläche zwischengespeichert, **keine persönlichen Ausbildungsdaten**. Die Verbindung zum Backend benötigt Internet.

## Funktionen dieser Version

- Admin, Ausbilder, Teilnehmer und Fachverwaltung (Zeugkammer)
- Kurse mit Inhalt, Lernzielen und HTTPS-Links zu Google Drive/Google Slides
- Turnusse, Mitglieder, Kurstermine, Teilnehmer- und Ausbilderbestätigung
- Checklisten mit Status `Offen`, `Erledigt`, `Nicht erforderlich`
- Verantwortlichen-Aufgaben, Änderungen mit Zeitstempel, Nachrichten
- Einmalige E-Mail-Einladung für neue Benutzer (7 Tage gültig), Passwort selbst setzen
- Installierbare Benutzeroberfläche als PWA

## Grenzen und Sicherheit

- **Noch keine echten Hintergrund-Push-Nachrichten**, die bei geschlossener App ankommen. Die App besitzt nur In-App-Meldungen. Web Push benötigt noch einen gesonderten Push-Dienst und Einwilligung.
- Noch keine Passwort-zurücksetzen-Funktion und MFA. Der bestehende PBKDF2-Ansatz ist für einen Piloten gedacht; vor großflächiger produktiver Nutzung stärkere Identitäts- und Login-Schutzmaßnahmen einplanen.
- Die Google-Tabelle ist privat. **Nie** Mitarbeiterdaten oder geteilte Sitzungstokens im GitHub-Code veröffentlichen.
- Drive-Unterlagen sind nur für berechtigte Personen über deren Google-Freigaben einsehbar.
- Cloudflare-Worker-/Google-Apps-Script-Anbindung, Einladungsmailversand, GitHub-Pages-Veröffentlichung und Installation sind in dieser Umgebung noch **nicht Ende-zu-Ende getestet**. Deployment und Berechtigungen werden vom Eigentümer eingerichtet.
