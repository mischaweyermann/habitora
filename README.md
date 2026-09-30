# habitora.ch

Website habitora.ch – statische Seite, automatischer Upload auf Metanet.

## Aufbau

- `site/` – die Website, wird 1:1 auf den Server geladen
- `.github/workflows/deploy.yml` – automatischer Upload per FTP zu Metanet bei jeder Änderung auf `main`
- `CLAUDE.md` – Hinweise für Claude beim Bearbeiten

## Einrichtung Upload (einmalig)

In GitHub unter **Settings → Secrets and variables → Actions**:

| Typ | Name | Wert |
|---|---|---|
| Secret | `FTP_SERVER` | FTP-Server aus Plesk |
| Secret | `FTP_USERNAME` | FTP-Benutzer |
| Secret | `FTP_PASSWORD` | Passwort |
| Variable (optional) | `FTP_DIR` | Zielordner, Standard `/httpdocs/` |

Danach unter **Actions → Auf Metanet hochladen → Run workflow** einmal manuell starten.
