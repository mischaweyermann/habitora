<?php
/**
 * Kontaktformular habitora.ch
 * Sendet Anfragen per E-Mail an Habitora.
 */

require __DIR__ . '/termine.php';

// ---- Einstellungen -------------------------------------------------------
$EMPFAENGER = 'hallo@habitora.ch';
$ABSENDER   = 'website@habitora.ch';   // Adresse der eigenen Domain (wichtig für Zustellung)
$BETREFF    = 'Neue Anfrage über habitora.ch';
// --------------------------------------------------------------------------

header('X-Content-Type-Options: nosniff');

$wantsJson = isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false;

function antwort($ok, $message = '', $extra = []) {
    global $wantsJson;
    if ($wantsJson) {
        header('Content-Type: application/json; charset=utf-8');
        http_response_code($ok ? 200 : 400);
        echo json_encode(['ok' => $ok, 'message' => $message] + $extra, JSON_UNESCAPED_UNICODE);
    } else {
        header('Location: /?' . ($ok ? 'gesendet=1' : 'fehler=1') . '#kontakt', true, 303);
    }
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Location: /#kontakt', true, 303);
    exit;
}

function feld($name, $max) {
    $v = isset($_POST[$name]) ? (string) $_POST[$name] : '';
    $v = trim(str_replace("\0", '', $v));
    if (function_exists('mb_substr')) {
        $v = mb_substr($v, 0, $max, 'UTF-8');
    } else {
        $v = substr($v, 0, $max);
    }
    return $v;
}
function einzeilig($v) {
    return trim(preg_replace('/[\r\n\t]+/', ' ', $v));
}

// Spam-Schutz: Honeypot-Feld muss leer bleiben
if (!empty($_POST['website'])) {
    antwort(true); // Bots bekommen eine "Erfolg"-Antwort, es wird aber nichts gesendet
}
// Spam-Schutz: Formular darf nicht schneller als in 3 Sekunden ausgefüllt sein
$t = isset($_POST['t']) ? (int) $_POST['t'] : 0;
if ($t > 0 && (round(microtime(true) * 1000) - $t) < 3000) {
    }

$name      = einzeilig(feld('name', 120));
$email     = einzeilig(feld('email', 160));
$telefon   = einzeilig(feld('telefon', 40));
$leistung  = einzeilig(feld('dienstleistung', 80));
$nachricht = feld('nachricht', 5000);
$fragebogen = feld('fragebogen', 1000);
$termin    = einzeilig(feld('termin', 16));

if ($termin !== '' && !preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/', $termin)) {
    $termin = '';
}
if ($name === '' || ($nachricht === '' && $termin === '')) {
    antwort(false, 'Bitte füllen Sie Name und Nachricht aus.');
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    antwort(false, 'Bitte geben Sie eine gültige E-Mail-Adresse an.');
}
// Einfacher Link-Spam-Filter
if (preg_match_all('~https?://~i', $nachricht) > 3) {
    antwort(false, 'Ihre Nachricht enthält zu viele Links. Bitte kontaktieren Sie mich direkt per E-Mail.');
}

// Termin reservieren (vor dem Senden, damit ihn niemand gleichzeitig bucht)
$freigabeCode = '';
if ($termin !== '') {
    $buchung = termin_buchen($termin, $name);
    if (!$buchung['ok']) {
        antwort(false, $buchung['message'], ['vergeben' => !empty($buchung['vergeben'])]);
    }
    $freigabeCode = $buchung['code'];
}
$schema = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$freigabeLink = $schema . '://habitora.ch/termine.php?absagen=' . $freigabeCode;

$zeilen = [
    'Neue Anfrage über das Kontaktformular auf habitora.ch',
    '',
    'Name:            ' . $name,
    'E-Mail:          ' . $email,
    'Telefon:         ' . ($telefon !== '' ? $telefon : '–'),
    'Dienstleistung:  ' . ($leistung !== '' ? $leistung : '–'),
    'Termin:          ' . ($termin !== '' ? termin_text($termin) : '–'),
    '',
    'Nachricht:',
    $nachricht !== '' ? $nachricht : '–',
    '',
];
if ($termin !== '') {
    $zeilen[] = 'Der Termin ist auf der Website jetzt belegt. Falls er nicht stattfindet,';
    $zeilen[] = 'hier wieder freigeben: ' . $freigabeLink;
    $zeilen[] = '';
}
if ($fragebogen !== '') {
    $zeilen[] = 'Antworten aus dem Angebotsfinder:';
    $zeilen[] = $fragebogen;
    $zeilen[] = '';
}
$zeilen[] = '—';
$zeilen[] = 'Gesendet am ' . date('d.m.Y \u\m H:i') . ' Uhr';
$text = implode("\r\n", $zeilen);

$betreff = $BETREFF . ($termin !== '' ? ' – Termin ' . date('d.m.Y H:i', strtotime($termin)) : '') . ($leistung !== '' ? ' – ' . $leistung : '');
$betreffKodiert = '=?UTF-8?B?' . base64_encode($betreff) . '?=';
$nameKodiert = '=?UTF-8?B?' . base64_encode('habitora.ch Website') . '?=';

$headers = [
    'From: ' . $nameKodiert . ' <' . $ABSENDER . '>',
    'Reply-To: ' . $email,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'X-Mailer: habitora.ch',
];

$ok = @mail($EMPFAENGER, $betreffKodiert, $text, implode("\r\n", $headers), '-f' . $ABSENDER);

if (!$ok) {
    if ($freigabeCode !== '') termin_freigeben($freigabeCode);
    antwort(false, 'Die Nachricht konnte leider nicht gesendet werden. Bitte kontaktieren Sie mich direkt per Telefon oder E-Mail.');
}

// Bestätigung an die Kundin / den Kunden, wenn ein Termin gebucht wurde
if ($termin !== '') {
    $bestaetigung = implode("\r\n", [
        'Guten Tag ' . $name,
        '',
        'Vielen Dank für deine Anfrage. Dein Termin für das kostenlose Erstgespräch:',
        '',
        '    ' . termin_text($termin),
        '',
        'Wir melden uns vorher kurz, um zu klären, ob wir telefonieren oder uns vor Ort treffen.',
        'Falls der Termin nicht passt, antworte einfach auf diese E-Mail oder ruf an: 079 764 65 85.',
        '',
        'Herzliche Grüsse',
        'Habitora',
        'hallo@habitora.ch · habitora.ch',
    ]);
    $kopf = [
        'From: ' . '=?UTF-8?B?' . base64_encode('Habitora') . '?=' . ' <' . $ABSENDER . '>',
        'Reply-To: ' . $EMPFAENGER,
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: 8bit',
        'X-Mailer: habitora.ch',
    ];
    @mail($email, '=?UTF-8?B?' . base64_encode('Dein Termin bei Habitora – ' . termin_text($termin)) . '?=', $bestaetigung, implode("\r\n", $kopf), '-f' . $ABSENDER);
}

antwort(true, '', ['termin' => $termin !== '' ? termin_text($termin) : '']);
