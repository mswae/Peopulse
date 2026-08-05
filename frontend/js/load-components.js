/**
 * Loads HTML component fragments into the page.
 * Requires a local/static server (file:// fetch is blocked by browsers).
 */
const COMPONENTS = [
  { file: 'nav.html', target: '#app-nav' },
  { file: 'hero.html', target: '#app-pages' },
  { file: 'login.html', target: '#app-pages' },
  { file: 'upload.html', target: '#app-pages' },
  { file: 'output.html', target: '#app-pages' },
  { file: 'recent.html', target: '#app-pages' },
  { file: 'toast.html', target: '#app-toast' },
];

async function loadApp() {
  const root = document.getElementById('app');
  try {
    const fragments = await Promise.all(
      COMPONENTS.map(async ({ file }) => {
        const res = await fetch(`components/${file}`);
        if (!res.ok) throw new Error(`Failed to load ${file}: ${res.status}`);
        return res.text();
      })
    );

    fragments.forEach((html, i) => {
      document
        .querySelector(COMPONENTS[i].target)
        .insertAdjacentHTML('beforeend', html);
    });

    root.dataset.ready = 'true';
  } catch (err) {
    console.error(err);
    root.innerHTML =
      '<p style="padding:48px;font-family:sans-serif;color:#991B1B;">Failed to load UI. From <code>frontend/</code>, run <code>python3 -m http.server 3456</code> — opening the HTML file directly will not work.</p>';
  }
}

document.addEventListener('DOMContentLoaded', loadApp);
