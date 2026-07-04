import { useState, useEffect, useCallback, useRef } from "react";

// ── Photo storage in browser localStorage ─────────────────────────────────────
const PHOTO_KEY="stafftrack_photos";
function getPhotos(){try{return JSON.parse(localStorage.getItem(PHOTO_KEY)||"{}");}catch{return {};}}
function savePhoto(id,url){const p=getPhotos();p[id]=url;localStorage.setItem(PHOTO_KEY,JSON.stringify(p));}
function getPhoto(id){return getPhotos()[id]||null;}

const API = "http://127.0.0.1:5000/api";

const DEPT_COLORS={Engineering:"#3b82f6",Design:"#8b5cf6",Marketing:"#f59e0b",HR:"#10b981",Finance:"#06b6d4",Sales:"#ec4899",Product:"#6366f1",Analytics:"#14b8a6"};
const STATUS_STYLE={Active:{bg:"#052e16",color:"#4ade80",dot:"#22c55e"},"On Leave":{bg:"#451a03",color:"#fb923c",dot:"#f97316"},Inactive:{bg:"#450a0a",color:"#f87171",dot:"#ef4444"}};
const DEPTS=["All","Engineering","Design","Marketing","HR","Finance","Sales","Product","Analytics"];
const STATUSES=["All","Active","On Leave","Inactive"];
const ini=m=>`${m.first_name[0]}${m.last_name[0]}`;
function getColor(m){return DEPT_COLORS[m.department]||"#6366f1";}

// Unique gradient per person for profile photo effect
const GRADIENTS={
  "Arun Kumar":["#6366f1","#4f46e5"],
  "Priya Sharma":["#6366f1","#4f46e5"],
  "Rahul Verma":["#6366f1","#4f46e5"],
  "Meena Patel":["#6366f1","#4f46e5"],
  "Kiran Raj":["#6366f1","#4f46e5"],
  "Divya Nair":["#6366f1","#4f46e5"],
  "Arjun Singh":["#6366f1","#4f46e5"],
  "Sneha Iyer":["#6366f1","#4f46e5"],
  "Vikram Bose":["#6366f1","#4f46e5"],
  "Ananya Reddy":["#6366f1","#4f46e5"],
};
function getGradient(m){
  const n=`${m.first_name} ${m.last_name}`;
  return GRADIENTS[n]||["#6366f1","#4f46e5"];
}

const api={
  login:(u,p)=>fetch(`${API}/login`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:u,password:p})}).then(r=>r.json()),
  getStaff:(p={})=>{const q=new URLSearchParams();if(p.department&&p.department!=="All")q.set("department",p.department);if(p.status&&p.status!=="All")q.set("status",p.status);if(p.q)q.set("q",p.q);return fetch(`${API}/staff?${q}`).then(r=>r.json());},
  createStaff:(d)=>fetch(`${API}/staff`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(d)}).then(r=>r.json()),
  updateStaff:(id,d)=>fetch(`${API}/staff/${id}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(d)}).then(r=>r.json()),
  deleteStaff:(id)=>fetch(`${API}/staff/${id}`,{method:"DELETE"}).then(r=>r.json()),
};

function Spinner({size=18,color="#fff"}){return <span style={{display:"inline-block",width:size,height:size,border:`2px solid ${color}33`,borderTopColor:color,borderRadius:"50%",animation:"spin .8s linear infinite",flexShrink:0}}/>;}

function Toast({msg,type}){
  return <div style={{position:"fixed",bottom:24,right:24,zIndex:9999,background:"#1e293b",border:`1px solid ${type==="error"?"#f8717133":"#4ade8033"}`,borderRadius:12,padding:"12px 18px",color:type==="error"?"#f87171":"#4ade80",fontSize:13,fontWeight:600,boxShadow:"0 4px 24px rgba(0,0,0,.4)",display:"flex",alignItems:"center",gap:8}}>
    {type==="error"?"⚠️":"✅"} {msg}
  </div>;
}

// ── BIG PROFILE PHOTO AVATAR ──────────────────────────────────────────────────
function ProfilePhoto({m,size=80}){
  const [g1,g2]=getGradient(m);
  const fs=size*.38;
  const photo=getPhoto(m.id);
  return(
    <div style={{width:size,height:size,borderRadius:"50%",flexShrink:0,position:"relative"}}>
      <div style={{position:"absolute",inset:-3,borderRadius:"50%",background:`linear-gradient(135deg,${g1},${g2})`,opacity:.3}}/>
      {photo?(
        <img src={photo} alt={m.first_name} style={{width:"100%",height:"100%",borderRadius:"50%",objectFit:"cover",border:"2px solid rgba(255,255,255,.15)",boxShadow:`0 4px 20px ${g1}66`}}/>
      ):(
        <div style={{width:"100%",height:"100%",borderRadius:"50%",background:`linear-gradient(145deg,${g1},${g2})`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:fs,letterSpacing:"-1px",boxShadow:`0 4px 20px ${g1}66,inset 0 1px 0 rgba(255,255,255,.2)`,border:"2px solid rgba(255,255,255,.1)",position:"relative"}}>
          {ini(m)}
          <div style={{position:"absolute",top:"10%",left:"15%",width:"40%",height:"35%",borderRadius:"50%",background:"rgba(255,255,255,.15)",filter:"blur(4px)"}}/>
        </div>
      )}
    </div>
  );
}

// Small avatar for table/navbar
function Avatar({m,size=36}){
  const [g1,g2]=getGradient(m);
  const photo=getPhoto(m.id);
  if(photo) return <img src={photo} alt={m.first_name} style={{width:size,height:size,borderRadius:"50%",objectFit:"cover",flexShrink:0,border:"1.5px solid rgba(255,255,255,.1)",boxShadow:`0 2px 8px ${g1}44`}}/>;
  return <div style={{width:size,height:size,borderRadius:"50%",background:`linear-gradient(135deg,${g1},${g2})`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:size*.35,flexShrink:0,boxShadow:`0 2px 8px ${g1}44`,border:"1.5px solid rgba(255,255,255,.1)"}}>{ini(m)}</div>;
}

function Badge({label,color}){
  return <span style={{background:`${color}20`,color,borderRadius:6,padding:"3px 8px",fontSize:10,fontWeight:700,letterSpacing:".5px",textTransform:"uppercase"}}>{label}</span>;
}

function StatusPill({status}){
  const s=STATUS_STYLE[status]||STATUS_STYLE.Active;
  return <span style={{background:s.bg,color:s.color,borderRadius:6,padding:"3px 10px",fontSize:11,fontWeight:600,display:"inline-flex",alignItems:"center",gap:5}}>
    <span style={{width:5,height:5,borderRadius:"50%",background:s.dot,display:"inline-block"}}/>{status}
  </span>;
}

// ── LOGIN PAGE ────────────────────────────────────────────────────────────────
function LoginPage({onLogin}){
  const [username,setUsername]=useState("");
  const [password,setPassword]=useState("");
  const [show,setShow]=useState(false);
  const [err,setErr]=useState("");
  const [loading,setLoading]=useState(false);
  const [fu,setFu]=useState(false);
  const [fp,setFp]=useState(false);
  const [w,setW]=useState(window.innerWidth);
  useEffect(()=>{const h=()=>setW(window.innerWidth);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h);},[]);
  const mob=w<900;
  const go=async()=>{
    if(!username||!password){setErr("Please enter both fields.");return;}
    setLoading(true);
    try{const res=await api.login(username,password);if(res.success)onLogin({username:res.username,role:res.role});else{setErr("Invalid credentials.");setLoading(false);}}
    catch{setErr("Cannot connect. Make sure Flask is running.");setLoading(false);}
  };
  const inp=(focus)=>({width:"100%",padding:"13px 16px",borderRadius:10,border:`1.5px solid ${focus?"#3b82f6":"#1e293b"}`,fontSize:14,color:"#f1f5f9",background:"#0f172a",boxSizing:"border-box",outline:"none",transition:"all .2s",boxShadow:focus?"0 0 0 3px #3b82f620":"none"});
  return(
    <div style={{minHeight:"100vh",display:"flex",flexDirection:mob?"column":"row",fontFamily:"'Segoe UI',system-ui,sans-serif",background:"#0f172a"}}>
      {!mob&&(
        <div style={{flex:"0 0 48%",background:"linear-gradient(160deg,#1e3a5f,#1e1b4b)",display:"flex",flexDirection:"column",justifyContent:"center",padding:"64px 60px",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",width:400,height:400,borderRadius:"50%",background:"rgba(59,130,246,.08)",top:"-80px",right:"-80px"}}/>
          <div style={{position:"absolute",width:300,height:300,borderRadius:"50%",background:"rgba(139,92,246,.06)",bottom:"-60px",left:"-40px"}}/>
          <div style={{position:"relative",zIndex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:64}}>
              <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(135deg,#3b82f6,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:18,color:"#fff"}}>ST</div>
              <div><div style={{fontSize:22,fontWeight:700,color:"#f1f5f9",lineHeight:1}}>StaffTrack</div><div style={{fontSize:12,color:"#64748b",marginTop:3}}>Staff Management System</div></div>
            </div>
            <h1 style={{fontSize:42,fontWeight:800,color:"#f1f5f9",lineHeight:1.1,margin:"0 0 18px",letterSpacing:"-1.5px"}}>Manage your<br/>team <span style={{color:"#60a5fa"}}>smarter.</span></h1>
            <p style={{color:"#64748b",fontSize:15,lineHeight:1.8,maxWidth:340,margin:"0 0 48px"}}>A clean, powerful portal to track staff, manage departments, and keep everything organised.</p>
            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              {[["👥","10 Staff Members across 8 departments"],["🔐","Role-based access control"],["📊","Real-time stats and filters"],["✏️","Full CRUD via REST API"]].map(([ico,t])=>(
                <div key={t} style={{display:"flex",alignItems:"center",gap:12}}>
                  <span style={{fontSize:18}}>{ico}</span>
                  <span style={{fontSize:14,color:"#94a3b8",fontWeight:500}}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      <div style={{flex:"0 0 52%",display:"flex",alignItems:"center",justifyContent:"center",padding:mob?"32px 20px":"48px 64px",background:"#0f172a"}}>
        <div style={{width:"100%",maxWidth:400}}>
          {mob&&<div style={{display:"flex",alignItems:"center",gap:12,marginBottom:32}}>
            <div style={{width:40,height:40,borderRadius:12,background:"linear-gradient(135deg,#3b82f6,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:16,color:"#fff"}}>ST</div>
            <div style={{fontSize:18,fontWeight:700,color:"#f1f5f9"}}>StaffTrack</div>
          </div>}
          <div style={{marginBottom:32}}>
            <h2 style={{fontSize:26,fontWeight:800,color:"#f1f5f9",margin:"0 0 8px",letterSpacing:"-.5px"}}>Sign in</h2>
            <p style={{color:"#64748b",fontSize:14,margin:0}}>Enter your credentials to continue</p>
          </div>
          <div style={{marginBottom:16}}>
            <label style={{display:"block",fontSize:12,fontWeight:600,color:"#94a3b8",marginBottom:7,textTransform:"uppercase",letterSpacing:".5px"}}>Username</label>
            <input value={username} onChange={e=>{setUsername(e.target.value);setErr("");}} onFocus={()=>setFu(true)} onBlur={()=>setFu(false)} onKeyDown={e=>e.key==="Enter"&&go()} placeholder="Enter username" style={inp(fu)}/>
          </div>
          <div style={{marginBottom:8}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:7}}>
              <label style={{fontSize:12,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".5px"}}>Password</label>
              <span style={{fontSize:12,color:"#3b82f6",fontWeight:500,cursor:"pointer"}}>Forgot password?</span>
            </div>
            <div style={{position:"relative"}}>
              <input type={show?"text":"password"} value={password} onChange={e=>{setPassword(e.target.value);setErr("");}} onFocus={()=>setFp(true)} onBlur={()=>setFp(false)} onKeyDown={e=>e.key==="Enter"&&go()} placeholder="Enter password" style={{...inp(fp),paddingRight:44}}/>
              <button onClick={()=>setShow(s=>!s)} style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:16,color:"#64748b",padding:2}}>{show?"🙈":"👁️"}</button>
            </div>
          </div>
          {err&&<div style={{background:"#450a0a",border:"1px solid #f8717133",borderRadius:10,padding:"11px 14px",marginTop:12,color:"#f87171",fontSize:13,fontWeight:500}}>⚠️ {err}</div>}
          <button onClick={go} disabled={loading} style={{width:"100%",padding:"14px",borderRadius:10,border:"none",background:loading?"#1e293b":"linear-gradient(135deg,#3b82f6,#8b5cf6)",color:loading?"#64748b":"#fff",fontSize:15,fontWeight:700,cursor:loading?"not-allowed":"pointer",boxShadow:loading?"none":"0 4px 20px #3b82f644",transition:"all .2s",display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginTop:22}}>
            {loading?<><Spinner/>Signing in...</>:"Sign in →"}
          </button>
          <div style={{marginTop:28,padding:"18px",background:"#1e293b",borderRadius:12,border:"1px solid #334155"}}>
            <div style={{fontSize:11,color:"#64748b",fontWeight:600,marginBottom:12,textTransform:"uppercase",letterSpacing:".5px"}}>Demo credentials</div>
            <div style={{display:"flex",gap:8}}>
              {[["admin","admin123","Full access"],["staff","staff123","View only"]].map(([u,p,r])=>(
                <button key={u} onClick={()=>{setUsername(u);setPassword(p);setErr("");}} style={{flex:1,padding:"10px 12px",borderRadius:8,border:"1px solid #334155",background:"#0f172a",cursor:"pointer",textAlign:"left"}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor="#3b82f6"} onMouseLeave={e=>e.currentTarget.style.borderColor="#334155"}>
                  <div style={{fontSize:12,fontWeight:700,color:"#f1f5f9"}}>{u} / {p}</div>
                  <div style={{fontSize:11,color:"#64748b",marginTop:2}}>{r}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box}`}</style>
    </div>
  );
}

// ── STAFF CARD WITH PROFILE PHOTO ─────────────────────────────────────────────
function StaffCard({m,onClick}){
  const [h,setH]=useState(false);
  const c=getColor(m);
  const [g1]=getGradient(m);
  return(
    <div onClick={()=>onClick(m)} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{background:h?"#1e293b":"#172033",borderRadius:16,overflow:"hidden",cursor:"pointer",
        border:`1px solid ${h?g1+"55":"#1e293b"}`,
        boxShadow:h?`0 12px 32px rgba(0,0,0,.4),0 0 0 1px ${g1}22`:"0 2px 8px rgba(0,0,0,.3)",
        transition:"all .25s",transform:h?"translateY(-3px)":"none"}}>

      {/* Profile photo section */}
      <div style={{background:`linear-gradient(135deg,#0f172a,#1e293b)`,padding:"24px 20px 16px",display:"flex",flexDirection:"column",alignItems:"center",position:"relative",overflow:"hidden"}}>
        {/* Background pattern */}
        <div style={{position:"absolute",width:120,height:120,borderRadius:"50%",background:`${g1}12`,top:"-30px",right:"-20px"}}/>
        <div style={{position:"absolute",width:80,height:80,borderRadius:"50%",background:`${g1}08`,bottom:"-20px",left:"-10px"}}/>

        {/* Big profile photo */}
        <ProfilePhoto m={m} size={76}/>

        {/* Name & role */}
        <div style={{marginTop:14,textAlign:"center"}}>
          <div style={{fontWeight:700,fontSize:15,color:"#f1f5f9",marginBottom:3}}>{m.first_name} {m.last_name}</div>
          <div style={{color:"#64748b",fontSize:12}}>{m.job_title}</div>
        </div>
      </div>

      {/* Info section */}
      <div style={{padding:"14px 16px 16px",borderTop:`1px solid #1e293b`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <Badge label={m.department} color={c}/>
          <StatusPill status={m.status}/>
        </div>
        <div style={{fontSize:10,color:"#334155",fontFamily:"monospace",fontWeight:600,textAlign:"right"}}>{m.id}</div>
      </div>
    </div>
  );
}

// ── MODALS ────────────────────────────────────────────────────────────────────
function Overlay({onClose,children}){
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",backdropFilter:"blur(6px)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#1e293b",border:"1px solid #334155",borderRadius:20,width:"100%",maxWidth:500,boxShadow:"0 32px 80px rgba(0,0,0,.6)",overflow:"hidden",maxHeight:"95vh",overflowY:"auto"}}>{children}</div>
    </div>
  );
}

function ProfileModal({m,onClose,onEdit,isAdmin}){
  const c=getColor(m);
  const [g1,g2]=getGradient(m);
  return(
    <Overlay onClose={onClose}>
      <div style={{background:`linear-gradient(135deg,#0f172a,#1e293b)`,padding:"28px",display:"flex",flexDirection:"column",alignItems:"center",gap:0,borderBottom:"1px solid #334155",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",width:200,height:200,borderRadius:"50%",background:`${g1}15`,top:"-60px",right:"-40px"}}/>
        <ProfilePhoto m={m} size={90}/>
        <div style={{marginTop:16,textAlign:"center"}}>
          <div style={{fontWeight:800,fontSize:20,color:"#f1f5f9"}}>{m.first_name} {m.last_name}</div>
          <div style={{color:"#64748b",fontSize:14,marginTop:4}}>{m.job_title}</div>
          <div style={{marginTop:12,display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
            <Badge label={m.department} color={c}/>
            <StatusPill status={m.status}/>
          </div>
        </div>
        <button onClick={onClose} style={{position:"absolute",top:16,right:16,background:"#334155",border:"none",color:"#94a3b8",width:30,height:30,borderRadius:"50%",cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
      </div>
      <div style={{padding:24}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {[["📧 Email",m.email],["📱 Phone",m.phone||"—"],["📍 Location",m.location||"—"],["🆔 Staff ID",m.id],["🏢 Department",m.department],["📅 Joined",m.date_joined?new Date(m.date_joined).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}):"—"]].map(([l,v])=>(
            <div key={l} style={{padding:"12px 14px",background:"#0f172a",borderRadius:10,border:"1px solid #1e293b"}}>
              <div style={{fontSize:10,color:"#64748b",fontWeight:600,marginBottom:4,textTransform:"uppercase",letterSpacing:".4px"}}>{l}</div>
              <div style={{fontSize:13,color:"#e2e8f0",fontWeight:600,wordBreak:"break-all"}}>{v||"—"}</div>
            </div>
          ))}
        </div>
        {isAdmin&&<div style={{marginTop:20,display:"flex",gap:10,justifyContent:"flex-end"}}>
          <button onClick={onClose} style={{padding:"9px 20px",borderRadius:8,border:"1px solid #334155",background:"transparent",color:"#94a3b8",cursor:"pointer",fontWeight:600,fontSize:13}}>Close</button>
          <button onClick={()=>{onClose();onEdit(m);}} style={{padding:"9px 20px",borderRadius:8,border:"none",background:"linear-gradient(135deg,#3b82f6,#8b5cf6)",color:"#fff",cursor:"pointer",fontWeight:600,fontSize:13}}>Edit Profile</button>
        </div>}
      </div>
    </Overlay>
  );
}

function EditModal({m,onClose,onSave,saving}){
  const [f,setF]=useState(m?{...m}:{first_name:"",last_name:"",email:"",phone:"",job_title:"",department:"Engineering",status:"Active",location:"",date_joined:new Date().toISOString().slice(0,10)});
  const [preview,setPreview]=useState(m?getPhoto(m.id):null);
  const fileRef=useRef();
  const set=(k,v)=>setF(p=>({...p,[k]:v}));

  const handlePhoto=(e)=>{
    const file=e.target.files[0];
    if(!file)return;
    if(file.size>5*1024*1024){alert("Photo must be under 5MB");return;}
    const reader=new FileReader();
    reader.onload=(ev)=>setPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSave=()=>{
    if(preview&&m&&m.id) savePhoto(m.id,preview);
    else if(preview&&!m?.id){
      // For new staff, save after creation by passing photo in form
      f._photo=preview;
    }
    onSave(f,preview);
  };

  const inp={width:"100%",padding:"10px 12px",border:"1px solid #334155",borderRadius:8,fontSize:13,color:"#e2e8f0",background:"#0f172a",boxSizing:"border-box",outline:"none",transition:"border .15s"};
  const [g1,g2]=m?getGradient(m):["#3b82f6","#8b5cf6"];

  return(
    <Overlay onClose={onClose}>
      <div style={{padding:"20px 24px",borderBottom:"1px solid #334155",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:"#1e293b",zIndex:1}}>
        <h3 style={{margin:0,fontSize:16,fontWeight:700,color:"#f1f5f9"}}>{m?"Edit Staff Member":"Add New Staff Member"}</h3>
        <button onClick={onClose} style={{background:"#334155",border:"none",cursor:"pointer",fontSize:16,color:"#94a3b8",width:28,height:28,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
      </div>
      <div style={{padding:22}}>

        {/* PHOTO UPLOAD SECTION */}
        <div style={{display:"flex",alignItems:"center",gap:20,marginBottom:24,padding:"18px",background:"#0f172a",borderRadius:14,border:"1px solid #334155"}}>
          {/* Current photo preview */}
          <div style={{position:"relative",flexShrink:0}}>
            {preview?(
              <img src={preview} alt="Profile" style={{width:80,height:80,borderRadius:"50%",objectFit:"cover",border:"3px solid #3b82f6",boxShadow:"0 4px 16px #3b82f644"}}/>
            ):(
              <div style={{width:80,height:80,borderRadius:"50%",background:`linear-gradient(135deg,${g1},${g2})`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:28,border:"3px solid #334155"}}>
                {m?ini(m):"?"}
              </div>
            )}
            {/* Camera icon overlay */}
            <button onClick={()=>fileRef.current.click()} style={{position:"absolute",bottom:0,right:0,width:26,height:26,borderRadius:"50%",background:"#3b82f6",border:"2px solid #1e293b",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:12}}>📷</button>
          </div>
          <div>
            <div style={{fontSize:14,fontWeight:700,color:"#f1f5f9",marginBottom:6}}>Profile Photo</div>
            <div style={{fontSize:12,color:"#64748b",marginBottom:12}}>Upload a photo for this staff member</div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>fileRef.current.click()} style={{padding:"7px 16px",borderRadius:8,border:"1px solid #3b82f6",background:"transparent",color:"#3b82f6",fontSize:12,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
                📤 Upload Photo
              </button>
              {preview&&<button onClick={()=>setPreview(null)} style={{padding:"7px 14px",borderRadius:8,border:"1px solid #334155",background:"transparent",color:"#f87171",fontSize:12,fontWeight:600,cursor:"pointer"}}>Remove</button>}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{display:"none"}}/>
            <div style={{fontSize:10,color:"#475569",marginTop:8}}>JPG, PNG, GIF — max 5MB</div>
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          {[["first_name","First Name"],["last_name","Last Name"],["phone","Phone"],["job_title","Job Title"],["location","Location"],["date_joined","Date Joined"]].map(([k,l])=>(
            <div key={k} style={k==="location"?{gridColumn:"1/-1"}:{}}>
              <label style={{display:"block",fontSize:11,fontWeight:600,color:"#94a3b8",marginBottom:5,textTransform:"uppercase",letterSpacing:".4px"}}>{l}</label>
              <input type={k==="date_joined"?"date":"text"} value={f[k]||""} onChange={e=>set(k,e.target.value)} style={inp} onFocus={e=>e.target.style.borderColor="#3b82f6"} onBlur={e=>e.target.style.borderColor="#334155"}/>
            </div>
          ))}
          <div style={{gridColumn:"1/-1"}}>
            <label style={{display:"block",fontSize:11,fontWeight:600,color:"#94a3b8",marginBottom:5,textTransform:"uppercase",letterSpacing:".4px"}}>Email</label>
            <input value={f.email||""} onChange={e=>set("email",e.target.value)} style={inp} onFocus={e=>e.target.style.borderColor="#3b82f6"} onBlur={e=>e.target.style.borderColor="#334155"}/>
          </div>
          <div>
            <label style={{display:"block",fontSize:11,fontWeight:600,color:"#94a3b8",marginBottom:5,textTransform:"uppercase",letterSpacing:".4px"}}>Department</label>
            <select value={f.department} onChange={e=>set("department",e.target.value)} style={{...inp,cursor:"pointer"}}>
              {["Engineering","Design","Marketing","HR","Finance","Sales","Product","Analytics"].map(d=><option key={d} style={{background:"#1e293b"}}>{d}</option>)}
            </select>
          </div>
          <div>
            <label style={{display:"block",fontSize:11,fontWeight:600,color:"#94a3b8",marginBottom:5,textTransform:"uppercase",letterSpacing:".4px"}}>Status</label>
            <select value={f.status} onChange={e=>set("status",e.target.value)} style={{...inp,cursor:"pointer"}}>
              {["Active","On Leave","Inactive"].map(s=><option key={s} style={{background:"#1e293b"}}>{s}</option>)}
            </select>
          </div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:22,justifyContent:"flex-end"}}>
          <button onClick={onClose} style={{padding:"9px 20px",borderRadius:8,border:"1px solid #334155",background:"transparent",color:"#94a3b8",cursor:"pointer",fontWeight:600,fontSize:13}}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{padding:"9px 20px",borderRadius:8,border:"none",background:"linear-gradient(135deg,#3b82f6,#8b5cf6)",color:"#fff",cursor:saving?"not-allowed":"pointer",fontWeight:600,fontSize:13,display:"flex",alignItems:"center",gap:8}}>
            {saving?<><Spinner size={14}/>Saving...</>:"Save Changes"}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App(){
  const [user,setUser]=useState(null);
  const [staff,setStaff]=useState([]);
  const [loading,setLoading]=useState(false);
  const [saving,setSaving]=useState(false);
  const [tab,setTab]=useState("Staff List");
  const [search,setSearch]=useState("");
  const [dept,setDept]=useState("All");
  const [status,setStatus]=useState("All");
  const [viewMode,setViewMode]=useState("grid");
  const [profile,setProfile]=useState(null);
  const [editing,setEditing]=useState(null);
  const [toast,setToast]=useState(null);
  const [w,setW]=useState(window.innerWidth);
  useEffect(()=>{const h=()=>setW(window.innerWidth);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h);},[]);
  const mob=w<768;

  const showToast=(msg,type="success")=>{setToast({msg,type});setTimeout(()=>setToast(null),3000);};
  const fetchStaff=useCallback(async()=>{
    setLoading(true);
    try{const d=await api.getStaff({department:dept,status,q:search});setStaff(Array.isArray(d)?d:[]);}
    catch{showToast("Failed to load staff.","error");}
    setLoading(false);
  },[dept,status,search]);
  useEffect(()=>{if(user)fetchStaff();},[user,fetchStaff]);

  const saveStaff=async(f,photo)=>{
    setSaving(true);
    try{
      if(editing&&editing.id){
        await api.updateStaff(editing.id,f);
        if(photo) savePhoto(editing.id,photo);
        showToast("Staff updated!");
      }else{
        const newStaff=await api.createStaff(f);
        if(photo&&newStaff&&newStaff.id) savePhoto(newStaff.id,photo);
        showToast("Staff member added!");
      }
      setEditing(null);fetchStaff();
    }catch{showToast("Failed to save.","error");}
    setSaving(false);
  };

  const del=async(id)=>{
    if(!window.confirm("Delete this staff member?"))return;
    try{await api.deleteStaff(id);showToast("Removed.");fetchStaff();}
    catch{showToast("Failed to delete.","error");}
  };

  if(!user)return <LoginPage onLogin={setUser}/>;
  const isAdmin=user.role==="Admin";

  const stats=[
    {label:"Total Staff",value:staff.length,color:"#60a5fa",icon:"👥"},
    {label:"Active",value:staff.filter(s=>s.status==="Active").length,color:"#4ade80",icon:"✅"},
    {label:"On Leave",value:staff.filter(s=>s.status==="On Leave").length,color:"#fb923c",icon:"🏖️"},
    {label:"Inactive",value:staff.filter(s=>s.status==="Inactive").length,color:"#f87171",icon:"⏸️"},
    {label:"Departments",value:new Set(staff.map(s=>s.department)).size,color:"#a78bfa",icon:"🏢"},
  ];

  const TableView=({data})=>(
    <div style={{background:"#1e293b",borderRadius:14,border:"1px solid #334155",overflow:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse",minWidth:600}}>
        <thead><tr style={{borderBottom:"1px solid #334155",background:"#172033"}}>
          {["Employee","ID","Department","Role","Status","Actions"].map(h=>(
            <th key={h} style={{padding:"13px 16px",textAlign:"left",fontSize:10,fontWeight:700,color:"#64748b",letterSpacing:".6px",textTransform:"uppercase"}}>{h}</th>
          ))}
        </tr></thead>
        <tbody>{data.map(m=>(
          <tr key={m.id} style={{borderBottom:"1px solid #1e293b",transition:"background .15s"}}
            onMouseEnter={e=>e.currentTarget.style.background="#172033"}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <td style={{padding:"13px 16px"}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <Avatar m={m} size={38}/>
                <div><div style={{fontWeight:600,fontSize:13,color:"#e2e8f0"}}>{m.first_name} {m.last_name}</div><div style={{fontSize:11,color:"#64748b",marginTop:1}}>{m.email}</div></div>
              </div>
            </td>
            <td style={{padding:"13px 16px"}}><span style={{fontSize:11,color:"#64748b",fontFamily:"monospace",background:"#0f172a",padding:"3px 8px",borderRadius:5}}>{m.id}</span></td>
            <td style={{padding:"13px 16px"}}><Badge label={m.department} color={DEPT_COLORS[m.department]||"#6366f1"}/></td>
            <td style={{padding:"13px 16px",fontSize:13,color:"#94a3b8"}}>{m.job_title}</td>
            <td style={{padding:"13px 16px"}}><StatusPill status={m.status}/></td>
            <td style={{padding:"13px 16px"}}>
              <div style={{display:"flex",gap:6}}>
                <button onClick={()=>setProfile(m)} style={{padding:"5px 12px",borderRadius:6,border:"1px solid #334155",background:"transparent",color:"#94a3b8",fontSize:12,fontWeight:600,cursor:"pointer"}}>View</button>
                {isAdmin&&<>
                  <button onClick={()=>setEditing(m)} style={{padding:"5px 12px",borderRadius:6,border:"1px solid #334155",background:"transparent",color:"#94a3b8",fontSize:12,fontWeight:600,cursor:"pointer"}}>Edit</button>
                  <button onClick={()=>del(m.id)} style={{padding:"5px 12px",borderRadius:6,border:"1px solid #f8717133",background:"transparent",color:"#f87171",fontSize:12,fontWeight:600,cursor:"pointer"}}>Remove</button>
                </>}
              </div>
            </td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );

  return(
    <div style={{fontFamily:"'Segoe UI',system-ui,sans-serif",background:"#0f172a",minHeight:"100vh",color:"#e2e8f0"}}>
      {toast&&<Toast msg={toast.msg} type={toast.type}/>}

      {/* NAVBAR */}
      <nav style={{background:"#1e293b",borderBottom:"1px solid #334155",padding:`0 ${mob?"16px":"32px"}`,display:"flex",alignItems:"center",gap:8,height:60,position:"sticky",top:0,zIndex:50,boxShadow:"0 1px 20px rgba(0,0,0,.4)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginRight:mob?8:24}}>
          <div style={{width:32,height:32,borderRadius:8,background:"linear-gradient(135deg,#3b82f6,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:13}}>ST</div>
          {!mob&&<span style={{fontWeight:700,fontSize:16,color:"#f1f5f9"}}>StaffTrack</span>}
          <span style={{background:"#052e16",color:"#4ade80",border:"1px solid #4ade8033",borderRadius:20,padding:"2px 8px",fontSize:10,fontWeight:700}}>● Live</span>
        </div>
        <div style={{display:"flex",gap:2}}>
          {["Staff List",isAdmin?"Admin Panel":null].filter(Boolean).map(t=>(
            <button key={t} onClick={()=>setTab(t)}
              style={{padding:"6px 14px",borderRadius:7,border:"none",
                background:tab===t?"#172033":"transparent",
                color:tab===t?"#60a5fa":"#64748b",
                fontWeight:tab===t?700:500,fontSize:13,cursor:"pointer",transition:"all .15s",
                borderBottom:tab===t?"2px solid #3b82f6":"2px solid transparent"}}>
              {mob?(t==="Staff List"?"Staff":"Admin"):t}
            </button>
          ))}
        </div>
        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8}}>
          <button onClick={fetchStaff} style={{padding:"6px 12px",borderRadius:7,background:"#334155",color:"#94a3b8",border:"none",fontWeight:600,fontSize:12,cursor:"pointer"}}>↻</button>
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"4px 12px 4px 4px",background:"#334155",borderRadius:24}}>
            <div style={{width:28,height:28,borderRadius:"50%",background:"linear-gradient(135deg,#3b82f6,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:12}}>{user.username[0].toUpperCase()}</div>
            {!mob&&<div><div style={{fontSize:12,fontWeight:700,color:"#f1f5f9",lineHeight:1.2}}>{user.username}</div><div style={{fontSize:10,color:"#64748b"}}>{user.role}</div></div>}
          </div>
          <button onClick={()=>setUser(null)} style={{padding:"6px 14px",borderRadius:7,background:"transparent",color:"#f87171",border:"1px solid #f8717133",fontWeight:600,fontSize:12,cursor:"pointer"}}>Sign out</button>
        </div>
      </nav>

      <div style={{maxWidth:1280,margin:"0 auto",padding:`28px ${mob?"16px":"32px"}`}}>

        {tab==="Staff List"&&(
          <>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:28,flexWrap:"wrap",gap:16}}>
              <div>
                <h1 style={{fontSize:mob?20:24,fontWeight:800,color:"#f1f5f9",margin:"0 0 4px",letterSpacing:"-.5px"}}>Staff Directory</h1>
                <p style={{color:"#64748b",margin:0,fontSize:13}}>{loading?"Loading...":` ${staff.length} employees · ${new Set(staff.map(s=>s.department)).size} departments`}</p>
              </div>
              {isAdmin&&<button onClick={()=>setEditing(false)} style={{padding:"10px 20px",borderRadius:9,border:"none",background:"linear-gradient(135deg,#3b82f6,#8b5cf6)",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",boxShadow:"0 4px 16px #3b82f644",display:"flex",alignItems:"center",gap:8}}>
                + Add Employee
              </button>}
            </div>

            {/* Stats */}
            <div style={{display:"grid",gridTemplateColumns:mob?"repeat(3,1fr)":"repeat(5,1fr)",gap:12,marginBottom:24}}>
              {stats.map(s=>(
                <div key={s.label} style={{background:"#1e293b",border:"1px solid #334155",borderRadius:14,padding:"18px 16px",display:"flex",alignItems:"center",gap:12}}>
                  <span style={{fontSize:22}}>{s.icon}</span>
                  <div><div style={{fontSize:24,fontWeight:800,color:s.color,lineHeight:1}}>{s.value}</div><div style={{fontSize:11,color:"#64748b",marginTop:3}}>{s.label}</div></div>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div style={{display:"flex",gap:10,marginBottom:24,flexWrap:"wrap",alignItems:"center",background:"#1e293b",padding:"12px 16px",borderRadius:14,border:"1px solid #334155"}}>
              <div style={{flex:1,minWidth:180,position:"relative"}}>
                <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"#64748b",fontSize:14}}>🔍</span>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name, role or ID..."
                  style={{width:"100%",padding:"9px 12px 9px 36px",borderRadius:9,border:"1px solid #334155",fontSize:13,background:"#0f172a",boxSizing:"border-box",outline:"none",color:"#e2e8f0"}}
                  onFocus={e=>e.target.style.borderColor="#3b82f6"} onBlur={e=>e.target.style.borderColor="#334155"}/>
              </div>
              {!mob&&<>
                <select value={dept} onChange={e=>setDept(e.target.value)} style={{padding:"9px 12px",borderRadius:9,border:"1px solid #334155",fontSize:13,color:"#94a3b8",background:"#0f172a",outline:"none",cursor:"pointer"}}>
                  {DEPTS.map(d=><option key={d} style={{background:"#1e293b"}}>{d==="All"?"All Departments":d}</option>)}
                </select>
                <select value={status} onChange={e=>setStatus(e.target.value)} style={{padding:"9px 12px",borderRadius:9,border:"1px solid #334155",fontSize:13,color:"#94a3b8",background:"#0f172a",outline:"none",cursor:"pointer"}}>
                  {STATUSES.map(s=><option key={s} style={{background:"#1e293b"}}>{s==="All"?"All Status":s}</option>)}
                </select>
              </>}
              <div style={{display:"flex",gap:1,background:"#0f172a",borderRadius:8,padding:3,border:"1px solid #334155"}}>
                {[["⊞","grid"],["≡","list"]].map(([ico,m])=>(
                  <button key={m} onClick={()=>setViewMode(m)} style={{padding:"6px 12px",borderRadius:6,border:"none",background:viewMode===m?"#334155":"transparent",fontSize:14,cursor:"pointer",color:viewMode===m?"#60a5fa":"#64748b",transition:"all .15s"}}>{ico}</button>
                ))}
              </div>
            </div>

            {loading?(
              <div style={{textAlign:"center",padding:"80px 20px"}}><Spinner size={36} color="#3b82f6"/><div style={{marginTop:14,fontSize:14,color:"#64748b"}}>Loading employees...</div></div>
            ):viewMode==="grid"?(
              <div style={{display:"grid",gridTemplateColumns:mob?"repeat(2,1fr)":"repeat(auto-fill,minmax(200px,1fr))",gap:14}}>
                {staff.map(m=><StaffCard key={m.id} m={m} onClick={setProfile}/>)}
              </div>
            ):(
              <TableView data={staff}/>
            )}

            {!loading&&staff.length===0&&(
              <div style={{textAlign:"center",padding:"80px 20px",background:"#1e293b",borderRadius:16,border:"1px solid #334155"}}>
                <div style={{fontSize:40,marginBottom:12}}>🔍</div>
                <div style={{fontSize:16,fontWeight:700,color:"#94a3b8",marginBottom:6}}>No employees found</div>
                <div style={{fontSize:13,color:"#64748b"}}>Try adjusting your search or filters</div>
              </div>
            )}
          </>
        )}

        {tab==="Admin Panel"&&isAdmin&&(
          <>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24,flexWrap:"wrap",gap:16}}>
              <div><h1 style={{fontSize:mob?20:24,fontWeight:800,color:"#f1f5f9",margin:"0 0 4px"}}>Admin Panel</h1><p style={{color:"#64748b",margin:0,fontSize:13}}>Manage employee records</p></div>
              <button onClick={()=>setEditing(false)} style={{padding:"10px 20px",borderRadius:9,border:"none",background:"linear-gradient(135deg,#3b82f6,#8b5cf6)",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",boxShadow:"0 4px 16px #3b82f644"}}>+ Add Employee</button>
            </div>
            <TableView data={staff}/>
          </>
        )}
      </div>

      {profile&&<ProfileModal m={profile} isAdmin={isAdmin} onClose={()=>setProfile(null)} onEdit={m=>{setProfile(null);setEditing(m);}}/>}
      {editing!==null&&<EditModal m={editing||null} onClose={()=>setEditing(null)} onSave={saveStaff} saving={saving}/>}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box}`}</style>
    </div>
  );
}
   