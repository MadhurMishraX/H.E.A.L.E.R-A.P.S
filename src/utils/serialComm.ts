/**
 * H.E.A.L.E.R - Dual Mode Serial Communication (USB & Bluetooth)
 * -------------------------------------------------------------
 */

export type ConnectionType = 'usb' | 'bluetooth' | 'wifi' | 'none';
export type HardwareStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

import { loadWifiConfig, sendWifiCommand, testESP32Connection } from './wifiService';

let port: any = null;
let reader: any = null;
let writer: any = null;
let bleDevice: BluetoothDevice | null = null;
let bleCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;

let keepReading = true;
let _connType: ConnectionType = 'none';
let _status: HardwareStatus = 'disconnected';

// BLE UUIDs (Must match ESP32) - Standardized to lowercase
const SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const RX_UUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
const TX_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';

// --- Global Hardware Disconnect Listener (USB) ---
if ('serial' in navigator) {
  (navigator as any).serial.addEventListener('disconnect', (event: any) => {
    if (event.target === port) {
      console.warn('USB Hardware disconnected unexpectedly');
      updateStatus('disconnected');
      port = null;
      writer = null;
      reader = null;
      _connType = 'none';
    }
  });
}

/**
 * Initialize Hardware Connection (Auto-reconnect for USB)
 */
export async function initHardware(type: ConnectionType): Promise<{ success: boolean; error?: string }> {
  _connType = type;
  updateStatus('connecting');
  
  if (type === 'usb') {
    return await initWebSerial();
  } else if (type === 'bluetooth') {
    return await initWebBluetooth();
  } else if (type === 'wifi') {
    return await initWifiGateway();
  }
  
  updateStatus('disconnected');
  return { success: false, error: 'INVALID_TYPE' };
}

async function initWifiGateway() {
  const config = loadWifiConfig();
  const res = await testESP32Connection(config.esp32Url);
  if (res.success) {
    updateStatus('connected');
    return { success: true };
  }
  updateStatus('error', res.error);
  return { success: false, error: res.error };
}

async function initWebSerial() {
  if (!('serial' in navigator)) return { success: false, error: 'Not supported' };
  try {
    const ports = await (navigator as any).serial.getPorts();
    if (ports.length > 0) {
      port = ports[0];
      await port.open({ baudRate: 9600 });
      await port.setSignals({ dataTerminalReady: true, requestToSend: true });
      await new Promise(r => setTimeout(r, 2000));
      if (port.writable) writer = port.writable.getWriter();
      startReading();
      updateStatus('connected');
      return { success: true };
    }
    updateStatus('disconnected');
    return { success: false, error: 'NEEDS_USER_GESTURE' };
  } catch (err: any) {
    updateStatus('error', err.message);
    return { success: false, error: err.message };
  }
}

async function initWebBluetooth() {
  if (!('bluetooth' in navigator)) return { success: false, error: 'Not supported' };
  
  // 1. Try to find an existing device we've already authorized
  if (!bleDevice && (navigator.bluetooth as any).getDevices) {
    try {
      const devices = await (navigator.bluetooth as any).getDevices();
      const healer = devices.find((d: any) => d.name === 'HEALER-ROBOT');
      if (healer) {
        bleDevice = healer;
        console.log('Auto-connecting to known robot...');
      }
    } catch (err) {
      console.warn('Auto-connect lookup failed:', err);
    }
  }

  if (!bleDevice) {
    updateStatus('disconnected');
    return { success: false, error: 'NEEDS_USER_GESTURE' };
  }
  try {
    const server = await bleDevice.gatt?.connect();
    const service = await server?.getPrimaryService(SERVICE_UUID);
    bleCharacteristic = await service?.getCharacteristic(RX_UUID) || null;
    
    const txChar = await service?.getCharacteristic(TX_UUID);
    await txChar?.startNotifications();
    let bleBuffer = "";
    txChar?.addEventListener('characteristicvaluechanged', (event: any) => {
      const chunk = new TextDecoder().decode(event.target.value);
      bleBuffer += chunk;
      
      let nl = bleBuffer.indexOf('\n');
      while (nl >= 0) {
        const msg = bleBuffer.slice(0, nl).trim();
        bleBuffer = bleBuffer.slice(nl + 1);
        if (msg) dispatchMessage(msg);
        nl = bleBuffer.indexOf('\n');
      }
    });

    bleDevice.addEventListener('gattserverdisconnected', () => {
      console.warn('Bluetooth disconnected unexpectedly. Starting auto-healing...');
      updateStatus('disconnected');
      bleCharacteristic = null;
      if (_connType === 'bluetooth') {
        attemptAutoReconnect();
      }
    });

    updateStatus('connected');
    return { success: true };
  } catch (err: any) {
    updateStatus('error', err.message);
    return { success: false, error: err.message };
  }
}

export async function requestBluetoothDevice() {
  if (!('bluetooth' in navigator)) {
    return { 
      success: false, 
      error: 'Bluetooth requires a secure connection (HTTPS) or is not supported on this device.' 
    };
  }
  try {
    bleDevice = await navigator.bluetooth.requestDevice({
      filters: [
        { name: 'HEALER-ROBOT' },
        { services: [SERVICE_UUID] }
      ],
      optionalServices: [SERVICE_UUID]
    });
    _connType = 'bluetooth'; // Update mode here
    return await initWebBluetooth();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function requestWebSerialPort() {
  if (!('serial' in navigator)) {
    return { 
      success: false, 
      error: 'USB Serial requires a secure connection (HTTPS) or a desktop browser (Chrome/Edge).' 
    };
  }
  try {
    port = await (navigator as any).serial.requestPort();
    _connType = 'usb'; // Update mode here
    return await initWebSerial();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

let isProcessingQueue = false;
const commandQueue: string[] = [];

export async function sendCommand(command: string) {
  const fullCommand = command.endsWith('\n') ? command : `${command}\n`;
  commandQueue.push(fullCommand);
  processQueue();
}

async function processQueue() {
  if (isProcessingQueue || commandQueue.length === 0) return;
  
  isProcessingQueue = true;
  while (commandQueue.length > 0) {
    const nextCommand = commandQueue.shift();
    if (!nextCommand) continue;

    try {
      if (_connType === 'usb' && writer) {
        await writer.ready;
        await writer.write(new TextEncoder().encode(nextCommand));
      } else if (_connType === 'bluetooth' && bleCharacteristic) {
        // Use standard writeValue (which selects best method) and wait
        await bleCharacteristic.writeValue(new TextEncoder().encode(nextCommand));
        // Safety delay for the BLE-to-Serial bridge on the ESP32
        await new Promise(r => setTimeout(r, 600));
      } else if (_connType === 'wifi') {
        const config = loadWifiConfig();
        // Remove trailing newline for the HTTP gateway
        const cleanCmd = nextCommand.trim();
        await sendWifiCommand(config.esp32Url, cleanCmd);
      }
      console.log(`[QUEUE]: Sent ${nextCommand.trim()}`);
    } catch (err) {
      console.error("Failed to send command:", err);
    }
  }
  isProcessingQueue = false;
}

function startReading() {
  keepReading = true;
  (async () => {
    while (port && port.readable && keepReading) {
      try {
        reader = port.readable.getReader();
        let buffer = "";
        while (keepReading) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += new TextDecoder().decode(value);
          let nl = buffer.indexOf('\n');
          while (nl >= 0) {
            const msg = buffer.slice(0, nl).trim();
            buffer = buffer.slice(nl + 1);
            if (msg) dispatchMessage(msg);
            nl = buffer.indexOf('\n');
          }
        }
      } catch (e) {
        console.error("Serial read error:", e);
      } finally {
        if (reader) {
          reader.releaseLock();
          reader = null;
        }
      }
    }
  })();
}

function updateStatus(status: HardwareStatus, error?: string) {
  _status = status;
  window.dispatchEvent(new CustomEvent('hardware-status', { detail: { status, error } }));
}

function dispatchMessage(msg: string) {
  const cleanMsg = msg.trim();
  if (cleanMsg) {
    console.log(`[HARDWARE]: ${cleanMsg}`);
    window.dispatchEvent(new CustomEvent('hardware-message', { detail: cleanMsg }));
  }
}

// Helpers for React components
export const onConnectionStatus = (callback: (status: HardwareStatus, error?: string) => void) => {
  const handler = (e: any) => callback(e.detail.status, e.detail.error);
  window.addEventListener('hardware-status', handler);
  return () => window.removeEventListener('hardware-status', handler);
};

export const onMessage = (callback: (msg: string) => void) => {
  const handler = (e: any) => callback(e.detail);
  window.addEventListener('hardware-message', handler);
  return () => window.removeEventListener('hardware-message', handler);
};

export const getHardwareConfig = () => ({ type: _connType });
export const getConnectionStatus = () => _status;

// --- Auto-Healing Logic ---
let reconnectInterval: NodeJS.Timeout | null = null;

async function attemptAutoReconnect() {
  if (reconnectInterval) return;
  
  console.log('🔄 Auto-Healing: Searching for robot...');
  
  reconnectInterval = setInterval(async () => {
    if (_status === 'connected' || _connType !== 'bluetooth') {
      if (reconnectInterval) clearInterval(reconnectInterval);
      reconnectInterval = null;
      return;
    }

    console.log('🔄 Auto-Healing: Attempting to re-establish link...');
    const res = await initWebBluetooth();
    if (res.success) {
      console.log('✅ Auto-Healing: Robot recovered!');
      if (reconnectInterval) clearInterval(reconnectInterval);
      reconnectInterval = null;
    }
  }, 5000); // Try every 5 seconds
}

export const closeHardware = async () => {
  if (reconnectInterval) {
    clearInterval(reconnectInterval);
    reconnectInterval = null;
  }
  
  keepReading = false;
  
  if (writer) {
    try {
      await writer.close();
    } catch (e) {}
    writer.releaseLock();
    writer = null;
  }

  if (reader) {
    try {
      await reader.cancel();
    } catch (e) {}
    // reader.releaseLock() is handled in the startReading finally block
    reader = null;
  }

  if (port) {
    try {
      await port.close();
    } catch (e) {
      console.error("Error closing port:", e);
    }
    port = null;
  }

  if (bleDevice) {
    if (bleDevice.gatt?.connected) {
      bleDevice.gatt.disconnect();
    }
    bleDevice = null;
  }
  
  updateStatus('disconnected');
};
