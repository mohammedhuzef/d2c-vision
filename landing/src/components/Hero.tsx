import React from 'react';
import { ArrowRight, ArrowUpRight, CheckCircle2, AlertTriangle, Shield, Check, Info } from 'lucide-react';
import { APP_URL, NEW_ANALYSIS_URL } from '../config';
import { SAMPLE_READINESS_CARD } from '../data/facts';

export const Hero: React.FC = () => {
  return (
    <section className="pt-12 pb-16 md:pt-20 md:pb-24 border-b border-[#E2E8F0] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Headlines & Action CTAs */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Trust Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-[#4F46E5] text-xs font-semibold tracking-wide uppercase">
              <Shield className="w-3.5 h-3.5 text-[#4F46E5]" aria-hidden="true" />
              <span>Deterministic D2C Launch Validation</span>
            </div>

            {/* Single H1 Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#0F172A] tracking-tight leading-[1.15]">
              Validate Your D2C Product Before Spending on Inventory
            </h1>

            {/* Promise Line */}
            <p className="text-lg sm:text-xl font-semibold text-[#4F46E5]">
              AI finds the evidence. Python rules decide the verdict.
            </p>

            {/* Analytical Subtext */}
            <p className="text-base sm:text-lg text-[#64748B] max-w-2xl leading-relaxed">
              Eliminate guesswork before committing working capital. LaunchTwin AI crawls live competitor benchmarks,
              enforces exact 50-digit unit economics, and applies strict multi-stage veto rules so you never launch into an impossible margin.
            </p>

            {/* Dual CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <a
                href={NEW_ANALYSIS_URL}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold text-white bg-[#4F46E5] hover:bg-[#4338CA] active:bg-[#3730A3] rounded-lg shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#4F46E5]"
                id="hero-cta-start"
              >
                <span>Start an analysis</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </a>

              <a
                href={APP_URL}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold text-[#0F172A] bg-white hover:bg-slate-50 border border-[#E2E8F0] rounded-lg shadow-xs transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-300"
                id="hero-cta-open"
              >
                <span>Open the app</span>
                <ArrowUpRight className="w-4 h-4 text-[#64748B]" aria-hidden="true" />
              </a>
            </div>

            {/* Core Truth Micro-guarantees */}
            <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-[#64748B]">
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-[#059669] shrink-0" aria-hidden="true" />
                <span>Zero AI hallucinations in math</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-[#059669] shrink-0" aria-hidden="true" />
                <span>Exact Decimal 50-digit precision</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-[#059669] shrink-0" aria-hidden="true" />
                <span>Absolute critical stage vetoes</span>
              </div>
            </div>

          </div>

          {/* Right Column: Static Sample Readiness Card (Labelled "Example") */}
          <div className="lg:col-span-5">
            <div className="relative">
              
              {/* Card Container */}
              <div className="bg-white rounded-[14px] border border-[#E2E8F0] shadow-md p-6 space-y-5">
                
                {/* Header: Example Badge & Product Title */}
                <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                  <div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-[#4F46E5] bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200 mb-1">
                      <Info className="w-3 h-3" aria-hidden="true" />
                      Example
                    </span>
                    <h2 className="text-base font-bold text-[#0F172A]">
                      {SAMPLE_READINESS_CARD.title}
                    </h2>
                  </div>

                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-[#059669] border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                      {SAMPLE_READINESS_CARD.verdict}
                    </span>
                    <div className="text-[11px] text-[#64748B] mt-0.5 font-mono">
                      Score: <span className="font-semibold text-[#0F172A]">{SAMPLE_READINESS_CARD.overallScore}</span>/100
                    </div>
                  </div>
                </div>

                {/* Key Unit Economics Snapshot */}
                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-lg bg-slate-50 border border-slate-200/80">
                  <div>
                    <span className="text-[11px] text-[#64748B] uppercase tracking-wide block">Selling Price</span>
                    <span className="text-base font-bold font-mono text-[#0F172A]">{SAMPLE_READINESS_CARD.sellingPrice}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#64748B] uppercase tracking-wide block">Variable Cost</span>
                    <span className="text-base font-bold font-mono text-[#0F172A]">{SAMPLE_READINESS_CARD.variableCost}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#64748B] uppercase tracking-wide block">Unit Contribution</span>
                    <span className="text-base font-bold font-mono text-[#059669]">{SAMPLE_READINESS_CARD.contribution}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#64748B] uppercase tracking-wide block">Break-Even Sales</span>
                    <span className="text-base font-bold font-mono text-[#4F46E5]">{SAMPLE_READINESS_CARD.breakEven}</span>
                  </div>
                </div>

                {/* Cost Component Breakdown (Vector A Baseline) */}
                <div>
                  <div className="text-xs font-semibold text-[#0F172A] mb-2 flex items-center justify-between">
                    <span>Variable Cost Breakdown</span>
                    <span className="text-[11px] text-[#64748B] font-mono">Margin: 54.00%</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {SAMPLE_READINESS_CARD.breakdown.map((item) => (
                      <div key={item.label} className="flex items-center justify-between px-2.5 py-1.5 rounded bg-white border border-slate-200">
                        <span className="text-[#64748B]">{item.label}</span>
                        <span className="font-mono font-semibold text-[#0F172A]">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mini Stage Status Checklist */}
                <div>
                  <div className="text-xs font-semibold text-[#0F172A] mb-2">
                    6-Stage Pipeline Snapshot
                  </div>
                  <div className="space-y-1.5 text-xs">
                    {SAMPLE_READINESS_CARD.stages.map((stage) => (
                      <div
                        key={stage.name}
                        className="flex items-center justify-between py-1 px-2 rounded hover:bg-slate-50 transition-colors"
                      >
                        <span className="text-[#0F172A] font-medium truncate pr-2">
                          {stage.name}
                        </span>
                        <span className="flex items-center gap-1 font-mono text-[11px] shrink-0">
                          {stage.status === 'PASSED' ? (
                            <span className="text-[#059669] flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                              Passed
                            </span>
                          ) : (
                            <span className="text-[#D97706] flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" aria-hidden="true" />
                              Warning
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer caption */}
                <div className="pt-2 border-t border-[#E2E8F0] text-[11px] text-[#64748B] flex items-center justify-between">
                  <span>Proved baseline: Vector A</span>
                  <span className="font-mono text-[#4F46E5]">Fixed Costs: ₹50,000</span>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
