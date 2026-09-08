<?php
/**
 * Horizon Reizen — API
 * Simpele JSON-file-backend voor reizen en inschrijvingen.
 * Alle acties gaan via dit ene bestand: ?action=...
 */

header('Content-Type: application/json; charset=utf-8');

$dataFile = __DIR__ . '/data/trips.json';

/* ---------- Helpers ---------- */

function readTrips($file) {
    if (!file_exists($file)) {
        return [];
    }
    $fp = fopen($file, 'r');
    if (!$fp) return [];
    flock($fp, LOCK_SH);
    $content = stream_get_contents($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
    $data = json_decode($content, true);
    return is_array($data) ? $data : [];
}

function writeTrips($file, $trips) {
    $fp = fopen($file, 'c');
    if (!$fp) return false;
    flock($fp, LOCK_EX);
    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, json_encode($trips, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
    return true;
}

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

/* ---------- Router ---------- */

$action = $_GET['action'] ?? $_POST['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

switch ($action) {

    case 'list':
        respond(readTrips($dataFile));
        break;

    case 'add':
        if ($method !== 'POST') respond(['error' => 'Methode niet toegestaan.'], 405);
        $body = getJsonBody();
        requireFields($body, ['id', 'title', 'destination', 'startDate', 'endDate']);

        $trips = readTrips($dataFile);
        foreach ($trips as $t) {
            if ($t['id'] === $body['id']) {
                respond(['error' => 'Reis-ID bestaat al.'], 409);
            }
        }

        $newTrip = [
            'id' => $body['id'],
            'title' => $body['title'],
            'destination' => $body['destination'],
            'description' => $body['description'] ?? '',
            'type' => $body['type'] ?? 'Cultuurtrip',
            'startDate' => $body['startDate'],
            'endDate' => $body['endDate'],
            'maxEnrollments' => (int)($body['maxEnrollments'] ?? 20),
            'imageUrl' => $body['imageUrl'] ?? '',
            'enrollments' => [],
        ];
        $trips[] = $newTrip;
        writeTrips($dataFile, $trips);
        respond($newTrip, 201);
        break;

    case 'update':
        if ($method !== 'POST') respond(['error' => 'Methode niet toegestaan.'], 405);
        $body = getJsonBody();
        requireFields($body, ['id', 'title', 'destination', 'startDate', 'endDate']);

        $trips = readTrips($dataFile);
        $found = false;
        foreach ($trips as &$t) {
            if ($t['id'] === $body['id']) {
                $t['title'] = $body['title'];
                $t['destination'] = $body['destination'];
                $t['description'] = $body['description'] ?? '';
                $t['type'] = $body['type'] ?? $t['type'];
                $t['startDate'] = $body['startDate'];
                $t['endDate'] = $body['endDate'];
                $t['maxEnrollments'] = (int)($body['maxEnrollments'] ?? $t['maxEnrollments']);
                $t['imageUrl'] = $body['imageUrl'] ?? $t['imageUrl'];
                $found = true;
                break;
            }
        }
        unset($t);
        if (!$found) respond(['error' => 'Reis niet gevonden.'], 404);
        writeTrips($dataFile, $trips);
        respond(['ok' => true]);
        break;

    case 'delete':
        if ($method !== 'POST') respond(['error' => 'Methode niet toegestaan.'], 405);
        $body = getJsonBody();
        requireFields($body, ['id']);

        $trips = readTrips($dataFile);
        $before = count($trips);
        $trips = array_values(array_filter($trips, fn($t) => $t['id'] !== $body['id']));
        if (count($trips) === $before) respond(['error' => 'Reis niet gevonden.'], 404);
        writeTrips($dataFile, $trips);
        respond(['ok' => true]);
        break;

    case 'enroll':
        if ($method !== 'POST') respond(['error' => 'Methode niet toegestaan.'], 405);
        $body = getJsonBody();
        requireFields($body, ['reisId', 'studentNumber', 'identityCardNumber']);

        $trips = readTrips($dataFile);
        $found = false;
        foreach ($trips as &$t) {
            if ($t['id'] === $body['reisId']) {
                $found = true;
                foreach ($t['enrollments'] as $e) {
                    if ($e['studentNumber'] === $body['studentNumber']) {
                        respond(['error' => 'Je bent al ingeschreven voor deze reis.'], 409);
                    }
                }
                if (count($t['enrollments']) >= $t['maxEnrollments']) {
                    respond(['error' => 'Deze reis is volzet.'], 409);
                }
                $t['enrollments'][] = [
                    'studentNumber' => $body['studentNumber'],
                    'reisId' => $body['reisId'],
                    'identityCardNumber' => $body['identityCardNumber'],
                    'remarks' => $body['remarks'] ?? '',
                ];
                break;
            }
        }
        unset($t);
        if (!$found) respond(['error' => 'Reis niet gevonden.'], 404);
        writeTrips($dataFile, $trips);
        respond(['ok' => true]);
        break;

    case 'unenroll':
        if ($method !== 'POST') respond(['error' => 'Methode niet toegestaan.'], 405);
        $body = getJsonBody();
        requireFields($body, ['reisId', 'studentNumber']);

        $trips = readTrips($dataFile);
        $found = false;
        foreach ($trips as &$t) {
            if ($t['id'] === $body['reisId']) {
                $found = true;
                $t['enrollments'] = array_values(array_filter(
                    $t['enrollments'],
                    fn($e) => $e['studentNumber'] !== $body['studentNumber']
                ));
                break;
            }
        }
        unset($t);
        if (!$found) respond(['error' => 'Reis niet gevonden.'], 404);
        writeTrips($dataFile, $trips);
        respond(['ok' => true]);
        break;

    default:
        respond(['error' => 'Onbekende actie.'], 400);
}
