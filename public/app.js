// --- DOM Elements ---
const mcBadge = document.getElementById('mc-status-badge');
const btnStart = document.getElementById('btn-mc-start');
const btnStop = document.getElementById('btn-mc-stop');
const btnSync = document.getElementById('btn-dns-sync');
const dnsLog = document.getElementById('dns-log');

// --- Helper Functions ---
function updateMCBadge(status) {
  if (status === 'running') {
    mcBadge.textContent = 'RUNNING';
    mcBadge.className = 'px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
  } else {
    mcBadge.textContent = 'STOPPED';
    mcBadge.className = 'px-3 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20';
  }
}

// --- API Calls ---
async function fetchMCStatus() {
  try {
    const res = await fetch('/api/server/status');
    const data = await res.json();
    updateMCBadge(data.status);
  } catch (error) {
    console.error('Failed to fetch status:', error);
  }
}

btnStart.addEventListener('click', async () => {
  btnStart.textContent = 'Igniting...';
  try {
    const res = await fetch('/api/server/start', { method: 'POST' });
    const data = await res.json();
    updateMCBadge(data.status);
  } catch (err) {
    alert('Failed to contact daemon');
  }
  btnStart.textContent = 'Ignite Server';
});

btnStop.addEventListener('click', async () => {
  try {
    const res = await fetch('/api/server/stop', { method: 'POST' });
    const data = await res.json();
    updateMCBadge(data.status);
  } catch (err) {
    alert('Failed to contact daemon');
  }
});

btnSync.addEventListener('click', async () => {
  const zoneId = document.getElementById('cf-zone').value;
  const token = document.getElementById('cf-token').value;
  
  if (!zoneId || !token) {
    dnsLog.textContent = 'Error: Missing credentials';
    return;
  }

  btnSync.innerHTML = '<span class="animate-pulse">Syncing...</span>';
  dnsLog.textContent = 'Reaching out to Cloudflare...';

  try {
    const res = await fetch('/api/dns/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        zoneId,
        subdomains: ['mc.rworks.com'] // Hardcoded for your use case, can be made dynamic
      })
    });
    
    const data = await res.json();
    if (data.ip) {
      dnsLog.textContent = `Success: Routed to ${data.ip}`;
      dnsLog.className = 'text-xs text-emerald-500 font-mono text-center mt-2 h-4';
    } else {
      dnsLog.textContent = 'Sync failed. Check logs.';
    }
  } catch (err) {
    dnsLog.textContent = 'Network error during sync.';
  }
  
  btnSync.innerHTML = '<span>Sync Network</span>';
});

// --- Initialization ---
// Fetch the initial state when the app loads
fetchMCStatus();
