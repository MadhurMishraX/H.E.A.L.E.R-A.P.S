import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, X, ChevronRight } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

// ── Bilingual help content ────────────────────────────────────────────────────
type StepHelp = { action: string; desc: string };
type PageHelp = { title: string; icon: string; image?: string; steps: StepHelp[] };
type LangContent = Record<string, PageHelp>;
type HelpMap = { en: LangContent; hi: LangContent };

const helpContent: HelpMap = {
  en: {
    '/': {
      title: 'Welcome Screen',
      icon: '🏥',
      image: '/help-images/welcome-EN.png',
      steps: [
        { action: 'Choose Language', desc: 'Tap English or Hindi toggle (top right).' },
        { action: 'New Patient', desc: 'Tap "Get Started" to register.' },
        { action: 'Returning Patient', desc: 'Tap to scan your QR code.' },
        { action: 'Emergency', desc: 'Tap "Dispense First Aid" for immediate help.' },
        { action: 'Connect Hardware', desc: 'Tap the status indicator (top right).' },
      ],
    },
    '/registration': {
      title: 'Registration',
      icon: '📋',
      image: '/help-images/registration-EN.png',
      steps: [
        { action: 'Enter Name', desc: 'Type your full name.' },
        { action: 'Enter Age', desc: 'Must be between 1 and 120.' },
        { action: 'Select Gender', desc: 'Tap Male, Female, or Other.' },
        { action: 'Enter Username', desc: 'Type username (@gmail.com is auto-added).' },
        { action: 'Set Password', desc: 'Min 4 characters. Confirm in next field.' },
        { action: 'Register', desc: 'Tap "Register & Begin" to get QR code.' },
      ],
    },
    '/diagnosis': {
      title: 'Diagnosis',
      icon: '🩺',
      image: '/help-images/diagnosis-EN.png',
      steps: [
        { action: 'Read Carefully', desc: 'Review each question.' },
        { action: 'Select Symptom', desc: 'Tap the best matching option.' },
        { action: 'Camera Analysis', desc: 'Open camera if prompted for visual check.' },
        { action: 'Wait for AI', desc: 'System will cross-reference medical database.' },
      ],
    },
    '/prescription': {
      title: 'Prescription',
      icon: '💊',
      image: '/help-images/prescription-EN.png',
      steps: [
        { action: 'Review Diagnosis', desc: 'Check result and confidence level.' },
        { action: 'Check Medicines', desc: 'Review prescribed medicines list.' },
        { action: 'Dispense', desc: 'Tap "Dispense" to collect from machine.' },
        { action: 'Send Report', desc: 'Tap to email your diagnosis report.' },
      ],
    },
    '/dispensing': {
      title: 'Dispensing',
      icon: '📦',
      steps: [
        { action: 'Wait', desc: 'Compartment will open automatically.' },
        { action: 'Collect Medicine', desc: 'Take medicine from the open compartment.' },
        { action: 'Do Not Force', desc: 'Let tray open/close on its own.' },
        { action: 'Need Time?', desc: 'Tap "+10 Seconds" for more time.' },
      ],
    },
    '/dashboard': {
      title: 'Patient Dashboard',
      icon: '📊',
      image: '/help-images/patient_dashboard-EN.png',
      steps: [
        { action: 'View History', desc: 'See your visits listed by date.' },
        { action: 'View Details', desc: 'Tap a visit card for full info.' },
        { action: 'Email QR', desc: 'Send patient QR to your email.' },
        { action: 'New Session', desc: 'Tap "Start New Diagnosis".' },
      ],
    },
    '/admin': {
      title: 'Admin Login',
      icon: '🔐',
      steps: [
        { action: 'Tap RFID', desc: 'Place admin card on the reader.' },
        { action: 'Enter PIN', desc: 'Type 4-digit PIN using keypad.' },
        { action: 'Lockout', desc: '3 failed attempts = 30s lock.' },
      ],
    },
    '/admin/dashboard': {
      title: 'Admin Dashboard',
      icon: '⚙️',
      steps: [
        { action: 'Switch Tabs', desc: 'Use top bar to navigate sections.' },
        { action: 'Update Stock', desc: 'Update compartment medicine quantities.' },
        { action: 'View Patients', desc: 'See all registered patients.' },
        { action: 'Settings', desc: 'Configure clinic info and more.' },
      ],
    },
  },

  hi: {
    '/': {
      title: 'स्वागत स्क्रीन',
      icon: '🏥',
      image: '/help-images/welcome-HI.png',
      steps: [
        { action: 'भाषा चुनें', desc: 'English या हिंदी टॉगल पर टैप करें।' },
        { action: 'नए मरीज़', desc: 'पंजीकरण के लिए "शुरू करें" पर टैप करें।' },
        { action: 'पुराने मरीज़', desc: 'QR कोड स्कैन करने के लिए टैप करें।' },
        { action: 'आपातकाल', desc: 'तत्काल मदद के लिए "प्राथमिक चिकित्सा निकालें"।' },
        { action: 'हार्डवेयर जोड़ें', desc: 'ऊपर-दाईं ओर स्थिति पर टैप करें।' },
      ],
    },
    '/registration': {
      title: 'नया पंजीकरण',
      icon: '📋',
      image: '/help-images/registration-HI.png',
      steps: [
        { action: 'नाम दर्ज करें', desc: 'अपना पूरा नाम टाइप करें।' },
        { action: 'उम्र दर्ज करें', desc: '1 से 120 के बीच होनी चाहिए।' },
        { action: 'लिंग चुनें', desc: 'पुरुष, महिला या अन्य पर टैप करें।' },
        { action: 'यूज़रनेम दर्ज करें', desc: 'टाइप करें (@gmail.com अपने आप जुड़ेगा)।' },
        { action: 'पासवर्ड सेट करें', desc: 'न्यूनतम 4 अक्षर। अगले फ़ील्ड में पुष्टि करें।' },
        { action: 'पंजीकरण करें', desc: 'QR कोड पाने के लिए टैप करें।' },
      ],
    },
    '/diagnosis': {
      title: 'लक्षण निदान',
      icon: '🩺',
      image: '/help-images/diagnosis-HI.png',
      steps: [
        { action: 'ध्यान से पढ़ें', desc: 'प्रत्येक प्रश्न की समीक्षा करें।' },
        { action: 'लक्षण चुनें', desc: 'सबसे उपयुक्त विकल्प पर टैप करें।' },
        { action: 'कैमरा विश्लेषण', desc: 'कहा जाए तो दृश्य जांच के लिए कैमरा खोलें।' },
        { action: 'AI का इंतज़ार करें', desc: 'सिस्टम मेडिकल डेटाबेस की जांच करेगा।' },
      ],
    },
    '/prescription': {
      title: 'निदान और नुस्खा',
      icon: '💊',
      image: '/help-images/prescription-HI.png',
      steps: [
        { action: 'निदान जांचें', desc: 'परिणाम और विश्वास स्तर देखें।' },
        { action: 'दवाएं जांचें', desc: 'निर्धारित दवाओं की सूची देखें।' },
        { action: 'दवा निकालें', desc: 'मशीन से लेने के लिए "दवा निकालें" पर टैप करें।' },
        { action: 'रिपोर्ट भेजें', desc: 'अपनी निदान रिपोर्ट ईमेल करने के लिए टैप करें।' },
      ],
    },
    '/dispensing': {
      title: 'दवा वितरण',
      icon: '📦',
      steps: [
        { action: 'प्रतीक्षा करें', desc: 'कम्पार्टमेंट अपने आप खुलेगा।' },
        { action: 'दवा लें', desc: 'खुले कम्पार्टमेंट से दवा लें।' },
        { action: 'जबरदस्ती न करें', desc: 'ट्रे को अपने आप खुलने/बंद होने दें।' },
        { action: 'अधिक समय?', desc: 'अधिक समय के लिए "+10 सेकंड" पर टैप करें।' },
      ],
    },
    '/dashboard': {
      title: 'मरीज़ डैशबोर्ड',
      icon: '📊',
      image: '/help-images/patient_dashboard-HI.png',
      steps: [
        { action: 'इतिहास देखें', desc: 'तारीख के अनुसार अपनी विज़िट देखें।' },
        { action: 'विवरण देखें', desc: 'पूरी जानकारी के लिए कार्ड पर टैप करें।' },
        { action: 'QR ईमेल करें', desc: 'अपना मरीज़ QR ईमेल पर भेजें।' },
        { action: 'नया सत्र', desc: '"नया निदान शुरू करें" पर टैप करें।' },
      ],
    },
    '/admin': {
      title: 'एडमिन लॉगिन',
      icon: '🔐',
      steps: [
        { action: 'RFID टैप करें', desc: 'रीडर पर एडमिन कार्ड रखें।' },
        { action: 'PIN दर्ज करें', desc: 'कीपैड से 4 अंकों का PIN टाइप करें।' },
        { action: 'लॉकआउट', desc: '3 गलत प्रयास = 30 सेकंड का लॉक।' },
      ],
    },
    '/admin/dashboard': {
      title: 'एडमिन डैशबोर्ड',
      icon: '⚙️',
      steps: [
        { action: 'टैब बदलें', desc: 'अनुभाग बदलने के लिए शीर्ष बार का उपयोग करें।' },
        { action: 'स्टॉक अपडेट', desc: 'कम्पार्टमेंट में दवा की मात्रा अपडेट करें।' },
        { action: 'मरीज़ देखें', desc: 'सभी पंजीकृत मरीज़ों को देखें।' },
        { action: 'सेटिंग्स', desc: 'क्लिनिक की जानकारी आदि कॉन्फ़िगर करें।' },
      ],
    },
  },
};

// ── Component ─────────────────────────────────────────────────────────────────
export const HelpAssistant: React.FC = () => {
  const location = useLocation();
  const { language, setLanguage } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const [hasBeenSeen, setHasBeenSeen] = useState(false);
  const [isImageExpanded, setIsImageExpanded] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const expandedRef = useRef<HTMLDivElement>(null);

  const lang = language === 'hi' ? 'hi' : 'en';
  const isHindi = lang === 'hi';

  const page: PageHelp = helpContent[lang][location.pathname] ?? {
    title: isHindi ? 'सहायता' : 'Help',
    icon: '❓',
    steps: [
      { action: isHindi ? 'जानकारी' : 'Info', desc: isHindi ? 'इस पृष्ठ के लिए कोई विशिष्ट सहायता उपलब्ध नहीं है।' : 'No specific help available for this page.' }
    ],
  };

  // Reset on route change
  useEffect(() => {
    setIsOpen(false);
    setHasBeenSeen(false);
    setIsImageExpanded(false);
  }, [location.pathname]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      const isOutsidePanel = panelRef.current && !panelRef.current.contains(target);
      const isOutsideExpanded = expandedRef.current && !expandedRef.current.contains(target);
      
      // If image is expanded, only close if click is outside both
      if (isImageExpanded) {
        if (isOutsidePanel && isOutsideExpanded) {
          setIsOpen(false);
        }
      } else {
        // If image not expanded, close if click is outside panel
        if (isOutsidePanel) {
          setIsOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen, isImageExpanded]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  const handleOpen = () => {
    setIsOpen(true);
    setHasBeenSeen(true);
  };

  return (
    <>
      {/* Expanded Image (Full Screen Lightbox) */}
      <AnimatePresence>
        {isOpen && isImageExpanded && page.image && (
          <motion.div
            ref={expandedRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed inset-0 z-[300] bg-black/45 flex flex-col items-center justify-center p-2 sm:p-4 lg:pr-[420px] backdrop-blur-sm"
            onClick={() => setIsImageExpanded(false)}
          >
            <div className="w-full max-w-[85vw] flex justify-end items-center gap-4 mb-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLanguage(language === 'en' ? 'hi' : 'en');
                }}
                className="h-12 px-5 rounded-full bg-white/10 hover:bg-brand-secondary/40 text-white font-bold transition-all shadow-xl backdrop-blur-md flex items-center gap-2 border border-white/10"
              >
                <span className="text-lg">A | अ</span>
                <span className="text-xs text-white/70 uppercase tracking-widest hidden sm:inline ml-1">
                  {language === 'en' ? 'Switch to Hindi' : 'Switch to English'}
                </span>
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setIsImageExpanded(false); }}
                className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-brand-danger/80 text-white transition-all shadow-xl border border-white/10"
              >
                <X size={24} />
              </button>
            </div>
            <img 
              src={page.image} 
              alt="Expanded Sample" 
              className="w-full max-w-[85vw] h-auto max-h-[85vh] object-contain drop-shadow-2xl" 
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-8 right-8 z-[400] flex flex-col items-end gap-3" ref={panelRef}>

      {/* Help Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="w-96 glass-card p-8 relative overflow-hidden flex flex-col max-h-[85vh]"
          >
            {/* Top gradient accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-secondary to-brand-primary" />

            {/* Header */}
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <div className="flex items-center gap-4">
                <span className="text-4xl">{page.icon}</span>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-secondary mb-1">
                    {isHindi ? 'उपयोग कैसे करें' : 'How to Use'}
                  </p>
                  <h3 className="text-xl font-black text-white leading-tight">
                    {page.title}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-brand-danger/20 hover:text-brand-danger transition-all text-text-muted"
              >
                <X size={20} />
              </button>
            </div>

            {/* Optional Sample Image */}
            {page.image && (
              <div 
                className="w-full h-32 overflow-hidden mb-5 flex-shrink-0 cursor-pointer relative group flex items-center justify-center"
                onClick={() => setIsImageExpanded(!isImageExpanded)}
              >
                <img src={page.image} alt="Sample" className="w-full h-full object-contain drop-shadow-md transition-transform duration-500 group-hover:scale-110" />
                
                {/* Language Toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setLanguage(language === 'en' ? 'hi' : 'en');
                  }}
                  className="absolute top-2 right-2 bg-black/60 hover:bg-brand-secondary/80 text-white px-2 py-1 rounded text-xs font-bold backdrop-blur-md transition-colors z-10 border border-white/20"
                >
                  A | अ
                </button>

                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <span className="text-white text-xs font-bold uppercase tracking-widest bg-black/60 px-3 py-1 rounded-full">
                    {isImageExpanded ? (isHindi ? 'बंद करें' : 'Close') : (isHindi ? 'बड़ा करें' : 'Expand')}
                  </span>
                </div>
              </div>
            )}

            {/* Steps (Scrollable if needed) */}
            <ol className="flex flex-col gap-5 overflow-y-auto pr-2 custom-scrollbar flex-grow pb-2">
              {page.steps.map((step, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-start gap-4"
                >
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-secondary/20 border border-brand-secondary/40 text-brand-secondary text-sm font-black flex items-center justify-center mt-1 shadow-inner">
                    {i + 1}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-base font-bold text-white mb-0.5">
                      {step.action}
                    </span>
                    <span className={`text-sm text-text-muted leading-relaxed ${isHindi ? 'font-medium' : ''}`}>
                      {step.desc}
                    </span>
                  </div>
                </motion.li>
              ))}
            </ol>

            {/* Footer hint */}
            <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2 text-text-muted text-xs font-bold uppercase tracking-widest flex-shrink-0">
              <ChevronRight size={14} />
              {isHindi ? 'बाहर क्लिक करें या Esc दबाएं' : 'Click outside or press Esc to close'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Help Button */}
      <button
        onClick={handleOpen}
        className="relative flex items-center gap-3 px-4 py-2 rounded-2xl glass-card border border-brand-secondary/40 text-brand-secondary shadow-[0_0_24px_rgba(0,188,212,0.3)] hover:shadow-[0_0_36px_rgba(0,188,212,0.5)] hover:bg-white/5 active:scale-95 transition-all"
        title={isHindi ? 'सहायता' : 'Help'}
      >
        <HelpCircle size={22} />
        <span className="text-base font-black uppercase tracking-normal">
          {isHindi ? 'सहायता' : 'Help'}
        </span>
      </button>
    </div>
    </>
  );
};
