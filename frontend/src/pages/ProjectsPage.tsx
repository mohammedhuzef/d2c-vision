import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  LayoutGrid,
  List,
  X,
  AlertTriangle,
  ArrowRight,
  Calculator,
} from 'lucide-react';
import { getStoredProjects, saveStoredProjects, Project } from '../utils/storage';

export const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal states
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [viewingProject, setViewingProject] = useState<Project | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form states for create/edit
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Food & Beverage');
  const [formStatus, setFormStatus] = useState<Project['status']>('In Progress');
  const [formScore, setFormScore] = useState(78);
  const [formPrice, setFormPrice] = useState(299);
  const [formMfgCost, setFormMfgCost] = useState(80);
  const [formImage, setFormImage] = useState('/images/cat-chocolates.jpg');
  const [formDesc, setFormDesc] = useState('');

  // Load from localStorage on mount
  useEffect(() => {
    setProjects(getStoredProjects());
  }, []);

  const persistAndUpdate = (newProjects: Project[]) => {
    setProjects(newProjects);
    saveStoredProjects(newProjects);
  };

  // Filtered project list
  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = selectedStatus === 'All' || p.status === selectedStatus;
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Open Create Modal
  const handleOpenCreate = () => {
    setFormName('');
    setFormCategory('Food & Beverage');
    setFormStatus('Idea Stage');
    setFormScore(75);
    setFormPrice(299);
    setFormMfgCost(75);
    setFormImage('/images/cat-chocolates.jpg');
    setFormDesc('');
    setEditingProject(null);
    setIsCreateOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (project: Project) => {
    setEditingProject(project);
    setFormName(project.name);
    setFormCategory(project.category);
    setFormStatus(project.status);
    setFormScore(project.viabilityScore);
    setFormPrice(project.sellingPrice);
    setFormMfgCost(project.mfgCost);
    setFormImage(project.image);
    setFormDesc(project.description || '');
    setIsCreateOpen(true);
  };

  // Save Create or Edit
  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    const margin = formPrice > 0 ? Math.round(((formPrice - formMfgCost) / formPrice) * 100) : 0;

    if (editingProject) {
      const updated = projects.map((p) =>
        p.id === editingProject.id
          ? {
              ...p,
              name: formName,
              category: formCategory,
              status: formStatus,
              viabilityScore: formScore,
              sellingPrice: formPrice,
              mfgCost: formMfgCost,
              margin,
              image: formImage,
              description: formDesc,
              updatedAt: new Date().toISOString().split('T')[0],
            }
          : p
      );
      persistAndUpdate(updated);
    } else {
      const newProject: Project = {
        id: `proj-${Date.now()}`,
        name: formName,
        category: formCategory,
        status: formStatus,
        viabilityScore: formScore,
        sellingPrice: formPrice,
        mfgCost: formMfgCost,
        margin,
        image: formImage,
        description: formDesc,
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
      };
      persistAndUpdate([newProject, ...projects]);
    }

    setIsCreateOpen(false);
    setEditingProject(null);
  };

  // Confirm Delete
  const handleDelete = (id: string) => {
    const updated = projects.filter((p) => p.id !== id);
    persistAndUpdate(updated);
    setDeletingId(null);
  };

  const getStatusBadge = (status: Project['status']) => {
    switch (status) {
      case 'Completed':
        return 'text-[#28D7A0] bg-[#28D7A0]/15 border-[#28D7A0]/30 font-semibold';
      case 'In Progress':
        return 'text-[#25D9E8] bg-[#25D9E8]/15 border-[#25D9E8]/30 font-semibold';
      case 'Research':
        return 'text-amber-400 bg-amber-500/15 border-amber-500/30 font-semibold';
      case 'Idea Stage':
        return 'text-[#A855F7] bg-[#A855F7]/15 border-[#A855F7]/30 font-semibold';
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="rounded-2xl p-6 bg-[rgba(20,39,62,0.72)] border border-[rgba(161,190,230,0.25)] backdrop-blur-xl relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#7547FF]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7547FF]/15 border border-[#7547FF]/30 text-[#A855F7] text-xs font-semibold mb-2">
              <FolderKanban className="w-3.5 h-3.5" />
              <span>Brand Portfolio Tracker</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFF] tracking-tight">
              My Projects
            </h1>
            <p className="text-xs sm:text-sm text-[#9EADC2] mt-1 max-w-2xl">
              Track and manage all your product validation pipelines, financial models, manufacturer quotes, and launch roadmaps in one persistent portfolio.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-[rgba(8,24,44,0.7)] p-1 rounded-xl border border-[rgba(161,190,230,0.2)]">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                  viewMode === 'grid' ? 'bg-gradient-to-r from-[#7547FF] to-[#278BFF] text-white shadow-sm' : 'text-[#9EADC2] hover:text-white'
                }`}
                aria-label="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                  viewMode === 'table' ? 'bg-gradient-to-r from-[#7547FF] to-[#278BFF] text-white shadow-sm' : 'text-[#9EADC2] hover:text-white'
                }`}
                aria-label="Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* + New Project Button */}
            <button
              type="button"
              onClick={handleOpenCreate}
              className="btn-primary-gradient px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Project</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-2xl p-4 bg-[rgba(20,39,62,0.72)] border border-[rgba(161,190,230,0.25)] backdrop-blur-xl flex flex-wrap items-center justify-between gap-3 shadow-md">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="w-4 h-4 text-[#9EADC2] absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects by name, category..."
            className="w-full pl-9 pr-3 py-1.5 bg-[rgba(8,24,44,0.7)] border border-[rgba(161,190,230,0.2)] focus:border-[#7547FF] rounded-xl text-xs text-white placeholder-[#9EADC2]/50 focus:outline-none"
          />
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {['All', 'In Progress', 'Completed', 'Research', 'Idea Stage'].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setSelectedStatus(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedStatus === status
                  ? 'bg-gradient-to-r from-[#7547FF] to-[#278BFF] text-white shadow-sm'
                  : 'bg-[rgba(8,24,44,0.5)] text-[#9EADC2] hover:text-white hover:bg-[rgba(8,24,44,0.8)] border border-[rgba(161,190,230,0.12)]'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Project Content */}
      {filteredProjects.length === 0 ? (
        <div className="rounded-2xl p-12 text-center bg-[rgba(20,39,62,0.72)] border border-[rgba(161,190,230,0.25)] backdrop-blur-xl shadow-lg">
          <FolderKanban className="w-12 h-12 text-[#9EADC2] mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No projects found</h3>
          <p className="text-xs text-[#9EADC2] mt-1 max-w-sm mx-auto">
            Try adjusting your search query or create a new product concept to get started.
          </p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="mt-4 btn-primary-gradient px-4 py-2 rounded-xl text-xs font-bold text-white inline-flex items-center gap-2 cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="rounded-2xl p-4 bg-[rgba(20,39,62,0.72)] border border-[rgba(161,190,230,0.25)] backdrop-blur-xl shadow-lg flex flex-col justify-between group hover:border-[#25D9E8]/40 transition-all"
            >
              <div>
                {/* Image & Viability Badge */}
                <div className="relative aspect-video rounded-xl overflow-hidden mb-3 bg-black/40 border border-[rgba(161,190,230,0.15)]">
                  <img
                    src={project.image}
                    alt={project.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />

                  {/* Top Badges */}
                  <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border backdrop-blur-md ${getStatusBadge(project.status)}`}>
                      {project.status}
                    </span>
                    <span className="text-[10px] font-black text-[#28D7A0] bg-[#28D7A0]/20 backdrop-blur-md px-2 py-0.5 rounded-full border border-[#28D7A0]/30 font-mono-nums">
                      {project.viabilityScore}% Score
                    </span>
                  </div>

                  {/* Bottom Category */}
                  <div className="absolute bottom-2 left-2 text-[10px] text-slate-300 font-medium">
                    {project.category}
                  </div>
                </div>

                {/* Title & Description */}
                <h3 className="text-sm font-bold text-white group-hover:text-[#25D9E8] transition-colors">
                  {project.name}
                </h3>
                {project.description && (
                  <p className="text-xs text-[#9EADC2] mt-1 line-clamp-2 leading-relaxed">
                    {project.description}
                  </p>
                )}
              </div>

              {/* Financial Snapshot & Actions */}
              <div className="mt-4 pt-3 border-t border-[rgba(161,190,230,0.15)]">
                <div className="flex items-center justify-between text-xs mb-3">
                  <div>
                    <span className="text-[10px] text-[#9EADC2] block">Price</span>
                    <span className="font-bold text-white font-mono-nums">₹{project.sellingPrice}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#9EADC2] block">Gross Margin</span>
                    <span className="font-bold text-[#28D7A0] font-mono-nums">{project.margin}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#9EADC2] block">Unit COGS</span>
                    <span className="font-bold text-slate-300 font-mono-nums">₹{project.mfgCost}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setViewingProject(project)}
                    className="flex-1 py-1.5 px-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[11px] font-semibold text-slate-300 hover:text-white flex items-center justify-center gap-1 transition-colors cursor-pointer border border-[rgba(161,190,230,0.15)]"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(project)}
                    className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-[#25D9E8] transition-colors cursor-pointer border border-[rgba(161,190,230,0.15)]"
                    title="Edit project"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingId(project.id)}
                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer border border-rose-500/20"
                    title="Delete project"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="rounded-2xl bg-[rgba(20,39,62,0.72)] border border-[rgba(161,190,230,0.25)] backdrop-blur-xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[rgba(8,24,44,0.6)] text-[#9EADC2] border-b border-[rgba(161,190,230,0.18)]">
                <tr>
                  <th className="p-3.5 pl-5">Project Name</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Viability Score</th>
                  <th className="p-3.5">Price & Margin</th>
                  <th className="p-3.5 pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(161,190,230,0.1)] text-slate-300">
                {filteredProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-3.5 pl-5 flex items-center gap-3">
                      <img src={project.image} alt={project.name} className="w-8 h-8 rounded-lg object-cover border border-[rgba(161,190,230,0.2)]" />
                      <div>
                        <span className="font-bold text-white block">{project.name}</span>
                        <span className="text-[10px] text-[#9EADC2]">Updated {project.updatedAt}</span>
                      </div>
                    </td>
                    <td className="p-3.5 text-[#9EADC2]">{project.category}</td>
                    <td className="p-3.5">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusBadge(project.status)}`}>
                        {project.status}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="font-bold text-[#28D7A0] font-mono-nums">{project.viabilityScore}%</span>
                    </td>
                    <td className="p-3.5 font-mono-nums">
                      <span className="text-white font-bold">₹{project.sellingPrice}</span>
                      <span className="text-[#28D7A0] ml-1.5 font-semibold">({project.margin}% margin)</span>
                    </td>
                    <td className="p-3.5 pr-5 text-right space-x-1">
                      <button
                        onClick={() => setViewingProject(project)}
                        className="p-1.5 text-slate-400 hover:text-white rounded cursor-pointer"
                        title="View details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(project)}
                        className="p-1.5 text-slate-400 hover:text-[#25D9E8] rounded cursor-pointer"
                        title="Edit project"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingId(project.id)}
                        className="p-1.5 text-rose-400 hover:text-rose-300 rounded cursor-pointer"
                        title="Delete project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Project Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl p-6 bg-[rgba(15,30,50,0.96)] border border-[rgba(161,190,230,0.3)] shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsCreateOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-white mb-4">
              {editingProject ? 'Edit Project Specifications' : 'Create New Brand Project'}
            </h3>

            <form onSubmit={handleSaveProject} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-200 block mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Organic Matcha Latte"
                  className="w-full px-3 py-2 bg-[rgba(8,24,44,0.7)] border border-[rgba(161,190,230,0.2)] rounded-xl text-xs text-white focus:outline-none focus:border-[#7547FF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-200 block mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-[#08182C] border border-[rgba(161,190,230,0.2)] rounded-xl text-xs text-white focus:outline-none cursor-pointer"
                  >
                    <option value="Food & Beverage">Food & Beverage</option>
                    <option value="Snacks">Snacks</option>
                    <option value="Supplements">Supplements</option>
                    <option value="Personal Care">Personal Care</option>
                    <option value="Stationery">Stationery</option>
                    <option value="Home & Living">Home & Living</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-200 block mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#08182C] border border-[rgba(161,190,230,0.2)] rounded-xl text-xs text-white focus:outline-none cursor-pointer"
                  >
                    <option value="Idea Stage">Idea Stage</option>
                    <option value="Research">Research</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-200 block mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    min="1"
                    value={formPrice}
                    onChange={(e) => setFormPrice(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-2 bg-[rgba(8,24,44,0.7)] border border-[rgba(161,190,230,0.2)] rounded-xl text-xs text-white font-mono-nums"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-200 block mb-1">Mfg Cost (₹)</label>
                  <input
                    type="number"
                    min="1"
                    value={formMfgCost}
                    onChange={(e) => setFormMfgCost(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-2 bg-[rgba(8,24,44,0.7)] border border-[rgba(161,190,230,0.2)] rounded-xl text-xs text-white font-mono-nums"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-200 block mb-1">Viability Score</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formScore}
                    onChange={(e) => setFormScore(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[rgba(8,24,44,0.7)] border border-[rgba(161,190,230,0.2)] rounded-xl text-xs text-white font-mono-nums"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-200 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Concept details, product formula, packaging..."
                  className="w-full px-3 py-2 bg-[rgba(8,24,44,0.7)] border border-[rgba(161,190,230,0.2)] rounded-xl text-xs text-white focus:outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[rgba(161,190,230,0.18)]">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/[0.05] text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-gradient px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md cursor-pointer"
                >
                  {editingProject ? 'Save Changes' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Project Detail Modal */}
      {viewingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl p-6 bg-[rgba(15,30,50,0.96)] border border-[rgba(161,190,230,0.3)] shadow-2xl relative">
            <button
              onClick={() => setViewingProject(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <img
                src={viewingProject.image}
                alt={viewingProject.name}
                className="w-14 h-14 rounded-xl object-cover ring-2 ring-[#7547FF]/40 border border-white/20"
              />
              <div>
                <h3 className="text-base font-bold text-white">{viewingProject.name}</h3>
                <span className="text-xs text-[#25D9E8]">{viewingProject.category}</span>
                <span className={`ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusBadge(viewingProject.status)}`}>
                  {viewingProject.status}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-4">{viewingProject.description || 'No description provided.'}</p>

            <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-[rgba(8,24,44,0.7)] border border-[rgba(161,190,230,0.18)] text-center mb-4">
              <div>
                <span className="text-[10px] text-[#9EADC2] block">Viability Score</span>
                <span className="text-base font-black text-[#28D7A0] font-mono-nums">{viewingProject.viabilityScore}%</span>
              </div>
              <div>
                <span className="text-[10px] text-[#9EADC2] block">Selling Price</span>
                <span className="text-base font-black text-white font-mono-nums">₹{viewingProject.sellingPrice}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#9EADC2] block">Gross Margin</span>
                <span className="text-base font-black text-[#28D7A0] font-mono-nums">{viewingProject.margin}%</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setViewingProject(null)}
                className="flex-1 py-2 rounded-xl bg-white/[0.05] text-xs text-slate-300 hover:text-white cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewingProject(null);
                  navigate('/profit-calculator');
                }}
                className="flex-1 px-3 py-2 rounded-xl bg-[rgba(8,24,44,0.7)] hover:bg-[rgba(8,24,44,0.9)] border border-[rgba(161,190,230,0.2)] text-xs font-semibold text-[#25D9E8] flex items-center justify-center gap-1 cursor-pointer"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>Unit Economics</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewingProject(null);
                  navigate('/validation');
                }}
                className="flex-1 btn-primary-gradient py-2 rounded-xl text-xs font-semibold text-white shadow-md cursor-pointer flex items-center justify-center gap-1"
              >
                <span>Re-Validate</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl p-5 bg-[rgba(15,30,50,0.96)] border border-rose-500/30 shadow-2xl relative text-center">
            <AlertTriangle className="w-10 h-10 text-[#F43F5E] mx-auto mb-2" />
            <h4 className="text-sm font-bold text-white">Delete this project?</h4>
            <p className="text-xs text-[#9EADC2] mt-1">
              This will remove the project and its stored analyses from your local workspace.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="flex-1 py-2 rounded-xl bg-white/[0.05] text-xs text-slate-300 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deletingId)}
                className="flex-1 py-2 rounded-xl bg-[#F43F5E] hover:bg-rose-500 text-xs font-bold text-white shadow-md cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
