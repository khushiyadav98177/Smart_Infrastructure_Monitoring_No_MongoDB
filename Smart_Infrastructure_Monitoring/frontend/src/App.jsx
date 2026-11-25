import React, { useEffect, useMemo, useState } from "react";
import {
  Activity, AlertTriangle, ArrowUpRight, Camera, CheckCircle2, ChevronDown,
  ClipboardList, Clock3, Filter, LayoutDashboard, LogOut, MapPin, Menu,
  Plus, Search, ShieldCheck, Siren, Trash2, UploadCloud, Wrench, X
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const categories = ["Damaged Road","Pothole","Broken Streetlight","Blocked Drain","Damaged Public Facility","Other"];
const priorities = ["Low","Medium","High","Critical"];
const statuses = ["Pending","In Progress","Resolved"];

function App() {
  const [token, setToken] = useState(localStorage.getItem("infra_token") || "");
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("infra_user") || "null"));
  const [authMode, setAuthMode] = useState("login");
  const [auth, setAuth] = useState({name:"",email:"",password:""});
  const [issues, setIssues] = useState([]);
  const [stats, setStats] = useState({total:0,pending:0,inProgress:0,resolved:0,critical:0});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [mobileNav, setMobileNav] = useState(false);
  const [form, setForm] = useState({title:"",category:categories[0],description:"",location:"",latitude:"",longitude:"",priority:"Medium"});
  const [photo, setPhoto] = useState(null);

  const headers = { Authorization: `Bearer ${token}` };
  async function request(path, options={}) {
    const response = await fetch(`${API}${path}`, { ...options, headers: { ...headers, ...(options.headers || {}) } });
    const data = await response.json().catch(()=>({message:"Unexpected server response"}));
    if (!response.ok) throw new Error(data.message || "Request failed");
    return data;
  }
  function signOut() {
    localStorage.removeItem("infra_token"); localStorage.removeItem("infra_user");
    setToken(""); setUser(null); setIssues([]);
  }
  async function loadDashboard() {
    if (!token) return;
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams();
      if (search) params.set("search",search);
      params.set("status",statusFilter); params.set("category",categoryFilter); params.set("priority",priorityFilter);
      const [issueData, statData] = await Promise.all([
        request(`/issues?${params.toString()}`), request("/issues/stats/summary")
      ]);
      setIssues(issueData.issues); setStats(statData);
    } catch (e) { setError(e.message); if (e.message.toLowerCase().includes("session")) signOut(); }
    finally { setLoading(false); }
  }
  useEffect(() => { if (token) loadDashboard(); }, [token,search,statusFilter,categoryFilter,priorityFilter]);
  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(id);
  }, [notice]);

  async function submitAuth(e) {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const data = await request(`/auth/${authMode==="login"?"login":"register"}`, {
        method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(auth)
      });
      localStorage.setItem("infra_token",data.token); localStorage.setItem("infra_user",JSON.stringify(data.user));
      setToken(data.token); setUser(data.user); setAuth({name:"",email:"",password:""});
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }
  async function submitIssue(e) {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const body = new FormData();
      Object.entries(form).forEach(([key,value])=>body.append(key,value));
      if (photo) body.append("photo",photo);
      await request("/issues",{method:"POST",body});
      setShowForm(false); setForm({title:"",category:categories[0],description:"",location:"",latitude:"",longitude:"",priority:"Medium"});
      setPhoto(null); setNotice("Your issue has been reported successfully."); await loadDashboard();
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }
  async function updateIssue(id, updates) {
    try {
      await request(`/issues/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(updates)});
      setNotice("Issue updated successfully."); await loadDashboard();
    } catch(e) { setError(e.message); }
  }

  const isAdmin = user?.role === "admin";
  const statCards = [
    {label:"Total reports",value:stats.total,icon:ClipboardList,tone:"blue"},
    {label:"Pending",value:stats.pending,icon:Clock3,tone:"amber"},
    {label:"In progress",value:stats.inProgress,icon:Wrench,tone:"violet"},
    {label:"Resolved",value:stats.resolved,icon:CheckCircle2,tone:"green"},
  ];

  if (!token || !user) return (
    <main className="auth-page">
      <section className="auth-visual">
        <div className="brand light"><span className="brand-mark"><Activity/></span><span>Infra<span>Watch</span></span></div>
        <div className="visual-copy">
          <span className="eyebrow">SMARTER CITIES. BETTER COMMUNITIES.</span>
          <h1>Small reports.<br/><em>Big improvements.</em></h1>
          <p>A simple way to report infrastructure issues, track action and help make your neighbourhood safer.</p>
          <div className="visual-points"><span><ShieldCheck/> Transparent tracking</span><span><MapPin/> Location-based reports</span><span><CheckCircle2/> Community impact</span></div>
        </div>
        <div className="visual-footer">COMMUNITY INFRASTRUCTURE • SDG 9 & 11</div>
      </section>
      <section className="auth-panel">
        <div className="auth-mobile-brand"><span className="brand-mark"><Activity/></span> InfraWatch</div>
        <div className="auth-box">
          <span className="eyebrow">WELCOME TO INFR AWATCH</span>
          <h2>{authMode==="login"?"Welcome back":"Create your account"}</h2>
          <p className="muted">{authMode==="login"?"Sign in to monitor your community.":"Join your community and report local issues."}</p>
          {error && <div className="alert">{error}</div>}
          <form onSubmit={submitAuth} className="stack">
            {authMode==="register" && <label>Full name<input required value={auth.name} onChange={e=>setAuth({...auth,name:e.target.value})} placeholder="Your name"/></label>}
            <label>Email address<input required type="email" value={auth.email} onChange={e=>setAuth({...auth,email:e.target.value})} placeholder="you@example.com"/></label>
            <label>Password<input required minLength="8" type="password" value={auth.password} onChange={e=>setAuth({...auth,password:e.target.value})} placeholder="At least 8 characters"/></label>
            <button className="primary full" disabled={loading}>{loading?"Please wait…":authMode==="login"?"Sign in":"Create account"} <ArrowUpRight size={17}/></button>
          </form>
          <p className="switch-auth">{authMode==="login"?"New to InfraWatch?":"Already have an account?"} <button onClick={()=>{setAuthMode(authMode==="login"?"register":"login");setError("");}}>{authMode==="login"?"Create an account":"Sign in"}</button></p>
          <div className="secure-note"><ShieldCheck size={15}/> Your account is protected with encrypted password storage.</div>
        </div>
      </section>
    </main>
  );

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav?"open":""}`}>
        <div className="brand"><span className="brand-mark"><Activity/></span><span>Infra<span>Watch</span></span></div>
        <div className="workspace-label">WORKSPACE</div>
        <button className="nav-item active"><LayoutDashboard size={18}/> Overview</button>
        <button className="nav-item" onClick={()=>setShowForm(true)}><Plus size={18}/> Report an issue</button>
        <div className="sidebar-bottom">
          <div className="help-card"><div className="help-icon"><Siren size={19}/></div><b>See a problem?</b><p>Report it and help improve your neighbourhood.</p><button onClick={()=>setShowForm(true)}>Create report <ArrowUpRight size={14}/></button></div>
          <div className="profile">
            <div className="avatar">{user.name?.slice(0,1).toUpperCase()}</div>
            <div className="profile-text"><b>{user.name}</b><small>{isAdmin?"Administrator":"Community member"}</small></div>
            <button className="icon-button" title="Sign out" onClick={signOut}><LogOut size={17}/></button>
          </div>
        </div>
      </aside>
      {mobileNav && <div className="scrim" onClick={()=>setMobileNav(false)}/>}
      <main className="main-area">
        <header className="topbar">
          <button className="icon-button mobile-menu" onClick={()=>setMobileNav(!mobileNav)}><Menu/></button>
          <div><span className="crumb">Workspace</span><span className="crumb-sep">/</span><b>Overview</b></div>
          <div className="top-right"><span className="live-dot"/> System operational <div className="avatar small">{user.name?.slice(0,1).toUpperCase()}</div></div>
        </header>
        <div className="content">
          <div className="welcome-row">
            <div><span className="eyebrow">COMMUNITY OVERVIEW</span><h1>Good to see you, {user.name?.split(" ")[0]} <span>✦</span></h1><p className="muted">Here’s what’s happening with infrastructure in your community.</p></div>
            <button className="primary" onClick={()=>setShowForm(true)}><Plus size={18}/> Report an issue</button>
          </div>
          {error && <div className="alert dismiss"><span>{error}</span><button onClick={()=>setError("")}><X size={16}/></button></div>}
          {notice && <div className="success-note"><CheckCircle2 size={17}/>{notice}</div>}
          <section className="stats-grid">
            {statCards.map(({label,value,icon:Icon,tone})=><div className="stat-card" key={label}><div className={`stat-icon ${tone}`}><Icon size={19}/></div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-foot">Updated just now</div></div>)}
          </section>
          <section className="attention-banner">
            <div className="attention-icon"><AlertTriangle size={21}/></div>
            <div><b>{stats.critical} critical issue{stats.critical===1?"":"s"} need attention</b><p>High-priority reports should be reviewed as soon as possible.</p></div>
            <button onClick={()=>setPriorityFilter("Critical")}>View critical issues <ArrowUpRight size={15}/></button>
          </section>
          <section className="issues-section">
            <div className="section-heading"><div><h2>{isAdmin?"All infrastructure reports":"Your reports"}</h2><p className="muted">{isAdmin?"Monitor and manage reports from your community.":"Track the progress of issues you have reported."}</p></div><span className="count-pill">{issues.length} reports</span></div>
            <div className="filters">
              <div className="search-box"><Search size={17}/><input placeholder="Search issues or locations…" value={search} onChange={e=>setSearch(e.target.value)}/></div>
              <div className="filter-select"><Filter size={16}/><select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option>All</option>{statuses.map(x=><option key={x}>{x}</option>)}</select></div>
              <div className="filter-select"><select value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)}><option>All</option>{categories.map(x=><option key={x}>{x}</option>)}</select></div>
              <div className="filter-select"><select value={priorityFilter} onChange={e=>setPriorityFilter(e.target.value)}><option>All</option>{priorities.map(x=><option key={x}>{x}</option>)}</select></div>
            </div>
            {loading ? <div className="empty-state">Loading your reports…</div> : issues.length===0 ? (
              <div className="empty-state"><div className="empty-icon"><ClipboardList size={27}/></div><h3>No reports found</h3><p>Try changing your filters or create your first report.</p><button className="primary" onClick={()=>setShowForm(true)}><Plus size={17}/> Report an issue</button></div>
            ) : <div className="issue-list">{issues.map(issue=><article className="issue-card" key={issue.id}>
              <div className="issue-symbol">{issue.category==="Pothole"?"🛣️":issue.category==="Broken Streetlight"?"💡":issue.category==="Blocked Drain"?"🌧️":issue.category==="Damaged Public Facility"?"🏢":"🚧"}</div>
              <div className="issue-main">
                <div className="issue-title-row"><h3>{issue.title}</h3><span className={`priority ${issue.priority.toLowerCase()}`}>{issue.priority} priority</span></div>
                <p className="issue-desc">{issue.description}</p>
                <div className="issue-meta"><span><MapPin size={14}/>{issue.location}</span><span><Clock3 size={14}/>{new Date(issue.createdAt).toLocaleDateString()}</span>{isAdmin && <span>By {issue.reportedBy?.name || "Community member"}</span>}</div>
                {issue.photo && <a className="photo-link" href={`${API.replace("/api","")}${issue.photo}`} target="_blank" rel="noreferrer"><Camera size={14}/> View photo</a>}
                {(issue.latitude != null && issue.longitude != null) && <a className="photo-link" href={`https://www.openstreetmap.org/?mlat=${issue.latitude}&mlon=${issue.longitude}#map=17/${issue.latitude}/${issue.longitude}`} target="_blank" rel="noreferrer"><MapPin size={14}/> Open map</a>}
                {isAdmin && <div className="admin-controls"><label>Status <select value={issue.status} onChange={e=>updateIssue(issue.id,{status:e.target.value})}>{statuses.map(s=><option key={s}>{s}</option>)}</select></label><label>Assigned team <input value={issue.assignedTeamDraft ?? issue.assignedTeam ?? ""} placeholder="e.g. Road maintenance" onChange={e=>setIssues(prev=>prev.map(x=>x._id===issue.id?{...x,assignedTeamDraft:e.target.value}:x))} onBlur={e=>updateIssue(issue.id,{assignedTeam:e.target.value})}/></label></div>}
              </div>
              <div className="issue-right"><span className={`status ${issue.status.toLowerCase().replace(" ","-")}`}><span/>{issue.status}</span>{!isAdmin && <small>Reported by you</small>}</div>
            </article>)}</div>}
          </section>
          <footer className="footer">© 2026 InfraWatch <span>Built for stronger, safer communities · SDG 9 & 11</span></footer>
        </div>
      </main>
      {showForm && <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setShowForm(false);}}><div className="modal">
        <div className="modal-head"><div><span className="eyebrow">COMMUNITY REPORT</span><h2>Report an infrastructure issue</h2><p className="muted">Share the details so the right team can take action.</p></div><button className="icon-button" onClick={()=>setShowForm(false)}><X/></button></div>
        <form onSubmit={submitIssue} className="report-form">
          <label>Issue title *<input required maxLength="120" placeholder="e.g. Large pothole near main gate" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></label>
          <div className="form-grid"><label>Category *<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{categories.map(c=><option key={c}>{c}</option>)}</select></label><label>Priority<select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}>{priorities.map(p=><option key={p}>{p}</option>)}</select></label></div>
          <label>Description *<textarea required rows="4" maxLength="2000" placeholder="Describe the issue, its size and how it affects people…" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label>
          <label>Location / address *<input required placeholder="Street, area, landmark, city" value={form.location} onChange={e=>setForm({...form,location:e.target.value})}/></label>
          <div className="form-grid"><label>Latitude (optional)<input type="number" step="any" min="-90" max="90" placeholder="e.g. 28.6139" value={form.latitude} onChange={e=>setForm({...form,latitude:e.target.value})}/></label><label>Longitude (optional)<input type="number" step="any" min="-180" max="180" placeholder="e.g. 77.2090" value={form.longitude} onChange={e=>setForm({...form,longitude:e.target.value})}/></label></div>
          <label className="upload-box"><UploadCloud size={22}/><b>{photo?photo.name:"Upload an issue photo"}</b><span>JPG, PNG or WEBP · Maximum 5 MB</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>setPhoto(e.target.files?.[0] || null)}/></label>
          {error && <div className="alert">{error}</div>}
          <div className="modal-actions"><button type="button" className="secondary" onClick={()=>setShowForm(false)}>Cancel</button><button className="primary" disabled={loading}>{loading?"Submitting…":"Submit report"} <ArrowUpRight size={16}/></button></div>
        </form>
      </div></div>}
    </div>
  );
}
export default App;
