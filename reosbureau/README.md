# Ga Lekker Reizen — PHP + Supabase (PostgreSQL) versie

Volledige webapplicatie in platte HTML, CSS, vanilla JavaScript en PHP
(geen frameworks, geen build-stap, geen npm nodig). De data staat in een
**Supabase (PostgreSQL) database** in plaats van een JSON-bestand.

## Structuur

```
reosbureau/
├── index.php          ← hoofdpagina (nav + lege container)
├── config.php          ← databasegegevens van Supabase (placeholders — zelf invullen!)
├── db.php              ← maakt de PDO-verbinding met Supabase op
├── api.php             ← backend: alle CRUD-acties + login (praat met de database)
├── hash_password.php   ← lokaal hulpscript om het beheerderswachtwoord te hashen
├── css/style.css       ← volledige styling
├── js/app.js           ← alle pagina-logica: routing, rendering, API-calls
└── data/trips.json     ← (niet meer gebruikt — vervangen door de database, mag verwijderd worden)
```

## Hoe werkt het?

- **index.php** rendert enkel de navigatiebalk en een lege `<main id="app">`.
  De rest van elke pagina (Home, Studentenportaal, Admin) wordt door
  **js/app.js** client-side opgebouwd.
- **api.php** handelt via `?action=...` alle server-taken af (reizen
  ophalen/toevoegen/aanpassen/verwijderen, in-/uitschrijven, inloggen) en
  praat via **db.php** met de Supabase-database.
- Het aanmaken/aanpassen/verwijderen van reizen en het bekijken van alle
  inschrijvingen is enkel mogelijk nadat de beheerder is ingelogd
  (serversessie, gecontroleerd bij elke gevoelige actie in `api.php`).

## Installatie

1. **Database in Supabase aanmaken** — zie hieronder voor de tabellen (SQL is apart aangeleverd).
2. **`config.php` invullen** met de echte Supabase-gegevens (Project
   Settings → Database → Connection parameters).
3. Zorg dat de PHP-extensie `pdo_pgsql` actief is op je server.
4. Wachtwoord van de beheerder aanmaken:
   ```bash
   php hash_password.php "mijnGeheimeWachtwoord123"
   ```
   en de output als `wachtwoord_hash` in de tabel `beheerders` zetten.
5. Server starten om te testen:
   ```bash
   php -S localhost:8000
   ```

## Belangrijke aandachtspunten (te bespreken met de opdrachtgever)

- De studentenlogin controleert enkel of het studentnummer bestaat in de
  tabel `studenten` — er is geen wachtwoord voor studenten (zo was het
  origineel front-end-ontwerp al opgezet). Indien gewenst kan hier later
  een wachtwoordveld aan toegevoegd worden.
- De actie `list` (nodig om reizen te tonen) geeft voor elke reis ook de
  bijhorende inschrijvingen (incl. identiteitsbewijs en opmerkingen) mee,
  omdat de front-end deze gegevens nodig heeft om "ingeschreven" te tonen.
  Dit betekent dat deze gegevens technisch ook zichtbaar zijn voor
  bezoekers die de netwerkaanvragen bekijken. Voor een productieomgeving
  is het aan te raden dit verder af te schermen (bv. een aparte,
  beveiligde route voor de volledige inschrijvingsgegevens).
