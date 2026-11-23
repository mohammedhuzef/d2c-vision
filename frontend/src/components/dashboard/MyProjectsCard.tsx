import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderKanban, Plus, ArrowRight, Sparkles } from 'lucide-react';
import { api } from '../../api/client';
import { ProjectItem } from '../../api/types';
import { getStoredProjects, Project } from '../../utils/storage';

export const MyProjectsCard: React.FC = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'All' | 'In Progress' | 'Completed'>('All');
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchProjects = async () => {
      try {
        const res = await api.projects.list({ limit: 20 });
        if (isMounted) {
          setProjects(res.items || []);
        }
      } catch (err) {
        if (isMounted) {
          const local = getStoredProjects();
          setProjects(local as ProjectItem[]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchProjects();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredProjects = projects.filter((p) => {
    if (filter === 'All') return true;
    if (filter === 'In Progress') return p.status === 'In Progress' || p.status === 'Research';
    if (filter === 'Completed') return p.status === 'Completed';
    return true;
  });

  const getStatusBadge = (status: ProjectItem['status']) => {
    switch (status) {
      case 'Completed':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'In Progress':
        return 'text-sky-700 bg-sky-50 border-sky-200';
      case 'Research':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'Idea Stage':
        return 'text-indigo-700 bg-indigo-50 border-indigo-200';
      default:
        return 'text-slate-700 bg-slate-50 border-slate-200';
    }
  };

  return (
    <div
      id="my-projects"
      className="rounded-2xl p-4 sm:p-5 flex flex-col justify-between h-full bg-white border border-slate-200/90 shadow-xs relative overflow-hidden transition-all duration-200 hover:border-slate-300"
    >
      {/* Header */}
      <div className="relative z-10">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shadow-xs">
              <FolderKanban className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight block">
                My Projects Portfolio
              </span>
              <p className="text-[10.5px] text-slate-500">
                Active validation runs and financial models.
              </p>
            </div>
          </div>

          {/* + New Project Button */}
          <button
            type="button"
            onClick={() => navigate('/projects')}
            className="btn-primary-gradient px-3 py-1.5 rounded-lg text-xs font-semibold text-white flex items-center gap-1 shadow-xs cursor-pointer hover:bg-emerald-700 transition-all"
          >
            <Plus className="w-3 h-3 text-emerald-200" />
            <span>New Project</span>
          </button>
        </div>

        {/* Filter Pills */}
        <div className="mt-3 flex items-center gap-1.5">
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
                className={`px-2.5 py-1 rounded-lg text-[10.5px] font-semibold transition-all cursor-pointer ${
                  filter === tab
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                {tab} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Projects List */}
      <div className="mt-3.5 space-y-2 relative z-10 flex-1">
        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading projects...</div>
        ) : filteredProjects.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-xs text-slate-400">No projects saved yet.</p>
            <button
              type="button"
              onClick={() => navigate('/validation')}
              className="mt-2 text-xs text-emerald-600 font-semibold hover:underline inline-flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              <span>Validate a concept</span>
            </button>
          </div>
        ) : (
          filteredProjects.slice(0, 4).map((project) => (
            <div
              key={project.id}
              onClick={() => navigate('/projects')}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/70 hover:bg-white border border-slate-200/80 hover:border-emerald-300 hover:shadow-xs transition-all cursor-pointer group"
            >
              {/* Left */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-slate-200 bg-slate-100">
                  <img
                    src={project.image || '/images/cat-beverages.jpg'}
                    alt={project.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/cat-beverages.jpg';
                    }}
                  />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate group-hover:text-emerald-700 transition-colors">
                    {project.name}
                  </div>
                  <div className="text-[10.5px] text-slate-500 truncate">
                    {project.category} • ₹{project.sellingPrice}
                  </div>
                </div>
              </div>

              {/* Right: Status badge & Score */}
              <div className="flex items-center gap-2.5 shrink-0">
                <span
                  className={`text-[9.5px] font-semibold px-2 py-0.5 rounded-full border ${getStatusBadge(
                    project.status
                  )}`}
                >
                  {project.status}
                </span>

                <div className="text-right">
                  <span className="text-xs font-black text-emerald-700 font-mono-nums">
                    {project.viabilityScore}%
                  </span>
                </div>

                <div className="text-slate-400 group-hover:text-emerald-600 p-0.5 transition-colors">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer link to view all */}
      <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] relative z-10">
        <span className="text-slate-500 font-mono-nums">{projects.length} Total Projects Saved</span>
        <button
          type="button"
          onClick={() => navigate('/projects')}
          className="text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span>Open Full Portfolio</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
