# habitora.ch

Website habitora.ch – statische Seite, automatischer Upload auf Metanet.

## Aufbau

- `site/` – die Website, wird 1:1 auf den Server geladen
- `.github/workflows/deploy.yml` – automatischer Upload per FTP zu Metanet bei jeder Änderung auf `main`
- `CLAUDE.md` – Hinweise für Claude beim Bearbeiten
- `wrangler.jsonc` – Vorschau-Links über Cloudflare Workers (nicht die echte Seite)

## Einrichtung Upload (einmalig)

In GitHub unter **Settings → Secrets and variables → Actions**:

| Typ | Name | Wert |
|---|---|---|
| Secret | `FTP_SERVER` | FTP-Server aus Plesk |
| Secret | `FTP_USERNAME` | FTP-Benutzer |
| Secret | `FTP_PASSWORD` | Passwort |
| Variable (optional) | `FTP_DIR` | Zielordner, Standard `/httpdocs/` |

Danach unter **Actions → Auf Metanet hochladen → Run workflow** einmal manuell starten.

## Vorschau pro Branch (Cloudflare Workers)

Jeder Push erzeugt eine Vorschau unter `*.habitora.mischaweyermann.workers.dev`, ohne dass gemergt werden muss.
Einstellungen im Cloudflare-Dashboard unter **Workers & Pages → habitora → Settings → Build**:

| Einstellung | Wert |
|---|---|
| Production branch | `main` |
| Deploy command | `npx wrangler deploy` |
| Builds for non-production branches | aktiviert |
| Non-production branch deploy command | `npx wrangler versions upload` |

Die Vorschau-Adresse steht danach bei jedem Pull Request unter den Checks (Cloudflare-Kommentar).
Das Kontaktformular sendet in der Vorschau nicht (kein PHP); alles andere funktioniert.
