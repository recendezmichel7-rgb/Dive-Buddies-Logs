
import React from 'react';
import { DiveLog } from '../types';
import { 
  Waves, 
  Thermometer, 
  Navigation, 
  Eye, 
  ArrowDownCircle, 
  Clock,
  User
} from 'lucide-react';

interface DiveCardProps {
  dive: DiveLog;
}

const DiveCard: React.FC<DiveCardProps> = ({ dive }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900 leading-tight">{dive.pointName}</h3>
            <p className="text-sm text-slate-500 font-medium mt-1">Guide: {dive.guide || 'N/A'}</p>
          </div>
          <div className="bg-blue-50 px-3 py-1 rounded-full flex items-center gap-1.5">
            <Clock size={14} className="text-blue-600" />
            <span className="text-xs font-bold text-blue-700">{dive.diveTime} min</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <ArrowDownCircle size={20} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Max Depth</p>
              <p className="text-sm font-semibold text-slate-700">{dive.maxDepth}m</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-600">
              <Eye size={20} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Visibility</p>
              <p className="text-sm font-semibold text-slate-700">{dive.visibility}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
              <Thermometer size={20} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Water Temp</p>
              <p className="text-sm font-semibold text-slate-700">{dive.waterTemp}°C</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Waves size={20} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Conditions</p>
              <p className="text-sm font-semibold text-slate-700">{dive.current || 'Calm'} / {dive.waves || 'None'}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
           <Navigation size={14} className="text-slate-400" />
           <span className="text-xs text-slate-500">Average Depth: <span className="font-semibold text-slate-700">{dive.avgDepth}m</span></span>
        </div>
        <div className="text-[10px] text-slate-400">
          LOGGED AT {new Date(dive.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};

export default DiveCard;
