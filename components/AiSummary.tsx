
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { DiveLog } from '../types';
import { Sparkles, Loader2 } from 'lucide-react';

interface AiSummaryProps {
  dives: DiveLog[];
  date: string;
}

const AiSummary: React.FC<AiSummaryProps> = ({ dives, date }) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (dives.length === 0) return;

    const getSummary = async () => {
      setLoading(true);
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const diveDataText = dives.map(d => 
          `Location: ${d.pointName}, Depth: ${d.maxDepth}m, Temp: ${d.waterTemp}C, Vis: ${d.visibility}, Conditions: ${d.current} current, ${d.waves} waves.`
        ).join('\n');

        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `Analyze these scuba dive logs for ${date} and provide a professional, concise summary of the day's conditions, safety notes, and what divers likely experienced. 
          Use 2-3 short sentences.
          
          Data:
          ${diveDataText}`,
        });

        setSummary(response.text);
      } catch (error) {
        console.error("AI Analysis failed", error);
        setSummary("Dive summary currently unavailable.");
      } finally {
        setLoading(false);
      }
    };

    getSummary();
  }, [dives, date]);

  return (
    <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden mb-8">
      <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
        <Sparkles size={120} />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={18} className="text-blue-200" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-blue-100">AI Dive Intelligence</h2>
        </div>
        
        {loading ? (
          <div className="flex items-center gap-3">
            <Loader2 size={20} className="animate-spin text-blue-200" />
            <p className="text-blue-100 italic">Analyzing depth profiles and environmental metrics...</p>
          </div>
        ) : (
          <p className="text-lg font-medium leading-relaxed max-w-2xl">
            {summary || "Select a date to see the AI analysis of the conditions."}
          </p>
        )}
      </div>
    </div>
  );
};

export default AiSummary;
