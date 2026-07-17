// --- DOM Elements ---
const mcBadge = document.getElementById('mc-status-badge');
const btnStart = document.getElementById('btn-mc-start');
const btnStop = document.getElementById('btn-mc-stop');

const cfDomain = document.getElementById('cf-domain');
const cfZone = document.getElementById('cf-zone');
const cfToken = document.getElementById('cf-token');
const btnSync = document.getElementById('btn-dns-sync');
const btnAuto = document.getElementById('btn-dns-auto');
const dnsLog = document.getElementById('dns-log');

let autoRunning = false;

// --- LocalStorage for DNS ---
// Load saved credentials on boot
cfDomain.value = localStorage.getItem('r_domain') || '';
cfZone.value = localStorage.getItem('r_zone') || '';
cfToken.value = localStorage.getItem('r_token') || '';

function saveCreds() {
  localStorage.setItem('r_domain', cfDomain.value);
  localStorage.setItem('r_zone', cfZone.value);
  localStorage.setItem('r_token', cfToken.value);
}

function getPayload() {
  saveCreds();
  return {
    token: cfToken.value,
    zoneId: cfZone.value,
    subdomains: [cfDomain.value]
  };
}

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

// --- Minecraft Server Event Listeners ---
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

// --- DNS Routing Event Listeners ---
btnSync.addEventListener('click', async () => {
  if (!cfDomain.value || !cfZone.value || !cfToken.value) return dnsLog.textContent = 'Missing fields';
  
  btnSync.textContent = 'Syncing...';
  dnsLog.textContent = 'Reaching out to Cloudflare...';

  try {
    const res = await fetch('/api/dns/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(getPayload())
    });
    
    const data = await res.json();
    if (data.ip) {
      dnsLog.textContent = data.updated ? `Routed to ${data.ip}` : `IP unchanged (${data.ip})`;
      dnsLog.className = 'text-xs text-emerald-500 font-mono text-center mt-2 h-4';
    }
  } catch (err) {
    dnsLog.textContent = 'Network error during sync.';
  }
  btnSync.textContent = 'Manual Sync';
});

btnAuto.addEventListener('click', async () => {
  autoRunning = !autoRunning;
  const action = autoRunning ? 'start' : 'stop';
  
  try {
    const res = await fetch('/api/dns/auto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...getPayload() })
    });
    
    if (res.ok) {
      if (autoRunning) {
        btnAuto.textContent = 'Auto: ON';
        btnAuto.className = 'flex-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 font-semibold py-3 rounded-xl active:scale-95 transition-all';
        dnsLog.textContent = 'Background daemon active.';
      } else {
        btnAuto.textContent = 'Auto: OFF';
        btnAuto.className = 'flex-1 bg-gray-800 text-gray-300 border border-gray-700 font-semibold py-3 rounded-xl active:scale-95 transition-all';
        dnsLog.textContent = 'Background daemon stopped.';
      }
    }
  } catch (err) {
    autoRunning = !autoRunning; // revert on fail
    alert('Failed to toggle daemon');
  }
});

// --- API Calls & Initialization ---
async function fetchMCStatus() {
  try {
    const res = await fetch('/api/server/status');
    const data = await res.json();
    updateMCBadge(data.status);
  } catch (error) {
    console.error('Failed to fetch status:', error);
  }
}

// --- Prototype Feature: Fetch Raw IP ---
async function fetchRawIP() {
  try {
    const res = await fetch('https://api64.ipify.org?format=json');
    const data = await res.json();
    console.log(`Your Prototype Join IP: ${data.ip}`);
    
    dnsLog.textContent = `Raw IP: ${data.ip}`;
    dnsLog.className = 'text-xs text-blue-400 font-mono text-center mt-2 h-4 select-all';
  } catch (error) {
    console.error('Could not fetch IP');
  }
}

// Call on load
fetchMCStatus();
fetchRawIP();
