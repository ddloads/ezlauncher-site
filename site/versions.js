fetch('/api/releases')
  .then((r) => r.json())
  .then((releases) => {
    const list = document.getElementById('versions-list');
    if (!Array.isArray(releases) || !releases.length) {
      list.innerHTML = '<p class="muted">No versions available.</p>';
      return;
    }

    list.innerHTML = releases.map((r, i) => {
      const date = new Date(r.releaseDate).toISOString().slice(0, 10);
      const size = r.size ? `${(r.size / (1024 * 1024)).toFixed(1)} MB` : '';
      const href = r.downloadUrl || `/download/${r.version}`;
      const isLatest = i === 0;
      const hasNotes = r.notes && r.notes.length > 0;
      const id = `notes-${r.version.replace(/\./g, '-')}`;

      return `
        <div class="version-row ${hasNotes ? 'version-row--expandable' : ''}">
          <div class="version-main">
            <div class="version-info">
              <span class="version-tag">v${r.version}</span>
              ${isLatest ? '<span class="version-badge">Latest</span>' : ''}
              <span class="version-date">${date}</span>
              ${size ? `<span class="version-size">${size}</span>` : ''}
            </div>
            <div class="version-actions">
              ${hasNotes ? `
                <button class="btn-changelog" aria-expanded="false" aria-controls="${id}" onclick="toggleChangelog(this, '${id}')">
                  Changelog
                  <svg class="changelog-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                </button>` : ''}
              <a class="btn ${isLatest ? 'btn-primary' : 'btn-secondary'} btn-sm" href="${href}">Download</a>
            </div>
          </div>
          ${hasNotes ? `
            <div class="version-changelog" id="${id}" hidden>
              <ul class="changelog-list">
                ${r.notes.map(n => `<li>${n}</li>`).join('')}
              </ul>
            </div>` : ''}
        </div>`;
    }).join('');
  })
  .catch(() => {
    const list = document.getElementById('versions-list');
    if (list) list.innerHTML = '<p class="muted">Could not load versions.</p>';
  });

function toggleChangelog(btn, id) {
  const panel = document.getElementById(id);
  const expanded = btn.getAttribute('aria-expanded') === 'true';
  btn.setAttribute('aria-expanded', String(!expanded));
  panel.hidden = expanded;
}