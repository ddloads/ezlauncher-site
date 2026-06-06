fetch('/updates/windows/latest.json')
  .then((r) => r.json())
  .then((data) => {
    const sizeMb = `${(data.size / (1024 * 1024)).toFixed(1)} MB`;
    const date = new Date(data.releaseDate);

    document.getElementById('version-pill').textContent = data.version;
    document.getElementById('hero-version').textContent = `v${data.version}`;
    document.getElementById('hero-date').textContent = `Published ${date.toISOString().slice(0, 10)}`;
    document.getElementById('size-pill').textContent = sizeMb;

    const dl = document.getElementById('primary-download');
    if (dl && data.downloadUrl) dl.href = data.downloadUrl;

    document.getElementById('notes-title').textContent = `EZlauncher ${data.version}`;

    if (data.notes?.length) {
      const notes = Array.isArray(data.notes) ? data.notes : [data.notes];
      document.getElementById('notes-list').innerHTML = notes.map((n) => `<li>${n}</li>`).join('');
    }
  })
  .catch(() => {});
