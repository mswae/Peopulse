/**
 * Backend API client.
 * Backend: POST /upload-csv (multipart file) → analysis JSON
 */
async function uploadCsv(file) {
  const form = new FormData();
  form.append('file', file);

  const res = await fetch(`${CONFIG.API_BASE_URL}/upload-csv`, {
    method: 'POST',
    body: form,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const detail = data.detail || res.statusText || 'Upload failed';
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
  }

  return data;
}

async function healthCheck() {
  const res = await fetch(`${CONFIG.API_BASE_URL}/`);
  if (!res.ok) throw new Error('API health check failed');
  return res.json();
}

window.API = { uploadCsv, healthCheck };
