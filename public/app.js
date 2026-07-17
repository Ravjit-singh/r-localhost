// --- RCloud Logic ---
const btnRCloudStart = document.getElementById('btn-rcloud-start');
const btnRCloudStop = document.getElementById('btn-rcloud-stop');
const rcloudLinkContainer = document.getElementById('rcloud-link-container');
const rcloudPublicUrl = document.getElementById('rcloud-public-url');

let rcloudStatusPoll = null;

function updateRCloudUI(status, url) {
  updateBadge('rcloud-status-badge', status);
  
  if (status === 'running') {
    rcloudLinkContainer.classList.remove('hidden');
    if (url) {
      rcloudPublicUrl.textContent = url;
      rcloudPublicUrl.href = url;
    }
  } else {
    rcloudLinkContainer.classList.add('hidden');
    rcloudPublicUrl.textContent = 'Establishing tunnel...';
    rcloudPublicUrl.href = '#';
  }
}

async function fetchRCloudStatus() {
  try {
    const res = await fetch('/api/rcloud/status');
    const data = await res.json();
    updateRCloudUI(data.status, data.url);
    
    // If it's running but has no URL yet, keep polling Cloudflare every 2 seconds
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
  } catch (error) { console.error('Failed status check'); }
}

btnRCloudStart.addEventListener('click', async () => {
  btnRCloudStart.textContent = 'Igniting...';
  try {
    const res = await fetch('/api/rcloud/start', { method: 'POST' });
    const data = await res.json();
    updateRCloudUI(data.status, data.url);
    fetchRCloudStatus(); // Trigger the polling loop to catch the URL
  } catch (err) { alert('API Error'); }
  btnRCloudStart.textContent = 'Ignite Drive';
});

btnRCloudStop.addEventListener('click', async () => {
  try {
    const res = await fetch('/api/rcloud/stop', { method: 'POST' });
    const data = await res.json();
    updateRCloudUI(data.status, data.url);
    if (rcloudStatusPoll) {
      clearInterval(rcloudStatusPoll);
      rcloudStatusPoll = null;
    }
  } catch (err) {}
});
