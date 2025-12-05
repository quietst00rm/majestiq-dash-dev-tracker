import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Settings,
  Search,
  Filter,
  RefreshCw,
  ChevronRight,
  Star,
  Send,
  Sparkles,
  FileText,
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  Code,
  Database,
  Server,
  Github,
  Linkedin,
  DollarSign,
  Briefcase,
  Moon,
  Sun,
  Phone,
  MessageSquare,
  FileSearch,
  ExternalLink,
  LayoutDashboard
} from 'lucide-react';
import { fetchApplicants, updateApplicantData } from './services/sheetService';
import { analyzeCandidate, generateEmail, generateResumeOverview } from './services/geminiService';
import { Applicant, ApplicantStatus, Note } from './types';
import { StatusBadge } from './components/StatusBadge';

// --- Components ---

const Header = ({ darkMode, toggleDarkMode, isSyncing, analysisCount }: { darkMode: boolean, toggleDarkMode: () => void, isSyncing: boolean, analysisCount: number }) => (
  <header className="bg-white dark:bg-darkbg border-b border-gray-200 dark:border-white/10 sticky top-0 z-20 transition-colors duration-200">
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between h-20">
        <div className="flex">
          <div className="flex-shrink-0 flex items-center gap-3">
             {/* Brand Logo */}
            <div className="flex items-center">
              <span className="font-bold text-3xl tracking-tighter text-gray-900 dark:text-white">
                Majest<span className="text-primary">IQ</span>
              </span>
            </div>
            <div className="hidden md:flex h-6 w-[1px] bg-gray-300 dark:bg-white/20 mx-2"></div>
            <span className="hidden md:block text-sm font-medium text-gray-500 dark:text-gray-400 tracking-wide uppercase">Recruit</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
           {analysisCount > 0 && (
             <div className="hidden md:flex items-center text-xs font-bold px-3 py-1.5 rounded-full border transition-all duration-300 text-primary dark:text-primary bg-yellow-50 dark:bg-yellow-900/10 border-yellow-100 dark:border-yellow-900/30">
               <Sparkles className="w-3.5 h-3.5 mr-2 animate-pulse" />
               AI ANALYZING ({analysisCount})
             </div>
           )}
           <div className={`hidden md:flex items-center text-xs font-bold px-3 py-1.5 rounded-full border transition-all duration-300 ${isSyncing ? 'text-primary dark:text-primary bg-yellow-50 dark:bg-yellow-900/10 border-yellow-100 dark:border-yellow-900/30' : 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30'}`}>
             <div className={`w-1.5 h-1.5 rounded-full mr-2 ${isSyncing ? 'bg-primary animate-spin' : 'bg-emerald-500 animate-pulse'}`}></div>
             {isSyncing ? 'SYNCING...' : 'LIVE SYNC ACTIVE'}
           </div>
           
           <button 
             onClick={toggleDarkMode}
             className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 transition-colors"
             title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
           >
             {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
           </button>

          <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 transition-colors">
            <Settings className="h-5 w-5" />
          </button>
          
          <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-black font-bold shadow-md ring-2 ring-white dark:ring-black">
            HR
          </div>
        </div>
      </div>
    </div>
  </header>
);

const EmptyState = () => (
  <div className="text-center py-20 bg-white dark:bg-darksurface rounded-xl shadow-sm border border-gray-200 dark:border-white/10 mx-auto max-w-lg mt-10">
    <div className="bg-yellow-50 dark:bg-yellow-900/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
      <Users className="h-8 w-8 text-primary" />
    </div>
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No applicants found</h3>
    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">Sync with the Google Sheet to get started and see your candidates here.</p>
  </div>
);

const RatingPill = ({ label, value }: { label: string, value: string }) => {
  const isAdvanced = value.toLowerCase().includes('expert') || value.toLowerCase().includes('lead') || value.toLowerCase().includes('advanced');
  const isIntermediate = value.toLowerCase().includes('intermediate');
  
  let colorClass = 'bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/10';
  if (isAdvanced) colorClass = 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/30 ring-1 ring-emerald-500/10 dark:ring-emerald-400/10';
  else if (isIntermediate) colorClass = 'bg-blue-50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/30 ring-1 ring-blue-500/10 dark:ring-blue-400/10';

  return (
    <div className={`flex flex-col p-3 rounded-lg border ${colorClass} transition-all hover:shadow-sm`}>
      <span className="text-[10px] uppercase font-bold opacity-70 tracking-wider mb-1">{label}</span>
      <span className="text-sm font-semibold truncate leading-tight" title={value}>{value}</span>
    </div>
  );
};

// Small dot indicator for list view skill matrix
const SkillDot = ({ label, value }: { label: string, value: string }) => {
  const v = value.toLowerCase();
  let color = 'bg-gray-200 dark:bg-gray-700';
  let title = `${label}: Beginner/None`;
  
  if (v.includes('expert') || v.includes('lead')) {
    color = 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]';
    title = `${label}: Expert/Lead`;
  } else if (v.includes('advanced')) {
    color = 'bg-blue-500 dark:bg-blue-400';
    title = `${label}: Advanced`;
  } else if (v.includes('intermediate')) {
    color = 'bg-primary';
    title = `${label}: Intermediate`;
  }

  return (
    <div className="group relative flex flex-col items-center">
       <div className={`w-2.5 h-2.5 rounded-full ${color} transition-all duration-300 group-hover:scale-125`}></div>
       <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 dark:bg-gray-700 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none shadow-lg">
         {title}
       </div>
    </div>
  );
};

export default function App() {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [detailTab, setDetailTab] = useState<'profile' | 'resume'>('profile');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApplicantStatus | 'All'>('All');
  
  // Theme State - Defaulting to Dark Mode
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem('theme');
      if (stored) return stored === 'dark';
      // Default to TRUE for MajestIQ branding
      return true; 
    }
    return true;
  });

  // Theme Effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Analysis States
  const [analyzing, setAnalyzing] = useState(false);
  const [resumeAnalyzing, setResumeAnalyzing] = useState(false);
  const [generatedEmail, setGeneratedEmail] = useState<string | null>(null);
  const [manualResumeText, setManualResumeText] = useState('');

  // Auto-analysis tracking
  const [analyzingIds, setAnalyzingIds] = useState<Set<string>>(new Set());
  const [analysisQueue, setAnalysisQueue] = useState<string[]>([]);

  // New Note State
  const [newNote, setNewNote] = useState('');

  // Initial Data Fetch
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchApplicants();
    setApplicants(data);
    setLoading(false);

    // Queue candidates without AI analysis for auto-analysis
    const needsAnalysis = data.filter(app => !app.aiAnalysis).map(app => app.id);
    if (needsAnalysis.length > 0) {
      setAnalysisQueue(needsAnalysis);
    }
  };

  // Process the analysis queue - analyze one candidate at a time
  useEffect(() => {
    if (analysisQueue.length === 0) return;

    const processNext = async () => {
      const nextId = analysisQueue[0];
      const applicant = applicants.find(app => app.id === nextId);

      if (!applicant || applicant.aiAnalysis) {
        // Already analyzed or not found, skip to next
        setAnalysisQueue(prev => prev.slice(1));
        return;
      }

      // Mark as analyzing
      setAnalyzingIds(prev => new Set(prev).add(nextId));

      try {
        const analysis = await analyzeCandidate(applicant);

        if (analysis) {
          const updated = { ...applicant, aiAnalysis: analysis };

          // Update applicants state
          setApplicants(prev => prev.map(a => a.id === nextId ? updated : a));

          // Update selected applicant if it's the one being analyzed
          setSelectedApplicant(prev => prev?.id === nextId ? updated : prev);

          // Persist to localStorage
          await updateApplicantData(updated);
        }
      } catch (error) {
        console.error(`Error analyzing candidate ${applicant.fullName}:`, error);
      } finally {
        // Remove from analyzing set and queue
        setAnalyzingIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(nextId);
          return newSet;
        });
        setAnalysisQueue(prev => prev.slice(1));
      }
    };

    // Small delay between analyses to avoid rate limiting
    const timeoutId = setTimeout(processNext, 500);
    return () => clearTimeout(timeoutId);
  }, [analysisQueue, applicants]);

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  const handleUpdateApplicant = async (updatedApp: Applicant) => {
    setSyncing(true);
    // Optimistic Update
    setApplicants(prev => prev.map(a => a.id === updatedApp.id ? updatedApp : a));
    if (selectedApplicant?.id === updatedApp.id) {
      setSelectedApplicant(updatedApp);
    }
    // Async save
    await updateApplicantData(updatedApp);
    setSyncing(false);
  };

  const handleAnalyze = async (app: Applicant) => {
    setAnalyzing(true);
    const analysis = await analyzeCandidate(app);
    setAnalyzing(false);
    if (analysis) {
      // Preserve existing resume summary if it exists
      const mergedAnalysis = { 
          ...analysis, 
          resumeSummary: app.aiAnalysis?.resumeSummary 
      };
      const updated = { ...app, aiAnalysis: mergedAnalysis };
      handleUpdateApplicant(updated);
    }
  };

  const handleResumeAnalysis = async (app: Applicant) => {
    setResumeAnalyzing(true);
    const summary = await generateResumeOverview(app, manualResumeText);
    setResumeAnalyzing(false);
    
    // Merge into aiAnalysis object
    const currentAnalysis = app.aiAnalysis || { 
        summary: '', strengths: [], weaknesses: [], rating: 0, suggestedQuestions: [] 
    };
    
    const updatedAnalysis = { ...currentAnalysis, resumeSummary: summary };
    const updated = { ...app, aiAnalysis: updatedAnalysis };
    handleUpdateApplicant(updated);
  };

  const handleAddNote = async () => {
    if (!selectedApplicant || !newNote.trim()) return;
    const note: Note = {
      id: Date.now().toString(),
      text: newNote,
      author: 'You',
      timestamp: new Date().toISOString()
    };
    const updated = { 
      ...selectedApplicant, 
      notes: [note, ...selectedApplicant.notes] 
    };
    await handleUpdateApplicant(updated);
    setNewNote('');
  };

  const handleStatusChange = async (status: ApplicantStatus) => {
    if (!selectedApplicant) return;
    const updated = { ...selectedApplicant, status };
    await handleUpdateApplicant(updated);
  };

  const handleGenerateEmail = async (type: 'rejection' | 'interview') => {
    if (!selectedApplicant) return;
    setGeneratedEmail(null);
    setAnalyzing(true); // Reuse loading state
    const email = await generateEmail(selectedApplicant, type);
    setGeneratedEmail(email);
    setAnalyzing(false);
  };

  // Debounced update for text fields
  const handleFieldUpdate = (field: keyof Applicant, value: string) => {
    if (!selectedApplicant) return;
    const updated = { ...selectedApplicant, [field]: value };
    // Just update local state immediately for typing responsiveness
    setSelectedApplicant(updated);
  };
  
  // Actual save trigger on blur
  const saveChanges = async () => {
    if (selectedApplicant) {
        await handleUpdateApplicant(selectedApplicant);
    }
  }

  // Helper to extract Google Drive ID
  const getDriveEmbedUrl = (url: string) => {
      if (!url) return null;
      // Extract ID from standard drive URLs
      let id = '';
      const idMatch = url.match(/id=([a-zA-Z0-9_-]+)/);
      const dMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
      const openMatch = url.match(/open\?id=([a-zA-Z0-9_-]+)/);
      
      if (idMatch) id = idMatch[1];
      else if (dMatch) id = dMatch[1];
      else if (openMatch) id = openMatch[1];
      
      if (!id) return null;
      return `https://drive.google.com/file/d/${id}/preview`;
  };

  // --- Derived State ---
  const filteredApplicants = useMemo(() => {
    return applicants.filter(app => {
      const matchesSearch = 
        app.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || app.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [applicants, searchTerm, statusFilter]);

  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-900 dark:text-gray-100 bg-[#f8fafc] dark:bg-darkbg transition-colors duration-200">
      <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} isSyncing={syncing} analysisCount={analysisQueue.length} />

      <main className="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 h-[calc(100vh-80px)] overflow-hidden">
        {/* --- Main Content Area --- */}
        <div className="flex flex-col bg-white dark:bg-darksurface rounded-2xl shadow-sm border border-gray-200 dark:border-white/10 overflow-hidden relative transition-colors duration-200 h-full">

          {/* Candidates List */}
          {!selectedApplicant && (
            <div className="flex flex-col h-full">
              {/* Toolbar */}
              <div className="p-5 border-b border-gray-200 dark:border-white/10 flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-darksurface z-10 transition-colors">
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search candidates, skills..."
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-gray-900 dark:text-white placeholder-gray-400 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto">
                   <div className="flex items-center gap-2 border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 rounded-lg px-3 py-2">
                      <Filter className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <select 
                        className="text-sm bg-transparent focus:outline-none text-gray-700 dark:text-gray-200 font-medium"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as ApplicantStatus | 'All')}
                      >
                        <option value="All" className="dark:bg-black">All Statuses</option>
                        {Object.values(ApplicantStatus).map(s => (
                          <option key={s} value={s} className="dark:bg-black">{s}</option>
                        ))}
                      </select>
                   </div>
                   <button 
                    onClick={loadData}
                    className="p-2.5 bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300 transition-colors shadow-sm"
                    title="Sync with Google Sheet"
                   >
                     <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                   </button>
                </div>
              </div>

              {/* Table */}
              <div className="flex-1 overflow-auto relative bg-gray-50/30 dark:bg-black/20">
                {loading && (
                   <div className="absolute inset-0 bg-white/80 dark:bg-black/80 flex items-center justify-center z-10 backdrop-blur-sm">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <p className="mt-3 text-sm font-medium text-gray-600 dark:text-gray-300">Syncing with Sheets...</p>
                      </div>
                   </div>
                )}
                
                {filteredApplicants.length === 0 && !loading ? (
                   <div className="h-full flex items-center justify-center"><EmptyState /></div>
                ) : (
                <table className="w-full text-left border-separate border-spacing-0">
                  <thead className="bg-gray-50 dark:bg-black/40 sticky top-0 z-10 text-xs uppercase text-gray-500 dark:text-gray-400 font-bold tracking-wider shadow-sm transition-colors">
                    <tr>
                      <th className="px-6 py-4 border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-darksurface">Candidate</th>
                      <th className="px-6 py-4 border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-darksurface text-center">Tech Stack</th>
                      <th className="px-6 py-4 border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-darksurface">Experience & Cloud</th>
                      <th className="px-6 py-4 border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-darksurface">Availability & Rate</th>
                      <th className="px-6 py-4 border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-darksurface">Status</th>
                      <th className="px-6 py-4 border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-darksurface text-center">AI Score</th>
                      <th className="px-6 py-4 border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-darksurface"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-darksurface divide-y divide-gray-100 dark:divide-white/5">
                    {filteredApplicants.map(app => (
                      <tr 
                        key={app.id} 
                        className="hover:bg-yellow-50/50 dark:hover:bg-white/5 transition-colors cursor-pointer group relative"
                        onClick={() => setSelectedApplicant(app)}
                      >
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex items-center gap-4">
                            <div className="h-11 w-11 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 dark:from-white/10 dark:to-white/5 flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0 ring-2 ring-white dark:ring-black">
                                {app.fullName.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                {app.fullName}
                                {app.isFavorite && <Star className="h-3.5 w-3.5 text-primary fill-primary" />}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                {app.linkedin && (
                                  <a href={app.linkedin} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                    <Linkedin className="h-3.5 w-3.5" />
                                  </a>
                                )}
                                {app.github && (
                                  <a href={app.github} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                                    <Github className="h-3.5 w-3.5" />
                                  </a>
                                )}
                                {app.resumeUrl && (
                                   <a href={app.resumeUrl} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="text-gray-400 hover:text-primary dark:hover:text-primary transition-colors">
                                     <FileText className="h-3.5 w-3.5" />
                                   </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        
                        {/* Skills Matrix */}
                        <td className="px-6 py-5">
                           <div className="flex items-center justify-center gap-3">
                              <SkillDot label="TS" value={app.ratingTS} />
                              <SkillDot label="Node" value={app.ratingNode} />
                              <SkillDot label="React" value={app.ratingReact} />
                              <SkillDot label="SQL" value={app.ratingSQL} />
                              <SkillDot label="ETL" value={app.ratingETL} />
                           </div>
                           <div className="text-[10px] text-gray-400 dark:text-gray-500 text-center mt-1 font-bold tracking-wider">TS • ND • RE • DB • ET</div>
                        </td>

                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-1.5">
                             {/* Cloud Tags */}
                             <div className="flex flex-wrap gap-1">
                                {app.cloudProviders && app.cloudProviders.split(',').slice(0, 2).map((cloud, i) => (
                                   <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/5">
                                      <Server className="h-2.5 w-2.5 mr-1" />
                                      {cloud.trim()}
                                   </span>
                                ))}
                                {!app.cloudProviders && <span className="text-xs text-gray-400 italic">No cloud listed</span>}
                             </div>
                             <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[150px]" title={app.portfolio}>
                                {app.portfolio ? 'Has Portfolio Projects' : 'No Portfolio'}
                             </div>
                          </div>
                        </td>

                        <td className="px-6 py-5">
                           <div className="flex flex-col gap-1 max-w-[260px]">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-gray-300">
                                 <Briefcase className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                 <span className="truncate block whitespace-normal">{app.availability || 'Unknown'}</span>
                              </div>
                              <div className="flex items-start gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                 <DollarSign className="h-3.5 w-3.5 text-gray-400 shrink-0 mt-0.5" />
                                 <span className="whitespace-normal leading-snug">{app.compensation}</span>
                              </div>
                           </div>
                        </td>

                        <td className="px-6 py-5 whitespace-nowrap">
                          <StatusBadge status={app.status} />
                          <div className="text-[10px] text-gray-400 mt-1">
                             {new Date(app.timestamp).toLocaleDateString()}
                          </div>
                        </td>

                        <td className="px-6 py-5 text-center">
                           {app.aiAnalysis ? (
                              <div className="inline-flex flex-col items-center">
                                <span className={`text-lg font-bold ${app.aiAnalysis.rating >= 8 ? 'text-emerald-600 dark:text-emerald-400' : app.aiAnalysis.rating >= 6 ? 'text-primary dark:text-primary' : 'text-rose-500 dark:text-rose-400'}`}>
                                  {app.aiAnalysis.rating}
                                  <span className="text-xs text-gray-400 font-normal">/10</span>
                                </span>
                              </div>
                           ) : analyzingIds.has(app.id) ? (
                             <div className="inline-flex flex-col items-center gap-1">
                               <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                               <span className="text-[10px] text-primary font-bold">Analyzing</span>
                             </div>
                           ) : analysisQueue.includes(app.id) ? (
                             <div className="inline-flex flex-col items-center gap-1">
                               <Sparkles className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                               <span className="text-[10px] text-gray-400 font-medium">Queued</span>
                             </div>
                           ) : (
                             <span className="inline-block w-8 h-1 rounded bg-gray-200 dark:bg-gray-700"></span>
                           )}
                        </td>

                        <td className="px-6 py-5 text-right">
                          <ChevronRight className="h-5 w-5 text-gray-300 dark:text-gray-600 group-hover:text-primary dark:group-hover:text-primary transition-colors" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                )}
              </div>
            </div>
          )}

          {/* View: Detail */}
          {selectedApplicant && (
            <div className="flex h-full animate-in slide-in-from-right-4 duration-300">
              {/* Left Scrollable Detail */}
              <div className="flex-1 flex flex-col h-full border-r border-gray-200 dark:border-white/10 overflow-hidden bg-white dark:bg-darksurface transition-colors">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between bg-white dark:bg-darksurface sticky top-0 z-10 shadow-sm">
                   <div className="flex items-center gap-4">
                       <button 
                         onClick={() => setSelectedApplicant(null)}
                         className="flex items-center gap-1 text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors bg-gray-50 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-white/10"
                       >
                         <ChevronRight className="h-4 w-4 rotate-180" /> Back
                       </button>

                       {/* Tabs */}
                       <div className="flex bg-gray-100 dark:bg-white/5 rounded-lg p-1">
                          <button 
                            onClick={() => setDetailTab('profile')}
                            className={`px-3 py-1 rounded-md text-sm font-bold transition-all ${detailTab === 'profile' ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                          >
                            Profile
                          </button>
                          <button 
                            onClick={() => setDetailTab('resume')}
                            className={`px-3 py-1 rounded-md text-sm font-bold transition-all flex items-center gap-1.5 ${detailTab === 'resume' ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                          >
                            Resume <FileText className="h-3 w-3 opacity-60" />
                          </button>
                       </div>
                   </div>

                   <div className="flex gap-2">
                     <button onClick={() => handleUpdateApplicant({...selectedApplicant, isFavorite: !selectedApplicant.isFavorite})} className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors ${selectedApplicant.isFavorite ? 'text-primary bg-yellow-50 dark:bg-yellow-900/20' : 'text-gray-400 dark:text-gray-500'}`}>
                        <Star className={`h-5 w-5 ${selectedApplicant.isFavorite ? 'fill-current' : ''}`} />
                     </button>
                     {selectedApplicant.github && (
                         <a href={selectedApplicant.github} target="_blank" rel="noreferrer" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 dark:text-gray-500 hover:text-black dark:hover:text-white transition-colors" title="GitHub">
                            <Github className="h-5 w-5" />
                         </a>
                     )}
                     {selectedApplicant.linkedin && (
                         <a href={selectedApplicant.linkedin} target="_blank" rel="noreferrer" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 dark:text-gray-500 hover:text-blue-700 dark:hover:text-blue-400 transition-colors" title="LinkedIn">
                            <Linkedin className="h-5 w-5" />
                         </a>
                     )}
                   </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 scrollbar-thin">
                  {/* --- TAB: PROFILE --- */}
                  {detailTab === 'profile' && (
                    <>
                      {/* Header Info */}
                      <div className="flex justify-between items-start mb-8">
                        <div>
                          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{selectedApplicant.fullName}</h1>
                          <div className="text-gray-500 dark:text-gray-400 mt-2 flex flex-wrap gap-4 text-sm items-center font-medium">
                            <span className="flex items-center gap-1.5 bg-gray-50 dark:bg-white/5 px-2 py-1 rounded border border-gray-200 dark:border-white/5"><Mail className="h-3.5 w-3.5 text-gray-400"/> {selectedApplicant.email}</span>
                            <span className="flex items-center gap-1.5 bg-gray-50 dark:bg-white/5 px-2 py-1 rounded border border-gray-200 dark:border-white/5"><Phone className="h-3.5 w-3.5 text-gray-400"/> {selectedApplicant.phone}</span>
                            <span className="flex items-center gap-1.5 text-primary dark:text-primary bg-yellow-50 dark:bg-yellow-900/10 px-2 py-1 rounded border border-yellow-100 dark:border-yellow-800/30" title="Expected Compensation"><DollarSign className="h-3.5 w-3.5"/>{selectedApplicant.compensation} (Ask)</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <select 
                            value={selectedApplicant.status}
                            onChange={(e) => handleStatusChange(e.target.value as ApplicantStatus)}
                            className="bg-white dark:bg-darksurface border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5 font-bold shadow-sm w-40"
                          >
                            {Object.values(ApplicantStatus).map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                          <span className="text-xs text-gray-400">Applied: {new Date(selectedApplicant.timestamp).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Skills Grid */}
                      <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Self-Reported Skills</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
                          <RatingPill label="React / Frontend" value={selectedApplicant.ratingReact} />
                          <RatingPill label="Node.js / Backend" value={selectedApplicant.ratingNode} />
                          <RatingPill label="TypeScript" value={selectedApplicant.ratingTS} />
                          <RatingPill label="PostgreSQL" value={selectedApplicant.ratingSQL} />
                          <RatingPill label="ETL / Data" value={selectedApplicant.ratingETL} />
                          <RatingPill label="Cloud Platform" value={selectedApplicant.cloudProviders || 'None'} />
                      </div>

                      {/* Internal Recruitment Data */}
                      <div className="mb-10 bg-slate-50 dark:bg-white/5 p-6 rounded-2xl border border-slate-200 dark:border-white/5">
                        <h3 className="flex items-center gap-2 font-bold text-lg text-gray-900 dark:text-white mb-6">
                            <Briefcase className="h-5 w-5 text-primary" />
                            Internal Recruitment Data
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-1">
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Current CTC / Month</label>
                                <input 
                                  type="text" 
                                  value={selectedApplicant.currentCtc || ''}
                                  onChange={(e) => handleFieldUpdate('currentCtc', e.target.value)}
                                  onBlur={saveChanges}
                                  placeholder="e.g. 1.5 Lakhs"
                                  className="w-full bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Phone/WA</label>
                                <div className="flex gap-2">
                                    <input 
                                      type="text" 
                                      readOnly 
                                      value={selectedApplicant.phone}
                                      className="w-full bg-gray-100 dark:bg-black/50 border-none rounded-xl px-4 py-2.5 text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                    />
                                </div>
                            </div>
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Recruiter Comments (Syncs to Sheet)</label>
                                <textarea 
                                    value={selectedApplicant.sheetComments || ''}
                                    onChange={(e) => handleFieldUpdate('sheetComments', e.target.value)}
                                    onBlur={saveChanges}
                                    placeholder="Enter notes here..."
                                    className="w-full bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all min-h-[100px] resize-y leading-relaxed"
                                />
                            </div>
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Call Details / Logs</label>
                                <textarea 
                                    value={selectedApplicant.callDetails || ''}
                                    onChange={(e) => handleFieldUpdate('callDetails', e.target.value)}
                                    onBlur={saveChanges}
                                    placeholder="Log call details, interview feedback summary..."
                                    className="w-full bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all min-h-[100px] resize-y leading-relaxed"
                                />
                            </div>
                        </div>
                      </div>

                      {/* Gemini Analysis Section */}
                      <div className="mb-10 p-1 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-2xl shadow-sm">
                        <div className="bg-white dark:bg-darksurface rounded-[14px] p-6 transition-colors">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="flex items-center gap-2 font-bold text-lg text-gray-900 dark:text-white">
                                <Sparkles className="h-5 w-5 text-primary" />
                                AI Candidate Assessment
                                </h3>
                                {selectedApplicant.aiAnalysis && (
                                <button
                                    onClick={() => handleAnalyze(selectedApplicant)}
                                    disabled={analyzing || analyzingIds.has(selectedApplicant.id)}
                                    className="text-xs bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 px-3 py-1.5 rounded-lg font-bold hover:bg-gray-200 dark:hover:bg-white/10 transition-all disabled:opacity-50 flex items-center gap-2"
                                >
                                    <RefreshCw className={`h-3 w-3 ${analyzing ? 'animate-spin' : ''}`}/>
                                    Regenerate
                                </button>
                                )}
                            </div>

                            {selectedApplicant.aiAnalysis ? (
                            <div className="space-y-6">
                                <div className="bg-yellow-50/50 dark:bg-yellow-900/10 p-5 rounded-xl border border-yellow-100 dark:border-yellow-800/30">
                                    <div className="flex items-start gap-4">
                                        <div className={`text-2xl font-bold p-3 rounded-lg border bg-white dark:bg-black ${selectedApplicant.aiAnalysis.rating >= 7 ? 'text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50' : 'text-primary dark:text-primary border-yellow-100 dark:border-yellow-900/50'}`}>
                                            {selectedApplicant.aiAnalysis.rating}
                                            <span className="text-xs text-gray-400 block font-normal text-center">/10</span>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 dark:text-white mb-1">Executive Summary</h4>
                                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm">{selectedApplicant.aiAnalysis.summary}</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <CheckCircle className="h-4 w-4"/> Key Strengths
                                    </span>
                                    <ul className="space-y-2">
                                    {selectedApplicant.aiAnalysis.strengths.map((s, i) => (
                                        <li key={i} className="text-sm text-gray-700 dark:text-gray-300 bg-emerald-50/50 dark:bg-emerald-900/10 px-3 py-2 rounded-lg border border-emerald-100/50 dark:border-emerald-800/20 flex items-start gap-2">
                                        <span className="text-emerald-500 dark:text-emerald-400 mt-0.5">•</span> {s}
                                        </li>
                                    ))}
                                    </ul>
                                </div>
                                <div className="space-y-3">
                                    <span className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <XCircle className="h-4 w-4"/> Potential Concerns
                                    </span>
                                    <ul className="space-y-2">
                                    {selectedApplicant.aiAnalysis.weaknesses.map((w, i) => (
                                        <li key={i} className="text-sm text-gray-700 dark:text-gray-300 bg-rose-50/50 dark:bg-rose-900/10 px-3 py-2 rounded-lg border border-rose-100/50 dark:border-rose-800/20 flex items-start gap-2">
                                        <span className="text-rose-500 dark:text-rose-400 mt-0.5">•</span> {w}
                                        </li>
                                    ))}
                                    </ul>
                                </div>
                                </div>

                                <div className="pt-6 border-t border-gray-100 dark:border-white/10">
                                    <span className="text-xs font-bold text-primary dark:text-primary uppercase tracking-wider flex items-center gap-1.5 mb-3">
                                        Suggested Interview Questions
                                    </span>
                                    <ul className="space-y-3">
                                    {selectedApplicant.aiAnalysis.suggestedQuestions.map((q, i) => (
                                        <li key={i} className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-black px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 italic border-l-4 border-l-primary">
                                        "{q}"
                                        </li>
                                    ))}
                                    </ul>
                                </div>
                            </div>
                            ) : analyzingIds.has(selectedApplicant.id) ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-primary/30 dark:border-primary/20 rounded-xl bg-yellow-50/30 dark:bg-yellow-900/5">
                                <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                                <p className="text-primary dark:text-primary font-bold">Analyzing Candidate...</p>
                                <p className="text-gray-400 dark:text-gray-500 text-sm max-w-sm mt-1">AI is evaluating their self-ratings against their technical scenario answers.</p>
                            </div>
                            ) : analysisQueue.includes(selectedApplicant.id) ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl">
                                <div className="flex items-center gap-2 mb-3">
                                  <Sparkles className="h-6 w-6 text-primary animate-pulse" />
                                  <Clock className="h-5 w-5 text-gray-400" />
                                </div>
                                <p className="text-gray-500 dark:text-gray-400 font-bold">Queued for Analysis</p>
                                <p className="text-gray-400 dark:text-gray-500 text-sm max-w-sm mt-1">This candidate is in the analysis queue and will be processed automatically.</p>
                                <div className="mt-4 text-xs text-gray-400">
                                  Position in queue: {analysisQueue.indexOf(selectedApplicant.id) + 1} of {analysisQueue.length}
                                </div>
                            </div>
                            ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl">
                                <Sparkles className="h-8 w-8 text-gray-300 dark:text-gray-600 mb-3" />
                                <p className="text-gray-500 dark:text-gray-400 font-bold">Analysis Pending</p>
                                <p className="text-gray-400 dark:text-gray-500 text-sm max-w-sm mt-1">AI analysis will be generated automatically. Refresh to trigger analysis.</p>
                                <button
                                    onClick={() => {
                                      if (!analysisQueue.includes(selectedApplicant.id)) {
                                        setAnalysisQueue(prev => [...prev, selectedApplicant.id]);
                                      }
                                    }}
                                    className="mt-4 text-sm text-primary font-bold hover:underline flex items-center gap-1"
                                >
                                    <Sparkles className="h-3 w-3" /> Queue for Analysis
                                </button>
                            </div>
                            )}
                        </div>
                      </div>

                      {/* Technical Scenarios Details */}
                      <div className="space-y-8">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-200 dark:border-white/10 pb-3">
                          <Code className="h-5 w-5 text-gray-400" />
                          Technical Screen Responses
                        </h3>

                        <div className="grid gap-6">
                          <div className="bg-white dark:bg-black p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm relative overflow-hidden group transition-colors">
                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                            <div className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                              <Database className="h-4 w-4" /> Data Ingestion Strategy
                            </div>
                            <p className="text-sm text-gray-800 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{selectedApplicant.scenarioIngestion || 'No response provided.'}</p>
                          </div>

                          <div className="bg-white dark:bg-black p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm relative overflow-hidden group transition-colors">
                            <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
                            <div className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                              <Server className="h-4 w-4" /> Database Isolation (RLS vs Logical)
                            </div>
                            <p className="text-sm text-gray-800 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{selectedApplicant.scenarioIsolation || 'No response provided.'}</p>
                          </div>

                          <div className="bg-white dark:bg-black p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm relative overflow-hidden group transition-colors">
                            <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
                            <div className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                              <LayoutDashboard className="h-4 w-4" /> State Management Architecture
                            </div>
                            <p className="text-sm text-gray-800 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{selectedApplicant.scenarioState || 'No response provided.'}</p>
                          </div>
                        </div>

                        {/* Email Generation */}
                        <section className="pt-8 border-t border-gray-200 dark:border-white/10">
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                              <Mail className="h-5 w-5 text-gray-400" />
                              Communication Helper
                          </h3>
                          <div className="flex gap-4 mb-6">
                              <button 
                                onClick={() => handleGenerateEmail('interview')}
                                disabled={analyzing}
                                className="flex-1 bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-4 py-3 rounded-xl text-sm font-bold hover:bg-gray-50 dark:hover:bg-white/5 hover:border-gray-400 transition-all shadow-sm active:translate-y-0.5"
                              >
                                Draft Interview Invite
                              </button>
                              <button 
                                onClick={() => handleGenerateEmail('rejection')}
                                disabled={analyzing}
                                className="flex-1 bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-4 py-3 rounded-xl text-sm font-bold hover:bg-gray-50 dark:hover:bg-white/5 hover:border-gray-400 transition-all shadow-sm active:translate-y-0.5"
                              >
                                Draft Rejection Email
                              </button>
                          </div>
                          
                          {generatedEmail && (
                            <div className="bg-gray-50 dark:bg-black/50 p-6 rounded-xl border border-gray-200 dark:border-white/10 animate-in fade-in slide-in-from-top-4 duration-500 shadow-inner">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Generated Draft</span>
                                    <button 
                                    onClick={() => navigator.clipboard.writeText(generatedEmail)}
                                    className="text-xs text-primary dark:text-primary font-bold hover:text-yellow-600 flex items-center gap-1"
                                    >
                                    Copy
                                    </button>
                                </div>
                                <textarea 
                                  className="w-full bg-transparent border-none p-0 text-sm text-gray-700 dark:text-gray-300 focus:ring-0 resize-y min-h-[200px] font-mono leading-relaxed" 
                                  value={generatedEmail} 
                                  readOnly
                                />
                            </div>
                          )}
                        </section>
                      </div>
                    </>
                  )}

                  {/* --- TAB: RESUME --- */}
                  {detailTab === 'resume' && (
                    <div className="h-full flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                             <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                               <FileText className="h-5 w-5 text-primary" /> 
                               Resume & Portfolio Viewer
                             </h2>
                             {selectedApplicant.resumeUrl && (
                               <a 
                                 href={selectedApplicant.resumeUrl} 
                                 target="_blank" 
                                 rel="noreferrer"
                                 className="text-sm text-primary dark:text-primary hover:underline flex items-center gap-1"
                               >
                                 Open in Drive <ExternalLink className="h-3.5 w-3.5" />
                               </a>
                             )}
                        </div>

                        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 h-full pb-10">
                            {/* PDF Viewer / Embed */}
                            <div className="flex flex-col bg-gray-100 dark:bg-black rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-inner h-[600px] lg:h-auto">
                                {getDriveEmbedUrl(selectedApplicant.resumeUrl) ? (
                                    <iframe 
                                      src={getDriveEmbedUrl(selectedApplicant.resumeUrl)!} 
                                      className="w-full h-full border-0"
                                      title="Resume Preview"
                                      allow="autoplay"
                                    ></iframe>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 p-8 text-center">
                                       <FileSearch className="h-12 w-12 mb-4 opacity-50" />
                                       <p className="font-bold">No Preview Available</p>
                                       <p className="text-xs mt-2 max-w-xs">The resume URL might be invalid or permissions are restricted. Try opening the link directly.</p>
                                       {selectedApplicant.resumeUrl && (
                                         <a 
                                           href={selectedApplicant.resumeUrl}
                                           target="_blank"
                                           rel="noreferrer"
                                           className="mt-4 px-4 py-2 bg-primary text-black rounded-lg text-sm font-bold hover:bg-yellow-400 transition-colors"
                                         >
                                           Open Link
                                         </a>
                                       )}
                                    </div>
                                )}
                            </div>

                            {/* Resume Analysis */}
                            <div className="flex flex-col gap-4 h-full">
                                <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-0.5 rounded-xl shadow-sm flex-1 flex flex-col max-h-[calc(100vh-300px)]">
                                    <div className="bg-white dark:bg-darksurface rounded-[10px] flex flex-col h-full overflow-hidden">
                                        <div className="p-4 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50 dark:bg-black">
                                            <span className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
                                                <Sparkles className="h-4 w-4 text-primary" />
                                                Resume Overview
                                            </span>
                                            <button 
                                              onClick={() => handleResumeAnalysis(selectedApplicant)}
                                              disabled={resumeAnalyzing}
                                              className="text-xs bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-md font-bold transition-colors shadow-sm"
                                            >
                                               {resumeAnalyzing ? 'Generating...' : 'Refresh Summary'}
                                            </button>
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
                                           {selectedApplicant.aiAnalysis?.resumeSummary ? (
                                              <div className="prose prose-sm prose-yellow dark:prose-invert max-w-none">
                                                  <div className="whitespace-pre-wrap">{selectedApplicant.aiAnalysis.resumeSummary}</div>
                                              </div>
                                           ) : (
                                              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                                                 <Sparkles className="h-8 w-8 text-gray-300 dark:text-gray-600 mb-3" />
                                                 <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    Generate an AI summary of the candidate's profile and technical background.
                                                 </p>
                                                 <button 
                                                    onClick={() => handleResumeAnalysis(selectedApplicant)}
                                                    className="mt-4 text-sm text-primary dark:text-primary font-bold hover:underline"
                                                 >
                                                    Generate Overview
                                                 </button>
                                              </div>
                                           )}
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Manual Text Input Fallback */}
                                <div className="bg-white dark:bg-darksurface border border-gray-200 dark:border-white/10 rounded-xl p-4 shadow-sm shrink-0">
                                   <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">
                                     Paste Resume Text (Optional for deeper analysis)
                                   </label>
                                   <div className="relative">
                                      <textarea 
                                        value={manualResumeText}
                                        onChange={(e) => setManualResumeText(e.target.value)}
                                        placeholder="Paste raw text here if the file isn't readable..."
                                        className="w-full text-xs bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-lg p-3 pr-10 min-h-[80px] focus:ring-1 focus:ring-primary focus:border-primary text-gray-800 dark:text-gray-300"
                                      />
                                      <button 
                                        className="absolute bottom-2 right-2 p-1.5 bg-gray-200 dark:bg-white/10 rounded hover:bg-gray-300 dark:hover:bg-white/20 text-gray-600 dark:text-gray-400 transition-colors"
                                        title="Analyze Text"
                                        onClick={() => handleResumeAnalysis(selectedApplicant)}
                                      >
                                         <Sparkles className="h-3 w-3" />
                                      </button>
                                   </div>
                                </div>
                            </div>
                        </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Sidebar: Notes (Consistent across tabs) */}
              <div className="w-96 bg-gray-50 dark:bg-black border-l border-gray-200 dark:border-white/10 flex flex-col h-full shadow-[inset_10px_0_20px_-10px_rgba(0,0,0,0.02)] transition-colors">
                <div className="p-4 border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black font-bold text-gray-900 dark:text-white flex justify-between items-center">
                  <span>Team Chat / Notes</span>
                  <span className="text-xs bg-gray-200 dark:bg-white/10 px-2.5 py-1 rounded-full text-gray-600 dark:text-gray-400 font-bold">{selectedApplicant.notes.length}</span>
                </div>
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {selectedApplicant.notes.length === 0 ? (
                    <div className="text-center text-gray-400 dark:text-gray-600 text-sm py-10 flex flex-col items-center">
                        <MessageSquare className="h-8 w-8 mb-2 opacity-20" />
                        No team notes yet. <br/>Start the discussion!
                    </div>
                  ) : (
                    selectedApplicant.notes.map(note => (
                      <div key={note.id} className="bg-white dark:bg-darksurface p-4 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm text-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-bold text-gray-900 dark:text-white text-xs">{note.author}</span>
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-1 bg-gray-50 dark:bg-white/5 px-1.5 py-0.5 rounded">
                             <Clock className="h-2.5 w-2.5" />
                             {new Date(note.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{note.text}</p>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-5 bg-white dark:bg-darksurface border-t border-gray-200 dark:border-white/10 transition-colors">
                  <div className="relative">
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Add a team note..."
                      className="w-full border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black rounded-xl p-3 pr-10 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary focus:bg-white dark:focus:bg-black text-gray-900 dark:text-white transition-all resize-none h-24 placeholder:text-gray-400"
                    />
                    <button 
                      onClick={handleAddNote}
                      disabled={!newNote.trim()}
                      className="absolute bottom-3 right-3 p-2 bg-primary text-black rounded-lg hover:bg-yellow-400 disabled:opacity-50 disabled:hover:bg-primary transition-colors shadow-sm"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}