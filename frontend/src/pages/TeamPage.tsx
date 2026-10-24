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
} from 'lucide-react';
import { getStoredTeam, saveStoredTeam, TeamMember } from '../utils/storage';

export const TeamPage: React.FC = () => {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<TeamMember['role']>('Growth Lead');
  const [inviteSuccess, setInviteSuccess] = useState(false);

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
      joinedDate: 'Oct 2026',
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

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="glass-panel rounded-2xl p-6 border border-white/[0.08] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-semibold mb-2">
              <Users2 className="w-3.5 h-3.5" />
              <span>Workspace Collaboration</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Team & Permissions
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Invite founders, growth marketers, packaging designers, and supply chain managers to collaborate on live product validation pipelines.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsInviteOpen(true)}
            className="btn-primary-gradient px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white flex items-center gap-2 shadow-lg cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Invite Team Member</span>
          </button>
        </div>
      </div>

      {/* Team Member Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {team.map((member) => (
          <div
            key={member.id}
            className="glass-panel rounded-2xl p-5 border border-white/[0.08] flex flex-col justify-between relative group"
          >
            <div>
              <div className="flex items-start justify-between mb-3">
                <img
                  src={member.avatar}
                  alt={member.name}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-indigo-500/30"
                />
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    member.role === 'Owner'
                      ? 'text-amber-400 bg-amber-500/15 border-amber-500/30'
                      : 'text-indigo-400 bg-indigo-500/15 border-indigo-500/30'
                  }`}
                >
                  {member.role}
                </span>
              </div>

              <h3 className="text-sm font-bold text-white leading-tight">{member.name}</h3>
              <p className="text-xs text-slate-400 mt-0.5 truncate">{member.email}</p>

              <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400">
                <span>Joined {member.joinedDate}</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {member.status}
                </span>
              </div>
            </div>

            {member.role !== 'Owner' && (
              <div className="mt-4 pt-2 border-t border-white/[0.06] flex justify-end">
                <button
                  type="button"
                  onClick={() => handleRemove(member.id)}
                  className="text-rose-400 hover:text-rose-300 text-xs flex items-center gap-1 p-1 rounded"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Invite Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md glass-panel rounded-2xl p-6 border border-white/[0.12] shadow-2xl relative">
            <button
              onClick={() => setIsInviteOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-white mb-1">Invite Team Member</h3>
            <p className="text-xs text-slate-400 mb-4">Send an invitation to collaborate on your D2C workspace.</p>

            {inviteSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-center my-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-white">Invitation Sent!</p>
                <p className="text-[11px] text-slate-300 mt-1">The member has been added to your workspace.</p>
              </div>
            ) : (
              <form onSubmit={handleInviteSubmit} className="space-y-3.5">
                <div>
                  <label className="text-xs font-semibold text-slate-200 block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="e.g. Sneha Roy"
                    className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.1] rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-200 block mb-1">Work Email</label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="sneha@d2cvision.ai"
                    className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.1] rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-200 block mb-1">Team Role & Permission</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#090D18] border border-white/[0.1] rounded-xl text-xs text-white focus:outline-none"
                  >
                    <option value="Growth Lead">Growth Lead (Ad copy, Marketing, Influencers)</option>
                    <option value="Supply Chain Lead">Supply Chain Lead (Manufacturers & RFQs)</option>
                    <option value="Product Designer">Product Designer (Packaging & Formulas)</option>
                    <option value="Marketer">Marketer (Read-only Analytics)</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => setIsInviteOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white/[0.05] text-xs font-semibold text-slate-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary-gradient px-5 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Send Invite</span>
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
