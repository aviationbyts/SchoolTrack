# SchoolTrack

SchoolTrack is een offline-first school attendance PWA. Registraties worden lokaal in de browser opgeslagen via `localStorage`. Er is geen account, serverdatabase of betaalde API nodig.

## Wat werkt in deze versie
- Dashboard met huidige status en aanwezigheidstijd.
- In- en uitklokken via handmatige knop.
- NFC-trigger via Apple Opdrachten die de URL `?scan=1` opent.
- Dubbele registraties blokkeren binnen 8 seconden.
- Logboek met bewerken, verwijderen en handmatig toevoegen.
- Dagnotities, kalender, week- en maandstatistieken.
- CSV-export, JSON-back-up/herstel en printbaar PDF-maandoverzicht.
- Geen betrouwbare achtergrondherinneringen: gebruik daarvoor de iOS Herinneringen-app.
- Dark/light theme en instellingen voor schooldagen en tijdzone (tijdzone-instelling is een voorkeur; browserkloktijden blijven leidend).
- PWA manifest en offline cache.

## Belangrijke NFC-beperking
Een PWA kan de NFC-chip van de iPhone niet zelf als achtergrondscanner gebruiken. De Apple Shortcut NFC-automatisering is de trigger. De webapp krijgt vervolgens alleen een URL-bezoek met `?scan=1`. De webapp kan dus niet cryptografisch bewijzen dat de URL door een echte kaartscan is geopend. Gebruik de trigger alleen op je eigen iPhone en deel geen persoonlijke scan-URL's.

## Gratis hosten
Deze app is statisch en kan op een gratis statische host worden geplaatst. GitHub Pages is een mogelijke optie voor een publieke repository. De app heeft geen backend nodig. HTTPS is vereist voor PWA-installatie en service workers.

1. Maak een GitHub-repository aan.
2. Upload alle bestanden uit deze map naar de repository-root.
3. Zet GitHub Pages aan via Settings → Pages → Deploy from a branch → main → /(root).
4. Open de gepubliceerde HTTPS-link op je iPhone in Safari.
5. Deel → Zet op beginscherm.

Gratis diensten kunnen hun voorwaarden of limieten wijzigen; controleer die bij publicatie.

## Belangrijke iPhone-opmerking: Safari en beginscherm
Op iOS kan een website die vanuit een Opdrachten-URL in Safari wordt geopend een andere opslagcontext hebben dan dezelfde website die als zelfstandige beginscherm-app is gestart. Daardoor kunnen NFC-registraties in Safari niet automatisch zichtbaar zijn in de geïnstalleerde PWA. Dit moet op jouw iPhone praktisch getest worden voordat je SchoolTrack dagelijks gebruikt. Deze lokale versie heeft geen cloudsync om die opslagcontexten samen te voegen. Gebruik voorlopig één en dezelfde browsercontext voor zowel de NFC-trigger als het dashboard en controleer na een testscan of de registratie op dezelfde plek zichtbaar is.

## Opslag en privacy
De data blijft in de browseropslag van het apparaat. Wis de websitegegevens niet zonder eerst een back-up te maken. Browseropslag is geen gegarandeerde cloudback-up. Exporteer regelmatig een JSON-back-up. Er is geen synchronisatie tussen apparaten.
