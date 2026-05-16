/**
 * H.E.A.L.E.R - Image Upload & Storage Server
 * =============================================
 * 
 * PURPOSE:
 *   Receives JPEG images from ESP32-CAM via HTTP POST and stores them
 *   in a patient-wise, session-wise folder structure on the local filesystem.
 *   Also serves stored images to the admin dashboard.
 * 
 * STORAGE STRUCTURE:
 *   healer-storage/
 *     patients/
 *       {patientId}/
 *         Pictures/
 *           DIAGNOSIS SESSION DD-MM-YYYY HH-MM-SS/
 *             BEFORE_CP1_2026-05-16_10-30-00.jpg
 *             DURING_CP1_001_2026-05-16_10-30-01.jpg
 *             DURING_CP1_002_2026-05-16_10-30-02.jpg
 *             AFTER_CP1_2026-05-16_10-30-15.jpg
 * 
 * ENDPOINTS:
 *   POST   /api/upload                              — Upload image from ESP32-CAM
 *   GET    /api/images/:patientId                    — List all sessions for a patient
 *   GET    /api/images/:patientId/:sessionName       — List images in a session
 *   GET    /api/image/:patientId/:sessionName/:file  — Serve a single image
 *   GET    /api/health                               — Server health check
 *   GET    /api/esp32/status                         — Proxy status from ESP32-CAM
 *   POST   /api/esp32/configure                      — Forward session config to ESP32-CAM
 * 
 * USAGE:
 *   cd server
 *   npm install
 *   npm start
 * 
 * Or from the project root:
 *   npm run server
 */

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');

// =========================================================================
// Configuration
// =========================================================================
const PORT = process.env.PORT || 3001;
const STORAGE_ROOT = path.join(__dirname, '..', 'healer-storage', 'patients');

// Counters for DURING images per session (in-memory, resets on restart)
const duringCounters = {};

// =========================================================================
// Express App Setup
// =========================================================================
const app = express();

// Enable CORS for all origins (dashboard runs on different port)
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// =========================================================================
// Multer Configuration — handles multipart file uploads
// =========================================================================
const upload = multer({
  storage: multer.memoryStorage(), // Store in memory temporarily
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max (ESP32-CAM images are usually 30-80KB)
    files: 1
  },
  fileFilter: (req, file, cb) => {
    // Only accept JPEG images
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg') {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG images are accepted'), false);
    }
  }
});

// =========================================================================
// POST /api/upload — Receive image from ESP32-CAM
// =========================================================================
app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    // --- Validate required fields ---
    const { patientId, compartmentNumber, imageType, sessionName, timestamp } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file received. Field name must be "image".'
      });
    }

    if (!patientId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: patientId'
      });
    }

    if (!imageType || !['BEFORE', 'DURING', 'AFTER'].includes(imageType.toUpperCase())) {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid imageType. Must be BEFORE, DURING, or AFTER.'
      });
    }

    // --- Sanitize inputs ---
    const safePatientId = String(patientId).replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeCompartment = String(compartmentNumber || '0').replace(/[^0-9]/g, '');
    const safeImageType = imageType.toUpperCase();

    // Generate session name if not provided
    const now = new Date();
    const safeSessionName = sessionName
      ? String(sessionName).replace(/[<>:"/\\|?*]/g, '-') // Remove filesystem-unsafe chars
      : `DIAGNOSIS SESSION ${formatDate(now)} ${formatTime(now)}`;

    // --- Create directory structure ---
    const sessionDir = path.join(STORAGE_ROOT, safePatientId, 'Pictures', safeSessionName);
    await fs.ensureDir(sessionDir);

    // --- Generate filename ---
    const dateStr = formatDate(now);
    const timeStr = formatTime(now);
    let filename;

    if (safeImageType === 'DURING') {
      // Track DURING image count per session
      const counterKey = `${safePatientId}_${safeSessionName}`;
      if (!duringCounters[counterKey]) {
        // Count existing DURING files in the directory
        const existingFiles = await fs.readdir(sessionDir);
        const duringFiles = existingFiles.filter(f => f.startsWith('DURING_'));
        duringCounters[counterKey] = duringFiles.length;
      }
      duringCounters[counterKey]++;
      const seq = String(duringCounters[counterKey]).padStart(3, '0');
      filename = `DURING_CP${safeCompartment}_${seq}_${dateStr}_${timeStr}.jpg`;
    } else {
      filename = `${safeImageType}_CP${safeCompartment}_${dateStr}_${timeStr}.jpg`;
    }

    // --- Save the image ---
    const filePath = path.join(sessionDir, filename);
    await fs.writeFile(filePath, req.file.buffer);

    const relativePath = path.relative(
      path.join(__dirname, '..'),
      filePath
    ).replace(/\\/g, '/');

    console.log(`[UPLOAD] Saved: ${relativePath} (${req.file.size} bytes)`);

    return res.status(200).json({
      success: true,
      path: relativePath,
      filename: filename,
      size: req.file.size,
      patientId: safePatientId,
      sessionName: safeSessionName,
      imageType: safeImageType
    });

  } catch (err) {
    console.error('[UPLOAD] Error:', err.message);
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// =========================================================================
// GET /api/images/:patientId — List all diagnosis sessions for a patient
// =========================================================================
app.get('/api/images/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const safePatientId = String(patientId).replace(/[^a-zA-Z0-9_-]/g, '_');
    const picturesDir = path.join(STORAGE_ROOT, safePatientId, 'Pictures');

    if (!await fs.pathExists(picturesDir)) {
      return res.json({ sessions: [], patientId: safePatientId });
    }

    const sessionDirs = await fs.readdir(picturesDir);
    const sessions = [];

    for (const sessionName of sessionDirs) {
      const sessionPath = path.join(picturesDir, sessionName);
      const stat = await fs.stat(sessionPath);

      if (stat.isDirectory()) {
        const files = await fs.readdir(sessionPath);
        const imageFiles = files.filter(f => f.endsWith('.jpg') || f.endsWith('.jpeg'));

        sessions.push({
          sessionName,
          imageCount: imageFiles.length,
          created: stat.birthtime,
          modified: stat.mtime,
          images: imageFiles.map(f => ({
            filename: f,
            type: f.startsWith('BEFORE_') ? 'BEFORE' :
                  f.startsWith('DURING_') ? 'DURING' :
                  f.startsWith('AFTER_') ? 'AFTER' : 'UNKNOWN',
            url: `/api/image/${safePatientId}/${encodeURIComponent(sessionName)}/${f}`
          }))
        });
      }
    }

    // Sort by most recent first
    sessions.sort((a, b) => new Date(b.created) - new Date(a.created));

    return res.json({
      patientId: safePatientId,
      sessions
    });

  } catch (err) {
    console.error('[API] Error listing sessions:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// GET /api/images/:patientId/:sessionName — List images in a specific session
// =========================================================================
app.get('/api/images/:patientId/:sessionName', async (req, res) => {
  try {
    const { patientId, sessionName } = req.params;
    const safePatientId = String(patientId).replace(/[^a-zA-Z0-9_-]/g, '_');
    const sessionDir = path.join(STORAGE_ROOT, safePatientId, 'Pictures', sessionName);

    if (!await fs.pathExists(sessionDir)) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const files = await fs.readdir(sessionDir);
    const images = [];

    for (const file of files) {
      if (file.endsWith('.jpg') || file.endsWith('.jpeg')) {
        const filePath = path.join(sessionDir, file);
        const stat = await fs.stat(filePath);

        images.push({
          filename: file,
          type: file.startsWith('BEFORE_') ? 'BEFORE' :
                file.startsWith('DURING_') ? 'DURING' :
                file.startsWith('AFTER_') ? 'AFTER' : 'UNKNOWN',
          size: stat.size,
          created: stat.birthtime,
          url: `/api/image/${safePatientId}/${encodeURIComponent(sessionName)}/${file}`
        });
      }
    }

    // Sort: BEFORE first, then DURING (by sequence), then AFTER
    const typeOrder = { 'BEFORE': 0, 'DURING': 1, 'AFTER': 2, 'UNKNOWN': 3 };
    images.sort((a, b) => {
      if (typeOrder[a.type] !== typeOrder[b.type]) {
        return typeOrder[a.type] - typeOrder[b.type];
      }
      return a.filename.localeCompare(b.filename);
    });

    return res.json({
      patientId: safePatientId,
      sessionName,
      images
    });

  } catch (err) {
    console.error('[API] Error listing images:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// GET /api/image/:patientId/:sessionName/:filename — Serve a single image
// =========================================================================
app.get('/api/image/:patientId/:sessionName/:filename', async (req, res) => {
  try {
    const { patientId, sessionName, filename } = req.params;
    const safePatientId = String(patientId).replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeFilename = path.basename(filename); // Prevent directory traversal
    const filePath = path.join(STORAGE_ROOT, safePatientId, 'Pictures', sessionName, safeFilename);

    if (!await fs.pathExists(filePath)) {
      return res.status(404).json({ error: 'Image not found' });
    }

    res.sendFile(filePath);

  } catch (err) {
    console.error('[API] Error serving image:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// GET /api/health — Server health check
// =========================================================================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    server: 'H.E.A.L.E.R Image Server',
    uptime: process.uptime(),
    storageRoot: STORAGE_ROOT,
    timestamp: new Date().toISOString()
  });
});

// =========================================================================
// GET /api/esp32/status — Proxy ESP32-CAM status check
// =========================================================================
app.get('/api/esp32/status', async (req, res) => {
  const esp32Url = req.query.esp32Url;

  if (!esp32Url) {
    return res.status(400).json({
      error: 'Missing esp32Url query parameter'
    });
  }

  try {
    // Dynamic import for fetch (Node 18+)
    const response = await fetch(`${esp32Url}/status`, {
      signal: AbortSignal.timeout(5000)
    });
    const data = await response.json();
    return res.json(data);
  } catch (err) {
    return res.status(502).json({
      error: 'ESP32-CAM unreachable',
      details: err.message,
      esp32Url
    });
  }
});

// =========================================================================
// POST /api/esp32/configure — Forward session config to ESP32-CAM
// =========================================================================
app.post('/api/esp32/configure', async (req, res) => {
  const { esp32Url, patientId, sessionName } = req.body;

  if (!esp32Url || !patientId) {
    return res.status(400).json({
      error: 'Missing required fields: esp32Url, patientId'
    });
  }

  // Generate session name if not provided
  const now = new Date();
  const session = sessionName || `DIAGNOSIS SESSION ${formatDate(now)} ${formatTime(now)}`;

  try {
    const params = new URLSearchParams({
      patientId: String(patientId),
      sessionName: session
    });

    const response = await fetch(`${esp32Url}/set_session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
      signal: AbortSignal.timeout(5000)
    });

    const data = await response.json();
    return res.json(data);
  } catch (err) {
    return res.status(502).json({
      error: 'Failed to configure ESP32-CAM',
      details: err.message
    });
  }
});

// =========================================================================
// Error Handler
// =========================================================================
app.use((err, req, res, next) => {
  // Handle multer errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        error: 'Image file too large. Maximum size is 5MB.'
      });
    }
    return res.status(400).json({
      success: false,
      error: `Upload error: ${err.message}`
    });
  }

  console.error('[SERVER] Unhandled error:', err.message);
  return res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// =========================================================================
// Utility Functions
// =========================================================================

/**
 * Format date as DD-MM-YYYY
 */
function formatDate(date) {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

/**
 * Format time as HH-MM-SS
 */
function formatTime(date) {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${hh}-${mm}-${ss}`;
}

// =========================================================================
// Start Server
// =========================================================================
app.listen(PORT, () => {
  console.log('');
  console.log('====================================================');
  console.log('  H.E.A.L.E.R Image Server');
  console.log('====================================================');
  console.log(`  Port:     ${PORT}`);
  console.log(`  Storage:  ${STORAGE_ROOT}`);
  console.log(`  Health:   http://localhost:${PORT}/api/health`);
  console.log('====================================================');
  console.log('  Waiting for ESP32-CAM uploads...');
  console.log('');

  // Ensure the storage root exists
  fs.ensureDirSync(STORAGE_ROOT);
});
