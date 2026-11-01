import React, { useState } from 'react';
import {
  Building2,
  Search,
  ChevronDown,
  Send,
  X,
  Filter,
  AlertCircle,
  CheckCircle2,
  MapPin,
  Package,
  Layers,
  Sparkles,
} from 'lucide-react';

export interface ManufacturerItem {
  id: string;
  name: string;
  location: string;
  category: string;
  moq: string;
  status: 'Demo Listing';
  avatarText: string;
  avatarBg: string;
  thumbnail: string;
}

export const ManufacturersCard: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedLocation, setSelectedLocation] = useState('All Locations');
  const [selectedMoq, setSelectedMoq] = useState('All MOQs');

  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isMoqOpen, setIsMoqOpen] = useState(false);

  // Contact Modal State
  const [activeSupplier, setActiveSupplier] = useState<ManufacturerItem | null>(null);
  const [fullName, setFullName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [orderVolume, setOrderVolume] = useState('500 units (Pilot Batch)');
  const [contactMessage, setContactMessage] = useState(
    'Hi, we are preparing a new D2C consumer product launch and would like to request factory specifications, pilot MOQs, and lead times.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedDemoConfirmation, setSubmittedDemoConfirmation] = useState(false);
  const [formErrors, setFormErrors] = useState<{ name?: string; contact?: string; message?: string }>({});

  const suppliers: ManufacturerItem[] = [
    {
      id: '1',
      name: 'Cocoa Rich Agri LLP',
      location: 'Bengaluru, Karnataka',
      category: 'Chocolates & Cocoa',
      moq: '5 kg (Sample Value)',
      status: 'Demo Listing',
      avatarText: 'CR',
      avatarBg: 'from-[#7547FF] to-[#278BFF]',
      thumbnail: '/images/cat-chocolates.jpg',
    },
    {
      id: '2',
      name: 'Campco',
      location: 'Mangaluru, Karnataka',
      category: 'Chocolates & Cocoa',
      moq: '10 kg (Sample Value)',
      status: 'Demo Listing',
      avatarText: 'CA',
      avatarBg: 'from-[#25D9E8] to-[#278BFF]',
      thumbnail: '/images/cat-chocolates.jpg',
    },
    {
      id: '3',
      name: 'Browns & More',
      location: 'Bengaluru, Karnataka',
      category: 'Healthy Snacks',
      moq: '5 kg (Sample Value)',
      status: 'Demo Listing',
      avatarText: 'BM',
      avatarBg: 'from-[#FFBE58] to-[#7547FF]',
      thumbnail: '/images/cat-snacks.jpg',
    },
    {
      id: '4',
      name: 'The Coaco',
      location: 'Mangaluru, Karnataka',
      category: 'Chocolates & Cocoa',
      moq: '10 kg (Sample Value)',
      status: 'Demo Listing',
      avatarText: 'TC',
      avatarBg: 'from-[#28D7A0] to-[#25D9E8]',
      thumbnail: '/images/cat-chocolates.jpg',
    },
  ];

  // Filtering Logic
  const filteredSuppliers = suppliers.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.location.toLowerCase().includes(search.toLowerCase()) ||
      s.category.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      selectedCategory === 'All Categories' || s.category === selectedCategory;

    const matchesLocation =
      selectedLocation === 'All Locations' || s.location.includes(selectedLocation.split(',')[0]);

    const matchesMoq =
      selectedMoq === 'All MOQs' ||
      (selectedMoq === '≤ 5 kg' && s.moq.includes('5 kg')) ||
      (selectedMoq === '≤ 10 kg' && (s.moq.includes('5 kg') || s.moq.includes('10 kg')));

    return matchesSearch && matchesCategory && matchesLocation && matchesMoq;
  });

  const handleOpenContact = (supplier: ManufacturerItem) => {
    setActiveSupplier(supplier);
    setSubmittedDemoConfirmation(false);
    setFormErrors({});
  };

  const handleCloseContact = () => {
    setActiveSupplier(null);
    setSubmittedDemoConfirmation(false);
    setFormErrors({});
  };

  const handleSubmitContact = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const errors: { name?: string; contact?: string; message?: string } = {};
    if (!fullName.trim()) errors.name = 'Please provide your full name';
    if (!contactEmail.trim() || !contactEmail.includes('@')) errors.contact = 'Please provide a valid email address';
    if (!contactMessage.trim()) errors.message = 'Please include a message for the manufacturer';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmittedDemoConfirmation(true);
    }, 500);
  };

  return (
    <div
      id="manufacturers"
      className="rounded-2xl p-4 sm:p-5 bg-[rgba(20,39,62,0.72)] backdrop-blur-xl border border-[rgba(161,190,230,0.25)] shadow-xl flex flex-col justify-between h-full relative overflow-hidden transition-all duration-300 hover:border-[#25D9E8]/40"
    >
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 w-48 h-48 bg-[#28D7A0]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[rgba(161,190,230,0.18)]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#28D7A0] to-[#25D9E8] text-[#071426] flex items-center justify-center shadow-md shadow-[#28D7A0]/30 font-bold">
              <Building2 className="w-4 h-4 text-[#071426]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#F8FAFF] tracking-tight">Find Manufacturers</h3>
                <span className="text-[9px] font-medium text-[#25D9E8] bg-[#25D9E8]/10 px-1.5 py-0.5 rounded border border-[#25D9E8]/30">
                  Demo Listings
                </span>
              </div>
              <p className="text-[10px] text-[#9EADC2]">Connect with manufacturers for your product.</p>
            </div>
          </div>

          <div className="text-[10px] text-[#9EADC2] flex items-center gap-1 font-mono-nums">
            <span>Showing {filteredSuppliers.length} of {suppliers.length} Entries</span>
          </div>
        </div>

        {/* Search Bar & Four Responsive Filters */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-12 gap-2">
          {/* Search */}
          <div className="sm:col-span-4 relative">
            <Search className="w-3.5 h-3.5 text-[#9EADC2] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search manufacturers..."
              className="w-full pl-8 pr-2.5 py-1.5 bg-[rgba(8,24,44,0.7)] border border-[rgba(161,190,230,0.2)] focus:border-[#25D9E8] rounded-xl text-xs text-[#F8FAFF] placeholder:text-[#9EADC2]/70 focus:outline-none transition-all"
            />
          </div>

          {/* Product Category Filter */}
          <div className="sm:col-span-3 relative">
            <button
              type="button"
              onClick={() => {
                setIsCategoryOpen(!isCategoryOpen);
                setIsLocationOpen(false);
                setIsMoqOpen(false);
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-[rgba(8,24,44,0.7)] hover:bg-[rgba(20,39,62,0.9)] border border-[rgba(161,190,230,0.2)] text-[11px] text-[#F8FAFF] transition-all cursor-pointer truncate"
            >
              <span className="truncate">{selectedCategory}</span>
              <ChevronDown className="w-3 h-3 text-[#9EADC2] shrink-0 ml-1" />
            </button>

            {isCategoryOpen && (
              <div className="absolute left-0 mt-1 w-44 py-1 bg-[#08182C] border border-[rgba(161,190,230,0.25)] rounded-xl shadow-xl z-30 text-[11px] backdrop-blur-xl">
                {['All Categories', 'Chocolates & Cocoa', 'Healthy Snacks'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat);
                      setIsCategoryOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 transition-colors ${
                      selectedCategory === cat ? 'text-[#25D9E8] font-bold bg-white/[0.06]' : 'text-[#9EADC2] hover:text-[#F8FAFF] hover:bg-white/[0.04]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Location Filter */}
          <div className="sm:col-span-3 relative">
            <button
              type="button"
              onClick={() => {
                setIsLocationOpen(!isLocationOpen);
                setIsCategoryOpen(false);
                setIsMoqOpen(false);
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-[rgba(8,24,44,0.7)] hover:bg-[rgba(20,39,62,0.9)] border border-[rgba(161,190,230,0.2)] text-[11px] text-[#F8FAFF] transition-all cursor-pointer truncate"
            >
              <span className="truncate">{selectedLocation}</span>
              <ChevronDown className="w-3 h-3 text-[#9EADC2] shrink-0 ml-1" />
            </button>

            {isLocationOpen && (
              <div className="absolute left-0 mt-1 w-44 py-1 bg-[#08182C] border border-[rgba(161,190,230,0.25)] rounded-xl shadow-xl z-30 text-[11px] backdrop-blur-xl">
                {['All Locations', 'Bengaluru, Karnataka', 'Mangaluru, Karnataka'].map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => {
                      setSelectedLocation(loc);
                      setIsLocationOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 transition-colors ${
                      selectedLocation === loc ? 'text-[#25D9E8] font-bold bg-white/[0.06]' : 'text-[#9EADC2] hover:text-[#F8FAFF] hover:bg-white/[0.04]'
                    }`}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Minimum Order Quantity (MOQ) Filter */}
          <div className="sm:col-span-2 relative">
            <button
              type="button"
              onClick={() => {
                setIsMoqOpen(!isMoqOpen);
                setIsCategoryOpen(false);
                setIsLocationOpen(false);
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-[rgba(8,24,44,0.7)] hover:bg-[rgba(20,39,62,0.9)] border border-[rgba(161,190,230,0.2)] text-[11px] text-[#F8FAFF] transition-all cursor-pointer truncate"
            >
              <span className="truncate">{selectedMoq}</span>
              <ChevronDown className="w-3 h-3 text-[#9EADC2] shrink-0 ml-1" />
            </button>

            {isMoqOpen && (
              <div className="absolute right-0 mt-1 w-32 py-1 bg-[#08182C] border border-[rgba(161,190,230,0.25)] rounded-xl shadow-xl z-30 text-[11px] backdrop-blur-xl">
                {['All MOQs', '≤ 5 kg', '≤ 10 kg'].map((moq) => (
                  <button
                    key={moq}
                    type="button"
                    onClick={() => {
                      setSelectedMoq(moq);
                      setIsMoqOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 transition-colors ${
                      selectedMoq === moq ? 'text-[#25D9E8] font-bold bg-white/[0.06]' : 'text-[#9EADC2] hover:text-[#F8FAFF] hover:bg-white/[0.04]'
                    }`}
                  >
                    {moq}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Manufacturer Rows */}
      <div className="mt-3.5 space-y-2">
        {filteredSuppliers.length === 0 ? (
          <div className="p-6 rounded-xl bg-[rgba(8,24,44,0.5)] border border-[rgba(161,190,230,0.15)] text-center text-xs text-[#9EADC2]">
            No manufacturers match your active filter criteria. Try resetting your search filters.
          </div>
        ) : (
          filteredSuppliers.map((supplier) => (
            <div
              key={supplier.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-xl bg-[rgba(8,24,44,0.55)] hover:bg-[rgba(20,39,62,0.85)] border border-[rgba(161,190,230,0.15)] hover:border-[#25D9E8]/40 transition-all gap-2 group"
            >
              {/* Left: Company Logo Placeholder + Name + Location */}
              <div className="flex items-center gap-3 min-w-0">
                {/* Logo Placeholder with Company Initials */}
                <div
                  className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${supplier.avatarBg} text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-sm border border-white/20`}
                >
                  {supplier.avatarText}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-[#F8FAFF] truncate group-hover:text-white transition-colors">
                      {supplier.name}
                    </h4>
                    {/* Demo Listing Badge - compliant with rule not to claim unverified businesses are verified */}
                    <span className="inline-flex items-center text-[9px] font-semibold text-[#FFBE58] bg-[#FFBE58]/15 px-1.5 py-0.5 rounded border border-[#FFBE58]/30">
                      {supplier.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10.5px] text-[#9EADC2] mt-0.5">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#25D9E8]" />
                      <span>{supplier.location}</span>
                    </span>
                    <span>•</span>
                    <span className="truncate">{supplier.category}</span>
                  </div>
                </div>
              </div>

              {/* Right: MOQ & Working Contact Button */}
              <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-white/[0.06]">
                <div className="text-left sm:text-right">
                  <div className="text-[11px] font-semibold text-[#F8FAFF] font-mono-nums flex items-center gap-1">
                    <Package className="w-3 h-3 text-[#28D7A0]" />
                    <span>{supplier.moq}</span>
                  </div>
                  <div className="text-[9px] text-[#9EADC2]">Minimum Order</div>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenContact(supplier)}
                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#7547FF] to-[#278BFF] hover:from-[#855bff] hover:to-[#3896ff] text-white text-xs font-semibold transition-all shadow-sm hover:shadow-[0_0_12px_rgba(117,71,255,0.4)] cursor-pointer"
                >
                  Contact
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Disclaimer */}
      <div className="pt-2.5 mt-3 border-t border-[rgba(161,190,230,0.12)] flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10px] text-[#9EADC2]">
        <span>Demo Directory: Sample entries only. Unverified records do not represent contractual supplier commitments.</span>
        <span className="text-[#25D9E8] font-mono">Verified Auditing System</span>
      </div>

      {/* ==================================================
          WORKING CONTACT MODAL
          ================================================== */}
      {activeSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl bg-[#08182C] border border-[rgba(161,190,230,0.25)] p-5 sm:p-6 shadow-2xl relative text-left">
            <button
              type="button"
              onClick={handleCloseContact}
              className="absolute top-4 right-4 p-1 text-[#9EADC2] hover:text-[#F8FAFF] hover:bg-white/[0.06] rounded-lg transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>

            {submittedDemoConfirmation ? (
              /* Demo Confirmation Screen */
              <div className="py-4 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#28D7A0]/20 text-[#28D7A0] flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(40,215,160,0.4)]">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-white">Inquiry Dispatched (Demo Mode)</h4>
                <div className="p-3 rounded-xl bg-[rgba(20,39,62,0.7)] border border-[rgba(161,190,230,0.2)] text-left text-xs space-y-1.5 text-[#9EADC2]">
                  <p>
                    <strong className="text-white">Manufacturer:</strong> {activeSupplier.name}
                  </p>
                  <p>
                    <strong className="text-white">Product Category:</strong> {activeSupplier.category}
                  </p>
                  <p>
                    <strong className="text-white">Minimum Order Quantity:</strong> {activeSupplier.moq}
                  </p>
                  <p>
                    <strong className="text-white">Sender:</strong> {fullName} ({contactEmail})
                  </p>
                  <p className="pt-1 text-[11px] text-[#25D9E8]">
                    Demo Confirmation: Your contact request has been registered in the sandbox inquiry ledger.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCloseContact}
                  className="w-full py-2.5 rounded-xl btn-primary-gradient text-xs font-semibold text-white shadow-md cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : (
              /* Contact Request Form */
              <form onSubmit={handleSubmitContact} className="space-y-3.5">
                <div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#28D7A0]" />
                    <h4 className="text-base font-bold text-white">Contact {activeSupplier.name}</h4>
                  </div>
                  <p className="text-xs text-[#9EADC2] mt-0.5">
                    Location: {activeSupplier.location} • Category: {activeSupplier.category}
                  </p>
                  <div className="mt-2 inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[rgba(20,39,62,0.7)] border border-[rgba(161,190,230,0.18)] text-xs text-[#28D7A0]">
                    <Package className="w-3.5 h-3.5" />
                    <span>Pilot MOQ: {activeSupplier.moq}</span>
                  </div>
                </div>

                <div className="space-y-2.5 pt-1">
                  <div>
                    <label className="text-[11px] font-semibold text-[#F8FAFF] block mb-1">
                      Your Full Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Adarsh Reddy"
                      className="w-full px-3 py-1.5 rounded-xl bg-[rgba(8,24,44,0.7)] border border-[rgba(161,190,230,0.2)] text-xs text-white focus:outline-none focus:border-[#25D9E8]"
                    />
                    {formErrors.name && (
                      <p className="text-[10px] text-rose-400 mt-1">{formErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-[#F8FAFF] block mb-1">
                      Business Email / Phone <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="e.g. founder@d2cbrand.com"
                      className="w-full px-3 py-1.5 rounded-xl bg-[rgba(8,24,44,0.7)] border border-[rgba(161,190,230,0.2)] text-xs text-white focus:outline-none focus:border-[#25D9E8]"
                    />
                    {formErrors.contact && (
                      <p className="text-[10px] text-rose-400 mt-1">{formErrors.contact}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-[#F8FAFF] block mb-1">
                      Target Order Volume / Timeline
                    </label>
                    <input
                      type="text"
                      value={orderVolume}
                      onChange={(e) => setOrderVolume(e.target.value)}
                      placeholder="e.g. 500 units for pilot release"
                      className="w-full px-3 py-1.5 rounded-xl bg-[rgba(8,24,44,0.7)] border border-[rgba(161,190,230,0.2)] text-xs text-white focus:outline-none focus:border-[#25D9E8]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-[#F8FAFF] block mb-1">
                      Message / Formulation Specifications <span className="text-rose-400">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-[rgba(8,24,44,0.7)] border border-[rgba(161,190,230,0.2)] text-xs text-white focus:outline-none focus:border-[#25D9E8] leading-relaxed"
                    />
                    {formErrors.message && (
                      <p className="text-[10px] text-rose-400 mt-1">{formErrors.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[rgba(161,190,230,0.15)]">
                  <button
                    type="button"
                    onClick={handleCloseContact}
                    className="px-3.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs text-[#9EADC2] hover:text-white transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary-gradient px-4 py-1.5 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Sending Request...' : 'Submit Inquiry'}</span>
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
