import React from 'react';
import { ShieldCheck, ArrowUpRight } from 'lucide-react';
import { APP_URL, NEW_ANALYSIS_URL } from '../config';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-[#E2E8F0] pt-12 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-12 border-b border-[#E2E8F0]">
          
          {/* Brand Col */}
          <div className="md:col-span-6 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#4F46E5] flex items-center justify-center text-white shadow-xs">
                <ShieldCheck className="w-4 h-4 text-white" aria-hidden="true" />
              </div>
              <span className="font-bold text-[#0F172A] tracking-tight text-base">
                LaunchTwin AI
              </span>
            </div>
            <p className="text-xs text-[#64748B] max-w-sm leading-relaxed">
              Deterministic pre-launch product validation for direct-to-consumer founders. AI finds market evidence; pure Python rules decide viability verdicts with 50-digit exact arithmetic.
            </p>
            <div className="text-[11px] text-[#64748B]">
              <span>Ground truth catalog: </span>
              <code className="font-mono text-[#0F172A] bg-slate-100 px-1 py-0.5 rounded">landing/FACTS.md</code>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
              Validation Engine
            </h4>
            <ul className="space-y-2 text-xs text-[#64748B]">
              <li><a href="#problem" className="hover:text-[#0F172A] transition-colors">The D2C Problem</a></li>
              <li><a href="#how-it-works" className="hover:text-[#0F172A] transition-colors">How It Works</a></li>
              <li><a href="#pipeline" className="hover:text-[#0F172A] transition-colors">6-Stage Pipeline</a></li>
              <li><a href="#architecture" className="hover:text-[#0F172A] transition-colors">AI vs Python Architecture</a></li>
            </ul>
          </div>

          {/* App Actions */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
              Application
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href={NEW_ANALYSIS_URL}
                  className="text-[#4F46E5] hover:text-[#4338CA] font-medium inline-flex items-center gap-1"
                >
                  <span>Start New Analysis</span>
                  <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
              </li>
              <li>
                <a
                  href={APP_URL}
                  className="text-[#0F172A] hover:text-[#4F46E5] font-medium inline-flex items-center gap-1"
                >
                  <span>Open Application Dashboard</span>
                  <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#64748B] gap-4">
          <p>
            © {new Date().getFullYear()} LaunchTwin AI. Built with deterministic Python & React.
          </p>
          <p className="text-[11px]">
            Strict adherence to platform truth rules. Zero invented metrics, testimonials, or logos.
          </p>
        </div>
      </div>
    </footer>
  );
};
