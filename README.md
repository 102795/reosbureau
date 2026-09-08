# Horizon Reizen — PHP / HTML / CSS / JS versie

Dit is een volledige herbouw van de oorspronkelijke React/TypeScript-app,
nu met **alleen** HTML, CSS, vanilla JavaScript en PHP (geen frameworks,
geen build-stap, geen npm nodig).

## Structuur

```
reisbureau-php/
├── index.php        ← hoofdpagina (nav + lege container)
├── api.php           ← backend: alle CRUD-acties (JSON in/uit)
├── css/style.css     ← volledige styling (kleuren/fonts uit het origineel)
├── js/app.js         ← alle pagina-logica: routing, rendering, API-calls
└── data/trips.json   ← "database": reizen + inschrijvingen (bestand, moet schrijfbaar zijn)
```

## Hoe werkt het?

- **index.php** rendert alleen de vaste navigatiebalk en een lege
  `<main id="app">`. De rest van elke pagina (Home, Studentenportaal,
  Admin) wordt door **js/app.js** client-side opgebouwd — vergelijkbaar
  met hoe de React-versie werkte, maar zonder React: gewoon JS dat
  HTML-strings genereert en in de pagina zet.
- **api.php** is één PHP-bestand dat via `?action=...` alle
  server-taken afhandelt: reizen ophalen/toevoegen/aanpassen/verwijderen
  en studenten in-/uitschrijven. Het leest en schrijft naar
  `data/trips.json` (met file-locking, zodat gelijktijdige verzoeken
  elkaar niet overschrijven).
- Omdat de data nu écht op de server staat (in plaats van enkel in
  React-state), blijven wijzigingen bewaard na een pagina-herlaad —
  dat is een verbetering t.o.v. het origineel.

## Installeren / draaien

Je hebt een PHP-server nodig (PHP 7.4+ volstaat, geen extra
extensies of Composer-packages).

**Optie 1 — ingebouwde PHP-server (snelste manier om te testen):**

```bash
cd reisbureau-php
php -S localhost:8000
```

Open daarna `http://localhost:8000` in je browser.

**Optie 2 — Apache / Nginx / XAMPP / MAMP:**

Kopieer de hele map `reisbureau-php/` naar je webroot (bv.
`htdocs/` of `www/`) en open ze via je lokale server-URL.

> Zorg dat de map `data/` **schrijfbaar** is voor de webserver
> (bv. `chmod -R 775 data`), anders kunnen reizen/inschrijvingen
> niet worden opgeslagen.

## Wat is er (bewust) veranderd t.o.v. het origineel?

- Geen React/TypeScript/Vite meer — alles is nu platte HTML/CSS/JS + PHP.
- De "studenteninlog" blijft, zoals in het origineel, een eenvoudige
  invoer van een studentennummer zonder wachtwoord-check (er is geen
  echte authenticatie in de originele app, dus dat is hier gelijk
  gehouden).
- Data wordt nu écht bewaard in `data/trips.json` in plaats van enkel
  in het geheugen van de browser.

## Login / testgegevens

Er is geen registratie nodig — log in het studentenportaal in met
bv. `s123456` (die heeft al 2 inschrijvingen in de meegeleverde data).


## database login
reisbureaufelineomar