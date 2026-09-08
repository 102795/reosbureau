<?php
/**
 * Configuratie voor de databaseverbinding met Supabase (PostgreSQL).
 *
 * Waar vind je deze gegevens?
 * In je Supabase-project: Project Settings → Database → Connection parameters.
 * Gebruik bij voorkeur de "Session pooler" of "Transaction pooler" host/poort
 * als je op een gedeelde ict-lab server draait (poort 6543 i.p.v. 5432).
 *
 * LET OP: dit bestand bevat het databasewachtwoord. Zorg dat het NIET
 * publiek toegankelijk is (niet in een map die de webserver direct
 * serveert als download, en niet in git committen met echte waarden).
 */

return [
    'host'     => 'db.eahyjcvttlwzwnfsmwkc.supabase.co', // <-- placeholder: Supabase database host
    'port'     => '5432',                                 // 5432 = directe verbinding, 6543 = connection pooler
    'dbname'   => 'postgres',                              // <-- placeholder: standaard 'postgres'
    'user'     => 'postgres',                              // <-- placeholder: standaard 'postgres'
    'password' => 'AapjeMonkey321!',              // <-- placeholder: jouw databasewachtwoord
    'sslmode'  => 'require',                               // Supabase vereist een SSL-verbinding
];
