
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { fetchDiveLogs } from './services/sheetService';
import { DiveLog } from './types';
import DiveCard from './components/DiveCard';
import AiSummary from './components/AiSummary';
import { 
  Calendar, 
  Search, 
  Database, 
  Anchor, 
  ChevronDown,
  Loader2,
  AlertCircle,
  ExternalLink,
  Info,
  RefreshCw
} from 'lucide-react';

const LOGO_URL = 'https://input-file-0.png'; 

const App: React.FC = () => {
  const [allDives, setAllDives] = useState<DiveLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  
  // Track if this is the first load to auto-select the latest date
  const isFirstLoad = useRef(true);

  const loadData = useCallback(async (showLoadingUI = true) => {
    try {
      if (showLoadingUI) {
        if (isFirstLoad.current) setLoading(true);
        else setRefreshing(true);
      }
      
      setError(null);
      const data = await fetchDiveLogs();
      
      if (data.length === 0) {
        setError('No dive logs found in the sheet.');
      } else {
        setAllDives(data);
        
        // Auto-select the latest date ONLY on the very first load
        if (isFirstLoad.current) {
          const latestDate = data[0]?.date || '';
          setSelectedDate(latestDate);
          isFirstLoad.current = false;
        }
      }
    } catch (err: any) {
      console.error("Data load error:", err);
      // Only show error UI if we don't already have data
      if (allDives.length === 0) {
        setError(err.message || 'Failed to connect to the Google Sheet.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [allDives.length]);

  // Initial load
  useEffect(() => {
    loadData(true);
  }, []); // Run once on mount

  // Automatic Polling: Check for updates every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      console.log("Checking for new dive data...");
      loadData(false); // Background update (don't show big spinners)
    }, 60000); 

    return () => clearInterval(interval);
  }, [loadData]);

  const uniqueDates = useMemo(() => {
    const dates = allDives.map(d => d.date);
    return Array.from(new Set(dates)).sort((a, b) => {
      try {
        return new Date(b).getTime() - new Date(a).getTime();
      } catch {
        return 0;
      }
    });
  }, [allDives]);

  const filteredDives = useMemo(() => {
    return allDives.filter(d => d.date === selectedDate);
  }, [allDives, selectedDate]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 size={40} className="animate-spin text-[#004aad]" />
        <div className="text-center px-4">
          <h2 className="text-xl font-bold text-slate-800 tracking-tight text-[#004aad]">Syncing Logbook...</h2>
          <p className="text-slate-500 mt-1 italic font-medium">Connecting to Google Sheet...</p>
        </div>
      </div>
    );
  }

  if (error && allDives.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-lg w-full text-center border border-slate-200">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mx-auto mb-6">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Data Connection Issue</h2>
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-8 text-left">
            <p className="text-red-700 font-semibold text-sm mb-1 uppercase tracking-wider flex items-center gap-2">
              <Info size={14} /> Error Message
            </p>
            <p className="text-red-600 text-sm leading-relaxed">{error}</p>
          </div>
          <button 
            onClick={() => { isFirstLoad.current = true; loadData(true); }}
            className="w-full py-4 bg-[#004aad] text-white font-bold rounded-2xl hover:opacity-90 transition-all shadow-lg active:scale-[0.98]"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 backdrop-blur-md bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-28">
            <div className="flex items-center gap-4">
              <img src={LOGO_URL} alt="Dive Buddies Logo" className="h-20 w-auto object-contain py-2" />
              <div className="hidden sm:block border-l border-slate-200 pl-4">
                <h1 className="text-lg font-black text-[#004aad] tracking-tighter leading-none">DASHBOARD</h1>
                <p className="text-[9px] uppercase tracking-[0.3em] text-slate-400 font-black mt-1">Analytics Engine</p>
              </div>
            </div>
            
            <div className="hidden md:flex items-center gap-6">
               <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Dives</p>
                  <p className="text-xl font-black text-slate-900 leading-none">{allDives.length}</p>
               </div>
               <div className="w-px h-10 bg-slate-200" />
               <div className="flex items-center gap-2">
                  <button 
                    onClick={() => loadData(true)}
                    disabled={refreshing}
                    className="flex items-center gap-3 px-4 py-2 bg-blue-50/50 rounded-2xl border border-blue-100 hover:bg-blue-100 transition-all disabled:opacity-50 group"
                  >
                    <div className="relative">
                      <RefreshCw size={16} className={`text-[#004aad] ${refreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                    </div>
                    <span className="text-[10px] font-bold text-[#004aad] uppercase tracking-widest">
                      {refreshing ? 'Syncing...' : 'Sync Logs'}
                    </span>
                  </button>
                  <div className="flex items-center gap-2 px-3 py-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${refreshing ? 'bg-blue-400 animate-ping' : 'bg-green-500 animate-pulse'} shadow-[0_0_8px_rgba(34,197,94,0.4)]`} />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Live Feed</span>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h2 className="text-5xl font-black text-slate-900 mb-3 tracking-tighter">Dive Explorer</h2>
            <div className="flex items-center gap-2 text-[#004aad] font-bold bg-blue-50 px-5 py-2 rounded-full w-fit shadow-sm border border-blue-100/50">
              <Calendar size={14} />
              <span className="text-xs uppercase tracking-[0.1em]">{selectedDate || 'No date selected'}</span>
            </div>
          </div>

          <div className="relative w-full md:w-auto group">
            <label className="block text-[10px] uppercase font-black text-slate-400 mb-2 ml-1 tracking-[0.2em]">Select Log Date</label>
            <div className="relative">
              <select 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="appearance-none w-full md:w-80 bg-white border-2 border-slate-100 text-slate-900 font-bold py-4 px-6 pr-14 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-[#004aad] transition-all shadow-sm cursor-pointer hover:border-slate-200"
              >
                <option value="" disabled>Select an entry date...</option>
                {uniqueDates.map(date => (
                  <option key={date} value={date}>{date}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-5 pointer-events-none text-slate-400 group-hover:text-[#004aad] transition-colors">
                <ChevronDown size={24} strokeWidth={3} />
              </div>
            </div>
          </div>
        </div>

        {filteredDives.length > 0 && (
          <AiSummary dives={filteredDives} date={selectedDate} />
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {[
            { label: 'Dives Recorded', value: filteredDives.length, color: 'text-slate-900' },
            { 
              label: 'Average Depth', 
              value: `${(filteredDives.reduce((acc, curr) => acc + parseFloat(curr.avgDepth.replace(/[^\d.]/g, '') || '0'), 0) / (filteredDives.length || 1)).toFixed(1)}m`,
              color: 'text-[#004aad]'
            },
            { 
              label: 'Max Depth', 
              value: `${Math.max(...filteredDives.map(d => parseFloat(d.maxDepth.replace(/[^\d.]/g, '') || '0')), 0)}m`,
              color: 'text-blue-700'
            },
            { 
              label: 'Water Temp', 
              value: `${(filteredDives.reduce((acc, curr) => acc + parseFloat(curr.waterTemp.replace(/[^\d.]/g, '') || '0'), 0) / (filteredDives.length || 1)).toFixed(1)}°C`,
              color: 'text-orange-500'
            }
          ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:border-[#004aad]/30 transition-all hover:shadow-md">
              <p className="text-[10px] uppercase font-black text-slate-400 mb-1.5 tracking-widest">{stat.label}</p>
              <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDives.map((dive, index) => (
            <DiveCard key={`${dive.date}-${index}`} dive={dive} />
          ))}
          
          {filteredDives.length === 0 && selectedDate && (
            <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mx-auto mb-6">
                <Search size={48} strokeWidth={1.5} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Zero Entries Found</h3>
              <p className="text-slate-500 max-w-xs mx-auto mt-2 leading-relaxed font-medium">No dive buddies logged their bubbles for this date yet.</p>
            </div>
          )}
        </div>
      </main>

      <footer className="mt-24 border-t border-slate-100 py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <img src={LOGO_URL} alt="Dive Buddies Logo" className="h-16 w-auto object-contain mx-auto mb-8 opacity-40 hover:opacity-100 transition-opacity grayscale hover:grayscale-0" />
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-[1px] w-8 bg-slate-200" />
            <span className="font-black text-[9px] tracking-[0.5em] uppercase text-slate-400">Logbook Intelligence</span>
            <div className="h-[1px] w-8 bg-slate-200" />
          </div>
          <p className="text-slate-500 text-sm font-bold tracking-tight">Dive Buddies Dashboard &copy; {new Date().getFullYear()}</p>
          <div className="flex flex-wrap items-center justify-center gap-6 mt-8">
            <span className="text-slate-400 text-[10px] font-black tracking-widest uppercase flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
              Gemini AI
            </span>
            <span className="text-slate-400 text-[10px] font-black tracking-widest uppercase flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
              Auto-Sync Active
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
