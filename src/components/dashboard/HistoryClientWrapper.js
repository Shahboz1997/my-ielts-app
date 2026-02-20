'use client';
import React, { useState, useMemo } from 'react';
import { format } from "date-fns";
import { FileText, ChevronRight, Star, Search, SortDesc, SortAsc, Filter } from "lucide-react";
import Link from "next/link";

export default function HistoryClientWrapper({ initialData }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [minScore, setMinScore] = useState('0');
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' или 'asc'

  // Логика фильтрации и сортировки
  const filteredChecks = useMemo(() => {
    return initialData
      .filter(check => {
        const matchesSearch = check.content.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesScore = (check.score ?? 0) >= parseFloat(minScore);
        return matchesSearch && matchesScore;
      })
      .sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      });
  }, [searchTerm, minScore, sortOrder, initialData]);

  return (
    <div className="space-y-6">
      {/* ПАНЕЛЬ ФИЛЬТРОВ — BandBooster dark glassmorphism */}
      <div className="grid grid-cols-1 md:flex items-center gap-4 p-4 bg-white/5 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-200/20 dark:border-slate-700/50 shadow-xl">
        
        {/* Поиск */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search essay content..." 
            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none focus:ring-2 ring-red-600 font-bold text-[10px] uppercase transition-all"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Фильтр по баллу */}
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800">
          <Filter className="w-3 h-3 text-red-600" />
          <select 
            value={minScore}
            onChange={(e) => setMinScore(e.target.value)}
            className="bg-transparent outline-none font-black text-[10px] uppercase cursor-pointer dark:text-white"
          >
            <option value="0">Min Score</option>
            {[4, 5, 6, 7, 8, 9].map(score => (
              <option key={score} value={score}>Score {score}+</option>
            ))}
          </select>
        </div>

        {/* Кнопка сортировки */}
        <button 
          onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-red-600/20 active:scale-95 transition-all"
        >
          {sortOrder === 'desc' ? <SortDesc className="w-4 h-4" /> : <SortAsc className="w-4 h-4" />}
          {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
        </button>
      </div>

      {/* СПИСОК КАРТОЧЕК */}
      <div className="space-y-4">
        {filteredChecks.length === 0 ? (
          <div className="text-center py-20 bg-white/5 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border-2 border-dashed border-slate-300/30 dark:border-slate-700">
            <p className="text-slate-500 font-black uppercase text-xs italic">No essays found matching your criteria</p>
          </div>
        ) : (
          filteredChecks.map((check) => {
            const isTask1 = (check.type || 'TASK_2') === 'TASK_1';
            let criteriaScores = null;
            try {
              const fb = typeof check.feedback === 'string' ? JSON.parse(check.feedback) : check.feedback || {};
              const c = fb.criteria || {};
              const taskKey = isTask1 ? 'Task_Achievement' : 'Task_Response';
              if (c[taskKey] || c.Coherence_and_Cohesion || c.Lexical_Resource || c.Grammatical_Range_and_Accuracy) {
                criteriaScores = {
                  ta: c[taskKey]?.score,
                  cc: c.Coherence_and_Cohesion?.score,
                  lr: c.Lexical_Resource?.score,
                  gra: c.Grammatical_Range_and_Accuracy?.score,
                };
              }
            } catch (_) {}
            return (
              <div
                key={check.id}
                className="group flex items-center justify-between p-6 bg-white/5 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-200/20 dark:border-slate-700/50 hover:shadow-2xl hover:border-red-500/40 transition-all active:scale-[0.99]"
              >
                <Link href={`/history/${check.id}`} className="flex items-center gap-5 flex-1 min-w-0">
                  <div className={`p-4 rounded-2xl shrink-0 transition-colors ${isTask1 ? 'bg-slate-100/80 dark:bg-slate-800 group-hover:bg-indigo-500' : 'bg-slate-100/80 dark:bg-slate-800 group-hover:bg-red-500'} group-hover:text-white`}>
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <span className={`inline-block px-2 py-0.5 rounded-lg text-[9px] font-black uppercase mb-1.5 ${isTask1 ? 'bg-indigo-500/20 text-indigo-400' : 'bg-red-500/20 text-red-400'}`}>
                      {isTask1 ? 'TASK 1' : 'TASK 2'}
                    </span>
                    <h3 className="font-black text-slate-900 dark:text-white truncate max-w-[200px] md:max-w-md">
                      {check.content}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-black uppercase italic mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(check.createdAt), "MMM dd, yyyy • HH:mm")}
                    </p>
                    {criteriaScores && (
                      <p className="text-[9px] text-slate-500 mt-1.5 font-black uppercase">
                        TA {criteriaScores.ta != null ? criteriaScores.ta.toFixed(1) : '—'} · CC {criteriaScores.cc != null ? criteriaScores.cc.toFixed(1) : '—'} · LR {criteriaScores.lr != null ? criteriaScores.lr.toFixed(1) : '—'} · GRA {criteriaScores.gra != null ? criteriaScores.gra.toFixed(1) : '—'}
                      </p>
                    )}
                  </div>
                </Link>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-red-500 font-black text-2xl italic tracking-tighter">
                      <Star className="w-5 h-5 fill-current" />
                      {check.score != null ? Number(check.score).toFixed(1) : "—"}
                    </div>
                    <p className="text-[10px] font-black uppercase text-slate-500 italic">Band</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleDownload(e, check)}
                    disabled={downloadingId === check.id}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-red-600 hover:text-white text-[10px] font-black uppercase transition-all disabled:opacity-50"
                    title="Download PDF Report"
                  >
                    <Download className="w-4 h-4" />
                    {downloadingId === check.id ? '…' : 'Report'}
                  </button>
                  <Link href={`/history/${check.id}`} className="p-2 rounded-xl text-slate-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all">
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
