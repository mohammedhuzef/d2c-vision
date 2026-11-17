import React from 'react';
import { ShieldAlert, CheckCircle, AlertOctagon, GitCommit } from 'lucide-react';
import { VALIDATION_STAGES } from '../data/facts';

export const PipelineSection: React.FC = () => {
  return (
    <section id="pipeline" className="py-16 md:py-24 bg-[#F8FAFC] border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-12 md:mb-16">
          <span className="text-xs font-bold text-[#4F46E5] uppercase tracking-wider bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full">
            The Engine
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#0F172A] tracking-tight mt-3">
            The 6-Stage Validation Pipeline & Veto Rules
          </h2>
          <p className="text-base sm:text-lg text-[#64748B] mt-3">
            Every product is evaluated sequentially against hard-coded deterministic thresholds. Pricing and Financial stages hold absolute veto authority.
          </p>
        </div>

        {/* 6 Stages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {VALIDATION_STAGES.map((stage, index) => {
            return (
              <div
                key={stage.id}
                className={`rounded-[14px] p-6 shadow-xs flex flex-col justify-between transition-colors ${
                  stage.isCritical
                    ? 'bg-white border-2 border-indigo-500/40 hover:border-indigo-600 relative ring-4 ring-indigo-50/50'
                    : 'bg-white border border-[#E2E8F0] hover:border-slate-300'
                }`}
              >
                <div className="space-y-4">
                  
                  {/* Top Bar: Stage #, Weight & Critical Badge */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center font-mono text-xs font-bold text-[#64748B]">
                        {index + 1}
                      </span>
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-[#0F172A]">
                        Weight: {stage.weightLabel}
                      </span>
                    </div>

                    {stage.isCritical ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#DC2626] bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                        <AlertOctagon className="w-3 h-3" aria-hidden="true" />
                        Critical Veto
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-[#64748B]">
                        Standard Stage
                      </span>
                    )}
                  </div>

                  {/* Stage Title & One-line Description */}
                  <div>
                    <h3 className="text-base font-bold text-[#0F172A]">
                      {stage.name}
                    </h3>
                    <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                      {stage.oneLineDescription}
                    </p>
                  </div>

                  {/* Real Rule From FACTS.md */}
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-xs">
                    <span className="font-semibold text-[#0F172A] block mb-1">
                      Deterministic Rule:
                    </span>
                    <p className="text-[#475569] leading-relaxed">
                      {stage.ruleFromFacts}
                    </p>
                  </div>

                  {/* Veto Callout for Critical Stages */}
                  {stage.isCritical && (
                    <div className="p-2.5 rounded-lg bg-red-50/70 border border-red-200/80 text-[11px] text-[#DC2626] flex items-start gap-1.5">
                      <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                      <span className="leading-snug font-medium">
                        {stage.vetoBehavior}
                      </span>
                    </div>
                  )}

                  {/* DAG Dependency Indicator */}
                  {stage.dependencies && stage.dependencies.length > 0 && (
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#4F46E5] pt-1">
                      <GitCommit className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>DAG Dependency: requires <span className="font-mono">{stage.dependencies.join(', ')}</span></span>
                    </div>
                  )}

                </div>

                <div className="pt-4 mt-4 border-t border-[#E2E8F0] flex items-center justify-between text-[11px] text-[#64748B]">
                  <span>Stage key: <code className="font-mono text-[#0F172A]">{stage.id}</code></span>
                  <span>{stage.isCritical ? '20 pts max' : '15 pts max'}</span>
                </div>

              </div>
            );
          })}
        </div>

        {/* Scoring & Veto Truth Banner */}
        <div className="mt-12 bg-white rounded-[14px] border border-[#E2E8F0] p-6 shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-[#0F172A]">
                <CheckCircle className="w-4 h-4 text-[#059669]" aria-hidden="true" />
                <span>Deterministic Scoring Math</span>
              </div>
              <p className="text-[#64748B] leading-relaxed">
                Stage scores start at <span className="font-mono font-semibold text-[#0F172A]">100.00</span>. Warning findings deduct <span className="font-mono text-[#D97706]">-25.00</span>, Critical findings deduct <span className="font-mono text-[#DC2626]">-30.00</span>. Failed stages are capped at <span className="font-mono text-[#DC2626]">≤ 40.00</span>.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-[#0F172A]">
                <AlertOctagon className="w-4 h-4 text-[#DC2626]" aria-hidden="true" />
                <span>Absolute Veto Enforced</span>
              </div>
              <p className="text-[#64748B] leading-relaxed">
                If either <span className="font-semibold text-[#0F172A]">Pricing</span> or <span className="font-semibold text-[#0F172A]">Financial</span> stages fail, the overall verdict is unconditionally <span className="font-mono font-bold text-[#DC2626]">NOT_READY</span>, overriding any numeric readiness score.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-[#0F172A]">
                <GitCommit className="w-4 h-4 text-[#4F46E5]" aria-hidden="true" />
                <span>Topological Invalidation DAG</span>
              </div>
              <p className="text-[#64748B] leading-relaxed">
                Modifying pricing assumptions only invalidates pricing and downstream marketing stages; upstream customer & packaging evidence is safely carried forward without re-running.
              </p>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
