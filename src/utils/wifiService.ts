/**
 * H.E.A.L.E.R - Wi-Fi Connection Service
 * ========================================
 * 
 * Manages the Wi-Fi connection between the admin dashboard, the backend
 * image server, and the ESP32-CAM module. Provides connection testing,
 * session configuration, and image retrieval functions.
 * 
 * This module does NOT replace the existing USB/Bluetooth serialComm.ts.
 * It operates as a separate, parallel connection path specifically for
 * ESP32-CAM image capture and Wi-Fi status monitoring.
 */

// =========================================================================
// Types
// =========================================================================

export interface WifiConfig {
  /** Backend image server URL, e.g., "http://localhost:3001" */
  serverUrl: string;
  /** ESP32-CAM URL, e.g., "http://healer-cam.local" or "http://192.168.1.50" */
  esp32Url: string;
  /** Wi-Fi network name (informational, to confirm same network) */
  ssid: string;
}

export interface ESP32Status {
  device: string;
  cameraReady: boolean;
  wifiConnected: boolean;
  rssi: number;
  ip: string;
  isCapturing: boolean;
  activeCompartment: number;
  patientId: string;
  sessionName: string;
  captureCount: number;
  freeHeap: number;
  uptimeMs: number;
}

export interface SessionImage {
  filename: string;
  type: 'BEFORE' | 'DURING' | 'AFTER' | 'UNKNOWN';
  url: string;
  size?: number;
  created?: string;
}

export interface DiagnosisSession {
  sessionName: string;
  imageCount: number;
  created: string;
  modified: string;
  images: SessionImage[];
}

export type WifiConnectionStatus = 'disconnected' | 'testing' | 'connected' | 'error';

// =========================================================================
// LocalStorage Keys
// =========================================================================

const STORAGE_KEY = 'healer_wifi_config';

// =========================================================================
// Configuration Management
// =========================================================================

/** Default Wi-Fi configuration */
const DEFAULT_CONFIG: WifiConfig = {
  serverUrl: 'http://localhost:3001',
  esp32Url: 'http://healer-cam.local',
  ssid: '',
};

/** Save Wi-Fi configuration to localStorage */
export function saveWifiConfig(config: WifiConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('[WiFi Config] Failed to save:', err);
  }
}

/** Load Wi-Fi configuration from localStorage */
export function loadWifiConfig(): WifiConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_CONFIG, ...parsed };
    }
  } catch (err) {
    console.error('[WiFi Config] Failed to load:', err);
  }
  return { ...DEFAULT_CONFIG };
}

// =========================================================================
// Connection Testing
// =========================================================================

/**
 * Test if the backend image server is reachable.
 * Sends a GET request to /api/health and checks for a valid response.
 */
export async function testBackendConnection(serverUrl: string): Promise<{
  success: boolean;
  error?: string;
  data?: any;
}> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${serverUrl}/api/health`, {
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return { success: false, error: `Server returned HTTP ${response.status}` };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return { success: false, error: 'Connection timed out (5s). Is the server running?' };
    }
    return {
      success: false,
      error: `Cannot reach server: ${err.message}. Make sure "npm run server" is running.`,
    };
  }
}

/**
 * Test if the ESP32-CAM is reachable.
 * Sends a GET request to /status on the ESP32-CAM's HTTP server.
 */
export async function testESP32Connection(esp32Url: string): Promise<{
  success: boolean;
  error?: string;
  data?: ESP32Status;
}> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${esp32Url}/status`, {
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return { success: false, error: `ESP32-CAM returned HTTP ${response.status}` };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return {
        success: false,
        error: 'ESP32-CAM timed out. Check: powered on, same Wi-Fi, correct IP?',
      };
    }
    return {
      success: false,
      error: `ESP32-CAM unreachable: ${err.message}`,
    };
  }
}

// =========================================================================
// ESP32-CAM Session Configuration
// =========================================================================

/**
 * Configure the ESP32-CAM with patient and session information.
 * Called by the dashboard before a dispensing session begins.
 */
export async function configureESP32Session(
  serverUrl: string,
  esp32Url: string,
  patientId: string | number,
  sessionName?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(`${serverUrl}/api/esp32/configure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        esp32Url,
        patientId: String(patientId),
        sessionName: sessionName || generateSessionName(),
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return {
        success: false,
        error: err.error || `Configuration failed (HTTP ${response.status})`,
      };
    }

    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: `Failed to configure ESP32-CAM: ${err.message}`,
    };
  }
}

// =========================================================================
// Image Retrieval
// =========================================================================

/**
 * Get all diagnosis sessions with images for a patient.
 */
export async function getPatientSessions(
  serverUrl: string,
  patientId: string | number
): Promise<{ sessions: DiagnosisSession[]; error?: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`${serverUrl}/api/images/${patientId}`, {
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return { sessions: [], error: `Server returned HTTP ${response.status}` };
    }

    const data = await response.json();
    return { sessions: data.sessions || [] };
  } catch (err: any) {
    return { sessions: [], error: `Failed to fetch sessions: ${err.message}` };
  }
}

/**
 * Get all images for a specific diagnosis session.
 */
export async function getSessionImages(
  serverUrl: string,
  patientId: string | number,
  sessionName: string
): Promise<{ images: SessionImage[]; error?: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(
      `${serverUrl}/api/images/${patientId}/${encodeURIComponent(sessionName)}`,
      { signal: controller.signal }
    );

    clearTimeout(timeout);

    if (!response.ok) {
      return { images: [], error: `Server returned HTTP ${response.status}` };
    }

    const data = await response.json();
    return { images: data.images || [] };
  } catch (err: any) {
    return { images: [], error: `Failed to fetch images: ${err.message}` };
  }
}

/**
 * Build a full image URL for display in the dashboard.
 */
export function getImageUrl(serverUrl: string, relativeUrl: string): string {
  return `${serverUrl}${relativeUrl}`;
}

// =========================================================================
// Utility Functions
// =========================================================================

/**
 * Generate a session name in the format: DIAGNOSIS SESSION DD-MM-YYYY HH-MM-SS
 */
export function generateSessionName(): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `DIAGNOSIS SESSION ${dd}-${mm}-${yyyy} ${hh}-${min}-${ss}`;
}

// =========================================================================
// Event System — Wi-Fi status updates for React components
// =========================================================================

export type WifiStatusDetail = {
  serverStatus: 'unknown' | 'online' | 'offline';
  esp32Status: 'unknown' | 'online' | 'offline';
  esp32Data?: ESP32Status;
  error?: string;
};

/** Dispatch a Wi-Fi status update event */
export function dispatchWifiStatus(detail: WifiStatusDetail): void {
  window.dispatchEvent(
    new CustomEvent('wifi-status', { detail })
  );
}

/** Subscribe to Wi-Fi status updates */
export function onWifiStatus(
  callback: (detail: WifiStatusDetail) => void
): () => void {
  const handler = (e: any) => callback(e.detail);
  window.addEventListener('wifi-status', handler);
  return () => window.removeEventListener('wifi-status', handler);
}
