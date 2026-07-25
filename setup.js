const readline = require('readline');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { exec } = require('child_process');

// ANSI Color Codes for universal terminal styling
const c = {
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  bold: '\x1b[1m',
  reset: '\x1b[0m'
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Dynamic ASCII Generator based on screen width
function renderBanner() {
  const width = process.stdout.columns || 80;
  let banner = '';

  if (width > 60) {
    // Desktop / Landscape Mobile Wide Banner
    banner = `
  ____       _                     _ _               _   
 |  _ \\     | |                   | | |             | |  
 | |_) |____| |     ___   ___ __ _| | |__   ___  ___| |_ 
 |  _ <______| |    / _ \\ / __/ _\` | | '_ \\ / _ \\/ __| __|
 | | \\ \\    | |___| (_) | (_| (_| | | | | | (_) \\__ \\ |_ 
 |_|  \\_\\   |______\\___/ \\___\\__,_|_|_| |_|\\___/|___/\\__|
    `;
  } else {
    // Portrait Mobile (Termux) Compact Banner
    banner = `
  _____       _                 _ 
 |  __ \\     | |               | |
 | |__) |____| | ___   ___ __ _| |
 |  _  /______| |/ _ \\ / __/ _\` | |
 | | \\ \\    | | (_) | (_| (_| | |
 |_|  \\_\\   |_|\\___/ \\___\\__,_|_|
    `;
  }

  // Center the banner dynamically
  console.clear();
  const lines = banner.split('\n');
  lines.forEach(line => {
    const pad = Math.max(0, Math.floor((width - line.length) / 2));
    console.log(`${c.cyan}${c.bold}${' '.repeat(pad)}${line}${c.reset}`);
  });

  const title = ' MASTER OS UNIVERSAL INSTALLER ';
  const titlePad = Math.max(0, Math.floor((width - title.length) / 2));
  console.log(`\n${c.magenta}${c.bold}${' '.repeat(titlePad)}${title}${c.reset}\n`);
}

// Universal Browser Redirect
function openBrowser(url) {
  const platform = process.platform;
  if (process.env.PREFIX && process.env.PREFIX.includes('com.termux')) {
    exec(`termux-open-url "${url}"`);
  } else if (platform === 'win32') {
    exec(`start "" "${url}"`);
  } else if (platform === 'darwin') {
    exec(`open "${url}"`);
  } else {
    exec(`xdg-open "${url}"`);
  }
}

const ask = (query) => new Promise(resolve => rl.question(query, resolve));

async function runSetup() {
  renderBanner();

  try {
    console.log(`${c.bold}${c.yellow}[Step 1/2] Cloudflare Integration${c.reset}`);
    console.log(`${c.cyan}ℹ️  We need your Tunnel UUID to bind the network.${c.reset}`);
    
    let tunnelUUID = await ask(`\n${c.bold}❓ Enter your UUID ${c.reset}(Or press ENTER to grab it from your browser):\n${c.cyan}>> ${c.reset}`);
    
    if (!tunnelUUID.trim()) {
      console.log(`\n${c.yellow}🚀 Opening Cloudflare Zero Trust Dashboard...${c.reset}`);
      openBrowser('https://one.dash.cloudflare.com/');
      tunnelUUID = await ask(`\n${c.bold}❓ Paste your copied Cloudflare Tunnel UUID here:\n${c.cyan}>> ${c.reset}`);
    }

    const masterDomain = await ask(`\n${c.bold}❓ Enter your Master Domain ${c.reset}(e.g., ravjit.me):\n${c.cyan}>> ${c.reset}`);
    
    console.log(`\n${c.bold}${c.yellow}[Step 2/2] Module Connections${c.reset}`);
    console.log(`${c.cyan}ℹ️  Leave blank and press ENTER to skip any module you aren't using right now.${c.reset}`);
    
    const rcloudPath = await ask(`\n${c.bold}❓ Absolute path to RCloud folder:\n${c.cyan}>> ${c.reset}`);
    const mcPath = await ask(`\n${c.bold}❓ Absolute path to Bedrock Server:\n${c.cyan}>> ${c.reset}`);

    console.log(`\n${c.magenta}⚙️  Forging system configurations...${c.reset}`);

    // 1. Generate .env File
    const envContent = `
MASTER_TUNNEL_NAME=${tunnelUUID.trim()}
MASTER_DOMAIN=${masterDomain.trim()}
RCLOUD_DIR=${rcloudPath.trim()}
RCLOUD_PORT=3000
MC_DIR=${mcPath.trim()}
PORT=4000
`.trim();

    fs.writeFileSync(path.join(__dirname, '.env'), envContent);
    console.log(`${c.green}✔️  .env configuration forged.${c.reset}`);

    // 2. Generate OS-Specific Cloudflare Config
    const homeDir = os.homedir();
    const cloudflaredDir = path.join(homeDir, '.cloudflared');
    
    if (!fs.existsSync(cloudflaredDir)) {
      fs.mkdirSync(cloudflaredDir, { recursive: true });
    }

    const configYamlContent = `
tunnel: ${tunnelUUID.trim()}
credentials-file: ${path.join(cloudflaredDir, `${tunnelUUID.trim()}.json`).replace(/\\/g, '/')}

ingress:
  - service: http://localhost:4000
`.trim();

    const configPath = path.join(cloudflaredDir, 'config.yml');
    fs.writeFileSync(configPath, configYamlContent);
    console.log(`${c.green}✔️  Cloudflare ingress bound to OS (${homeDir}).${c.reset}`);

    console.log(`\n${c.green}${c.bold}========================================================`);
    console.log(`                 INSTALLATION COMPLETE!                 `);
    console.log(`========================================================${c.reset}`);
    console.log(`\n${c.cyan}Type ${c.bold}npm start${c.reset}${c.cyan} to ignite the Master OS.${c.reset}\n`);

  } catch (error) {
    console.error(`\n${c.red}${c.bold}❌ Setup failed:${c.reset} ${error.message}`);
  } finally {
    rl.close();
  }
}

// Listen for window resize to redraw if needed (Desktop feature)
process.stdout.on('resize', () => {
  // Optional: Redraws banner if terminal is aggressively resized
});

runSetup();
