import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Calendar, 
  Check, 
  Mail as MailIcon, 
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react';
import QRCode from 'qrcode';
import { QRCodeDisplay } from '../utils/qrUtils';
import { sendQRCodeEmail } from '../services/emailService';
import { getAllSettings } from '../services/settingsService';
import { motion, AnimatePresence } from 'motion/react';
import { registerPatient, updatePatientQR } from '../services/dbService';

export const RegistrationScreen = () => {
  const { t, language, setCurrentPatient } = useAppContext();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    email: '',
    password: '',
    confirmPassword: '',
    language_preference: language
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showQRModal, setShowQRModal] = useState(false);
  const [registeredPatient, setRegisteredPatient] = useState<any>(null);
  const [emailStatus, setEmailStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [clinicName, setClinicName] = useState('');

  const fetchSettings = async () => {
    const settings = await getAllSettings();
    setClinicName(settings.clinic_name || 'HEALER');
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = t('registration.errorName');
    if (!formData.age) newErrors.age = t('registration.errorAge');
    if (!formData.gender) newErrors.gender = t('registration.errorGender');
    if (!formData.email) newErrors.email = t('registration.errorEmail');
    if (formData.password.length < 6) newErrors.password = t('registration.errorPassword');
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = t('registration.errorConfirmPassword');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const patientData = {
        name: formData.name,
        age: parseInt(formData.age),
        gender: formData.gender,
        email: formData.email,
        password: formData.password,
        language_preference: formData.language_preference,
        qr_code: `HEALER_TEMP_${Date.now()}` // Temporary QR code
      };

      const patientId = await registerPatient(patientData);
      
      if (patientId) {
        // Generate final QR code with real ID
        const finalQRCode = `HEALER_PATIENT_${patientId}`;
        await updatePatientQR(patientId, finalQRCode);
        
        const finalPatient = { ...patientData, id: patientId, qr_code: finalQRCode };
        setRegisteredPatient(finalPatient);
        setShowQRModal(true);
        
        // Auto-send email
        try {
          const qrDataUrl = await QRCode.toDataURL(finalQRCode);
          await sendQRCodeEmail(finalPatient, qrDataUrl);
        } catch (err) {
          console.error("Auto-email failed", err);
        }
      }
    } catch (err) {
      console.error("Registration failed", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailQR = async () => {
    if (!registeredPatient) return;
    setEmailStatus('idle');
    try {
      const qrDataUrl = await QRCode.toDataURL(registeredPatient.qr_code);
      await sendQRCodeEmail(registeredPatient, qrDataUrl);
      setEmailStatus('success');
      setTimeout(() => setEmailStatus('idle'), 3000);
    } catch (err) {
      console.error("Failed to email QR (silently caught)", err);
      setEmailStatus('error');
      setTimeout(() => setEmailStatus('idle'), 4000);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-brand-navy p-6 md:p-12 flex items-center justify-center font-sans"
    >
      <div className="w-full max-w-2xl bg-brand-card/50 backdrop-blur-xl rounded-[40px] border border-white/10 overflow-hidden shadow-2xl">
        <div className="p-8 md:p-12">
          <button 
            onClick={() => navigate('/')}
            className="mb-8 flex items-center gap-2 text-text-secondary hover:text-brand-primary transition-colors font-bold uppercase tracking-widest text-sm"
          >
            <ArrowLeft size={18} />
            {t('registration.backToHome')}
          </button>

          <div className="mb-10">
            <h1 className="text-4xl font-black text-white mb-3">
              {t('registration.title')}
            </h1>
            <p className="text-text-secondary text-lg">
              {t('registration.subtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-widest ml-1">{t('registration.name')}</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className={`w-full h-14 pl-12 pr-4 bg-brand-navy rounded-2xl border ${errors.name ? 'border-brand-danger' : 'border-white/10'} text-white focus:outline-none focus:border-brand-primary transition-all`}
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-widest ml-1">{t('registration.age')}</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({...formData, age: e.target.value})}
                  className={`w-full h-14 pl-12 pr-4 bg-brand-navy rounded-2xl border ${errors.age ? 'border-brand-danger' : 'border-white/10'} text-white focus:outline-none focus:border-brand-primary transition-all`}
                  placeholder="25"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-widest ml-1">{t('registration.gender')}</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({...formData, gender: e.target.value})}
                className={`w-full h-14 px-4 bg-brand-navy rounded-2xl border ${errors.gender ? 'border-brand-danger' : 'border-white/10'} text-white focus:outline-none focus:border-brand-primary transition-all appearance-none`}
              >
                <option value="">{t('registration.genderPlaceholder')}</option>
                <option value="Male">{t('registration.male')}</option>
                <option value="Female">{t('registration.female')}</option>
                <option value="Other">{t('registration.other')}</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-widest ml-1">{t('registration.email')}</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className={`w-full h-14 pl-12 pr-4 bg-brand-navy rounded-2xl border ${errors.email ? 'border-brand-danger' : 'border-white/10'} text-white focus:outline-none focus:border-brand-primary transition-all`}
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-widest ml-1">{t('registration.password')}</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className={`w-full h-14 px-6 bg-brand-navy rounded-2xl border ${errors.password ? 'border-brand-danger' : 'border-white/10'} text-white focus:outline-none focus:border-brand-primary transition-all`}
                placeholder="••••••••"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-widest ml-1">{t('registration.confirmPassword')}</label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                className={`w-full h-14 px-6 bg-brand-navy rounded-2xl border ${errors.confirmPassword ? 'border-brand-danger' : 'border-white/10'} text-white focus:outline-none focus:border-brand-primary transition-all`}
                placeholder="••••••••"
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isSubmitting}
              type="submit"
              className="md:col-span-2 h-16 bg-brand-primary text-white rounded-2xl text-xl font-black shadow-[0_8px_24px_rgba(33,150,243,0.3)] mt-4 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {t('registration.submit')}
                  <ArrowRight size={20} />
                </>
              )}
            </motion.button>
          </form>
        </div>
      </div>

      {/* QR CODE SUCCESS MODAL */}
      <AnimatePresence>
        {showQRModal && registeredPatient && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-brand-navy/95 backdrop-blur-xl z-50 flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-xl glass-card p-12 flex flex-col items-center relative"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-brand-success rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(76,175,80,0.4)]">
                <Check size={48} className="text-white" strokeWidth={4} />
              </div>

              <div className="mt-12 text-center">
                <h2 className="text-4xl font-black text-white mb-4">
                  {t('registration.success')}
                </h2>
                <p className="text-text-secondary text-lg mb-8">
                  {t('registration.successNote')}
                </p>
              </div>

              <div className="bg-white p-6 rounded-3xl mb-8 shadow-2xl">
                <QRCodeDisplay 
                  qrString={registeredPatient.qr_code} 
                  clinicName={clinicName}
                />
              </div>

              <div className="flex flex-col w-full gap-4">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleEmailQR}
                  className="w-full h-14 bg-brand-primary/10 border border-brand-primary/30 text-brand-primary rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-brand-primary/20 transition-all"
                >
                  <MailIcon size={20} />
                  {t('registration.sendEmailQR')}
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setCurrentPatient(registeredPatient);
                    navigate('/dashboard');
                  }}
                  className="w-full h-14 bg-brand-primary text-white rounded-xl font-black uppercase tracking-widest shadow-[0_4px_12px_rgba(33,150,243,0.3)]"
                >
                  {t('registration.continueDashboard')}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Email Status Feedback Modal */}
      <AnimatePresence>
        {emailStatus !== 'idle' && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className={`glass-card p-10 flex flex-col items-center text-center max-w-sm border-t-4 ${
                emailStatus === 'success' ? 'border-t-brand-success' : 'border-t-brand-danger'
              }`}
            >
              <button 
                onClick={() => setEmailStatus('idle')}
                className="absolute top-4 right-4 text-text-muted hover:text-white"
              >
                <X size={20} />
              </button>
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${
                emailStatus === 'success' ? 'bg-brand-success/10 text-brand-success' : 'bg-brand-danger/10 text-brand-danger'
              }`}>
                {emailStatus === 'success' ? <CheckCircle2 size={48} /> : <AlertCircle size={48} />}
              </div>
              <h3 className="text-2xl font-black text-white mb-2">
                {emailStatus === 'success' ? 'QR Code Sent!' : 'Dispatch Failed'}
              </h3>
              <p className="text-text-secondary font-medium">
                {emailStatus === 'success' 
                  ? 'Your personal HEALER ID QR code has been sent to your email address.' 
                  : 'We could not reach the email server. Please check your configuration.'}
              </p>
              <button 
                onClick={() => setEmailStatus('idle')}
                className="mt-8 px-8 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-black uppercase tracking-widest hover:bg-white/10"
              >
                Dismiss
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
