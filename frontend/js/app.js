/* ── Navigation ── */
function goto(p) {
  document.querySelectorAll('.page').forEach((x) => x.classList.remove('active'));
  document.getElementById('page-' + p).classList.add('active');
  window.scrollTo(0, 0);
}

/* ── Toast ── */
function toast(msg) {
  const el = document.getElementById('toastEl');
  document.getElementById('toastMsg').textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3000);
}

/* ── File upload ── */
let selectedFile = null;

function onDrop(e) {
  e.preventDefault();
  document.getElementById('dz').classList.remove('dz-active');
  const f = e.dataTransfer.files[0];
  if (f) showFile(f);
}

function onFileSelect(e) {
  const f = e.target.files[0];
  if (f) showFile(f);
}

function showFile(f) {
  selectedFile = f;
  document.getElementById('fn').textContent = f.name;
  document.getElementById('fs').textContent = (f.size / 1048576).toFixed(1) + ' MB';
  document.getElementById('fp').style.display = 'flex';
  document.getElementById('dz').style.display = 'none';
}

function rmFile() {
  selectedFile = null;
  document.getElementById('fp').style.display = 'none';
  document.getElementById('dz').style.display = 'block';
  document.getElementById('fi').value = '';
}

/* ── Analysis simulation ── */
function runAnalysis() {
  const pw = document.getElementById('prog-wrap');
  const pf = document.getElementById('prog-fill');
  const pl = document.getElementById('prog-lbl');
  const pp = document.getElementById('prog-pct');
  pw.style.display = 'block';
  const steps = [
    'Validating file…',
    'Parsing columns…',
    'Running sentiment model…',
    'Extracting themes…',
    'Generating summary…',
  ];
  const sids = ['st1', 'st2', 'st3', 'st4', 'st5'];
  let i = 0;
  const iv = setInterval(() => {
    const pct = Math.round(((i + 1) / 5) * 100);
    pf.style.width = pct + '%';
    pp.textContent = pct + '%';
    pl.textContent = steps[i] || 'Complete!';
    if (sids[i]) document.getElementById(sids[i]).classList.add('done');
    i++;
    if (i >= 5) {
      clearInterval(iv);
      setTimeout(() => goto('output'), 500);
    }
  }, 700);
}

/* ── Recent analyses tabs ── */
function switchTab(el) {
  document.querySelectorAll('.rec-tab').forEach((t) => t.classList.remove('active'));
  el.classList.add('active');
}

/* Expose for inline handlers */
window.goto = goto;
window.toast = toast;
window.onDrop = onDrop;
window.onFileSelect = onFileSelect;
window.rmFile = rmFile;
window.runAnalysis = runAnalysis;
window.switchTab = switchTab;
