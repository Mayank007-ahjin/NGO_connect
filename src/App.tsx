import React, { useState, useEffect, createContext, useContext } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Users, 
  PlusCircle, 
  BarChart3, 
  MapPin, 
  Calendar, 
  ArrowRight, 
  Search, 
  Heart, 
  Building2, 
  Sparkles,
  CheckCircle2,
  ChevronRight,
  Menu,
  X,
  Edit,
  ShieldCheck,
  Clock,
  Trash2,
  Phone,
  Globe,
  Bell,
  Settings,
  Monitor,
  Activity,
  Scale,
  Database,
  IndianRupee,
  MoreHorizontal,
  GraduationCap,
  Utensils,
  Stethoscope,
  ShieldAlert,
  Sprout,
  Map as MapIcon,
  Search as SearchIcon,
  LogOut,
  LogIn
} from "lucide-react";
import { mapSkillsToProblems } from "./services/gemini";
import { auth, db, handleFirestoreError } from "./lib/firebase";
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  User 
} from "firebase/auth";
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp, 
  onSnapshot 
} from "firebase/firestore";

// --- Context ---
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Sign in failed", error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign out failed", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

// --- Types ---
type Screen = "landing" | "dashboard" | "post-problem" | "directory" | "registration" | "skill-mapping" | "profile" | "ngo-directory";

interface Task {
  id: string;
  title: string;
  ngo: string;
  location: string;
  category: string;
  urgency: "High" | "Medium" | "Low";
  volunteersNeeded: number;
}

// --- Mock Data ---
const MOCK_TASKS: Task[] = [
  { id: "1", title: "Rural Education Drive", ngo: "Shiksha Foundation", location: "Rural Bihar", category: "Education", urgency: "High", volunteersNeeded: 5 },
  { id: "2", title: "Clean Yamuna Initiative", ngo: "Prakriti Save", location: "Delhi", category: "Environment", urgency: "Medium", volunteersNeeded: 20 },
  { id: "3", title: "Medical Camp Coordination", ngo: "Swasthya India", location: "Mumbai Slums", category: "Healthcare", urgency: "High", volunteersNeeded: 10 },
  { id: "4", title: "Tech Literacy for Seniors", ngo: "DigiBharat", location: "Bangalore", category: "Technology", urgency: "Low", volunteersNeeded: 3 },
];

const MOCK_VOLUNTEERS = [
  { name: "Aarav Sharma", skills: ["Teaching", "Math", "Mentoring"], location: "Haldwani, Uttarakhand", workCondition: "Remote", avatar: "https://i.pravatar.cc/150?u=Aarav" },
  { name: "Priya Patel", skills: ["Social Media", "Design", "Content Strategy"], location: "Surat, Gujarat", workCondition: "Hybrid", avatar: "https://i.pravatar.cc/150?u=Priya" },
  { name: "Ishan Verma", skills: ["Python", "Data Analysis", "Automation"], location: "Pune, Maharashtra", workCondition: "On-site", avatar: "https://i.pravatar.cc/150?u=Ishan" },
  { name: "Ananya Iyer", skills: ["UX Design", "Research", "Accessibility"], location: "Chennai, Tamil Nadu", workCondition: "Remote", avatar: "https://i.pravatar.cc/150?u=Ananya" },
];

// --- Components ---

const Navbar = ({ active, setScreen }: { active: Screen; setScreen: (s: Screen) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signIn, logout, loading } = useAuth();
  
  const navItems: { label: string; value: Screen }[] = [
    { label: "Dashboard", value: "dashboard" },
    { label: "Volunteers", value: "directory" },
    { label: "Problems", value: "post-problem" },
    { label: "NGOs", value: "ngo-directory" },
    { label: "Join Us", value: "registration" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-border px-6 h-16 flex items-center shrink-0">
      <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
        <div 
          className="flex items-center gap-2 cursor-pointer group" 
          onClick={() => setScreen("landing")}
        >
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white scale-90 group-hover:scale-100 transition-transform">
            <Heart size={18} fill="currentColor" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-primary">NGO<span className="text-text-dark">Connect</span></span>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex gap-6 items-center h-full ml-auto mr-6">
          {navItems.map(item => (
            <button
              key={item.value}
              onClick={() => setScreen(item.value)}
              className={`text-sm font-semibold transition-all h-16 flex items-center relative ${
                active === item.value 
                  ? "text-primary border-b-2 border-primary" 
                  : "text-text-light hover:text-primary"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Action Icons (Visible on all screens) */}
        <div className="flex items-center gap-2 md:gap-4 ml-auto md:ml-0 md:pl-6 md:border-l border-border h-8">
          {user ? (
            <>
              <button className="p-2 text-text-light hover:text-primary transition-colors relative">
                <Bell size={20} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-secondary rounded-full border-2 border-white"></span>
              </button>
              <button className="p-2 text-text-light hover:text-primary transition-colors" onClick={logout} title="Sign Out">
                <LogOut size={20} />
              </button>
              <button 
                onClick={() => setScreen("profile")}
                className={`w-8 h-8 md:w-10 md:h-10 rounded-full border-2 overflow-hidden transition-all ${
                  active === "profile" ? "border-primary shadow-md" : "border-transparent hover:border-primary/50"
                }`}
              >
                <img 
                  src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} 
                  alt="Profile" 
                  className="w-full h-full object-cover bg-bento-bg" 
                  referrerPolicy="no-referrer"
                />
              </button>
            </>
          ) : (
            <button 
              onClick={signIn}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-[#0b7a6f] transition-all"
            >
              <LogIn size={16} />
              {loading ? "..." : "Sign In"}
            </button>
          )}
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden text-primary ml-2" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden absolute top-16 left-0 right-0 bg-white border-b border-border px-6 py-4 flex flex-col gap-4 shadow-xl z-50"
          >
            {navItems.map(item => (
              <button
                key={item.value}
                onClick={() => { setScreen(item.value); setIsOpen(false); }}
                className="text-left py-2 font-semibold text-text-dark border-b border-border last:border-0"
              >
                {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const LandingScreen = ({ setScreen }: { setScreen: (s: Screen) => void }) => (
  <div className="flex flex-col">
    {/* Hero Section */}
    <section className="relative min-h-[70vh] flex items-center justify-center p-6 text-center overflow-hidden bg-white">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl z-10"
      >
        <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-[10px] font-extrabold uppercase tracking-widest mb-6">
          Impact Driven. Community Powered.
        </span>
        <h1 className="text-5xl md:text-7xl font-extrabold text-text-dark leading-tight mb-8">
          Uniting 500+ NGOs with <br /> <span className="text-secondary">Skilled Experts</span> for Change
        </h1>
        <p className="text-lg text-text-light mb-10 max-w-2xl mx-auto leading-relaxed">
          Empowering local communities through structured volunteer support and AI-driven skill mapping.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={() => setScreen("dashboard")}
            className="bg-primary text-white px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 group hover:shadow-lg hover:shadow-primary/20 transition-all text-base"
          >
            Enter Dashboard <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <button 
            onClick={() => setScreen("directory")}
            className="bg-bento-bg border border-border text-text-dark px-8 py-4 rounded-xl font-bold hover:bg-white hover:shadow-sm transition-all text-base"
          >
            View Experts
          </button>
        </div>
      </motion.div>
    </section>

    {/* Featured Categories - Minimal update */}
    <section className="bg-bento-bg px-6 py-24">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold text-text-dark mb-4">Priority Impact Areas</h2>
          <div className="w-20 h-1 bg-primary mx-auto rounded-full"></div>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { id: 1, title: "Rural Education", desc: "Digital divide remains a challenge. Help bridge it with content & tech.", img: "https://picsum.photos/seed/edu/800/600", color: "bg-primary/5" },
            { id: 2, title: "Healthcare Access", desc: "Remote medical camps need organizers and specialized medical help.", img: "https://picsum.photos/seed/health/800/600", color: "bg-secondary/5" },
            { id: 3, title: "Sustainable Farming", desc: "Collaborate with farmer cooperatives for better yield techniques.", img: "https://picsum.photos/seed/farm/800/600", color: "bg-accent/5" },
          ].map(cat => (
            <motion.div 
              key={cat.id} 
              whileHover={{ y: -5 }}
              className={`p-1 rounded-2xl ${cat.color} group cursor-pointer`}
            >
              <div className="bg-white rounded-xl overflow-hidden border border-border shadow-sm hover:shadow-md transition-all h-full">
                <img src={cat.img} alt={cat.title} className="w-full h-44 object-cover group-hover:opacity-90 transition-opacity" referrerPolicy="no-referrer" />
                <div className="p-6">
                  <h3 className="text-xl font-extrabold mb-2 text-text-dark">{cat.title}</h3>
                  <p className="text-sm text-text-light mb-6">{cat.desc}</p>
                  <div className="flex items-center text-primary font-bold text-sm gap-2">
                    Explore <ChevronRight size={14} />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  </div>
);

const DashboardScreen = ({ setScreen }: { setScreen: (s: Screen) => void }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [volunteers, setVolunteers] = useState<any[]>([]);

  useEffect(() => {
    // Fetch real tasks from Firestore
    const qTasks = query(collection(db, "problems"), orderBy("submittedAt", "desc"), limit(5));
    const unsubscribeTasks = onSnapshot(qTasks, (snapshot) => {
      const taskList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      setTasks(taskList.length > 0 ? taskList.map(t => ({
        id: t.id,
        title: t.description.slice(0, 30) + '...',
        ngo: "Reported Need",
        location: t.locationName,
        category: t.category,
        urgency: t.urgency,
        volunteersNeeded: 1
      })) : MOCK_TASKS);
    });

    // Fetch real volunteers
    const qVols = query(collection(db, "volunteers"), limit(4));
    const unsubscribeVols = onSnapshot(qVols, (snapshot) => {
      const volList = snapshot.docs.map(doc => doc.data());
      setVolunteers(volList.length > 0 ? volList : MOCK_VOLUNTEERS);
    });

    return () => {
      unsubscribeTasks();
      unsubscribeVols();
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
      {/* 1. Refined Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-8 border-b border-border">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Community Hub: India</p>
          <h2 className="text-4xl font-extrabold text-[#153448]">Network Overview</h2>
        </div>
        <div className="flex gap-4">
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Active Experts</p>
            <p className="text-2xl font-black text-[#153448]">1,248</p>
          </div>
          <div className="w-px h-10 bg-border md:block hidden" />
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Ongoing Mission</p>
            <p className="text-2xl font-black text-[#153448]">42</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Skill Mapping & Hero */}
        <div className="lg:col-span-8 space-y-8">
          {/* Main Action Card */}
          <div className="bg-[#F8FBFF] border border-[#D0E5FF] rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center gap-10 shadow-sm">
            <div className="flex-1 space-y-6">
              <h3 className="text-3xl font-extrabold text-[#153448] leading-tight">Empowering 500+ NGOs with expert intelligence.</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Connect with verified professionals across technology, healthcare, and legal sectors to accelerate social impact.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setScreen("registration")}
                  className="px-6 py-3 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-xl hover:shadow-lg transition-all"
                >
                  Join the Network
                </button>
                <button 
                  onClick={() => setScreen("directory")}
                  className="px-6 py-3 bg-white border border-border text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-all"
                >
                  Browse Experts
                </button>
              </div>
            </div>
            <div className="w-full md:w-64 h-64 bg-white rounded-[2rem] border border-[#D0E5FF] flex items-center justify-center p-8 shadow-inner">
               <div className="relative">
                 <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
                   <Heart size={48} className="text-primary" fill="currentColor" />
                 </div>
                 <div className="absolute -top-2 -right-2 w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-white shadow-lg">
                   <Sparkles size={16} />
                 </div>
               </div>
            </div>
          </div>

          {/* Skill Analysis (Re-designed for Minimalism) */}
          <div className="bg-white border border-border rounded-[2rem] p-10 space-y-8 shadow-sm">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Skill Distribution Analysis</h3>
              <button 
                onClick={() => setScreen("skill-mapping")}
                className="flex items-center gap-2 text-[10px] font-bold text-primary hover:underline uppercase tracking-widest"
              >
                AI Deep Dive <Sparkles size={12} />
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {[
                { label: "Technology", val: "42%", icon: <Monitor size={18} />, color: "text-blue-600" },
                { label: "Healthcare", val: "28%", icon: <Activity size={18} />, color: "text-emerald-600" },
                { label: "Legal Aid", val: "15%", icon: <Scale size={18} />, color: "text-amber-600" },
                { label: "Operations", val: "10%", icon: <Database size={18} />, color: "text-slate-600" },
                { label: "Finance", val: "3%", icon: <IndianRupee size={18} />, color: "text-rose-600" },
                { label: "Community", val: "2%", icon: <Users size={18} />, color: "text-indigo-600" },
              ].map(item => (
                <div key={item.label} className="p-6 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-primary/20 transition-all">
                  <div className={`${item.color} mb-3 opacity-60 group-hover:opacity-100 transition-opacity`}>
                    {item.icon}
                  </div>
                  <div className="text-2xl font-black text-[#153448]">{item.val}</div>
                  <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Feeds */}
        <div className="lg:col-span-4 space-y-6">
          {/* Priority Tasks */}
          <div className="bg-white border border-border rounded-[2.5rem] p-8 shadow-sm space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Urgent Missions</h3>
              <span className="px-3 py-1 bg-rose-50 text-rose-500 text-[10px] font-bold rounded-full border border-rose-100">Live</span>
            </div>
            
            <div className="space-y-6">
              {tasks.slice(0, 3).map((task) => (
                <div key={task.id} className="group cursor-pointer">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{task.category}</span>
                    <span className="text-[9px] font-black text-slate-300">{task.urgency}</span>
                  </div>
                  <h4 className="text-sm font-bold text-[#153448] group-hover:text-primary transition-colors leading-snug">{task.title}</h4>
                  <div className="flex items-center gap-2 mt-2 opacity-60">
                    <MapPin size={10} />
                    <span className="text-[10px] font-medium">{task.location}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <button className="w-full py-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-black text-slate-500 hover:bg-slate-100 transition-all uppercase tracking-widest">
              View Problem Board
            </button>
          </div>

          {/* Expert Highlight */}
          <div className="bg-[#153448] text-white rounded-[2.5rem] p-8 shadow-lg space-y-8">
            <div className="space-y-1">
              <h3 className="text-secondary font-black text-[10px] uppercase tracking-[0.2em]">Weekly Spotlight</h3>
              <p className="text-sm font-bold opacity-80">Meet our top contributing experts.</p>
            </div>
            
            <div className="space-y-4">
              {volunteers.slice(0, 2).map(v => (
                <div key={v.name} className="flex items-center gap-4 p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all">
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 bg-slate-800">
                    <img src={v.avatar} alt={v.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{v.name}</p>
                    <p className="text-[10px] font-medium opacity-50 truncate">{v.skills[0]} • {v.location}</p>
                  </div>
                  <ChevronRight size={16} className="opacity-30" />
                </div>
              ))}
            </div>
            
            <button 
              onClick={() => setScreen("directory")}
              className="w-full py-4 bg-secondary text-white font-black text-[10px] rounded-2xl hover:brightness-110 transition-all uppercase tracking-[0.2em]"
            >
              See All Volunteers
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PostProblemScreen = () => {
  const { user } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    description: "",
    urgency: "Medium",
    locationName: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert("Please sign in first!");
    
    try {
      await addDoc(collection(db, "problems"), {
        ...formData,
        status: "UNASSIGNED",
        submittedById: user.uid,
        submittedAt: serverTimestamp(),
      });
      setSubmitted(true);
      setFormData({ description: "", urgency: "Medium", locationName: "" });
      setTimeout(() => setSubmitted(false), 3000);
    } catch (error) {
      handleFirestoreError(error, 'create', 'problems');
    }
  };

  const recentSubmissions = [
    { 
      title: "Clogged Drainage - Main Bazaar", 
      location: "Chandni Chowk, Delhi", 
      description: "Blocked drainage causing minor flooding in the market area after the morning drizzle.",
      urgency: "High",
      category: "Sanitation",
      status: "ASSIGNED",
      time: "2 hours ago"
    },
    { 
      title: "Village School Roof Repair", 
      location: "Satara, Maharashtra", 
      description: "Leaking roof in the community library needs urgent attention before the rainy season starts.",
      urgency: "Medium",
      category: "Education",
      status: "COMPLETED",
      time: "Yesterday"
    },
    { 
      title: "Broken Park Bench", 
      location: "Indiranagar, Bengaluru", 
      description: "The wooden bench near the playground is split and presents a splinter hazard.",
      urgency: "Low",
      category: "Environment",
      status: "IN REVIEW",
      time: "3 days ago"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="grid lg:grid-cols-12 gap-12">
        
        {/* Left Column: Form */}
        <div className="lg:col-span-7 space-y-8">
          <div>
            <h1 className="text-4xl font-extrabold text-[#0D2B4D] mb-4">Identify a Need</h1>
            <p className="text-text-light text-sm max-w-xl leading-relaxed">
              Describe the challenge your community is facing. Our AI architect will help categorize and route it to the right volunteers.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-border shadow-sm border-t-4 border-t-primary/20">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-primary uppercase tracking-wider pl-1">Problem Description</label>
                <textarea 
                  required
                  rows={5}
                  placeholder="e.g., Clean water access is limited in the North District after recent storms..."
                  className="w-full p-5 bg-[#F4F9FF] rounded-xl border border-[#D0E5FF] focus:ring-2 focus:ring-primary/10 transition-all outline-none text-sm placeholder:text-slate-400"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-primary uppercase tracking-wider pl-1">Urgency Level</label>
                  <select 
                    className="w-full p-4 bg-[#F4F9FF] rounded-xl border border-[#D0E5FF] focus:ring-2 focus:ring-primary/10 transition-all outline-none text-sm cursor-pointer"
                    value={formData.urgency}
                    onChange={e => setFormData({...formData, urgency: e.target.value})}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-primary uppercase tracking-wider pl-1">Location Name</label>
                  <input 
                    required
                    type="text" 
                    placeholder="City, District, or Landmark"
                    className="w-full p-4 bg-[#F4F9FF] rounded-xl border border-[#D0E5FF] focus:ring-2 focus:ring-primary/10 transition-all outline-none text-sm placeholder:text-slate-400"
                    value={formData.locationName}
                    onChange={e => setFormData({...formData, locationName: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-bold text-primary uppercase tracking-wider pl-1">Pin on Map</label>
                <div className="relative rounded-2xl overflow-hidden border border-[#D0E5FF] h-64 bg-slate-100">
                  <img 
                    src="https://picsum.photos/seed/map/1200/600" 
                    alt="Map Placeholder" 
                    className="w-full h-full object-cover opacity-60 grayscale"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <MapPin size={48} className="text-red-600 mb-2 drop-shadow-lg animate-bounce" />
                    <button type="button" className="px-5 py-2.5 bg-white/90 backdrop-blur-sm text-[#0D2B4D] text-[10px] font-black uppercase tracking-widest rounded-lg border border-border shadow-xl">
                      Click to adjust location
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button 
                  type="submit"
                  disabled={submitted}
                  className={`px-10 py-5 bg-[#003465] text-white font-extrabold text-lg rounded-2xl shadow-xl shadow-[#003465]/20 hover:bg-[#00284D] transition-all flex items-center gap-3 ${
                    submitted ? 'opacity-50' : ''
                  }`}
                >
                  {submitted ? <><CheckCircle2 size={24} /> Processing...</> : "Submit Problem"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Stats & History */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* Submission Impact Card */}
          <div className="bg-gradient-to-br from-[#1E40AF] via-[#0D2B4D] to-[#0D2B4D] rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute -bottom-10 -right-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
               <Heart size={180} />
            </div>
            
            <h3 className="text-2xl font-bold mb-4">Submission Impact</h3>
            <p className="text-blue-100 text-sm leading-relaxed mb-10 opacity-80">
              Your reports have initiated 12 volunteer tasks this month, affecting over 450 community members.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-sm border border-white/10 p-6 rounded-2xl text-center">
                 <p className="text-3xl font-black mb-1">8</p>
                 <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Solved</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/10 p-6 rounded-2xl text-center">
                 <p className="text-3xl font-black mb-1">4</p>
                 <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Active</p>
              </div>
            </div>
          </div>

          {/* Recent Submissions */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-lg font-bold text-[#0D2B4D]">Your Recent Submissions</h3>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-widest">History</span>
            </div>

            <div className="space-y-4">
              {recentSubmissions.map((sub, i) => (
                <div key={i} className="bg-white p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-3 py-1 rounded text-[9px] font-black uppercase tracking-widest ${
                      sub.urgency === 'High' ? 'bg-red-100 text-red-700' : 
                      sub.urgency === 'Medium' ? 'bg-blue-100 text-blue-700' : 
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {sub.urgency} Urgency
                    </span>
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded text-[9px] font-black uppercase tracking-widest">
                      {sub.category}
                    </span>
                    <span className="ml-auto text-[10px] text-text-light font-medium">{sub.time}</span>
                  </div>

                  <div>
                    <h4 className="font-bold text-[#0D2B4D] mb-1">{sub.title}</h4>
                    <p className="text-xs text-text-light line-clamp-2 leading-relaxed">{sub.description}</p>
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        sub.status === 'COMPLETED' ? 'bg-green-500' :
                        sub.status === 'ASSIGNED' ? 'bg-blue-500' : 'bg-slate-400'
                      }`} />
                      <span className="text-[10px] font-black text-text-light uppercase tracking-widest">{sub.status}</span>
                    </div>
                    <button className="text-[10px] font-black text-primary uppercase tracking-widest border-b-2 border-primary/0 hover:border-primary transition-all pb-0.5">
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

const SkillMappingScreen = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [skills, setSkills] = useState("");
  const [problem, setProblem] = useState("");

  const handleAnalyze = async () => {
    if (!skills || !problem) return;
    setLoading(true);
    try {
      const data = await mapSkillsToProblems(skills.split(",").map(s => s.trim()), problem);
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <div className="flex flex-col md:flex-row gap-12">
        <div className="flex-1 space-y-8">
          <div>
            <h2 className="text-3xl font-extrabold text-text-dark mb-4 flex items-center gap-3">
              Skill Mapping <Sparkles className="text-secondary" fill="currentColor" />
            </h2>
            <p className="text-sm text-text-light leading-relaxed">Enter a problem and volunteer skills. Let Gemini AI suggest the optimal collaboration strategy.</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-text-light tracking-widest pl-1">Problem Description</label>
              <textarea 
                placeholder="Describe the challenge..."
                className="w-full px-5 py-4 bg-white border border-border rounded-xl focus:ring-2 focus:ring-primary/10 min-h-[120px] outline-none"
                value={problem}
                onChange={e => setProblem(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-text-light tracking-widest pl-1">Available Skills (comma separated)</label>
              <input 
                placeholder="Design, Logistics, Coding..."
                className="w-full px-5 py-4 bg-white border border-border rounded-xl focus:ring-2 focus:ring-primary/10 outline-none"
                value={skills}
                onChange={e => setSkills(e.target.value)}
              />
            </div>
            <button 
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full py-4 bg-primary text-white rounded-xl font-extrabold flex items-center justify-center gap-2 hover:bg-[#0b7a6f] disabled:opacity-50 transition-all shadow-lg shadow-primary/20"
            >
              {loading ? "AI is thinking..." : "Run AI Analysis"}
            </button>
          </div>
        </div>

        <div className="flex-1">
          <div className="bg-text-dark text-slate-100 p-8 rounded-2xl h-full shadow-2xl relative overflow-hidden flex flex-col min-h-[400px]">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Sparkles size={80} />
            </div>
            
            {!result && !loading && (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-700 rounded-xl">
                <BarChart3 className="text-slate-700 mb-4" size={40} />
                <p className="text-slate-500 text-xs">Fill in the details and run analysis to see AI suggestions.</p>
              </div>
            )}

            {loading && (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
                <div className="w-10 h-10 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
                <p className="text-secondary font-bold text-sm animate-pulse tracking-widest uppercase">Mapping Impact...</p>
              </div>
            )}

            {result && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div className="bg-white/5 p-5 rounded-xl border border-white/10">
                  <h4 className="text-secondary font-bold text-[10px] uppercase tracking-[0.2em] mb-3">Strategy Summary</h4>
                  <p className="text-xs leading-relaxed opacity-80">{result.summary}</p>
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Suggested Assignments</h4>
                  {result.suggestions.map((s: any, i: number) => (
                    <motion.div 
                      key={i}
                      initial={{ x: 10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="group p-3 border border-white/5 rounded-xl transition-colors hover:bg-white/5"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`mt-1 p-2 rounded-lg ${s.impactLevel === 'High' ? 'bg-primary/20 text-primary' : 'bg-secondary/20 text-secondary'}`}>
                          <CheckCircle2 size={12} />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-white">{s.skill}</p>
                          <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{s.howItHelps}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ProfileScreen = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    name: user?.displayName || "Sarah Jenkins",
    location: "Portland, Oregon",
    availability: "15 hrs/week",
    skills: ["UI/UX Design", "React", "Public Speaking"],
    verified: true,
    bio: "Passionate about using technology for social good. Experienced in designing accessible interfaces for NGOs."
  });
  const [isEditing, setIsEditing] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [docId, setDocId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      const q = query(collection(db, "volunteers"), where("uid", "==", user.uid), limit(1));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const d = snapshot.docs[0];
          setProfile(d.data() as any);
          setDocId(d.id);
        }
      });
      return unsubscribe;
    }
  }, [user]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docId) return;
    try {
      await updateDoc(doc(db, "volunteers", docId), {
        name: profile.name,
        location: profile.location,
        availability: profile.availability,
        bio: profile.bio,
        skills: profile.skills
      });
      setIsEditing(false);
    } catch (error) {
      handleFirestoreError(error, 'update', `volunteers/${docId}`);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !profile.skills.includes(newSkill.trim())) {
      setProfile({ ...profile, skills: [...profile.skills, newSkill.trim()] });
      setNewSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    setProfile({ ...profile, skills: profile.skills.filter(s => s !== skill) });
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-8">
      {/* Identity Header Card - Based on user image */}
      <div className="bg-[#F8FBFF] border border-border/50 rounded-3xl p-8 md:p-12 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-4">
          <p className="text-[10px] font-black tracking-widest text-[#153448] uppercase">Member Identity</p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-[#153448]">{profile.name}</h2>
          
          <div className="flex flex-wrap gap-4 pt-4">
            <div className="flex items-center gap-2 px-5 py-2.5 bg-[#E8F3FF] text-[#153448] rounded-full text-xs font-bold border border-[#D0E5FF]">
              <MapPin size={16} className="text-[#3A76C4]" />
              {profile.location}
            </div>
            <div className="flex items-center gap-2 px-5 py-2.5 bg-[#E8F3FF] text-[#153448] rounded-full text-xs font-bold border border-[#D0E5FF]">
              <Clock size={16} className="text-[#3A76C4]" />
              {profile.availability} Available
            </div>
            <div className="flex items-center gap-2 px-5 py-2.5 bg-[#E8F3FF] text-[#153448] rounded-full text-xs font-bold border border-[#D0E5FF]">
              <ShieldCheck size={16} className="text-[#3A76C4]" />
              {profile.verified ? "Verified Advocate" : "Unverified"}
            </div>
          </div>
        </div>
        
        <button 
          onClick={() => setIsEditing(true)}
          className="flex items-center justify-center gap-3 px-8 py-4 bg-[#0A3D62] text-white rounded-2xl font-bold hover:bg-[#082E49] transition-all shadow-lg shadow-[#0A3D62]/20 shrink-0"
        >
          <Edit size={18} />
          Edit Profile
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Details & Form */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white border border-border rounded-2xl p-8 shadow-sm">
            <h3 className="text-xl font-bold text-text-dark mb-6">About Me</h3>
            {isEditing ? (
              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-text-light pl-2">Full Name</label>
                    <input 
                      type="text" 
                      className="w-full p-4 bg-bento-bg rounded-xl border border-border focus:ring-1 focus:ring-primary focus:bg-white outline-none"
                      value={profile.name}
                      onChange={e => setProfile({...profile, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-text-light pl-2">Location</label>
                    <input 
                      type="text" 
                      className="w-full p-4 bg-bento-bg rounded-xl border border-border focus:ring-1 focus:ring-primary focus:bg-white outline-none"
                      value={profile.location}
                      onChange={e => setProfile({...profile, location: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-text-light pl-2">Availability</label>
                  <input 
                    type="text" 
                    className="w-full p-4 bg-bento-bg rounded-xl border border-border focus:ring-1 focus:ring-primary focus:bg-white outline-none"
                    value={profile.availability}
                    onChange={e => setProfile({...profile, availability: e.target.value})}
                    placeholder="e.g. 15 hrs/week"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-text-light pl-2">Biography</label>
                  <textarea 
                    rows={4}
                    className="w-full p-4 bg-bento-bg rounded-xl border border-border focus:ring-1 focus:ring-primary focus:bg-white outline-none"
                    value={profile.bio}
                    onChange={e => setProfile({...profile, bio: e.target.value})}
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="submit" className="px-8 py-3 bg-primary text-white font-bold rounded-xl">Save Changes</button>
                  <button type="button" onClick={() => setIsEditing(false)} className="px-8 py-3 bg-bento-bg text-text-light font-bold rounded-xl border border-border">Cancel</button>
                </div>
              </form>
            ) : (
              <p className="text-text-light leading-relaxed">{profile.bio}</p>
            )}
          </div>
        </div>

        {/* Skills Section */}
        <div className="space-y-8">
          <div className="bg-white border border-border rounded-2xl p-8 shadow-sm">
            <h3 className="text-xl font-bold text-text-dark mb-6 flex items-center gap-2">
              <Sparkles size={20} className="text-secondary" />
              Skill Set
            </h3>
            
            <div className="flex flex-wrap gap-2 mb-8">
              {profile.skills.map(skill => (
                <div key={skill} className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 text-primary border border-primary/20 rounded-lg text-xs font-bold">
                  {skill}
                  <button onClick={() => removeSkill(skill)} className="hover:text-red-500">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase text-text-light tracking-widest px-1">Add New Skill</p>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="e.g. Node.js"
                  className="flex-1 p-3 bg-bento-bg rounded-xl border border-border focus:ring-1 focus:ring-primary outline-none text-sm"
                  value={newSkill}
                  onChange={e => setNewSkill(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addSkill()}
                />
                <button 
                  onClick={addSkill}
                  className="p-3 bg-secondary text-white rounded-xl hover:bg-secondary/90 shadow-lg shadow-secondary/10"
                >
                  <PlusCircle size={20} />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl p-8 text-white space-y-4 shadow-xl shadow-indigo-200">
            <h4 className="font-bold flex items-center gap-2">
              <ShieldCheck size={20} />
              Verified Expert
            </h4>
            <p className="text-xs opacity-80 leading-relaxed">Your profile has been verified by the NGO Connect trust team. You have priority access to high-impact missions.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const NGORegistrationScreen = ({ onComplete }: { onComplete?: () => void }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    regId: "",
    yearEstablished: "",
    address: "",
    cityState: "",
    pinCode: "",
    focusAreas: [] as string[],
    volunteersCount: "",
    availability: "Part-time",
    operatingHours: "",
    phone: "",
    email: "",
    website: "",
    description: "",
  });
  const [customArea, setCustomArea] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const focusOptions = ["Healthcare", "Education", "Food", "Disaster Relief", "Environment", "Animal Welfare"];

  const toggleFocusArea = (area: string) => {
    setFormData(prev => ({
      ...prev,
      focusAreas: prev.focusAreas.includes(area) 
        ? prev.focusAreas.filter(a => a !== area)
        : [...prev.focusAreas, area]
    }));
  };

  const addCustomArea = () => {
    if (customArea.trim() && !formData.focusAreas.includes(customArea.trim())) {
      setFormData(prev => ({
        ...prev,
        focusAreas: [...prev.focusAreas, customArea.trim()]
      }));
      setCustomArea("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert("Please sign in first!");

    try {
      await addDoc(collection(db, "ngos"), {
        ...formData,
        status: "PENDING",
        submittedById: user.uid,
        createdAt: serverTimestamp(),
      });
      setSubmitted(true);
    } catch (error) {
      handleFirestoreError(error, 'create', 'ngos');
    }
  };

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto py-24 px-6 text-center">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-12 rounded-3xl border border-border shadow-2xl shadow-primary/5 space-y-6"
        >
          <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 size={48} />
          </div>
          <h2 className="text-3xl font-extrabold text-text-dark">Registration submitted successfully!</h2>
          <p className="text-text-light text-sm">Your application is now under review. Our verification team will get back to you within 3-5 business days.</p>
          <button 
            onClick={() => onComplete ? onComplete() : window.location.reload()}
            className="w-full py-4 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-[#0b7a6f] transition-all"
          >
            Return to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="mb-12 text-center space-y-4">
        <span className="px-4 py-1.5 bg-accent/10 text-accent rounded-full text-[10px] font-black uppercase tracking-widest">Trust & Impact</span>
        <h2 className="text-4xl font-extrabold text-text-dark">NGO Registration Portal</h2>
        <p className="text-text-light max-w-2xl mx-auto leading-relaxed text-sm">Create your secure profile and join India's fastest growing social impact network. Verified NGOs get priority mission matching.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Section 1: Basic Details */}
          <div className="bg-white p-8 rounded-2xl border border-border shadow-sm space-y-6">
            <h3 className="text-xs font-black uppercase text-text-light tracking-[0.2em] flex items-center gap-2">
              <Building2 size={16} className="text-primary" />
              🧾 Basic Details
            </h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 pl-1">NGO Legal Name</label>
                <input 
                  required
                  type="text" 
                  placeholder="Official registered name"
                  className="w-full p-4 bg-bento-bg rounded-xl border border-border focus:ring-1 focus:ring-primary focus:bg-white outline-none"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400 pl-1">Reg ID (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="80G / 12A..."
                    className="w-full p-4 bg-bento-bg rounded-xl border border-border focus:ring-1 focus:ring-primary focus:bg-white outline-none"
                    value={formData.regId}
                    onChange={e => setFormData({...formData, regId: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400 pl-1">Year Established</label>
                  <input 
                    required
                    type="number" 
                    placeholder="YYYY"
                    className="w-full p-4 bg-bento-bg rounded-xl border border-border focus:ring-1 focus:ring-primary focus:bg-white outline-none"
                    value={formData.yearEstablished}
                    onChange={e => setFormData({...formData, yearEstablished: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Location */}
          <div className="bg-white p-8 rounded-2xl border border-border shadow-sm space-y-6">
            <h3 className="text-xs font-black uppercase text-text-light tracking-[0.2em] flex items-center gap-2">
              <MapPin size={16} className="text-primary" />
              📍 Location
            </h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 pl-1">Full Office Address</label>
                <input 
                  required
                  type="text" 
                  placeholder="Flat/Building, Street..."
                  className="w-full p-4 bg-bento-bg rounded-xl border border-border focus:ring-1 focus:ring-primary focus:bg-white outline-none"
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400 pl-1">City / State</label>
                  <input 
                    required
                    type="text" 
                    placeholder="e.g. Pune, MH"
                    className="w-full p-4 bg-bento-bg rounded-xl border border-border focus:ring-1 focus:ring-primary focus:bg-white outline-none"
                    value={formData.cityState}
                    onChange={e => setFormData({...formData, cityState: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400 pl-1">Pin Code</label>
                  <input 
                    required
                    type="number" 
                    placeholder="411001"
                    className="w-full p-4 bg-bento-bg rounded-xl border border-border focus:ring-1 focus:ring-primary focus:bg-white outline-none"
                    value={formData.pinCode}
                    onChange={e => setFormData({...formData, pinCode: e.target.value})}
                  />
                </div>
              </div>
              <div className="h-20 bg-slate-100 rounded-xl flex items-center justify-center border border-dashed border-slate-300">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Map Preview Placeholder</p>
              </div>
            </div>
          </div>

          {/* Section 3: Focus Areas */}
          <div className="md:col-span-2 bg-white p-8 rounded-2xl border border-border shadow-sm space-y-6">
            <h3 className="text-xs font-black uppercase text-text-light tracking-[0.2em] flex items-center gap-2">
              <Sparkles size={16} className="text-secondary" />
              🧠 Focus Areas / Skills
            </h3>
            <div className="space-y-6">
              <div className="flex flex-wrap gap-2">
                {focusOptions.map(option => (
                  <button
                    type="button"
                    key={option}
                    onClick={() => toggleFocusArea(option)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                      formData.focusAreas.includes(option)
                        ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105"
                        : "bg-bento-bg text-text-light border-border hover:border-primary/40"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 max-w-md">
                <input 
                  type="text" 
                  placeholder="Add custom domain..."
                  className="flex-1 p-3 bg-bento-bg rounded-xl border border-border text-sm outline-none focus:bg-white focus:ring-1 focus:ring-primary"
                  value={customArea}
                  onChange={e => setCustomArea(e.target.value)}
                />
                <button 
                  type="button"
                  onClick={addCustomArea}
                  className="px-4 bg-secondary text-white rounded-xl font-bold text-xs"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Section 4: Team & Availability */}
          <div className="bg-white p-8 rounded-2xl border border-border shadow-sm space-y-6">
            <h3 className="text-xs font-black uppercase text-text-light tracking-[0.2em] flex items-center gap-2">
              <Users size={16} className="text-primary" />
              👥 Team & Availability
            </h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 pl-1">Number of Active Volunteers</label>
                <input 
                  required
                  type="number" 
                  placeholder="Current headcount"
                  className="w-full p-4 bg-bento-bg rounded-xl border border-border focus:ring-1 focus:ring-primary focus:bg-white outline-none"
                  value={formData.volunteersCount}
                  onChange={e => setFormData({...formData, volunteersCount: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 pl-1">Availability Type</label>
                <div className="flex gap-2">
                  {["Full-time", "Part-time", "Emergency"].map(type => (
                    <button
                      type="button"
                      key={type}
                      onClick={() => setFormData({...formData, availability: type})}
                      className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                        formData.availability === type 
                          ? "bg-accent text-white border-accent shadow-md shadow-accent/20" 
                          : "bg-bento-bg text-text-light border-border"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 pl-1">Operating Hours</label>
                <input 
                  type="text" 
                  placeholder="e.g. 9 AM - 6 PM, Daily"
                  className="w-full p-4 bg-bento-bg rounded-xl border border-border focus:ring-1 focus:ring-primary focus:bg-white outline-none"
                  value={formData.operatingHours}
                  onChange={e => setFormData({...formData, operatingHours: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Section 5 & 7 Combined: Contact & Verification */}
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-2xl border border-border shadow-sm space-y-6">
              <h3 className="text-xs font-black uppercase text-text-light tracking-[0.2em] flex items-center gap-2">
                <Phone size={16} className="text-primary" />
                📞 Contact Details
              </h3>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400 pl-1">Phone Number</label>
                  <input 
                    required
                    type="tel" 
                    placeholder="+91-XXXXX-XXXXX"
                    className="w-full p-4 bg-bento-bg rounded-xl border border-border focus:ring-1 focus:ring-primary focus:bg-white outline-none"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400 pl-1">Contact Email</label>
                  <input 
                    required
                    type="email" 
                    placeholder="admin@ngo.org"
                    className="w-full p-4 bg-bento-bg rounded-xl border border-border focus:ring-1 focus:ring-primary focus:bg-white outline-none"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="bg-accent/5 p-8 rounded-2xl border border-accent/20 space-y-4">
              <h3 className="text-xs font-black uppercase text-accent tracking-[0.2em] flex items-center gap-2">
                <ShieldCheck size={16} />
                📎 Verification
              </h3>
              <div className="flex flex-col gap-3">
                <div className="w-full p-4 border-2 border-dashed border-accent/30 rounded-xl bg-white flex flex-col items-center justify-center cursor-pointer hover:bg-accent/5 transition-all group">
                   <PlusCircle size={20} className="text-accent mb-2 group-hover:scale-110 transition-transform" />
                   <span className="text-[10px] font-bold uppercase text-accent">Upload Legal Docs (UI Only)</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-white/50 border border-accent/10 rounded-lg">
                  <CheckCircle2 size={12} className="text-primary" />
                  <span className="text-[9px] font-black uppercase text-text-light tracking-widest">Verified NGO Badge Indicator Active</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 6: About NGO */}
          <div className="md:col-span-2 bg-white p-8 rounded-2xl border border-border shadow-sm space-y-6">
            <h3 className="text-xs font-black uppercase text-text-light tracking-[0.2em] flex items-center gap-2">
              <Edit size={16} className="text-primary" />
              📝 About NGO & Mission
            </h3>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400 pl-1">Description / Mission Statement</label>
              <textarea 
                required
                rows={5}
                placeholder="Briefly describe your goals, recent impact, and why volunteers should join your mission."
                className="w-full p-6 bg-bento-bg rounded-xl border border-border focus:ring-1 focus:ring-primary focus:bg-white outline-none text-sm leading-relaxed"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>
          </div>
        </div>

        {/* Final Actions */}
        <div className="flex flex-col md:flex-row gap-4 pt-8">
          <button 
            type="submit"
            className="flex-1 py-5 bg-primary text-white font-extrabold text-lg rounded-2xl shadow-xl shadow-primary/20 hover:bg-[#0b7a6f] hover:-translate-y-1 transition-all"
          >
            Register NGO
          </button>
          <button 
            type="button"
            className="flex-1 py-5 bg-bento-bg text-text-dark font-extrabold text-lg rounded-2xl border border-border hover:bg-white transition-all"
          >
            Save Draft
          </button>
        </div>
      </form>
    </div>
  );
};

const RegistrationScreen = ({ setScreen }: { setScreen: (s: Screen) => void }) => {
  const [choice, setChoice] = useState<'volunteer' | 'ngo' | null>(null);

  if (choice === 'ngo') {
    return (
      <div className="relative">
        <button 
          onClick={() => setChoice(null)}
          className="absolute top-8 left-8 z-20 flex items-center gap-2 px-4 py-2 bg-white border border-border rounded-xl text-xs font-bold text-text-light hover:text-primary transition-colors shadow-sm"
        >
          <ArrowRight size={14} className="rotate-180" /> Back to Selection
        </button>
        <NGORegistrationScreen onComplete={() => setChoice(null)} />
      </div>
    );
  }

  if (choice === 'volunteer') {
    const { user } = useAuth();
    const [vData, setVData] = useState({ name: user?.displayName || "", location: "", skills: "", commitment: "5-10 hrs/week" });

    const finishVolunteerReg = async () => {
      if (!user) return alert("Please sign in first!");
      try {
        await addDoc(collection(db, "volunteers"), {
          name: vData.name,
          uid: user.uid,
          location: vData.location,
          availability: vData.commitment,
          skills: vData.skills.split(',').map(s => s.trim()),
          verified: false,
          bio: "Just joined the network!",
          avatar: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`,
          workCondition: "Remote",
          createdAt: serverTimestamp()
        });
        setScreen("profile");
      } catch (error) {
        handleFirestoreError(error, 'create', 'volunteers');
      }
    };

    return (
      <div className="relative">
        <button 
          onClick={() => setChoice(null)}
          className="absolute top-8 left-8 z-10 flex items-center gap-2 px-4 py-2 bg-white border border-border rounded-xl text-xs font-bold text-text-light hover:text-primary transition-colors"
        >
          <ArrowRight size={14} className="rotate-180" /> Back to Selection
        </button>
        <div className="max-w-3xl mx-auto px-6 py-16 space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-extrabold text-[#153448]">Volunteer Onboarding</h2>
            <p className="text-text-light">Start your journey as a verified social impact expert.</p>
          </div>
          
          <div className="bg-white p-8 rounded-3xl border border-border shadow-xl space-y-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 pl-1">Full Name</label>
                <input 
                  type="text" 
                  placeholder="Aarav Sharma" 
                  className="w-full p-4 bg-bento-bg rounded-xl border border-border focus:ring-1 focus:ring-primary outline-none" 
                  value={vData.name}
                  onChange={e => setVData({...vData, name: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 pl-1">Location</label>
                <input 
                  type="text" 
                  placeholder="Pune, Maharashtra" 
                  className="w-full p-4 bg-bento-bg rounded-xl border border-border focus:ring-1 focus:ring-primary outline-none" 
                  value={vData.location}
                  onChange={e => setVData({...vData, location: e.target.value})}
                />
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400 pl-1">Core Expert Skills (comma separated)</label>
              <input 
                type="text" 
                placeholder="e.g. Content Strategy, UI Design, Legal Research" 
                className="w-full p-4 bg-bento-bg rounded-xl border border-border focus:ring-1 focus:ring-primary outline-none" 
                value={vData.skills}
                onChange={e => setVData({...vData, skills: e.target.value})}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400 pl-1">Weekly Commitment</label>
              <select 
                className="w-full p-4 bg-bento-bg rounded-xl border border-border focus:ring-1 focus:ring-primary outline-none"
                value={vData.commitment}
                onChange={e => setVData({...vData, commitment: e.target.value})}
              >
                <option>5-10 hrs/week</option>
                <option>10-20 hrs/week</option>
                <option>Full Priority (Flexible)</option>
              </select>
            </div>

            <button 
               onClick={finishVolunteerReg}
               className="w-full py-5 bg-[#0D2B4D] text-white font-extrabold text-lg rounded-2xl shadow-xl shadow-[#0D2B4D]/20 hover:bg-[#0A233D] transition-all"
            >
              Finish Registration
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-20">
      <div className="text-center space-y-4 mb-16">
        <h2 className="text-5xl font-extrabold text-[#153448]">Ready to make an Impact?</h2>
        <p className="text-text-light text-lg">Choose your path to join India's largest NGO support network.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-10">
        {/* Volunteer Path */}
        <motion.div 
          whileHover={{ y: -10 }}
          className="bg-white p-10 rounded-[2.5rem] border border-border shadow-sm hover:shadow-2xl transition-all cursor-pointer group flex flex-col items-center text-center"
          onClick={() => setChoice('volunteer')}
        >
          <div className="w-24 h-24 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
            <Users size={48} />
          </div>
          <h3 className="text-2xl font-black text-[#153448] mb-4 uppercase tracking-tighter">I am a Volunteer</h3>
          <p className="text-slate-500 text-sm leading-relaxed mb-10">
            Offer your professional skills to vetted NGOs. Build your profile, earn badges, and track your social impact across India.
          </p>
          <button className="mt-auto px-10 py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20">
            Start Helping
          </button>
        </motion.div>

        {/* NGO Path */}
        <motion.div 
          whileHover={{ y: -10 }}
          className="bg-white p-10 rounded-[2.5rem] border border-border shadow-sm hover:shadow-2xl transition-all cursor-pointer group flex flex-col items-center text-center border-b-8 border-b-secondary/20"
          onClick={() => setChoice('ngo')}
        >
          <div className="w-24 h-24 rounded-3xl bg-secondary/10 text-secondary flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
            <Building2 size={48} />
          </div>
          <h3 className="text-2xl font-black text-[#153448] mb-4 uppercase tracking-tighter">I am an NGO Org</h3>
          <p className="text-slate-500 text-sm leading-relaxed mb-10">
            List your missions, mapping your obstacles to skilled experts. Access verified talent for high-impact social projects.
          </p>
          <button className="mt-auto px-10 py-4 bg-secondary text-white font-bold rounded-2xl shadow-lg shadow-secondary/20">
            Enroll NGO
          </button>
        </motion.div>
      </div>
      
      <p className="text-center mt-12 text-slate-400 text-xs font-bold uppercase tracking-widest leading-loose">
        Trusted by 500+ Organizations <br /> Across 28 States & 8 UTs
      </p>
    </div>
  );
};

const NGODirectoryScreen = () => {
  const [ngos, setNgos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const MOCK_NGOS = [
    {
      name: "Akshaya Patra Foundation",
      status: "Verified",
      location: "Hare Krishna Hill, Bengaluru",
      tags: ["Education", "Nutriton"],
      icon: <Utensils className="text-secondary" />,
      color: "bg-secondary/10"
    },
    {
      name: "HelpAge India",
      status: "Active",
      location: "Qutab Institutional Area, New Delhi",
      tags: ["Senior Care", "Health"],
      icon: <Stethoscope className="text-primary" />,
      color: "bg-primary/10"
    },
    {
      name: "Prakriti Sanrakshan",
      status: "Active",
      location: "Salt Lake, Kolkata",
      tags: ["Environment", "Sprout"],
      icon: <Sprout className="text-green-600" />,
      color: "bg-green-100"
    }
  ];

  useEffect(() => {
    const q = query(collection(db, "ngos"), limit(20));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      
      const combined = [
        ...list.map(n => ({
          name: n.name,
          status: n.status === 'PENDING' ? 'Reviewing' : 'Verified',
          location: n.cityState,
          tags: n.focusAreas,
          icon: <Building2 className="text-primary" />,
          color: "bg-primary/5"
        })),
        ...MOCK_NGOS
      ];
      setNgos(combined);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Map Hero */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="relative rounded-[3rem] overflow-hidden bg-slate-50 border border-slate-200 shadow-sm h-[450px] flex items-center justify-center">
          <div className="absolute inset-0 opacity-20 pointer-events-none">
             <div className="absolute inset-0 bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=20.5937,78.9629&zoom=4&size=1200x600&style=feature:all|element:labels|visibility:off&style=feature:geometry|color:0xeeeeee&style=feature:water|color:0xdddddd&key=')] bg-cover bg-center grayscale" />
          </div>
          
          <div className="relative z-10 bg-white/90 backdrop-blur-md p-10 rounded-[2.5rem] border border-white text-center shadow-xl space-y-6 max-w-lg">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-200/50">
              <MapPin size={32} />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-[#153448] tracking-tight">Explore Nearby NGOs</h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                Discover active organizations operating within a 10km radius of your current location.
              </p>
            </div>
            <button className="w-full py-4 bg-[#0A3D62] text-white font-bold rounded-2xl hover:bg-[#082E49] transition-all flex items-center justify-center gap-3 shadow-lg shadow-[#0A3D62]/20">
              Open Map View
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Directory Grid */}
      <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h3 className="text-3xl font-extrabold text-[#153448]">Verified Organizations</h3>
            <p className="text-slate-400 text-sm font-medium">Browse our network of vetted social impact partners.</p>
          </div>
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-2 rounded-2xl w-full md:w-[350px]">
            <SearchIcon size={18} className="text-slate-400 ml-2" />
            <input 
              type="text" 
              placeholder="Search by name or category..." 
              className="bg-transparent border-none outline-none text-sm w-full py-2"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {ngos.map((ngo, idx) => (
            <motion.div 
              key={idx}
              whileHover={{ y: -8 }}
              className="group bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-2xl transition-all flex flex-col"
            >
              <div className={`${ngo.color} h-40 flex items-center justify-center relative overflow-hidden`}>
                <div className="absolute top-4 right-4 z-10">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                    ngo.status === 'Verified' ? 'bg-green-500 text-white' : 'bg-[#0A3D62] text-white'
                  }`}>
                    {ngo.status}
                  </span>
                </div>
                <div className="transform group-hover:scale-110 transition-transform duration-500 bg-white/50 backdrop-blur-sm p-6 rounded-3xl shadow-lg">
                  {React.cloneElement(ngo.icon as React.ReactElement, { size: 48 })}
                </div>
              </div>

              <div className="p-8 space-y-6 flex-1 flex flex-col">
                <div className="space-y-2">
                  <h4 className="text-xl font-bold text-[#153448] group-hover:text-primary transition-colors leading-tight">
                    {ngo.name}
                  </h4>
                  <div className="flex items-start gap-1.5 text-slate-400 text-xs">
                    <MapPin size={12} className="mt-0.5 shrink-0" />
                    <span className="line-clamp-1">{ngo.location}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {ngo.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-slate-50 text-slate-500 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-slate-100">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="pt-6 border-t border-slate-100 mt-auto">
                  <button className="w-full py-3 bg-white border border-slate-200 text-[#153448] font-bold text-xs rounded-xl hover:bg-[#0A3D62] hover:text-white transition-all">
                    View Impact Profile
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

const VolunteerDirectoryScreen = () => {
  const [volunteers, setVolunteers] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, "volunteers"), limit(20));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      setVolunteers(list.length > 0 ? list : MOCK_VOLUNTEERS);
    });
    return unsubscribe;
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
      <div className="text-center space-y-4">
        <div className="inline-flex p-4 bg-primary/10 rounded-3xl text-primary mb-2">
          <Users size={40} />
        </div>
        <h2 className="text-4xl font-extrabold text-[#153448] uppercase tracking-tighter">Expert Directory</h2>
        <p className="text-slate-500 max-w-2xl mx-auto leading-relaxed">Connecting NGOs with verified experts across India. Browse by domain, location, or working preference.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {volunteers.map((v, i) => (
          <motion.div 
            key={i} 
            whileHover={{ y: -8 }}
            className="bg-white p-8 rounded-[2rem] border border-border shadow-sm hover:shadow-2xl transition-all relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4">
              <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                v.workCondition === 'Remote' ? 'bg-primary/10 text-primary' : v.workCondition === 'Hybrid' ? 'bg-secondary/10 text-secondary' : 'bg-accent/10 text-accent'
              }`}>
                {v.workCondition}
              </span>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full border-4 border-slate-50 overflow-hidden mb-6 shadow-lg group-hover:border-primary/20 transition-colors">
                <img src={v.avatar} alt={v.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <h3 className="font-extrabold text-xl mb-1 text-[#153448] group-hover:text-primary transition-colors">{v.name}</h3>
              <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold uppercase tracking-wider mb-6">
                <MapPin size={12} className="text-primary" />
                {v.location}
              </div>
              
              <div className="w-full border-t border-slate-100 pt-6 mt-2">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Core Competencies</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {v.skills.slice(0, 3).map((s: string) => (
                    <span key={s} className="px-3 py-1.5 bg-slate-50 rounded-xl text-[10px] font-extrabold text-slate-800 border border-slate-100 shadow-sm">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <button className="mt-8 w-full py-3 bg-slate-50 text-primary font-bold text-sm rounded-xl hover:bg-primary hover:text-white transition-all">
                Contact Expert
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const [screen, setScreen] = useState<Screen>("landing");
  const { user } = useAuth();

  // Scroll to top on screen change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screen]);

  return (
    <div className="min-h-screen selection:bg-primary/20">
      <Navbar active={screen} setScreen={setScreen} />
      
      <main className="pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={screen}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {screen === "landing" && <LandingScreen setScreen={setScreen} />}
            {screen === "dashboard" && <DashboardScreen setScreen={setScreen} />}
            {screen === "directory" && <VolunteerDirectoryScreen />}
            {screen === "post-problem" && <PostProblemScreen />}
            {screen === "skill-mapping" && <SkillMappingScreen />}
            {screen === "profile" && <ProfileScreen />}
            {screen === "ngo-directory" && <NGODirectoryScreen />}
            
            {screen === "registration" && <RegistrationScreen setScreen={setScreen} />}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="bg-text-dark text-white py-16 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12">
          <div className="col-span-2 md:col-span-1 space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-white">
                <Heart size={14} fill="currentColor" />
              </div>
              <span className="text-lg font-extrabold tracking-tight">NGO<span className="text-primary">Connect</span></span>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed max-w-xs">
              Optimizing social impact through structured collaboration and AI-powered resource matching.
            </p>
          </div>
          <div className="md:ml-auto">
            <h4 className="font-bold mb-4 text-primary uppercase tracking-[0.2em] text-[10px]">Resources</h4>
            <ul className="space-y-3 text-xs text-slate-400">
              <li className="hover:text-white cursor-pointer transition-colors">Browse Tasks</li>
              <li className="hover:text-white cursor-pointer transition-colors">Skill Badging</li>
              <li className="hover:text-white cursor-pointer transition-colors">Impact Reports</li>
            </ul>
          </div>
          <div className="md:ml-auto">
            <h4 className="font-bold mb-4 text-primary uppercase tracking-[0.2em] text-[10px]">Trust</h4>
            <ul className="space-y-3 text-xs text-slate-400">
              <li className="hover:text-white cursor-pointer transition-colors">Privacy Policy</li>
              <li className="hover:text-white cursor-pointer transition-colors">NGO Certification</li>
              <li className="hover:text-white cursor-pointer transition-colors">Guidelines</li>
            </ul>
          </div>
          <div className="md:ml-auto">
            <h4 className="font-bold mb-4 text-primary uppercase tracking-[0.2em] text-[10px]">Follow</h4>
            <ul className="space-y-3 text-xs text-slate-400">
              <li className="hover:text-white cursor-pointer transition-colors">Twitter (X)</li>
              <li className="hover:text-white cursor-pointer transition-colors">Instagram</li>
              <li className="hover:text-white cursor-pointer transition-colors">LinkedIn</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-white/5 text-center text-slate-600 text-[10px] tracking-widest font-bold uppercase">
          © 2026 NGO Connect. All Rights Reserved.
        </div>
      </footer>
    </div>
  );
}
