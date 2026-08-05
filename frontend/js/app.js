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
