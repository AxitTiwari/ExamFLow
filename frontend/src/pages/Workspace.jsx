import React,{useEffect,useState} from 'react';
import {api} from '../services/api';
import Panel from '../components/Panel';

export default function Workspace({user}){
 const isStudent=user.role==='STUDENT';
 const [profile,setProfile]=useState(null),[offerings,setOfferings]=useState([]),[availability,setAvailability]=useState([]),[timetable,setTimetable]=useState([]);
 const [error,setError]=useState(''),[notice,setNotice]=useState('');
 const [form,setForm]=useState({available_date:'2026-12-01',start_time:'09:00',end_time:'17:00'});
 async function load(){
  try{
   if(isStudent){
    const [p,o,t]=await Promise.all([api(`/student/${user.id}/profile`),api(`/student/${user.id}/offerings`),api(`/student/${user.id}/timetable`)]);
    setProfile(p);setOfferings(o.offerings||[]);setTimetable(t.timetable||[]);
   }else{
    const [p,a,t]=await Promise.all([api(`/teacher/${user.id}/profile`),api(`/teacher/${user.id}/availability`),api(`/teacher/${user.id}/timetable`)]);
    setProfile(p);setAvailability(a.availability||[]);setTimetable(t.timetable||[]);
   }
   setError('');
  }catch(e){setError(e.message);}
 }
 useEffect(()=>{load();},[user.id]);
 async function enroll(id){try{const r=await api(`/student/${user.id}/enrollments`,{method:'POST',body:JSON.stringify({offering_id:id})});setNotice(r.message);await load();}catch(e){setError(e.message);}}
 async function submitAvailability(e){e.preventDefault();try{const r=await api(`/teacher/${user.id}/availability`,{method:'POST',body:JSON.stringify(form)});setNotice(r.message);await load();}catch(e){setError(e.message);}}
 const pending=user.status==='PENDING';
 return <>
  <header className="page-heading"><div><div className="eyebrow">{isStudent?'STUDENT PORTAL':'TEACHER PORTAL'}</div><h1>Welcome, {user.name}</h1><p>{isStudent?'Your academic information and examination timetable.':'Manage your availability and invigilation duties.'}</p></div><button className="outline-button" onClick={load}>↻ &nbsp; Refresh</button></header>
  {error&&<div className="alert alert-error">{error}</div>}{notice&&<div className="alert alert-success">{notice}</div>}
  {pending&&!isStudent&&<div className="alert alert-warning">Your teacher registration is pending administrator approval. Availability submission will be available after approval.</div>}
  <div className="workspace-grid">
   <Panel title={isStudent?'Academic profile':'Teacher profile'}>
    {profile&&<div className="profile-grid">{Object.entries(profile).filter(([k])=>!['id','user_id'].includes(k)).map(([k,v])=><div key={k}><small>{k.replaceAll('_',' ')}</small><b>{String(v??'—')}</b></div>)}</div>}
   </Panel>
   {isStudent?<Panel title="Subject enrollment"><div className="table-wrap"><table><thead><tr><th>Subject</th><th>Credits</th><th>Semester</th><th>Enrollment</th><th></th></tr></thead><tbody>{offerings.map(o=><tr key={o.offering_id}><td><b>{o.code}</b> · {o.name}</td><td>{o.credits}</td><td>{o.semester}</td><td>{o.enrolled?<span className="pill active">Enrolled</span>:<span className="pill pending">Available</span>}</td><td>{!o.enrolled&&<button className="mini-approve" onClick={()=>enroll(o.offering_id)}>Enroll</button>}</td></tr>)}</tbody></table></div></Panel>:
   <Panel title="Submit availability"><form className="record-form three-cols" onSubmit={submitAvailability}><label>Date<input type="date" required value={form.available_date} onChange={e=>setForm({...form,available_date:e.target.value})}/></label><label>Available from<input type="time" required value={form.start_time} onChange={e=>setForm({...form,start_time:e.target.value})}/></label><label>Available until<input type="time" required value={form.end_time} onChange={e=>setForm({...form,end_time:e.target.value})}/></label><button className="primary-button" disabled={pending}>Save availability</button></form><div className="table-wrap compact-table"><table><thead><tr><th>Date</th><th>From</th><th>Until</th><th>Status</th></tr></thead><tbody>{availability.map(a=><tr key={a.id}><td>{String(a.available_date).slice(0,10)}</td><td>{String(a.start_time).slice(0,5)}</td><td>{String(a.end_time).slice(0,5)}</td><td>{a.is_available?'Available':'Unavailable'}</td></tr>)}</tbody></table></div></Panel>}
  </div>
  <Panel title={isStudent?'Published examination timetable':'Published invigilation duties'}>
   {timetable.length?<div className="table-wrap"><table><thead><tr><th>Date</th><th>Time</th><th>Subject</th><th>Room</th><th>Building</th>{isStudent&&<th>Invigilator</th>}</tr></thead><tbody>{timetable.map((x,i)=><tr key={i}><td>{String(x.exam_date).slice(0,10)}</td><td>{String(x.start_time).slice(0,5)} – {String(x.end_time).slice(0,5)}</td><td><b>{x.subject_code}</b> · {x.subject_name}</td><td>{x.room_code}</td><td>{x.building}</td>{isStudent&&<td>{x.invigilator}</td>}</tr>)}</tbody></table></div>:<div className="empty-state"><span>▦</span><b>No published timetable yet</b><small>Your examination details will appear here after the administrator publishes the schedule.</small></div>}
  </Panel>
 </>;
}
