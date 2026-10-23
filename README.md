# Grundausbildung – FF St. Pölten Stadt

**Version 1.0 (Pilotversion)** – eigenständiges Projekt. Keine bestehenden Apps oder Tabellen ändern.

## Dateien
- `Code.gs`: Google-Apps-Script-Backend, automatisch verwaltete Tabellen, Rollen, Checklisten und Anwesenheitsprotokoll.
- `Index.html`: responsive Web-App für Administrator, Ausbilder, Teilnehmer und Fachverwaltung.
- **Google Sheets (bereits angelegt):** 11 Datentabellen plus START-Register, Beispielkurs und Grundchecklisten. Link siehe unten.

## Installation
1. Die Google-Tabelle ist bereits erstellt: https://docs.google.com/spreadsheets/d/1DZPggVf8T2F-GFIT_57kbqWQcSCF1TA6s5GV01iQXJc/edit – KEINE Excel-Datei importieren.
2. Die **neue Google-Tabelle** öffnen, **Erweiterungen → Apps Script** anklicken.
3. Bestehenden leeren Beispielcode in `Code.gs` durch den vollständigen Inhalt der beiliegenden Datei `Code.gs` ersetzen. **Neue HTML-Datei** anlegen: `Index` (nicht `Index.html.html`) und den Inhalt von `Index.html` einfügen.
4. Das Skriptprojekt **Grundausbildung** nennen. Projekt-Einstellungen: Zeitzone `Europe/Vienna` wählen. Änderungen speichern.
5. In der Apps-Script-Oberfläche die Funktion `onOpen` auswählen und einmal ausführen, Berechtigungen prüfen; danach Google-Tabelle neu laden. Alternativ `gaEinrichten` direkt ausführen.
6. Im Tabellen-Menü **Grundausbildung → 1 · Tabellen prüfen/erstellen** ausführen (bestehende Daten bleiben erhalten). Danach **2 · Ersten Administrator einrichten**. Administrator-E-Mail und ein sicheres, mindestens 12-stelliges Passwort angeben.
7. **Bereitstellen → Neue Bereitstellung → Web-App**. Für den Pilot: Ausführen als **Ich**, Zugriff **Nutzer mit Link** (je nach Workspace-Umgebung heißt die Option möglicherweise anders). **Wichtig:** Die Anwendung hat ein eigenes, vom Administrator vergebenes Login. Der Link darf nicht veröffentlicht werden. Später muss die Authentifizierung für den Produktivbetrieb durch eine stärker abgesicherte Lösung mit zentraler Identitätsprüfung ersetzt werden.
8. Web-App-URL öffnen und anmelden. Aus Sicherheitsgründen die Google-Tabelle nicht an Teilnehmer/Ausbilder freigeben.
9. In der App Turnus erstellen → Mitglied aufnehmen → unter **Zugänge** Benutzer einrichten → Kurse verwalten → Ausbildungstermin erstellen. Rolle `Fachverwaltung` mit Bereich `Zeugkammer` erhält passende Aufgaben.

## GitHub-Projekt
Dieses Repository wurde für Grundausbildung separat erstellt. Es enthält nur Code und Dokumentation, keine personenbezogenen Teilnehmerdaten. GitHub ist zunächst das private Code-Archiv, **nicht** die veröffentlichte Live-Web-App. Die eigentliche Bereitstellung erfolgt in Google Apps Script durch den Kontoinhaber. GitHub-Änderungen werden nicht automatisch nach Apps Script synchronisiert.

## Enthalten
- Kurse mit Titel, Bereich, Inhalten, Lernzielen, bis zu 12 HTTPS-Links
- Grundausbildung und Erweiterte Ausbildung, Turnusse, Mitglieder
- Termine mit Beginn/Ende/Ort, automatische In-App-Nachrichten
- Ausbilderansicht mit Kursunterlagen, Anwesenheits- und Ausbilderbestätigung
- Teilnehmerübersicht mit eigenen Ausbildungen, Terminen, Checklisten
- Administration und Fachverwaltung (z. B. Zeugkammer)
- Protokollierung von Schreibaktionen und Statusänderungen
- **In-App**-Benachrichtigungszentrale

## Noch nicht enthalten / Produktivvorbehalte
- **Keine echten Push-Nachrichten**, wenn die App geschlossen ist. Dafür ist ein gesonderter Push-Service mit Browser-Subscriptions und sicherer Zustellung nötig.
- Noch kein Passwort-zurücksetzen, Einmalpasswort-Zwang, MFA oder Kontensperre durch Admin; vor dauerhaftem Betrieb mit personenbezogenen Daten die Authentifizierung weiter absichern.
- Kein nachträgliches Deaktivieren/Löschen von Benutzern über die Oberfläche.
- Kein Datei-Upload: Drive-/Google-Präsentationslinks können hinterlegt werden; die Dateien benötigen ihre eigenen Drive-Zugriffsberechtigungen.
- In dieser Version stellt die App eine Pilot-Implementierung dar, kein abgenommenes Produktivsystem. Vor Echtdaten mit Testbenutzern und allen Rollen testen.
- Apps Script mit „Als ich ausführen“ benötigt besondere Vorsicht bei Web-App-Zugriffsfreigaben. Das verlinkte Daten-Sheet privat belassen.
## Bereits angelegte Datenbasis (23.10.2026)
- Google-Tabelle: https://docs.google.com/spreadsheets/d/1DZPggVf8T2F-GFIT_57kbqWQcSCF1TA6s5GV01iQXJc/edit
- 12 Register: `START` sowie die 11 Datentabellen. Enthält Beispielkurs und fünf Checklistenpunkte.
- Bei der Erstinstallation in Apps Script zuerst **`gaEinrichten`** starten, danach Administrator anlegen.
- Das erste Admin-Passwort wird beim Anlegen in einem **sichtbaren** Apps-Script-Dialog eingegeben. Dafür ein einzigartiges Passwort verwenden und den Bildschirm vor Blicken schützen. Die produktive Authentifizierung benötigt weitere Härtung.
