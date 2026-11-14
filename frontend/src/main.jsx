import React, {useEffect, useMemo, useState} from "react"
import {createRoot} from "react-dom/client"
import {
  Activity, ArrowDownRight, ArrowUpRight, BarChart3, Bell, CalendarDays,
  CheckCircle2, Circle, ClipboardList, CreditCard, Drill, FileText,
  Fuel, LayoutDashboard, Menu, Plus, ReceiptText, Search, Settings,
  ShieldCheck, UserRound, Users, WalletCards, Wrench, X, IndianRupee, MapPin, Image, FileArchive
} from "lucide-react"
import "./styles.css"

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api"

const NAV = [
  ["Dashboard", LayoutDashboard],
  ["Bookings", ClipboardList],
  ["Site Checks", CheckCircle2],
  ["Pricing", IndianRupee],
  ["Jobs", Drill],
  ["Customers", Users],
  ["Agents", Users],
  ["Machines", Drill],
  ["Machine Ops", Activity],
  ["Fuel", Fuel],
  ["Workers", UserRound],
  ["Attendance", CalendarDays],
  ["Payroll", WalletCards],
  ["Advances", CreditCard],
  ["Payments", WalletCards],
  ["Receivables", CreditCard],
  ["Expenses", ReceiptText],
  ["Maintenance", Wrench],
  ["Reports", BarChart3],
  ["Profitability", IndianRupee],
  ["Job Files", FileArchive],
  ["GPS", MapPin],
  ["Users", ShieldCheck],
]

const money = (n=0) => "₹" + Number(n || 0).toLocaleString("en-IN", {maximumFractionDigits:0})

let refreshPromise = null

// Fired whenever a request fails after a refresh attempt so the shell can
// force the app back to the login screen instead of leaving a stale page
// with silent alert() popups (see master prompt #48 - session expiry bug).
const SESSION_EXPIRED_EVENT = "bt:session-expired"
function announceSessionExpired() {
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
}

async function refreshAccessToken() {
  const refresh = localStorage.getItem("bt_refresh")
  if(!refresh) return false
  if(!refreshPromise) {
    refreshPromise = fetch(API + "/token/refresh/", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({refresh})
    }).then(async r => {
      const data = await r.json().catch(()=>({}))
      if(!r.ok || !data.access) throw new Error("Refresh failed")
      localStorage.setItem("bt_access", data.access)
      return true
    }).catch(() => false).finally(() => { refreshPromise = null })
  }
  return refreshPromise
}

async function api(path, options={}, retry=true) {
  const token = localStorage.getItem("bt_access")
  const headers = {"Content-Type":"application/json", ...(options.headers||{})}
  if(token) headers.Authorization = `Bearer ${token}`
  const r = await fetch(API + path, {...options, headers})

  if(r.status === 401 && retry) {
    const refreshed = await refreshAccessToken()
    if(refreshed) return api(path, options, false)
    localStorage.removeItem("bt_access")
    localStorage.removeItem("bt_refresh")
    announceSessionExpired()
    throw new Error("Session expired. Please log in again.")
  }

  const data = await r.json().catch(()=>({}))
  if(!r.ok) throw new Error(data.detail || JSON.stringify(data))
  return data
}

function Login({onLogin, sessionExpired}) {
  const [username,setUsername] = useState("admin")
  const [password,setPassword] = useState("admin123")
  const [error,setError] = useState("")
  async function submit(e){
    e.preventDefault(); setError("")
    try {
      const r = await fetch(API+"/token/", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({username,password})
      })
      const x=await r.json()
      if(!r.ok) throw new Error("Invalid username or password")
      localStorage.setItem("bt_access",x.access)
      localStorage.setItem("bt_refresh",x.refresh)
      onLogin()
    } catch(err){setError(err.message)}
  }
  return <div className="login-page">
    <div className="login-glow"/>
    <form className="login-card" onSubmit={submit}>
      <div className="brand-mark">BT</div>
      <div className="login-kicker">FIELD OPERATIONS PLATFORM</div>
      <h1>BoreTrack</h1>
      <p>Control every borewell job, machine, crew and rupee from one workspace.</p>
      {sessionExpired && <div className="error">Session expired. Please log in again.</div>}
      <label>Username<input value={username} onChange={e=>setUsername(e.target.value)}/></label>
      <label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)}/></label>
      {error && <div className="error">{error}</div>}
      <button className="primary wide">Sign in</button>
      <small>Demo credentials: admin / admin123 after running <code>seed_demo</code>.</small>
    </form>
  </div>
}

function App(){
  const [logged,setLogged]=useState(!!localStorage.getItem("bt_access"))
  const [user,setUser]=useState(null)
  const [page,setPage]=useState("Dashboard")
  const [mobile,setMobile]=useState(false)
  const [sessionNotice,setSessionNotice]=useState(false)
  useEffect(()=>{
    if(!logged) return
    api("/me/").then(setUser).catch(()=>{localStorage.clear();setLogged(false)})
  },[logged])
  // Any api() call that fails to refresh its token announces this event so
  // the whole app snaps back to the login screen instead of leaving a stale
  // page behind with only a one-off alert().
  useEffect(()=>{
    function onExpired(){
      setUser(null)
      setLogged(false)
      setSessionNotice(true)
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired)
  },[])
  if(!logged) return <Login onLogin={()=>{setSessionNotice(false);setLogged(true)}} sessionExpired={sessionNotice}/>
  if(!user) return <Loading/>
  return <Shell user={user} page={page} setPage={setPage} mobile={mobile} setMobile={setMobile} logout={()=>{localStorage.clear();setUser(null);setLogged(false)}}/>
}

function Shell({user,page,setPage,mobile,setMobile,logout}){
  return <div className="app">
    <aside className={mobile?"open":""}>
      <div className="brand">
        <div className="brand-mark">BT</div>
        <div><strong>BoreTrack</strong><small>FIELD OPERATIONS</small></div>
        <button className="close-nav" onClick={()=>setMobile(false)}><X size={18}/></button>
      </div>
      <div className="nav-title">WORKSPACE</div>
      <nav>{NAV.filter(([n])=>n!=="Users" || user.role==="owner").map(([n,I])=><button key={n} className={page===n?"active":""} onClick={()=>{setPage(n);setMobile(false)}}><I size={17}/><span>{n}</span></button>)}</nav>
      <div className="sidebar-bottom">
        <div className="system"><Circle size={8} fill="currentColor"/> System operational</div>
        <div className="account-card">
          <div className="account-avatar">{(user.first_name||user.username).slice(0,1).toUpperCase()}</div>
          <div><strong>{user.first_name ? `${user.first_name} ${user.last_name||""}`.trim() : user.username}</strong><small>{user.role_display}</small></div>
        </div>
        <button className="signout" onClick={logout}>Sign out</button>
      </div>
    </aside>
    <main>
      <header>
        <div className="header-left"><button className="menu" onClick={()=>setMobile(true)}><Menu size={20}/></button><div><span>OPERATIONS CONTROL CENTER</span><h2>{page}</h2></div></div>
        <div className="header-actions"><div className="global-search"><Search size={16}/><input placeholder="Search jobs, customers..."/></div><button className="round"><Bell size={17}/></button><button className="primary"><Plus size={17}/> New Job</button></div>
      </header>
      <div className="content">
        {page==="Dashboard" && <Dashboard/>}
        {page==="Bookings" && <Bookings/>}
        {page==="Site Checks" && <SiteChecks/>}
        {page==="Pricing" && <Pricing/>}
        {page==="Jobs" && <Jobs/>}
        {page==="Customers" && <Crud title="Customers" endpoint="/customers/" columns={["name","phone","village"]} fields={["name","phone","village","address","agent"]}/>}
        {page==="Agents" && <Crud title="Agents" endpoint="/agents/" columns={["name","phone","active"]} fields={["name","phone","active"]}/>}
        {page==="Machines" && <Crud title="Machines" endpoint="/machines/" columns={["code","name","status","hour_meter"]} fields={["code","name","status","hour_meter","notes"]}/>}
        {page==="Machine Ops" && <MachineOps/>}
        {page==="Fuel" && <FuelPage/>}
        {page==="Workers" && <Crud title="Workers" endpoint="/workers/" columns={["name","role","phone","daily_wage","active"]} fields={["name","phone","role","daily_wage","active"]}/>}
        {page==="Attendance" && <Crud title="Attendance" endpoint="/attendance/" columns={["date","worker","present","hours","overtime_hours"]} fields={["worker","job","date","present","hours","overtime_hours","note"]}/>}
        {page==="Payroll" && <PayrollPage/>}
        {page==="Advances" && <Crud title="Worker Advances" endpoint="/advances/" columns={["date","worker","amount","note"]} fields={["worker","amount","date","note"]}/> }
        {page==="Payments" && <Crud title="Payments" endpoint="/payments/" columns={["job","amount","method","received_at"]} fields={["job","amount","method","reference","note"]}/>}
        {page==="Receivables" && <Receivables/>}
        {page==="Expenses" && <ExpenseControl/>}
        {page==="Maintenance" && <Crud title="Maintenance" endpoint="/maintenance/" columns={["machine","maintenance_type","cost","started_at","completed_at"]} fields={["machine","maintenance_type","cost","started_at","completed_at","notes"]}/>}
        {page==="Reports" && <Reports/>}
        {page==="Profitability" && <Profitability/>}
        {page==="Job Files" && <JobFiles/>}
        {page==="GPS" && <GPSPage/>}
        {page==="Users" && user.role==="owner" && <UsersPage/>}
      </div>
    </main>
  </div>
}



function JobFiles(){
 const [rows,setRows]=useState([]),[jobs,setJobs]=useState([]),[open,setOpen]=useState(false),[refresh,setRefresh]=useState(0)
 useEffect(()=>{Promise.all([api('/job-files/'),api('/jobs/')]).then(([f,j])=>{setRows(f.results||f);setJobs(j.results||j)})},[refresh])
 async function remove(id){if(!confirm('Delete this file record?'))return;try{await api(`/job-files/${id}/`,{method:'DELETE'});setRefresh(x=>x+1)}catch(e){alert(e.message)}}
 return <section><div className="page-head"><div><span className="eyebrow">JOB EVIDENCE</span><h3>Documents & job photos</h3><p>Attach receipts, documents and site/drilling photos to the correct job.</p></div><button className="primary" onClick={()=>setOpen(true)}><Plus size={16}/> Upload file</button></div>
 <div className="table-card"><table><thead><tr><th>Job</th><th>Type</th><th>Caption</th><th>File</th><th>GPS</th><th>Uploaded</th><th></th></tr></thead><tbody>{rows.map(x=><tr key={x.id}><td>BT-{String(x.job).padStart(4,'0')}</td><td>{x.file_type}</td><td>{x.caption||'—'}</td><td>{x.file_url?<a href={x.file_url} target="_blank" rel="noreferrer">Open</a>:'—'}</td><td>{x.latitude&&x.longitude?`${x.latitude}, ${x.longitude}`:'—'}</td><td>{x.uploaded_by_name||'—'}</td><td><button onClick={()=>remove(x.id)}>Delete</button></td></tr>)}</tbody></table>{!rows.length&&<Empty/>}</div>
 {open&&<JobFileForm jobs={jobs} close={()=>setOpen(false)} done={()=>{setOpen(false);setRefresh(x=>x+1)}}/>}</section>
}
function JobFileForm({jobs,close,done}){
 const [f,setF]=useState({job:'',file_type:'photo',caption:'',latitude:'',longitude:''}),[file,setFile]=useState(null)
 const ch=e=>setF({...f,[e.target.name]:e.target.value})
 async function save(e){e.preventDefault();if(!file)return alert('Choose a file');const fd=new FormData();fd.append('job',f.job);fd.append('file_type',f.file_type);fd.append('caption',f.caption);if(f.latitude)fd.append('latitude',f.latitude);if(f.longitude)fd.append('longitude',f.longitude);fd.append('file',file);const token=localStorage.getItem('bt_access');try{const r=await fetch(API+'/job-files/',{method:'POST',headers:{Authorization:`Bearer ${token}`},body:fd});if(!r.ok)throw new Error(await r.text());done()}catch(e){alert(e.message)}}
 return <Modal title="Upload job file" close={close}><form className="form-grid" onSubmit={save}><Field label="Job"><select required name="job" value={f.job} onChange={ch}><option value="">Select job</option>{jobs.map(x=><option key={x.id} value={x.id}>BT-{String(x.id).padStart(4,'0')} — {x.customer_name}</option>)}</select></Field><Field label="Type"><select name="file_type" value={f.file_type} onChange={ch}><option value="photo">Job Photo</option><option value="receipt">Receipt</option><option value="document">Document</option><option value="other">Other</option></select></Field><Field label="File"><input required type="file" onChange={e=>setFile(e.target.files[0])}/></Field><Field label="Caption"><input name="caption" value={f.caption} onChange={ch} placeholder="Site condition, casing, receipt..."/></Field><Field label="Latitude"><input type="number" step="0.0000001" name="latitude" value={f.latitude} onChange={ch}/></Field><Field label="Longitude"><input type="number" step="0.0000001" name="longitude" value={f.longitude} onChange={ch}/></Field><div className="form-actions"><button type="button" onClick={close}>Cancel</button><button className="primary">Upload</button></div></form></Modal>
}
function GPSPage(){
 const [rows,setRows]=useState([]),[jobs,setJobs]=useState([]),[job,setJob]=useState(''),[note,setNote]=useState(''),[refresh,setRefresh]=useState(0)
 useEffect(()=>{Promise.all([api('/job-locations/'),api('/jobs/')]).then(([l,j])=>{setRows(l.results||l);setJobs(j.results||j)})},[refresh])
 function capture(){if(!job)return alert('Select a job');if(!navigator.geolocation)return alert('Geolocation is not supported');navigator.geolocation.getCurrentPosition(async pos=>{try{await api('/job-locations/',{method:'POST',body:JSON.stringify({job:Number(job),latitude:pos.coords.latitude,longitude:pos.coords.longitude,accuracy_m:pos.coords.accuracy,note})});setRefresh(x=>x+1);setNote('')}catch(e){alert(e.message)}},err=>alert(err.message),{enableHighAccuracy:true,timeout:15000,maximumAge:0})}
 return <section><div className="page-head"><div><span className="eyebrow">FIELD LOCATION</span><h3>GPS locations</h3><p>Capture the current device location only when the user explicitly requests it.</p></div></div><div className="card" style={{padding:18,marginBottom:18}}><div className="form-grid"><Field label="Job"><select value={job} onChange={e=>setJob(e.target.value)}><option value="">Select job</option>{jobs.map(x=><option key={x.id} value={x.id}>BT-{String(x.id).padStart(4,'0')} — {x.customer_name}</option>)}</select></Field><Field label="Note"><input value={note} onChange={e=>setNote(e.target.value)} placeholder="Site visit / drilling location"/></Field></div><button className="primary" onClick={capture}><MapPin size={16}/> Record current location</button></div><div className="table-card"><table><thead><tr><th>Job</th><th>Latitude</th><th>Longitude</th><th>Accuracy</th><th>Captured</th><th>By</th><th>Map</th></tr></thead><tbody>{rows.map(x=><tr key={x.id}><td>BT-{String(x.job).padStart(4,'0')}</td><td>{x.latitude}</td><td>{x.longitude}</td><td>{x.accuracy_m?`${x.accuracy_m} m`:'—'}</td><td>{new Date(x.captured_at).toLocaleString()}</td><td>{x.captured_by_name||'—'}</td><td><a target="_blank" rel="noreferrer" href={`https://www.google.com/maps?q=${x.latitude},${x.longitude}`}>Open map</a></td></tr>)}</tbody></table>{!rows.length&&<Empty/>}</div></section>
}

function ExpenseControl(){
 const [rows,setRows]=useState([]),[jobs,setJobs]=useState([]),[report,setReport]=useState(null),[open,setOpen]=useState(false),[refresh,setRefresh]=useState(0)
 useEffect(()=>{Promise.all([api("/expenses/"),api("/jobs/"),api("/reports/cash-control/")]).then(([e,j,r])=>{setRows(e.results||e);setJobs(j.results||j);setReport(r)})},[refresh])
 return <section><div className="page-head"><div><span className="eyebrow">FINANCE CONTROL</span><h3>Expenses & cash control</h3><p>Track job-linked expenses and unallocated business spending.</p></div><button className="primary" onClick={()=>setOpen(true)}><Plus size={16}/> Record expense</button></div>
 {report&&<div className="stats-row"><Stat label="Total expenses" value={money(report.total)}/><Stat label="Job linked" value={money(report.job_linked)}/><Stat label="Unallocated" value={money(report.unallocated)}/><Stat label="Today" value={money(report.today)}/></div>}
 {report&&<div className="two-col" style={{marginBottom:18}}><div className="table-card"><div className="card-title">Expense by category</div><table><thead><tr><th>Category</th><th>Amount</th></tr></thead><tbody>{report.by_category.map(x=><tr key={x.category}><td>{x.label}</td><td><b>{money(x.amount)}</b></td></tr>)}</tbody></table></div><div className="notice"><b>Control rule</b><p>Job-linked expenses can flow into job profitability. Unallocated expenses remain visible separately as overhead.</p><p><b>Avoid double-counting:</b> use dedicated Fuel, Payroll and Maintenance records for those costs; use generic expenses for additional costs not already recorded there.</p></div></div>}
 <div className="toolbar"><div className="filter"><Search size={15}/><input placeholder="Search expenses..."/></div><span>{rows.length} records</span></div><div className="table-card"><table><thead><tr><th>Date</th><th>Category</th><th>Job</th><th>Amount</th><th>Description</th></tr></thead><tbody>{rows.map(r=><tr key={r.id}><td>{r.expense_date}</td><td>{String(r.category||'').replaceAll('_',' ')}</td><td>{r.job?`BT-${String(r.job).padStart(4,'0')}`:'Unallocated'}</td><td><b>{money(r.amount)}</b></td><td>{r.description||'—'}</td></tr>)}</tbody></table>{!rows.length&&<Empty/>}</div>
 {open&&<ExpenseForm jobs={jobs} close={()=>setOpen(false)} done={()=>{setOpen(false);setRefresh(x=>x+1)}}/>}</section>
}
function ExpenseForm({jobs,close,done}){
 const [f,setF]=useState({job:'',category:'other',amount:'',description:'',expense_date:new Date().toISOString().slice(0,10)})
 const ch=e=>setF({...f,[e.target.name]:e.target.value})
 async function save(e){e.preventDefault();try{await api('/expenses/',{method:'POST',body:JSON.stringify({...f,job:f.job?Number(f.job):null,amount:Number(f.amount)})});done()}catch(err){alert(err.message)}}
 return <Modal title="Record business expense" close={close}><form className="form-grid" onSubmit={save}><Field label="Date"><input required type="date" name="expense_date" value={f.expense_date} onChange={ch}/></Field><Field label="Category"><select name="category" value={f.category} onChange={ch}><option value="fuel">Fuel / Diesel</option><option value="maintenance">Maintenance</option><option value="wages">Wages</option><option value="transport">Transport</option><option value="other">Other</option></select></Field><Field label="Job (optional)"><select name="job" value={f.job} onChange={ch}><option value="">Unallocated / overhead</option>{jobs.map(x=><option value={x.id} key={x.id}>BT-{String(x.id).padStart(4,'0')} — {x.customer_name||x.customer}</option>)}</select></Field><Field label="Amount"><input required min="0.01" step="0.01" type="number" name="amount" value={f.amount} onChange={ch}/></Field><Field label="Description" full><textarea name="description" value={f.description} onChange={ch} placeholder="What was this expense for?"/></Field><div className="form-actions"><button type="button" onClick={close}>Cancel</button><button className="primary">Save expense</button></div></form></Modal>
}

function Receivables(){
 const [jobs,setJobs]=useState([]),[payments,setPayments]=useState([]),[refresh,setRefresh]=useState(0),[open,setOpen]=useState(false)
 useEffect(()=>{Promise.all([api("/jobs/"),api("/payments/")]).then(([j,p])=>{setJobs(j.results||j);setPayments(p.results||p)})},[refresh])
 const rows=useMemo(()=>jobs.map(j=>{
   const received=payments.filter(p=>Number(p.job)===Number(j.id)).reduce((a,p)=>a+Number(p.amount||0),0)
   const total=Number(j.agreed_total||0), advance=Number(j.advance||0)
   // Avoid double counting: advance is treated as an agreed-job field only when there are no payment rows.
   const receivedTotal=payments.some(p=>Number(p.job)===Number(j.id))?received:advance
   const outstanding=Math.max(total-receivedTotal,0)
   return {...j,receivedTotal,outstanding}
 }),[jobs,payments])
 const total=rows.reduce((a,r)=>a+Number(r.agreed_total||0),0)
 const received=rows.reduce((a,r)=>a+Number(r.receivedTotal||0),0)
 const outstanding=rows.reduce((a,r)=>a+Number(r.outstanding||0),0)
 return <section>
  <div className="page-head"><div><span className="eyebrow">FINANCE CONTROL</span><h3>Customer receivables</h3><p>Track job value, money received and outstanding balances. Historical job amounts remain unchanged.</p></div><button className="primary" onClick={()=>setOpen(true)}><Plus size={16}/> Record payment</button></div>
  <div className="stats-row"><Stat label="Job value" value={money(total)}/><Stat label="Received" value={money(received)}/><Stat label="Outstanding" value={money(outstanding)}/></div>
  <div className="table-card"><table><thead><tr><th>Job</th><th>Customer</th><th>Site</th><th>Agreed</th><th>Received</th><th>Outstanding</th><th>Status</th></tr></thead><tbody>
   {rows.map(r=><tr key={r.id}><td><b>BT-{String(r.id).padStart(4,'0')}</b></td><td>{r.customer_name||r.customer}</td><td>{r.site}</td><td>{money(r.agreed_total)}</td><td>{money(r.receivedTotal)}</td><td><b>{money(r.outstanding)}</b></td><td><span className={'status '+(r.outstanding<=0?'completed':'active')}>{r.outstanding<=0?'PAID':'DUE'}</span></td></tr>)}
  </tbody></table>{!rows.length&&<Empty/>}</div>
  {open&&<PaymentForm jobs={jobs} close={()=>setOpen(false)} done={()=>{setOpen(false);setRefresh(x=>x+1)}}/>}
 </section>
}
function PaymentForm({jobs,close,done}){
 const [f,setF]=useState({job:"",amount:"",method:"cash",reference:"",note:""})
 const ch=e=>setF({...f,[e.target.name]:e.target.value})
 async function save(e){e.preventDefault();try{await api("/payments/",{method:"POST",body:JSON.stringify({...f,job:Number(f.job),amount:Number(f.amount)})});done()}catch(err){alert(err.message)}}
 return <Modal title="Record customer payment" close={close}><form className="form-grid" onSubmit={save}>
  <Field label="Job"><select required name="job" value={f.job} onChange={ch}><option value="">Select job</option>{jobs.map(x=><option key={x.id} value={x.id}>BT-{String(x.id).padStart(4,'0')} — {x.customer_name||x.customer} — {money(x.agreed_total)}</option>)}</select></Field>
  <Field label="Amount"><input required type="number" min="0.01" step="0.01" name="amount" value={f.amount} onChange={ch}/></Field>
  <Field label="Method"><select name="method" value={f.method} onChange={ch}><option value="cash">Cash</option><option value="upi">UPI</option><option value="bank">Bank transfer</option><option value="cheque">Cheque</option><option value="other">Other</option></select></Field>
  <Field label="Reference"><input name="reference" value={f.reference} onChange={ch}/></Field>
  <Field label="Notes" full><textarea name="note" value={f.note} onChange={ch}/></Field>
  <div className="form-actions"><button type="button" onClick={close}>Cancel</button><button className="primary">Save payment</button></div>
 </form></Modal>
}

function PayrollPage(){
 const [rows,setRows]=useState([]),[workers,setWorkers]=useState([]),[open,setOpen]=useState(false),[refresh,setRefresh]=useState(0)
 useEffect(()=>{Promise.all([api("/wage-settlements/"),api("/workers/")]).then(([a,w])=>{setRows(a.results||a);setWorkers(w.results||w)})},[refresh])
 const totals=useMemo(()=>({net:rows.reduce((s,x)=>s+Number(x.net_payable||0),0),paid:rows.reduce((s,x)=>s+Number(x.paid_amount||0),0),due:rows.reduce((s,x)=>s+Math.max(Number(x.net_payable||0)-Number(x.paid_amount||0),0),0)}),[rows])
 return <section><div className="page-head"><div><span className="eyebrow">PEOPLE & PAYROLL</span><h3>Worker payroll</h3><p>Prepare wage settlements from attendance, daily wages, overtime amount and advance deductions.</p></div><button className="primary" onClick={()=>setOpen(true)}><Plus size={16}/> New settlement</button></div>
 <div className="stats-row"><Stat label="Net payable" value={money(totals.net)}/><Stat label="Paid" value={money(totals.paid)}/><Stat label="Balance" value={money(totals.due)}/></div>
 <div className="table-card"><table><thead><tr><th>Worker</th><th>Period</th><th>Days</th><th>Gross</th><th>Advance</th><th>Net</th><th>Paid</th><th>Status</th></tr></thead><tbody>{rows.map(x=><tr key={x.id}><td><b>{x.worker_name}</b></td><td>{x.period_start} → {x.period_end}</td><td>{x.payable_days}</td><td>{money(x.gross_wage)}</td><td>{money(x.advance_deduction)}</td><td><b>{money(x.net_payable)}</b></td><td>{money(x.paid_amount)}</td><td><span className={'status '+x.status}>{x.status}</span></td></tr>)}</tbody></table>{!rows.length&&<Empty/>}</div>
 {open&&<PayrollForm workers={workers} close={()=>setOpen(false)} done={()=>{setOpen(false);setRefresh(x=>x+1)}}/>}</section>
}
function PayrollForm({workers,close,done}){
 const [f,setF]=useState({worker:"",period_start:new Date().toISOString().slice(0,8)+"01",period_end:new Date().toISOString().slice(0,10),payable_days:"",base_wage:"",overtime_amount:"0",advance_deduction:"0",other_deduction:"0",paid_amount:"0",paid_date:"",note:""})
 const ch=e=>setF({...f,[e.target.name]:e.target.value})
 const gross=(Number(f.base_wage)||0)+(Number(f.overtime_amount)||0), net=Math.max(gross-(Number(f.advance_deduction)||0)-(Number(f.other_deduction)||0),0)
 async function save(e){e.preventDefault();try{await api("/wage-settlements/",{method:"POST",body:JSON.stringify({...f,worker:Number(f.worker),payable_days:Number(f.payable_days||0),base_wage:Number(f.base_wage||0),overtime_amount:Number(f.overtime_amount||0),advance_deduction:Number(f.advance_deduction||0),other_deduction:Number(f.other_deduction||0),paid_amount:Number(f.paid_amount||0),paid_date:f.paid_date||null})});done()}catch(err){alert(err.message)}}
 return <Modal title="New wage settlement" close={close}><div className="notice">Payroll is intentionally flexible: overtime amount and Bata basis are not hard-coded until the business validates the exact wage rules.</div><form className="form-grid" onSubmit={save}><Field label="Worker"><select required name="worker" value={f.worker} onChange={ch}><option value="">Select worker</option>{workers.map(x=><option key={x.id} value={x.id}>{x.name} — {x.role}</option>)}</select></Field><Field label="Period start"><input required type="date" name="period_start" value={f.period_start} onChange={ch}/></Field><Field label="Period end"><input required type="date" name="period_end" value={f.period_end} onChange={ch}/></Field><Field label="Payable days"><input type="number" step="0.5" name="payable_days" value={f.payable_days} onChange={ch}/></Field><Field label="Base wage"><input required type="number" step="0.01" name="base_wage" value={f.base_wage} onChange={ch}/></Field><Field label="Overtime amount"><input type="number" step="0.01" name="overtime_amount" value={f.overtime_amount} onChange={ch}/></Field><Field label="Gross wage"><input disabled value={money(gross)}/></Field><Field label="Advance deduction"><input type="number" step="0.01" name="advance_deduction" value={f.advance_deduction} onChange={ch}/></Field><Field label="Other deduction"><input type="number" step="0.01" name="other_deduction" value={f.other_deduction} onChange={ch}/></Field><Field label="Net payable"><input disabled value={money(net)}/></Field><Field label="Paid amount"><input type="number" step="0.01" name="paid_amount" value={f.paid_amount} onChange={ch}/></Field><Field label="Paid date"><input type="date" name="paid_date" value={f.paid_date} onChange={ch}/></Field><Field label="Notes" full><textarea name="note" value={f.note} onChange={ch}/></Field><div className="form-actions"><button type="button" onClick={close}>Cancel</button><button className="primary">Save settlement</button></div></form></Modal>
}

function MachineOps(){
 const [rows,setRows]=useState([]),[machines,setMachines]=useState([]),[jobs,setJobs]=useState([]),[workers,setWorkers]=useState([]),[open,setOpen]=useState(false),[breakdowns,setBreakdowns]=useState([]),[bopen,setBopen]=useState(false),[refresh,setRefresh]=useState(0)
 const load=()=>Promise.all([api("/machine-operations/"),api("/machines/"),api("/jobs/"),api("/workers/"),api("/breakdowns/")]).then(([o,m,j,w,b])=>{setRows(o.results||o);setMachines(m.results||m);setJobs(j.results||j);setWorkers(w.results||w);setBreakdowns(b.results||b)})
 useEffect(()=>{load()},[refresh])
 return <section><div className="page-head"><div><span className="eyebrow">FLEET OPERATIONS</span><h3>Machine operations</h3><p>Record hour-meter movement against drilling work and monitor breakdown downtime.</p></div><div className="header-actions"><button className="primary" onClick={()=>setOpen(true)}><Plus size={16}/> Record hours</button><button onClick={()=>setBopen(true)}><Wrench size={16}/> Report breakdown</button></div></div>
  <div className="workspace-grid"><Panel title="Running hours" sub="Hour-meter records"><div className="table-card compact"><table><thead><tr><th>Date</th><th>Machine</th><th>Job</th><th>Start</th><th>End</th><th>Running</th></tr></thead><tbody>{rows.map(x=><tr key={x.id}><td>{x.date}</td><td>{x.machine_name}</td><td>{x.job?`BT-${String(x.job).padStart(4,'0')}`:"—"}</td><td>{x.start_hour_meter}</td><td>{x.end_hour_meter}</td><td><b>{x.running_hours} h</b></td></tr>)}</tbody></table>{!rows.length&&<Empty/>}</div></Panel>
  <Panel title="Breakdowns" sub="Downtime and repair cost"><div className="table-card compact"><table><thead><tr><th>Machine</th><th>Status</th><th>Reason</th><th>Started</th><th>Downtime</th><th>Cost</th></tr></thead><tbody>{breakdowns.map(x=><tr key={x.id}><td>{x.machine_name}</td><td><span className={'status '+x.status}>{x.status}</span></td><td>{x.reason}</td><td>{new Date(x.started_at).toLocaleString()}</td><td>{x.downtime_hours==null?'Open':`${x.downtime_hours} h`}</td><td>{money(x.total_repair_cost)}</td></tr>)}</tbody></table>{!breakdowns.length&&<Empty/>}</div></Panel></div>
  {open&&<MachineOpForm machines={machines} jobs={jobs} workers={workers} close={()=>setOpen(false)} done={()=>{setOpen(false);setRefresh(x=>x+1)}}/>}
  {bopen&&<BreakdownForm machines={machines} jobs={jobs} close={()=>setBopen(false)} done={()=>{setBopen(false);setRefresh(x=>x+1)}}/>}
 </section>
}
function MachineOpForm({machines,jobs,workers,close,done}){
 const [f,setF]=useState({machine:"",job:"",worker:"",date:new Date().toISOString().slice(0,10),start_hour_meter:"",end_hour_meter:"",notes:""})
 const ch=e=>setF({...f,[e.target.name]:e.target.value})
 async function save(e){e.preventDefault();try{await api("/machine-operations/",{method:"POST",body:JSON.stringify({...f,machine:Number(f.machine),job:f.job?Number(f.job):null,worker:f.worker?Number(f.worker):null,start_hour_meter:Number(f.start_hour_meter),end_hour_meter:Number(f.end_hour_meter)})});done()}catch(err){alert(err.message)}}
 return <Modal title="Record machine hours" close={close}><form className="form-grid" onSubmit={save}><Field label="Machine"><select required name="machine" value={f.machine} onChange={ch}><option value="">Select machine</option>{machines.map(x=><option key={x.id} value={x.id}>{x.name} — {x.code}</option>)}</select></Field><Field label="Job"><select name="job" value={f.job} onChange={ch}><option value="">No job</option>{jobs.map(x=><option key={x.id} value={x.id}>BT-{String(x.id).padStart(4,'0')} — {x.customer_name}</option>)}</select></Field><Field label="Operator / worker"><select name="worker" value={f.worker} onChange={ch}><option value="">Not recorded</option>{workers.map(x=><option key={x.id} value={x.id}>{x.name} — {x.role}</option>)}</select></Field><Field label="Date"><input type="date" name="date" value={f.date} onChange={ch}/></Field><Field label="Start hour meter"><input required type="number" step="0.01" name="start_hour_meter" value={f.start_hour_meter} onChange={ch}/></Field><Field label="End hour meter"><input required type="number" step="0.01" name="end_hour_meter" value={f.end_hour_meter} onChange={ch}/></Field><Field label="Notes" full><textarea name="notes" value={f.notes} onChange={ch}/></Field><div className="form-actions"><button type="button" onClick={close}>Cancel</button><button className="primary">Save hours</button></div></form></Modal>
}
function BreakdownForm({machines,jobs,close,done}){
 const [f,setF]=useState({machine:"",job:"",started_at:new Date().toISOString().slice(0,16),status:"open",reason:"",repair_work:"",mechanic:"",parts_cost:0,labour_cost:0,notes:""})
 const ch=e=>setF({...f,[e.target.name]:e.target.value})
 async function save(e){e.preventDefault();try{await api("/breakdowns/",{method:"POST",body:JSON.stringify({...f,machine:Number(f.machine),job:f.job?Number(f.job):null,parts_cost:Number(f.parts_cost||0),labour_cost:Number(f.labour_cost||0),started_at:f.started_at.length===16?f.started_at+":00":f.started_at})});done()}catch(err){alert(err.message)}}
 return <Modal title="Report machine breakdown" close={close}><form className="form-grid" onSubmit={save}><Field label="Machine"><select required name="machine" value={f.machine} onChange={ch}><option value="">Select machine</option>{machines.map(x=><option key={x.id} value={x.id}>{x.name} — {x.code}</option>)}</select></Field><Field label="Job"><select name="job" value={f.job} onChange={ch}><option value="">No job</option>{jobs.map(x=><option key={x.id} value={x.id}>BT-{String(x.id).padStart(4,'0')}</option>)}</select></Field><Field label="Started at"><input required type="datetime-local" name="started_at" value={f.started_at} onChange={ch}/></Field><Field label="Status"><select name="status" value={f.status} onChange={ch}><option value="open">Open</option><option value="repairing">Repairing</option><option value="resolved">Resolved</option></select></Field><Field label="Reason" full><input required name="reason" value={f.reason} onChange={ch} placeholder="Compressor issue, rod jam, engine problem..."/></Field><Field label="Repair work" full><textarea name="repair_work" value={f.repair_work} onChange={ch}/></Field><Field label="Mechanic"><input name="mechanic" value={f.mechanic} onChange={ch}/></Field><Field label="Parts cost"><input type="number" name="parts_cost" value={f.parts_cost} onChange={ch}/></Field><Field label="Labour cost"><input type="number" name="labour_cost" value={f.labour_cost} onChange={ch}/></Field><Field label="Notes" full><textarea name="notes" value={f.notes} onChange={ch}/></Field><div className="form-actions"><button type="button" onClick={close}>Cancel</button><button className="primary">Save breakdown</button></div></form></Modal>
}
function FuelPage(){
 const [rows,setRows]=useState([]),[machines,setMachines]=useState([]),[jobs,setJobs]=useState([]),[open,setOpen]=useState(false),[refresh,setRefresh]=useState(0)
 useEffect(()=>{Promise.all([api("/fuel-logs/"),api("/machines/"),api("/jobs/")]).then(([a,m,j])=>{setRows(a.results||a);setMachines(m.results||m);setJobs(j.results||j)})},[refresh])
 return <section><div className="page-head"><div><span className="eyebrow">FUEL CONTROL</span><h3>Diesel / fuel</h3><p>Track litres, price, hour-meter reading and job allocation for every fill.</p></div><button className="primary" onClick={()=>setOpen(true)}><Plus size={16}/> Record fuel</button></div><div className="table-card"><table><thead><tr><th>Date</th><th>Machine</th><th>Job</th><th>Litres</th><th>₹ / litre</th><th>Total</th><th>Hour meter</th><th>Supplier</th></tr></thead><tbody>{rows.map(x=><tr key={x.id}><td>{x.date}</td><td>{x.machine_name}</td><td>{x.job_code||'—'}</td><td>{x.liters}</td><td>{money(x.price_per_liter)}</td><td><b>{money(x.total_cost)}</b></td><td>{x.hour_meter}</td><td>{x.supplier||'—'}</td></tr>)}</tbody></table>{!rows.length&&<Empty/>}</div>{open&&<FuelForm machines={machines} jobs={jobs} close={()=>setOpen(false)} done={()=>{setOpen(false);setRefresh(x=>x+1)}}/>}</section>
}
function FuelForm({machines,jobs,close,done}){
 const [f,setF]=useState({machine:"",job:"",date:new Date().toISOString().slice(0,10),liters:"",price_per_liter:"",hour_meter:"",supplier:"",reference:"",notes:""})
 const ch=e=>setF({...f,[e.target.name]:e.target.value})
 async function save(e){e.preventDefault();try{await api("/fuel-logs/",{method:"POST",body:JSON.stringify({...f,machine:Number(f.machine),job:f.job?Number(f.job):null,liters:Number(f.liters),price_per_liter:Number(f.price_per_liter),hour_meter:Number(f.hour_meter)})});done()}catch(err){alert(err.message)}}
 const total=(Number(f.liters)||0)*(Number(f.price_per_liter)||0)
 return <Modal title="Record fuel fill" close={close}><form className="form-grid" onSubmit={save}><Field label="Machine"><select required name="machine" value={f.machine} onChange={ch}><option value="">Select machine</option>{machines.map(x=><option key={x.id} value={x.id}>{x.name} — {x.code}</option>)}</select></Field><Field label="Job"><select name="job" value={f.job} onChange={ch}><option value="">No job</option>{jobs.map(x=><option key={x.id} value={x.id}>BT-{String(x.id).padStart(4,'0')}</option>)}</select></Field><Field label="Date"><input type="date" name="date" value={f.date} onChange={ch}/></Field><Field label="Litres"><input required type="number" step="0.01" name="liters" value={f.liters} onChange={ch}/></Field><Field label="Price / litre"><input required type="number" step="0.01" name="price_per_liter" value={f.price_per_liter} onChange={ch}/></Field><Field label="Total cost"><input disabled value={money(total)}/></Field><Field label="Hour meter"><input type="number" step="0.01" name="hour_meter" value={f.hour_meter} onChange={ch}/></Field><Field label="Supplier"><input name="supplier" value={f.supplier} onChange={ch}/></Field><Field label="Reference"><input name="reference" value={f.reference} onChange={ch}/></Field><Field label="Notes" full><textarea name="notes" value={f.notes} onChange={ch}/></Field><div className="form-actions"><button type="button" onClick={close}>Cancel</button><button className="primary">Save fuel log</button></div></form></Modal>
}

function Dashboard(){
  const [d,setD]=useState(null),[jobs,setJobs]=useState([])
  useEffect(()=>{Promise.all([api("/dashboard/"),api("/jobs/")]).then(([a,b])=>{setD(a);setJobs(b.results||b)})},[])
  if(!d) return <Loading/>
  const cards=[
    ["Active drilling",d.active_jobs,"Live field operations","up"],
    ["Available rigs",d.available_machines,"Ready for dispatch","up"],
    ["Outstanding",money(d.outstanding),"Customer receivables","down"],
    ["Revenue",money(d.revenue),"Recorded payments","up"]
  ]
  return <section>
    <div className="hero">
      <div><span className="lime-label">LIVE OPERATIONS</span><h3>Know what is happening<br/>across every borewell.</h3><p>Track machines, crews, jobs and cash flow from one industrial workspace.</p></div>
      <div className="hero-metric"><b>{d.jobs}</b><small>TOTAL JOBS</small><div className="pulse"/></div>
    </div>
    <div className="cards">{cards.map(([t,v,s,dir])=><div className="card" key={t}><div className="card-top"><span>{t}</span><i className={dir}>{dir==="up"?<ArrowUpRight size={14}/>:<ArrowDownRight size={14}/>}</i></div><strong>{v}</strong><small>{s}</small></div>)}</div>
    <div className="dash-grid">
      <Panel title="Machine readiness" sub="Current fleet status"><StatusRow label="Available" value={d.available_machines} tone="green"/><StatusRow label="Drilling" value={d.drilling_machines} tone="blue"/><StatusRow label="Maintenance / breakdown" value={d.maintenance_machines} tone="amber"/></Panel>
      <Panel title="Workforce" sub="Today's field picture"><div className="workforce"><Metric value={d.workers} label="Active workers"/><Metric value={d.present_today} label="Present today"/><Metric value={d.active_jobs} label="On field"/></div></Panel>
      <div className="panel full"><div className="panel-head"><div><h4>Recent drilling jobs</h4><small>Latest operational records</small></div><button>All jobs</button></div>{jobs.slice(0,7).map(j=><div className="job-row" key={j.id}><b>BT-{String(j.id).padStart(4,"0")}</b><div><strong>{j.customer_name}</strong><small>{j.site}</small></div><span className={"status "+j.status}>{j.status.replace("_"," ")}</span><strong>{money(j.agreed_total)}</strong></div>)}{!jobs.length&&<Empty/>}</div>
    </div>
  </section>
}

function Stat({label,value}){return <div className="metric-card"><span>{label}</span><strong>{value}</strong></div>}
function Panel({title,sub,children}){return <div className="panel"><div className="panel-head"><div><h4>{title}</h4><small>{sub}</small></div></div>{children}</div>}
function StatusRow({label,value,tone}){return <div className="status-row"><span><i className={"dot "+tone}/>{label}</span><b>{value}</b></div>}
function Metric({value,label}){return <div className="metric"><b>{value}</b><small>{label}</small></div>}
function Empty(){return <div className="empty">No records yet.</div>}
function Loading(){return <div className="loading">Loading BoreTrack workspace…</div>}

function Bookings(){
  const [rows,setRows]=useState([]),[customers,setCustomers]=useState([]),[agents,setAgents]=useState([]),[open,setOpen]=useState(false),[editing,setEditing]=useState(null),[refresh,setRefresh]=useState(0)
  useEffect(()=>{Promise.all([api('/bookings/'),api('/customers/'),api('/agents/')]).then(([b,c,a])=>{setRows(b.results||b);setCustomers(c.results||c);setAgents(a.results||a)})},[refresh])
  return <section><div className="page-head"><div><span className="eyebrow">ENQUIRY → SITE CHECK → CONFIRM</span><h3>Bookings</h3><p>Capture enquiries before they become drilling jobs.</p></div><button className="primary" onClick={()=>setOpen(true)}><Plus size={16}/> New booking</button></div>
    <div className="toolbar"><div className="filter"><Search size={15}/><input placeholder="Search bookings..."/></div><span>{rows.length} records</span></div>
    <div className="table-card"><table><thead><tr><th>Booking</th><th>Customer</th><th>Agent</th><th>Site</th><th>Source</th><th>Status</th><th>Requested</th><th></th></tr></thead><tbody>{rows.map(b=><tr key={b.id} className="clickable-row" onClick={()=>setEditing(b)}><td><b>BK-{String(b.id).padStart(4,'0')}</b></td><td>{b.customer_name}</td><td>{b.agent_name||'—'}</td><td>{b.requested_site}</td><td>{b.source}</td><td><span className={'status '+b.status}>{b.status.replace('_',' ')}</span></td><td>{b.requested_date||'—'}</td><td><button className="table-action" onClick={e=>{e.stopPropagation();setEditing(b)}}>Edit</button></td></tr>)}</tbody></table>{!rows.length&&<Empty/>}</div>
    {open&&<BookingForm customers={customers} agents={agents} close={()=>setOpen(false)} done={()=>{setOpen(false);setRefresh(x=>x+1)}}/>}
    {editing&&<BookingForm existing={editing} customers={customers} agents={agents} close={()=>setEditing(null)} done={()=>{setEditing(null);setRefresh(x=>x+1)}}/>}
  </section>
}
function BookingForm({existing,customers,agents,close,done}){
 const [f,setF]=useState({
   customer:existing?.customer??'', agent:existing?.agent??'', source:existing?.source||'agent',
   requested_site:existing?.requested_site||'', requested_date:existing?.requested_date||'',
   status:existing?.status||'enquiry', enquiry_note:existing?.enquiry_note||''
 });
 const ch=e=>setF({...f,[e.target.name]:e.target.value});
 async function save(e){
   e.preventDefault()
   try{
     const body={...f,customer:Number(f.customer),agent:f.agent?Number(f.agent):null,requested_date:f.requested_date||null}
     if(existing) await api(`/bookings/${existing.id}/`,{method:'PATCH',body:JSON.stringify(body)})
     else await api('/bookings/',{method:'POST',body:JSON.stringify(body)})
     done()
   }catch(err){alert(err.message)}
 }
 return <Modal title={existing?`Edit booking BK-${String(existing.id).padStart(4,'0')}`:"New booking / enquiry"} close={close}><form className="form-grid" onSubmit={save}><Field label="Customer"><select required name="customer" value={f.customer} onChange={ch}><option value="">Select customer</option>{customers.map(x=><option value={x.id} key={x.id}>{x.name} — {x.phone}</option>)}</select></Field><Field label="Agent"><select name="agent" value={f.agent} onChange={ch}><option value="">None</option>{agents.map(x=><option value={x.id} key={x.id}>{x.name}</option>)}</select></Field><Field label="Source"><select name="source" value={f.source} onChange={ch}><option value="agent">Agent</option><option value="direct">Direct</option><option value="other">Other</option></select></Field><Field label="Status"><select name="status" value={f.status} onChange={ch}>{['enquiry','site_check','quoted','confirmed','rejected','cancelled'].map(x=><option key={x}>{x}</option>)}</select></Field><Field label="Requested site" full><input required name="requested_site" value={f.requested_site} onChange={ch} placeholder="Village / farm / location"/></Field><Field label="Requested date"><input type="date" name="requested_date" value={f.requested_date||''} onChange={ch}/></Field><Field label="Enquiry note" full><textarea name="enquiry_note" value={f.enquiry_note} onChange={ch} placeholder="Agent/customer details, road/access notes, etc."/></Field><div className="form-actions"><button type="button" onClick={close}>Cancel</button><button className="primary">{existing?"Save changes":"Save booking"}</button></div></form></Modal>
}
function SiteChecks(){
 const [rows,setRows]=useState([]),[bookings,setBookings]=useState([]),[open,setOpen]=useState(false),[refresh,setRefresh]=useState(0)
 useEffect(()=>{Promise.all([api('/inspections/'),api('/bookings/')]).then(([i,b])=>{setRows(i.results||i);setBookings(b.results||b)})},[refresh])
 return <section><div className="page-head"><div><span className="eyebrow">FIELD VALIDATION</span><h3>Site checks</h3><p>Record access, site condition, nearby borewells and the inspection decision.</p></div><button className="primary" onClick={()=>setOpen(true)}><Plus size={16}/> Record site check</button></div>
 <div className="table-card"><table><thead><tr><th>Booking</th><th>Customer</th><th>Road access</th><th>Wet/moist</th><th>Nearby borewell</th><th>Distance</th><th>Machine reach</th><th>Decision</th></tr></thead><tbody>{rows.map(x=><tr key={x.id}><td>BK-{String(x.booking).padStart(4,'0')}</td><td>{(bookings.find(b=>b.id===x.booking)||{}).customer_name||'—'}</td><td>{x.road_access}</td><td>{x.ground_wet?'Yes':'No'}</td><td>{x.nearby_borewell?'Yes':'No'}</td><td>{x.nearby_distance_m?`${x.nearby_distance_m} m`:'—'}</td><td>{x.machine_can_reach?'Yes':'No'}</td><td><span className={'status '+x.decision}>{x.decision.replace('_',' ')}</span></td></tr>)}</tbody></table>{!rows.length&&<Empty/>}</div>
 {open&&<InspectionForm bookings={bookings} close={()=>setOpen(false)} done={()=>{setOpen(false);setRefresh(x=>x+1)}}/>}</section>
}
function InspectionForm({bookings,close,done}){
 const [f,setF]=useState({booking:'',inspection_date:new Date().toISOString().slice(0,10),inspector_name:'',road_access:'good',ground_wet:false,nearby_borewell:false,nearby_distance_m:'',nearby_borewell_owner:'',machine_can_reach:true,site_suitable:false,latitude:'',longitude:'',decision:'pending',notes:''});
 const ch=e=>setF({...f,[e.target.name]:e.target.type==='checkbox'?e.target.checked:e.target.value});
 async function save(e){e.preventDefault();try{const out={...f,booking:Number(f.booking),nearby_distance_m:f.nearby_distance_m?Number(f.nearby_distance_m):null,latitude:f.latitude?Number(f.latitude):null,longitude:f.longitude?Number(f.longitude):null};await api('/inspections/',{method:'POST',body:JSON.stringify(out)});done()}catch(err){alert(err.message)}}
 return <Modal title="Record site inspection" close={close}><form className="form-grid" onSubmit={save}><Field label="Booking"><select required name="booking" value={f.booking} onChange={ch}><option value="">Select booking</option>{bookings.map(x=><option value={x.id} key={x.id}>BK-{String(x.id).padStart(4,'0')} — {x.customer_name}</option>)}</select></Field><Field label="Inspection date"><input type="date" name="inspection_date" value={f.inspection_date} onChange={ch}/></Field><Field label="Inspector"><input name="inspector_name" value={f.inspector_name} onChange={ch}/></Field><Field label="Road access"><select name="road_access" value={f.road_access} onChange={ch}><option value="good">Good</option><option value="limited">Limited</option><option value="not_accessible">Not accessible</option></select></Field><Field label="Site appears wet / moist"><input type="checkbox" name="ground_wet" checked={f.ground_wet} onChange={ch}/></Field><Field label="Nearby borewell"><input type="checkbox" name="nearby_borewell" checked={f.nearby_borewell} onChange={ch}/></Field><Field label="Nearby distance (m)"><input type="number" name="nearby_distance_m" value={f.nearby_distance_m} onChange={ch}/></Field><Field label="Nearby owner"><input name="nearby_borewell_owner" value={f.nearby_borewell_owner} onChange={ch}/></Field><Field label="Machine can reach"><input type="checkbox" name="machine_can_reach" checked={f.machine_can_reach} onChange={ch}/></Field><Field label="Site suitable"><input type="checkbox" name="site_suitable" checked={f.site_suitable} onChange={ch}/></Field><Field label="Decision"><select name="decision" value={f.decision} onChange={ch}><option value="pending">Pending</option><option value="suitable">Suitable</option><option value="not_suitable">Not suitable</option></select></Field><Field label="Latitude"><input type="number" step="0.0000001" name="latitude" value={f.latitude} onChange={ch}/></Field><Field label="Longitude"><input type="number" step="0.0000001" name="longitude" value={f.longitude} onChange={ch}/></Field><Field label="Notes" full><textarea name="notes" value={f.notes} onChange={ch} placeholder="Why accepted/rejected, access observations, nearby borewell notes..."/></Field><div className="form-actions"><button type="button" onClick={close}>Cancel</button><button className="primary">Save inspection</button></div></form></Modal>
}

function Jobs(){
  const [jobs,setJobs]=useState([]),[open,setOpen]=useState(false),[selected,setSelected]=useState(null),[refresh,setRefresh]=useState(0)
  useEffect(()=>{api("/jobs/").then(x=>setJobs(x.results||x))},[refresh])
  return <section><div className="page-head"><div><span className="eyebrow">FIELD WORKFLOW</span><h3>Drilling jobs</h3><p>Bookings, site checks, active drilling and completed work.</p></div><button className="primary" onClick={()=>setOpen(true)}><Plus size={16}/> Create job</button></div>
    <div className="toolbar"><div className="filter"><Search size={15}/><input placeholder="Filter jobs..."/></div><span>{jobs.length} records</span></div>
    <div className="table-card"><table><thead><tr><th>Job</th><th>Customer</th><th>Site</th><th>Machine</th><th>Status</th><th>Agreed</th></tr></thead><tbody>{jobs.map(j=><tr key={j.id} className="clickable-row" onClick={()=>setSelected(j)}><td><b>BT-{String(j.id).padStart(4,"0")}</b></td><td>{j.customer_name}</td><td>{j.site}</td><td>{j.machine_name||"—"}</td><td><span className={"status "+j.status}>{j.status.replace("_"," ")}</span></td><td>{money(j.agreed_total)}</td></tr>)}</tbody></table>{!jobs.length&&<Empty/>}</div>
    {open&&<JobForm close={()=>setOpen(false)} done={()=>{setOpen(false);setRefresh(x=>x+1)}}/>}
    {selected&&<JobWorkspace job={selected} close={()=>setSelected(null)}/>}
  </section>
}

function JobForm({close,done}){
  const [customers,setCustomers]=useState([]),[machines,setMachines]=useState([]),[agents,setAgents]=useState([])
  const [form,setForm]=useState({customer:"",agent:"",machine:"",site:"",status:"booked",agreed_total:"",advance:"",price_note:"",notes:""})
  useEffect(()=>{Promise.all([api("/customers/"),api("/machines/"),api("/agents/")]).then(([c,m,a])=>{setCustomers(c.results||c);setMachines(m.results||m);setAgents(a.results||a)})},[])
  const change=e=>setForm({...form,[e.target.name]:e.target.value})
  async function save(e){e.preventDefault();await api("/jobs/",{method:"POST",body:JSON.stringify({...form,customer:Number(form.customer),agent:form.agent?Number(form.agent):null,machine:form.machine?Number(form.machine):null,agreed_total:Number(form.agreed_total||0),advance:Number(form.advance||0)})});done()}
  return <Modal title="Create drilling job" close={close}><form className="form-grid" onSubmit={save}>
    <Field label="Customer"><select name="customer" required value={form.customer} onChange={change}><option value="">Select customer</option>{customers.map(x=><option value={x.id} key={x.id}>{x.name}</option>)}</select></Field>
    <Field label="Agent"><select name="agent" value={form.agent} onChange={change}><option value="">None</option>{agents.map(x=><option value={x.id} key={x.id}>{x.name}</option>)}</select></Field>
    <Field label="Machine"><select name="machine" value={form.machine} onChange={change}><option value="">Unassigned</option>{machines.map(x=><option value={x.id} key={x.id}>{x.name} — {x.status}</option>)}</select></Field>
    <Field label="Status"><select name="status" value={form.status} onChange={change}>{["site_check","booked","active","completed","cancelled"].map(x=><option key={x}>{x}</option>)}</select></Field>
    <Field label="Site / point location" full><input name="site" required value={form.site} onChange={change} placeholder="Village, road, farm / location"/></Field>
    <Field label="Agreed total"><input name="agreed_total" type="number" value={form.agreed_total} onChange={change}/></Field>
    <Field label="Advance"><input name="advance" type="number" value={form.advance} onChange={change}/></Field>
    <Field label="Price note" full><textarea name="price_note" value={form.price_note} onChange={change} placeholder="Keep agreed historical rate details here"/></Field>
    <Field label="Notes" full><textarea name="notes" value={form.notes} onChange={change}/></Field>
    <div className="form-actions"><button type="button" onClick={close}>Cancel</button><button className="primary">Save job</button></div>
  </form></Modal>
}

function Field({label,children,full=false}){return <label className={full?"full":""}>{label}{children}</label>}
function Modal({title,close,children}){return <div className="modal-backdrop"><div className="modal"><div className="modal-head"><h3>{title}</h3><button onClick={close}><X size={18}/></button></div>{children}</div></div>}

function Crud({title,endpoint,columns,fields}){
  const [rows,setRows]=useState([]),[open,setOpen]=useState(false),[refresh,setRefresh]=useState(0)
  useEffect(()=>{api(endpoint).then(x=>setRows(x.results||x))},[endpoint,refresh])
  return <section><div className="page-head"><div><span className="eyebrow">MASTER DATA</span><h3>{title}</h3><p>Manage {title.toLowerCase()} records through the REST API.</p></div><button className="primary" onClick={()=>setOpen(true)}><Plus size={16}/> Add {title.slice(0,-1)}</button></div>
    <div className="toolbar"><div className="filter"><Search size={15}/><input placeholder={`Search ${title.toLowerCase()}...`}/></div><span>{rows.length} records</span></div>
    <div className="table-card"><table><thead><tr>{columns.map(c=><th key={c}>{c.replace("_"," ")}</th>)}</tr></thead><tbody>{rows.map(r=><tr key={r.id}>{columns.map(c=><td key={c}>{typeof r[c]==="boolean"?r[c]?"Yes":"No":r[c]??"—"}</td>)}</tr>)}</tbody></table>{!rows.length&&<Empty/>}</div>
    {open&&<SimpleForm title={`Add ${title.slice(0,-1)}`} endpoint={endpoint} fields={fields} close={()=>setOpen(false)} done={()=>{setOpen(false);setRefresh(x=>x+1)}}/>}
  </section>
}

function SimpleForm({title,endpoint,fields,close,done}){
  const [form,setForm]=useState(Object.fromEntries(fields.map(x=>[x,x==="active"?true:""])))
  const [saving,setSaving]=useState(false)
  const change=e=>setForm({...form,[e.target.name]:e.target.type==="checkbox"?e.target.checked:e.target.value})
  async function save(e){e.preventDefault();setSaving(true);try{
    const out={...form}
    for(const k of ["agent","worker","job","machine","point"]) if(out[k]==="") out[k]=null; else if(out[k]!=null) out[k]=Number(out[k])
    if(out.amount) out.amount=Number(out.amount); if(out.daily_wage) out.daily_wage=Number(out.daily_wage); if(out.hour_meter) out.hour_meter=Number(out.hour_meter); if(out.cost) out.cost=Number(out.cost)
    await api(endpoint,{method:"POST",body:JSON.stringify(out)});done()
  }catch(err){alert(err.message)}finally{setSaving(false)}}
  return <Modal title={title} close={close}><form className="form-grid" onSubmit={save}>{fields.map(f=><Field key={f} label={f.replaceAll("_"," ")} full={["address","notes","description"].includes(f)}>{f==="active"||f==="present"?<input name={f} type="checkbox" checked={!!form[f]} onChange={change}/>:<input name={f} value={form[f]} onChange={change} placeholder={f}/>}</Field>)}<div className="form-actions"><button type="button" onClick={close}>Cancel</button><button className="primary" disabled={saving}>{saving?"Saving…":"Save"}</button></div></form></Modal>
}

function UsersPage(){
  const [rows,setRows]=useState([]),[open,setOpen]=useState(false),[refresh,setRefresh]=useState(0)
  useEffect(()=>{api("/users/").then(setRows).catch(err=>alert(err.message))},[refresh])
  return <section><div className="page-head"><div><span className="eyebrow">ACCESS CONTROL</span><h3>Users & permissions</h3><p>Create staff accounts and assign the access level they need for BoreTrack.</p></div><button className="primary" onClick={()=>setOpen(true)}><Plus size={16}/> Add user</button></div>
    <div className="role-strip">
      <span><b>Owner</b> Full access</span><span><b>Manager</b> Operations</span><span><b>Office Staff</b> Office + payments</span><span><b>Supervisor</b> Field operations</span><span><b>Driver</b> Assigned field work</span><span><b>Worker</b> Attendance</span><span><b>Accountant</b> Finance</span>
    </div>
    <div className="table-card"><table><thead><tr><th>User</th><th>Role</th><th>Phone</th><th>Job title</th><th>Status</th><th>Actions</th></tr></thead><tbody>{rows.map(r=><tr key={r.id}><td><b>{r.username}</b><small className="table-sub">{r.email||"No email"}</small></td><td><span className="role-badge">{r.role_display||r.role}</span></td><td>{r.phone||"—"}</td><td>{r.job_title||"—"}</td><td><span className={"status "+(r.is_active?"active":"cancelled")}>{r.is_active?"Active":"Disabled"}</span></td><td><button className="table-action" onClick={()=>setOpen({user:r})}>Edit</button></td></tr>)}</tbody></table>{!rows.length&&<Empty/>}</div>
    {open&&<UserForm existing={open.user} close={()=>setOpen(false)} done={()=>{setOpen(false);setRefresh(x=>x+1)}}/>}
  </section>
}

function UserForm({existing,close,done}){
  const [form,setForm]=useState({username:existing?.username||"",password:"",first_name:existing?.first_name||"",last_name:existing?.last_name||"",email:existing?.email||"",role:existing?.role||"worker",phone:existing?.phone||"",job_title:existing?.job_title||"",is_active:existing?.is_active??true})
  const [saving,setSaving]=useState(false)
  const change=e=>setForm({...form,[e.target.name]:e.target.type==="checkbox"?e.target.checked:e.target.value})
  async function save(e){e.preventDefault();setSaving(true);try{
    if(existing){
      const body={first_name:form.first_name,last_name:form.last_name,email:form.email,role:form.role,phone:form.phone,job_title:form.job_title,is_active:form.is_active}
      if(form.password) body.password=form.password
      await api(`/users/${existing.id}/`,{method:"PATCH",body:JSON.stringify(body)})
    }else{
      await api("/users/",{method:"POST",body:JSON.stringify(form)})
    }
    done()
  }catch(err){alert(err.message)}finally{setSaving(false)}}
  return <Modal title={existing?`Edit ${existing.username}`:"Create user"} close={close}><form className="form-grid" onSubmit={save}>
    <Field label="Username"><input name="username" required disabled={!!existing} value={form.username} onChange={change}/></Field>
    <Field label={existing?"New password (optional)":"Password"}><input name="password" type="password" required={!existing} minLength={6} value={form.password} onChange={change}/></Field>
    <Field label="First name"><input name="first_name" value={form.first_name} onChange={change}/></Field>
    <Field label="Last name"><input name="last_name" value={form.last_name} onChange={change}/></Field>
    <Field label="Email"><input name="email" type="email" value={form.email} onChange={change}/></Field>
    <Field label="Role"><select name="role" value={form.role} onChange={change}>{[["owner","Owner"],["manager","Manager"],["office","Office Staff"],["supervisor","Site Supervisor"],["driver","Driver"],["worker","Worker"],["accountant","Accountant"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></Field>
    <Field label="Phone"><input name="phone" value={form.phone} onChange={change}/></Field>
    <Field label="Job title"><input name="job_title" value={form.job_title} onChange={change}/></Field>
    {existing&&<Field label="Active"><input name="is_active" type="checkbox" checked={!!form.is_active} onChange={change}/></Field>}
    <div className="form-actions"><button type="button" onClick={close}>Cancel</button><button className="primary" disabled={saving}>{saving?"Saving…":existing?"Save changes":"Create user"}</button></div>
  </form></Modal>
}


function JobWorkspace({job,close}){
 const [points,setPoints]=useState([]),[casing,setCasing]=useState([]),[charges,setCharges]=useState([]),[payments,setPayments]=useState([]),[busy,setBusy]=useState(true),[tab,setTab]=useState("overview")
 const unwrap=x=>x.results||x
 const load=()=>Promise.all([api(`/points/?job=${job.id}`),api(`/casing/?job=${job.id}`),api(`/charges/?job=${job.id}`),api(`/payments/?job=${job.id}`)]).then(([p,c,ch,pay])=>{setPoints(unwrap(p));setCasing(unwrap(c));setCharges(unwrap(ch));setPayments(unwrap(pay))}).catch(e=>alert(e.message)).finally(()=>setBusy(false))
 useEffect(()=>{load()},[job.id])
 const paid=payments.reduce((a,x)=>a+Number(x.amount||0),0), depth=points.reduce((a,x)=>a+Number(x.calculated_depth||0),0)
 const drilling=points.reduce((a,x)=>a+Number(x.calculated_depth||0)*Number(x.drilling_rate||0),0)
 const casingTotal=casing.filter(x=>x.source==='business').reduce((a,x)=>a+Number(x.quantity_feet||0)*Number(x.rate||0),0)
 const chargesTotal=charges.reduce((a,x)=>a+Number(x.amount||0),0)
 return <div className="modal-backdrop"><div className="modal job-workspace"><div className="modal-head"><div><span className="eyebrow">JOB WORKSPACE</span><h3>BT-{String(job.id).padStart(4,"0")} · {job.customer_name}</h3><small>{job.site} · {job.status.replace("_"," ")}</small></div><button onClick={close}><X size={18}/></button></div>
  <div className="job-summary"><Metric value={money(job.agreed_total)} label="Agreed total"/><Metric value={money(paid)} label="Payments received"/><Metric value={money(Math.max(Number(job.agreed_total||0)-paid,0))} label="Outstanding"/><Metric value={`${depth.toFixed(0)} ft`} label="Recorded depth"/></div>
  <div className="tabs">{[["overview","Overview"],["points","Points / drilling"],["casing","Casing"],["charges","Charges"],["payments","Payments"]].map(([k,l])=><button key={k} className={tab===k?"active":""} onClick={()=>setTab(k)}>{l}</button>)}</div>
  {busy?<Loading/>:<>{tab==='overview'&&<div className="workspace-grid"><Panel title="Job details" sub="Current operational record"><div className="detail-list"><div><span>Customer</span><b>{job.customer_name}</b></div><div><span>Agent</span><b>{job.agent_name||'Direct / none'}</b></div><div><span>Machine</span><b>{job.machine_name||'Unassigned'}</b></div><div><span>Site</span><b>{job.site}</b></div><div><span>Status</span><b>{job.status.replace('_',' ')}</b></div><div><span>Advance</span><b>{money(job.advance)}</b></div></div></Panel><Panel title="Operational value" sub="Calculated from recorded lines"><div className="detail-list"><div><span>Drilling value</span><b>{money(drilling)}</b></div><div><span>Business casing</span><b>{money(casingTotal)}</b></div><div><span>Other charges</span><b>{money(chargesTotal)}</b></div><div><span>Payments</span><b>{money(paid)}</b></div></div></Panel></div>}
   {tab==='points'&&<PointsPanel job={job} rows={points} reload={load}/>} {tab==='casing'&&<CasingPanel job={job} rows={casing} reload={load}/>} {tab==='charges'&&<ChargesPanel job={job} points={points} rows={charges} reload={load}/>} {tab==='payments'&&<PaymentsPanel job={job} rows={payments} reload={load}/>}</>}
 </div></div>
}
function SectionAdd({children}){return <div className="section-add">{children}</div>}
function PointsPanel({job,rows,reload}){const [open,setOpen]=useState(false);return <Panel title="Drilling points" sub="Validated calculation: rods × 15 ft + inner/imer + bit"><SectionAdd><button className="primary" onClick={()=>setOpen(true)}><Plus size={15}/> Add point</button></SectionAdd><div className="mini-table"><table><thead><tr><th>Point</th><th>Result</th><th>Rods</th><th>Depth</th><th>Rate</th><th>Value</th></tr></thead><tbody>{rows.map(x=><tr key={x.id}><td><b>{x.name}</b></td><td><span className={'status '+x.result}>{x.result}</span></td><td>{x.rods}</td><td>{Number(x.calculated_depth||0).toFixed(0)} ft</td><td>{money(x.drilling_rate)}/ft</td><td>{money(Number(x.calculated_depth||0)*Number(x.drilling_rate||0))}</td></tr>)}</tbody></table>{!rows.length&&<Empty/>}</div>{open&&<PointForm job={job} close={()=>setOpen(false)} done={()=>{setOpen(false);reload()}}/>}</Panel>}
function PointForm({job,close,done}){const [f,setF]=useState({name:'P1',result:'pending',rods:'0',inner_feet:'5',bit_feet:'0',drilling_rate:'70',notes:''});const depth=Number(f.rods||0)*15+Number(f.inner_feet||0)+Number(f.bit_feet||0);const ch=e=>setF({...f,[e.target.name]:e.target.value});async function save(e){e.preventDefault();try{await api('/points/',{method:'POST',body:JSON.stringify({...f,job:job.id,rods:Number(f.rods),inner_feet:Number(f.inner_feet),bit_feet:Number(f.bit_feet),drilling_rate:Number(f.drilling_rate)})});done()}catch(err){alert(err.message)}}return <Modal title="Add drilling point" close={close}><form className="form-grid" onSubmit={save}><Field label="Point name"><input name="name" value={f.name} onChange={ch}/></Field><Field label="Result"><select name="result" value={f.result} onChange={ch}><option value="pending">Pending</option><option value="passed">Passed</option><option value="failed">Failed</option></select></Field><Field label="Rods"><input name="rods" type="number" min="0" value={f.rods} onChange={ch}/></Field><Field label="Inner / imer (ft)"><input name="inner_feet" type="number" value={f.inner_feet} onChange={ch}/></Field><Field label="Bit (ft)"><input name="bit_feet" type="number" value={f.bit_feet} onChange={ch}/></Field><Field label="Drilling rate / ft"><input name="drilling_rate" type="number" value={f.drilling_rate} onChange={ch}/></Field><div className="calc-box full"><span>Calculated depth</span><b>{depth.toFixed(0)} ft</b><small>({f.rods||0} × 15) + {f.inner_feet||0} + {f.bit_feet||0}</small></div><Field label="Notes" full><textarea name="notes" value={f.notes} onChange={ch}/></Field><div className="form-actions"><button type="button" onClick={close}>Cancel</button><button className="primary">Save point</button></div></form></Modal>}
function CasingPanel({job,rows,reload}){const [open,setOpen]=useState(false);return <Panel title="Casing lines" sub="Company, type, source, quantity and historical rate"><SectionAdd><button className="primary" onClick={()=>setOpen(true)}><Plus size={15}/> Add casing</button></SectionAdd><div className="mini-table"><table><thead><tr><th>Company</th><th>Type</th><th>Source</th><th>Feet</th><th>Rate</th><th>Value</th></tr></thead><tbody>{rows.map(x=><tr key={x.id}><td>{x.company}</td><td>{x.casing_type}</td><td>{x.source}</td><td>{x.quantity_feet}</td><td>{money(x.rate)}/ft</td><td>{x.source==='customer'?money(0):money(Number(x.quantity_feet||0)*Number(x.rate||0))}</td></tr>)}</tbody></table>{!rows.length&&<Empty/>}</div>{open&&<CasingForm job={job} close={()=>setOpen(false)} done={()=>{setOpen(false);reload()}}/>}</Panel>}
function CasingForm({job,close,done}){const [f,setF]=useState({company:'Sudhakar',casing_type:'Normal',source:'business',quantity_feet:'0',rate:'350',note:''});const ch=e=>setF({...f,[e.target.name]:e.target.value});async function save(e){e.preventDefault();try{await api('/casing/',{method:'POST',body:JSON.stringify({...f,job:job.id,quantity_feet:Number(f.quantity_feet),rate:Number(f.rate)})});done()}catch(err){alert(err.message)}}return <Modal title="Add casing line" close={close}><form className="form-grid" onSubmit={save}><Field label="Company"><input name="company" value={f.company} onChange={ch}/></Field><Field label="Casing type"><input name="casing_type" value={f.casing_type} onChange={ch}/></Field><Field label="Source"><select name="source" value={f.source} onChange={ch}><option value="business">Business supplied</option><option value="customer">Customer supplied</option></select></Field><Field label="Quantity (ft)"><input name="quantity_feet" type="number" value={f.quantity_feet} onChange={ch}/></Field><Field label="Rate / ft"><input name="rate" type="number" value={f.rate} onChange={ch}/></Field><Field label="Note" full><textarea name="note" value={f.note} onChange={ch}/></Field><div className="form-actions"><button type="button" onClick={close}>Cancel</button><button className="primary">Save casing</button></div></form></Modal>}
function ChargesPanel({job,points,rows,reload}){const [open,setOpen]=useState(false);return <Panel title="Job charges" sub="Jali, Freshing, Bata, transport and other flexible lines"><SectionAdd><button className="primary" onClick={()=>setOpen(true)}><Plus size={15}/> Add charge</button></SectionAdd><div className="mini-table"><table><thead><tr><th>Type</th><th>Point</th><th>Qty</th><th>Unit</th><th>Rate</th><th>Amount</th></tr></thead><tbody>{rows.map(x=><tr key={x.id}><td>{x.charge_type.replace('_',' ')}</td><td>{x.point||'—'}</td><td>{x.quantity}</td><td>{x.unit}</td><td>{money(x.rate)}</td><td><b>{money(x.amount)}</b></td></tr>)}</tbody></table>{!rows.length&&<Empty/>}</div>{open&&<ChargeForm job={job} points={points} close={()=>setOpen(false)} done={()=>{setOpen(false);reload()}}/>}</Panel>}
function ChargeForm({job,points,close,done}){const presets={drilling:['ft','70'],jali:['ft','550'],normal_casing:['ft','350'],freshing:['ft','45'],bata:['worker','1000'],transport:['job','1000'],other:['job','0']};const [f,setF]=useState({charge_type:'jali',point:'',description:'',quantity:'0',unit:'ft',rate:'550'});const ch=e=>setF({...f,[e.target.name]:e.target.value});function typeChange(e){const v=e.target.value;setF({...f,charge_type:v,unit:presets[v][0],rate:presets[v][1]})}async function save(e){e.preventDefault();try{const q=Number(f.quantity||0),r=Number(f.rate||0);await api('/charges/',{method:'POST',body:JSON.stringify({...f,job:job.id,point:f.point?Number(f.point):null,quantity:q,rate:r,amount:q*r})});done()}catch(err){alert(err.message)}}return <Modal title="Add job charge" close={close}><form className="form-grid" onSubmit={save}><Field label="Charge type"><select name="charge_type" value={f.charge_type} onChange={typeChange}>{['drilling','jali','normal_casing','freshing','bata','transport','other'].map(x=><option key={x}>{x}</option>)}</select></Field><Field label="Point"><select name="point" value={f.point} onChange={ch}><option value="">Job level</option>{points.map(x=><option value={x.id} key={x.id}>{x.name}</option>)}</select></Field><Field label="Quantity"><input name="quantity" type="number" value={f.quantity} onChange={ch}/></Field><Field label="Unit"><input name="unit" value={f.unit} onChange={ch}/></Field><Field label="Rate"><input name="rate" type="number" value={f.rate} onChange={ch}/></Field><Field label="Amount"><input value={money(Number(f.quantity||0)*Number(f.rate||0))} readOnly/></Field><Field label="Description" full><input name="description" value={f.description} onChange={ch}/></Field><div className="form-actions"><button type="button" onClick={close}>Cancel</button><button className="primary">Save charge</button></div></form></Modal>}
function PaymentsPanel({job,rows,reload}){const [open,setOpen]=useState(false);return <Panel title="Payments received" sub="Customer receipts linked to this job"><SectionAdd><button className="primary" onClick={()=>setOpen(true)}><Plus size={15}/> Record payment</button></SectionAdd><div className="mini-table"><table><thead><tr><th>Date</th><th>Amount</th><th>Method</th><th>Reference</th></tr></thead><tbody>{rows.map(x=><tr key={x.id}><td>{String(x.received_at||'').slice(0,10)}</td><td><b>{money(x.amount)}</b></td><td>{x.method}</td><td>{x.reference||'—'}</td></tr>)}</tbody></table>{!rows.length&&<Empty/>}</div>{open&&<JobPaymentForm job={job} close={()=>setOpen(false)} done={()=>{setOpen(false);reload()}}/>}</Panel>}
function JobPaymentForm({job,close,done}){const [f,setF]=useState({amount:'',method:'cash',reference:'',note:''});const ch=e=>setF({...f,[e.target.name]:e.target.value});async function save(e){e.preventDefault();try{await api('/payments/',{method:'POST',body:JSON.stringify({...f,job:job.id,amount:Number(f.amount)})});done()}catch(err){alert(err.message)}}return <Modal title="Record payment" close={close}><form className="form-grid" onSubmit={save}><Field label="Amount"><input name="amount" type="number" required value={f.amount} onChange={ch}/></Field><Field label="Method"><select name="method" value={f.method} onChange={ch}><option>cash</option><option>bank transfer</option><option>UPI</option><option>cheque</option><option>other</option></select></Field><Field label="Reference"><input name="reference" value={f.reference} onChange={ch}/></Field><Field label="Note" full><input name="note" value={f.note} onChange={ch}/></Field><div className="form-actions"><button type="button" onClick={close}>Cancel</button><button className="primary">Save payment</button></div></form></Modal>}

function Pricing(){
  const [cards,setCards]=useState([]),[open,setOpen]=useState(false),[selected,setSelected]=useState(null),[refresh,setRefresh]=useState(0)
  useEffect(()=>{api('/rate-cards/').then(x=>setCards(x.results||x)).catch(e=>alert(e.message))},[refresh])
  return <section><div className="page-head"><div><span className="eyebrow">RATE CONTROL</span><h3>Pricing & rate cards</h3><p>Version your business rates without changing historical job charges.</p></div><button className="primary" onClick={()=>setOpen(true)}><Plus size={16}/> New rate card</button></div>
    <div className="dash-grid">{cards.map(c=><div className="panel" key={c.id}><div className="panel-head"><div><h4>{c.name}</h4><small>Effective {c.effective_from}{c.effective_to?` → ${c.effective_to}`:''} · {c.season||'No season'}</small></div><span className={c.active?'status active':'status cancelled'}>{c.active?'Active':'Inactive'}</span></div><div className="mini-table"><table><thead><tr><th>Charge</th><th>Unit</th><th>Rate</th><th>Casing</th></tr></thead><tbody>{(c.lines||[]).map(l=><tr key={l.id}><td>{l.charge_type_display||l.charge_type.replace('_',' ')}</td><td>{l.unit}</td><td><b>{money(l.rate)}</b></td><td>{l.casing_company||l.casing_type?`${l.casing_company||''} ${l.casing_type||''}`:'—'}</td></tr>)}</tbody></table>{!(c.lines||[]).length&&<Empty/>}</div><div className="form-actions"><button onClick={()=>setSelected(c)}>Add rate line</button></div></div>)}</div>
    {!cards.length&&<Empty/>}
    {open&&<RateCardForm close={()=>setOpen(false)} done={()=>{setOpen(false);setRefresh(x=>x+1)}}/>}
    {selected&&<RateLineForm card={selected} close={()=>setSelected(null)} done={()=>{setSelected(null);setRefresh(x=>x+1)}}/>}
  </section>
}
function RateCardForm({close,done}){const [f,setF]=useState({name:'',effective_from:new Date().toISOString().slice(0,10),effective_to:'',season:'Summer',active:true,notes:''});const ch=e=>setF({...f,[e.target.name]:e.target.type==='checkbox'?e.target.checked:e.target.value});async function save(e){e.preventDefault();try{await api('/rate-cards/',{method:'POST',body:JSON.stringify({...f,effective_to:f.effective_to||null})});done()}catch(err){alert(err.message)}}return <Modal title="Create rate card" close={close}><form className="form-grid" onSubmit={save}><Field label="Name"><input name="name" required value={f.name} onChange={ch}/></Field><Field label="Effective from"><input name="effective_from" type="date" required value={f.effective_from} onChange={ch}/></Field><Field label="Effective to"><input name="effective_to" type="date" value={f.effective_to} onChange={ch}/></Field><Field label="Season"><input name="season" value={f.season} onChange={ch}/></Field><Field label="Active"><input name="active" type="checkbox" checked={f.active} onChange={ch}/></Field><Field label="Notes" full><textarea name="notes" value={f.notes} onChange={ch}/></Field><div className="form-actions"><button type="button" onClick={close}>Cancel</button><button className="primary">Create card</button></div></form></Modal>}
function RateLineForm({card,close,done}){const [f,setF]=useState({charge_type:'drilling',unit:'ft',rate:'70',casing_company:'',casing_type:'',note:''});const ch=e=>setF({...f,[e.target.name]:e.target.value});async function save(e){e.preventDefault();try{await api('/rate-lines/',{method:'POST',body:JSON.stringify({...f,rate:Number(f.rate),rate_card:card.id})});done()}catch(err){alert(err.message)}}return <Modal title={`Add rate · ${card.name}`} close={close}><form className="form-grid" onSubmit={save}><Field label="Charge type"><select name="charge_type" value={f.charge_type} onChange={ch}>{[['drilling','Drilling'],['jali','Jali'],['normal_casing','Normal Casing'],['freshing','Freshing'],['bata','Bata'],['transport','Transport'],['other','Other']].map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></Field><Field label="Unit"><input name="unit" value={f.unit} onChange={ch}/></Field><Field label="Rate"><input name="rate" type="number" step="0.01" value={f.rate} onChange={ch}/></Field><Field label="Casing company"><input name="casing_company" placeholder="Sudhakar" value={f.casing_company} onChange={ch}/></Field><Field label="Casing type"><input name="casing_type" placeholder="Normal" value={f.casing_type} onChange={ch}/></Field><Field label="Note" full><textarea name="note" value={f.note} onChange={ch}/></Field><div className="form-actions"><button type="button" onClick={close}>Cancel</button><button className="primary">Save rate</button></div></form></Modal>}

function Profitability(){
 const [data,setData]=useState(null)
 useEffect(()=>{api("/reports/profitability/").then(setData).catch(e=>alert(e.message))},[])
 if(!data)return <Loading/>
 const s=data.summary
 return <section>
   <div className="page-head"><div><span className="eyebrow">FINANCIAL CONTROL</span><h3>Job Profitability</h3><p>See cash revenue and recorded operating costs job-by-job.</p></div></div>
   <div className="notice"><b>How this view works:</b> revenue is recorded customer payments. Costs use job-linked fuel logs, present-attendance base wages, job-linked breakdown repairs and other job expenses. Overtime is excluded until the business rule is validated.</div>
   <div className="report-cards">
    <div className="report-card"><span>Cash revenue</span><b>{money(s.revenue)}</b></div>
    <div className="report-card"><span>Total operating cost</span><b>{money(s.cost)}</b></div>
    <div className="report-card"><span>Estimated job profit</span><b>{money(s.profit)}</b></div>
    <div className="report-card"><span>Margin</span><b>{Number(s.margin_percent||0).toFixed(1)}%</b></div>
   </div>
   <div className="table-card"><table><thead><tr><th>Job</th><th>Customer</th><th>Status</th><th>Revenue</th><th>Fuel</th><th>Workers</th><th>Repairs</th><th>Other</th><th>Total cost</th><th>Profit</th><th>Margin</th></tr></thead><tbody>
    {data.jobs.map(x=><tr key={x.job_id}><td><b>{x.job_code}</b></td><td>{x.customer}</td><td><span className={`status ${x.status}`}>{x.status.replace('_',' ')}</span></td><td>{money(x.revenue)}</td><td>{money(x.fuel_cost)}</td><td>{money(x.worker_cost)}</td><td>{money(x.maintenance_cost)}</td><td>{money(x.other_cost)}</td><td><b>{money(x.total_cost)}</b></td><td><b>{money(x.profit)}</b></td><td>{Number(x.margin_percent||0).toFixed(1)}%</td></tr>)}
   </tbody></table>{!data.jobs.length&&<Empty/>}</div>
   {data.unallocated_expenses>0&&<div className="notice" style={{marginTop:14}}><b>Unallocated expenses:</b> {money(data.unallocated_expenses)}. These expenses have no job and are not included in the job-level profitability totals.</div>}
   <div className="panel" style={{marginTop:14}}><div className="panel-head"><div><h4>Calculation notes</h4><small>Designed to avoid silently inventing business rules.</small></div></div><ul style={{margin:'14px 0 0 18px',padding:0,color:'#69756f',fontSize:12,lineHeight:1.8}}>{data.notes.map((n,i)=><li key={i}>{n}</li>)}</ul></div>
 </section>
}

function Reports(){
 const [r,setR]=useState(null),[o,setO]=useState(null)
 useEffect(()=>Promise.all([api("/reports/revenue/"),api("/reports/operations/")]).then(([a,b])=>{setR(a);setO(b)}),[])
 if(!r)return <Loading/>
 return <section><div className="page-head"><div><span className="eyebrow">BUSINESS INTELLIGENCE</span><h3>Reports</h3><p>High-level revenue and operational performance.</p></div></div>
 <div className="report-cards"><div className="report-card"><span>Total revenue</span><b>{money(r.revenue)}</b></div><div className="report-card"><span>Total expenses</span><b>{money(r.expenses)}</b></div><div className="report-card"><span>Net operating view</span><b>{money(r.net)}</b></div><div className="report-card"><span>Average revenue / job</span><b>{money(r.average_revenue_per_job)}</b></div></div>
 <div className="dash-grid"><Panel title="Job performance" sub="Current database totals"><StatusRow label="All jobs" value={r.jobs} tone="blue"/><StatusRow label="Completed" value={r.completed_jobs} tone="green"/></Panel><Panel title="Fleet" sub="Operational status">{o&&Object.entries(o.machines).map(([k,v])=><StatusRow key={k} label={k} value={v} tone={k==="available"?"green":k==="drilling"?"blue":"amber"}/>)}</Panel></div>
 </section>
}

createRoot(document.getElementById("root")).render(<App/>)
