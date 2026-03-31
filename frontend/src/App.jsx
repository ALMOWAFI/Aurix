import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle2, MessageCircle, Send, User, Shield, Mic, Volume2 } from 'lucide-react';
import { useConversation } from '@elevenlabs/react';

const VoiceOrb = ({ isActive, isSpeaking, onClick, status }) => {
  return (
    <div className="flex flex-col items-center gap-2">
        <button 
        onClick={onClick}
        type="button"
        className="relative flex items-center justify-center group cursor-pointer"
        >
        {/* The Glow Layers */}
        <div className={`absolute w-16 h-16 bg-amber-500/20 rounded-full blur-2xl transition-all duration-1000 ${isActive ? 'scale-150 opacity-100 animate-pulse' : 'scale-100 opacity-0'}`}></div>
        <div className={`absolute w-12 h-12 bg-amber-500/40 rounded-full blur-xl transition-all duration-700 ${isActive ? 'scale-125' : 'scale-100 opacity-0'}`}></div>

        {/* The Main Orb */}
        <div className={`relative w-10 h-10 rounded-full shadow-2xl transition-all duration-500 flex items-center justify-center
            ${isActive ? 'bg-amber-500 scale-110 shadow-amber-500/50' : 'bg-slate-800 hover:bg-slate-700 shadow-slate-900/20'}`}>
            {isActive ? (
                isSpeaking ? <Volume2 size={18} className="text-white animate-bounce" /> : <Mic size={18} className="text-white animate-pulse" />
            ) : <Mic size={18} className="text-slate-400 group-hover:text-white" />}
        </div>
        </button>
        <span className="text-[7px] font-black text-slate-400 uppercase tracking-[0.2em]">{status === 'connected' ? (isSpeaking ? 'AURIX_SPEAKING' : 'LISTENING') : status}</span>
    </div>
  );
};

const App = () => {
  const [data, setData] = useState([]);
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chatInput, setChatInput] = useState("");
  const [balance, setBalance] = useState(5000);
  const [goldWeight, setGoldWeight] = useState(0.5);
  const [userProfile, setUserProfile] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    goal: "Wealth Preservation",
    risk: "Moderate",
    balance: 5000,
    gold_weight: 0.5,
    background: ""
  });

  const [chatHistory, setChatHistory] = useState([
    { role: 'ai', text: "Welcome to Aurix Brain. I am your connected Wealth Agent. I've analyzed our ML models and the latest expert sentiment. How can I help you today?" }
  ]);
  const [isChatting, setIsChatting] = useState(false);

  // ElevenLabs Integration
  const conversation = useConversation({
    onConnect: () => console.log("Connected to Aurix Voice"),
    onDisconnect: () => console.log("Disconnected from Aurix Voice"),
    onMessage: (message) => console.log("Voice Message:", message),
    onError: (error) => console.error("Voice Error:", error),
  });

  const toggleVoice = useCallback(async () => {
    // If not running on localhost or https, microphone won't work in most browsers
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      alert("Voice features require a secure HTTPS connection. Please use text chat for now or set up an SSL certificate.");
      return;
    }

    if (conversation.status === 'connected') {
        await conversation.endSession();
    } else {
        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
            await conversation.startSession({
                agentId: "agent_2301kn0r3j1gfyjbrcymzy95d7j6",
            });

            // Send initial context for the voice agent
            if (recommendation) {
                const context = `Market Context: Spot Gold is at $${recommendation.metrics.current_price}, 5-day forecast is $${recommendation.metrics.predicted_5d}. User balance is $${balance}. Goal: ${userProfile?.goal || 'Wealth Management'}. Background: ${userProfile?.background || 'None'}`;
                conversation.sendContextualUpdate(context);
            }
        } catch (err) {
            console.error("Failed to start voice:", err);
            alert("Microphone access is required for Aurix Voice. Make sure you allow permissions.");
        }
    }
  }, [conversation, recommendation, balance, goldWeight, userProfile]);

  const checkProfile = async () => {
    try {
      const res = await axios.get('/api/profile');
      if (res.data && res.data.name) {
        setUserProfile(res.data);
        setBalance(res.data.balance);
        setGoldWeight(res.data.gold_weight);
        setShowOnboarding(false);
      } else {
        setShowOnboarding(true);
      }
    } catch (err) {
      setShowOnboarding(true);
    }
  };

  const handleOnboardingSubmit = async () => {
    try {
      await axios.post('/api/onboarding', formData);
      setUserProfile(formData);
      setBalance(formData.balance);
      setGoldWeight(formData.gold_weight);
      setShowOnboarding(false);
      fetchData();
    } catch (err) {
      alert("Error saving profile");
    }
  };

  const fetchData = async () => {
    try {
      const [marketRes, recRes] = await Promise.all([
        axios.get('/api/market-data?limit=30'),
        axios.get(`/api/recommendation?user_balance=${balance}&gold_weight=${goldWeight}`)
      ]);
      setData(marketRes.data || []);
      setRecommendation(recRes.data);
      setLoading(false);
    } catch (err) {
      console.error("Fetch Error:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    checkProfile();
    fetchData();
  }, []);

  const handleChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setChatInput("");
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsChatting(true);

    try {
      const res = await axios.get(`/api/chat?message=${encodeURIComponent(userMsg)}&balance=${balance}&gold_weight=${goldWeight}`);
      setChatHistory(prev => [...prev, { role: 'ai', text: res.data.response }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'ai', text: "Error connecting to the Brain." }]);
    }
    setIsChatting(false);
  };

  if (showOnboarding) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="bg-white rounded-[3rem] p-12 max-w-md w-full shadow-2xl">
          <div className="mb-8">
             <div className="w-12 h-12 bg-slate-900 rounded-2xl mb-6 flex items-center justify-center text-white">
                <Shield size={24}/>
             </div>
             <h2 className="text-3xl font-black text-slate-900 mb-2">Initialize Aurix</h2>
             <p className="text-slate-500 font-medium">Step {onboardingStep} of 3: Building your context</p>
          </div>

          {onboardingStep === 1 && (
            <div className="space-y-6">
               <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Your Name</label>
                  <input 
                    type="text" 
                    className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 focus:outline-none focus:border-slate-300 font-bold text-slate-800"
                    placeholder="e.g. Alex"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
               </div>
               <button onClick={() => setOnboardingStep(2)} className="w-full p-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all">Next</button>
            </div>
          )}

          {onboardingStep === 2 && (
            <div className="space-y-6">
               <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Investment Goal</label>
                  <select 
                    className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 focus:outline-none focus:border-slate-300 font-bold text-slate-800"
                    value={formData.goal}
                    onChange={(e) => setFormData({...formData, goal: e.target.value})}
                  >
                    <option>Wealth Preservation</option>
                    <option>Aggressive Growth</option>
                    <option>Passive Income</option>
                  </select>
               </div>
               <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Risk Tolerance</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Low', 'Moderate', 'High'].map(r => (
                      <button 
                        key={r}
                        onClick={() => setFormData({...formData, risk: r})}
                        className={`p-3 rounded-xl border font-bold text-xs transition-all ${formData.risk === r ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-100'}`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
               </div>
               <button onClick={() => setOnboardingStep(3)} className="w-full p-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all">Next</button>
            </div>
          )}

          {onboardingStep === 3 && (
            <div className="space-y-6">
               <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Trading Background & Context</label>
                  <textarea 
                    className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold text-slate-800 h-32 focus:outline-none focus:border-slate-300" 
                    placeholder="e.g. I'm a long-term holder, or I'm new to gold and looking for quick gains..."
                    value={formData.background || ""} 
                    onChange={(e) => setFormData({...formData, background: e.target.value})}
                  />
                  <p className="text-[9px] text-slate-400 mt-2 italic">* This helps Aurix tailor its reasoning to your experience.</p>
               </div>
               <div className="flex gap-3">
                  <button onClick={handleOnboardingSubmit} className="flex-1 p-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all">Skip</button>
                  <button onClick={handleOnboardingSubmit} className="flex-[2] p-4 bg-amber-500 text-white rounded-2xl font-black hover:bg-amber-600 transition-all shadow-lg shadow-amber-200 text-center">Finalize Initialization</button>
               </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-20 text-center">
        <div className="w-16 h-16 bg-amber-500 rounded-2xl animate-spin mb-8 flex items-center justify-center text-white font-black italic shadow-lg shadow-amber-500/20">A</div>
        <div className="font-bold text-slate-400 animate-pulse tracking-[0.2em]">BOOTING_AURIX_BRAIN...</div>
    </div>
  );

  const getDecisionColor = (decision) => {
    if (decision === 'BUY') return 'text-green-600 bg-green-50 border-green-100';
    if (decision === 'SELL') return 'text-red-600 bg-red-50 border-red-100';
    return 'text-blue-600 bg-blue-50 border-blue-100';
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <header className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-3xl border border-slate-200 shadow-sm gap-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white font-black italic shadow-lg shadow-amber-500/20">A</div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Aurix <span className="text-slate-400 font-medium">Wealth Brain</span></h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Agentic Portfolio Workflow</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 md:gap-8 items-center justify-center">
            <div className="flex gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-1">Balance ($)</p>
                    <input 
                        type="number" 
                        value={balance} 
                        onChange={(e) => setBalance(Number(e.target.value))}
                        className="w-20 bg-transparent text-sm font-black text-slate-700 focus:outline-none"
                    />
                </div>
                <div className="w-[1px] h-8 bg-slate-200"></div>
                <div>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-1">Gold (oz)</p>
                    <input 
                        type="number" 
                        step="0.1"
                        value={goldWeight} 
                        onChange={(e) => setGoldWeight(Number(e.target.value))}
                        className="w-16 bg-transparent text-sm font-black text-slate-700 focus:outline-none"
                    />
                </div>
            </div>
            <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Spot Price</p>
                <p className="text-lg font-black text-slate-800">${recommendation?.metrics?.current_price || '---'}</p>
            </div>
            <div className="hidden md:block text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Market Status</p>
                <p className="text-lg font-black text-green-500">OPEN</p>
            </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-8">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Intelligence Momentum</h3>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2"><div className="w-2 h-2 bg-amber-500 rounded-full"></div><span className="text-[10px] font-bold text-slate-400">HISTORICAL</span></div>
                        <div className="flex items-center gap-2"><div className="w-2 h-2 bg-amber-500 rounded-full border border-dashed opacity-50"></div><span className="text-[10px] font-bold text-slate-400">5D_FORECAST</span></div>
                    </div>
                </div>
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" hide={true} />
                        <YAxis domain={['auto', 'auto']} orientation="right" stroke="#cbd5e1" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px rgba(0,0,0,0.05)'}} />
                        <Line type="monotone" dataKey="price" stroke="#f59e0b" strokeWidth={4} dot={false} name="Spot Price" />
                        <Line type="monotone" dataKey="sma_20" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" dot={false} name="SMA 20" opacity={0.3} />
                        <Line type="monotone" dataKey="sma_50" stroke="#ef4444" strokeWidth={2} strokeDasharray="3 3" dot={false} name="SMA 50" opacity={0.3} />
                    </LineChart>
                    </ResponsiveContainer>
                </div>
                <div className="h-[100px] w-full mt-4 bg-slate-50/50 rounded-3xl p-4 border border-slate-100">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">RSI (14) OVERBOUGHT/OVERSOLD</p>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <YAxis domain={[0, 100]} hide={true} />
                            <Line type="monotone" dataKey="rsi_14" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`p-8 rounded-[2.5rem] border transition-all flex flex-col justify-center ${getDecisionColor(recommendation?.decision)}`}>
                    <p className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-60">Master Decision</p>
                    <h2 className="text-5xl font-black flex items-center gap-4">
                        {recommendation?.decision || '---'}
                        {recommendation?.decision === 'BUY' ? <TrendingUp size={40}/> : <TrendingDown size={40}/>}
                    </h2>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">ML Accuracy Confidence</p>
                    <div className="flex items-center gap-6">
                        <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 rounded-full transition-all duration-1000" style={{width: `${(recommendation?.confidence || 0) * 100}%`}}></div>
                        </div>
                        <span className="text-2xl font-black text-slate-800">{Math.round((recommendation?.confidence || 0) * 100)}%</span>
                    </div>
                </div>
            </div>
        </div>

        <div className="lg:col-span-5 flex flex-col h-[700px] bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center text-white">
                    <MessageCircle size={20}/>
                </div>
                <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Co-Pilot Workflow</h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Connected to ML + Expert Scraper</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
                {chatHistory.map((chat, i) => (
                    <div key={i} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[90%] flex gap-3 ${chat.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${chat.role === 'user' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'}`}>
                                {chat.role === 'user' ? <User size={14}/> : <div className="font-black text-[10px]">AI</div>}
                            </div>
                            <div className={`p-5 rounded-3xl text-sm leading-relaxed whitespace-pre-wrap ${
                                chat.role === 'user' 
                                ? 'bg-amber-500 text-white font-bold shadow-lg shadow-amber-500/20' 
                                : 'bg-slate-50 text-slate-700 border border-slate-100'
                            }`}>
                                {chat.text}
                            </div>
                        </div>
                    </div>
                ))}
                {isChatting && (
                    <div className="flex justify-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 animate-pulse"></div>
                        <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            Thinking Agentically...
                        </div>
                    </div>
                )}
            </div>

            <form onSubmit={handleChat} className="p-6 border-t border-slate-100 flex items-center gap-6 bg-white">
                <VoiceOrb 
                    isActive={conversation.status === 'connected'} 
                    isSpeaking={conversation.isSpeaking}
                    onClick={toggleVoice} 
                    status={conversation.status}
                />
                <div className="relative flex-1 flex items-center">
                    <input 
                        type="text" 
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Talk to the Brain..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all pr-16 text-slate-700"
                    />
                    <button type="submit" className="absolute right-2 p-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-md">
                        <Send size={18}/>
                    </button>
                </div>
            </form>
        </div>
      </main>
    </div>
  );
};

export default App;