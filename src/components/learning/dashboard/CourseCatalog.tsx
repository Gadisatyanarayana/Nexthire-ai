"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Filter, BookOpen, Clock, ChevronRight } from 'lucide-react';

export default function CourseCatalog() {
  const [catalog, setCatalog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [domainFilter, setDomainFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchCatalog = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (domainFilter) params.append('domainId', domainFilter);
      if (statusFilter) params.append('status', statusFilter);

      const res = await fetch(`/api/learning/catalog?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setCatalog(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Debounce search fetching
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCatalog();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, domainFilter, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-zinc-500" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-3 border border-zinc-700 rounded-xl leading-5 bg-zinc-900/50 text-zinc-300 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
            placeholder="Search catalog by title, skill, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <select 
            className="bg-zinc-900/50 border border-zinc-700 text-zinc-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
            value={domainFilter}
            onChange={(e) => setDomainFilter(e.target.value)}
          >
            <option value="">All Domains</option>
            <option value="quantitative-aptitude">Quantitative Aptitude</option>
            <option value="logical-reasoning">Logical Reasoning</option>
            <option value="system-design">System Design</option>
          </select>
          
          <select 
            className="bg-zinc-900/50 border border-zinc-700 text-zinc-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Any Status</option>
            <option value="NOT_STARTED">Not Started</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center py-12 text-zinc-500">Loading catalog...</div>
      ) : catalog.length === 0 ? (
        <div className="text-center py-12 text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
          No courses match your filters.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {catalog.map((lesson) => {
            const domainId = Array.isArray(lesson.platform_modules) ? lesson.platform_modules[0]?.domain_id : lesson.platform_modules?.domain_id;
            const moduleId = Array.isArray(lesson.platform_modules) ? lesson.platform_modules[0]?.id : lesson.platform_modules?.id;
            
            return (
              <Link
                href={`/learn/${domainId}/${moduleId}/${lesson.id}`}
                key={lesson.id}
                className="group flex flex-col bg-zinc-900/40 border border-zinc-800 hover:border-emerald-500/50 rounded-2xl p-5 transition-all hover:bg-zinc-900"
              >
                <div className="flex justify-between items-start mb-3">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded
                    ${lesson.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500' : 
                      lesson.status === 'IN_PROGRESS' ? 'bg-orange-500/10 text-orange-500' : 
                      'bg-zinc-800 text-zinc-400'}`}>
                    {lesson.status.replace('_', ' ')}
                  </span>
                  {lesson.difficulty && (
                    <span className="text-xs font-semibold text-zinc-500">{lesson.difficulty}</span>
                  )}
                </div>
                
                <h3 className="text-lg font-bold text-white mb-2 line-clamp-1">{lesson.title}</h3>
                <p className="text-sm text-zinc-400 line-clamp-2 flex-grow mb-4">
                  {lesson.description || 'Master essential concepts and practice problems.'}
                </p>
                
                <div className="flex items-center justify-between pt-4 border-t border-zinc-800/50 mt-auto">
                  <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
                    <Clock className="w-4 h-4" />
                    {lesson.duration_minutes || 15}m
                  </div>
                  <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-emerald-500 transition" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
