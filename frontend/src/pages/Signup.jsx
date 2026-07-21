import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { GOOGLE_CLIENT_ID } from '../config';
import { User as UserIcon, Mail, Lock, Loader, ArrowRight, UserPlus, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Signup({ onToggleView }) {
  const { signup, loginWithGoogle, error, setError } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState('Patient');
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Password strength logic
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: 'Empty', color: 'bg-slate-800' };

    let score = 0;
    if (pass.length >= 6) score++;
    if (pass.length >= 10) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++; // Special char

    if (score <= 1) return { score, label: 'Weak 🔴', color: 'bg-rose-500 w-1/3' };
    if (score <= 3) return { score, label: 'Moderate 🟡', color: 'bg-amber-500 w-2/3' };
    return { score, label: 'Strong 🔥', color: 'bg-teal-500 w-full' };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    setError(null);

    if (!name || !email || !password || !confirmPassword) return;

    if (password !== confirmPassword) {
      setValidationError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setValidationError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      await signup(name, email, password, role);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadGoogleSDK = () => {
    return new Promise((resolve) => {
      if (window.google && window.google.accounts) {
        return resolve(true);
      }
      const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(true), { once: true });
        existingScript.addEventListener('error', () => resolve(false), { once: true });
        setTimeout(() => resolve(!!(window.google && window.google.accounts)), 3000);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });
  };

  const handleGoogleClick = async () => {
    setError(null);
    setErrorMessage('');

    const isLoaded = await loadGoogleSDK();

    if (!isLoaded || !window.google || !window.google.accounts) {
      setErrorMessage('Google Sign-In SDK is blocked or not loaded yet. If you have an ad-blocker or privacy extension active, please disable it for this site and try again.');
      setShowConfigModal(true);
      return;
    }

    if (!GOOGLE_CLIENT_ID) {
      setErrorMessage('Google Client ID is not configured. Follow the steps below to configure it in your environment:');
      setShowConfigModal(true);
      return;
    }

    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'email profile',
        callback: async (response) => {
          if (response.error) {
            console.error('Google client returned error:', response.error);
            setError(`Google auth error: ${response.error_description || response.error}`);
            return;
          }

          if (response.access_token) {
            setLoading(true);
            try {
              const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${response.access_token}` }
              });
              const profile = await userInfoRes.json();
              if (profile.error) {
                throw new Error(profile.error_description || 'Failed to fetch profile info');
              }

              await loginWithGoogle({
                name: profile.name,
                email: profile.email,
                googleId: `google_${profile.sub}`
              });
            } catch (err) {
              console.error(err);
              setError(err.message || 'Failed to get profile information from Google.');
            } finally {
              setLoading(false);
            }
          }
        }
      });
      client.requestAccessToken();
    } catch (err) {
      console.error('Failed to initialize Google client:', err);
      setError('An error occurred while launching Google Sign-in.');
    }
  };

  // Framer Motion Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.3 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      className="flex items-center justify-center px-4 pt-24 pb-6 bg-[#FAFCFD] relative overflow-hidden h-screen z-10"
    >
      {/* Background blurs (matching redesigned style guide) */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        variants={containerVariants}
        className="bg-white border border-slate-100/80 p-8 sm:p-10 rounded-[2rem] w-full max-w-[440px] relative z-10 space-y-5 shadow-[0_20px_50px_rgba(15,47,87,0.06)]"
      >
        <motion.div variants={itemVariants} className="text-center space-y-3 flex flex-col items-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#0B53FA]/5 border border-[#0B53FA]/10 rounded-2xl mb-1 shadow-sm">
            <UserPlus className="w-8 h-8 text-[#0B53FA] fill-[#0B53FA]/10 stroke-[2]" />
          </div>
          <h2 className="text-[28px] font-black text-[#0F2F57] tracking-tight leading-none">Create Account</h2>
          <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-xs">
            Join HealthStock Intelligence Platform
          </p>
        </motion.div>

        <AnimatePresence>
          {(validationError || error) && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              className="bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold px-4 py-3 rounded-xl shadow-sm"
            >
              {validationError || error}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.form variants={containerVariants} onSubmit={handleSubmit} className="space-y-4 text-left">
          
          {/* Full Name */}
          <motion.div variants={itemVariants} className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Full Name</label>
            <div className="relative flex items-center bg-white border border-slate-200 hover:border-slate-300 focus-within:border-[#0B53FA] focus-within:ring-4 focus-within:ring-[#0B53FA]/10 rounded-xl px-4 py-3 transition-all duration-200 group shadow-sm">
              <UserIcon className="w-4.5 h-4.5 text-slate-400 shrink-0 mr-3 group-focus-within:text-[#0B53FA] transition-colors" />
              <input
                type="text"
                required
                placeholder="John Doe"
                value={name}
                onChange={e => setName(e.target.value)}
                className="bg-transparent border-none text-sm text-slate-800 placeholder:text-slate-400 w-full focus:outline-none font-medium"
              />
            </div>
          </motion.div>

          {/* Email Address */}
          <motion.div variants={itemVariants} className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Email Address</label>
            <div className="relative flex items-center bg-white border border-slate-200 hover:border-slate-300 focus-within:border-[#0B53FA] focus-within:ring-4 focus-within:ring-[#0B53FA]/10 rounded-xl px-4 py-3 transition-all duration-200 group shadow-sm">
              <Mail className="w-4.5 h-4.5 text-slate-400 shrink-0 mr-3 group-focus-within:text-[#0B53FA] transition-colors" />
              <input
                type="email"
                required
                placeholder="john@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="bg-transparent border-none text-sm text-slate-800 placeholder:text-slate-400 w-full focus:outline-none font-medium"
              />
            </div>
          </motion.div>

          {/* Password */}
          <motion.div variants={itemVariants} className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Password</label>
            <div className="relative flex items-center bg-white border border-slate-200 hover:border-slate-300 focus-within:border-[#0B53FA] focus-within:ring-4 focus-within:ring-[#0B53FA]/10 rounded-xl px-4 py-3 transition-all duration-200 group shadow-sm">
              <Lock className="w-4.5 h-4.5 text-slate-400 shrink-0 mr-3 group-focus-within:text-[#0B53FA] transition-colors" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="At least 6 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className={`bg-transparent border-none text-sm text-slate-800 placeholder:text-slate-400 w-full focus:outline-none font-medium ${!showPassword ? 'tracking-widest' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 hover:text-[#0B53FA] focus:outline-none ml-2 shrink-0 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
            </div>

            {password && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-1.5 pt-1 overflow-hidden"
              >
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                  <span>Password Strength:</span>
                  <span className="text-slate-700">{strength.label}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200">
                  <div className={`h-full rounded-full transition-all duration-500 ${strength.color}`} />
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Confirm Password */}
          <motion.div variants={itemVariants} className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Confirm Password</label>
            <div className="relative flex items-center bg-white border border-slate-200 hover:border-slate-300 focus-within:border-[#0B53FA] focus-within:ring-4 focus-within:ring-[#0B53FA]/10 rounded-xl px-4 py-3 transition-all duration-200 group shadow-sm">
              <Lock className="w-4.5 h-4.5 text-slate-400 shrink-0 mr-3 group-focus-within:text-[#0B53FA] transition-colors" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className={`bg-transparent border-none text-sm text-slate-800 placeholder:text-slate-400 w-full focus:outline-none font-medium ${!showConfirmPassword ? 'tracking-widest' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="text-slate-400 hover:text-[#0B53FA] focus:outline-none ml-2 shrink-0 cursor-pointer"
              >
                {showConfirmPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
            </div>
          </motion.div>

          {/* Submit Button */}
          <motion.button
            variants={itemVariants}
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{ color: '#ffffff' }}
            className="w-full py-3.5 mt-2 bg-[#0B53FA] hover:bg-[#0944CD] text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-[#0B53FA]/20 cursor-pointer disabled:bg-slate-100 disabled:text-slate-400"
          >
            {loading ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowRight className="w-4.5 h-4.5 stroke-[2.5]" />
            )}
            <span>{loading ? 'Registering...' : 'Complete Sign Up'}</span>
          </motion.button>
        </motion.form>

        {/* Separator */}
        <motion.div variants={itemVariants} className="relative flex items-center py-1">
          <div className="flex-grow border-t border-slate-100"></div>
          <span className="flex-shrink mx-4 text-slate-400 text-[10px] font-bold tracking-widest uppercase">or</span>
          <div className="flex-grow border-t border-slate-100"></div>
        </motion.div>

        {/* Google OAuth Button */}
        <motion.button
          variants={itemVariants}
          type="button"
          onClick={handleGoogleClick}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="w-full py-3.5 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-[#0F2F57] text-sm font-bold rounded-xl flex items-center justify-center gap-3 transition-all cursor-pointer shadow-sm"
        >
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
          </svg>
          <span>Continue with Google</span>
        </motion.button>

        {/* Footer Account Prompt */}
        <motion.div variants={itemVariants} className="text-center text-xs font-semibold text-slate-500">
          <span>Already have an account?</span>{' '}
          <button onClick={onToggleView} className="text-[#0B53FA] hover:text-[#0944CD] font-bold transition-colors cursor-pointer ml-1">
            Sign In Instead
          </button>
        </motion.div>
      </motion.div>

      {/* Google Config Modal */}
      {showConfigModal && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md"
        >
          <div className="absolute inset-0 cursor-pointer" onClick={() => setShowConfigModal(false)} />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-white p-8 rounded-3xl border border-slate-100 w-full max-w-md relative z-10 shadow-2xl text-left space-y-6"
          >
            <div className="text-center space-y-3">
              <div className="inline-flex w-12 h-12 rounded-xl bg-slate-50 items-center justify-center text-2xl">⚙️</div>
              <h3 className="text-xl font-extrabold text-[#0F2F57]">Auth Configuration</h3>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-rose-600 font-bold bg-rose-50 p-3 rounded-xl border border-rose-100">
                {errorMessage}
              </p>

              {!GOOGLE_CLIENT_ID && (
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-3 text-xs text-slate-600">
                  <p className="font-bold text-[#0B53FA]">Setup Instructions:</p>
                  <ol className="list-decimal list-inside space-y-2 leading-relaxed">
                    <li>Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-[#0B53FA] hover:underline">Google Cloud</a>.</li>
                    <li>Create <strong>OAuth Client ID</strong> for a Web Application.</li>
                    <li>Add <code className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-[#0B53FA]">http://localhost:3000</code> to origins.</li>
                    <li>Update your <code className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-[#0B53FA]">.env</code>:
                      <pre className="bg-slate-100 p-3 rounded-xl mt-2 text-[#0B53FA] font-mono text-[10px] overflow-x-auto border border-slate-200">VITE_GOOGLE_CLIENT_ID=your_client_id</pre>
                    </li>
                  </ol>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowConfigModal(false)}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-all cursor-pointer"
            >
              I Understand
            </button>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}
