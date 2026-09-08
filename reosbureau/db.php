<?php
/**
 * Databaseverbinding met Supabase (PostgreSQL) via PDO.
 * Wordt door api.php aangeroepen; geeft telkens dezelfde (gecachete)
 * verbinding terug zodat er niet per actie opnieuw verbonden wordt.
 */

function getDbConnection(): PDO
{
    static $pdo = null;

    if ($pdo !== null) {
        return $pdo;
    }

    $config = require __DIR__ . '/config.php';

    $dsn = sprintf(
        'pgsql:host=%s;port=%s;dbname=%s;sslmode=%s',
        $config['host'],
        $config['port'],
        $config['dbname'],
        $config['sslmode']
    );

    try {
        $pdo = new PDO($dsn, $config['user'], $config['password'], [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
    } catch (PDOException $e) {
        // Geen technische details tonen aan de gebruiker, wel loggen voor de beheerder.
        error_log('Databaseverbinding mislukt: ' . $e->getMessage());
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['error' => 'Kan geen verbinding maken met de database.']);
        exit;
    }

    return $pdo;
}
