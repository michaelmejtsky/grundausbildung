# Ausbildungsbereiche für Ausbilder – Version 1.13.5

Die Rolle bleibt **Ausbilder**. Unter **Ausbilderrechte → Person → Ausbildungsbereiche** kann die Administration Grundausbildung, Erweiterte Ausbildung oder beide Bereiche auswählen. Mindestens ein Bereich ist erforderlich. Die bisherigen Funktionsrechte bleiben zusätzlich maßgeblich; eine Bereichsfreigabe verleiht keine Organisatorrechte.

Bei zwei Bereichen erscheint nach der Anmeldung sowie beim Wiederherstellen einer gespeicherten Anmeldung eine Auswahl. Bei nur einem Bereich öffnet sich direkt die zugehörige Ausbilderübersicht. Über **[Bereich] · Wechseln** kann während der Sitzung gewechselt werden. Offene Bearbeitungsansichten werden dabei geschlossen; Quizentwürfe werden wie bisher lokal gesichert.

Das Backend prüft Bereichsfreigaben bei jeder Anfrage und vor Schreibvorgängen erneut unter der bestehenden Sperre. Kurse, Projekte, Termine, Quiz, Anwesenheiten, Berichte, Bewertungen und Teilnehmerempfänger werden entsprechend begrenzt. Eine Administration kann auch diese Ausbilderansichten über die vorhandene schreibgeschützte Rollenvorschau prüfen.

GAB-Gäste in erweiterten Turnussen bleiben ihrem ursprünglichen GAB-Turnus zugeordnet. In der erweiterten Ausbilderansicht werden nur die für die Durchführung notwendigen Gastnamen statt persönlicher GAB-Stammdaten geliefert. Bestehende erweiterte Termine innerhalb eines GAB-Turnus sind für Ausbilder mit **beiden** Bereichsfreigaben weiterhin in der erweiterten Ansicht zugänglich. Ausbilder, die ausschließlich für die erweiterte Ausbildung freigegeben sind, bekommen darüber keinen Zugriff auf GAB-Turnusse.

Persönliche Benachrichtigungen und eigene Direktnachrichten bleiben kontoweit sichtbar. Die Auswahl eines Bereichs verschickt keine neuen Nachrichten. Neue Projekt-, kursbezogene Mängel- und Quizmeldungen an Ausbilder berücksichtigen deren Bereichsfreigaben.

## Bestehende Daten und bisherige Berechtigungen

Ohne explizit gespeicherte Bereichsfreigaben behalten bisherige Ausbilder ihren bisherigen Zugriff auf beide Ausbildungsbereiche. Wenn im bestehenden Benutzerkonto bereits ein konkreter Ausbildungsbereich hinterlegt ist, wird dieser verwendet. Die Administration sollte die Häkchen einmal pro Ausbilder gezielt einstellen und speichern.

Die Freigaben werden ergänzend in den Script Properties des bestehenden Apps-Script-Projekts gespeichert. Bestehende Sheet-Spalten, Mitgliedsnummern, Turnuszuordnungen, Quizversuche und Ausbildungsnachweise werden nicht geändert. Ältere Berechtigungsformulare ohne Bereichsfeld überschreiben keine bereits gespeicherten Bereichsfreigaben. Eigene ältere freie Tätigkeiten ohne Bereich bleiben für ihren Ersteller sichtbar und erhalten beim nächsten Speichern den gewählten Bereich.

## Aktualisieren

1. Die vollständige **Code.gs 1.13.5** in dasselbe bestehende Apps-Script-Projekt übernehmen. Sie enthält auch sämtliche Änderungen aus 1.13.4 (GAB-Abschlussnachrichten, erweiterter Ausbildungsabschluss, Kurs-/Quizbenachrichtigungen) und den bisherigen Stand zu E-Mail-Änderungen, Gültigkeitsdatum und Quiz-Anrechnung.
2. Speichern und **Bereitstellen → Bereitstellungen verwalten → bestehende Web-App bearbeiten → Neue Version → Bereitstellen** wählen. Die bestehende `/exec`-Adresse beibehalten.
3. Die App neu laden; bei einer installierten PWA gegebenenfalls vollständig schließen und erneut öffnen. Die Oberfläche zeigt **V1.13.5**, der statische Cache heißt **ga-shell-v2.42**.
4. Unter **Ausbilderrechte** die gewünschten Bereiche und Funktionsrechte speichern.

Keine neue Datenbank, kein neues Konto und keine neue Apps-Script-Bereitstellungsadresse erforderlich. Das Backend wird nicht automatisch durch eine GitHub-Pages-Veröffentlichung aktualisiert.

## Prüfung

Die lokalen Tests laufen ausschließlich im Speicher. Sie prüfen unter anderem beide/einzelne Freigaben, gefälschte Objekt-IDs, Änderungen an Quell- und Zielbereichen, Rechteentzug während einer Sitzung, die Rollenvorschau, GAB-Gastschutz, alte Berechtigungsformulare, Rücknahme bei fehlgeschlagenem Speichern sowie verspätete Antworten beim Ansichtswechsel. Die mobile Bereichsauswahl und der Wechsel wurden zusätzlich in einer lokalen Browservorschau geprüft. Es wurden keine Prüfkonten oder Benachrichtigungen im Produktivsystem angelegt.
