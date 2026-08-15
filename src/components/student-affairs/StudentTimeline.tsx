import { Clock, Filter, Printer, Search } from 'lucide-react';
import React, { useState, useMemo } from 'react';
interface TimelineEvent {
  id: string;
  type: string;
  date: string; // ISO date
  title: string;
  description: string;
  user: string;
}

interface StudentTimelineProps {
  events: TimelineEvent[];
}

export default function StudentTimeline({ events }: StudentTimelineProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const filteredEvents = useMemo(() => {
    return events.filter(e => 
      (filterType === 'all' || e.type === filterType) &&
      (e.title.includes(searchTerm) || e.description.includes(searchTerm))
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [events, searchTerm, filterType]);

  const eventTypes = useMemo(() => Array.from(new Set(events.map(e => e.type))), [events]);

  const handlePrint = () => window.print();

  return (
    <div className="space-y-4 text-right" id="student-timeline-section">
      <div className="flex justify-between items-center p-4 border">
        <div className="flex gap-2">
            <input 
                type="text" 
                placeholder="بحث في الأحداث..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="text-xs p-2 border rounded-lg"
            />
            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="text-xs p-2 border rounded-lg">
                <option value="all">كل الأنواع</option>
                {eventTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
        </div>
        <button onClick={handlePrint} className="flex items-center gap-2 text-xs font-bold text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">
            <Printer className="w-4 h-4"/> طباعة السجل
        </button>
      </div>

      <div className="relative border-r-2 border-amber-200 mr-3 pr-6 py-4 space-y-6">
        {filteredEvents.map(event => (
          <div key={event.id} className="relative text-right">
            <span className="absolute -right-[31px] top-1.5 w-4 h-4 rounded-full bg-amber-600 border-4 border-amber-100"></span>
            <div className="p-4 shadow-xs">
              <div className="flex justify-between items-start flex-row-reverse">
                <p className="text-xs font-black text-slate-800">{event.title}</p>
                <span className="text-[9.5px] text-slate-450 font-mono font-bold">{new Date(event.date).toLocaleDateString('ar-SA')}</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1 leading-relaxed font-semibold">{event.description}</p>
              <p className="text-[9.5px] text-amber-600 font-bold mt-2">المستخدم: {event.user}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
