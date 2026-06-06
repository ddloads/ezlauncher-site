# EZlauncher Site

Landing page and download server for EZlauncher, hosted at [ddsplayground.com](https://ddsplayground.com).

## What it does

- Serves the landing page with auto-updating version info and release notes
- Lists all available versions at `/versions`
- Redirects `/download` to the latest installer
- Redirects `/download/:version` (e.g. `/download/v0.2.0`) to a specific version's installer
- Exposes `/api/releases` — JSON array of all releases
- Exposes `/updates/windows/latest.json` — latest release metadata (used by the launcher auto-updater)
- Exposes `/updates/windows/latest.yml` — Electron auto-updater compatible metadata

All release data is driven by files in `site/releases/`. No external API calls required.

## Adding a new release

1. Create `site/releases/vX.Y.Z.json` with the release data:

```json
{
  "version": "X.Y.Z",
  "releaseDate": "2026-01-01T00:00:00Z",
  "platform": "windows-x64",
  "fileName": "EZlauncher Setup X.Y.Z.exe",
  "size": 135213880,
  "sha256": "<sha256 hash>",
  "sha512": "<sha512 hash>",
  "downloadUrl": "https://github.com/ddloads/ezlauncher-site/releases/download/vX.Y.Z/EZlauncher.Setup.X.Y.Z.exe",
  "blockmapUrl": "https://github.com/ddloads/ezlauncher-site/releases/download/vX.Y.Z/EZlauncher.Setup.X.Y.Z.exe.blockmap",
  "notes": [
    "What changed in this release.",
    "Another change."
  ]
}
```

2. Prepend the version tag to `site/releases/index.json`:

```json
["vX.Y.Z", "v0.2.0"]
```

The site picks up the new version automatically on the next request — no redeployment needed.

## Project structure

```
site/
  releases/
    index.json          # Ordered list of version tags, newest first
    v0.2.0.json         # Per-release data (version, size, URLs, notes)
  updates/windows/
    latest.yml          # Static Electron auto-updater YAML (update per release)
  assets/               # Images
  index.html            # Landing page
  versions.html         # All versions page
  app.js                # Homepage JS (populates hero + release notes)
  versions.js           # Versions page JS
  styles.css            # Shared styles
server.js               # Express server
docker-compose.yml      # Docker Compose deployment config
Dockerfile              # Docker image
```

## Deploy in Portainer

Use repository deploy with:

- Repository URL: `https://github.com/ddloads/ezlauncher-site`
- Reference: `refs/heads/main`
- Compose path: `docker-compose.yml`

The only required environment variable is `PORT` (defaults to `3000`).

## Launcher auto-updater

Point `electron-builder`'s publish config at this server:

```json
"build": {
  "publish": {
    "provider": "generic",
    "url": "https://ddsplayground.com/updates/windows/"
  }
}
```

The launcher will fetch `latest.yml` to check for updates. Remember to update `site/updates/windows/latest.yml` alongside the release JSON when publishing a new version.