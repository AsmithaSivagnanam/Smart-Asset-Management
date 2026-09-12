const API_BASE_URL = 'http://localhost:3001/api';
const SERVER_BASE_URL = 'http://localhost:3001';

async function parseResponse(response) {
  const data = await response.json();

  if (!response.ok) {
    const details = Array.isArray(data.details) ? `: ${data.details.join(', ')}` : '';
    throw new Error(`${data.error || 'Request failed'}${details}`);
  }

  return data;
}

function jsonRequest(url, options = {}) {
  return fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  }).then(parseResponse);
}

export function getHealth() {
  return fetch(`${SERVER_BASE_URL}/health`).then(parseResponse);
}

export function registerIdentity(identity) {
  return jsonRequest('/identity/register', {
    method: 'POST',
    body: JSON.stringify(identity)
  });
}

export function getIdentity(did) {
  return jsonRequest(`/identity/${encodeURIComponent(did)}`);
}

export function mintAsset(asset) {
  return jsonRequest('/assets/mint', {
    method: 'POST',
    body: JSON.stringify(asset)
  });
}

export function getAssetsByOwner(did) {
  return jsonRequest(`/assets/owner/${encodeURIComponent(did)}`);
}

export function createAccessRequest(accessRequest) {
  return jsonRequest('/access/request', {
    method: 'POST',
    body: JSON.stringify(accessRequest)
  });
}

export function updateAccessRequestStatus(requestId, status) {
  return jsonRequest(`/access/${encodeURIComponent(requestId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
}

export function getAuditLogs() {
  return jsonRequest('/audit/logs');
}
