'use client';

import { useState, useMemo } from 'react';
import {
  Users,
  Calendar,
  FileSpreadsheet,
  TrendingUp,
  Search,
  Filter,
  Download,
  BookOpen,
  Award,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  ArrowUpRight,
  Sparkles,
  Inbox,
  UserCheck
} from 'lucide-react';

type Student = {
  id: string;
  name: string;
  email: string;
  batch: string;
  attendance: number;
  dsaSolved: number;
  atsScore: number;
  latestScore: number;
  status: 'excellent' | 'stable' | 'warning';
};

const INITIAL_STUDENTS: Student[] = [
  { id: '101', name: 'Aarav Sharma', email: 'aarav@univ.edu', batch: '2026-A CS', attendance: 92, dsaSolved: 145, atsScore: 88, latestScore: 90, status: 'excellent' },
  { id: '102', name: 'Ishita Gupta', email: 'ishita@univ.edu', batch: '2026-A CS', attendance: 85, dsaSolved: 120, atsScore: 76, latestScore: 82, status: 'stable' },
  { id: '103', name: 'Aditya Verma', email: 'aditya@univ.edu', batch: '2026-B ECE', attendance: 64, dsaSolved: 42, atsScore: 52, latestScore: 45, status: 'warning' },
  { id: '104', name: 'Meera Nair', email: 'meera@univ.edu', batch: '2026-A CS', attendance: 98, dsaSolved: 182, atsScore: 94, latestScore: 96, status: 'excellent' },
  { id: '105', name: 'Rohan Sen', email: 'rohan@univ.edu', batch: '2026-B ECE', attendance: 78, dsaSolved: 85, atsScore: 70, latestScore: 68, status: 'stable' },
  { id: '106', name: 'Ananya Roy', email: 'ananya@univ.edu', batch: '2026-B ECE', attendance: 90, dsaSolved: 110, atsScore: 80, latestScore: 85, status: 'excellent' },
];

const BATCHES = ['All Batches', '2026-A CS', '2026-B ECE'];

export default function TrainerDashboard() {
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [selectedBatch, setSelectedBatch] = useState('All Batches');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'students' | 'assignments' | 'batches'>('students');

  // Filter students based on selection
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchBatch = selectedBatch === 'All Batches' || student.batch === selectedBatch;
      const matchSearch =
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase());
      return matchBatch && matchSearch;
    });
  }, [students, selectedBatch, searchQuery]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const total = filteredStudents.length;
    if (total === 0) return { avgAttendance: 0, avgDsa: 0, avgAts: 0, warningCount: 0 };
    
    const sumAttendance = filteredStudents.reduce((sum, s) => sum + s.attendance, 0);
    const sumDsa = filteredStudents.reduce((sum, s) => sum + s.dsaSolved, 0);
    const sumAts = filteredStudents.reduce((sum, s) => sum + s.atsScore, 0);
    const warnings = filteredStudents.filter((s) => s.status === 'warning').length;

    return {
      avgAttendance: Math.round(sumAttendance / total),
      avgDsa: Math.round(sumDsa / total),
      avgAts: Math.round(sumAts / total),
      warningCount: warnings,
    };
  }, [filteredStudents]);

  return (
    <main className="min-h-screen bg-background text-foreground premium-glow-bg pb-16 pt-4 px-6 md:px-12">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-foreground/10 pb-5">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground/50 tracking-wider uppercase">
            <Users className="h-4 w-4 text-brand-purple" />
            <span>Trainer console</span>
            <span>/</span>
            <span className="text-foreground">Analytics Workspace</span>
          </div>
          <div className="flex gap-2">
            <span className="rounded-xl border border-brand-purple/20 bg-brand-purple/5 px-4 py-1.5 text-xs font-bold text-brand-purple">
              University Batch Manager Mode
            </span>
          </div>
        </div>

        {/* Console Overview Section */}
        <section className="premium-card bg-background/40 backdrop-blur-md">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-purple">TRAINER ACCESS</span>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Batch Management & Analytics Hub</h1>
              <p className="text-sm md:text-base text-foreground/70 max-w-3xl leading-relaxed">
                Supervise campus academic tracks. Grade Online Assessments, analyze student resume scores, check attendance rates, and run performance diagnostics.
              </p>
            </div>
          </div>
        </section>

        {/* Tab Selection */}
        <div className="flex border-b border-foreground/10">
          <button
            onClick={() => setActiveTab('students')}
            className={`px-6 py-3 text-sm font-semibold border-b-2 transition ${
              activeTab === 'students' ? 'border-brand-purple text-foreground' : 'border-transparent text-foreground/50 hover:text-foreground/80'
            }`}
          >
            Student Roster
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`px-6 py-3 text-sm font-semibold border-b-2 transition ${
              activeTab === 'assignments' ? 'border-brand-purple text-foreground' : 'border-transparent text-foreground/50 hover:text-foreground/80'
            }`}
          >
            Placement Milestones
          </button>
        </div>

        {activeTab === 'students' ? (
          <>
            {/* Aggregate Metrics Grid */}
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <article className="premium-card bg-background/40 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-2xs font-bold uppercase tracking-wider text-foreground/50">Avg Attendance</span>
                  <Calendar className="h-4 w-4 text-brand-blue" />
                </div>
                <div className="mt-4">
                  <span className="text-3xl font-bold">{metrics.avgAttendance}%</span>
                  <p className="text-xs text-foreground/55 mt-1">Goal benchmark: 85%</p>
                </div>
              </article>

              <article className="premium-card bg-background/40 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-2xs font-bold uppercase tracking-wider text-foreground/50">Avg DSA Solved</span>
                  <Award className="h-4 w-4 text-brand-green" />
                </div>
                <div className="mt-4">
                  <span className="text-3xl font-bold">{metrics.avgDsa} Problems</span>
                  <p className="text-xs text-foreground/55 mt-1">Goal benchmark: 120</p>
                </div>
              </article>

              <article className="premium-card bg-background/40 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-2xs font-bold uppercase tracking-wider text-foreground/50">Avg Resume ATS</span>
                  <FileSpreadsheet className="h-4 w-4 text-brand-purple" />
                </div>
                <div className="mt-4">
                  <span className="text-3xl font-bold">{metrics.avgAts} / 100</span>
                  <p className="text-xs text-foreground/55 mt-1">Goal benchmark: 75</p>
                </div>
              </article>

              <article className="premium-card bg-background/40 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-2xs font-bold uppercase tracking-wider text-foreground/50">Critical Risk List</span>
                  <Clock className="h-4 w-4 text-brand-red animate-pulse" />
                </div>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-brand-red">{metrics.warningCount} Students</span>
                  <p className="text-xs text-brand-red/70 mt-1">Requires focus alignment</p>
                </div>
              </article>
            </section>

            {/* Filtering & Searching Area */}
            <section className="premium-card bg-background/40 flex flex-wrap items-center justify-between gap-4 py-4">
              <div className="flex flex-wrap items-center gap-3 flex-1">
                {/* Search Bar */}
                <div className="relative max-w-sm w-full">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/45" />
                  <input
                    type="text"
                    placeholder="Search candidate name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-foreground/10 bg-background/50 text-foreground outline-none focus:border-brand-purple transition"
                  />
                </div>

                {/* Batch Dropdown */}
                <div className="flex items-center gap-2">
                  <Filter className="h-3.5 w-3.5 text-foreground/50" />
                  <select
                    value={selectedBatch}
                    onChange={(e) => setSelectedBatch(e.target.value)}
                    className="py-2 px-3 text-xs rounded-xl border border-foreground/10 bg-background/50 text-foreground outline-none focus:border-brand-purple cursor-pointer"
                  >
                    {BATCHES.map((b) => (
                      <option key={b} value={b} className="bg-background text-foreground">
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button className="inline-flex items-center gap-1.5 px-4 py-2 border border-foreground/10 bg-foreground/5 text-xs font-semibold rounded-xl text-foreground hover:bg-foreground/10 transition">
                  <Download className="h-3.5 w-3.5" />
                  <span>Export Report</span>
                </button>
                <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-purple text-xs font-semibold rounded-xl text-white hover:opacity-90 transition">
                  <Plus className="h-3.5 w-3.5" />
                  <span>Register Student</span>
                </button>
              </div>
            </section>

            {/* Student Table */}
            <section className="premium-card bg-background/40 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-foreground/50 border-b border-foreground/10 pb-2">
                      <th className="pb-3 pr-3 font-bold uppercase tracking-wider">Student ID</th>
                      <th className="pb-3 pr-3 font-bold uppercase tracking-wider">Name / Info</th>
                      <th className="pb-3 pr-3 font-bold uppercase tracking-wider">Batch Group</th>
                      <th className="pb-3 pr-3 font-bold uppercase tracking-wider text-center">Attendance</th>
                      <th className="pb-3 pr-3 font-bold uppercase tracking-wider text-center">DSA Solved</th>
                      <th className="pb-3 pr-3 font-bold uppercase tracking-wider text-center">ATS Score</th>
                      <th className="pb-3 pr-3 font-bold uppercase tracking-wider text-center">Recent Mock OA</th>
                      <th className="pb-3 pr-3 font-bold uppercase tracking-wider text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-foreground/5">
                    {filteredStudents.map((s) => (
                      <tr key={s.id} className="hover:bg-foreground/2 transition-colors">
                        <td className="py-3.5 pr-3 font-mono text-foreground/60">#{s.id}</td>
                        <td className="py-3.5 pr-3">
                          <div>
                            <span className="font-bold block text-sm">{s.name}</span>
                            <span className="text-2xs text-foreground/50">{s.email}</span>
                          </div>
                        </td>
                        <td className="py-3.5 pr-3">
                          <span className="px-2 py-0.5 rounded border border-foreground/10 bg-foreground/5 font-semibold">
                            {s.batch}
                          </span>
                        </td>
                        <td className="py-3.5 pr-3 text-center">
                          <span className={`font-mono font-bold ${s.attendance < 75 ? 'text-brand-red' : 'text-foreground'}`}>
                            {s.attendance}%
                          </span>
                        </td>
                        <td className="py-3.5 pr-3 text-center font-mono font-semibold">{s.dsaSolved}</td>
                        <td className="py-3.5 pr-3 text-center font-mono font-semibold text-brand-blue">{s.atsScore}</td>
                        <td className="py-3.5 pr-3 text-center font-mono font-semibold text-brand-green">{s.latestScore}%</td>
                        <td className="py-3.5 pr-3 text-right">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                            s.status === 'excellent' 
                              ? 'border border-green-500/20 bg-green-500/10 text-brand-green' 
                              : s.status === 'stable'
                              ? 'border border-blue-500/20 bg-blue-500/10 text-brand-blue'
                              : 'border border-red-500/20 bg-red-500/10 text-brand-red'
                          }`}>
                            {s.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filteredStudents.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-foreground/45 italic">
                          No students matched the active query filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : (
          <section className="premium-card bg-background/40 py-16 text-center space-y-6">
            <div className="w-16 h-16 rounded-xl flex items-center justify-center bg-brand-purple-dim border border-brand-purple/20 text-brand-purple mx-auto">
              <BookOpen className="h-8 w-8" />
            </div>
            <div className="space-y-2 max-w-md mx-auto">
              <h3 className="text-xl font-bold">Milestones & Course Management</h3>
              <p className="text-sm text-foreground/60 leading-relaxed">
                Unlock structured DSA worksheets, post mock OA schedules, and sync verified recruiter benchmarks.
              </p>
            </div>
            <button className="inline-flex items-center gap-1.5 px-5 py-3 bg-brand-purple text-xs font-bold rounded-xl text-white hover:opacity-90 transition">
              <Plus className="h-4 w-4" />
              <span>Create New Milestone</span>
            </button>
          </section>
        )}
      </div>
    </main>
  );
}
