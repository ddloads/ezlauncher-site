const fmt = new Intl.NumberFormat('en-US');

fetch('/api/releases')
  .then((r) => r.json())
  .then((releases) => {
    if (!releases.length) return;

    const latest = releases[0];
    const sizeMb = `${(latest.size / (1024 * 1024)).toFixed(1)} MB`;
    const date = new Date(latest.releaseDate);

    document.getElementById('version-pill').textContent = latest.version;
    document.getElementById('hero-version').textContent = `v${latest.version}`;
    document.getElementById('hero-date').textContent = `Published ${date.toISOString().slice(0, 10)}`;
    document.getElementById('size-pill').textContent = sizeMb;
    document.getElementById('artifact-name').textContent = latest.fileName;
    document.getElementById('artifact-version').textContent = `Version ${latest.version}`;
    document.getElementById('artifact-size').textContent = `${fmt.format(latest.size)} bytes`;

    if (latest.downloadUrl) {
      for (const id of ['primary-download', 'artifact-download']) {
        const el = document.getElementById(id);
        if (el) el.href = latest.downloadUrl;
      }
    }

    const list = document.getElementById('versions-list');
    const older = releases.slice(1);
    if (!older.length) {
      list.innerHTML = '<p class="muted">No previous versions available.</p>';
      return;
    }

    list.innerHTML = older.map((r) => {
      const d = new Date(r.releaseDate).toISOString().slice(0, 10);
      const size = r.size ? `${(r.size / (1024 * 1024)).toFixed(1)} MB` : '';
      const downloadHref = r.downloadUrl || `/download/${r.version}`;
      return `
        <div class="version-row">
          <div class="version-info">
            <span class="version-tag">v${r.version}</span>
            <span class="version-date">${d}</span>
            ${size ? `<span class="version-size">${size}</span>` : ''}
          </div>
          <a class="btn btn-secondary btn-sm" href="${downloadHref}">Download</a>
        </div>`;
    }).join('');
  })
  .catch(() => {
    const list = document.getElementById('versions-list');
    if (list) list.innerHTML = '<p class="muted">Could not load version history.</p>';
  });