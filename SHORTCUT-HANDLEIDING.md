# SchoolTrack koppelen aan Apple Opdrachten

1. Publiceer SchoolTrack op een HTTPS-adres en open de URL op je iPhone.
2. Open Opdrachten → Automatisering → + → NFC.
3. Tik op Scan en houd de iPhone bij je schoolpas.
4. Geef de tag een herkenbare naam.
5. Kies de optie om direct uit te voeren als iOS die toont.
6. Voeg de actie Open URL toe.
7. Vul in: `https://JOUW-SCHOOLTRACK-ADRES/?scan=1`
8. Sla de automatisering op.
9. Test eerst via SchoolTrack → Instellingen → NFC-test. Voor een echte scan gebruik je de NFC-automatisering.
10. Scan de pas opnieuw om uit te klokken.

## Bestaande Somtoday-automatisering
Je kunt de bestaande NFC-automatisering aanpassen en de URL-actie voor SchoolTrack toevoegen. Wil je Somtoday ook openen, voeg dan daarna de actie Open app → Somtoday toe. Controleer zelf of iOS de acties in de gewenste volgorde uitvoert.

## Let op
De URL-trigger is een praktische koppeling, geen bewijs van een authentieke NFC-scan. Als de URL handmatig wordt geopend, kan die ook een registratie maken. De PWA kan niet zelfstandig een fysieke NFC-scan valideren.

## Wat de NFC-testknop doet
De NFC-testknop controleert alleen dat de app-instellingenpagina reageert. Hij maakt nadrukkelijk geen klokregistratie en simuleert geen fysieke NFC-scan. Een echte NFC-bronregistratie ontstaat pas wanneer de ingestelde NFC-automatisering de SchoolTrack-URL opent.

## Extra controle op iPhone-opslag
Belangrijk: iOS kan Safari en de zelfstandige beginscherm-app als aparte opslagcontexten behandelen. Test daarom eerst met een niet-belangrijke registratie:
- Open SchoolTrack in Safari en maak een back-up.
- Scan de schoolpas via Opdrachten.
- Controleer of de registratie zichtbaar is in exact dezelfde SchoolTrack-weergave.
- Open daarna pas de beginscherm-app en controleer of dezelfde registratie daar zichtbaar is.
Als de registraties niet overeenkomen, gebruik deze lokale versie nog niet als betrouwbare dagelijkse prikklok. Dan is een gedeelde opslaglaag nodig; die is niet in deze lokale versie ingebouwd.
