# EZlauncher Site

Static download site for EZlauncher, intended for Portainer deployment behind the existing Traefik/Appwrite gateway.

## What it does

- serves the landing page for `ddsplayground.com`
- exposes `/updates/windows/latest.json`
- exposes `/updates/windows/latest.yml`
- redirects `/download` to the GitHub release asset for the latest installer

## Deploy in Portainer

Use repository deploy with:

- Repository URL: `https://github.com/ddloads/ezlauncher-site`
- Reference: `refs/heads/main`
- Compose path: `docker-compose.yml`

The stack expects the external Docker network `gateway` to already exist and the shared Traefik instance to honor the `traefik.constraint-label-stack=appwrite` label.
