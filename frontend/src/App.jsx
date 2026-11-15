import React,{useState} from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminData from './pages/AdminData';
import Workspace from './pages/Workspace';

const navigation=[
 ['overview','Overview','◫'],['students','Students','♙'],['teachers','Teachers','♧'],
 ['courses','Courses','▤'],['branches','Branches','⌘'],['subjects','Subjects','▣'],
 ['offerings','Subject offerings','▥'],['rooms','Examination rooms','⌂'],['sessions','Exam sessions','▦']
];
export default function App(){
 const [user,setUser]=useState(()=>{try{return JSON.parse(localStorage.getItem('examflow_user')||'null')}catch{return null}});
 const [page,setPage]=useState('overview');
 function login(u){localStorage.setItem('examflow_user',JSON.stringify(u));setUser(u);setPage('overview');}
 function logout(){localStorage.removeItem('examflow_user');setUser(null);}
 if(!user)return <Login onLogin={login}/>;
 return <div className="app-shell">
  <aside className="sidebar">
   <div className="brand-lockup"><span className="brand-mark">E</span><div><b>ExamFlow</b><small>UNIVERSITY EXAM MANAGEMENT</small></div></div>
   <div className="side-section-label">WORKSPACE</div>
   {user.role==='ADMIN'?<>
    <div className="side-section-label">ADMINISTRATION</div>
    <nav className="side-nav">{navigation.map(([id,label,icon])=><button key={id} className={page===id?'active':''} onClick={()=>setPage(id)}><span className="nav-icon">{icon}</span>{label}{id==='teachers'&&<i>•</i>}</button>)}</nav>
   </>:<nav className="side-nav"><button className="active"><span className="nav-icon">◫</span>My workspace</button></nav>}
   <div className="sidebar-bottom"><div className="sidebar-user"><span className="avatar">{user.name?.[0]||'U'}</span><div><b>{user.name}</b><small>{user.role}</small></div></div><button className="signout" onClick={logout}>Sign out <span>↗</span></button><small className="version">EXAMFLOW · LOCAL EDITION</small></div>
  </aside>
  <main className="main-area">
   <header className="topbar"><div><span className="live-dot"/> System workspace <span className="topbar-separator">/</span> {user.role.toLowerCase()} portal</div><div className="topbar-right"><span className="topbar-date">Academic session 2026–27</span><span className="top-avatar">{user.name?.[0]||'U'}</span></div></header>
   <div className="page-content">{user.role==='ADMIN'?(page==='overview'?<Dashboard/>:<AdminData section={page}/>):<Workspace user={user}/>}</div>
  </main>
 </div>;
}
