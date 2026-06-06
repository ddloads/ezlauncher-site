const fmt = new Intl.NumberFormat('en-US');
fetch('/updates/windows/latest.json')
  .then((r) => r.json())
  .then((data) => {
    const sizeMb = `${(data.size / (1024 * 1024)).toFixed(1)} MB`;
    const date = new Date(data.releaseDate);
    document.getElementById('version-pill').textContent = data.version;
    document.getElementById('hero-version').textContent = `v${data.version}`;
    document.getElementById('hero-date').textContent = `Published ${date.toISOString().slice(0, 10)}`;
    document.getElementById('size-pill').textContent = sizeMb;
    document.getElementById('artifact-name').textContent = data.fileName;
    document.getElementById('artifact-version').textContent = `Version ${data.version}`;
    document.getElementById('artifact-size').textContent = `${fmt.format(data.size)} bytes`;
    document.getElementById('checksum').textContent = data.sha256;
    for (const id of ['primary-download', 'artifact-download']) {
      const el = document.getElementById(id);
      if (el) el.href = data.downloadUrl;
    }
  })
  .catch(() => {});
