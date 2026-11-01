import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderKanban, Plus, ArrowRight, Eye } from 'lucide-react';
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
        return 'text-[#28D7A0] bg-[#28D7A0]/15 border-[#28D7A0]/30';
      case 'In Progress':
        return 'text-[#25D9E8] bg-[#25D9E8]/15 border-[#25D9E8]/30';
      case 'Research':
        return 'text-amber-400 bg-amber-500/15 border-amber-500/30';
      case 'Idea Stage':
        return 'text-[#A855F7] bg-[#A855F7]/15 border-[#A855F7]/30';
    }
  };

  return (
    <div
      id="my-projects"
      className="rounded-2xl p-4 sm:p-5 flex flex-col justify-between h-full bg-[rgba(20,39,62,0.72)] border border-[rgba(161,190,230,0.25)] backdrop-blur-xl shadow-lg relative overflow-hidden"
    >
      {/* Background glow accent */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-[#7547FF]/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="relative z-10">
        <div className="flex items-center justify-between pb-3 border-b border-[rgba(161,190,230,0.18)]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#7547FF]/15 border border-[#7547FF]/30 text-[#A855F7] flex items-center justify-center shadow-[0_0_10px_rgba(117,71,255,0.25)]">
              <FolderKanban className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold text-[#F8FAFF] tracking-tight">
                My Projects Portfolio
              </span>
              <p className="text-[10px] text-[#9EADC2]">
                Active validation runs and financial models.
              </p>
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
                className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                  filter === tab
                    ? 'bg-gradient-to-r from-[#7547FF] to-[#278BFF] text-white shadow-xs'
                    : 'bg-[rgba(8,24,44,0.6)] text-[#9EADC2] hover:text-white border border-[rgba(161,190,230,0.12)]'
                }`}
              >
                {tab} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Projects List */}
      <div className="mt-3 space-y-2 relative z-10">
        {filteredProjects.slice(0, 4).map((project) => (
          <div
            key={project.id}
            onClick={() => navigate('/projects')}
            className="flex items-center justify-between p-2.5 rounded-xl bg-[rgba(8,24,44,0.6)] hover:bg-[rgba(8,24,44,0.9)] border border-[rgba(161,190,230,0.15)] transition-all cursor-pointer group"
          >
            {/* Left */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-[rgba(161,190,230,0.2)]">
                <img src={project.image} alt={project.name} className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-white truncate group-hover:text-[#25D9E8] transition-colors">
                  {project.name}
                </div>
                <div className="text-[10px] text-[#9EADC2] truncate">{project.category} • ₹{project.sellingPrice}</div>
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
                <span className="text-[11px] font-black text-[#28D7A0] font-mono-nums">
                  {project.viabilityScore}%
                </span>
              </div>

              <div className="text-[#9EADC2] group-hover:text-white p-1 rounded-md transition-colors">
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer link to view all */}
      <div className="mt-3 pt-2.5 border-t border-[rgba(161,190,230,0.15)] flex items-center justify-between text-[11px] relative z-10">
        <span className="text-[#9EADC2] font-mono-nums">{projects.length} Total Projects in Local Storage</span>
        <button
          type="button"
          onClick={() => navigate('/projects')}
          className="text-[#25D9E8] hover:text-white font-semibold flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span>Open Full Portfolio</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
