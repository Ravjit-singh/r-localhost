// --- View Management ---
const viewHome = document.getElementById('view-home');
const viewYourhost = document.getElementById('view-yourhost');
const viewRcloud = document.getElementById('view-rcloud');
const btnBack = document.getElementById('btn-back');
const headerTitle = document.getElementById('header-title');

function switchView(viewName) {
  viewHome.classList.add('hidden');
  viewYourhost.classList.add('hidden');
  viewRcloud.classList.add('hidden');
  
  if (viewName === 'home') {
    viewHome.classList.remove('hidden');
    btnBack.classList.add('hidden');
    headerTitle.textContent = 'r-localhost';
  } else if (viewName === 'yourhost') {
    viewYourhost.classList.remove('hidden');
    btnBack.classList.remove('hidden');
    headerTitle.textContent = 'Yourhost Config';
    fetchMCStatus(); // Refresh status on open
  } else if (viewName === 'rcloud') {
    viewRcloud.classList.remove('hidden');
    btnBack.classList.remove('hidden');
    headerTitle.textContent = 'R-Cloud Config';
    fetchRCloudStatus(); // Refresh status on open
  }
}

btnBack.addEventListener('click', () => switchView('home'));

// --- Badge Helpers ---
function updateBadge(elementId, status) {
  const el = document.getElementById(elementId);
  if (status === 'running') {
    el.textContent = 'RUNNING';
    el.className = 'px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
  } else {
    el.textContent = 'STOPPED';
    el.className = 'px-3 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20';
  }
}

// --- RCloud Logic ---
const btnRCloudStart = document.getElementById('btn-rcloud-start');
const btnRCloudStop = document.getElementById('btn-rcloud-stop');

async function fetchRCloudStatus() {
  try {
    const res = await fetch('/api/rcloud/status');
    const data = await res.json();
    updateBadge('rcloud-status-badge', data.status);
  } catch (error) { console.error('Failed status check'); }
}

btnRCloudStart.addEventListener('click', async () => {
  btnRCloudStart.textContent = 'Igniting...';
  try {
    const res = await fetch('/api/rcloud/start', { method: 'POST' });
    const data = await res.json();
    updateBadge('rcloud-status-badge', data.status);
  } catch (err) { alert('API Error'); }
  btnRCloudStart.textContent = 'Ignite Drive';
});

btnRCloudStop.addEventListener('click', async () => {
  try {
    const res = await fetch('/api/rcloud/stop', { method: 'POST' });
    const data = await res.json();
    updateBadge('rcloud-status-badge', data.status);
  } catch (err) {}
});

// --- Yourhost (Minecraft) Logic ---
const btnMCStart = document.getElementById('btn-mc-start');
const btnMCStop = document.getElementById('btn-mc-stop');

async function fetchMCStatus() {
  try {
    const res = await fetch('/api/server/status');
    const data = await res.json();
    updateBadge('mc-status-badge', data.status);
  } catch (error) {}
}

btnMCStart.addEventListener('click', async () => {
  btnMCStart.textContent = 'Igniting...';
  try {
    const res = await fetch('/api/server/start', { method: 'POST' });
    const data = await res.json();
    updateBadge('mc-status-badge', data.status);
  } catch (err) { alert('API Error'); }
  btnMCStart.textContent = 'Ignite Server';
});

btnMCStop.addEventListener('click', async () => {
  try {
    const res = await fetch('/api/server/stop', { method: 'POST' });
    const data = await res.json();
    updateBadge('mc-status-badge', data.status);
  } catch (err) {}
});

// --- DNS Routing Logic ---
const cfDomain = document.getElementById('cf-domain');
const cfZone = document.getElementById('cf-zone');
const cfToken = document.getElementById('cf-token');
const btnSync = document.getElementById('btn-dns-sync');
const btnAuto = document.getElementById('btn-dns-auto');
const dnsLog = document.getElementById('dns-log');
let autoRunning = false;

cfDomain.value = localStorage.getItem('r_domain') || '';
cfZone.value = localStorage.getItem('r_zone') || '';
cfToken.value = localStorage.getItem('r_token') || '';

function getPayload() {
  localStorage.setItem('r_domain', cfDomain.value);
  localStorage.setItem('r_zone', cfZone.value);
  localStorage.setItem('r_token', cfToken.value);
  return { token: cfToken.value, zoneId: cfZone.value, subdomains: [cfDomain.value] };
}

btnSync.addEventListener('click', async () => {
  btnSync.textContent = 'Syncing...';
  try {
    const res = await fetch('/api/dns/sync', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(getPayload())
    });
    const data = await res.json();
    if (data.ip) {
      dnsLog.textContent = `Routed to ${data.ip}`;
      dnsLog.className = 'text-xs text-emerald-500 font-mono text-center mt-2 h-4';
    }
  } catch (err) { dnsLog.textContent = 'Network error.'; }
  btnSync.textContent = 'Manual Sync';
});
