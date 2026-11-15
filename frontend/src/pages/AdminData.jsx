import React,{useEffect,useState} from 'react';
import {api} from '../services/api';
import Panel from '../components/Panel';

const config={
 students:{title:'Registered students',url:'/admin/students',key:'students'},
 teachers:{title:'Teacher management',url:'/admin/teachers',key:'teachers'},
 courses:{title:'Courses',url:'/admin/courses',key:'courses'},
 branches:{title:'Branches',url:'/admin/branches',key:'branches'},
 subjects:{title:'Subjects',url:'/admin/subjects',key:'subjects'},
 offerings:{title:'Subject offerings',url:'/admin/offerings',key:'offerings'},
 rooms:{title:'Examination rooms',url:'/admin/rooms',key:'rooms'}
};

const blank={
 courses:{code:'',name:''},
 branches:{course_id:'',code:'',name:''},
 subjects:{code:'',name:'',credits:3},
 offerings:{subject_id:'',course_id:'',branch_id:'',academic_year:3,semester:5,academic_session:'2026-27'},
 rooms:{room_code:'',building:'',capacity:60,room_type:'CLASSROOM'}
};
const fields={
 courses:[['code','Course code'],['name','Course name']],
 branches:[['course_id','Course'],['code','Branch code'],['name','Branch name']],
 subjects:[['code','Subject code'],['name','Subject name'],['credits','Credits']],
 offerings:[['subject_id','Subject'],['course_id','Course'],['branch_id','Branch'],['academic_year','Academic year'],['semester','Semester'],['academic_session','Academic session']],
 rooms:[['room_code','Room code'],['building','Building'],['capacity','Capacity'],['room_type','Room type']]
};

function RecordsPage({section}){
 const c=config[section];const [rows,setRows]=useState([]);const [refs,setRefs]=useState({courses:[],branches:[],subjects:[]});
 const [form,setForm]=useState(blank[section]);const [error,setError]=useState('');const [notice,setNotice]=useState('');const [busy,setBusy]=useState(false);
 async function load(){
  try{const r=await api(c.url);setRows(r[c.key]||[]);setError('');
   if(['branches','offerings'].includes(section)){const [a,b]=await Promise.all([api('/admin/courses'),api('/admin/subjects')]);setRefs(old=>({...old,courses:a.courses||[],subjects:b.subjects||[]}));}
   if(section==='offerings'){const br=await api('/admin/branches');setRefs(old=>({...old,branches:br.branches||[]}));}
  }catch(e){setError(e.message);}
 }
 useEffect(()=>{load();},[section]);
 async function create(e){e.preventDefault();setBusy(true);setError('');setNotice('');
  try{const b={...form};for(const k of Object.keys(b)){if(['course_id','branch_id','subject_id','academic_year','semester','credits','capacity'].includes(k))b[k]=Number(b[k]);}
   await api(c.url,{method:'POST',body:JSON.stringify(b)});setNotice(`${c.title.slice(0,-1)||'Record'} created successfully.`);setForm(blank[section]);await load();
  }catch(e){setError(e.message);}finally{setBusy(false);}
 }
 const rowsColumns=rows.length?Object.keys(rows[0]):[];
 function inputFor(key,label){
  if(key==='course_id')return <select required value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})}><option value="">Select course</option>{refs.courses.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select>;
  if(key==='branch_id')return <select required value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})}><option value="">Select branch</option>{refs.branches.filter(x=>!form.course_id||String(x.course_id)===String(form.course_id)).map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select>;
  if(key==='subject_id')return <select required value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})}><option value="">Select subject</option>{refs.subjects.map(x=><option key={x.id} value={x.id}>{x.code} — {x.name}</option>)}</select>;
  if(key==='academic_year'||key==='semester'||key==='credits'||key==='capacity')return <input required type="number" min="1" value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})}/>;
  return <input required={key!=='building'} value={form[key]??''} onChange={e=>setForm({...form,[key]:e.target.value})}/>;
 }
 return <>
  <header className="page-heading"><div><div className="eyebrow">ACADEMIC MANAGEMENT</div><h1>{c.title}</h1><p>Manage {c.title.toLowerCase()} in the ExamFlow database.</p></div><button className="outline-button" onClick={load}>↻ &nbsp; Refresh</button></header>
  {error&&<div className="alert alert-error">{error}</div>}{notice&&<div className="alert alert-success">{notice}</div>}
  {fields[section]&&<Panel title={`Add ${c.title.replace(/s$/,'').toLowerCase()}`}><form className="record-form" onSubmit={create}>{fields[section].map(([key,label])=><label key={key}>{label}{inputFor(key,label)}</label>)}<button className="primary-button" disabled={busy}>{busy?'Saving…':'Save record'}</button></form></Panel>}
  <Panel title={`${c.title} · ${rows.length}`}><div className="table-wrap">{rows.length?<table><thead><tr>{rowsColumns.map(k=><th key={k}>{k.replaceAll('_',' ')}</th>)}{section==='teachers'&&<th>Approval action</th>}</tr></thead><tbody>{rows.map((r,i)=><tr key={r.id||r.student_id||r.teacher_id||i}>{rowsColumns.map(k=><td key={k}>{String(r[k]??'—')}</td>)}{section==='teachers'&&<td>{r.status==='PENDING'?<div className="table-actions"><button className="mini-approve" onClick={()=>updateTeacher(r.teacher_id,'ACTIVE')}>Approve</button><button className="mini-reject" onClick={()=>updateTeacher(r.teacher_id,'REJECTED')}>Reject</button></div>:<span className={`pill ${String(r.status).toLowerCase()}`}>{r.status}</span>}</td>}</tr>)}</tbody></table>:<div className="empty-state"><span>▤</span><b>No records found</b><small>Records will appear here after they are added.</small></div>}</div></Panel>
 </>;
 async function updateTeacher(id,status){try{await api(`/admin/teachers/${id}/status`,{method:'PATCH',body:JSON.stringify({status})});setNotice(`Teacher ${status.toLowerCase()}.`);await load();}catch(e){setError(e.message);}}
}

function SessionsPage(){
 const [sessions,setSessions]=useState([]),[offerings,setOfferings]=useState([]),[selected,setSelected]=useState('');
 const [exams,setExams]=useState([]),[schedule,setSchedule]=useState([]),[unscheduled,setUnscheduled]=useState([]);
 const [error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false);
 const [sessionForm,setSessionForm]=useState({name:'End Semester Examination',academic_session:'2026-27',start_date:'2026-12-01',end_date:'2026-12-10',day_start_time:'09:00',day_end_time:'17:00'});
 const [examForm,setExamForm]=useState({offering_id:'',duration_minutes:180,priority:3});const [algorithm,setAlgorithm]=useState('FCFS');
 async function load(){
  try{const [s,o]=await Promise.all([api('/admin/sessions'),api('/admin/offerings')]);setSessions(s.sessions||[]);setOfferings(o.offerings||[]);if(!selected&&s.sessions?.length)setSelected(String(s.sessions[0].id));setError('');}
  catch(e){setError(e.message);}
 }
 async function loadExams(id=selected){
  if(!id){setExams([]);setSchedule([]);return;}
  try{const [e,s]=await Promise.all([api(`/admin/sessions/${id}/exams`),api(`/admin/sessions/${id}/schedule`)]);setExams(e.exams||[]);setSchedule(s.schedule||[]);}
  catch(e){setError(e.message);}
 }
 useEffect(()=>{load();},[]);
 useEffect(()=>{if(selected)loadExams(selected);},[selected]);
 async function createSession(e){e.preventDefault();setBusy(true);setError('');setNotice('');
  try{const r=await api('/admin/sessions',{method:'POST',body:JSON.stringify(sessionForm)});setNotice('Exam session created. Add examinations below.');await load();setSelected(String(r.id));}
  catch(e){setError(e.message);}finally{setBusy(false);}
 }
 async function addExam(e){e.preventDefault();if(!selected)return setError('Select an exam session first.');setBusy(true);setError('');setNotice('');
  try{await api(`/admin/sessions/${selected}/exams`,{method:'POST',body:JSON.stringify({...examForm,offering_id:Number(examForm.offering_id),duration_minutes:Number(examForm.duration_minutes),priority:Number(examForm.priority)})});setNotice('Examination added to the selected session.');await load();await loadExams();}
  catch(e){setError(e.message);}finally{setBusy(false);}
 }
 async function generate(){if(!selected)return;setBusy(true);setError('');setNotice('');
  try{const r=await api(`/admin/sessions/${selected}/generate`,{method:'POST',body:JSON.stringify({algorithm})});setUnscheduled(r.unscheduled||[]);setNotice(`${r.summary?.scheduled_count??0} examination(s) scheduled using ${algorithm}.`);await load();await loadExams();}
  catch(e){setError(e.message);}finally{setBusy(false);}
 }
 async function publish(){if(!selected)return;setBusy(true);setError('');setNotice('');
  try{const r=await api(`/admin/sessions/${selected}/publish`,{method:'POST',body:JSON.stringify({})});setNotice(r.message||'Timetable published.');await load();await loadExams();}
  catch(e){setError(e.message);}finally{setBusy(false);}
 }
 const current=sessions.find(x=>String(x.id)===String(selected));
 return <>
  <header className="page-heading"><div><div className="eyebrow">EXAMINATION OPERATIONS</div><h1>Exam sessions & timetable</h1><p>Create a session, add examinations, generate and publish the timetable.</p></div><button className="outline-button" onClick={load}>↻ &nbsp; Refresh</button></header>
  {error&&<div className="alert alert-error">{error}</div>}{notice&&<div className="alert alert-success">{notice}</div>}
  <div className="steps-strip"><span className="step-active">01 <b>Create session</b></span><i>→</i><span>02 <b>Add exams</b></span><i>→</i><span>03 <b>Generate</b></span><i>→</i><span>04 <b>Publish</b></span></div>
  <Panel title="01 · Create examination session"><form className="record-form six-cols" onSubmit={createSession}>
   <label>Session name<input required value={sessionForm.name} onChange={e=>setSessionForm({...sessionForm,name:e.target.value})}/></label>
   <label>Academic session<input required value={sessionForm.academic_session} onChange={e=>setSessionForm({...sessionForm,academic_session:e.target.value})}/></label>
   <label>Start date<input type="date" required value={sessionForm.start_date} onChange={e=>setSessionForm({...sessionForm,start_date:e.target.value})}/></label>
   <label>End date<input type="date" required value={sessionForm.end_date} onChange={e=>setSessionForm({...sessionForm,end_date:e.target.value})}/></label>
   <label>Daily start<input type="time" required value={sessionForm.day_start_time} onChange={e=>setSessionForm({...sessionForm,day_start_time:e.target.value})}/></label>
   <label>Daily end<input type="time" required value={sessionForm.day_end_time} onChange={e=>setSessionForm({...sessionForm,day_end_time:e.target.value})}/></label>
   <button className="primary-button" disabled={busy}>Create session</button>
  </form></Panel>
  <Panel title="02 · Add examinations"><div className="record-form four-cols">
   <label>Select session<select value={selected} onChange={e=>setSelected(e.target.value)}><option value="">Choose session</option>{sessions.map(s=><option key={s.id} value={s.id}>{s.name} · #{s.id}</option>)}</select></label>
   <label>Subject offering<select value={examForm.offering_id} onChange={e=>setExamForm({...examForm,offering_id:e.target.value})}><option value="">Choose subject offering</option>{offerings.map(o=><option key={o.id} value={o.id}>{o.subject_code} — {o.subject_name}</option>)}</select></label>
   <label>Duration (minutes)<input type="number" min="30" max="480" step="15" value={examForm.duration_minutes} onChange={e=>setExamForm({...examForm,duration_minutes:e.target.value})}/></label>
   <label>Priority<select value={examForm.priority} onChange={e=>setExamForm({...examForm,priority:e.target.value})}>{[1,2,3,4,5].map(n=><option key={n} value={n}>{n} {n===5?'(highest)':n===1?'(lowest)':''}</option>)}</select></label>
   <button className="primary-button" disabled={busy||!selected||!examForm.offering_id} onClick={addExam}>+ Add examination</button>
  </div>
  {current&&<div className="session-summary"><b>{current.name}</b><span>{current.academic_session}</span><span>{exams.length} examinations</span><span>{schedule.length} scheduled</span><span className={`pill ${current.status.toLowerCase()}`}>{current.status}</span></div>}
  {exams.length>0&&<div className="table-wrap compact-table"><table><thead><tr><th>Subject</th><th>Batch</th><th>Students</th><th>Duration</th><th>Priority</th><th>Allocation</th></tr></thead><tbody>{exams.map(e=><tr key={e.exam_id}><td><b>{e.subject_code}</b> · {e.subject_name}</td><td>{e.course_name} / {e.branch_name} · Y{e.academic_year} S{e.semester}</td><td>{e.student_count}</td><td>{e.duration_minutes} min</td><td>{e.priority}</td><td>{e.schedule_id?<span className="pill active">Scheduled</span>:<span className="pill pending">Pending</span>}</td></tr>)}</tbody></table></div>}
  </Panel>
  <Panel title="03 · Generate timetable"><div className="generate-toolbar"><label>Scheduling algorithm<select value={algorithm} onChange={e=>setAlgorithm(e.target.value)}><option value="FCFS">FCFS — First Come First Served</option><option value="PRIORITY">Priority Scheduling</option></select></label><button className="primary-button" disabled={busy||!selected||!exams.length||current?.status!=='DRAFT'} onClick={generate}>Generate timetable</button><button className="outline-button" disabled={!selected} onClick={()=>loadExams()}>Refresh schedule</button><button className="publish-button" disabled={busy||!selected||!schedule.length||current?.status!=='DRAFT'} onClick={publish}>Publish timetable</button></div>
   {unscheduled.length>0&&<div className="alert alert-warning">Unscheduled: {unscheduled.map(x=>x.subject_code).join(', ')}. Check available rooms, room capacity and approved teacher availability.</div>}
   {schedule.length?<div className="table-wrap"><table><thead><tr><th>Date</th><th>Time</th><th>Subject</th><th>Students</th><th>Room</th><th>Invigilator</th><th>Status</th></tr></thead><tbody>{schedule.map(x=><tr key={x.schedule_id}><td>{String(x.exam_date).slice(0,10)}</td><td>{String(x.start_time).slice(0,5)} – {String(x.end_time).slice(0,5)}</td><td><b>{x.subject_code}</b> · {x.subject_name}</td><td>{x.student_count}</td><td>{x.room_code}</td><td>{x.teacher_name}</td><td><span className={`pill ${x.status.toLowerCase()}`}>{x.status}</span></td></tr>)}</tbody></table></div>:<div className="empty-state"><span>▦</span><b>No timetable generated yet</b><small>Add exams, make sure teachers have availability, then generate.</small></div>}
  </Panel>
  <Panel title="All examination sessions"><div className="table-wrap"><table><thead><tr><th>Session</th><th>Academic year</th><th>Dates</th><th>Exams</th><th>Scheduled</th><th>Status</th></tr></thead><tbody>{sessions.map(s=><tr key={s.id}><td>{s.name}</td><td>{s.academic_session}</td><td>{String(s.start_date).slice(0,10)} – {String(s.end_date).slice(0,10)}</td><td>{s.exam_count}</td><td>{s.scheduled_count}</td><td><span className={`pill ${s.status.toLowerCase()}`}>{s.status}</span></td></tr>)}</tbody></table></div></Panel>
 </>;
}

export default function AdminData({section}){return section==='sessions'?<SessionsPage/>:<RecordsPage section={section}/>;}
