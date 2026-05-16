import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Usb, 
  Activity, 
  Loader2, 
  X,
  Settings,
  ShieldCheck,
  AlertCircle,
  Wifi,
  WifiOff,
  PowerOff,
  Globe,
  Camera,
  Server,
  CheckCircle2,
  RefreshCw,
  Signal,
  Info
} from 'lucide-react';
import { 
  requestWebSerialPort, 
  requestBluetoothDevice, 
  closeHardware,
  getConnectionStatus,
  getHardwareConfig,
  onConnectionStatus
} from '../utils/serialComm';
import {
  loadWifiConfig,
  saveWifiConfig,
  testBackendConnection,
  testESP32Connection,
  type WifiConfig,
  type WifiStatusDetail,
  type ESP32Status,
} from '../utils/wifiService';

interface HardwareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HardwareModal = ({ isOpen, onClose }: HardwareModalProps) => {
  // --- Existing USB/Bluetooth State ---
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>(getConnectionStatus());
  const [activeType, setActiveType] = useState<'usb' | 'bluetooth' | null>(getConnectionStatus() === 'connected' ? getHardwareConfig().type as any : null);
  const [selectedType, setSelectedType] = useState<'usb' | 'bluetooth' | 'wifi'>(activeType || 'bluetooth');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // --- Wi-Fi State ---
  const [wifiConfig, setWifiConfig] = useState<WifiConfig>(loadWifiConfig());
  const [wifiTesting, setWifiTesting] = useState(false);
  const [serverOnline, setServerOnline] = useState<'unknown' | 'online' | 'offline'>('unknown');
  const [esp32Online, setEsp32Online] = useState<'unknown' | 'online' | 'offline'>('unknown');
  const [esp32Data, setEsp32Data] = useState<ESP32Status | null>(null);
  const [wifiError, setWifiError] = useState<string | null>(null);
  const [sameNetworkConfirmed, setSameNetworkConfirmed] = useState(false);

  // --- USB/Bluetooth connection status listener ---
  useEffect(() => {
    const unlisten = onConnectionStatus((newStatus, error) => {
      setStatus(newStatus as any);
      if (newStatus === 'connected') {
        const type = getHardwareConfig().type as any;
        setActiveType(type);
        setSelectedType(type);
      } else if (newStatus === 'disconnected') {
        setActiveType(null);
      }
      
      if (newStatus === 'error') {
        setErrorMsg(error || 'Connection failed');
      }
    });
    return () => unlisten();
  }, []);

  // --- USB/Bluetooth Connect ---
  const handleConnect = async () => {
    setStatus('connecting');
    setErrorMsg(null);
    const res = selectedType === 'usb' ? await requestWebSerialPort() : await requestBluetoothDevice();
    if (!res.success) {
      setStatus('error');
      setErrorMsg(res.error || 'Connection failed');
    }
  };

  // --- USB/Bluetooth Disconnect ---
  const handleDisconnect = async () => {
    await closeHardware();
    setStatus('disconnected');
    setActiveType(null);
  };

  const handleCancel = () => {
    setStatus('disconnected');
    setErrorMsg(null);
  };

  // --- Reset errors when switching tabs ---
  useEffect(() => {
    setErrorMsg(null);
    setWifiError(null);
  }, [selectedType]);

  // --- Wi-Fi Config Handlers ---
  const handleWifiConfigChange = (field: keyof WifiConfig, value: string) => {
    const updated = { ...wifiConfig, [field]: value };
    setWifiConfig(updated);
    saveWifiConfig(updated);
    // Reset test results when config changes
    setServerOnline('unknown');
    setEsp32Online('unknown');
    setWifiError(null);
  };

  // --- Wi-Fi Test Connection ---
  const handleTestWifiConnection = async () => {
    setWifiTesting(true);
    setWifiError(null);
    setServerOnline('unknown');
    setEsp32Online('unknown');
    setEsp32Data(null);

    // Test backend server
    const serverResult = await testBackendConnection(wifiConfig.serverUrl);
    setServerOnline(serverResult.success ? 'online' : 'offline');

    // Test ESP32-CAM
    const esp32Result = await testESP32Connection(wifiConfig.esp32Url);
    setEsp32Online(esp32Result.success ? 'online' : 'offline');
    if (esp32Result.data) setEsp32Data(esp32Result.data);

    // Set overall error
    if (!serverResult.success && !esp32Result.success) {
      setWifiError('Both server and ESP32-CAM are unreachable. Check your network and settings.');
    } else if (!serverResult.success) {
      setWifiError(serverResult.error || 'Backend server is offline.');
    } else if (!esp32Result.success) {
      setWifiError(esp32Result.error || 'ESP32-CAM is offline.');
    }

    setWifiTesting(false);
  };

  if (!isOpen) return null;

  const isConnected = status === 'connected';
  const isConnecting = status === 'connecting';
  const isError = status === 'error';
  const isWifiMode = selectedType === 'wifi';
  const isWifiReady = serverOnline === 'online' && esp32Online === 'online';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-brand-navy/95 backdrop-blur-xl">
      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }} 
        animate={{ opacity: 1, y: 0, scale: 1 }} 
        className="w-full max-w-lg glass-card flex flex-col relative overflow-hidden border border-white/10 max-h-[90vh]"
      >
        {/* Close Icon (Top Right) */}
        <button onClick={onClose} className="absolute top-6 right-6 text-text-muted hover:text-white transition-colors z-30 bg-brand-navy/40 backdrop-blur-md p-2 rounded-full border border-white/10">
          <X size={20} />
        </button>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-8 md:p-10 scrollbar-thin scrollbar-thumb-brand-primary/20 hover:scrollbar-thumb-brand-primary/40">
          <div className="flex flex-col items-center gap-8">

        {/* 1. Top Status Circle */}
        <div className="relative">
          <motion.div 
            animate={isConnected || isWifiReady ? { scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] } : {}}
            transition={{ repeat: Infinity, duration: 2 }}
            className={`absolute inset-[-12px] rounded-full ${
              isConnected || isWifiReady ? 'bg-brand-success' : 
              isError ? 'bg-brand-danger' : 
              'bg-brand-primary/20'
            }`}
          />
          <div className={`w-20 h-20 rounded-full flex items-center justify-center border-2 ${
            isConnected || isWifiReady ? 'border-brand-success text-brand-success bg-brand-success/10' : 
            isError ? 'border-brand-danger text-brand-danger bg-brand-danger/10' : 
            'border-white/10 text-white/50 bg-white/5'
          }`}>
            {isConnected || isWifiReady ? <ShieldCheck size={40} /> : isError ? <AlertCircle size={40} /> : <Settings size={40} />}
          </div>
        </div>

        {/* 2. Main Title & Subtitle */}
        <div className="text-center">
          <h2 className="text-4xl font-black text-white mb-3 tracking-tight italic uppercase">
            {isConnected ? 'Hardware Ready' : isWifiReady ? 'Wi-Fi Ready' : isError ? 'Hardware Offline' : 'Connect System'}
          </h2>
          <p className="text-text-secondary text-sm max-w-xs mx-auto font-medium leading-relaxed">
            {isConnected 
              ? `The application is successfully communicating with the H.E.A.L.E.R robot via ${activeType?.toUpperCase()}.`
              : isWifiReady
              ? 'ESP32-CAM and backend server are both online and ready for image capture.'
              : isError 
              ? 'The application could not detect the hardware. Please check your connection and try again.'
              : 'Choose your preferred communication link to start controlling the robot.'
            }
          </p>
        </div>

        {/* 3. Communication Link Selector — 3 options: USB / Bluetooth / Wi-Fi */}
        <div className="w-full bg-white/[0.03] border border-white/5 rounded-3xl p-8 flex flex-col gap-6">
          <div className="flex items-center gap-3 text-brand-secondary">
            <Wifi size={18} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Communication Link</span>
          </div>

          <div className="bg-brand-navy/50 p-1.5 rounded-2xl flex relative h-14 border border-white/5">
            {/* Sliding Highlight — adjusts for 3 items */}
            <motion.div 
              animate={{ 
                x: selectedType === 'usb' ? '0%' : selectedType === 'bluetooth' ? '100%' : '200%' 
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="absolute top-1.5 bottom-1.5 left-1.5 w-[calc(33.333%-4px)] bg-brand-primary rounded-xl shadow-[0_0_20px_rgba(33,150,243,0.4)]"
            />
            
            <button 
              onClick={() => setSelectedType('usb')}
              disabled={isConnected || isConnecting}
              className={`flex-1 z-10 font-black text-[9px] uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 ${selectedType === 'usb' ? 'text-white' : 'text-text-muted hover:text-text-secondary'}`}
            >
              <Usb size={14} />
              USB
            </button>
            <button 
              onClick={() => setSelectedType('bluetooth')}
              disabled={isConnected || isConnecting}
              className={`flex-1 z-10 font-black text-[9px] uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 ${selectedType === 'bluetooth' ? 'text-white' : 'text-text-muted hover:text-text-secondary'}`}
            >
              <Activity size={14} />
              Bluetooth
            </button>
            <button 
              onClick={() => setSelectedType('wifi')}
              disabled={isConnected || isConnecting}
              className={`flex-1 z-10 font-black text-[9px] uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 ${selectedType === 'wifi' ? 'text-white' : 'text-text-muted hover:text-text-secondary'}`}
            >
              <Wifi size={14} />
              Wi-Fi
            </button>
          </div>
        </div>

        {/* 4. Wi-Fi Configuration Panel — Only shown when Wi-Fi tab is selected */}
        <AnimatePresence>
          {isWifiMode && !isConnected && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="w-full overflow-hidden"
            >
              <div className="flex flex-col gap-5">
                {/* Wi-Fi Network Name */}
                <div className="flex flex-col gap-2">
                  <label className="text-[9px] font-black uppercase tracking-[0.15em] text-text-muted flex items-center gap-2">
                    <Globe size={12} />
                    Wi-Fi Network Name (SSID)
                  </label>
                  <input
                    type="text"
                    value={wifiConfig.ssid}
                    onChange={(e) => handleWifiConfigChange('ssid', e.target.value)}
                    placeholder="Enter your Wi-Fi network name..."
                    className="h-12 bg-brand-navy border border-white/10 rounded-xl px-4 text-sm font-mono text-white focus:outline-none focus:border-brand-secondary transition-all placeholder:text-text-muted/50"
                  />
                </div>

                {/* Server IP:Port */}
                <div className="flex flex-col gap-2">
                  <label className="text-[9px] font-black uppercase tracking-[0.15em] text-text-muted flex items-center gap-2">
                    <Server size={12} />
                    Backend Server URL
                  </label>
                  <input
                    type="text"
                    value={wifiConfig.serverUrl}
                    onChange={(e) => handleWifiConfigChange('serverUrl', e.target.value)}
                    placeholder="http://localhost:3001"
                    className="h-12 bg-brand-navy border border-white/10 rounded-xl px-4 text-sm font-mono text-white focus:outline-none focus:border-brand-secondary transition-all placeholder:text-text-muted/50"
                  />
                </div>

                {/* ESP32-CAM IP */}
                <div className="flex flex-col gap-2">
                  <label className="text-[9px] font-black uppercase tracking-[0.15em] text-text-muted flex items-center gap-2">
                    <Camera size={12} />
                    ESP32-CAM Address
                  </label>
                  <input
                    type="text"
                    value={wifiConfig.esp32Url}
                    onChange={(e) => handleWifiConfigChange('esp32Url', e.target.value)}
                    placeholder="http://healer-cam.local"
                    className="h-12 bg-brand-navy border border-white/10 rounded-xl px-4 text-sm font-mono text-white focus:outline-none focus:border-brand-secondary transition-all placeholder:text-text-muted/50"
                  />
                </div>

                {/* Same Network Confirmation */}
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div
                    onClick={() => setSameNetworkConfirmed(!sameNetworkConfirmed)}
                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                      sameNetworkConfirmed
                        ? 'bg-brand-success border-brand-success'
                        : 'border-white/20 bg-transparent group-hover:border-white/40'
                    }`}
                  >
                    {sameNetworkConfirmed && <CheckCircle2 size={14} className="text-white" />}
                  </div>
                  <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">
                    ESP32-CAM and this device are on the same Wi-Fi network
                  </span>
                </label>

                {/* Connection Status Indicators */}
                <div className="bg-brand-navy/50 border border-white/5 rounded-2xl p-5 flex flex-col gap-3">
                  <div className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted mb-1">
                    Connection Status
                  </div>

                  {/* Backend Server Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${
                        serverOnline === 'online' ? 'bg-brand-success shadow-[0_0_8px_rgba(0,230,118,0.6)]' :
                        serverOnline === 'offline' ? 'bg-brand-danger shadow-[0_0_8px_rgba(255,82,82,0.6)]' :
                        'bg-text-muted/30'
                      }`} />
                      <span className="text-xs font-bold text-text-secondary">Backend Server</span>
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${
                      serverOnline === 'online' ? 'text-brand-success' :
                      serverOnline === 'offline' ? 'text-brand-danger' :
                      'text-text-muted'
                    }`}>
                      {serverOnline === 'online' ? 'Online' : serverOnline === 'offline' ? 'Offline' : 'Unknown'}
                    </span>
                  </div>

                  {/* ESP32-CAM Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${
                        esp32Online === 'online' ? 'bg-brand-success shadow-[0_0_8px_rgba(0,230,118,0.6)]' :
                        esp32Online === 'offline' ? 'bg-brand-danger shadow-[0_0_8px_rgba(255,82,82,0.6)]' :
                        'bg-text-muted/30'
                      }`} />
                      <span className="text-xs font-bold text-text-secondary">ESP32-CAM</span>
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${
                      esp32Online === 'online' ? 'text-brand-success' :
                      esp32Online === 'offline' ? 'text-brand-danger' :
                      'text-text-muted'
                    }`}>
                      {esp32Online === 'online' ? 'Reachable' : esp32Online === 'offline' ? 'Unreachable' : 'Unknown'}
                    </span>
                  </div>

                  {/* ESP32-CAM Details (shown when online) */}
                  {esp32Data && esp32Online === 'online' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-2 pt-3 border-t border-white/5 flex flex-col gap-1.5"
                    >
                      <div className="flex justify-between text-[9px]">
                        <span className="text-text-muted font-bold uppercase tracking-widest">Camera</span>
                        <span className={esp32Data.cameraReady ? 'text-brand-success' : 'text-brand-danger'}>
                          {esp32Data.cameraReady ? 'Ready' : 'Not Ready'}
                        </span>
                      </div>
                      <div className="flex justify-between text-[9px]">
                        <span className="text-text-muted font-bold uppercase tracking-widest">Signal</span>
                        <span className="text-brand-secondary">{esp32Data.rssi} dBm</span>
                      </div>
                      <div className="flex justify-between text-[9px]">
                        <span className="text-text-muted font-bold uppercase tracking-widest">IP</span>
                        <span className="text-text-secondary font-mono">{esp32Data.ip}</span>
                      </div>
                      {esp32Data.isCapturing && (
                        <div className="flex justify-between text-[9px]">
                          <span className="text-text-muted font-bold uppercase tracking-widest">Capturing</span>
                          <span className="text-brand-warning">Compartment {esp32Data.activeCompartment}</span>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>

                {/* Test Connection Button */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleTestWifiConnection}
                  disabled={wifiTesting}
                  className="w-full py-4 bg-brand-primary text-white rounded-2xl flex items-center justify-center gap-3 shadow-[0_10px_25px_rgba(33,150,243,0.4)] hover:shadow-[0_15px_30px_rgba(33,150,243,0.5)] transition-all disabled:opacity-50"
                >
                  {wifiTesting ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <RefreshCw size={18} />
                  )}
                  <span className="font-black uppercase tracking-[0.15em] text-[11px]">
                    {wifiTesting ? 'Testing Connection...' : 'Test Connection'}
                  </span>
                </motion.button>

                {/* Wi-Fi Info Note */}
                <div className="flex items-start gap-3 px-2">
                  <Info size={14} className="text-text-muted shrink-0 mt-0.5" />
                  <p className="text-[9px] text-text-muted leading-relaxed">
                    Wi-Fi mode enables ESP32-CAM image capture during dispensing. 
                    The backend server must be running (<span className="font-mono text-brand-secondary">npm run server</span>).
                    USB or Bluetooth is still needed for servo/RFID control.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 5. Action Buttons — USB/Bluetooth modes */}
        {!isWifiMode && (
          <div className="w-full flex flex-col gap-4">
            <AnimatePresence mode="wait">
              {isConnected ? (
                <motion.button
                  key="disconnect"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDisconnect}
                  className="w-full py-5 bg-brand-danger/10 border border-brand-danger/30 text-brand-danger rounded-2xl flex items-center justify-center gap-3 hover:bg-brand-danger/20 transition-all shadow-[0_0_20px_rgba(255,82,82,0.1)] group"
                >
                  <PowerOff size={20} className="group-hover:rotate-12 transition-transform" />
                  <span className="font-black uppercase tracking-[0.15em] text-[11px]">Disconnect Hardware</span>
                </motion.button>
              ) : (
                <div className="flex flex-col gap-3 w-full">
                  <motion.button
                    key="connect"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isConnecting}
                    onClick={handleConnect}
                    className="w-full py-5 bg-brand-primary text-white rounded-2xl flex items-center justify-center gap-3 shadow-[0_10px_25px_rgba(33,150,243,0.4)] hover:shadow-[0_15px_30px_rgba(33,150,243,0.5)] transition-all disabled:opacity-50"
                  >
                    {isConnecting ? <Loader2 size={20} className="animate-spin" /> : (selectedType === 'usb' ? <Usb size={20} /> : <Activity size={20} />)}
                    <span className="font-black uppercase tracking-[0.15em] text-[11px]">
                      {isConnecting ? 'Initializing Link...' : `Connect via ${selectedType === 'usb' ? 'USB' : 'Bluetooth'}`}
                    </span>
                  </motion.button>

                  {isConnecting && (
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={handleCancel}
                      className="w-full py-3 text-brand-danger/60 hover:text-brand-danger font-bold uppercase tracking-widest text-[9px] transition-colors"
                    >
                      Cancel Connection Attempt
                    </motion.button>
                  )}
                </div>
              )}
            </AnimatePresence>
          </div>
        )}

          </div>
        </div>

        {/* Fixed Footer for Error and Close */}
        <div className="p-6 border-t border-white/5 bg-brand-navy/30 backdrop-blur-md flex flex-col gap-4">
          <AnimatePresence>
            {((isError && !isWifiMode) || (wifiError && isWifiMode)) && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="text-center p-4 bg-brand-danger/10 border border-brand-danger/20 rounded-2xl">
                  <p className="text-[10px] font-black text-brand-danger uppercase tracking-widest leading-relaxed">
                    {isWifiMode ? wifiError : errorMsg}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            onClick={onClose}
            className="w-full py-4 text-text-muted hover:text-white font-black uppercase tracking-[0.3em] text-[10px] transition-colors bg-white/5 hover:bg-white/10 rounded-xl"
          >
            Close Panel
          </button>
        </div>
      </motion.div>
    </div>
  );
};
