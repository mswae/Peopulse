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
  const msgEl = document.getElementById('toastMsg');
  
  // CRITICAL FIX: Prevent silent crashes if toast elements are missing
  if (!el || !msgEl) {
    console.error("Toast Error:", msg);
    alert(msg); 
    return;
  }
  
  msgEl.textContent = msg;
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

/* ── Real backend analysis ── */
function updateProgress(stepIndex, label, pctValue) {
  const pw = document.getElementById('prog-wrap');
  const pf = document.getElementById('prog-fill');
  const pl = document.getElementById('prog-lbl');
  const pp = document.getElementById('prog-pct');
  const sids = ['st1', 'st2', 'st3', 'st4', 'st5'];

  pw.style.display = 'block';
  pf.style.width = pctValue + '%';
  pp.textContent = pctValue + '%';
  pl.textContent = label;

  sids.forEach((id, idx) => {
    const el = document.getElementById(id);
    if (el) {
      el.classList.toggle('done', idx < stepIndex);
    }
  });
}

function renderAnalysisResult(result) {
  const payload = result && result.analysis ? result.analysis : result || {};
  const analysis = payload && payload.analysis ? payload.analysis : payload;
  const filename = result && result.filename ? result.filename : 'uploaded_file.csv';
  const rows = result && typeof result.rows_detected !== 'undefined' ? result.rows_detected : 0;

  const topPraises = Array.isArray(analysis.top_praises) ? analysis.top_praises : [];
  const topComplaints = Array.isArray(analysis.top_complaints) ? analysis.top_complaints : [];
  const recommendations = Array.isArray(analysis.actionable_recommendations)
    ? analysis.actionable_recommendations
    : Array.isArray(analysis.recommendations)
      ? analysis.recommendations
      : [];

  document.getElementById('output-eyebrow').textContent = `Analysis Complete · ${filename}`;
  document.getElementById('output-sub').textContent = `${rows} feedback entries analyzed`;
  document.getElementById('summary-text').textContent = recommendations.length
    ? recommendations.join(' ')
    : 'The AI analysis completed successfully. Review the generated themes and recommendations below.';

  const praiseWrap = document.getElementById('positive-list');
  const complaintWrap = document.getElementById('negative-list');
  const recommendationWrap = document.getElementById('recommendation-list');

  praiseWrap.innerHTML = topPraises.length
    ? topPraises.map((item) => `
        <div class="fb-item pos"><div class="fb-dot pos">✓</div><div class="fb-text">${item}</div></div>
      `).join('')
    : '<div class="fb-item pos"><div class="fb-dot pos">✓</div><div class="fb-text">No praise items were returned by the model.</div></div>';

  complaintWrap.innerHTML = topComplaints.length
    ? topComplaints.map((item) => `
        <div class="fb-item neg"><div class="fb-dot neg">✕</div><div class="fb-text">${item}</div></div>
      `).join('')
    : '<div class="fb-item neg"><div class="fb-dot neg">✕</div><div class="fb-text">No complaint items were returned by the model.</div></div>';

  recommendationWrap.innerHTML = recommendations.length
    ? recommendations.map((item) => `
        <div class="fb-item"><div class="fb-dot">→</div><div class="fb-text">${item}</div></div>
      `).join('')
    : '<div class="fb-item"><div class="fb-dot">→</div><div class="fb-text">No recommendations were returned by the model.</div></div>';
}

async function runAnalysis() {
  if (!selectedFile) {
    toast('Please select a CSV file first');
    return;
  }

  const steps = [
    'Validating file…',
    'Parsing columns…',
    'Running AI analysis…',
    'Extracting themes…',
    'Generating summary…',
  ];

  steps.forEach((label, idx) => {
    updateProgress(idx + 1, label, Math.round(((idx + 1) / steps.length) * 100));
  });

  try {
    const result = await window.API.uploadCsv(selectedFile);
    renderAnalysisResult(result);
    updateProgress(steps.length, 'Complete!', 100);
    setTimeout(() => goto('output'), 500);
  } catch (err) {
    console.error(err);
    updateProgress(0, 'Analysis failed', 0);
    toast(err.message || 'Analysis failed');
  }
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
window.switchTab = switchTab;