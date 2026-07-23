// ==========================================
// 1. CORE NAVIGATION SYSTEM
// ==========================================
const views = {
  home: document.getElementById('view-home'),
  yourhost: document.getElementById('view-yourhost'),
  rcloud: document.getElementById('view-rcloud'),
  tunnel: document.getElementById('view-tunnel')
};

const headerTitle = document.getElementById('header-title');
const btnBack = document.getElementById('btn-back');

function switchView(targetView) {
  // Hide all views first
  Object.values(views).forEach(view => view.classList.add('hidden'));
  
  // Show target view
  views[targetView].classList.remove('hidden');

  // Handle Header UI
  if (targetView === 'home') {
    btnBack.classList.add('hidden');
    headerTitle.textContent = 'r-localhost';
    headerTitle.classList.add('gradient-shimmer');
  } else {
    btnBack.classList.remove('hidden');
    headerTitle.classList.remove('gradient-shimmer'); // Turn off shimmer in sub-menus
    
    if (targetView === 'yourhost') {
      headerTitle.textContent = 'Yourhost Engine';
      fetchMCStatus();
    } else if (targetView === 'rcloud') {
      headerTitle.textContent = 'R-Cloud Drive';
      fetchRCloudStatus();
    } else if (targetView === 'tunnel') {
      headerTitle.textContent = 'WAN Tunnel';
      fetchTunnelStatus();
    }
  }
}

// Bind Navigation Clicks
document.getElementById('btn-nav-yourhost').addEventListener('click', () => switchView('yourhost'));
document.getElementById('btn-nav-rcloud').addEventListener('click', () => switchView('rcloud'));
document.getElementById('btn-nav-tunnel').addEventListener('click', () => switchView('tunnel'));
btnBack.addEventListener('click', () => switchView('home'));

// ==========================================
// 2. UNIVERSAL HELPERS
// ==========================================
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

// ==========================================
// 3. YOURHOST (MINECRAFT) LOGIC
// ==========================================
const btnMCStart = document.getElementById('btn-mc-start');
const btnMCStop = document.getElementById('btn-mc-stop');

async function fetchMCStatus() {
  try {
    const res = await fetch('/api/server/status');
    const data = await res.json();
    updateBadge('mc-status-badge', data.status);
  } catch (err) {}
}

btnMCStart.addEventListener('click', async () => {
  btnMCStart.textContent = 'Igniting...';
  try {
    const res = await fetch('/api/server/start', { method: 'POST' });
    const data = await res.json();
    updateBadge('mc-status-badge', data.status);
  } catch (err) { alert('API Error'); }
  btnMCStart.textContent = 'Ignite';
});

btnMCStop.addEventListener('click', async () => {
  try {
    const res = await fetch('/api/server/stop', { method: 'POST' });
    const data = await res.json();
    updateBadge('mc-status-badge', data.status);
  } catch (err) {}
});

// ==========================================
// 4. CLOUDFLARE DNS LOGIC
// ==========================================
const cfDomain = document.getElementById('cf-domain');
const cfZone = document.getElementById('cf-zone');
const cfToken = document.getElementById('cf-token');
const btnSync = document.getElementById('btn-dns-sync');
const dnsLog = document.getElementById('dns-log');

cfDomain.value = localStorage.getItem('r_domain') || '';
cfZone.value = localStorage.getItem('r_zone') || '';
cfToken.value = localStorage.getItem('r_token') || '';

function getDnsPayload() {
  localStorage.setItem('r_domain', cfDomain.value);
  localStorage.setItem('r_zone', cfZone.value);
  localStorage.setItem('r_token', cfToken.value);
  return { token: cfToken.value, zoneId: cfZone.value, subdomains: [cfDomain.value] };
}

btnSync.addEventListener('click', async () => {
  btnSync.textContent = 'Syncing...';
  try {
    const res = await fetch('/api/dns/sync', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(getDnsPayload())
    });
    const data = await res.json();
    if (data.ip) {
      dnsLog.textContent = `Routed to ${data.ip}`;
      dnsLog.className = 'text-xs text-emerald-500 font-mono text-center mt-2 h-4';
    }
  } catch (err) { dnsLog.textContent = 'Network error.'; }
  btnSync.textContent = 'Manual Sync';
});

// ==========================================
// 5. RCLOUD LOGIC
// ==========================================
const btnRCloudStart = document.getElementById('btn-rcloud-start');
const btnRCloudStop = document.getElementById('btn-rcloud-stop');
const rcloudLinkContainer = document.getElementById('rcloud-link-container');
const rcloudPublicUrl = document.getElementById('rcloud-public-url');
let rcloudStatusPoll = null;

function updateRCloudUI(status, url) {
  updateBadge('rcloud-status-badge', status);
  if (status === 'running') {
    rcloudLinkContainer.classList.remove('hidden');
    if (url) { rcloudPublicUrl.textContent = url; rcloudPublicUrl.href = url; }
  } else {
    rcloudLinkContainer.classList.add('hidden');
    rcloudPublicUrl.textContent = 'Establishing tunnel...';
  }
}

async function fetchRCloudStatus() {
  try {
    const res = await fetch('/api/rcloud/status');
    const data = await res.json();
    updateRCloudUI(data.status, data.url);
    
    if (data.status === 'running' && !data.url && !rcloudStatusPoll) {
      rcloudStatusPoll = setInterval(async () => {
        const pollRes = await fetch('/api/rcloud/status');
        const pollData = await pollRes.json();
        if (pollData.url) {
          updateRCloudUI(pollData.status, pollData.url);
          clearInterval(rcloudStatusPoll);
          rcloudStatusPoll = null;
        }
      }, 2000);
    }
  } catch (err) {}
}

btnRCloudStart.addEventListener('click', async () => {
  btnRCloudStart.textContent = 'Igniting...';
  try {
    const res = await fetch('/api/rcloud/start', { method: 'POST' });
    const data = await res.json();
    updateRCloudUI(data.status, data.url);
    fetchRCloudStatus();
  } catch (err) {}
  btnRCloudStart.textContent = 'Ignite Drive';
});

btnRCloudStop.addEventListener('click', async () => {
  try {
    const res = await fetch('/api/rcloud/stop', { method: 'POST' });
    const data = await res.json();
    updateRCloudUI(data.status, data.url);
    if (rcloudStatusPoll) clearInterval(rcloudStatusPoll);
  } catch (err) {}
});

// ==========================================
// 6. WAN TUNNEL LOGIC
// ==========================================
const modeDeviceBtn = document.getElementById('mode-device');
const modeCustomBtn = document.getElementById('mode-custom');
const customIpInput = document.getElementById('tunnel-custom-ip');
const portInput = document.getElementById('tunnel-port');
const btnTunnelStart = document.getElementById('btn-tunnel-start');
const btnTunnelStop = document.getElementById('btn-tunnel-stop');
const tunnelLinkContainer = document.getElementById('tunnel-link-container');
const tunnelPublicUrl = document.getElementById('tunnel-public-url');

let currentTunnelMode = 'device';
let tunnelStatusPoll = null;

modeDeviceBtn.addEventListener('click', () => {
  currentTunnelMode = 'device';
  modeDeviceBtn.className = 'flex-1 py-2 text-sm font-semibold rounded-lg bg-gray-700 text-white shadow transition-all';
  modeCustomBtn.className = 'flex-1 py-2 text-sm font-semibold rounded-lg text-gray-400 hover:text-white transition-all';
  customIpInput.classList.add('hidden');
});

modeCustomBtn.addEventListener('click', () => {
  currentTunnelMode = 'custom';
  modeCustomBtn.className = 'flex-1 py-2 text-sm font-semibold rounded-lg bg-gray-700 text-white shadow transition-all';
  modeDeviceBtn.className = 'flex-1 py-2 text-sm font-semibold rounded-lg text-gray-400 hover:text-white transition-all';
  customIpInput.classList.remove('hidden');
});

function updateTunnelUI(status, url) {
  updateBadge('tunnel-status-badge', status);
  if (status === 'running') {
    tunnelLinkContainer.classList.remove('hidden');
    if (url) { tunnelPublicUrl.textContent = url; tunnelPublicUrl.href = url; }
  } else {
    tunnelLinkContainer.classList.add('hidden');
    tunnelPublicUrl.textContent = 'Establishing routing...';
  }
}

async function fetchTunnelStatus() {
  try {
    const res = await fetch('/api/tunnel/status');
    const data = await res.json();
    updateTunnelUI(data.status, data.url);
    
    if (data.status === 'running' && !data.url && !tunnelStatusPoll) {
      tunnelStatusPoll = setInterval(async () => {
        const pollRes = await fetch('/api/tunnel/status');
        const pollData = await pollRes.json();
        if (pollData.url) {
          updateTunnelUI(pollData.status, pollData.url);
          clearInterval(tunnelStatusPoll);
          tunnelStatusPoll = null;
        }
      }, 2000);
    }
  } catch (err) {}
}

btnTunnelStart.addEventListener('click', async () => {
  const port = portInput.value;
  const customIp = customIpInput.value;
  if (!port) return alert('Port is required!');
  if (currentTunnelMode === 'custom' && !customIp) return alert('Custom LAN IP required!');

  btnTunnelStart.textContent = 'Igniting...';
  try {
    const res = await fetch('/api/tunnel/start', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: currentTunnelMode, customIp, port })
    });
    const data = await res.json();
    updateTunnelUI(data.status, data.url);
    fetchTunnelStatus(); 
  } catch (err) {}
  btnTunnelStart.textContent = 'Ignite Tunnel';
});

btnTunnelStop.addEventListener('click', async () => {
  try {
    const res = await fetch('/api/tunnel/stop', { method: 'POST' });
    const data = await res.json();
    updateTunnelUI(data.status, data.url);
    if (tunnelStatusPoll) clearInterval(tunnelStatusPoll);
  } catch (err) {}
});
