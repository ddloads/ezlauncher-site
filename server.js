require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3000;
const STATIC_DIR = path.join(__dirname, 'site');
const RELEASES_DIR = path.join(STATIC_DIR, 'releases');

async function readReleases() {
  const index = JSON.parse(await fs.readFile(path.join(RELEASES_DIR, 'index.json'), 'utf8'));
  return Promise.all(
    index.map((tag) => fs.readFile(path.join(RELEASES_DIR, `${tag}.json`), 'utf8').then(JSON.parse))
  );
}

async function readRelease(version) {
  const tag = version.startsWith('v') ? version : `v${version}`;
  return JSON.parse(await fs.readFile(path.join(RELEASES_DIR, `${tag}.json`), 'utf8'));
}

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  next();
});

// All releases
app.get('/api/releases', async (req, res) => {
  try {
    res.json(await readReleases());
  } catch {
    res.status(500).json({ error: 'Failed to read releases' });
  }
});

// Latest release metadata (electron-updater / page display)
app.get('/updates/windows/latest.json', async (req, res) => {
  try {
    const releases = await readReleases();
    res.json(releases[0]);
  } catch {
    res.status(500).json({ error: 'Failed to read latest release' });
  }
});

// Download latest installer
app.get('/download', async (req, res) => {
  try {
    const releases = await readReleases();
    const url = releases[0]?.downloadUrl;
    if (!url) return res.status(404).send('No download URL for latest release');
    res.redirect(302, url);
  } catch {
    res.status(500).send('Failed to read latest release');
  }
});

// Download a specific version, e.g. /download/0.2.0 or /download/v0.2.0
app.get('/download/:version', async (req, res) => {
  try {
    const release = await readRelease(req.params.version);
    if (!release.downloadUrl) return res.status(404).send('No download URL for this version');
    res.redirect(302, release.downloadUrl);
  } catch {
    res.status(404).send('Version not found');
  }
});

// Versions page
app.get('/versions', (req, res) => {
  res.sendFile(path.join(STATIC_DIR, 'versions.html'));
});

// Static files
app.use(express.static(STATIC_DIR));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(STATIC_DIR, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
