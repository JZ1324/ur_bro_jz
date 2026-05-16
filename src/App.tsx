/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  Plus, 
  LayoutGrid, 
  Menu, 
  Folder, 
  User, 
  GraduationCap, 
  Music, 
  Users, 
  Lock, 
  LockOpen,
  X,
  Sun,
  Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SquigglyText } from './components/ui/squiggly-text';
import { CanvasText } from './components/ui/canvas-text';
import { MagicBento, BentoCardData } from './components/ui/MagicBento';
import { cn } from './lib/utils';
import { TextScramble } from './components/TextScramble';
import { InputOTP, InputOTPGroup, InputOTPSlot } from './components/InputOTP';

const PASSWORD = "archive"; // Simple password as requested by the original HTML logic

export default function App() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [error, setError] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true' || 
             window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', isDarkMode.toString());
  }, [isDarkMode]);

  const handleUnlock = () => {
    if (passwordInput.toLowerCase() === PASSWORD) {
      setIsUnlocked(true);
      setShowModal(false);
      setPasswordInput('');
      setError(false);
      
      // Simulate archive loading
      setIsProjectsInitialLoading(true);
      setTimeout(() => {
        setIsProjectsInitialLoading(false);
        // Wait for re-render then scroll
        setTimeout(() => {
          document.getElementById('archive-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }, 1200);
    } else {
      setError(true);
      setTimeout(() => setError(false), 500);
    }
  };

  const handleStoryClick = (item: string) => {
    if (item === 'Projects') {
      setShowBento(true);
      return;
    }
    if (item === 'About') {
      return;
    }
    if (isUnlocked) {
      document.getElementById('archive-section')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      setShowModal(true);
    }
  };

  const lockArchive = () => {
    setIsUnlocked(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [loadingProjectId, setLoadingProjectId] = useState<string | null>(null);
  const [isProjectsInitialLoading, setIsProjectsInitialLoading] = useState(false);
  const [showBento, setShowBento] = useState(false);

  const toggleProjectExpansion = (id: string) => {
    if (expandedProjectId === id) {
      setExpandedProjectId(null);
      return;
    }

    // Simulate fetching expanded data
    setLoadingProjectId(id);
    setTimeout(() => {
      setExpandedProjectId(id);
      setLoadingProjectId(null);
    }, 600);
  };

  return (
    <div className="min-h-screen pt-20 pb-10 flex flex-col items-center selection:bg-accent-soft/40">
      {/* Top App Bar */}
      <header className="fixed top-0 left-0 w-full z-40 bg-surface/80 backdrop-blur-md border-b border-border/30 flex justify-center px-4 py-3">
        <div className="w-full max-w-container-max flex justify-between items-center">
          <div className="text-xl font-bold tracking-tight text-text">
            <TextScramble text="jz.archive" className="scale-75 origin-left" />
          </div>
          <div className="flex items-center gap-2 text-accent">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-full hover:bg-accent-soft transition-all active:scale-90"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
            </button>
            <button className="p-2 rounded-full hover:bg-accent-soft transition-all active:scale-90">
              <Plus size={24} />
            </button>
            <button className="p-2 rounded-full hover:bg-accent-soft transition-all active:scale-90">
              <LayoutGrid size={24} />
            </button>
            <button className="p-2 rounded-full hover:bg-accent-soft transition-all active:scale-90">
              <Menu size={24} />
            </button>
          </div>
        </div>
      </header>

      <main className="w-full max-w-container-max px-4 flex flex-col gap-12 flex-grow">
        {/* Profile Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12 mt-8 p-6 bg-surface rounded-xl border border-border/20 shadow-sm"
        >
          <div className="flex-shrink-0 group p-2 relative">
            {/* Pulsing ring background */}
            <motion.div
              animate={{
                scale: [1, 1.05, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute inset-0 rounded-full bg-accent/10 blur-xl -z-10"
            />
            
            <motion.div 
              animate={{ 
                boxShadow: [
                  "0 4px 20px -2px rgba(184, 121, 91, 0.15)",
                  "0 4px 25px -2px rgba(110, 115, 94, 0.25)",
                  "0 4px 20px -2px rgba(184, 121, 91, 0.15)"
                ] 
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              className="w-40 h-40 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-accent p-1 transition-transform duration-500 group-hover:scale-[1.02] relative bg-surface"
            >
              <img 
                src="https://lh3.googleusercontent.com/aida/ADBb0uiICNTonTRXUP5I66YOuW3aIjz00nnjKRYNyxuyihXy-S8x4x7tq2Hzlbw1syuptCzQbLALFi3FDaXYEIiGc60OwzV1u4-dotnsRrPgMufxwfBrkFUoDPK5bSBi3cfP4rJK0EMrtgYfcqNe5pERlxpgngT5H4mA8eVK5W8oyYmDiChzULNY3OKZH4MZApD3RX5Qc--cP7fd0tC-8qsJJLO-pClNT5w0rmjB63nicQS-fM83FtmmdmqS5pg" 
                alt="Joshua Zheng"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover rounded-full bg-accent-soft/30" 
              />
              
              {/* Shimmer effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                <div className="absolute inset-0 bg-linear-to-tr from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer" />
              </div>
            </motion.div>
          </div>

          <div className="flex flex-col items-center md:items-start gap-4 flex-grow text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-text">
              <CanvasText 
                text="ur_bro_jz" 
                className="text-3xl md:text-4xl"
                colors={["#b8795b", "#6e735e", "#d1d5db"]} 
              />
            </h1>
            <p className="text-muted font-semibold tracking-wide text-sm">
              @jz.archive
            </p>

            <div className="flex gap-8 md:gap-12 py-2">
              {[
                { label: 'Posts', value: 12 },
                { label: 'Archives', value: 6 },
                { label: 'Goals', value: 3 },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col items-center md:items-start">
                  <span className="text-xl font-bold text-accent">{stat.value}</span>
                  <span className="text-xs font-semibold text-muted uppercase tracking-wider">{stat.label}</span>
                </div>
              ))}
            </div>

            <p className="text-text max-w-md leading-relaxed opacity-90">
              Student, creator, musician, and digital builder. Exploring design, code, music, and creative projects.
            </p>

            <div className="flex gap-4 w-full md:w-auto mt-4">
              <button className="flex-1 md:flex-none px-8 py-3 bg-accent text-white font-semibold rounded-full hover:bg-accent-dark active:scale-95 premium-transition shadow-sm">
                Contact
              </button>
              <button className="flex-1 md:flex-none px-8 py-3 bg-white border border-accent text-accent font-semibold rounded-full hover:bg-accent-soft active:scale-95 premium-transition shadow-sm">
                Resume
              </button>
            </div>
          </div>
        </motion.section>

        {/* Story Highlights */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full"
        >
          <div className="flex justify-start md:justify-center gap-6 overflow-x-auto py-4 scrollbar-hide px-2">
            {[
              { id: 'projects', label: 'Projects', icon: Folder, locked: false },
              { id: 'about', label: 'About', icon: User, locked: false },
              { id: 'school', label: 'School', icon: GraduationCap, locked: true },
              { id: 'music', label: 'Music', icon: Music, locked: true },
              { id: 'leadership', label: 'Leadership', icon: Users, locked: true },
            ].map((story) => (
              <button 
                key={story.id} 
                onClick={() => handleStoryClick(story.label)}
                className="flex flex-col items-center gap-3 cursor-pointer group flex-shrink-0"
              >
                <div className={`w-20 h-20 rounded-full p-1 transition-all duration-300 relative group-hover:bg-accent-soft/30 ${
                  (story.locked && !isUnlocked) 
                    ? 'ring-2 ring-border opacity-80 group-hover:opacity-100' 
                    : 'ring-2 ring-accent group-hover:shadow-[0_0_15px_rgba(110,115,94,0.3)] group-hover:scale-[1.03]'
                }`}>
                  <div className="w-full h-full bg-surface rounded-full flex items-center justify-center border border-border/30">
                    <story.icon 
                      size={28} 
                      className={`${(story.locked && !isUnlocked) ? 'text-muted' : 'text-accent'}`} 
                    />
                  </div>
                  {story.locked && !isUnlocked && (
                    <div className="absolute bottom-1 right-0 bg-surface rounded-full p-1 border border-border shadow-sm text-warm-accent">
                      <Lock size={12} fill="currentColor" />
                    </div>
                  )}
                </div>
                <span className={`text-[12px] font-semibold transition-colors ${
                  (story.locked && !isUnlocked) ? 'text-muted group-hover:text-text' : 'text-text'
                }`}>
                  {story.label}
                </span>
              </button>
            ))}
          </div>
        </motion.section>

        <motion.hr 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ duration: 0.6, delay: 0.3 }}
          className="border-t border-border/30 w-full" 
        />

        {/* Unlocked Archive Section */}
        <AnimatePresence>
          {isUnlocked && (
            <motion.section 
              id="archive-section"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-col gap-8 w-full overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 px-4">
                <div className="flex flex-col gap-1">
                  <h2 className="text-2xl font-bold text-text">The Vault</h2>
                  <div className="text-muted text-sm font-medium">
                    <TextScramble text="Unlocked collection · 4 posts" />
                  </div>
                </div>
                <button 
                  onClick={lockArchive}
                  className="group flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent text-xs font-bold rounded-full hover:bg-accent/20 transition-all border border-accent/20"
                >
                  <Lock size={14} className="group-hover:scale-110 transition-transform" />
                  Lock Archive
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-12">
                {isProjectsInitialLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-surface rounded-lg border border-border/20 p-6 flex flex-col gap-4 m-1 shadow-sm animate-pulse-soft">
                      <div className="aspect-[4/3] bg-bg rounded-md" />
                      <div className="h-6 bg-bg rounded w-3/4" />
                      <div className="h-4 bg-bg rounded w-full" />
                      <div className="flex gap-2">
                        <div className="h-6 w-12 bg-bg rounded-full" />
                        <div className="h-6 w-12 bg-bg rounded-full" />
                      </div>
                    </div>
                  ))
                ) : (
                  PROJECTS.map((project, idx) => (
                    <motion.div 
                      key={project.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      whileHover={(expandedProjectId !== project.id && loadingProjectId !== project.id) ? { 
                        y: -8,
                        scale: 1.01,
                        transition: { duration: 0.3, ease: "easeOut" }
                      } : {}}
                      className={`group bg-surface rounded-lg overflow-hidden border border-border/40 shadow-sm hover:shadow-2xl premium-transition flex flex-col m-1 relative ${
                        expandedProjectId === project.id ? 'col-span-full' : ''
                      } ${loadingProjectId === project.id ? 'cursor-wait opacity-80' : 'cursor-pointer'}`}
                      onClick={() => !loadingProjectId && toggleProjectExpansion(project.id)}
                    >
                      {loadingProjectId === project.id && (
                        <div className="absolute inset-0 z-20 bg-surface/40 backdrop-blur-[2px] flex items-center justify-center">
                          <motion.div 
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full"
                          />
                        </div>
                      )}
                      <div className="flex flex-col md:flex-row gap-6">
                        <div className={`aspect-[4/3] relative overflow-hidden bg-bg transition-all duration-500 ${
                          expandedProjectId === project.id ? 'md:w-1/2 aspect-video' : 'w-full'
                        }`}>
                          <img 
                            src={project.image} 
                            alt={project.title}
                            referrerPolicy="no-referrer"
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" 
                          />
                        </div>
                        <div className={`p-6 flex flex-col gap-3 transition-all duration-500 ${
                          expandedProjectId === project.id ? 'md:w-1/2 justify-center' : 'w-full'
                        }`}>
                          <div className="flex justify-between items-start">
                            <h3 className="font-bold text-lg text-text line-clamp-1">{project.title}</h3>
                            <motion.div
                              animate={{ rotate: expandedProjectId === project.id ? 180 : 0 }}
                              className="text-muted"
                            >
                              <Menu size={20} />
                            </motion.div>
                          </div>
                          <p className="text-muted text-sm line-clamp-2 leading-relaxed">{project.description}</p>
                          
                          <AnimatePresence mode="wait">
                            {expandedProjectId === project.id && (
                              <motion.div
                                key="expanded-content"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="flex flex-col gap-4 pt-2 overflow-hidden"
                              >
                                <p className="text-text text-sm leading-relaxed opacity-80">{project.longDescription}</p>
                                
                                <div className="flex flex-col gap-2">
                                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Stack</span>
                                  <div className="flex flex-wrap gap-2">
                                    {project.tech.map(t => (
                                      <span key={t} className="px-2 py-0.5 bg-accent/5 text-accent text-[10px] font-semibold border border-accent/10 rounded">
                                        {t}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                
                                <div className="pt-2">
                                  <a 
                                    href={project.link} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white text-xs font-bold rounded-full hover:bg-accent-dark premium-transition"
                                  >
                                    View on Platform
                                  </a>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                          
                          <div className="flex flex-wrap gap-2 pt-2">
                            {project.tags.map(tag => (
                              <span key={tag} className="px-3 py-1 bg-accent-soft/40 text-accent text-[10px] font-bold uppercase tracking-wider rounded-full">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Canvas Text Demo Section */}
        <section className="w-full py-20 flex flex-col items-center justify-center border-t border-border/20">
          <h2 className={cn(
            "group relative mx-auto mt-4 max-w-2xl text-center text-4xl leading-tight font-bold tracking-tight text-text sm:text-5xl md:text-6xl"
          )}>
            Archive projects at{" "}
            <CanvasText
              text="Lightning Speed"
              backgroundClassName="bg-blue-600 dark:bg-blue-900"
              colors={[
                "rgba(0, 153, 255, 1)",
                "rgba(0, 153, 255, 0.9)",
                "rgba(0, 153, 255, 0.8)",
                "rgba(0, 153, 255, 0.7)",
                "rgba(0, 153, 255, 0.6)",
                "rgba(0, 153, 255, 0.5)",
                "rgba(0, 153, 255, 0.4)",
                "rgba(0, 153, 255, 0.3)",
                "rgba(0, 153, 255, 0.2)",
                "rgba(0, 153, 255, 0.1)",
              ]}
              lineGap={4}
              animationDuration={20}
            />
          </h2>
          <p className="mt-8 text-muted font-medium text-sm tracking-widest uppercase opacity-60 italic">"Quality over quantity, always."</p>
        </section>

        {/* Fun Manifesto Section */}
        <section className="w-full py-20 flex flex-col items-center justify-center border-t border-border/20 bg-accent/5">
          <h2 className="text-center text-4xl leading-tight font-bold text-text md:text-6xl lg:text-7xl opacity-90 max-w-4xl px-4">
            How many <SquigglyText stepDuration={70} scale={[6, 9]} className="text-amber-500">projects</SquigglyText> <br />
            are <SquigglyText scale={[3, 5]} className="text-accent underline decoration-dotted underline-offset-8">too many</SquigglyText> projects?
          </h2>
          <p className="mt-8 text-muted font-medium text-sm tracking-widest uppercase opacity-60">The archive never ends.</p>
        </section>

        {/* Footer */}
        <footer className="w-full flex flex-col items-center gap-6 pt-12">
          <div className="flex gap-8">
            {['Archive', 'Info', 'Contact'].map(link => (
              <a key={link} href="#" className="text-sm font-semibold text-muted hover:text-accent premium-transition opacity-80 hover:opacity-100">
                {link}
              </a>
            ))}
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="font-bold text-accent tracking-wide">
              <TextScramble text="jz.archive" className="scale-90" />
            </span>
            <span className="text-muted text-[10px] uppercase font-bold tracking-widest opacity-60">
              © {new Date().getFullYear()} joshua.archive
            </span>
          </div>
        </footer>
      </main>

      {/* Password Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`bg-surface rounded-xl shadow-2xl border border-border p-8 w-full max-w-sm flex flex-col items-center text-center gap-6 ${error ? 'animate-shake' : ''}`}
            >
              <div className="w-16 h-16 bg-bg rounded-full flex items-center justify-center text-warm-accent">
                <Lock size={32} fill="currentColor" />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-2xl font-bold text-text uppercase tracking-tight">Locked</h3>
                <p className="text-muted text-sm font-medium">This archive is private. (psst: its "archive")</p>
              </div>
              
              <div className="w-full flex justify-center py-4">
                <InputOTP 
                  maxLength={7}
                  value={passwordInput}
                  onChange={(value) => setPasswordInput(value)}
                  onComplete={handleUnlock}
                >
                  <InputOTPGroup>
                    {Array.from({ length: 7 }).map((_, i) => (
                      <InputOTPSlot key={i} index={i} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
                
                <div className="flex flex-col gap-2 w-full">
                  <button 
                    onClick={handleUnlock}
                    className="w-full py-4 bg-accent text-white font-bold rounded-full hover:bg-accent-dark active:scale-95 premium-transition"
                  >
                    Unlock
                  </button>
                  <button 
                    onClick={() => setShowModal(false)}
                    className="w-full py-3 bg-transparent text-muted font-semibold rounded-full hover:bg-accent-soft/30 active:scale-95 premium-transition"
                  >
                    Cancel
                  </button>
                </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bento Project Overlay triggered by Story */}
      <AnimatePresence>
        {showBento && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface/95 backdrop-blur-2xl overflow-y-auto"
          >
            <div className="max-w-6xl w-full flex flex-col gap-8 min-h-screen py-20 px-4">
              <div className="flex justify-between items-center">
                <div className="flex flex-col gap-2">
                  <h2 className="text-4xl font-bold text-text tracking-tight">Project Matrix</h2>
                  <p className="text-muted font-medium">Click a card to reveal project specifications</p>
                </div>
                <button 
                  onClick={() => setShowBento(false)}
                  className="p-4 bg-accent/10 hover:bg-accent/20 text-accent rounded-full transition-all active:scale-90"
                >
                  <X size={32} />
                </button>
              </div>

              <MagicBento 
                data={PROJECTS.map(p => ({
                  id: p.id,
                  title: p.title,
                  description: p.description,
                  label: p.tags[0],
                  image: p.image,
                  color: '#120F17'
                }))}
                onCardClick={toggleProjectExpansion}
                glowColor="132, 0, 255"
                enableTilt={true}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Expandable Details Overlay (Unified for both Grid and Bento) */}
      <AnimatePresence>
        {expandedProjectId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-bg/80 backdrop-blur-xl"
            onClick={() => setExpandedProjectId(null)}
          >
            {PROJECTS.filter(p => p.id === expandedProjectId).map(project => (
              <motion.div
                key={project.id}
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="max-w-2xl w-full bg-surface border border-border/40 rounded-3xl overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="aspect-video relative">
                  <img src={project.image} alt={project.title} className="w-full h-full object-cover" />
                  <button 
                    onClick={() => setExpandedProjectId(null)}
                    className="absolute top-4 right-4 p-2 bg-surface/50 backdrop-blur-md rounded-full hover:bg-surface transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="p-8 flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap gap-2">
                      {project.tags.map(tag => (
                        <span key={tag} className="text-[10px] font-bold uppercase tracking-widest text-accent px-2 py-0.5 bg-accent/10 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <h3 className="text-3xl font-bold text-text">{project.title}</h3>
                  </div>
                  <p className="text-muted leading-relaxed">{project.longDescription}</p>
                  
                  <div className="flex flex-col gap-3">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-text/60">Technology Stack</h4>
                    <div className="flex flex-wrap gap-2">
                      {project.tech.map(t => (
                        <span key={t} className="px-3 py-1 bg-bg border border-border/20 rounded-lg text-sm text-text font-medium">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <a 
                    href={project.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full py-4 bg-accent text-white font-bold rounded-2xl text-center hover:bg-accent-dark transition-all shadow-lg shadow-accent/20"
                  >
                    View Project
                  </a>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Shake animation for errors */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out 0s 2;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

const PROJECTS = [
  {
    id: "ds-builder",
    title: "Design System Builder",
    description: "A reusable visual system for clean layouts, spacing, and components.",
    longDescription: "This project focused on creating a scalable design system that balances aesthetics with functional performance. It includes a comprehensive library of UI components, utility classes, and design tokens.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDKu4za2uG_gLwPIOf1prITYHvEZVm1rfskvSD7BbuqEAo_eJJPPxywM0HhckI9xGfF3aSdZ07gMCMHvzNiq0FpoiGGQzP2FOE0_NkCW25dP1fCj0d7avfBcy0AoGfkYbacLRJYzlW3VpmvpGfc_o8UzBhnaxrn82NxIMNUynR_phpKJKfzMa2DnixhIftzEHkj5uqe8mxFHoUAIDJb45p6_3JXljIkIf2pi224wkYSMp7GlxLXvzlarPke2Eu_lKi0_KinHZBB0w4",
    tags: ["UI", "CSS", "Design"],
    tech: ["Vite", "Tailwind CSS", "TypeScript", "Framer Motion"],
    link: "https://github.com/jz-archive/ds-builder"
  },
  {
    id: "portfolio-code",
    title: "Portfolio Codebase",
    description: "A personal website built with structured HTML, CSS, and JavaScript.",
    longDescription: "The official jz.archive codebase. Built with a focus on semantic HTML and modern CSS architecture to ensure high accessibility and performance across all devices.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuANRJKzGBk9wDa_GkbBdZvfWo6pqpTVSm4SnRBstrM6aCoAZP6CRSwRVsBha6j_wbbezQMuOve9x7pNefAi4rkGmayRVLJ3i4X5z5zvuyWr4fwW4T-vgeOTJnmpVvht2Q8PxAzCXitqhTBQG_QhhCrNCO5s163UgLJDbeROrYOLpc36RWVsFh7KVsJRQ62to1lH-I9AOJ1cMKULo5LGpEvZ-mhZ8v274tGnZfgSvPfuOMniNOxgansAESEOBhtVYlPcnlCw36DZVCU",
    tags: ["Web", "Frontend", "Code"],
    tech: ["HTML5", "CSS3", "ES6+", "Vercel"],
    link: "https://github.com/jz-archive/portfolio"
  },
  {
    id: "api-engine",
    title: "API Integration Engine",
    description: "A tool concept for connecting data, automation, and user interfaces.",
    longDescription: "An experimental middleware layer designed to aggregate diverse API endpoints into a unified GraphQL interface, simplifying data fetching for complex frontend applications.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBVaZzTzJDG_a2HrH3Q_vZeAyKV4NHXx4BKD0-gIKKRyPWnfK2xjKA3Z-Uqkw8epeO_ypkHr6U_UjbKktZolKhQQJ7Mojz_EGEtRt4sQz1sjMpn0Urw9t3h8p2ZRUePtbffPS5wVIaEWLb8UAU9O2j5pXDK1mhhCBwjtlbB3tGboSlrB14SNpoq9ToJSI119EjihO4e7gD5UAiPv9uf1SCVYWpy5_L4OCX68oWK_-O4ea7pR_ib8SCev0wx9q_2PkVd2mDMjNqfJlc",
    tags: ["API", "JS", "Logic"],
    tech: ["Node.js", "Express", "GraphQL", "Redis"],
    link: "https://github.com/jz-archive/api-engine"
  },
  {
    id: "wireframe-kit",
    title: "Mobile Wireframe Kit",
    description: "A clean prototype system for planning app screens and layouts.",
    longDescription: "A Figma-based wireframing kit containing 50+ pre-built mobile screens. Designed to speed up the ideation phase while maintaining structural clarity and user flow consistency.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAKmK3vz2fdlq04L-C6RuoU9ZaW0g7Jgp0XFLQslqFY5mKip7uDcSpzAJKTdbAa_vcsZrbQ0VjVHmgtCslQZ8uGJJ8qh_ycxq5DV9s6naI14guY2tEbNFoN64a8WFaG6gaLoH7ltouAojhLFeiaE0HgSOnn03mcz1I_sYklbI084STfNb73zf4106WVxGJd5ISpNKsHOB7W2aOUr8t2TNQmCwauTZ5lpYdNpTg-E5BYVyc6gozUKsPJG-xtjLumUwTGanzCqbrsTUE",
    tags: ["UX", "Mobile", "Prototype"],
    tech: ["Figma", "Design Thinking", "User Flow", "Prototyping"],
    link: "https://figma.com/community/file/jz-wireframes"
  }
];
