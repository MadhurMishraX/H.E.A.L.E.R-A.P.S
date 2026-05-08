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
  PowerOff
} from 'lucide-react';
import { 
  requestWebSerialPort, 
  requestBluetoothDevice, 
  closeHardware,
  getConnectionStatus,
  getHardwareConfig,
  onConnectionStatus
} from '../utils/serialComm';

interface HardwareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HardwareModal = ({ isOpen, onClose }: HardwareModalProps) => {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>(getConnectionStatus() === 'connected' ? 'connected' : 'idle');
  const [activeType, setActiveType] = useState<'usb' | 'bluetooth' | null>(getConnectionStatus() === 'connected' ? getHardwareConfig().type as any : null);
  const [selectedType, setSelectedType] = useState<'usb' | 'bluetooth'>(activeType || 'bluetooth');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const unlisten = onConnectionStatus((newStatus, error) => {
      setStatus(newStatus as any);
      if (newStatus === 'connected') {
        const type = getHardwareConfig().type as any;
        setActiveType(type);
        setSelectedType(type);
      } else if (newStatus === 'idle') {
        setActiveType(null);
      }
      
      if (newStatus === 'error') {
        setErrorMsg(error || 'Connection failed');
      }
    });
    return () => unlisten();
  }, []);

  const handleConnect = async () => {
    setStatus('connecting');
    setErrorMsg(null);
    const res = selectedType === 'usb' ? await requestWebSerialPort() : await requestBluetoothDevice();
    if (!res.success) {
      setStatus('error');
      setErrorMsg(res.error || 'Connection failed');
    }
  };

  const handleDisconnect = async () => {
    await closeHardware();
    setStatus('idle');
    setActiveType(null);
  };

  const handleCancel = () => {
    setStatus('idle');
    setErrorMsg(null);
  };

  if (!isOpen) return null;

  const isConnected = status === 'connected';
  const isConnecting = status === 'connecting';
  const isError = status === 'error';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-brand-navy/95 backdrop-blur-xl">
      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }} 
        animate={{ opacity: 1, y: 0, scale: 1 }} 
        className="w-full max-w-lg glass-card p-10 flex flex-col items-center gap-8 relative overflow-hidden border border-white/10"
      >
        {/* Close Icon (Top Right) */}
        <button onClick={onClose} className="absolute top-6 right-6 text-text-muted hover:text-white transition-colors">
          <X size={24} />
        </button>

        {/* 1. Top Status Circle */}
        <div className="relative">
          <motion.div 
            animate={isConnected ? { scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] } : {}}
            transition={{ repeat: Infinity, duration: 2 }}
            className={`absolute inset-[-12px] rounded-full ${isConnected ? 'bg-brand-success' : isError ? 'bg-brand-danger' : 'bg-brand-primary/20'}`}
          />
          <div className={`w-20 h-20 rounded-full flex items-center justify-center border-2 ${
            isConnected ? 'border-brand-success text-brand-success bg-brand-success/10' : 
            isError ? 'border-brand-danger text-brand-danger bg-brand-danger/10' : 
            'border-white/10 text-white/50 bg-white/5'
          }`}>
            {isConnected ? <ShieldCheck size={40} /> : isError ? <AlertCircle size={40} /> : <Settings size={40} />}
          </div>
        </div>

        {/* 2. Main Title & Subtitle */}
        <div className="text-center">
          <h2 className="text-4xl font-black text-white mb-3 tracking-tight italic uppercase">
            {isConnected ? 'Hardware Ready' : isError ? 'Hardware Offline' : 'Connect System'}
          </h2>
          <p className="text-text-secondary text-sm max-w-xs mx-auto font-medium leading-relaxed">
            {isConnected 
              ? `The application is successfully communicating with the H.E.A.L.E.R robot via ${activeType?.toUpperCase()}.`
              : isError 
              ? 'The application could not detect the hardware. Please check your connection and try again.'
              : 'Choose your preferred communication link to start controlling the robot.'
            }
          </p>
        </div>

        {/* 3. Configuration Box (Toggle Switch) */}
        <div className="w-full bg-white/[0.03] border border-white/5 rounded-3xl p-8 flex flex-col gap-6">
          <div className="flex items-center gap-3 text-brand-secondary">
            <Wifi size={18} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Communication Link</span>
          </div>

          <div className="bg-brand-navy/50 p-1.5 rounded-2xl flex relative h-14 border border-white/5">
            {/* Sliding Highlight */}
            <motion.div 
              animate={{ x: selectedType === 'usb' ? '0%' : '100%' }}
              className="absolute top-1.5 bottom-1.5 left-1.5 w-[calc(50%-6px)] bg-brand-primary rounded-xl shadow-[0_0_20px_rgba(33,150,243,0.4)]"
            />
            
            <button 
              onClick={() => setSelectedType('usb')}
              disabled={isConnected || isConnecting}
              className={`flex-1 z-10 font-black text-[10px] uppercase tracking-widest transition-colors ${selectedType === 'usb' ? 'text-white' : 'text-text-muted hover:text-text-secondary'}`}
            >
              USB (Serial)
            </button>
            <button 
              onClick={() => setSelectedType('bluetooth')}
              disabled={isConnected || isConnecting}
              className={`flex-1 z-10 font-black text-[10px] uppercase tracking-widest transition-colors ${selectedType === 'bluetooth' ? 'text-white' : 'text-text-muted hover:text-text-secondary'}`}
            >
              Bluetooth
            </button>
          </div>
        </div>

        {/* 4. Action Buttons */}
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

          <button 
            onClick={onClose}
            className="w-full py-5 text-text-muted hover:text-white font-bold uppercase tracking-[0.2em] text-[10px] transition-colors"
          >
            Close Panel
          </button>
        </div>

        {/* Error Overlay */}
        <AnimatePresence>
          {isError && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 text-center"
            >
              <span className="text-[10px] font-bold text-brand-danger uppercase tracking-widest bg-brand-danger/10 px-4 py-2 rounded-full border border-brand-danger/20">
                {errorMsg}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
