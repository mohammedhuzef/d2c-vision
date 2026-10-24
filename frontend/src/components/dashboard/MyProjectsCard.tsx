import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderKanban, Plus, MoreHorizontal } from 'lucide-react';
import { getStoredProjects, Project } from '../../utils/storage';

export const MyProjectsCard: React.FC = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'All' | 'In Progress' | 'Completed'>('All');
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    setProjects(getStoredProjects());
  }, []);

  const filteredProjects = projects.filter((p) => {
    if (filter === 'All') return true;
    if (filter === 'In Progress') return p.status === 'In Progress' || p.status === 'Research';
    if (filter === 'Completed') return p.status === 'Completed';
    return true;
  });

  const getStatusBadge = (status: Project['status']) => {
    switch (status) {
      case 'Completed':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'In Progress':
        return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
      case 'Research':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'Idea Stage':
        return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
    }
  };

  return (
    <div id="my-projects" className="glass-panel rounded-2xl p-4 border border-white/[0.08] flex flex-col justify-between h-full">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <FolderKanban className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-xs font-bold text-white tracking-tight">My Projects</span>
              <p className="text-[10px] text-slate-400">Manage all your product ideas and analyses.</p>
            </div>
          </div>

          {/* + New Project Button */}
          <button
            type="button"
            onClick={() => navigate('/projects')}
            className="btn-primary-gradient px-2.5 py-1 rounded-lg text-[11px] font-semibold text-white flex items-center gap-1 shadow-sm cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>New Project</span>
          </button>
        </div>

        {/* Filter Pills */}
        <div className="mt-2.5 flex items-center gap-1.5">
          {(['All', 'In Progress', 'Completed'] as const).map((tab) => {
            const count =
              tab === 'All'
                ? projects.length
                : tab === 'In Progress'
                ? projects.filter((p) => p.status === 'In Progress' || p.status === 'Research').length
                : projects.filter((p) => p.status === 'Completed').length;

            return (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                  filter === tab
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white/[0.03] text-slate-400 hover:text-white'
                }`}
              >
                {tab} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Projects List */}
      <div className="mt-3 space-y-2">
        {filteredProjects.map((project) => (
          <div
            key={project.id}
            onClick={() => navigate('/projects')}
            className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.04] transition-all cursor-pointer group"
          >
            {/* Left */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0 border border-white/[0.08]">
                <img src={project.image} alt={project.name} className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-white truncate group-hover:text-indigo-300 transition-colors">
                  {project.name}
                </div>
                <div className="text-[10px] text-slate-400 truncate">{project.category}</div>
              </div>
            </div>

            {/* Right: Status badge & Score */}
            <div className="flex items-center gap-2.5 shrink-0">
              <span
                className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${getStatusBadge(
                  project.status
                )}`}
              >
                {project.status}
              </span>

              <div className="text-right">
                <span className="text-[11px] font-bold text-emerald-400 font-mono-nums">
                  {project.viabilityScore}%
                </span>
              </div>

              <button
                type="button"
                className="text-slate-400 hover:text-white p-1 rounded-md"
                aria-label="Options"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
