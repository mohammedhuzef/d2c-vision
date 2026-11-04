import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  RefreshCw,
} from 'lucide-react';

interface Message {
  sender: 'ai' | 'user';
  text: string;
  tags?: string[];
}

export const HeroAIAssistant: React.FC = () => {
  const [inputVal, setInputVal] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ai',
      text: "Hello Adarsh! I'm your D2C Co-founder. Ready to test product viability, model unit economics, and manage your launch roadmap.",
      tags: ['Viability 92/100', '68% Margin', 'Pilot Ready'],
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const quickActions = [
    'Validate this product idea',
    'Estimate profit margins',
    'Find product-fit creators',
    'Calculate break-even units',
    'Suggest packaging specs',
    'Review active projects',
  ];

  const handleActionClick = (action: string) => {
    // Add user message
    const userMsg: Message = { sender: 'user', text: action };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    setTimeout(() => {
      let aiResponseText = '';
      let tags: string[] = [];

      switch (action) {
        case 'Validate this product idea':
          aiResponseText =
            '✅ Viability Score: 92/100 (Strong Launch Candidate). Artisanal organic chocolate & clean plant snacks show +24% YoY search growth with 68% gross margin. Recommend starting with a 500-unit pilot batch.';
          tags = ['High Demand', '68% Margin', '500 MOQ'];
          break;
        case 'Estimate profit margins':
          aiResponseText =
            '💰 Unit Economics Breakdown: Retail ₹299. COGS: ₹74 (24.7%). Shipping & Fulfillment: ₹48. Blended CAC: ₹48. Net Contribution: ₹129 per unit (43.1% Net Margin). Excellent unit economics.';
          tags = ['₹129 Contribution', '43% Margin', 'Break-even: 110 units'];
          break;
        case 'Find product-fit creators':
          aiResponseText =
            '🎯 Creator Match Analysis: Found 8 vetted creators with 94%+ affinity for organic snacks and wellness products. Avg. predicted campaign ROAS is 4.4x with verified audience in Mumbai & Bengaluru.';
          tags = ['4.4x ROAS', '8 Creators', 'High Conversion'];
          break;
        case 'Calculate break-even units':
          aiResponseText =
            '📊 At ₹110,000 monthly fixed overhead and ₹129 contribution per unit, your break-even threshold is 853 units per month (approx. 29 orders/day).';
          tags = ['853 Units/Mo', '29 Orders/Day', 'Low Risk'];
          break;
        case 'Suggest packaging specs':
          aiResponseText =
            '🎨 Recommendation: Deep matte midnight-navy sleeve with metallic foil stamping. Foil barrier ensures 12-month shelf life without synthetic preservatives. Sustainable FSC-certified paper.';
          tags = ['Matte Foil', 'FSC Certified', '12mo Shelf-life'];
          break;
        case 'Review active projects':
          aiResponseText =
            '📁 You have 2 active projects: Artisanal Dark Chocolate (Viability 92/100) and Cold Brew Hibiscus Tonic (Viability 84/100). Both have complete unit cost models ready in My Projects.';
          tags = ['2 Projects', 'Live Models', 'Ready to Scale'];
          break;
        default:
          aiResponseText = `Analysis complete for: "${action}". The unit economics and customer demand index indicate high viability for a D2C launch.`;
          tags = ['Analysis Complete'];
      }

      setMessages((prev) => [...prev, { sender: 'ai', text: aiResponseText, tags }]);
      setIsTyping(false);
    }, 500);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const query = inputVal.trim();
    setInputVal('');
    setMessages((prev) => [...prev, { sender: 'user', text: query }]);
    setIsTyping(true);

    setTimeout(() => {
      let reply = `Based on current D2C market data, "${query}" shows strong consumer demand in healthy lifestyle categories. You can run a full validation test or model the unit economics in the Profit Calculator.`;
      let tags = ['Data-Backed', 'High Potential'];

      if (query.toLowerCase().includes('price') || query.toLowerCase().includes('cost') || query.toLowerCase().includes('margin')) {
        reply = 'For this price tier, we project a 62-68% gross margin assuming packaging and raw ingredient costs under 25-30% of MSRP. Head over to Profit Calculator to model custom scenarios.';
        tags = ['65% Projected', 'High Margin'];
      } else if (query.toLowerCase().includes('validat') || query.toLowerCase().includes('score')) {
        reply = 'Initial viability score is estimated at 88/100 with low competitive density. Check out the Product Validation tab for a 360-degree viability audit.';
        tags = ['Viability 88', 'Strong Demand'];
      }

      setMessages((prev) => [...prev, { sender: 'ai', text: reply, tags }]);
      setIsTyping(false);
    }, 500);
  };

  return (
    <div className="rounded-2xl p-4 sm:p-5 bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between h-full relative overflow-hidden transition-all">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">AI Assistant</h3>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-[10.5px] text-slate-500 leading-none mt-0.5">Your co-founder, always here.</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/70">
            Interactive Demo
          </span>
          <button
            type="button"
            onClick={() =>
              setMessages([
                {
                  sender: 'ai',
                  text: "Hello Adarsh! I'm your D2C Co-founder. Ready to test product viability, model unit economics, and manage your launch roadmap.",
                  tags: ['Viability 92/100', '68% Margin', 'Pilot Ready'],
                },
              ])
            }
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Reset conversation"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="py-3 space-y-2.5 flex-1 overflow-y-auto max-h-[175px] sm:max-h-[195px] pr-1 relative z-10">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${
              msg.sender === 'user' ? 'items-end' : 'items-start'
            } text-xs`}
          >
            <div
              className={`max-w-[92%] p-2.5 rounded-2xl leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-slate-900 text-white rounded-br-none shadow-xs'
                  : 'bg-slate-50 text-slate-800 border border-slate-200/70 rounded-bl-none'
              }`}
            >
              {msg.text}
            </div>

            {/* Tags Pills for AI message */}
            {msg.tags && msg.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1.5 pl-1">
                {msg.tags.map((tag, tIdx) => (
                  <span
                    key={tIdx}
                    className="text-[9.5px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-200/70 text-slate-400 text-xs w-24">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" />
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]" />
          </div>
        )}
      </div>

      {/* Quick Action Suggested Chips */}
      <div className="pt-2 border-t border-slate-100 relative z-10">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
          Quick Actions
        </span>
        <div className="flex flex-wrap gap-1.5">
          {quickActions.map((action, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleActionClick(action)}
              className="text-[10.5px] font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap active:scale-95"
            >
              {action}
            </button>
          ))}
        </div>
      </div>

      {/* Input Box Form */}
      <form onSubmit={handleSendMessage} className="mt-3 relative z-10">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-50 border border-slate-200 focus-within:bg-white focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/10 transition-all">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Ask about margins, demand, or validation..."
            className="flex-1 bg-transparent text-xs text-slate-900 placeholder-slate-400 px-2.5 py-1 outline-none"
          />
          <button
            type="submit"
            disabled={!inputVal.trim()}
            className="w-7 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center disabled:opacity-40 transition-all cursor-pointer shrink-0 shadow-2xs"
            aria-label="Send message"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
};
