<?php
/**
 * Hulpscript: genereert een veilige (bcrypt) hash van een wachtwoord.
 * Gebruik dit om het beheerderswachtwoord aan te maken vóórdat je het
 * in de tabel 'beheerders' zet — sla NOOIT het wachtwoord zelf op.
 *
 * Gebruik via de command line:
 *   php hash_password.php "mijnGeheimeWachtwoord123"
 *
 * Plak de output daarna in Supabase, bv.:
 *   insert into beheerders (wachtwoord_hash) values ('<geplakte hash>');
 *
 * Dit bestand hoeft niet mee naar de live server; het is enkel een
 * lokaal hulpmiddel tijdens de opzet.
 */

if ($argc < 2) {
    echo "Gebruik: php hash_password.php \"jouw-wachtwoord\"" . PHP_EOL;
    exit(1);
}

$wachtwoord = $argv[1];
$hash = password_hash($wachtwoord, PASSWORD_BCRYPT);

echo "Hash voor beheerderswachtwoord:" . PHP_EOL;
echo $hash . PHP_EOL;
