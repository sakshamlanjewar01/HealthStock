import React, { useState } from 'react';
import { API_URL } from '../config';
import { Lock, Loader, ArrowRight, Shield, Eye, EyeOff, Check } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ResetPassword({ token, onComplete }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || !confirmPassword) return;

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          onComplete(); // redirect to login view
        }, 3000);
      } else {
        setError(data.message || 'Failed to reset password.');
      }
    } catch (err) {
      setError('A network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
      {/* Background blurs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        variants={containerVariants}
        className="bg-white border border-slate-100/80 p-8 sm:p-12 rounded-[2rem] w-full max-w-[440px] relative z-10 space-y-6 shadow-[0_16px_48px_rgba(15,47,87,0.04)]"
      >
        {success ? (
          <div className="text-center space-y-6 py-4">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-flex items-center justify-center w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-full text-emerald-500"
            >
              <Check className="w-8 h-8 stroke-[3]" />
            </motion.div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-[#0F2F57]">Password Updated</h2>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                Your password has been successfully updated. Redirecting you to login in a moment...
              </p>
            </div>
          </div>
        ) : (
          <>
            <motion.div variants={itemVariants} className="text-center space-y-3 flex flex-col items-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white border border-slate-100 rounded-2xl mb-1 shadow-md">
                <Shield className="w-8 h-8 text-[#4571A1] fill-[#4571A1]/10 stroke-[2]" />
              </div>
              <h2 className="text-[28px] font-black text-[#0F2F57] tracking-tight">New Password</h2>
              <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-xs">
                Set your new password below to regain access to your account.
              </p>
            </motion.div>

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold px-4 py-3 rounded-xl shadow-sm text-left"
              >
                {error}
              </motion.div>
            )}

            <motion.form variants={containerVariants} onSubmit={handleSubmit} className="space-y-5 text-left">
              {/* New Password */}
              <motion.div variants={itemVariants} className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">New Password</label>
                <div className="relative flex items-center bg-white border-2 border-black focus-within:border-[#4571A1] focus-within:ring-2 focus-within:ring-[#4571A1]/10 rounded-xl px-4 py-3 transition-all duration-200 group shadow-sm">
                  <Lock className="w-4.5 h-4.5 text-slate-400 shrink-0 mr-3 group-focus-within:text-[#4571A1] transition-colors" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="bg-transparent border-none text-sm text-slate-800 placeholder-slate-300 w-full focus:outline-none font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-[#4571A1] focus:outline-none ml-2 shrink-0 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </motion.div>

              {/* Confirm Password */}
              <motion.div variants={itemVariants} className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Confirm Password</label>
                <div className="relative flex items-center bg-white border-2 border-black focus-within:border-[#4571A1] focus-within:ring-2 focus-within:ring-[#4571A1]/10 rounded-xl px-4 py-3 transition-all duration-200 group shadow-sm">
                  <Lock className="w-4.5 h-4.5 text-slate-400 shrink-0 mr-3 group-focus-within:text-[#4571A1] transition-colors" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="bg-transparent border-none text-sm text-slate-800 placeholder-slate-300 w-full focus:outline-none font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-slate-400 hover:text-[#4571A1] focus:outline-none ml-2 shrink-0 cursor-pointer"
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
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                style={{ color: '#ffffff' }}
                className="w-full py-3.5 mt-2 bg-[#4571A1] hover:bg-[#395F8A] text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:bg-slate-100 disabled:text-slate-400"
              >
                {loading ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4.5 h-4.5 stroke-[2.5]" />
                )}
                <span>{loading ? 'Updating password...' : 'Update Password'}</span>
              </motion.button>
            </motion.form>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
