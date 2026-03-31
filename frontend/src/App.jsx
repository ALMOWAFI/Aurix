import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle2, MessageCircle, Send, User, Shield, Mic, Volume2 } from 'lucide-react';
import { useConversation, ConversationProvider } from '@elevenlabs/react';

const VoiceOrb = ({ isActive, isSpeaking, onClick, status }) => {
  return (
    <div className="flex flex-col items-center gap-2">
        <button 
        onClick={onClick}
        type="button"
        className="relative flex items-center justify-center group cursor-pointer"
        >
        <div className={`absolute w-16 h-16 bg-amber-500/20 rounded-full blur-2xl transition-all duration-1000 ${isActive ? 'scale-150 opacity-100 animate-pulse' : 'scale-100 opacity-0'}`}></div>
        <div className={`absolute w-12 h-12 bg-amber-500/40 rounded-full blur-xl transition-all duration-700 ${isActive ? 'scale-125' : 'scale-100 opacity-0'}`}></div>

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

const Dashboard = () => {
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
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      alert("Voice features require a secure HTTPS connection.");
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
        } catch (err) {
            alert("Microphone access required.");
        }
    }
  }, [conversation]);

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

  const handleOnboardingSubmit = async () => {
    try {
      setShowOnboarding(false); // Close instantly
      setLoading(true);
      await axios.post('/api/onboarding', formData);
      setUserProfile(formData);
      setBalance(formData.balance);
      setGoldWeight(formData.gold_weight);
      fetchData();
    } catch (err) {
      console.error("Onboarding error:", err);
    }
  };

  if (showOnboarding) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-slate-900">
        <div className="bg-white rounded-[3rem] p-12 max-w-md w-full shadow-2xl">
          <div className="mb-8">
             <div className="w-12 h-12 bg-slate-900 rounded-2xl mb-6 flex items-center justify-center text-white">
                <Shield size={24}/>
             </div>
             <h2 className="text-3xl font-black text-slate-900 mb-2">Initialize Aurix</h2>
             <p className="text-slate-500 font-medium">Step {onboardingStep} of 3</p>
          </div>

          {onboardingStep === 1 && (
            <div className="space-y-6">
               <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Your Name</label>
                  <input type="text" className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
               </div>
               <button onClick={() => setOnboardingStep(2)} className="w-full p-4 bg-slate-900 text-white rounded-2xl font-black">Next</button>
            </div>
          )}

          {onboardingStep === 2 && (
            <div className="space-y-6">
               <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Investment Goal</label>
                  <select className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold" value={formData.goal} onChange={(e) => setFormData({...formData, goal: e.target.value})}>
                    <option>Wealth Preservation</option>
                    <option>Aggressive Growth</option>
                  </select>
               </div>
               <button onClick={() => setOnboardingStep(3)} className="w-full p-4 bg-slate-900 text-white rounded-2xl font-black">Next</button>
            </div>
          )}

          {onboardingStep === 3 && (
            <div className="space-y-6">
               <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Background</label>
                  <textarea className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold h-32" value={formData.background} onChange={(e) => setFormData({...formData, background: e.target.value})} />
               </div>
               <div className="flex gap-3">
                  <button onClick={handleOnboardingSubmit} className="flex-1 p-4 bg-slate-100 rounded-2xl font-black">Skip</button>
                  <button onClick={handleOnboardingSubmit} className="flex-[2] p-4 bg-amber-500 text-white rounded-2xl font-black">Finalize</button>
               </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-black text-slate-400">BOOTING_AURIX...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900">
      <header className="max-w-7xl mx-auto mb-8 flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-200">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white font-black italic">A</div>
          <h1 className="text-xl font-black">Aurix <span className="text-slate-400 font-medium">Wealth Brain</span></h1>
        </div>
        <div className="flex gap-8 items-center">
            <div className="flex gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs font-bold">
                <div><span>Bal: ${balance}</span></div>
                <div className="w-[1px] h-4 bg-slate-200"></div>
                <div><span>Gold: {goldWeight}oz</span></div>
            </div>
            <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Spot Price</p>
                <p className="text-lg font-black">${recommendation?.metrics?.current_price || '---'}</p>
            </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-8">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm h-[500px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <Tooltip />
                        <Line type="monotone" dataKey="price" stroke="#f59e0b" strokeWidth={4} dot={false} />
                        <Line type="monotone" dataKey="sma_20" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 flex flex-col justify-center">
                <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Master Decision</p>
                <h2 className={`text-5xl font-black ${recommendation?.decision === 'BUY' ? 'text-green-500' : 'text-amber-500'}`}>{recommendation?.decision || '---'}</h2>
            </div>
        </div>

        <div className="lg:col-span-5 flex flex-col h-[700px] bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <MessageCircle size={20}/>
                    <h3 className="text-sm font-black uppercase">Co-Pilot</h3>
                </div>
                <VoiceOrb isActive={conversation.status === 'connected'} isSpeaking={conversation.isSpeaking} onClick={toggleVoice} status={conversation.status} />
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
                {chatHistory.map((chat, i) => (
                    <div key={i} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`p-4 rounded-2xl max-w-[80%] ${chat.role === 'user' ? 'bg-amber-500 text-white font-bold' : 'bg-slate-50 text-slate-700 border'}`}>
                            {chat.text}
                        </div>
                    </div>
                ))}
            </div>
            <form onSubmit={handleChat} className="p-6 border-t flex gap-4">
                <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Message Aurix..." className="flex-1 bg-slate-50 p-4 rounded-xl outline-none" />
                <button type="submit" className="p-4 bg-slate-900 text-white rounded-xl"><Send size={18}/></button>
            </form>
        </div>
      </main>
    </div>
  );
};

const App = () => (
  <ConversationProvider>
    <Dashboard />
  </ConversationProvider>
);

export default App;
