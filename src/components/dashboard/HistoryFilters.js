'use client';
import { MagnifyingGlassIcon, StarIcon, BarsArrowUpIcon, BarsArrowDownIcon } from '@heroicons/react/24/outline';

export default function HistoryFilters({ onFilterChange, filters }) {
  return (
    <div className="flex flex-wrap gap-4 mb-8 p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
      
      {/* Поиск по тексту */}
      <div className="flex-1 min-w-[200px] relative">
        <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input 
          type="text"
          placeholder="Search by content..."
          className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none focus:ring-2 ring-red-600 font-bold text-xs uppercase"
          onChange={(e) => onFilterChange('search', e.target.value)}
        />
      </div>

      {/* Фильтр по баллу */}
      <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
        <StarIcon className="w-4 h-4 text-amber-500" />
        <select 
          className="bg-transparent outline-none font-black text-[10px] uppercase cursor-pointer"
          onChange={(e) => onFilterChange('minScore', e.target.value)}
        >
          <option value="0">Min Score</option>
          {[5, 6, 7, 8, 9].map(num => (
            <option key={num} value={num}>{num}.0+</option>
          ))}
        </select>
      </div>

      {/* Сортировка по дате */}
      <button 
        onClick={() => onFilterChange('sortOrder', filters.sortOrder === 'desc' ? 'asc' : 'desc')}
        className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-red-600/20 active:scale-95 transition-all"
      >
        {filters.sortOrder === 'desc' ? <BarsArrowDownIcon className="w-4 h-4" /> : <BarsArrowUpIcon className="w-4 h-4" />}
        Date {filters.sortOrder === 'desc' ? 'Newest' : 'Oldest'}
      </button>
    </div>
  );
}
