import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { 
  ShieldCheck, 
  QrCode, 
  UserPlus, 
  X,
  Smartphone,
  ChevronRight,
  Activity,
  Usb,
  Upload,
  Camera,
  Image as ImageIcon,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { motion, AnimatePresence } from 'motion/react';
import { loginPatient, loginPatientByQR, getPatientFullHistory } from '../services/dbService';
import { 
  sendCommand
} from '../utils/serialComm';
import { getSetting } from '../services/dbService';
import { HardwareModal } from '../components/HardwareModal';
import jsQR from 'jsqr';

// Helper component for Email Login icon
const MailIcon = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

export const LandingScreen = () => {
  const { t, language, setLanguage, setCurrentPatient, hwStatus, hwMode } = useAppContext();
  const isHardwareConnected = hwStatus === 'connected'; 
  const navigate = useNavigate();
  const [showScanner, setShowScanner] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [errorMessage, setErrorMessage] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  // Camera States
  const [cameras, setCameras] = useState<any[]>([]);
  const [activeCameraId, setActiveCameraId] = useState<string>('');
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qrCodeInstance = useRef<Html5Qrcode | null>(null);

  const handleFirstAid = () => {
    navigate('/dispensing', { state: { isFirstAid: true } });
  };

  // Initialize Camera
  useEffect(() => {
    if (showScanner) {
      void initCamera();
    } else {
      void stopCamera();
    }
    return () => {
      void stopCamera();
    };
  }, [showScanner]);

  const initCamera = async () => {
    setIsCameraLoading(true);
    setCameraError('');
    try {
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        setCameras(devices);
        // Default to back camera (environment) if available
        const backCamera = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment'));
        const selectedId = backCamera ? backCamera.id : devices[0].id;
        setActiveCameraId(selectedId);
        startScanning(selectedId);
      } else {
        setCameraError("No cameras found on this device.");
      }
    } catch (err) {
      console.error("Camera access error", err);
      setCameraError("Camera permission denied or not available.");
    } finally {
      setIsCameraLoading(false);
    }
  };

  const startScanning = async (cameraId: string) => {
    if (qrCodeInstance.current) {
      await stopCamera();
    }
    
    const instance = new Html5Qrcode("qr-reader");
    qrCodeInstance.current = instance;
    
    try {
      await instance.start(
        cameraId,
        { fps: 15, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          await stopCamera();
          handleScan(decodedText);
          setShowScanner(false);
        },
        () => { /* silent for scanning frames */ }
      );
    } catch (err) {
      console.error("Failed to start scanner", err);
      setCameraError("Failed to start camera feed.");
    }
  };

  const stopCamera = async () => {
    if (qrCodeInstance.current) {
      if (qrCodeInstance.current.isScanning) {
        try {
          await qrCodeInstance.current.stop();
        } catch (err) {
          console.error("Failed to stop scanner", err);
        }
      }
      qrCodeInstance.current = null;
      // Manually clear the container to prevent React removeChild errors
      const container = document.getElementById("qr-reader");
      if (container) {
        container.innerHTML = "";
      }
    }
  };

  const toggleCamera = () => {
    if (cameras.length < 2) return;
    const currentIndex = cameras.findIndex(c => c.id === activeCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextId = cameras[nextIndex].id;
    setActiveCameraId(nextId);
    startScanning(nextId);
  };

  const handleScan = async (scannedId: string) => {
    try {
      const patient = await loginPatientByQR(scannedId);
      if (patient && patient.id) {
        const fullPatient = await getPatientFullHistory(patient.id);
        setCurrentPatient(fullPatient);
        navigate('/dashboard');
      } else {
        setErrorMessage(t('landing.errorPatientNotFound') || "QR code not recognized. Please register first.");
        setTimeout(() => setErrorMessage(''), 5000);
      }
    } catch (err) {
      setErrorMessage("Error connecting to database.");
    }
  };

  const processImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) return;
        
        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0, img.width, img.height);
        
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code) {
          handleScan(code.data);
          setShowScanner(false);
        } else {
          setErrorMessage("No QR code detected in this image.");
          setTimeout(() => setErrorMessage(''), 5000);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImage(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processImage(file);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setErrorMessage('');
    try {
      const patient = await loginPatient(loginForm.email, loginForm.password);
      if (patient && patient.id) {
        const fullPatient = await getPatientFullHistory(patient.id);
        setCurrentPatient(fullPatient);
        navigate('/dashboard');
      } else {
        setErrorMessage(t('landing.errorLoginFailed'));
      }
    } catch (err) {
      setErrorMessage("Database error.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleAdminAccess = async () => {
    const rfidSetting = await getSetting('rfid_enabled');
    if (rfidSetting !== 'false') {
      sendCommand('REBOOT');
    }
    navigate('/admin');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
      className="w-full h-full flex overflow-y-auto relative font-sans text-text-primary scrollbar-thin scrollbar-thumb-brand-primary"
    >
      {/* Pro Hardware Connection Modal */}
      <HardwareModal isOpen={showStatusModal} onClose={() => setShowStatusModal(false)} />
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--color-brand-card)_0%,_transparent_50%)] pointer-events-none opacity-50" />
      
      {/* Top Right Hardware Status */}
      <motion.button 
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowStatusModal(true)}
        className={`absolute top-10 right-10 flex items-center gap-3 bg-[rgba(15,32,64,0.6)] backdrop-blur-md px-6 py-4 rounded-full border z-20 transition-colors ${
          hwStatus === 'connected' ? 'border-[rgba(33,150,243,0.2)] hover:bg-[rgba(15,32,64,0.8)]' : 
          hwStatus === 'connecting' ? 'border-[rgba(255,179,0,0.2)] hover:bg-[rgba(15,32,64,0.8)]' :
          'border-[rgba(255,82,82,0.2)] hover:bg-[rgba(255,82,82,0.1)]'
        }`}
      >
        <motion.div 
          animate={hwStatus === 'connected' ? { opacity: [1, 0.3, 1] } : {}}
          transition={{ repeat: Infinity, duration: 2 }}
          className={`w-3 h-3 rounded-full ${
            hwStatus === 'connected' ? 'bg-brand-success shadow-[0_0_12px_var(--color-brand-success)]' : 
            hwStatus === 'connecting' ? 'bg-brand-warning shadow-[0_0_12px_var(--color-brand-warning)] animate-pulse' :
            'bg-brand-danger shadow-[0_0_12px_var(--color-brand-danger)] animate-pulse'
          }`} 
        />
        <span className="text-sm font-bold uppercase tracking-[1.5px] text-text-secondary whitespace-nowrap">
          {hwStatus === 'connected' ? `Hardware Ready (${hwMode})` : 
           hwStatus === 'connecting' ? 'Connecting...' : 
           'Hardware Offline'}
        </span>
      </motion.button>

      {/* LEFT HALF */}
      <div className="w-1/2 h-full flex flex-col items-center justify-center border-r border-[rgba(33,150,243,0.1)] relative z-10">
        <div className="relative mb-12">
          {/* Cyan Glow Halo */}
          <div className="absolute inset-0 bg-brand-secondary blur-[80px] opacity-15 rounded-full scale-150" />
          
          {/* Restored Heartbeat Logo Animation */}
          <motion.div
            animate={isHardwareConnected ? {
              scale: [1, 1.02, 1, 1.05, 1]
            } : { scale: 1 }}
            transition={{
              repeat: isHardwareConnected ? Infinity : 0,
              duration: 1.5,
              ease: "easeInOut",
              times: [0, 0.1, 0.2, 0.4, 1]
            }}
            className="w-64 h-64 glass-card rounded-full flex flex-col items-center justify-center text-brand-secondary shadow-[0_0_40px_rgba(33,150,243,0.2)]"
          >
            <div className="relative w-40 h-24 flex items-center justify-center overflow-hidden">
              <svg
                viewBox="0 0 200 100"
                className="w-full h-full text-brand-secondary drop-shadow-[0_0_15px_rgba(0,188,212,0.5)]"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <motion.g
                  key={isHardwareConnected ? 'connected' : 'disconnected'}
                  animate={{ x: [-200, 0] }}
                  transition={{
                    repeat: Infinity,
                    duration: isHardwareConnected ? 3 : 6,
                    ease: "linear"
                  }}
                >
                  <motion.path
                    d={isHardwareConnected
                      ? "M0 50 L10 50 L15 45 L20 55 L25 50 L40 50 L45 70 L55 10 L65 90 L70 50 L85 50 L95 40 L105 50 L120 50 L125 45 L130 55 L135 50 L150 50 L155 70 L165 10 L175 90 L180 50 L200 50"
                      : "M0 50 L20 50 L25 48 L30 52 L35 50 L50 50 L55 52 L65 42 L75 58 L80 50 L120 50 L125 48 L130 52 L135 50 L150 50 L155 52 L165 42 L175 58 L180 50 L200 50"
                    }
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <motion.path
                    d={isHardwareConnected
                      ? "M0 50 L10 50 L15 45 L20 55 L25 50 L40 50 L45 70 L55 10 L65 90 L70 50 L85 50 L95 40 L105 50 L120 50 L125 45 L130 55 L135 50 L150 50 L155 70 L165 10 L175 90 L180 50 L200 50"
                      : "M0 50 L20 50 L25 48 L30 52 L35 50 L50 50 L55 52 L65 42 L75 58 L80 50 L120 50 L125 48 L130 52 L135 50 L150 50 L155 52 L165 42 L175 58 L180 50 L200 50"
                    }
                    transform="translate(200, 0)"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </motion.g>
              </svg>
            </div>
          </motion.div>
        </div>
        
        <h1 className="text-5xl font-black text-text-primary mb-4 relative">
          H.E.A.L.E.R
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-16 h-1 bg-brand-secondary rounded-full shadow-[0_0_10px_var(--color-brand-secondary)]" />
        </h1>
        <p className="text-xl text-text-muted mt-6 font-medium tracking-wide">
          {t('landing.tagline')}
        </p>
      </div>

      {/* RIGHT HALF */}
      <div className="w-1/2 h-full flex flex-col items-center p-16 pt-32 z-10">
        
        {/* Language Toggle */}
        <div className="flex bg-[rgba(15,32,64,0.5)] p-1.5 rounded-full mb-16 border border-[rgba(33,150,243,0.2)]">
          {['en', 'hi'].map(l => (
            <button
              key={l}
              onClick={() => setLanguage(l as any)}
              className={`px-8 py-3 rounded-full text-sm font-bold tracking-widest uppercase transition-all duration-300 ${
                language === l 
                  ? 'bg-brand-primary text-text-primary shadow-[0_4px_12px_rgba(33,150,243,0.4)]' 
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {t(`landing.${l}`)}
            </button>
          ))}
        </div>

        {/* Main Menu */}
        <div className="w-full max-w-md flex flex-col gap-6">

          {errorMessage && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-[rgba(255,82,82,0.1)] border border-brand-danger text-brand-danger p-4 rounded-xl text-sm font-bold text-center glow">
              {errorMessage}
            </motion.div>
          )}

          <motion.button
            whileTap={{ scale: 0.96 }} onClick={() => navigate('/registration')}
            className="w-full glass-card border-l-4 border-l-brand-secondary p-6 flex items-center justify-between group hover:bg-[rgba(33,150,243,0.05)] transition-colors"
          >
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 rounded-full bg-[rgba(0,188,212,0.1)] flex items-center justify-center text-brand-secondary group-hover:scale-110 transition-transform">
                <UserPlus size={28} />
              </div>
              <span className="text-2xl font-bold text-text-primary">{t('landing.getStarted')}</span>
            </div>
            <ChevronRight className="text-text-muted group-hover:text-brand-secondary transition-colors" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.96 }} onClick={() => setShowScanner(true)}
            className="w-full glass-card border-l-4 border-l-brand-primary p-6 flex items-center justify-between group hover:bg-[rgba(33,150,243,0.05)] transition-colors"
          >
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 rounded-full bg-[rgba(33,150,243,0.1)] flex items-center justify-center text-brand-primary group-hover:scale-110 transition-transform">
                <QrCode size={28} />
              </div>
              <span className="text-2xl font-bold text-text-primary">{t('landing.returningPatient')}</span>
            </div>
            <ChevronRight className="text-text-muted group-hover:text-brand-primary transition-colors" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.96 }} onClick={handleFirstAid}
            className="w-full glass-card border-l-4 border-l-brand-danger p-6 flex items-center justify-between group hover:bg-[rgba(255,82,82,0.05)] transition-colors"
          >
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 rounded-full bg-[rgba(255,82,82,0.1)] flex items-center justify-center text-brand-danger group-hover:scale-110 transition-transform">
                <Activity size={28} />
              </div>
              <span className="text-2xl font-bold text-brand-danger uppercase tracking-wider">{t('landing.dispenseFirstAid')}</span>
            </div>
            <ChevronRight className="text-text-muted group-hover:text-brand-danger transition-colors" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.96 }} onClick={handleAdminAccess}
            className="w-full glass-card border-l-4 border-l-text-muted p-6 flex items-center justify-between group hover:bg-[rgba(255,255,255,0.05)] transition-colors mt-4 opacity-70 hover:opacity-100"
          >
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center text-text-muted group-hover:text-text-primary transition-colors">
                <ShieldCheck size={28} />
              </div>
              <span className="text-xl font-bold text-text-secondary">{t('landing.adminAccess')}</span>
            </div>
            <ChevronRight className="text-text-muted group-hover:text-primary transition-colors" />
          </motion.button>
        </div>
      </div>

      {/* UNIFIED QR SCANNER HUB */}
      <AnimatePresence>
        {showScanner && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-brand-navy/95 backdrop-blur-xl z-[100] flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-4xl glass-card relative overflow-hidden flex flex-col md:flex-row"
            >
              {/* Left Side: Scanner Area */}
              <div 
                className={`flex-1 p-8 relative transition-all duration-300 ${isDragging ? 'bg-brand-primary/10' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-brand-primary/10 text-brand-primary">
                      <Camera size={24} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">QR Scanner Hub</h2>
                      <p className="text-xs text-text-muted uppercase tracking-widest font-bold">Live Scan or Drop File</p>
                    </div>
                  </div>
                  
                  {/* Camera Switcher */}
                  {cameras.length > 1 && (
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={toggleCamera}
                      className="p-3 rounded-xl bg-white/5 border border-white/10 text-brand-secondary hover:bg-brand-secondary/10 hover:border-brand-secondary transition-all flex items-center gap-2"
                    >
                      <RefreshCw size={20} />
                      <span className="text-xs font-black uppercase tracking-widest">Switch</span>
                    </motion.button>
                  )}
                </div>

                <div className="relative group">
                  <div 
                    id="qr-reader" 
                    className="w-full aspect-square md:aspect-video rounded-3xl overflow-hidden border-2 border-white/5 bg-brand-card shadow-inner"
                  >
                    {/* Html5Qrcode will inject video here. */}
                  </div>

                  {/* Overlays */}
                  <AnimatePresence>
                    {isCameraLoading && (
                      <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 flex flex-col items-center justify-center text-brand-secondary z-20 bg-brand-navy/50 backdrop-blur-sm rounded-3xl"
                      >
                        <Activity size={48} className="animate-spin mb-4" />
                        <p className="font-black uppercase tracking-widest text-sm">Accessing Camera...</p>
                      </motion.div>
                    )}
                    
                    {cameraError && (
                      <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 flex flex-col items-center justify-center text-brand-danger z-20 bg-brand-navy/80 backdrop-blur-sm p-8 text-center rounded-3xl"
                      >
                        <AlertCircle size={48} className="mb-4" />
                        <p className="font-bold text-lg mb-2">Camera Error</p>
                        <p className="text-sm opacity-70 mb-6">{cameraError}</p>
                        <button 
                          onClick={initCamera}
                          className="px-6 py-2 bg-brand-danger/20 border border-brand-danger/30 rounded-full text-xs font-black uppercase tracking-widest hover:bg-brand-danger/30"
                        >
                          Retry Permission
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="absolute inset-0 flex flex-col items-center justify-center text-text-muted pointer-events-none opacity-20 -z-10">
                    <QrCode size={64} strokeWidth={1} />
                    <p className="mt-4 font-medium">Camera Feed Area</p>
                  </div>

                  <div className="absolute top-4 left-4 w-10 h-10 border-t-4 border-l-4 border-brand-primary rounded-tl-2xl pointer-events-none" />
                  <div className="absolute top-4 right-4 w-10 h-10 border-t-4 border-r-4 border-brand-primary rounded-tr-2xl pointer-events-none" />
                  <div className="absolute bottom-4 left-4 w-10 h-10 border-b-4 border-l-4 border-brand-primary rounded-bl-2xl pointer-events-none" />
                  <div className="absolute bottom-4 right-4 w-10 h-10 border-b-4 border-r-4 border-brand-primary rounded-br-2xl pointer-events-none" />

                  {!cameraError && !isCameraLoading && (
                    <motion.div 
                      animate={{ top: ['10%', '90%', '10%'] }} transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                      className="absolute left-4 right-4 h-0.5 bg-brand-secondary shadow-[0_0_15px_var(--color-brand-secondary)] z-10 pointer-events-none opacity-50"
                    />
                  )}

                  <AnimatePresence>
                    {isDragging && (
                      <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-brand-primary/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center text-white border-4 border-dashed border-white/30 rounded-3xl"
                      >
                        <Upload size={64} className="mb-4 animate-bounce" />
                        <h3 className="text-2xl font-black">Drop to Scan</h3>
                        <p className="font-bold opacity-80 uppercase tracking-widest text-sm mt-2">Instant Login Retrieval</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="mt-6 flex items-center justify-between text-text-muted text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <Smartphone size={16} />
                    <span>Point camera at your QR code</span>
                  </div>
                  <div className="h-px flex-1 mx-6 bg-white/5" />
                  <span>OR</span>
                  <div className="h-px flex-1 mx-6 bg-white/5" />
                  <div className="flex items-center gap-2">
                    <ImageIcon size={16} />
                    <span>Drag & Drop image anywhere</span>
                  </div>
                </div>
              </div>

              {/* Right Side: Alternative Options */}
              <div className="w-full md:w-80 bg-white/5 border-l border-white/5 p-8 flex flex-col gap-6">
                <button 
                  onClick={() => setShowScanner(false)}
                  className="absolute top-6 right-6 w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-brand-danger/20 hover:text-brand-danger transition-all z-30"
                >
                  <X size={20} />
                </button>

                <div className="flex-1 flex flex-col gap-4">
                  <h3 className="text-sm font-black text-text-muted uppercase tracking-[0.2em] mb-2">Other Methods</h3>
                  
                  <input 
                    type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleFileUpload}
                  />
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-6 glass-card border border-brand-primary/20 hover:border-brand-primary transition-all flex flex-col items-center gap-3 group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Upload size={24} />
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-white">Upload File</p>
                      <p className="text-[10px] text-text-muted uppercase tracking-widest font-black">Browse Storage</p>
                    </div>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowScanner(false);
                      setShowLoginModal(true);
                    }}
                    className="w-full p-6 glass-card border border-white/5 hover:border-white/20 transition-all flex flex-col items-center gap-3 group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-white/5 text-text-muted flex items-center justify-center group-hover:text-white transition-colors">
                      <MailIcon size={24} />
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-white">Email Login</p>
                      <p className="text-[10px] text-text-muted uppercase tracking-widest font-black">Use Credentials</p>
                    </div>
                  </motion.button>
                </div>

                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                  <p className="text-[10px] text-amber-500 font-black uppercase tracking-widest mb-1 flex items-center gap-2">
                    <Activity size={12} strokeWidth={3} /> Security Tip
                  </p>
                  <p className="text-[11px] text-amber-200/60 leading-relaxed font-medium">
                    Keep your HEALER QR code private. It contains your secure session identifier.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EMAIL LOGIN MODAL */}
      <AnimatePresence>
        {showLoginModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-brand-navy/95 backdrop-blur-xl z-[100] flex items-center justify-center p-12"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="glass-card w-full max-w-xl p-12 relative"
            >
              <button 
                onClick={() => setShowLoginModal(false)}
                className="absolute top-6 right-6 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center hover:bg-brand-danger/20 hover:text-brand-danger transition-colors z-10"
              >
                <X size={24} />
              </button>

              <h2 className="text-3xl font-black text-white mb-8">{t('landing.returningPatient')}</h2>

              {errorMessage && (
                <div className="bg-brand-danger/10 border border-brand-danger text-brand-danger p-4 rounded-xl text-sm font-bold mb-6">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleEmailLogin} className="flex flex-col gap-6">
                <div className="flex flex-col gap-3">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">{t('landing.loginEmail')}</label>
                  <input 
                    type="email" required value={loginForm.email}
                    onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                    className="h-14 px-6 bg-brand-navy rounded-xl border border-white/10 text-white focus:outline-none focus:border-brand-primary transition-all"
                  />
                </div>
                <div className="flex flex-col gap-3 text-left">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">{t('landing.loginPassword')}</label>
                  <input 
                    type="password" required value={loginForm.password}
                    onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                    className="h-14 px-6 bg-brand-navy rounded-xl border border-white/10 text-white focus:outline-none focus:border-brand-primary transition-all"
                  />
                </div>

                <motion.button
                  whileTap={{ scale: 0.98 }} type="submit" disabled={isLoggingIn}
                  className="w-full h-16 bg-brand-primary text-white rounded-xl text-xl font-black shadow-[0_8px_24px_rgba(33,150,243,0.3)] mt-2 flex items-center justify-center gap-3"
                >
                  {isLoggingIn ? "Logging in..." : t('landing.loginBtn')}
                  {!isLoggingIn && <ChevronRight size={20} />}
                </motion.button>
              </form>

              <div className="mt-8 pt-8 border-t border-white/10 text-center">
                <button 
                  onClick={() => {
                    setShowLoginModal(false);
                    setShowScanner(true);
                  }}
                  className="text-brand-secondary font-bold flex items-center gap-2 mx-auto hover:underline"
                >
                  <QrCode size={20} />
                  {t('landing.loginScan')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
