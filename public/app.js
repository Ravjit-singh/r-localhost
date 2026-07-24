/**
 * R-LOCALHOST | Master UI Controller
 * Bulletproof Error Handling
 */

function showToast(message, isError = false) {
  const toast = document.getElementById('toast');
  const msgEl = document.getElementById('toast-msg');
  const iconEl = document.getElementById('toast-icon');

  if(!toast) return; // Prevent crashes if HTML is missing

  msgEl.innerText = message;
  
  if (isError) {
    iconEl.innerText = 'error';
    iconEl.classList.replace('text-md-primary', 'text-md-error');
  } else {
    iconEl.innerText = 'check_circle';
    iconEl.classList.replace('text-md-error', 'text-md-primary');
  }

  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function switchTab(tabName) {
  try {
    const workspaceView = document.getElementById('view-workspace');
    const generalView = document.getElementById('view-general');
    const btnWorkspace = document.getElementById('tab-workspace');
    const btnGeneral = document.getElementById('tab-general');

    if (tabName === 'workspace') {
      generalView.classList.replace('translate-x-0', 'translate-x-[100%]');
      generalView.classList.replace('opacity-100', 'opacity-0');
      generalView.classList.add('pointer-events-none');

      workspaceView.classList.remove('pointer-events-none');
      workspaceView.classList.replace('-translate-x-[100%]', 'translate-x-0');
      workspaceView.classList.replace('opacity-0', 'opacity-100');

      btnWorkspace.classList.add('bg-md-primary', 'text-md-onPrimary');
      btnWorkspace.classList.remove('text-md-text');
      btnGeneral.classList.remove('bg-md-primary', 'text-md-onPrimary');
      btnGeneral.classList.add('text-md-text');
    } else {
      workspaceView.classList.replace('translate-x-0', '-translate-x-[100%]');
      workspaceView.classList.replace('opacity-100', 'opacity-0');
      workspaceView.classList.add('pointer-events-none');

      generalView.classList.remove('pointer-events-none');
      generalView.classList.replace('translate-x-[100%]', 'translate-x-0');
      generalView.classList.replace('opacity-0', 'opacity-100');

      btnGeneral.classList.add('bg-md-primary', 'text-md-onPrimary');
      btnGeneral.classList.remove('text-md-text');
      btnWorkspace.classList.remove('bg-md-primary', 'text-md-onPrimary');
      btnWorkspace.classList.add('text-md-text');
      
      fetchProxyList();
    }
  } catch (err) {
    console.error("Tab switch error:", err);
  }
}

let isMasterOnline = false;

async function checkMasterStatus() {
  try {
    const res = await fetch('/api/tunnels/status');
    const data = await res.json();
    isMasterOnline = data.status === 'online';
    updateMasterUI();
  } catch (err) {
    console.error("Status check failed", err);
  }
}

async function toggleMasterTunnel() {
  const endpoint = isMasterOnline ? '/api/tunnels/kill' : '/api/tunnels/ignite';
  const toggle = document.getElementById('master-toggle');
  const spinner = document.getElementById('master-spinner');
  const thumb = document.getElementById('master-toggle-thumb');
  
  toggle.classList.add('pointer-events-none');
  thumb.classList.add('opacity-0');
  spinner.classList.remove('hidden');

  try {
    const res = await fetch(endpoint, { method: 'POST' });
    const data = await res.json();
    
    if (data.success) {
      isMasterOnline = !isMasterOnline;
      updateMasterUI();
      showToast(isMasterOnline ? 'Master Routing Online' : 'Master Routing Offline');
    }
  } catch (err) {
    showToast('Network Error', true);
  } finally {
    toggle.classList.remove('pointer-events-none');
    thumb.classList.remove('opacity-0');
    spinner.classList.add('hidden');
  }
}

function updateMasterUI() {
  const toggle = document.getElementById('master-toggle');
  const thumb = document.getElementById('master-toggle-thumb');
  const statusText = document.getElementById('master-status-text');

  if (!toggle || !thumb || !statusText) return;

  if (isMasterOnline) {
    toggle.classList.replace('bg-md-surfaceHigh', 'bg-md-primary');
    toggle.classList.replace('border-md-textMuted', 'border-md-primary');
    thumb.classList.replace('translate-x-0', 'translate-x-6');
    thumb.classList.replace('bg-md-textMuted', 'bg-md-onPrimary');
    statusText.innerText = "Active • cloudflared running";
    statusText.classList.replace('text-md-textMuted', 'text-md-primary');
  } else {
    toggle.classList.replace('bg-md-primary', 'bg-md-surfaceHigh');
    toggle.classList.replace('border-md-primary', 'border-md-textMuted');
    thumb.classList.replace('translate-x-6', 'translate-x-0');
    thumb.classList.replace('bg-md-onPrimary', 'bg-md-textMuted');
    statusText.innerText = "Offline";
    statusText.classList.replace('text-md-primary', 'text-md-textMuted');
  }
}

async function mountProxy() {
  const nameInput = document.getElementById('proxy-name');
  const portInput = document.getElementById('proxy-port');
  
  if (!nameInput.value || !portInput.value) {
    showToast('Please enter name and port', true);
    return;
  }

  try {
    const res = await fetch('/api/tunnels/proxy/mount', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: nameInput.value, port: portInput.value })
    });
    
    const data = await res.json();
    if (data.success) {
      showToast(`Mounted ${data.url}`);
      nameInput.value = '';
      portInput.value = '';
      fetchProxyList(); 
    }
  } catch (err) {
    showToast('Failed to mount proxy', true);
  }
}

async function fetchProxyList() {
  try {
    const res = await fetch('/api/tunnels/proxy/list');
    const list = await res.json();
    
    const container = document.getElementById('active-routes-list');
    if(!container) return;
    
    container.innerHTML = '';

    if (list.length === 0) {
      container.innerHTML = '<p class="text-xs text-md-textMuted px-2">No active routes</p>';
      return;
    }

    list.forEach(route => {
      container.innerHTML += `
        <div class="bg-md-surface rounded-xl p-3 flex justify-between items-center border border-md-surfaceHigh">
          <div>
            <p class="text-sm font-medium text-md-text">${route.url}</p>
            <p class="text-xs text-md-textMuted">Local Port: ${route.port}</p>
          </div>
          <button onclick="unmountProxy('${route.url.split('.')[0]}')" class="w-8 h-8 rounded-full flex items-center justify-center bg-md-surfaceHigh text-md-error md-transition active:scale-90">
            <span class="material-symbols-rounded text-[18px]">delete</span>
          </button>
        </div>
      `;
    });
  } catch (err) {
    console.error('Failed to fetch routes', err);
  }
}

async function unmountProxy(name) {
  try {
    await fetch('/api/tunnels/proxy/unmount', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    showToast(`Removed route for ${name}`);
    fetchProxyList();
  } catch (err) {
    showToast('Failed to remove route', true);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  checkMasterStatus();
});
// --- R-CLOUD INTEGRATION ---
let isRCloudOnline = false;

async function checkRCloudStatus() {
  try {
    const res = await fetch('/api/rcloud/status');
    const data = await res.json();
    isRCloudOnline = data.running;
    updateRCloudUI();
  } catch (err) {
    console.error("RCloud status check failed");
  }
}

async function toggleRCloud() {
  const endpoint = isRCloudOnline ? '/api/rcloud/stop' : '/api/rcloud/start';
  const btn = document.getElementById('rcloud-btn');
  
  btn.classList.add('pointer-events-none', 'opacity-70');
  btn.innerText = "Processing...";

  try {
    const res = await fetch(endpoint, { method: 'POST' });
    const data = await res.json();
    
    if (data.success) {
      isRCloudOnline = !isRCloudOnline;
      updateRCloudUI();
      showToast(isRCloudOnline ? 'RCloud Storage Online' : 'RCloud Storage Offline');
    } else {
      showToast('Failed to toggle RCloud', true);
    }
  } catch (err) {
    showToast('Network Error', true);
  } finally {
    btn.classList.remove('pointer-events-none', 'opacity-70');
  }
}

function updateRCloudUI() {
  const btn = document.getElementById('rcloud-btn');
  const statusText = document.getElementById('rcloud-status');
  
  if (!btn || !statusText) return;

  if (isRCloudOnline) {
    btn.innerText = "Halt Drive";
    btn.classList.replace('bg-md-primary', 'bg-md-surfaceHigh');
    btn.classList.replace('text-md-onPrimary', 'text-md-error');
    statusText.innerText = "Status: Online (Port 3000)";
    statusText.classList.replace('text-md-textMuted', 'text-md-primary');
  } else {
    btn.innerText = "Ignite Drive";
    btn.classList.replace('bg-md-surfaceHigh', 'bg-md-primary');
    btn.classList.replace('text-md-error', 'text-md-onPrimary');
    statusText.innerText = "Status: Offline";
    statusText.classList.replace('text-md-primary', 'text-md-textMuted');
  }
}

// Add this inside your existing DOMContentLoaded listener at the bottom:
// checkRCloudStatus(); 
