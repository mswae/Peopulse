/* ── Navigation (History API so Back restores the upload view) ── */
function pageFromUrl() {
  const view = new URL(window.location.href).searchParams.get('view');
  return view === 'output' ? 'output' : 'upload';
}

function pageUrl(p) {
  const url = new URL(window.location.href);
  if (p === 'output') url.searchParams.set('view', 'output');
  else url.searchParams.delete('view');
  return url.pathname + url.search + url.hash;
}

function showPage(p) {
  document.querySelectorAll('.page').forEach((x) => x.classList.remove('active'));
  const page = document.getElementById('page-' + p);
  if (page) page.classList.add('active');
  document.body.dataset.view = p;
  pageDragDepth = 0;
  setPageDragging(false);
  window.scrollTo(0, 0);
}

/** @param {'push'|'replace'|'none'} [historyMode] */
function goto(p, historyMode = 'push') {
  showPage(p);
  if (historyMode === 'none') return;
  const url = pageUrl(p);
  const state = { page: p };
  if (historyMode === 'replace') history.replaceState(state, '', url);
  else if (history.state?.page !== p || pageFromUrl() !== p) history.pushState(state, '', url);
}

function initRouting() {
  const page = pageFromUrl();
  showPage(page);
  history.replaceState({ page }, '', pageUrl(page));
}

window.addEventListener('popstate', (e) => {
  const page = e.state?.page || pageFromUrl();
  showPage(page);
});

/* ── Toast ── */
function toast(msg) {
  const el = document.getElementById('toastEl');
  document.getElementById('toastMsg').textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3000);
}

/* ── File upload ── */
let selectedFile = null;
const ALLOWED_EXT = ['csv', 'xlsx', 'xls'];
const MAX_BYTES = 50 * 1024 * 1024;
let pageDragDepth = 0;

function isUploadPageActive() {
  const page = document.getElementById('page-upload');
  return !!(page && page.classList.contains('active'));
}

function dragHasFiles(e) {
  return Array.from(e.dataTransfer?.types || []).includes('Files');
}

function setPageDragging(on) {
  const page = document.getElementById('page-upload');
  const dz = document.getElementById('dz');
  if (page) page.classList.toggle('is-dragging', on);
  if (dz) dz.classList.toggle('dz-active', on);
}

function onFileSelect(e) {
  const f = e.target.files[0];
  if (f) showFile(f);
  e.target.value = '';
}

function acceptDroppedFiles(fileList) {
  if (!fileList || !fileList.length) return;
  if (fileList.length > 1) toast('Only the first file will be used.');
  showFile(fileList[0]);
}

document.addEventListener('dragenter', (e) => {
  if (!isUploadPageActive() || !dragHasFiles(e)) return;
  e.preventDefault();
  pageDragDepth += 1;
  setPageDragging(true);
});

document.addEventListener('dragover', (e) => {
  if (!isUploadPageActive() || !dragHasFiles(e)) return;
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
});

document.addEventListener('dragleave', (e) => {
  if (!isUploadPageActive() || !dragHasFiles(e)) return;
  pageDragDepth = Math.max(0, pageDragDepth - 1);
  if (pageDragDepth === 0) setPageDragging(false);
});

document.addEventListener('drop', (e) => {
  if (!isUploadPageActive()) return;
  const files = e.dataTransfer?.files;
  if (!files?.length && !dragHasFiles(e)) return;
  e.preventDefault();
  pageDragDepth = 0;
  setPageDragging(false);
  acceptDroppedFiles(files);
});

function showFile(f) {
  const ext = f.name.split('.').pop().toLowerCase();
  if (!ALLOWED_EXT.includes(ext)) {
    toast('Please pick a CSV, XLSX, or XLS file.');
    return;
  }
  if (f.size > MAX_BYTES) {
    toast('That file is too big. Please pick a file under 50MB.');
    return;
  }

  selectedFile = f;
  document.getElementById('fn').textContent = f.name;
  const typeLabel = ext.toUpperCase();
  const sizeLabel =
    f.size < 1024 * 1024
      ? Math.max(1, Math.round(f.size / 1024)) + ' KB'
      : (f.size / 1048576).toFixed(1) + ' MB';
  document.getElementById('fs').textContent = typeLabel + ' · ' + sizeLabel;
  document.getElementById('fp').hidden = false;
  document.getElementById('fp').removeAttribute('aria-hidden');
  document.getElementById('fp').tabIndex = 0;
  document.getElementById('dz').classList.add('is-hidden');
  document.getElementById('dz').setAttribute('aria-hidden', 'true');
  document.getElementById('dz').tabIndex = -1;
  document.getElementById('btn-run').disabled = false;
}

function rmFile() {
  selectedFile = null;
  const fp = document.getElementById('fp');
  fp.hidden = true;
  fp.setAttribute('aria-hidden', 'true');
  fp.tabIndex = -1;
  const dz = document.getElementById('dz');
  dz.classList.remove('is-hidden');
  dz.removeAttribute('aria-hidden');
  dz.tabIndex = 0;
  document.getElementById('fi').value = '';
  document.getElementById('btn-run').disabled = true;
  const pw = document.getElementById('prog-wrap');
  if (pw) {
    pw.classList.remove('is-visible');
    pw.setAttribute('aria-hidden', 'true');
    document.getElementById('prog-fill').style.width = '0%';
  }
}

/* ── Summarize (UI progress; wire to API later) ── */
function runAnalysis() {
  if (!selectedFile) {
    toast('Choose a file first');
    return;
  }

  const pw = document.getElementById('prog-wrap');
  const pf = document.getElementById('prog-fill');
  const pl = document.getElementById('prog-lbl');
  const pp = document.getElementById('prog-pct');
  const btn = document.getElementById('btn-run');
  pw.classList.add('is-visible');
  pw.setAttribute('aria-hidden', 'false');
  btn.disabled = true;

  const steps = ['Reading responses…', 'Finding the big ideas…', 'Summarizing each question…'];
  let i = 0;
  const iv = setInterval(() => {
    const pct = Math.round(((i + 1) / steps.length) * 100);
    pf.style.width = pct + '%';
    pp.textContent = pct + '%';
    pl.textContent = steps[i] || 'Done';
    i++;
    if (i >= steps.length) {
      clearInterval(iv);
      setTimeout(() => {
        btn.disabled = false;
        goto('output');
      }, 320);
    }
  }, 520);
}

/* ── Results: question expand / collapse (open by default) ── */
function setQuestionOpen(item, open) {
  const head = item.querySelector('.q-head');
  const panel = item.querySelector('.q-detail-panel');
  item.classList.toggle('is-open', open);
  if (head) head.setAttribute('aria-expanded', open ? 'true' : 'false');
  if (panel) panel.setAttribute('aria-hidden', open ? 'false' : 'true');
}

function initQuestionDetails() {
  document.querySelectorAll('.q-item').forEach((item) => {
    const head = item.querySelector('.q-head');
    if (!head || head.dataset.bound === '1') return;
    head.dataset.bound = '1';
    head.addEventListener('click', () => {
      setQuestionOpen(item, !item.classList.contains('is-open'));
    });
  });
}

window.goto = goto;
window.initRouting = initRouting;
window.initQuestionDetails = initQuestionDetails;
window.toast = toast;
window.onFileSelect = onFileSelect;
window.rmFile = rmFile;
window.runAnalysis = runAnalysis;
