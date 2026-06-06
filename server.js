require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const STATIC_DIR = path.join(__dirname, 'site');
const GITHUB_REPO = process.env.GITHUB_REPO || 'ddloads/ezlauncher-site';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

let cache = { data: null, ts: 0 };

function githubHeaders() {
  const h = { 'User-Agent': 'ezlauncher-site', 'Accept': 'application/vnd.github+json' };
  if (GITHUB_TOKEN) h['Authorization'] = `Bearer ${GITHUB_TOKEN}`;
  return h;
}

function parseNotes(body) {
  if (!body) return [];
  return body
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.startsWith('- '))
    .map(l => l.replace(/^-\s+/, ''))
    .filter(Boolean);
}

async function fetchReleases() {
  if (cache.data && Date.now() - cache.ts < CACHE_TTL) return cache.data;

  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases`, {
    headers: githubHeaders(),
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status}`);

  const ghReleases = await res.json();
  const releases = ghReleases
    .filter(r => !r.draft && !r.prerelease)
    .map(r => {
      const exe = r.assets.find(a => a.name.endsWith('.exe'));
      const blockmap = r.assets.find(a => a.name.endsWith('.blockmap'));
      const ymlAsset = r.assets.find(a => a.name === 'latest.yml');
      return {
        version: r.tag_name.replace(/^v/, ''),
        releaseDate: r.published_at,
        platform: 'windows-x64',
        fileName: exe?.name ?? '',
        size: exe?.size ?? 0,
        downloadUrl: exe?.browser_download_url ?? '',
        blockmapUrl: blockmap?.browser_download_url ?? '',
        latestYmlUrl: ymlAsset?.browser_download_url ?? '',
        notes: parseNotes(r.body),
      };
    });

  cache = { data: releases, ts: Date.now() };
  return releases;
}

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  next();
});

// All releases (used by versions page)
app.get('/api/releases', async (req, res) => {
  try {
    res.json(await fetchReleases());
  } catch (e) {
    console.error('Failed to fetch releases:', e.message);
    res.status(502).json({ error: 'Failed to fetch releases from GitHub' });
  }
});

// Latest release metadata (used by homepage + launcher update check)
app.get('/updates/windows/latest.json', async (req, res) => {
  try {
    const releases = await fetchReleases();
    if (!releases.length) return res.status(404).json({ error: 'No releases found' });
    res.json(releases[0]);
  } catch (e) {
    console.error('Failed to fetch latest release:', e.message);
    res.status(502).json({ error: 'Failed to fetch latest release' });
  }
});

// latest.yml — proxied from GitHub release asset (used by electron-updater)
app.get('/updates/windows/latest.yml', async (req, res) => {
  try {
    const releases = await fetchReleases();
    const ymlUrl = releases[0]?.latestYmlUrl;
    if (!ymlUrl) return res.status(404).send('latest.yml not found');
    const upstream = await fetch(ymlUrl, { headers: githubHeaders() });
    if (!upstream.ok) return res.status(502).send('Failed to fetch latest.yml');
    res.setHeader('Content-Type', 'text/yaml; charset=utf-8');
    res.send(await upstream.text());
  } catch (e) {
    console.error('Failed to proxy latest.yml:', e.message);
    res.status(502).send('Failed to proxy latest.yml');
  }
});

// Download latest installer
app.get('/download', async (req, res) => {
  try {
    const releases = await fetchReleases();
    const url = releases[0]?.downloadUrl;
    if (!url) return res.status(404).send('No download available');
    res.redirect(302, url);
  } catch {
    res.status(502).send('Failed to fetch latest release');
  }
});

// Download a specific version e.g. /download/v0.2.1 or /download/0.2.1
app.get('/download/:version', async (req, res) => {
  try {
    const tag = req.params.version.startsWith('v') ? req.params.version : `v${req.params.version}`;
    const releases = await fetchReleases();
    const release = releases.find(r => `v${r.version}` === tag);
    if (!release?.downloadUrl) return res.status(404).send('Version not found');
    res.redirect(302, release.downloadUrl);
  } catch {
    res.status(502).send('Failed to fetch releases');
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