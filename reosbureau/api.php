<?php
/**
 * Ga Lekker Reizen — API
 * Eén centraal bestand dat alle server-acties afhandelt via ?action=...
 * Alle data wordt opgehaald/opgeslagen in de Supabase (PostgreSQL) database.
 */

session_start();

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/db.php';

/* ---------- Algemene helpers ---------- */

function respond($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function getJsonBody() {
    $raw = file_get_contents('php://input');
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function requireFields($body, $fields) {
    foreach ($fields as $f) {
        if (!isset($body[$f]) || $body[$f] === '') {
            respond(['error' => "Veld '$f' is verplicht."], 400);
        }
    }
}

/** Controleert of de huidige sessie een ingelogde beheerder is. */
function isAdmin(): bool {
    return !empty($_SESSION['is_admin']);
}

/** Blokkeert de actie als er geen beheerder is ingelogd. */
function requireAdmin() {
    if (!isAdmin()) {
        respond(['error' => 'Je bent niet ingelogd als beheerder.'], 401);
    }
}

/**
 * Zet een reis-rij uit de database om naar de vorm die de front-end
 * verwacht (camelCase sleutels, met geneste inschrijvingen).
 */
function formatTrip(array $reis, array $inschrijvingen): array {
    return [
        'id'             => $reis['id'],
        'title'          => $reis['titel'],
        'destination'    => $reis['bestemming'],
        'description'    => $reis['omschrijving'] ?? '',
        'type'           => $reis['type'] ?? 'Cultuurtrip',
        'startDate'      => $reis['begindatum'],
        'endDate'        => $reis['einddatum'],
        'maxEnrollments' => (int)$reis['max_inschrijvingen'],
        'imageUrl'       => $reis['afbeelding_url'] ?? '',
        'enrollments'    => array_map(function ($i) {
            return [
                'studentNumber'      => $i['studentnummer'],
                'reisId'             => $i['reis_id'],
                'identityCardNumber' => $i['identiteitsbewijs'],
                'remarks'            => $i['opmerkingen'] ?? '',
            ];
        }, $inschrijvingen),
    ];
}

/* ---------- Router ---------- */

$action = $_GET['action'] ?? $_POST['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];
$pdo = getDbConnection();

switch ($action) {

    /* ===================== REIZEN (CRUD) ===================== */

    // Alle reizen ophalen, inclusief hun inschrijvingen (voor home, studentenportaal én admin)
    case 'list':
        $reizenStmt = $pdo->query('SELECT * FROM reizen ORDER BY begindatum ASC');
        $reizen = $reizenStmt->fetchAll();

        $inschrijvingenStmt = $pdo->query('SELECT * FROM inschrijvingen ORDER BY ingeschreven_op ASC');
        $alleInschrijvingen = $inschrijvingenStmt->fetchAll();

        $result = array_map(function ($reis) use ($alleInschrijvingen) {
            $vanDezeReis = array_values(array_filter(
                $alleInschrijvingen,
                fn($i) => $i['reis_id'] === $reis['id']
            ));
            return formatTrip($reis, $vanDezeReis);
        }, $reizen);

        respond($result);
        break;

    // Nieuwe reis toevoegen — alleen beheerder
    case 'add':
        if ($method !== 'POST') respond(['error' => 'Methode niet toegestaan.'], 405);
        requireAdmin();

        $body = getJsonBody();
        requireFields($body, ['id', 'title', 'destination', 'startDate', 'endDate']);

        $stmt = $pdo->prepare('SELECT id FROM reizen WHERE id = :id');
        $stmt->execute(['id' => $body['id']]);
        if ($stmt->fetch()) {
            respond(['error' => 'Reis-ID bestaat al.'], 409);
        }

        $insert = $pdo->prepare(
            'INSERT INTO reizen (id, titel, bestemming, omschrijving, type, begindatum, einddatum, max_inschrijvingen, afbeelding_url)
             VALUES (:id, :titel, :bestemming, :omschrijving, :type, :begindatum, :einddatum, :max, :afbeelding)'
        );
        $insert->execute([
            'id'           => $body['id'],
            'titel'        => $body['title'],
            'bestemming'   => $body['destination'],
            'omschrijving' => $body['description'] ?? '',
            'type'         => $body['type'] ?? 'Cultuurtrip',
            'begindatum'   => $body['startDate'],
            'einddatum'    => $body['endDate'],
            'max'          => (int)($body['maxEnrollments'] ?? 20),
            'afbeelding'   => $body['imageUrl'] ?? '',
        ]);

        $nieuweReis = $pdo->prepare('SELECT * FROM reizen WHERE id = :id');
        $nieuweReis->execute(['id' => $body['id']]);
        respond(formatTrip($nieuweReis->fetch(), []), 201);
        break;

    // Reis aanpassen — alleen beheerder
    case 'update':
        if ($method !== 'POST') respond(['error' => 'Methode niet toegestaan.'], 405);
        requireAdmin();

        $body = getJsonBody();
        requireFields($body, ['id', 'title', 'destination', 'startDate', 'endDate']);

        $update = $pdo->prepare(
            'UPDATE reizen SET titel = :titel, bestemming = :bestemming, omschrijving = :omschrijving,
             type = :type, begindatum = :begindatum, einddatum = :einddatum,
             max_inschrijvingen = :max, afbeelding_url = :afbeelding
             WHERE id = :id'
        );
        $update->execute([
            'id'           => $body['id'],
            'titel'        => $body['title'],
            'bestemming'   => $body['destination'],
            'omschrijving' => $body['description'] ?? '',
            'type'         => $body['type'] ?? 'Cultuurtrip',
            'begindatum'   => $body['startDate'],
            'einddatum'    => $body['endDate'],
            'max'          => (int)($body['maxEnrollments'] ?? 20),
            'afbeelding'   => $body['imageUrl'] ?? '',
        ]);

        if ($update->rowCount() === 0) {
            respond(['error' => 'Reis niet gevonden.'], 404);
        }
        respond(['ok' => true]);
        break;

    // Reis verwijderen — alleen beheerder (inschrijvingen worden automatisch mee verwijderd, zie ON DELETE CASCADE)
    case 'delete':
        if ($method !== 'POST') respond(['error' => 'Methode niet toegestaan.'], 405);
        requireAdmin();

        $body = getJsonBody();
        requireFields($body, ['id']);

        $delete = $pdo->prepare('DELETE FROM reizen WHERE id = :id');
        $delete->execute(['id' => $body['id']]);

        if ($delete->rowCount() === 0) {
            respond(['error' => 'Reis niet gevonden.'], 404);
        }
        respond(['ok' => true]);
        break;

    /* ===================== INSCHRIJVINGEN ===================== */

    // Student schrijft zich in voor een reis
    case 'enroll':
        if ($method !== 'POST') respond(['error' => 'Methode niet toegestaan.'], 405);
        $body = getJsonBody();
        requireFields($body, ['reisId', 'studentNumber', 'identityCardNumber']);

        // Controleer dat het studentnummer bekend is in de database
        $studentStmt = $pdo->prepare('SELECT studentnummer FROM studenten WHERE studentnummer = :sn');
        $studentStmt->execute(['sn' => $body['studentNumber']]);
        if (!$studentStmt->fetch()) {
            respond(['error' => 'Onbekend studentnummer.'], 404);
        }

        try {
            $pdo->beginTransaction();

            // Reis + huidig aantal inschrijvingen opvragen en vergrendelen (voorkomt te veel inschrijvingen bij gelijktijdige verzoeken)
            $reisStmt = $pdo->prepare('SELECT max_inschrijvingen FROM reizen WHERE id = :id FOR UPDATE');
            $reisStmt->execute(['id' => $body['reisId']]);
            $reis = $reisStmt->fetch();

            if (!$reis) {
                $pdo->rollBack();
                respond(['error' => 'Reis niet gevonden.'], 404);
            }

            $telStmt = $pdo->prepare('SELECT COUNT(*) AS aantal FROM inschrijvingen WHERE reis_id = :id');
            $telStmt->execute(['id' => $body['reisId']]);
            $aantal = (int)$telStmt->fetch()['aantal'];

            if ($aantal >= (int)$reis['max_inschrijvingen']) {
                $pdo->rollBack();
                respond(['error' => 'Deze reis is volzet.'], 409);
            }

            $insert = $pdo->prepare(
                'INSERT INTO inschrijvingen (studentnummer, reis_id, identiteitsbewijs, opmerkingen)
                 VALUES (:sn, :reis_id, :idkaart, :opmerkingen)'
            );
            $insert->execute([
                'sn'          => $body['studentNumber'],
                'reis_id'     => $body['reisId'],
                'idkaart'     => $body['identityCardNumber'],
                'opmerkingen' => $body['remarks'] ?? '',
            ]);

            $pdo->commit();
        } catch (PDOException $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            // Unieke-sleutel-schending = student was al ingeschreven voor deze reis
            if ($e->getCode() === '23505') {
                respond(['error' => 'Je bent al ingeschreven voor deze reis.'], 409);
            }
            error_log('Fout bij inschrijven: ' . $e->getMessage());
            respond(['error' => 'Er ging iets mis bij het inschrijven.'], 500);
        }

        respond(['ok' => true]);
        break;

    // Student schrijft zich uit voor een reis
    case 'unenroll':
        if ($method !== 'POST') respond(['error' => 'Methode niet toegestaan.'], 405);
        $body = getJsonBody();
        requireFields($body, ['reisId', 'studentNumber']);

        $delete = $pdo->prepare('DELETE FROM inschrijvingen WHERE reis_id = :reis_id AND studentnummer = :sn');
        $delete->execute(['reis_id' => $body['reisId'], 'sn' => $body['studentNumber']]);

        if ($delete->rowCount() === 0) {
            respond(['error' => 'Inschrijving niet gevonden.'], 404);
        }
        respond(['ok' => true]);
        break;

    /* ===================== INLOGGEN — STUDENT ===================== */

    // Controleert of het opgegeven studentnummer bestaat (studenten staan al vooraf in de database)
    case 'student-login':
        if ($method !== 'POST') respond(['error' => 'Methode niet toegestaan.'], 405);
        $body = getJsonBody();
        requireFields($body, ['studentNumber']);

        $stmt = $pdo->prepare('SELECT studentnummer, naam FROM studenten WHERE studentnummer = :sn');
        $stmt->execute(['sn' => $body['studentNumber']]);
        $student = $stmt->fetch();

        if (!$student) {
            respond(['error' => 'Onbekend studentnummer. Neem contact op met het GLR.'], 404);
        }
        respond(['ok' => true, 'naam' => $student['naam']]);
        break;

    /* ===================== INLOGGEN — BEHEERDER ===================== */

    // Beheerder logt in met het vooraf ingestelde wachtwoord
    case 'admin-login':
        if ($method !== 'POST') respond(['error' => 'Methode niet toegestaan.'], 405);
        $body = getJsonBody();
        requireFields($body, ['wachtwoord']);

        $stmt = $pdo->query('SELECT wachtwoord_hash FROM beheerders LIMIT 1');
        $beheerder = $stmt->fetch();

        if (!$beheerder || !password_verify($body['wachtwoord'], $beheerder['wachtwoord_hash'])) {
            respond(['error' => 'Onjuist wachtwoord.'], 401);
        }

        // Sessie-ID vernieuwen bij het inloggen (voorkomt session fixation)
        session_regenerate_id(true);
        $_SESSION['is_admin'] = true;
        respond(['ok' => true]);
        break;

    // Beheerder uitloggen
    case 'admin-logout':
        if ($method !== 'POST') respond(['error' => 'Methode niet toegestaan.'], 405);
        $_SESSION = [];
        session_destroy();
        respond(['ok' => true]);
        break;

    // Front-end vraagt bij het openen van het adminscherm na of er al een geldige sessie is
    case 'admin-check':
        respond(['loggedIn' => isAdmin()]);
        break;

    default:
        respond(['error' => 'Onbekende actie.'], 400);
}
