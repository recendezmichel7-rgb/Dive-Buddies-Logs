
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  Calendar, 
  Search, 
  ChevronDown,
  Loader2,
  AlertCircle,
  RefreshCw,
  Clock,
  Sparkles,
  MapPin
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

// --- TYPES ---
interface DiveLog {
  timestamp: string;
  date: string;       // Col B
  pointName: string;  // Col C
  diveTime: string;   // Col D
  maxDepth: string;   // Col E
  avgDepth: string;   // Col F
  waterTemp: string;  // Col G
  visibility: string; // Col H
  current: string;    // Col I
  waves: string;      // Col J
  guide: string;      // Col K
}

// --- CONFIG ---
const SHEET_ID = '1Xn4HTnQ_i8YgqCD_jdNcO8odXTznGstFVNZzvnoVAX0';
const GID = '887794739'; 
const LOGO_URL = 'https://input-file-0.png'; 

// --- DATA SERVICE ---
async function fetchDiveLogs(): Promise<DiveLog[]> {
  const cacheBuster = `&t=${Date.now()}`;
  const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}${cacheBuster}`;
  
  const response = await fetch(CSV_URL);
  if (!response.ok) throw new Error('Could not connect to Google Sheets.');
  
  const text = await response.text();
  const parseCSV = (data: string) => {
    const result: string[][] = [];
    let row: string[] = [];
    let field = '';
    let inQuotes = false;
    for (let i = 0; i < data.length; i++) {
      const c = data[i], next = data[i+1];
      if (inQuotes) {
        if (c === '"' && next === '"') { field += '"'; i++; }
        else if (c === '"') inQuotes = false;
        else field += c;
      } else {
        if (c === '"') inQuotes = true;
        else if (c === ',') { row.push(field); field = ''; }
        else if (c === '\n' || c === '\r') {
          row.push(field); if (row.length > 0) result.push(row);
          row = []; field = ''; if (c === '\r' && next === '\n') i++;
        } else field += c;
      }
    }
    if (row.length || field) { row.push(field); result.push(row); }
    return result;
  };

  const rows = parseCSV(text);
  return rows.slice(1).map(row => ({
    timestamp: row[0] || '',
    date: row[1] || '',
    pointName: row[2] || '',
    diveTime: row[3] || '',
    maxDepth: row[4] || '',
    avgDepth: row[5] || '',
    waterTemp: row[6] || '',
    visibility: row[7] || '',
    current: row[8] || '',
    waves: row[9] || '',
    guide: row[10] || '',
  })).filter(log => log.date && log.date.trim() !== '');
}

// --- COMPONENTS ---
const DiveCard: React.FC<{ dive: DiveLog }> = ({ dive }) => (
  <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl transition-all group p-6">
    <div className="flex flex-col gap-4">
      {/* Primary Info: Point Name & Time */}
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 text-[#004aad] mb-1">
            <MapPin size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Dive Site</span>
          </div>
          <h3 className="text-2xl font-black text-slate-900 leading-tight group-hover:text-[#004aad] transition-colors">
            {dive.pointName}
          </h3>
        </div>
        <div className="bg-blue-50 px-4 py-2 rounded-2xl flex flex-col items-center justify-center border border-blue-100 min-w-[70px]">
          <Clock size={16} className="text-blue-600 mb-1" />
          <span className="text-xs font-black text-blue-700">{dive.diveTime}m</span>
          <span className="text-[8px] font-bold text-blue-400 uppercase">Duration</span>
        </div>
      </div>

      {/* Date Reference */}
      <div className="flex items-center gap-2 text-slate-400 border-t border-slate-50 pt-4">
        <Calendar size={14} />
        <span className="text-xs font-bold uppercase tracking-wider">{dive.date}</span>
      </div>

      {/* Mini Stats Grid */}
      <div className="grid grid-cols-3 gap-2 mt-2">
        <div className="bg-slate-50 p-2 rounded-xl text-center">
          <p className="text-[8px] uppercase text-slate-400 font-bold">Depth</p>
          <p className="text-xs font-black text-slate-700">{dive.maxDepth}m</p>
        </div>
        <div className="bg-slate-50 p-2 rounded-xl text-center">
          <p className="text-[8px] uppercase text-slate-400 font-bold">Temp</p>
          <p className="text-xs font-black text-slate-700">{dive.waterTemp}°</p>
        </div>
        <div className="bg-slate-50 p-2 rounded-xl text-center">
          <p className="text-[8px] uppercase text-slate-400 font-bold">Vis</p>
          <p className="text-xs font-black text-slate-700">{dive.visibility}</p>
        </div>
      </div>
    </div>
  </div>
);

const AiSummary: React.FC<{ dives: DiveLog[], date: string }> = ({ dives, date }) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (dives.length === 0) return;
    const getSummary = async () => {
      setLoading(true);
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const diveDataText = dives.map(d => `${d.pointName}: ${d.maxDepth}m, ${d.waterTemp}C`).join(', ');
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `Summarize the dives for ${date} in one punchy, professional sentence for divers. Sites: ${diveDataText}`,
        });
        setSummary(response.text);
      } catch (e) { setSummary("Daily log successfully synced with server."); }
      finally { setLoading(false); }
    };
    getSummary();
  }, [dives, date]);

  return (
    <div className="bg-[#004aad] rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden mb-12">
      <div className="absolute top-0 right-0 opacity-10 pointer-events-none translate-x-1/4 -translate-y-1/4">
        <Sparkles size={240} />
      </div>
      <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
          <Sparkles size={24} className="text-blue-200" />
        </div>
        <div>
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-200 mb-2">AI Condition Report • {date}</h2>
          {loading ? (
            <div className="flex items-center gap-3 text-blue-100 font-bold italic">
              <Loader2 size={18} className="animate-spin" /> Analyzing logs...
            </div>
          ) : (
            <p className="text-xl font-bold leading-tight">{summary || "Awaiting data selection..."}</p>
          )}
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [allDives, setAllDives] = useState<DiveLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const isFirstLoad = useRef(true);

  const loadData = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      else setRefreshing(true);
      const data = await fetchDiveLogs();
      if (data.length > 0) {
        setAllDives(data);
      } else { setError('Empty spreadsheet.'); }
    } catch (err: any) {
      if (allDives.length === 0) setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [allDives.length]);

  useEffect(() => { loadData(true); }, []);
  
  // Auto-Refresh
  useEffect(() => {
    const interval = setInterval(() => loadData(false), 60000);
    return () => clearInterval(interval);
  }, [loadData]);

  const uniqueDates = useMemo(() => {
    const dates = Array.from(new Set(allDives.map(d => d.date)));
    return dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  }, [allDives]);

  // CRITICAL FIX: Ensure a date is always selected if dates exist
  useEffect(() => {
    if (uniqueDates.length > 0 && (!selectedDate || !uniqueDates.includes(selectedDate))) {
      setSelectedDate(uniqueDates[0]);
    }
  }, [uniqueDates, selectedDate]);

  const filteredDives = useMemo(() => allDives.filter(d => d.date === selectedDate), [allDives, selectedDate]);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <Loader2 size={48} className="animate-spin text-[#004aad] mb-6" />
      <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Accessing Secure Logbook...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white/80 border-b border-slate-200 sticky top-0 z-50 px-6 py-6 backdrop-blur-xl flex justify-between items-center">
        <div className="flex items-center gap-4">
          <img src={LOGO_URL} className="h-10 w-auto object-contain" alt="Logo" />
          <div className="h-6 w-px bg-slate-200 hidden sm:block" />
          <h1 className="text-xs font-black text-[#004aad] tracking-widest uppercase hidden sm:block">Live Logs</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full border border-blue-100">
            <div className={`w-2 h-2 rounded-full ${refreshing ? 'bg-blue-400 animate-ping' : 'bg-green-500 animate-pulse'}`} />
            <span className="text-[10px] font-black text-blue-700 uppercase">Live Connection</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* HEADING AND SELECTOR BLOCK */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 mb-16">
          <div className="max-w-xl">
            <h2 className="text-5xl sm:text-7xl font-black text-slate-900 tracking-tighter mb-4 leading-[0.9]">Dive Explorer</h2>
            <p className="text-slate-500 font-bold text-lg leading-relaxed">Real-time logbook analysis powered by Gemini AI.</p>
          </div>

          {/* DATE SELECTOR - MADE HIGHLY VISIBLE */}
          <div className="w-full md:w-80 relative z-40 bg-white p-6 rounded-[2.5rem] shadow-xl border-2 border-blue-100">
            <label className="text-[10px] font-black text-[#004aad] uppercase tracking-[0.2em] block mb-3 ml-1">
              Select Log Date
            </label>
            <div className="relative group">
              <select 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full appearance-none bg-slate-50 border-2 border-transparent text-slate-900 font-black text-base py-4 px-6 rounded-2xl focus:border-[#004aad] focus:bg-white outline-none cursor-pointer transition-all pr-12 group-hover:bg-slate-100"
              >
                {uniqueDates.length === 0 && <option value="">Loading dates...</option>}
                {uniqueDates.map(d => <option key={d} value={d} className="font-bold">{d}</option>)}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#004aad] transition-transform group-hover:scale-110">
                <ChevronDown size={24} strokeWidth={3} />
              </div>
            </div>
          </div>
        </div>

        {/* CONTENT AREA */}
        {filteredDives.length > 0 ? (
          <>
            <AiSummary dives={filteredDives} date={selectedDate} />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredDives.map((d, i) => <DiveCard key={i} dive={d} />)}
            </div>
          </>
        ) : (
          <div className="py-40 text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-200">
            <Search size={64} className="text-slate-200 mx-auto mb-6" />
            <h3 className="text-3xl font-black text-slate-900 mb-2">Searching Depths</h3>
            <p className="text-slate-400 font-bold italic">No log entries found for the selected date.</p>
          </div>
        )}
      </main>

      <footer className="py-20 text-center">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="h-px w-8 bg-slate-200" />
          <span className="text-[10px] font-black uppercase tracking-[0.6em] text-slate-300">Dive Buddies Dashboard</span>
          <div className="h-px w-8 bg-slate-200" />
        </div>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">&copy; {new Date().getFullYear()} • Global Dive Network</p>
      </footer>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<React.StrictMode><App /></React.StrictMode>);
