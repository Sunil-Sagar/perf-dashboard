// Electron main process entry point

const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let backendProcess = null;
let frontendProcess = null;

function startBackend() {
  console.log('Starting backend server...');
  const backendPath = path.join(__dirname, '..', '..', 'backend');
  const venvPython = path.join(backendPath, 'venv', 'Scripts', 'python.exe');
  
  // Start CMD window that stays open with the backend running
  const command = `start "Performance Dashboard - Backend" cmd /k "cd /d "${backendPath}" && "${venvPython}" app.py"`;
  
  backendProcess = spawn('cmd.exe', ['/c', command], {
    cwd: backendPath,
    detached: true,
    shell: true,
    windowsHide: false,
    stdio: 'ignore'
  });
  
  if (backendProcess.unref) {
    backendProcess.unref();
  }
  
  backendProcess.on('error', (err) => {
    console.error('Failed to start backend:', err);
  });
  
  console.log('Backend launch command executed');
}

function startFrontend() {
  console.log('Starting frontend dev server...');
  const frontendPath = path.join(__dirname, '..');
  
  // Start CMD window that stays open with the frontend running
  const command = `start "Performance Dashboard - Frontend" cmd /k "cd /d "${frontendPath}" && npm run dev:react"`;
  
  frontendProcess = spawn('cmd.exe', ['/c', command], {
    cwd: frontendPath,
    detached: true,
    shell: true,
    windowsHide: false,
    stdio: 'ignore'
  });
  
  if (frontendProcess.unref) {
    frontendProcess.unref();
  }
  
  frontendProcess.on('error', (err) => {
    console.error('Failed to start frontend:', err);
  });
  
  console.log('Frontend launch command executed');
}

function killChildProcesses() {
  console.log('Killing child processes...');
  
  const { execSync } = require('child_process');
  
  // Kill backend and frontend CMD windows by title
  try {
    execSync('taskkill /F /FI "WINDOWTITLE eq Performance Dashboard - Backend*"', { 
      windowsHide: true,
      stdio: 'ignore' 
    });
    console.log('Killed Backend window');
  } catch (e) {
    // Ignore errors if window not found
  }
  
  try {
    execSync('taskkill /F /FI "WINDOWTITLE eq Performance Dashboard - Frontend*"', { 
      windowsHide: true,
      stdio: 'ignore' 
    });
    console.log('Killed Frontend window');
  } catch (e) {
    // Ignore errors if window not found
  }
  
  // Kill all python/node processes as final cleanup
  try {
    execSync('taskkill /F /IM python.exe', { windowsHide: true, stdio: 'ignore' });
    console.log('Killed Python processes');
  } catch (e) {}
  
  try {
    execSync('taskkill /F /IM node.exe /FI "WINDOWTITLE eq Performance Dashboard - Frontend*"', { 
      windowsHide: true, 
      stdio: 'ignore' 
    });
    console.log('Killed Node processes');
  } catch (e) {}
  
  backendProcess = null;
  frontendProcess = null;
  console.log('Child processes cleanup complete.');
}

async function waitForDevServer(url, maxAttempts = 30) {
  const http = require('http');
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await new Promise((resolve, reject) => {
        http.get(url, (res) => {
          if (res.statusCode === 200) {
            resolve();
          } else {
            reject();
          }
        }).on('error', reject);
      });
      console.log('Dev server is ready!');
      return true;
    } catch (e) {
      console.log(`Waiting for dev server... (attempt ${i + 1}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  return false;
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: false,
      // Don't use sandbox in dev - it's too restrictive
    },
    title: 'Performance Dashboard',
    show: false, // Don't show until ready
  });

  // Load the React app
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  
  if (isDev) {
    const devServerUrl = 'http://localhost:5173';
    
    // Wait for dev server to be ready
    console.log('Waiting for Vite dev server...');
    const serverReady = await waitForDevServer(devServerUrl);
    
    if (serverReady) {
      console.log('Loading dev server URL...');
      await mainWindow.loadURL(devServerUrl);
      
      // DevTools removed - not needed for normal use
      
      console.log('Showing window...');
      mainWindow.show();
    } else {
      console.error('Dev server did not start in time. Please start it manually with: npm run dev');
      mainWindow.loadURL('data:text/html,<h1>Dev server not ready</h1><p>Please start the dev server with: npm run dev</p>');
      mainWindow.show();
    }
  } else {
    await mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    mainWindow.show();
  }

  // Prevent navigation away from the app (can cause blank screens)
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const devServerUrl = 'http://localhost:5173';
    const allowedUrls = [devServerUrl, `${devServerUrl}/`];
    
    if (!allowedUrls.includes(url)) {
      event.preventDefault();
      console.log('Navigation prevented:', url);
    }
  });

  // Handle load failures
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
  });

  // Log any console errors from the renderer process
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    if (level === 3) { // 3 = error
      console.error('Renderer error:', message);
    }
  });

  // Handle renderer process crashes
  mainWindow.webContents.on('render-process-gone', (event, details) => {
    console.error('Renderer process crashed:', details);
    // Optionally reload the window
    if (details.reason !== 'clean-exit') {
      console.log('Attempting to reload after crash...');
      mainWindow.reload();
    }
  });

  // Prevent unresponsive window
  mainWindow.on('unresponsive', () => {
    console.error('Window became unresponsive');
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    killChildProcesses();
  });
}

app.whenReady().then(async () => {
  // Start backend and frontend servers
  startBackend();
  
  // Wait for backend to initialize
  console.log('Waiting for backend to start...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  startFrontend();
  
  // Wait for frontend to initialize
  console.log('Waiting for frontend to start...');
  await new Promise(resolve => setTimeout(resolve, 8000));
  
  createWindow();
});

app.on('before-quit', () => {
  console.log('App is quitting, cleaning up...');
  killChildProcesses();
});

app.on('window-all-closed', () => {
  killChildProcesses();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
