<?php
/**
 * Terminwahl habitora.ch
 *
 * Direkt aufgerufen:
 *   GET  /termine.php                → freie Termine als JSON (für das Kontaktformular)
 *   GET  /termine.php?absagen=CODE   → Seite zum Freigeben eines gebuchten Termins
 *   POST /termine.php (absagen=CODE) → gibt den Termin wieder frei
 * Von kontakt.php eingebunden: stellt die Funktionen zum Buchen bereit.
 *
 * Gebuchte Termine liegen in daten/buchungen.php (nicht im Repository,
 * wird vom Server selbst angelegt und beim Hochladen nicht überschrieben).
 */

// ---- Einstellungen -------------------------------------------------------
// Öffnungszeiten je Wochentag (1 = Montag … 7 = Sonntag)
$OEFFNUNGSZEITEN = [
    1 => [['13:00', '18:00']],                       // Montag
    5 => [['09:00', '12:00'], ['13:00', '18:00']],   // Freitag
];
$TERMIN_DAUER   = 60;   // Minuten pro Termin
$VORLAUF        = 24;   // frühestens so viele Stunden ab jetzt buchbar
$WOCHEN         = 8;    // so viele Wochen im Voraus buchbar
// Tage ohne Termine (Ferien, Feiertage), Format 'JJJJ-MM-TT', z. B. '2026-12-25'
$GESPERRTE_TAGE = [];
// --------------------------------------------------------------------------

date_default_timezone_set('Europe/Zurich');

define('TERMIN_DATEI', __DIR__ . '/daten/buchungen.php');
define('TERMIN_SCHUTZ', "<?php http_response_code(404); exit; ?>\n");

/** Öffnet die Buchungsdatei gesperrt und liefert [Handle, Buchungen]. */
function termine_oeffnen() {
    $ordner = dirname(TERMIN_DATEI);
    if (!is_dir($ordner)) @mkdir($ordner, 0750, true);
    $fh = @fopen(TERMIN_DATEI, 'c+');
    if (!$fh) return [null, []];
    flock($fh, LOCK_EX);
    $inhalt = stream_get_contents($fh);
    $json = substr((string) $inhalt, strlen(TERMIN_SCHUTZ));
    $daten = json_decode($json, true);
    return [$fh, is_array($daten) ? $daten : []];
}

function termine_schliessen($fh, $buchungen = null) {
    if (!$fh) return false;
    $ok = true;
    if ($buchungen !== null) {
        ftruncate($fh, 0);
        rewind($fh);
        $ok = fwrite($fh, TERMIN_SCHUTZ . json_encode(array_values($buchungen), JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT)) !== false;
        fflush($fh);
    }
    flock($fh, LOCK_UN);
    fclose($fh);
    return $ok;
}

/** Alle Termine (frei und belegt) der nächsten Wochen, nach Tag gruppiert. */
function termine_liste($belegt) {
    global $OEFFNUNGSZEITEN, $TERMIN_DAUER, $VORLAUF, $WOCHEN, $GESPERRTE_TAGE;
    $frueheste = time() + $VORLAUF * 3600;
    $tage = [];
    $tag = new DateTime('today');
    for ($i = 0; $i < $WOCHEN * 7; $i++, $tag->modify('+1 day')) {
        $wt = (int) $tag->format('N');
        $datum = $tag->format('Y-m-d');
        if (empty($OEFFNUNGSZEITEN[$wt]) || in_array($datum, $GESPERRTE_TAGE, true)) continue;
        $zeiten = [];
        foreach ($OEFFNUNGSZEITEN[$wt] as $fenster) {
            $start = strtotime($datum . ' ' . $fenster[0]);
            $ende  = strtotime($datum . ' ' . $fenster[1]);
            for ($t = $start; $t + $TERMIN_DAUER * 60 <= $ende; $t += $TERMIN_DAUER * 60) {
                if ($t < $frueheste) continue;
                $id = date('Y-m-d H:i', $t);
                $zeiten[] = ['zeit' => date('H:i', $t), 'frei' => !in_array($id, $belegt, true)];
            }
        }
        if ($zeiten) $tage[] = ['tag' => $datum, 'zeiten' => $zeiten];
    }
    return $tage;
}

function termine_belegt($buchungen) {
    return array_map(function ($b) { return $b['termin']; }, $buchungen);
}

/** Prüft, ob $id ('JJJJ-MM-TT HH:MM') ein buchbarer, freier Termin ist. */
function termin_ist_frei($id, $buchungen) {
    $datum = substr($id, 0, 10);
    $zeit = substr($id, 11);
    foreach (termine_liste(termine_belegt($buchungen)) as $t) {
        if ($t['tag'] !== $datum) continue;
        foreach ($t['zeiten'] as $z) {
            if ($z['zeit'] === $zeit) return $z['frei'];
        }
    }
    return false;
}

/**
 * Bucht einen Termin. Liefert den Freigabe-Code oder einen Fehlertext:
 * ['ok' => true, 'code' => '…'] bzw. ['ok' => false, 'message' => '…']
 */
function termin_buchen($id, $name) {
    list($fh, $buchungen) = termine_oeffnen();
    if (!$fh) {
        return ['ok' => false, 'message' => 'Die Terminwahl funktioniert gerade nicht. Bitte ruf an oder schreib ohne Termin.'];
    }
    if (!termin_ist_frei($id, $buchungen)) {
        termine_schliessen($fh);
        return ['ok' => false, 'vergeben' => true, 'message' => 'Dieser Termin ist leider nicht mehr frei. Bitte wähle einen anderen.'];
    }
    $code = bin2hex(random_bytes(16));
    $buchungen[] = ['termin' => $id, 'code' => $code, 'name' => $name, 'gebucht' => date('Y-m-d H:i')];
    if (!termine_schliessen($fh, $buchungen)) {
        return ['ok' => false, 'message' => 'Die Terminwahl funktioniert gerade nicht. Bitte ruf an oder schreib ohne Termin.'];
    }
    return ['ok' => true, 'code' => $code];
}

/** Gibt einen Termin wieder frei. Liefert die Buchung oder null. */
function termin_freigeben($code) {
    list($fh, $buchungen) = termine_oeffnen();
    if (!$fh) return null;
    foreach ($buchungen as $i => $b) {
        if (hash_equals($b['code'], (string) $code)) {
            unset($buchungen[$i]);
            termine_schliessen($fh, $buchungen);
            return $b;
        }
    }
    termine_schliessen($fh);
    return null;
}

/** 'JJJJ-MM-TT HH:MM' → 'Freitag, 9. Oktober 2026, 09:00–10:00 Uhr' */
function termin_text($id) {
    global $TERMIN_DAUER;
    $tage = [1 => 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
    $monate = [1 => 'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
    $t = strtotime($id);
    return $tage[(int) date('N', $t)] . ', ' . date('j', $t) . '. ' . $monate[(int) date('n', $t)] . ' ' . date('Y', $t)
        . ', ' . date('H:i', $t) . '–' . date('H:i', $t + $TERMIN_DAUER * 60) . ' Uhr';
}

// ---- Direkter Aufruf ------------------------------------------------------
if (realpath($_SERVER['SCRIPT_FILENAME'] ?? '') !== __FILE__) return;

header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

$code = isset($_REQUEST['absagen']) ? preg_replace('/[^a-f0-9]/', '', (string) $_REQUEST['absagen']) : '';

if ($code === '') {
    list($fh, $buchungen) = termine_oeffnen();
    termine_schliessen($fh);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => true, 'tage' => termine_liste(termine_belegt($buchungen))], JSON_UNESCAPED_UNICODE);
    exit;
}

// Freigabe-Seite: erst nach Klick auf den Knopf (POST) freigeben, damit
// Link-Vorschauen im E-Mail-Programm nichts auslösen.
$titel = 'Termin freigeben';
$text = '';
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $b = termin_freigeben($code);
    $text = $b
        ? '<p>Der Termin <strong>' . htmlspecialchars(termin_text($b['termin'])) . '</strong> (' . htmlspecialchars($b['name']) . ') ist wieder frei und kann auf der Website neu gewählt werden.</p>'
        : '<p>Dieser Termin wurde nicht gefunden. Vielleicht ist er schon freigegeben.</p>';
} else {
    list($fh, $buchungen) = termine_oeffnen();
    termine_schliessen($fh);
    $gefunden = null;
    foreach ($buchungen as $b) if (hash_equals($b['code'], $code)) $gefunden = $b;
    $text = $gefunden
        ? '<p>Termin <strong>' . htmlspecialchars(termin_text($gefunden['termin'])) . '</strong> mit ' . htmlspecialchars($gefunden['name']) . ' wieder freigeben?</p>'
          . '<form method="post"><input type="hidden" name="absagen" value="' . $code . '"><button type="submit">Ja, Termin freigeben</button></form>'
        : '<p>Dieser Termin wurde nicht gefunden. Vielleicht ist er schon freigegeben.</p>';
}
header('Content-Type: text/html; charset=utf-8');
?><!doctype html>
<html lang="de-CH">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title><?= $titel ?> – Habitora</title>
<style>
  body { font: 17px/1.5 system-ui, sans-serif; background: #f9f6f0; color: #1e221f; margin: 0; padding: 48px 16px; }
  main { max-width: 520px; margin: 0 auto; }
  h1 { color: #254032; font-size: 1.6rem; }
  button { font: inherit; padding: 12px 22px; border-radius: 999px; border: 0; background: #254032; color: #fff; cursor: pointer; }
  a { color: #254032; }
</style>
</head>
<body>
<main>
  <h1><?= $titel ?></h1>
  <?= $text ?>
  <p><a href="/">Zur Website</a></p>
</main>
</body>
</html>
