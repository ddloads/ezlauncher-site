require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const GITHUB_REPO = process.env.GITHUB_REPO || 'ddloads/ezlauncher-site';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const STATIC_DIR = path.join(__dirname, 'site');
const CACHE_TTL = 5 * 60 * 1000;

let releasesCache = null;
let releasesCacheExpiry = 0;

function githubHeaders() {
  const headers = {
    'User-Agent': 'ezlauncher-site',
    'Accept': 'application/vnd.github+json',
  };
  if (GITHUB_TOKEN) headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`;
  return headers;
}

async function fetchReleases() {
  if (releasesCache && Date.now() < releasesCacheExpiry) return releasesCache;
  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases`, {
    headers: githubHeaders(),
  });
  if (!res.ok) throw new Error(`GitHub API returned ${res.status}`);
  releasesCache = await res.json();
  releasesCacheExpiry = Date.now() + CACHE_TTL;
  return releasesCache;
}

function formatRelease(release) {
  const exe = release.assets.find(
    (a) => a.name.endsWith('.exe') && !a.name.endsWith('.blockmap')
  );
  const blockmap = release.assets.find((a) => a.name.endsWith('.exe.blockmap'));
  return {
    version: release.tag_name.replace(/^v/, ''),
    tag: release.tag_name,
    releaseDate: release.published_at,
    name: release.name || release.tag_name,
    notes: release.body || '',
    prerelease: release.prerelease,
    fileName: exe?.name ?? null,
    size: exe?.size ?? 0,
    downloadUrl: exe?.browser_download_url ?? null,
    blockmapUrl: blockmap?.browser_download_url ?? null,
  };
}

function latestRelease(releases) {
  return releases.find((r) => !r.draft && !r.prerelease) ?? releases[0];
}

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  next();
});

// All releases (used by the frontend version history)
app.get('/api/releases', async (req, res) => {
  try {
    const releases = await fetchReleases();
    res.json(releases.filter((r) => !r.draft).map(formatRelease));
  } catch {
    res.status(502).json({ error: 'Failed to fetch releases from GitHub' });
  }
});

// Latest release metadata (electron-updater JSON format)
app.get('/updates/windows/latest.json', async (req, res) => {
  try {
    const releases = await fetchReleases();
    const latest = latestRelease(releases);
    if (!latest) return res.status(404).json({ error: 'No releases found' });
    res.json(formatRelease(latest));
  } catch {
    // Fall back to the static file if GitHub is unreachable
    res.sendFile(path.join(STATIC_DIR, 'updates/windows/latest.json'));
  }
});

// latest.yml — proxy from release assets, fall back to static file
app.get('/updates/windows/latest.yml', async (req, res) => {
  try {
    const releases = await fetchReleases();
    const latest = latestRelease(releases);
    const ymlAsset = latest?.assets.find((a) => a.name === 'latest.yml');
    if (ymlAsset) {
      const ymlRes = await fetch(ymlAsset.browser_download_url, { headers: githubHeaders() });
      res.setHeader('Content-Type', 'text/yaml');
      return res.send(await ymlRes.text());
    }
  } catch { /* fall through */ }
  res.sendFile(path.join(STATIC_DIR, 'updates/windows/latest.yml'));
});

// Download latest installer
app.get('/download', async (req, res) => {
  try {
    const releases = await fetchReleases();
    const latest = latestRelease(releases);
    const exe = latest?.assets.find(
      (a) => a.name.endsWith('.exe') && !a.name.endsWith('.blockmap')
    );
    if (!exe) return res.status(404).send('No installer found in latest release');
    return res.redirect(302, exe.browser_download_url);
  } catch {
    res.status(502).send('Failed to fetch latest release from GitHub');
  }
});

// Download a specific version by tag, e.g. /download/0.1.0 or /download/v0.1.0
app.get('/download/:version', async (req, res) => {
  try {
    const releases = await fetchReleases();
    const tag = req.params.version.startsWith('v')
      ? req.params.version
      : `v${req.params.version}`;
    const release = releases.find((r) => r.tag_name === tag);
    if (!release) return res.status(404).send('Version not found');
    const exe = release.assets.find(
      (a) => a.name.endsWith('.exe') && !a.name.endsWith('.blockmap')
    );
    if (!exe) return res.status(404).send('No installer for this version');
    res.redirect(302, exe.browser_download_url);
  } catch {
    res.status(502).send('Failed to fetch releases from GitHub');
  }
});

// Static files
app.use(express.static(STATIC_DIR));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(STATIC_DIR, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT} — tracking ${GITHUB_REPO}`);
});
