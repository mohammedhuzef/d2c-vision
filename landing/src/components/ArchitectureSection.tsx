import React from 'react';
import { Bot, Binary, ShieldCheck, Check, AlertTriangle, Code2 } from 'lucide-react';
import { AI_INVESTIGATOR_SPECS, PYTHON_JUDGE_SPECS } from '../data/facts';

export const ArchitectureSection: React.FC = () => {
  return (
    <section id="architecture" className="py-16 md:py-24 bg-white border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-12 md:mb-16">
          <span className="text-xs font-bold text-[#4F46E5] uppercase tracking-wider bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full">
            System Architecture
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#0F172A] tracking-tight mt-3">
            AI Investigator, Python Judge: Strict Separation of Concerns
          </h2>
          <p className="text-base sm:text-lg text-[#64748B] mt-3">
            Most "AI tools" let language models calculate numbers and hallucinate viability scores. LaunchTwin AI strictly isolates LLMs to raw text evidence gathering, leaving all mathematical computations and verdicts to pure Python code.
          </p>
        </div>

        {/* 2-Column Comparative Architecture */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Column 1: AI Investigator */}
          <div className="bg-[#F8FAFC] rounded-[14px] border border-[#E2E8F0] p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100/80 text-[#4F46E5] flex items-center justify-center">
                    <Bot className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#0F172A]">AI Investigator</h3>
                    <p className="text-xs font-semibold text-[#64748B]">Evidence Extraction Only</p>
                  </div>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-50 text-[#4F46E5] border border-indigo-200">
                  Provider: LLM
                </span>
              </div>

              {/* Guardrails Callout */}
              <div className="p-3.5 rounded-lg bg-amber-50/70 border border-amber-200 text-xs text-[#B45309] space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-[#D97706]" aria-hidden="true" />
                  <span>Strict AI Operational Constraints</span>
                </div>
                <p>
                  AI extracts competitor text and prices from live URLs. It has zero access to scoring algorithms, cannot emit pass/fail verdicts, and cannot alter financial calculations.
                </p>
              </div>

              {/* Specifications List */}
              <div className="space-y-4">
                {AI_INVESTIGATOR_SPECS.map((spec, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#059669] shrink-0" aria-hidden="true" />
                      <h4 className="text-xs font-bold text-[#0F172A]">{spec.title}</h4>
                    </div>
                    <p className="text-xs text-[#64748B] pl-6 leading-relaxed">
                      {spec.description}
                    </p>
                    <div className="pl-6 pt-0.5">
                      <code className="text-[10px] font-mono text-[#4F46E5] bg-indigo-50/50 px-1 py-0.5 rounded">
                        {spec.source}
                      </code>
                    </div>
                  </div>
                ))}
              </div>

            </div>

            <div className="pt-4 border-t border-[#E2E8F0] text-xs text-[#64748B] flex items-center justify-between">
              <span>Scoring Authority: <strong className="text-[#DC2626]">None (0%)</strong></span>
              <span>Confidence Cap: <strong className="font-mono text-[#0F172A]">80%</strong></span>
            </div>
          </div>

          {/* Column 2: Python Judge */}
          <div className="bg-[#F8FAFC] rounded-[14px] border border-[#E2E8F0] p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100/80 text-[#059669] flex items-center justify-center">
                    <Binary className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#0F172A]">Python Judge</h3>
                    <p className="text-xs font-semibold text-[#64748B]">Deterministic Decisions & Math</p>
                  </div>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-50 text-[#059669] border border-emerald-200">
                  Engine: Decimal
                </span>
              </div>

              {/* Mathematical Precision Callout */}
              <div className="p-3.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs text-[#065F46] space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#059669]" aria-hidden="true" />
                  <span>Exact 50-Digit Decimal Math</span>
                </div>
                <p>
                  Calculates unit economics, break-even unit volumes, and fee amortization using pure Python <code className="font-mono bg-emerald-100/50 px-1 rounded">Decimal(prec=50)</code>. No IEEE 754 floating-point errors.
                </p>
              </div>

              {/* Specifications List */}
              <div className="space-y-4">
                {PYTHON_JUDGE_SPECS.map((spec, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-[#4F46E5] shrink-0" aria-hidden="true" />
                      <h4 className="text-xs font-bold text-[#0F172A]">{spec.title}</h4>
                    </div>
                    <p className="text-xs text-[#64748B] pl-6 leading-relaxed">
                      {spec.description}
                    </p>
                    <div className="pl-6 pt-0.5">
                      <code className="text-[10px] font-mono text-[#059669] bg-emerald-50/50 px-1 py-0.5 rounded">
                        {spec.source}
                      </code>
                    </div>
                  </div>
                ))}
              </div>

            </div>

            <div className="pt-4 border-t border-[#E2E8F0] text-xs text-[#64748B] flex items-center justify-between">
              <span>Decision Authority: <strong className="text-[#059669]">100% Deterministic</strong></span>
              <span>Precision: <strong className="font-mono text-[#0F172A]">50 Digits</strong></span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
