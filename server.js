require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;
const DOWNLOAD_URL = process.env.DOWNLOAD_URL || 'https://github.com/ddloads/ezlauncher-site/releases/download/v0.2.0/EZlauncher.Setup.0.2.0.exe';
const BLOCKMAP_URL = process.env.BLOCKMAP_URL || 'https://github.com/ddloads/ezlauncher-site/releases/download/v0.2.0/EZlauncher.Setup.0.2.0.exe.blockmap';

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  next();
});

// Trust proxy for deployment behind Traefik
app.set('trust proxy', 1);

// Redirects
app.get('/download', (req, res) => {
  res.redirect(302, DOWNLOAD_URL);
});

app.get('/download/blockmap', (req, res) => {
  res.redirect(302, BLOCKMAP_URL);
});

// Serve static files from the 'site' directory
app.use(express.static(path.join(__dirname, 'site')));

// Fallback to index.html for SPA-like behavior
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'site', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
