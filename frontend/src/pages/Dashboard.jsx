import React,{useEffect,useState} from 'react';
import {api} from '../services/api';
import Panel from '../components/Panel';

const metrics=[
 ['Active students','active_students','♙','blue'],
 ['Approved teachers','approved_teachers','♧','teal'],
 ['Pending approvals','pending_approvals','◷','amber'],
 ['Subjects','subjects','▣','violet'],
 ['Examination rooms','rooms','⌂','blue'],
 ['Exam sessions','exam_sessions','▦','teal'],
 ['Examinations','examinations','▤','violet'],
 ['Scheduled exams','scheduled_exams','✓','amber']
];
export default function Dashboard(){
 const [data,setData]=useState(null);const [error,setError]=useState('');
 async function load(){try{setData(await api('/admin/overview'));setError('');}catch(e){setError(e.message);}}
 useEffect(()=>{load();},[]);
 return <>
  <header className="page-heading"><div><div className="eyebrow">ADMINISTRATOR WORKSPACE</div><h1>Good day, administrator.</h1><p>Here’s your university examination overview for today.</p></div><button className="outline-button" onClick={load}>↻ &nbsp; Refresh</button></header>
  {error&&<div className="alert alert-error">{error}</div>}
  <div className="metric-grid">{metrics.map(([label,key,icon,tint])=><div className="metric-card" key={key}><div className="metric-top"><span>{label}</span><i className={`metric-icon ${tint}`}>{icon}</i></div><strong>{data?.[key]??'—'}</strong><small>Live database count</small></div>)}</div>
  <div className="dashboard-lower">
   <Panel title="Examination workflow"><div className="workflow-list">
    <div><b>01</b><span><strong>Academic setup</strong><small>Create courses, branches, subjects and subject offerings.</small></span></div>
    <div><b>02</b><span><strong>Resource setup</strong><small>Approve teachers, collect availability and register rooms.</small></span></div>
    <div><b>03</b><span><strong>Schedule examinations</strong><small>Create a session, add exams and generate FCFS or Priority timetable.</small></span></div>
    <div><b>04</b><span><strong>Review and publish</strong><small>Check allocations and publish the final timetable.</small></span></div>
   </div></Panel>
   <Panel title="Quick status"><div className="quick-status"><div><span>Scheduling engine</span><b className="status-ready">FCFS + Priority ready</b></div><div><span>Database</span><b>MySQL · examflow</b></div><div><span>Project modules</span><b>Admin · Student · Teacher</b></div></div></Panel>
  </div>
 </>;
}
