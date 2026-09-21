const backendBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const API_BASE_URL = `${backendBaseUrl}/api`;
const SERVER_BASE_URL = backendBaseUrl;

async function parseResponse(response) {
  const data = await response.json();
  if (!response.ok) {
    const details = Array.isArray(data.details) ? `: ${data.details.join(', ')}` : '';
    throw new Error(`${data.error || 'Request failed'}${details}`);
  }
  return data;
}

function request(path, options = {}) {
  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
  }).then(parseResponse);
}

export const getHealth = () => fetch(`${SERVER_BASE_URL}/health`).then(parseResponse);
export const registerIdentity = (identity) => request('/identity/register', { method: 'POST', body: JSON.stringify(identity) });
export const getIdentity = (did) => request(`/identity/${encodeURIComponent(did)}`);
export const mintAsset = (asset) => request('/assets/mint', { method: 'POST', body: JSON.stringify(asset) });
export const getAssetsByOwner = (did) => request(`/assets/owner/${encodeURIComponent(did)}`);
export const createAccessRequest = (accessRequest) => request('/access/request', { method: 'POST', body: JSON.stringify(accessRequest) });
export const updateAccessRequestStatus = (requestId, status) => request(`/access/${encodeURIComponent(requestId)}`, { method: 'PATCH', body: JSON.stringify({ status }) });
export const getAuditLogs = () => request('/audit/logs');
