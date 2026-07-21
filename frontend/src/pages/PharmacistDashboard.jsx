import React, { useState, useEffect } from 'react';
import { Package, Check, RefreshCw, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PharmacistDashboard() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/data/pharmacy-requests', {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) setRequests(data.requests);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fulfillRequest = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/data/pharmacy-requests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Fulfilled' }),
        credentials: 'include'
      });
      if (res.ok) {
        setRequests(prev => prev.map(req => req._id === id ? { ...req, status: 'Fulfilled' } : req));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex-1 w-full max-w-5xl mx-auto px-4 py-8 relative z-10"
    >
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-teal-500/10 border border-teal-500/30 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(20,184,166,0.15)]">
            <Package className="w-6 h-6 text-teal-400" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Pharmacist Dashboard</h1>
            <p className="text-xs text-slate-400 font-medium">Manage and fulfill patient prescription requests</p>
          </div>
        </div>
        <button
          onClick={loadRequests}
          disabled={loading}
          className="p-2 sm:px-4 sm:py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md group disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
          <span className="hidden sm:inline text-xs font-bold">Refresh</span>
        </button>
      </div>

      <div className="glass-panel border border-slate-800 rounded-[2rem] p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-400 text-sm font-medium animate-pulse">Syncing requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">All Caught Up!</h3>
            <p className="text-slate-400 text-sm">No pending pharmacy requests at this time.</p>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4 relative z-10"
          >
            <AnimatePresence>
              {requests.map(req => (
                <motion.div
                  key={req._id}
                  variants={itemVariants}
                  layout
                  className={`bg-slate-900/60 border ${req.status === 'Pending' ? 'border-amber-500/20 hover:border-amber-500/40' : 'border-slate-800 hover:border-slate-700'} p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all shadow-md group`}
                >
                  <div className="flex gap-4 items-start">
                    <div className={`mt-1 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${req.status === 'Pending' ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-teal-500/10 border border-teal-500/20'}`}>
                      {req.status === 'Pending' ? <AlertCircle className="w-5 h-5 text-amber-400" /> : <Check className="w-5 h-5 text-teal-400" />}
                    </div>
                    <div>
                      <h3 className="text-white font-extrabold text-lg">{req.medicineName}</h3>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs font-medium">
                        <span className="text-slate-400 flex items-center gap-1">👤 Patient ID: <span className="text-slate-300 font-mono">{req.userId.slice(-6)}</span></span>
                        <span className="w-1 h-1 bg-slate-700 rounded-full hidden sm:block"></span>
                        <span className="text-slate-400 flex items-center gap-1">🕒 {new Date(req.requestedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                      </div>
                      <div className="mt-2 inline-flex">
                        <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-md border ${req.status === 'Pending' ? 'bg-amber-950/30 text-amber-400 border-amber-500/20' : 'bg-teal-950/30 text-teal-400 border-teal-500/20'}`}>
                          {req.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {req.status === 'Pending' && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => fulfillRequest(req._id)}
                      className="w-full sm:w-auto px-5 py-3 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(20,184,166,0.2)] cursor-pointer"
                    >
                      <Check className="w-4 h-4" /> Fulfill Request
                    </motion.button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
