import React, { useState } from 'react';
import { Building2, Search, CheckCircle2, ChevronDown, Send, X } from 'lucide-react';

export interface ManufacturerItem {
  id: string;
  name: string;
  location: string;
  moq: string;
  verified: boolean;
  avatarText: string;
  avatarBg: string;
}

export const ManufacturersCard: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Category');
  const [selectedLocation, setSelectedLocation] = useState('Location');
  const [selectedMoq, setSelectedMoq] = useState('MOQ');
  const [activeContactSupplier, setActiveContactSupplier] = useState<ManufacturerItem | null>(null);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactMessage, setContactMessage] = useState('Hi, I am interested in your manufacturing capabilities for a new D2C launch.');

  const suppliers: ManufacturerItem[] = [
    {
      id: '1',
      name: 'Cocoa Rich Agri LLP',
      location: 'Bengaluru, Karnataka',
      moq: '5 kg',
      verified: true,
      avatarText: 'CR',
      avatarBg: 'from-amber-600 to-amber-800',
    },
    {
      id: '2',
      name: 'Campco',
      location: 'Mangaluru, Karnataka',
      moq: '10 kg',
      verified: true,
      avatarText: 'CA',
      avatarBg: 'from-blue-600 to-indigo-800',
    },
    {
      id: '3',
      name: 'Browns & More',
      location: 'Bengaluru, Karnataka',
      moq: '5 kg',
      verified: true,
      avatarText: 'BM',
      avatarBg: 'from-purple-600 to-fuchsia-800',
    },
    {
      id: '4',
      name: 'The Cocoa',
      location: 'Mangaluru, Karnataka',
      moq: '10 kg',
      verified: true,
      avatarText: 'TC',
      avatarBg: 'from-emerald-600 to-teal-800',
    },
  ];

  const filteredSuppliers = suppliers.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.location.toLowerCase().includes(search.toLowerCase())
  );

  const handleSendInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSuccess(true);
    setTimeout(() => {
      setContactSuccess(false);
      setActiveContactSupplier(null);
    }, 1800);
  };

  return (
    <div id="manufacturers" className="glass-panel rounded-2xl p-4 border border-white/[0.08] flex flex-col justify-between h-full">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Building2 className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-xs font-bold text-white tracking-tight">Find Manufacturers</span>
              <p className="text-[10px] text-slate-400">Connect with verified manufacturers for any product.</p>
            </div>
          </div>
        </div>

        {/* Search Bar & Filters */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 min-w-[130px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search manufacturers..."
              className="w-full pl-8 pr-2 py-1.5 bg-white/[0.04] border border-white/[0.08] focus:border-indigo-500/50 rounded-xl text-[11px] text-white placeholder-slate-400 focus:outline-none"
            />
          </div>

          {/* Category Filter */}
          <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[11px] text-slate-300 hover:text-white">
            <span>{selectedCategory}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {/* Location Filter */}
          <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[11px] text-slate-300 hover:text-white">
            <span>{selectedLocation}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {/* MOQ Filter */}
          <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[11px] text-slate-300 hover:text-white">
            <span>{selectedMoq}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Supplier List */}
      <div className="mt-3 space-y-2">
        {filteredSuppliers.map((supplier) => (
          <div
            key={supplier.id}
            className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.04] transition-all gap-2"
          >
            {/* Left: Avatar & Name */}
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={`w-6 h-6 rounded-lg bg-gradient-to-tr ${supplier.avatarBg} text-white font-bold text-[9px] flex items-center justify-center shrink-0 shadow-xs`}
              >
                {supplier.avatarText}
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-white truncate">{supplier.name}</div>
                <div className="text-[9px] text-slate-400 truncate">{supplier.location}</div>
              </div>
            </div>

            {/* Right: Badges & Contact */}
            <div className="flex items-center gap-1.5 shrink-0">
              {supplier.verified && (
                <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  <span className="hidden xl:inline">Verified</span>
                </span>
              )}
              <span className="text-[9px] text-slate-300 font-mono-nums bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06]">
                {supplier.moq}
              </span>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => setActiveContactSupplier(supplier)}
                className="px-2 py-0.5 rounded-md bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 hover:text-white text-[10px] font-semibold transition-all cursor-pointer"
              >
                Contact
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Contact Supplier Modal */}
      {activeContactSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md glass-panel rounded-2xl p-5 border border-white/[0.12] shadow-2xl relative">
            <button
              onClick={() => setActiveContactSupplier(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span>Contact {activeContactSupplier.name}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Verified supplier in {activeContactSupplier.location} • Minimum Order Quantity: {activeContactSupplier.moq}
            </p>

            {contactSuccess ? (
              <div className="my-6 p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-white">Inquiry Sent Successfully!</p>
                <p className="text-[11px] text-slate-300 mt-1">The supplier usually responds within 4 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSendInquiry} className="mt-4 space-y-3">
                <div>
                  <label className="text-[10px] font-medium text-slate-300 uppercase tracking-wider block mb-1">
                    Your Message / Product Specifications
                  </label>
                  <textarea
                    rows={3}
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    className="w-full p-2.5 bg-white/[0.04] border border-white/[0.1] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveContactSupplier(null)}
                    className="px-3 py-1.5 rounded-xl bg-white/[0.05] text-xs text-slate-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary-gradient px-4 py-1.5 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5"
                  >
                    <Send className="w-3 h-3" />
                    <span>Send Inquiry</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
