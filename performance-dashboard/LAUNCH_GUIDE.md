# Performance Dashboard - Launch Options

## Overview
The Electron desktop app now automatically manages backend and frontend processes. When you close the Electron window, all associated CLI windows will automatically close (similar to JMeter).

## Launch Methods

### Method 1: Standalone Electron (Recommended)
**Use this for normal operation - everything is automatic!**

#### Option A: Using Batch File
```bash
.\start-electron.bat
```

#### Option B: Using NPM
```bash
cd frontend
npm start
# or
npm run electron
```

**What happens:**
1. Electron starts
2. Backend server starts automatically (CLI window appears)
3. Frontend dev server starts automatically (CLI window appears)
4. Electron window opens after ~13 seconds
5. **When you close Electron, both CLI windows close automatically** ✅

---

### Method 2: Manual Control (Advanced)
**Use this if you want to control each service separately (for debugging)**

```bash
.\start-all.bat
```

**What happens:**
1. Backend starts in separate CLI window
2. Frontend starts in separate CLI window
3. Electron starts and connects to existing servers
4. **You must manually run `stop-all.bat` to close everything**

To stop:
```bash
.\stop-all.bat
```

---

## Key Differences

| Feature | Standalone Electron | Manual Control |
|---------|-------------------|----------------|
| **Launch** | One command | One command |
| **Startup Time** | ~13 seconds | ~13 seconds |
| **CLI Windows** | 2 (Backend, Frontend) | 3 (Backend, Frontend, Electron launcher) |
| **Auto-cleanup** | ✅ Yes! | ❌ No - must run stop-all.bat |
| **Best For** | Normal use, production | Debugging, development |

---

## Troubleshooting

### Ports Already in Use
If you see "port already in use" errors:

```bash
# Kill all processes and try again
taskkill /F /IM node.exe
taskkill /F /IM python.exe
```

### Electron Opens But Shows Error
- Wait 15-20 seconds - servers may still be initializing
- Check the Backend CLI window for errors
- Check the Frontend CLI window for errors

### CLI Windows Don't Close
If using **Method 1** (standalone Electron) and CLI windows don't close:
- Make sure you're closing Electron normally (X button or Alt+F4)
- Don't kill Electron from Task Manager - use proper close

If using **Method 2** (manual control):
- This is expected - run `stop-all.bat` to close everything

---

## Production Notes

In the future production build:
- No CLI windows will be visible
- Backend will be bundled as .exe
- Everything will be fully self-contained
- Single .exe installer for end users
