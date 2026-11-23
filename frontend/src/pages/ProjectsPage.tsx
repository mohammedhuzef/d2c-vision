import React, { useState, useEffect, useCallback } from 'react';
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
  RefreshCw,
  Building,
  Target,
  DollarSign,
  TrendingUp,
  ShieldAlert,
  MapPin,
  FileCheck,
  Database,
  HardDrive,
} from 'lucide-react';
import { api } from '../api/client';
import { ProjectItem } from '../api/types';
import { getLocalProjects, setLocalProjects } from '../utils/projectStorage';

export const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Connection & demo mode state
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'demo'>('demo');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Filters & Views
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal states
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);
  const [viewingProject, setViewingProject] = useState<ProjectItem | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states for create/edit
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Beverages');
  const [formMarket, setFormMarket] = useState('India (Tier 1 Metros)');
  const [formStatus, setFormStatus] = useState<ProjectItem['status']>('In Progress');
  const [formScore, setFormScore] = useState(78);
  const [formPrice, setFormPrice] = useState(149);
  const [formMfgCost, setFormMfgCost] = useState(38);
  const [formMoq, setFormMoq] = useState(500);
  const [formImage, setFormImage] = useState('/images/cat-beverages.jpg');
  const [formDesc, setFormDesc] = useState('');
  const [formIngredients, setFormIngredients] = useState('');
  const [formAudience, setFormAudience] = useState('');

  // Fetch projects from storage adapter (hybrid demo storage)
  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);

      const res = await api.projects.list({
        search: search.trim() ? search.trim() : undefined,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        status: selectedStatus !== 'All' ? selectedStatus : undefined,
      });

      setProjects(res.items || []);
    } catch (err: any) {
      console.warn('Fallback reading directly from local storage:', err);
      const local = getLocalProjects() as ProjectItem[];
      setProjects(local);
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, selectedStatus]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Check backend health without blocking the app
  const handleCheckConnection = async () => {
    try {
      setBackendStatus('checking');
      const health = await api.health.check();
      if (health && (health.status === 'healthy' || health.status === 'connected')) {
        setBackendStatus('connected');
        setStatusMessage('Backend database is connected and synchronized.');
      } else {
        setBackendStatus('demo');
        setStatusMessage('Backend inactive. Demo Mode active: All projects saved safely in LocalStorage.');
      }
    } catch {
      setBackendStatus('demo');
      setStatusMessage('Demo Mode active: All projects, reports, and edits are persisted in LocalStorage.');
    }
    setTimeout(() => setStatusMessage(null), 5000);
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingProject(null);
    setFormName('');
    setFormCategory('Beverages');
    setFormMarket('India (Tier 1 Metros)');
    setFormStatus('In Progress');
    setFormScore(78);
    setFormPrice(149);
    setFormMfgCost(38);
    setFormMoq(500);
    setFormImage('/images/cat-beverages.jpg');
    setFormDesc('');
    setFormIngredients('');
    setFormAudience('');
    setIsCreateOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (project: ProjectItem) => {
    setEditingProject(project);
    setFormName(project.name);
    setFormCategory(project.category);
    setFormMarket(project.targetMarket || 'India (Tier 1 Metros)');
    setFormStatus(project.status);
    setFormScore(project.viabilityScore);
    setFormPrice(project.sellingPrice);
    setFormMfgCost(project.mfgCost);
    setFormMoq(project.moq || 500);
    setFormImage(project.image || '/images/cat-beverages.jpg');
    setFormDesc(project.description || '');
    setFormIngredients(project.ingredients || '');
    setFormAudience(project.targetAudience || '');
    setIsCreateOpen(true);
  };

  // Submit Create or Edit
  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    try {
      setIsSubmitting(true);
      const margin =
        formPrice > 0 ? Math.round(((formPrice - formMfgCost) / formPrice) * 100) : 0;

      if (editingProject) {
        // Update existing project in storage
        const updatePayload: Partial<ProjectItem> = {
          name: formName.trim(),
          category: formCategory,
          targetMarket: formMarket,
          status: formStatus,
          viabilityScore: formScore,
          sellingPrice: formPrice,
          mfgCost: formMfgCost,
          moq: formMoq,
          margin,
          image: formImage,
          description: formDesc.trim(),
          ingredients: formIngredients.trim(),
          targetAudience: formAudience.trim(),
        };

        const updated = await api.projects.update(editingProject.id, updatePayload);
        setProjects((prev) => prev.map((p) => (p.id === editingProject.id ? updated : p)));
      } else {
        // Create new project in storage
        const createPayload: Partial<ProjectItem> = {
          name: formName.trim(),
          category: formCategory,
          targetMarket: formMarket,
          status: formStatus,
          viabilityScore: formScore,
          sellingPrice: formPrice,
          mfgCost: formMfgCost,
          moq: formMoq,
          margin,
          image: formImage,
          description: formDesc.trim(),
          ingredients: formIngredients.trim(),
          targetAudience: formAudience.trim(),
          report: {
            demand: '+50% YoY',
            searchVol: '150,000 / mo',
            searchIntent: 'Commercial Intent',
            competition: 'Moderate',
            compText: `Whitespace in clean-label ${formCategory} formulations.`,
            copackers: 'Verified co-packers ready for pilot batch.',
            copackerLeadTime: '4-6 Weeks Pilot Lead Time',
            risks: ['Initial CAC learning curve', 'Working capital management for MOQ'],
            recommendations: ['Build pre-launch email waitlist', 'Offer starter multi-pack bundle'],
          },
        };

        const created = await api.projects.create(createPayload);
        setProjects((prev) => [created, ...prev]);
      }

      setIsCreateOpen(false);
      setEditingProject(null);
    } catch (err: any) {
      console.error('Failed to save project:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm Delete
  const handleDelete = async (id: string) => {
    try {
      await api.projects.delete(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      setDeletingId(null);
    } catch (err: any) {
      console.error('Failed to delete project:', err);
    }
  };

  const getStatusBadge = (status: ProjectItem['status']) => {
    switch (status) {
      case 'Completed':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200 font-semibold';
      case 'In Progress':
        return 'text-sky-700 bg-sky-50 border-sky-200 font-semibold';
      case 'Research':
        return 'text-amber-700 bg-amber-50 border-amber-200 font-semibold';
      case 'Idea Stage':
        return 'text-indigo-700 bg-indigo-50 border-indigo-200 font-semibold';
      default:
        return 'text-slate-700 bg-slate-50 border-slate-200 font-semibold';
    }
  };

  // Categories list
  const categories = [
    'All',
    'Beverages',
    'Chocolates',
    'Snacks',
    'Supplements',
    'Personal Care',
    'Stationery',
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="rounded-2xl p-6 bg-white border border-slate-200/90 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                <FolderKanban className="w-3.5 h-3.5 text-emerald-600" />
                <span>Brand Portfolio Tracker</span>
              </div>

              {/* Demo Mode / Storage Mode Indicator */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold">
                <HardDrive className="w-3.5 h-3.5 text-emerald-600" />
                <span>Demo Storage: LocalStorage Active</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              My Projects
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
              Track and manage all your validated product concepts, unit economics, contract manufacturer contacts, and feasibility reports saved in your workspace.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
                aria-label="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                  viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
                aria-label="Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Check / Retry Connection Button */}
            <button
              type="button"
              onClick={handleCheckConnection}
              disabled={backendStatus === 'checking'}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center gap-1.5 transition-all cursor-pointer"
              title="Test backend connection"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${backendStatus === 'checking' ? 'animate-spin' : ''}`} />
              <span>{backendStatus === 'checking' ? 'Checking...' : backendStatus === 'connected' ? 'DB Connected' : 'Check DB'}</span>
            </button>

            {/* Validate in Studio Button */}
            <button
              type="button"
              onClick={() => navigate('/validation')}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Validation Studio</span>
            </button>

            {/* + New Project Button */}
            <button
              type="button"
              onClick={handleOpenCreate}
              className="btn-primary-gradient px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white flex items-center gap-2 shadow-xs cursor-pointer hover:bg-emerald-700 transition-all"
            >
              <Plus className="w-4 h-4 text-emerald-200" />
              <span>Create Project</span>
            </button>
          </div>
        </div>

        {/* Status notification toast */}
        {statusMessage && (
          <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-2xl p-4 bg-white border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects by name, category, ingredients..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 rounded-xl text-xs text-slate-900 placeholder-slate-400 outline-none transition-all"
          />
        </div>

        {/* Category & Status Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:border-emerald-500 outline-none cursor-pointer"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                Category: {cat}
              </option>
            ))}
          </select>

          {/* Status Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {['All', 'In Progress', 'Completed', 'Research', 'Idea Stage'].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setSelectedStatus(status)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedStatus === status
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="rounded-2xl p-16 text-center bg-white border border-slate-200/90 shadow-xs">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Loading saved projects...</p>
        </div>
      ) : projects.length === 0 ? (
        /* Clean Empty State (NO fake mock projects) */
        <div className="rounded-2xl p-12 text-center bg-white border border-slate-200/90 shadow-xs">
          <FolderKanban className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">No saved projects found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {search || selectedCategory !== 'All' || selectedStatus !== 'All'
              ? 'No projects match your current filters. Try resetting search or category/status filters.'
              : 'Your brand portfolio is empty. Validate a product concept in the Product Validation Studio to save your first project.'}
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/validation')}
              className="btn-primary-gradient px-4 py-2 rounded-xl text-xs font-semibold text-white inline-flex items-center gap-2 cursor-pointer shadow-xs hover:bg-emerald-700 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Validate Product Concept</span>
            </button>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold inline-flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Quick Create</span>
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="rounded-2xl p-4 bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between group hover:border-slate-300 hover:shadow-sm transition-all"
            >
              <div>
                {/* Image & Viability Badge */}
                <div className="relative aspect-video rounded-xl overflow-hidden mb-3 bg-slate-100 border border-slate-200">
                  <img
                    src={project.image || '/images/cat-beverages.jpg'}
                    alt={project.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/cat-beverages.jpg';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent pointer-events-none" />

                  {/* Top Badges */}
                  <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border backdrop-blur-md ${getStatusBadge(project.status)}`}>
                      {project.status}
                    </span>
                    <span className="text-[10px] font-black text-emerald-800 bg-white/95 px-2 py-0.5 rounded-full border border-slate-200 font-mono-nums shadow-2xs">
                      {project.viabilityScore}% Score
                    </span>
                  </div>

                  {/* Bottom Category */}
                  <div className="absolute bottom-2 left-2 text-[10px] text-slate-200 font-medium">
                    {project.category}
                  </div>
                </div>

                {/* Title & Description */}
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  {project.name}
                </h3>
                {project.description && (
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {project.description}
                  </p>
                )}
                {project.ingredients && (
                  <p className="text-[10.5px] text-slate-400 mt-1 line-clamp-1 italic">
                    Specs: {project.ingredients}
                  </p>
                )}
              </div>

              {/* Financial Snapshot & Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs mb-3">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Price</span>
                    <span className="font-bold text-slate-900 font-mono-nums">₹{project.sellingPrice}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Gross Margin</span>
                    <span className="font-bold text-emerald-700 font-mono-nums">{project.margin}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Unit COGS</span>
                    <span className="font-bold text-slate-700 font-mono-nums">₹{project.mfgCost}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setViewingProject(project)}
                    className="flex-1 py-1.5 px-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-[11px] font-semibold text-slate-700 hover:text-slate-900 flex items-center justify-center gap-1 transition-colors cursor-pointer border border-slate-200"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    <span>View</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(project)}
                    className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-emerald-700 transition-colors cursor-pointer border border-slate-200"
                    title="Edit project"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingId(project.id)}
                    className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer border border-rose-200"
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
        <div className="rounded-2xl bg-white border border-slate-200/90 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="p-3.5 pl-5">Project Name</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Viability Score</th>
                  <th className="p-3.5">Price & Margin</th>
                  <th className="p-3.5 pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {projects.map((project) => (
                  <tr key={project.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5 pl-5 flex items-center gap-3">
                      <img
                        src={project.image || '/images/cat-beverages.jpg'}
                        alt={project.name}
                        className="w-8 h-8 rounded-lg object-cover border border-slate-200"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/cat-beverages.jpg';
                        }}
                      />
                      <div>
                        <span className="font-bold text-slate-900 block">{project.name}</span>
                        <span className="text-[10px] text-slate-400">
                          Updated {project.updatedAt ? project.updatedAt.slice(0, 10) : 'Recently'}
                        </span>
                      </div>
                    </td>
                    <td className="p-3.5 text-slate-600">{project.category}</td>
                    <td className="p-3.5">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusBadge(project.status)}`}>
                        {project.status}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="font-bold text-emerald-700 font-mono-nums">{project.viabilityScore}%</span>
                    </td>
                    <td className="p-3.5 font-mono-nums">
                      <span className="text-slate-900 font-bold">₹{project.sellingPrice}</span>
                      <span className="text-emerald-700 ml-1.5 font-semibold">({project.margin}% margin)</span>
                    </td>
                    <td className="p-3.5 pr-5 text-right space-x-1">
                      <button
                        onClick={() => setViewingProject(project)}
                        className="p-1.5 text-slate-400 hover:text-slate-800 rounded cursor-pointer"
                        title="View details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(project)}
                        className="p-1.5 text-slate-400 hover:text-emerald-700 rounded cursor-pointer"
                        title="Edit project"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingId(project.id)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 rounded cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl p-6 bg-white border border-slate-200 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsCreateOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-4">
              {editingProject ? 'Edit Project Specifications' : 'Create New Brand Project'}
            </h3>

            <form onSubmit={handleSaveProject} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Organic Adaptogenic Cocoa Bar"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Category *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="Beverages">Beverages</option>
                    <option value="Chocolates">Chocolates</option>
                    <option value="Snacks">Snacks</option>
                    <option value="Supplements">Supplements</option>
                    <option value="Personal Care">Personal Care</option>
                    <option value="Stationery">Stationery</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Status *</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="Idea Stage">Idea Stage</option>
                    <option value="Research">Research</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Target Launch Market</label>
                <input
                  type="text"
                  value={formMarket}
                  onChange={(e) => setFormMarket(e.target.value)}
                  placeholder="e.g. India (Tier 1 Metros)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono-nums focus:bg-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Mfg Cost (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formMfgCost}
                    onChange={(e) => setFormMfgCost(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono-nums focus:bg-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">MOQ (Units)</label>
                  <input
                    type="number"
                    min="1"
                    value={formMoq}
                    onChange={(e) => setFormMoq(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono-nums focus:bg-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Product Description</label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Concept details, packaging, UVP..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Ingredients or Specifications</label>
                <textarea
                  rows={2}
                  value={formIngredients}
                  onChange={(e) => setFormIngredients(e.target.value)}
                  placeholder="Active botanicals, formulation details, certifications..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Target Consumer Demographic & ICP</label>
                <input
                  type="text"
                  value={formAudience}
                  onChange={(e) => setFormAudience(e.target.value)}
                  placeholder="e.g. Health-conscious millennials, gym-goers"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary-gradient px-5 py-2 rounded-xl text-xs font-bold text-white shadow-xs cursor-pointer hover:bg-emerald-700 transition-all flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving to Storage...</span>
                    </>
                  ) : (
                    <span>{editingProject ? 'Save Changes' : 'Create Project'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Project Detail Modal (Displays full specs and stored feasibility report) */}
      {viewingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-2xl p-6 bg-white border border-slate-200 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-5">
            <button
              onClick={() => setViewingProject(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex items-start gap-4">
              <img
                src={viewingProject.image || '/images/cat-beverages.jpg'}
                alt={viewingProject.name}
                className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/cat-beverages.jpg';
                }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-bold text-slate-900">{viewingProject.name}</h3>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusBadge(viewingProject.status)}`}>
                    {viewingProject.status}
                  </span>
                  <span className="text-[10px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {viewingProject.viabilityScore}% Viability
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Category: <strong>{viewingProject.category}</strong> • Market:{' '}
                  <strong>{viewingProject.targetMarket || 'India (Tier 1 Metros)'}</strong> • Project ID: <span className="font-mono text-[10.5px]">{viewingProject.id}</span>
                </p>
              </div>
            </div>

            {/* Product Specifications & Financials */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Selling Price</span>
                <span className="text-sm font-black text-slate-900 font-mono-nums">₹{viewingProject.sellingPrice}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Mfg Cost (COGS)</span>
                <span className="text-sm font-bold text-slate-700 font-mono-nums">₹{viewingProject.mfgCost}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Gross Margin</span>
                <span className="text-sm font-black text-emerald-700 font-mono-nums">{viewingProject.margin}%</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Pilot MOQ</span>
                <span className="text-sm font-bold text-slate-800 font-mono-nums">
                  {(viewingProject.moq || 500).toLocaleString()} units
                </span>
              </div>
            </div>

            {/* Concept Description & Ingredients */}
            <div className="space-y-3 text-xs">
              <div>
                <span className="font-bold text-slate-900 block mb-1">Product Concept & UVP</span>
                <p className="text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/80 leading-relaxed">
                  {viewingProject.description || 'No concept description provided.'}
                </p>
              </div>

              {viewingProject.ingredients && (
                <div>
                  <span className="font-bold text-slate-900 block mb-1">Ingredients & Specifications</span>
                  <p className="text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/80 leading-relaxed">
                    {viewingProject.ingredients}
                  </p>
                </div>
              )}

              {viewingProject.targetAudience && (
                <div>
                  <span className="font-bold text-slate-900 block mb-1">Target Consumer Demographic & ICP</span>
                  <p className="text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/80 leading-relaxed">
                    {viewingProject.targetAudience}
                  </p>
                </div>
              )}
            </div>

            {/* Stored Feasibility Report Details */}
            {viewingProject.report && (
              <div className="pt-3 border-t border-slate-200 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Stored AI Feasibility Report (Retrieved from Storage)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Demand & Momentum */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Market Demand</span>
                    </div>
                    <div className="text-base font-extrabold text-slate-900">{viewingProject.report.demand || '+50% YoY'}</div>
                    <p className="text-[11px] text-slate-500">
                      Search Volume: {viewingProject.report.searchVol || 'High index in target market'}
                    </p>
                  </div>

                  {/* Competitive Density */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                      <Target className="w-3.5 h-3.5 text-slate-700" />
                      <span>Competitive Landscape</span>
                    </div>
                    <div className="text-base font-extrabold text-slate-900">{viewingProject.report.competition || 'Moderate'}</div>
                    <p className="text-[11px] text-slate-500 line-clamp-2">
                      {viewingProject.report.compText || 'Whitespace identified for clean-label product formulation.'}
                    </p>
                  </div>
                </div>

                {/* Contract Manufacturer Information */}
                {viewingProject.report.copackers && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <span className="font-bold text-slate-900 flex items-center gap-2 mb-1">
                      <Building className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Contract Co-packers & Manufacturing Specs</span>
                    </span>
                    <p className="text-slate-600">{viewingProject.report.copackers}</p>
                    {viewingProject.report.copackerLeadTime && (
                      <span className="text-[10.5px] font-semibold text-emerald-700 mt-1 block">
                        Lead Time: {viewingProject.report.copackerLeadTime}
                      </span>
                    )}
                  </div>
                )}

                {/* Risks & Recommendations */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {viewingProject.report.risks && viewingProject.report.risks.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-200 space-y-2">
                      <span className="font-bold text-rose-900 flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                        <span>Identified Risks</span>
                      </span>
                      <ul className="space-y-1.5 text-slate-600 text-[11px]">
                        {viewingProject.report.risks.map((risk: string, i: number) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1 shrink-0" />
                            <span>{risk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {viewingProject.report.recommendations && viewingProject.report.recommendations.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                      <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Recommendations</span>
                      </span>
                      <ul className="space-y-1.5 text-slate-600 text-[11px]">
                        {viewingProject.report.recommendations.map((rec: string, i: number) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1 shrink-0" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewingProject(null)}
                className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 cursor-pointer transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewingProject(null);
                  navigate('/profit-calculator');
                }}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800 flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                <Calculator className="w-3.5 h-3.5 text-emerald-600" />
                <span>Profit Calculator</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewingProject(null);
                  navigate('/validation');
                }}
                className="flex-1 btn-primary-gradient py-2 rounded-xl text-xs font-semibold text-white shadow-xs cursor-pointer hover:bg-emerald-700 flex items-center justify-center gap-1 transition-all"
              >
                <span>Validation Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl p-6 bg-white border border-slate-200 shadow-2xl relative text-center">
            <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-900">Delete this project?</h4>
            <p className="text-xs text-slate-500 mt-1">
              This will permanently delete this project and all associated feasibility data from your workspace.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deletingId)}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white shadow-xs cursor-pointer transition-colors"
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
