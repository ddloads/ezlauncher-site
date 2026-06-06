fetch('/api/releases')
  .then((r) => r.json())
  .then((releases) => {
    const list = document.getElementById('versions-list');
    if (!releases.length) {
      list.innerHTML = '<p class="muted">No versions available.</p>';
      return;
    }
    list.innerHTML = releases.map((r, i) => {
      const date = new Date(r.releaseDate).toISOString().slice(0, 10);
      const size = r.size ? `${(r.size / (1024 * 1024)).toFixed(1)} MB` : '';
      const href = r.downloadUrl || `/download/${r.version}`;
      const isLatest = i === 0;
      return `
        <div class="version-row">
          <div class="version-info">
            <span class="version-tag">v${r.version}</span>
            ${isLatest ? '<span class="version-badge">Latest</span>' : ''}
            <span class="version-date">${date}</span>
            ${size ? `<span class="version-size">${size}</span>` : ''}
          </div>
          <a class="btn ${isLatest ? 'btn-primary' : 'btn-secondary'} btn-sm" href="${href}">Download</a>
        </div>`;
    }).join('');
  })
  .catch(() => {
    const list = document.getElementById('versions-list');
    if (list) list.innerHTML = '<p class="muted">Could not load versions.</p>';
  });