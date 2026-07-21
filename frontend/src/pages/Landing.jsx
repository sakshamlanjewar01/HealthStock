import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Calendar, Bell, PieChart, Package, Menu, X, Rocket, LayoutDashboard, ArrowRight, Shield, Home, Users, TrendingUp } from 'lucide-react';
import Logo from '../components/Logo';

export default function Landing({ onNavigate, setActiveModal }) {
  const containerRef = useRef(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Scroll Progress and Hero Transform
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  const navLinks = ['Home', 'Features', 'Benefits'];
  const [activeSection, setActiveSection] = useState('Home');

  useEffect(() => {
    const handleScroll = () => {
      const navHeight = 120;
      const sections = navLinks.map(link => link.toLowerCase().replace(/\s+/g, '-'));
      
      for (let i = sections.length - 1; i >= 0; i--) {
        const section = document.getElementById(sections[i]);
        if (section) {
          const rect = section.getBoundingClientRect();
          if (rect.top <= navHeight) {
            setActiveSection(navLinks[i]);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (e, link) => {
    e.preventDefault();
    setActiveSection(link);
    setMobileMenuOpen(false);
    const targetId = link.toLowerCase().replace(/\s+/g, '-');
    const element = document.getElementById(targetId);
    if (element) {
      const navHeight = 80;
      const offsetPosition = element.getBoundingClientRect().top + window.scrollY - navHeight;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    }
  };

  // Animation Variants
  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12
      }
    }
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { type: "spring", stiffness: 100, damping: 16 } 
    }
  };

  const arrowMotion = {
    rest: { x: 0 },
    hover: { x: 5, transition: { type: "spring", stiffness: 400, damping: 10 } }
  };

  const logoHover = {
    hover: { rotate: 90, transition: { duration: 0.3 } }
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-[#FAFCFD] text-[#0F2F57] font-sans overflow-x-hidden selection:bg-[#0B53FA]/10">

      {/* ═══════════ SCROLL PROGRESS BAR ═══════════ */}
      <motion.div 
        style={{ scaleX: scrollYProgress }} 
        className="fixed top-0 left-0 right-0 h-[3.5px] bg-[#0B53FA] origin-left z-[100]" 
      />

      {/* ═══════════ NAVBAR ═══════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 md:px-12 lg:px-20 bg-white/90 backdrop-blur-xl border-b border-slate-100 shadow-sm transition-all h-20">
        
        {/* Logo — HealthStock INTELLIGENCE */}
        <div 
          className="flex items-center gap-2.5 cursor-pointer shrink-0" 
          onClick={(e) => handleNavClick(e, 'Home')}
        >
          <div className="w-9 h-9 flex items-center justify-center shadow-sm rounded-lg">
            <Logo className="w-full h-full" />
          </div>
          <div className="flex flex-col leading-none text-left">
            <div className="text-[17px] font-extrabold tracking-tight leading-none">
              <span className="text-[#0F2F57]">Health</span>
              <span className="text-[#10B981]">stock</span>
            </div>
            <span className="text-[#95A6B7] text-[8px] font-bold tracking-[0.06em] uppercase mt-1">
              Track <span className="text-[#0B53FA]">•</span> Manage <span className="text-[#10B981]">•</span> Live Well
            </span>
          </div>
        </div>

        {/* Desktop Center Links */}
        <div className="hidden lg:flex items-center gap-10">
          {navLinks.map((link) => {
            const isActive = activeSection === link;
            return (
              <div key={link} className="relative flex flex-col items-center py-2">
                <a href={`#${link.toLowerCase()}`} onClick={(e) => handleNavClick(e, link)}
                  className={`text-[14px] font-bold transition-colors ${isActive ? 'text-[#0B53FA]' : 'text-[#4B6B8B] hover:text-[#0F2F57]'}`}>
                  {link}
                </a>
                {isActive && (
                  <motion.div 
                    layoutId="navbarActiveIndicator"
                    className="absolute bottom-[-14px] left-0 right-0 h-[3px] bg-[#0B53FA] rounded-full" 
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Desktop Right Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <motion.button 
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onNavigate('login')}
            className="px-5 py-2 border border-[#E2E8F0] text-[#0F2F57] bg-white hover:bg-slate-50 text-[13px] font-bold rounded-[8px] transition-all shadow-sm cursor-pointer"
          >
            Log in
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onNavigate('signup')}
            className="px-5 py-2 bg-[#0B53FA] hover:bg-[#0043D6] text-white text-[13px] font-bold rounded-[8px] shadow-sm transition-all cursor-pointer"
          >
            Get Started
          </motion.button>
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden w-9 h-9 bg-[#0B53FA] rounded-lg flex items-center justify-center cursor-pointer shadow-sm hover:bg-[#0043D6] transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen
            ? <X className="w-5 h-5 text-white" />
            : <Menu className="w-5 h-5 text-white" />}
        </button>
      </nav>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute top-[80px] left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-slate-100 px-5 py-4 flex flex-col gap-3 shadow-xl"
            onClick={(e) => e.stopPropagation()}>
            {navLinks.map((link) => (
              <a key={link} href={`#${link.toLowerCase()}`} onClick={(e) => handleNavClick(e, link)}
                className="py-2 text-sm font-bold text-[#4B6B8B] hover:text-[#0F2F57] transition-colors border-b border-slate-50 last:border-0">
                {link}
              </a>
            ))}
            <div className="flex gap-3 pt-2">
              <button onClick={() => { onNavigate('login'); setMobileMenuOpen(false); }}
                className="flex-1 py-2 border border-[#E2E8F0] text-[#0F2F57] bg-white text-sm font-bold rounded-[8px] cursor-pointer">
                Log in
              </button>
              <button onClick={() => { onNavigate('signup'); setMobileMenuOpen(false); }}
                className="flex-1 py-2 bg-[#0B53FA] hover:bg-[#0043D6] text-white text-sm font-bold rounded-[8px] cursor-pointer">
                Get Started
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ HERO SECTION ═══════════ */}
      <motion.section
        id="home"
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative z-10 pt-28 md:pt-36 lg:pt-44 pb-12 md:pb-24 px-6 md:px-12 lg:px-20 flex flex-col justify-center max-w-[1400px] mx-auto"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center relative">
          
          {/* Left Text */}
          <div className="space-y-4 md:space-y-6 relative z-20 text-left">
            <motion.p 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.6 }}
              className="text-[10px] md:text-[11px] font-extrabold text-[#0B53FA] uppercase tracking-widest"
            >
              Intelligent Health Tracking
            </motion.p>

            <div className="overflow-hidden">
              <motion.h1 
                initial={{ opacity: 0, y: 50 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.8, delay: 0.1, type: "spring", stiffness: 70 }}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-[76px] font-black tracking-tight leading-[1.05] text-[#0F2F57]"
              >
                Never Miss a<br />Dose Again
              </motion.h1>
            </div>

            <motion.p 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xs sm:text-base text-[#4B6B8B]/80 font-medium max-w-md leading-relaxed"
            >
              Your intelligent medication adherence and refill tracking platform. Take control of your health with automated reminders and powerful analytics.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex flex-row gap-3 pt-2"
            >
              <motion.button 
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onNavigate('signup')}
                className="px-6 py-3.5 bg-[#0B53FA] hover:bg-[#0043D6] text-white text-xs md:text-sm font-bold rounded-[8px] shadow-md transition-all cursor-pointer whitespace-nowrap flex items-center gap-2"
              >
                <Rocket className="w-4 h-4 animate-pulse" /> Start Tracking Free
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onNavigate('login')}
                className="px-6 py-3.5 bg-white border border-[#E2E8F0] text-[#0F2F57] hover:bg-slate-50 text-xs md:text-sm font-bold rounded-[8px] shadow-sm transition-all cursor-pointer whitespace-nowrap flex items-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4" /> Login to Dashboard
              </motion.button>
            </motion.div>
          </div>

          {/* Right Image */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.93 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ duration: 0.9, delay: 0.2, type: "spring", stiffness: 60 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-[#0B53FA]/5 rounded-[2rem] md:rounded-[3rem] blur-xl opacity-75 -z-10" />
            <div className="relative z-10 p-4 rounded-[2rem] bg-[#937C68] shadow-2xl">
              <img src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=800"
                alt="Health Analytics" className="w-full h-[220px] sm:h-[280px] md:h-[360px] lg:h-[450px] object-cover rounded-[1.8rem]" />

              {/* Floating Card 1: Adherence */}
              <motion.div 
                animate={{ y: [-6, 6, -6] }} 
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                whileHover={{ scale: 1.05 }}
                className="absolute left-8 top-8 bg-white border border-slate-100/80 p-3 pr-5 rounded-2xl shadow-lg flex items-center gap-3 cursor-default"
              >
                <div className="w-8 h-8 rounded-full bg-[#EAF2FC] flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-[#0B53FA]" />
                </div>
                <div className="text-left">
                  <p className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-wider">Adherence</p>
                  <p className="text-xs font-black text-[#0F2F57]">100% On Track</p>
                </div>
              </motion.div>

              {/* Floating Card 2: Next Dose */}
              <motion.div 
                animate={{ y: [6, -6, 6] }} 
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                whileHover={{ scale: 1.05 }}
                className="absolute right-8 bottom-8 bg-white border border-slate-100/80 p-3 pr-5 rounded-2xl shadow-lg flex items-center gap-3 cursor-default"
              >
                <div className="w-8 h-8 rounded-full bg-[#FFF7ED] flex items-center justify-center">
                  <Bell className="w-4 h-4 text-[#EA580C]" />
                </div>
                <div className="text-left">
                  <p className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-wider">Next Dose</p>
                  <p className="text-xs font-black text-[#0F2F57]">5:00 AM Left</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* ═══════════ FEATURES CARDS ═══════════ */}
      <motion.section 
        id="features" 
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-20 mb-12 md:mb-28"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {[
            { icon: <Calendar className="w-5 h-5 text-[#0B53FA]" />, iconBg: 'bg-[#EAF2FC]', title: 'Smart Scheduling', desc: 'Visual daily timelines and customized multi-dose reminders for every medication.', hoverBorder: 'hover:border-[#0B53FA]/30 hover:shadow-[0_20px_40px_rgba(11,83,250,0.08)]' },
            { icon: <Package className="w-5 h-5 text-[#137333]" />, iconBg: 'bg-[#E6F4EA]', title: 'Inventory Tracking', desc: 'Automatic countdowns, critical stock alerts, and refill forecasts.', hoverBorder: 'hover:border-[#137333]/30 hover:shadow-[0_20px_40px_rgba(19,115,51,0.08)]' },
            { icon: <PieChart className="w-5 h-5 text-[#7030A0]" />, iconBg: 'bg-[#F2E6FF]', title: 'Health Analytics', desc: 'Create health analytics expanded in extents and accounts of your health analytics.', hoverBorder: 'hover:border-[#7030A0]/30 hover:shadow-[0_20px_40px_rgba(112,48,160,0.08)]' },
          ].map((f) => (
            <motion.div 
              key={f.title} 
              variants={fadeInUp}
              whileHover={{ y: -6 }}
              initial="rest"
              className={`bg-white rounded-[2rem] p-6 md:p-8 shadow-[0_12px_40px_rgba(15,47,87,0.02)] border border-slate-100/80 flex flex-col justify-between items-start text-left min-h-[220px] relative transition-all duration-300 ${f.hoverBorder}`}
            >
              <div className="w-full relative z-10">
                <div className={`w-12 h-12 ${f.iconBg} rounded-2xl flex items-center justify-center mb-5`}>
                  {f.icon}
                </div>
                <h3 className="text-lg md:text-xl font-extrabold text-[#0F2F57] mb-2">{f.title}</h3>
                <p className="text-xs md:text-sm text-[#4B6B8B]/80 leading-relaxed font-medium pr-6">{f.desc}</p>
              </div>
              <div className="absolute bottom-6 right-6 z-10">
                <motion.div variants={arrowMotion}>
                  <ArrowRight className="w-4 h-4 text-[#0B53FA]" />
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ═══════════ BENEFITS SECTION ═══════════ */}
      <section id="benefits" className="relative z-20 w-full mb-16 md:mb-32">

        {/* Heading Banner */}
        <div className="w-full bg-gradient-to-r from-[#E5ECF6] via-[#EBF0F9] to-[#F1F3FB] py-12 md:py-20 px-6 md:px-12 lg:px-20">
          <div className="max-w-[1400px] mx-auto text-left md:grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 80 }}
            >
              <h2 className="text-2xl md:text-4xl lg:text-5xl font-black text-[#0F2F57] tracking-tight leading-tight">
                Empowering Better<br />Health Outcomes
              </h2>
              <motion.div 
                initial={{ width: 0 }}
                whileInView={{ width: 48 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="h-1 bg-[#10B981] mt-4" 
              />
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 80 }}
              className="mt-6 md:mt-0 flex justify-start md:justify-end"
            >
              <div className="bg-white rounded-3xl p-6 max-w-sm shadow-sm border border-slate-100/60 flex gap-4 items-start">
                <div className="w-10 h-10 bg-[#EAF2FC] rounded-xl flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 text-[#0B53FA]" />
                </div>
                <p className="text-[#4B6B8B]/90 text-xs md:text-sm font-medium leading-relaxed">
                  Our platform goes beyond simple alarms, providing a comprehensive toolkit for managing your pharmaceutical regimen.
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bento Grid */}
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-20 mt-6 md:mt-16">
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >

            {/* Bento Cell 1: Pharmacy Dispatch Text */}
            <motion.div 
              variants={fadeInUp}
              whileHover={{ y: -6 }}
              initial="rest"
              className="bg-white rounded-[2rem] p-8 md:p-10 shadow-[0_12px_40px_rgba(15,47,87,0.02)] hover:shadow-[0_20px_40px_rgba(15,47,87,0.08)] border border-slate-100/80 hover:border-slate-200 flex flex-col justify-between text-left min-h-[240px] relative transition-all duration-300"
            >
              <div className="relative z-10">
                <div className="w-12 h-12 bg-[#EAF2FC] rounded-2xl flex items-center justify-center mb-5">
                  <Home className="w-5 h-5 text-[#0B53FA]" />
                </div>
                <h3 className="text-lg md:text-2xl font-black text-[#0F2F57] mb-2 leading-tight">
                  Pharmacy Dispatch<br />Integration
                </h3>
                <p className="text-xs md:text-sm text-[#4B6B8B]/80 font-medium leading-relaxed max-w-sm">
                  Connect with your pharmacy and manage refill requests.
                </p>
              </div>
              <div className="absolute bottom-8 right-8 w-8 h-8 rounded-full border border-slate-100 flex items-center justify-center hover:bg-slate-50 transition-colors z-10">
                <motion.div variants={arrowMotion}>
                  <ArrowRight className="w-4 h-4 text-[#0B53FA]" />
                </motion.div>
              </div>
            </motion.div>

            {/* Bento Cell 2: Doctors Image */}
            <motion.div 
              variants={fadeInUp}
              whileHover={{ scale: 1.01 }}
              className="bg-slate-50 rounded-[2rem] overflow-hidden h-[200px] sm:h-[240px] md:h-[280px] shadow-sm border border-slate-100/50"
            >
              <img src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=800"
                alt="Healthcare professionals walking" className="w-full h-full object-cover transition-transform duration-500 hover:scale-103" />
            </motion.div>

            {/* Bento Cell 3: Pills Image */}
            <motion.div 
              variants={fadeInUp}
              whileHover={{ scale: 1.01 }}
              className="bg-slate-50 rounded-[2rem] overflow-hidden h-[200px] sm:h-[240px] md:h-[280px] shadow-sm border border-slate-100/50"
            >
              <img src="https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&q=80&w=800"
                alt="Pills scattered" className="w-full h-full object-cover transition-transform duration-500 hover:scale-103" />
            </motion.div>

            {/* Bento Cell 4: Family Support Text */}
            <motion.div 
              variants={fadeInUp}
              whileHover={{ y: -6 }}
              initial="rest"
              className="bg-white rounded-[2rem] p-8 md:p-10 shadow-[0_12px_40px_rgba(15,47,87,0.02)] hover:shadow-[0_20px_40px_rgba(15,47,87,0.08)] border border-slate-100/80 hover:border-slate-200 flex flex-col justify-between text-left min-h-[240px] relative transition-all duration-300"
            >
              <div className="relative z-10">
                <div className="w-12 h-12 bg-[#E6F4EA] rounded-2xl flex items-center justify-center mb-5">
                  <Users className="w-5 h-5 text-[#137333]" />
                </div>
                <h3 className="text-lg md:text-2xl font-black text-[#0F2F57] mb-2 leading-tight">
                  Family & Caregiver Support
                </h3>
                <p className="text-xs md:text-sm text-[#4B6B8B]/80 font-medium leading-relaxed max-w-sm">
                  Share adherence scores and intake logs with loved ones.
                </p>
              </div>
              <div className="absolute bottom-8 right-8 w-8 h-8 rounded-full border border-slate-100 flex items-center justify-center hover:bg-slate-50 transition-colors z-10">
                <motion.div variants={arrowMotion}>
                  <ArrowRight className="w-4 h-4 text-[#0B53FA]" />
                </motion.div>
              </div>
            </motion.div>

          </motion.div>
        </div>
      </section>

      {/* ═══════════ CTA SECTION ═══════════ */}
      <section className="py-6 md:py-16 px-6 md:px-12 lg:px-20 relative z-20 mb-12 md:mb-24 max-w-[1400px] mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 80, damping: 15 }}
          className="w-full bg-[#0B53FA] rounded-[2rem] py-16 px-6 md:px-12 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-lg border border-slate-100/5"
        >
          
          {/* Concentric Circle Ornaments Left */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
            className="absolute left-[-120px] top-1/2 -translate-y-1/2 w-80 h-80 rounded-full border border-white/10 pointer-events-none flex items-center justify-center"
          >
            <div className="w-64 h-64 rounded-full border border-white/5 flex items-center justify-center">
              <div className="w-48 h-48 rounded-full border border-white/5 flex items-center justify-center">
                <div className="w-32 h-32 rounded-full border border-white/10 bg-white/5 flex items-center justify-center">
                  <motion.div
                    animate={{ scale: [0.95, 1.05, 0.95] }}
                    transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                  >
                    <Users className="w-5 h-5 text-white" />
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* Concentric Circle Ornaments Right */}
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
            className="absolute right-[-120px] top-1/2 -translate-y-1/2 w-80 h-80 rounded-full border border-white/10 pointer-events-none flex items-center justify-center"
          >
            <div className="w-64 h-64 rounded-full border border-white/5 flex items-center justify-center">
              <div className="w-48 h-48 rounded-full border border-white/5 flex items-center justify-center">
                <motion.div 
                  animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  className="w-4 h-4 rounded-full bg-white" 
                />
              </div>
            </div>
          </motion.div>
          
          <h2 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight mb-3 relative z-10">
            Ready to Take Control?
          </h2>
          <p className="text-[#BACCDD] text-xs md:text-sm mb-8 max-w-lg relative z-10 font-medium leading-relaxed">
            Join thousands of users who have improved their health outcomes by perfectly managing their medication adherence with HealthStock.
          </p>
          <div className="relative z-10">
            <motion.button 
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onNavigate('signup')}
              className="px-8 py-3.5 bg-white text-[#0B53FA] text-xs md:text-sm font-extrabold rounded-[8px] transition-all shadow-md hover:-translate-y-0.5 cursor-pointer flex items-center gap-2"
            >
              Create Your Free Account <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>
        </motion.div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="relative z-20 py-10 px-6 md:px-12 lg:px-20 bg-white border-t border-slate-100">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          
          {/* Logo on the left */}
          <div className="flex items-center gap-3 cursor-pointer shrink-0" onClick={(e) => handleNavClick(e, 'Home')}>
            <Logo className="w-9 h-9" />
            <div className="flex flex-col leading-none text-left">
              <span className="text-xl font-extrabold text-[#0F2F57] tracking-tight">Healthstock</span>
              <span className="text-[9px] font-extrabold text-[#94A3B8] uppercase tracking-[0.25em] mt-1">
                INTELLIGENCE
              </span>
            </div>
          </div>

          {/* Links in the center */}
          <div className="flex items-center gap-6 text-xs font-bold text-slate-400">
            <button onClick={() => setActiveModal('privacy')} className="hover:text-[#0F2F57] transition-colors cursor-pointer border-none bg-transparent font-bold">Privacy</button>
            <span>•</span>
            <button onClick={() => setActiveModal('terms')} className="hover:text-[#0F2F57] transition-colors cursor-pointer border-none bg-transparent font-bold">Terms</button>
            <span>•</span>
            <button onClick={() => setActiveModal('docs')} className="hover:text-[#0F2F57] transition-colors cursor-pointer border-none bg-transparent font-bold">Support</button>
          </div>

          {/* Copyright/Disclaimer on the right */}
          <div className="flex flex-col items-center md:items-end text-center md:text-right gap-1 max-w-xs">
            <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
              Secure medication adherence tracking. Not a substitute for professional medical advice.
            </p>
            <p className="text-[10px] text-slate-400 font-bold">
              © 2026 HealthStock Inc.
            </p>
          </div>

        </div>
      </footer>

    </div>
  );
}
