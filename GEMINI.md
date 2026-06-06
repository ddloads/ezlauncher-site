# EZlauncher Site

Static landing page and update metadata server for EZlauncher, serving `ddsplayground.com`.

## Project Overview

- **Purpose:** Serves the landing page for EZlauncher and provides metadata endpoints for application updates.
- **Technology Stack:**
  - **Web Server:** Node.js / Express.
  - **Frontend:** Vanilla HTML, CSS, and JavaScript.
  - **Deployment:** Docker Compose, Portainer.
- **Architecture:** A Node.js application serving static assets from `/site` and handling redirects for `/download`.

## Directory Structure

- `/site`: Contains the static website assets.
- `server.js`: Express server configuration.
- `package.json`: Node.js dependencies.
- `Dockerfile`: Builds the Node.js image.
- `docker-compose.yml`: Deployment configuration.

## Building and Running

### Local Development
```powershell
npm install
npm start
```
The site will be available at `http://localhost:3000` (or the PORT defined in `.env`).

### Docker Build
```powershell
docker build -t ezlauncher-site .
```

### Deployment
The project is designed to be deployed as a stack in Portainer:
1. Point Portainer to the GitHub repository.
2. Use `docker-compose.yml` as the entry point.
3. Configure `PORT`, `DOWNLOAD_URL`, and `BLOCKMAP_URL` in the Environment Variables section.

## Development Conventions

- **Updates:** When a new release is published, update:
  - `site/updates/windows/latest.json` (and `.yml` if applicable).
  - `.env` (update `DOWNLOAD_URL` and `BLOCKMAP_URL`).
  - `site/releases.json`.
- **Styling:** Vanilla CSS in `site/styles.css`.
- **Scripting:** Vanilla JS in `site/app.js`, targeting specific IDs for content injection.
