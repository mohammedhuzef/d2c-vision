import React, { useState } from 'react';
import {
  Building2,
  Search,
  Filter,
  CheckCircle2,
  ShieldCheck,
  Send,
  X,
  ExternalLink,
  MapPin,
  Sparkles,
  PhoneCall,
  Award,
} from 'lucide-react';

export interface Manufacturer {
  id: string;
  name: string;
  location: string;
  categories: string[];
  moq: string;
  certifications: string[];
  rating: string;
  verified: boolean;
  leadTime: string;
  specialty: string;
}

export const ManufacturersPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [activeContactSupplier, setActiveContactSupplier] = useState<Manufacturer | null>(null);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [inquiryText, setInquiryText] = useState('Hi, I am planning a launch in Q3 and need your catalog, MOQ, and unit pricing.');

  const suppliers: Manufacturer[] = [
    {
      id: '1',
      name: 'Cocoa Rich Agri LLP',
      location: 'Bengaluru, Karnataka',
      categories: ['Chocolates', 'Food & Beverage'],
      moq: '5 kg / 200 units',
      certifications: ['FSSAI', 'GMP', 'Organic NPOP'],
      rating: '4.9 ★',
      verified: true,
      leadTime: '3-4 Weeks',
      specialty: 'Bean-to-bar single origin craft dark chocolate and cocoa butter extraction.',
    },
    {
      id: '2',
      name: 'Campco Ltd.',
      location: 'Mangaluru, Karnataka',
      categories: ['Chocolates', 'Beverages', 'Snacks'],
      moq: '10 kg / 500 units',
      certifications: ['FSSAI', 'ISO 22000', 'HACCP'],
      rating: '4.8 ★',
      verified: true,
      leadTime: '2-3 Weeks',
      specialty: 'Industrial compounding, roasted cocoa liquor, and large batch confectionery drops.',
    },
    {
      id: '3',
      name: 'Browns & More Foodtech',
      location: 'Bengaluru, Karnataka',
      categories: ['Snacks', 'Supplements'],
      moq: '5 kg / 150 units',
      certifications: ['FSSAI', 'US FDA Registered'],
      rating: '4.7 ★',
      verified: true,
      leadTime: '2 Weeks',
      specialty: 'Clean roasting, Himalayan makhana flavoring, cold extrusion protein snacks.',
    },
    {
      id: '4',
      name: 'The Cocoa Roastery',
      location: 'Mangaluru, Karnataka',
      categories: ['Chocolates', 'Beverages'],
      moq: '10 kg / 300 units',
      certifications: ['FSSAI', 'FairTrade'],
      rating: '4.9 ★',
      verified: true,
      leadTime: '4 Weeks',
      specialty: 'Micro-lot fermentation and customized sugar-free dark chocolate bars.',
    },
    {
      id: '5',
      name: 'Aura Botanicals Lab',
      location: 'Mumbai, Maharashtra',
      categories: ['Personal Care'],
      moq: '250 units',
      certifications: ['GMP', 'ISO 9001', 'Ayush'],
      rating: '4.8 ★',
      verified: true,
      leadTime: '3 Weeks',
      specialty: 'Barrier repair serums, cold-pressed face oils, and niacinamide lotions.',
    },
    {
      id: '6',
      name: 'PureNutra Laboratories',
      location: 'Hyderabad, Telangana',
      categories: ['Supplements'],
      moq: '500 units',
      certifications: ['GMP', 'FSSAI', 'US FDA'],
      rating: '4.7 ★',
      verified: true,
      leadTime: '4 Weeks',
      specialty: 'Plant protein blending, effervescent electrolyte tablets, and chewable gummies.',
    },
  ];

  const filtered = suppliers.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.specialty.toLowerCase().includes(search.toLowerCase()) ||
      s.location.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'All' || s.categories.includes(selectedCategory);
    const matchesLoc = selectedLocation === 'All' || s.location.includes(selectedLocation);
    return matchesSearch && matchesCat && matchesLoc;
  });

  const handleSendInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSuccess(true);
    setTimeout(() => {
      setContactSuccess(false);
      setActiveContactSupplier(null);
    }, 1500);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="glass-panel rounded-2xl p-6 border border-white/[0.08] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-2">
              <Building2 className="w-3.5 h-3.5" />
              <span>Verified Supplier Network</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Contract Manufacturers & Co-Packers
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Connect directly with pre-vetted OEM and private-label contract manufacturing facilities with low minimum order quantities (MOQs).
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel rounded-2xl p-4 border border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by supplier name, ingredient, city..."
            className="w-full pl-9 pr-3 py-1.5 bg-white/[0.04] border border-white/[0.08] focus:border-indigo-500 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 bg-[#090D18] border border-white/[0.1] rounded-xl text-xs text-white focus:outline-none"
          >
            <option value="All">All Categories</option>
            <option value="Chocolates">Chocolates</option>
            <option value="Snacks">Snacks</option>
            <option value="Beverages">Beverages</option>
            <option value="Supplements">Supplements</option>
            <option value="Personal Care">Personal Care</option>
          </select>

          {/* Location Filter */}
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="px-3 py-1.5 bg-[#090D18] border border-white/[0.1] rounded-xl text-xs text-white focus:outline-none"
          >
            <option value="All">All Locations</option>
            <option value="Bengaluru">Bengaluru, Karnataka</option>
            <option value="Mangaluru">Mangaluru, Karnataka</option>
            <option value="Mumbai">Mumbai, Maharashtra</option>
            <option value="Hyderabad">Hyderabad, Telangana</option>
          </select>
        </div>
      </div>

      {/* Supplier Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((s) => (
          <div
            key={s.id}
            className="glass-panel-interactive rounded-2xl p-5 border border-white/[0.08] flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between pb-3 border-b border-white/[0.06] mb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span>{s.name}</span>
                    {s.verified && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                  </h3>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                    <MapPin className="w-3 h-3 text-slate-500" />
                    <span>{s.location}</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                  {s.rating}
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed mb-3">{s.specialty}</p>

              <div className="grid grid-cols-2 gap-2 text-[11px] p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] mb-3">
                <div>
                  <span className="text-slate-400 block text-[10px]">Minimum Order</span>
                  <span className="font-bold text-white">{s.moq}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Lead Time</span>
                  <span className="font-bold text-cyan-300">{s.leadTime}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mb-3">
                {s.certifications.map((c) => (
                  <span key={c} className="text-[9px] text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    {c}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-white/[0.06] flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveContactSupplier(s)}
                className="w-full btn-primary-gradient py-2 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 shadow-md"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Contact & Request Quotation</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* RFQ / Contact Modal */}
      {activeContactSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md glass-panel rounded-2xl p-6 border border-white/[0.12] shadow-2xl relative">
            <button
              onClick={() => setActiveContactSupplier(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span>Request Quote from {activeContactSupplier.name}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Minimum Order Quantity: <strong>{activeContactSupplier.moq}</strong> • Standard Lead Time: {activeContactSupplier.leadTime}
            </p>

            {contactSuccess ? (
              <div className="my-6 p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-white">Inquiry Sent Successfully!</p>
                <p className="text-[11px] text-slate-300 mt-1">The sales engineering team will respond within 4 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSendInquiry} className="mt-4 space-y-3">
                <div>
                  <label className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider block mb-1">
                    Your Specifications & Target Quantities
                  </label>
                  <textarea
                    rows={4}
                    value={inquiryText}
                    onChange={(e) => setInquiryText(e.target.value)}
                    className="w-full p-2.5 bg-white/[0.04] border border-white/[0.1] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
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
                    className="btn-primary-gradient px-4 py-2 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send RFQ</span>
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
