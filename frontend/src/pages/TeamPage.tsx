import React, { useState, useEffect } from 'react';
import {
  Users2,
  Plus,
  Mail,
  Shield,
  Trash2,
  CheckCircle2,
  Clock,
  X,
  UserCheck,
  Share2,
  Copy,
  Check,
} from 'lucide-react';
import { getStoredTeam, saveStoredTeam, TeamMember } from '../utils/storage';

export const TeamPage: React.FC = () => {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<TeamMember['role']>('Growth Lead');
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    setTeam(getStoredTeam());
  }, []);

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    const newMember: TeamMember = {
      id: `team-${Date.now()}`,
      name: inviteName || inviteEmail.split('@')[0],
      email: inviteEmail,
      role: inviteRole,
      avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80`,
      status: 'Active',
      joinedDate: 'Nov 2026',
    };

    const updated = [...team, newMember];
    setTeam(updated);
    saveStoredTeam(updated);

    setInviteSuccess(true);
    setTimeout(() => {
      setInviteSuccess(false);
      setIsInviteOpen(false);
      setInviteName('');
      setInviteEmail('');
    }, 1200);
  };

  const handleRemove = (id: string) => {
    const updated = team.filter((m) => m.id !== id);
    setTeam(updated);
    saveStoredTeam(updated);
  };

  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(`https://d2cvision.app/join?team=${encodeURIComponent('D2C Vision Workspace')}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="rounded-2xl p-6 bg-[rgba(20,39,62,0.72)] border border-[rgba(161,190,230,0.25)] backdrop-blur-xl relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#278BFF]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#278BFF]/15 border border-[#278BFF]/30 text-[#278BFF] text-xs font-semibold mb-2">
              <Users2 className="w-3.5 h-3.5" />
              <span>Workspace Collaboration</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFF] tracking-tight">
              Team & Permissions
            </h1>
            <p className="text-xs sm:text-sm text-[#9EADC2] mt-1 max-w-2xl">
              Invite founders, growth marketers, packaging designers, and supply chain managers to collaborate on live product validation pipelines.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleCopyInviteLink}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-[#25D9E8] bg-white/[0.04] hover:bg-white/[0.08] border border-[rgba(161,190,230,0.2)] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-[#28D7A0]" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Link Copied!' : 'Copy Invite Link'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsInviteOpen(true)}
              className="btn-primary-gradient px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Invite Member</span>
            </button>
          </div>
        </div>
      </div>

      {/* Team Member Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {team.map((member) => (
          <div
            key={member.id}
            className="rounded-2xl p-5 bg-[rgba(20,39,62,0.72)] border border-[rgba(161,190,230,0.25)] backdrop-blur-xl shadow-lg flex flex-col justify-between relative group hover:border-[#25D9E8]/40 transition-all"
          >
            <div>
              <div className="flex items-start justify-between mb-3">
                <img
                  src={member.avatar}
                  alt={member.name}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-[#7547FF]/40 border border-white/20"
                />
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    member.role === 'Owner'
                      ? 'text-[#FFBE58] bg-[#FFBE58]/15 border-[#FFBE58]/30 font-bold'
                      : 'text-[#25D9E8] bg-[#25D9E8]/15 border-[#25D9E8]/30'
                  }`}
                >
                  {member.role}
                </span>
              </div>

              <h3 className="text-sm font-bold text-white leading-tight">{member.name}</h3>
              <p className="text-xs text-[#9EADC2] mt-0.5 truncate">{member.email}</p>

              <div className="mt-4 pt-3 border-t border-[rgba(161,190,230,0.15)] flex items-center justify-between text-[11px] text-[#9EADC2]">
                <span>Joined {member.joinedDate}</span>
                <span className="text-[#28D7A0] font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#28D7A0]" />
                  {member.status}
                </span>
              </div>
            </div>

            {member.role !== 'Owner' && (
              <div className="mt-4 pt-2 border-t border-[rgba(161,190,230,0.15)] flex justify-end">
                <button
                  type="button"
                  onClick={() => handleRemove(member.id)}
                  className="text-rose-400 hover:text-rose-300 text-xs flex items-center gap-1 p-1 rounded cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Member</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Invite Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl p-6 bg-[rgba(15,30,50,0.95)] border border-[rgba(161,190,230,0.3)] shadow-2xl relative">
            <button
              onClick={() => setIsInviteOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-white mb-1">Invite Workspace Collaborator</h3>
            <p className="text-xs text-[#9EADC2] mb-4">
              Collaborators will receive access to active product validations, manufacturer quotes, and unit economics.
            </p>

            <form onSubmit={handleInviteSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-200 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  className="w-full px-3 py-2 bg-[rgba(8,24,44,0.7)] border border-[rgba(161,190,230,0.2)] rounded-xl text-xs text-white focus:outline-none focus:border-[#7547FF]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-200 block mb-1">Corporate Email</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="priya@brand.com"
                  className="w-full px-3 py-2 bg-[rgba(8,24,44,0.7)] border border-[rgba(161,190,230,0.2)] rounded-xl text-xs text-white focus:outline-none focus:border-[#7547FF]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-200 block mb-1">Workspace Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#08182C] border border-[rgba(161,190,230,0.2)] rounded-xl text-xs text-white focus:outline-none cursor-pointer"
                >
                  <option value="Growth Lead">Growth Lead (CAC & Performance Ads)</option>
                  <option value="Supply Chain Lead">Supply Chain Lead (Manufacturers & MOQs)</option>
                  <option value="Product Designer">Product Designer (Packaging & Aesthetics)</option>
                  <option value="Marketer">Marketer (Creator & UGC Management)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteSuccess}
                  className="btn-primary-gradient px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  {inviteSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      <span>Invitation Dispatched!</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      <span>Send Invitation</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
