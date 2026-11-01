import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
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
      text: "Hello Adarsh! I'm your D2C Co-founder. Ready to analyze your product margins, find OEM factories, or discover viral creators.",
      tags: ['Viability 92/100', 'OEM Ready', 'Creator Network'],
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const quickActions = [
    'Validate this product idea',
    'Find manufacturers',
    'Suggest packaging designs',
    'Estimate profit margins',
    'Find relevant influencers',
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
        case 'Find manufacturers':
          aiResponseText =
            '🏭 3 Verified Manufacturers identified in South & West India (Campco Co-Op, CocoaCraft Labs, NutraCaps). All have FSSAI & ISO 22000 certification with MOQs starting at 250 units.';
          tags = ['FSSAI Certified', 'ISO 22000', 'Verified OEM'];
          break;
        case 'Suggest packaging designs':
          aiResponseText =
            '🎨 Recommendation: Deep matte midnight-navy sleeve with metallic gold foil stamping. Foil barrier ensures 12-month shelf life without synthetic preservatives. Sustainable FSC-certified paper.';
          tags = ['Matte Foil', 'FSC Certified', '12mo Shelf-life'];
          break;
        case 'Estimate profit margins':
          aiResponseText =
            '💰 Unit Economics Breakdown: Retail ₹299. COGS: ₹74 (24.7%). Shipping & Fulfillment: ₹48. Blended CAC: ₹48. Net Profit: ₹129 per unit (43.1% Net Margin). Excellent unit economics.';
          tags = ['₹129 Net Profit', '43% Net', 'Break-even: 110 units'];
          break;
        case 'Find relevant influencers':
          aiResponseText =
            '🌟 12 Micro-influencers matched (15k-90k followers, >5.4% engagement rate) in health food, clean living, and fitness niches. Estimated gifted seeding response rate: 45%.';
          tags = ['12 Matched', '5.4% Engagement', 'High ROI'];
          break;
        default:
          aiResponseText = `Analysis complete for: "${action}". The unit economics and customer demand index indicate high viability for a D2C launch.`;
          tags = ['Analysis Complete'];
      }

      setMessages((prev) => [...prev, { sender: 'ai', text: aiResponseText, tags }]);
      setIsTyping(false);
    }, 600);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const query = inputVal.trim();
    setInputVal('');
    setMessages((prev) => [...prev, { sender: 'user', text: query }]);
    setIsTyping(true);

    setTimeout(() => {
      let reply = `Based on current D2C market data, "${query}" is trending in premium health & lifestyle categories. We suggest setting up a 14-day validation funnel with Meta ads to test pre-orders.`;
      let tags = ['Data-Backed', '14-Day Funnel'];

      if (query.toLowerCase().includes('supplier') || query.toLowerCase().includes('manufactur')) {
        reply = 'We have 18+ verified OEM manufacturers ready for this product type with low MOQ guarantees (250-500 units) and GMP certification.';
        tags = ['Verified OEM', 'Low MOQ'];
      } else if (query.toLowerCase().includes('price') || query.toLowerCase().includes('cost')) {
        reply = 'Optimal price corridor is ₹299 - ₹499 for initial D2C consumer acquisition, giving you sufficient room for ₹90-120 blended CAC.';
        tags = ['Price ₹299-₹499', 'Target CAC ₹90'];
      }

      setMessages((prev) => [...prev, { sender: 'ai', text: reply, tags }]);
      setIsTyping(false);
    }, 700);
  };

  const resetChat = () => {
    setMessages([
      {
        sender: 'ai',
        text: "Hello Adarsh! I'm your D2C Co-founder. Ready to analyze your product margins, find OEM factories, or discover viral creators.",
        tags: ['Viability 92/100', 'OEM Ready', 'Creator Network'],
      },
    ]);
  };

  return (
    <div className="rounded-2xl p-4 bg-[rgba(20,39,62,0.72)] backdrop-blur-xl border border-[rgba(161,190,230,0.25)] shadow-xl relative overflow-hidden flex flex-col justify-between">
      {/* Subtle ambient light */}
      <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-[#25D9E8]/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-2.5 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#7547FF] to-[#25D9E8] flex items-center justify-center text-white shadow-[0_0_10px_rgba(117,71,255,0.4)]">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#F8FAFF] tracking-tight leading-tight">
              AI Assistant
            </h3>
            <p className="text-[10px] text-[#9EADC2]">Your co-founder, always here.</p>
          </div>
        </div>

        {/* Demo Mode Badge */}
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-medium text-[#25D9E8] bg-[#25D9E8]/10 px-2 py-0.5 rounded-full border border-[#25D9E8]/30">
            Interactive Demo
          </span>
          <button
            type="button"
            onClick={resetChat}
            title="Reset conversation"
            className="p-1 text-[#9EADC2] hover:text-[#F8FAFF] transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Chat Messages Log */}
      <div className="space-y-2 mb-3 max-h-[140px] overflow-y-auto pr-1 no-scrollbar text-xs relative z-10">
        {messages.slice(-3).map((msg, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`p-2 rounded-xl max-w-[92%] leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-gradient-to-r from-[#7547FF] to-[#278BFF] text-white text-[11px]'
                  : 'bg-[rgba(8,24,44,0.7)] border border-[rgba(161,190,230,0.18)] text-[#F8FAFF] text-[11px]'
              }`}
            >
              {msg.text}

              {/* Tags if present */}
              {msg.tags && msg.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5 pt-1 border-t border-white/[0.08]">
                  {msg.tags.map((tag, tIdx) => (
                    <span
                      key={tIdx}
                      className="text-[9px] font-semibold text-[#25D9E8] bg-[#25D9E8]/10 px-1.5 py-0.5 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-1.5 text-[10px] text-[#25D9E8] bg-[rgba(8,24,44,0.6)] px-2.5 py-1 rounded-lg w-max border border-[rgba(161,190,230,0.18)]">
            <Sparkles className="w-3 h-3 animate-spin" />
            <span>AI Co-founder analyzing market data...</span>
          </div>
        )}
      </div>

      {/* Quick Action Buttons */}
      <div className="mb-3 relative z-10">
        <div className="text-[10px] font-medium text-[#9EADC2] mb-1.5 uppercase tracking-wider">
          Quick Actions
        </div>
        <div className="flex flex-wrap gap-1">
          {quickActions.map((action, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleActionClick(action)}
              className="text-[10px] font-medium text-[#F8FAFF] bg-[rgba(8,24,44,0.6)] hover:bg-[rgba(20,39,62,0.9)] hover:text-[#25D9E8] border border-[rgba(161,190,230,0.2)] hover:border-[#25D9E8]/50 px-2 py-1 rounded-lg transition-all text-left truncate cursor-pointer"
            >
              {action}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Input Field & Glowing Send Button */}
      <form onSubmit={handleSendMessage} className="relative z-10">
        <div className="relative flex items-center">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Ask anything..."
            className="w-full h-8 pl-3 pr-9 rounded-xl bg-[rgba(8,24,44,0.7)] border border-[rgba(161,190,230,0.22)] text-xs text-[#F8FAFF] placeholder:text-[#9EADC2]/70 focus:outline-none focus:border-[#7547FF] focus:ring-1 focus:ring-[#7547FF]/50 transition-all font-sans"
          />
          <button
            type="submit"
            disabled={!inputVal.trim()}
            className="absolute right-1 w-6 h-6 rounded-lg bg-gradient-to-r from-[#7547FF] to-[#278BFF] text-white flex items-center justify-center hover:opacity-90 transition-opacity shadow-[0_0_10px_rgba(117,71,255,0.5)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            aria-label="Send inquiry"
          >
            <Send className="w-3 h-3" />
          </button>
        </div>
      </form>
    </div>
  );
};

