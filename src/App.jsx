import { useEffect, useMemo, useState } from 'react';
import logo from './assets/logo.svg';

const JOB_COLORS = ['#2f6df6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];
const STATUS_OPTS = ['Planned', 'In progress', 'Complete'];
const JOB_STATUS_OPTS = ['Active', 'Hold', 'Complete'];

const defaultPeople = [
  { id: 'default-p1', name: 'Mina Lee', role: 'Project Lead', skill: 'Coordination' },
  { id: 'default-p2', name: 'Derek Cole', role: 'Engineer', skill: 'Design' },
  { id: 'default-p3', name: 'Rae Ortiz', role: 'Installer', skill: 'Field work' },
];

function blankTask() {
  return { id: crypto.randomUUID(), title: '', description: '', startDate: '', endDate: '', ownerId: '', jobId: '', status: 'Planned' };
}

function blankJob() {
  return { id: crypto.randomUUID(), name: '', client: '', dueDate: '', notes: '', status: 'Active' };
}

function formatDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function fmt(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${m}/${d}/${y.slice(2)}`;
}

// Derive live notifications from task state — no backend yet.
// Delivery stub: to send email/push, call an API here with the notification payload.
function deriveNotifications(tasks) {
  const todayStr = formatDate(new Date());
  const todayMs = new Date().setHours(0, 0, 0, 0);
  const tomorrowStr = formatDate(new Date(todayMs + 86400000));
  const in2DaysStr = formatDate(new Date(todayMs + 2 * 86400000));
  const notes = [];
  tasks.forEach((t) => {
    if (t.status === 'Complete' || !t.endDate) return;
    if (t.endDate < todayStr) {
      notes.push({ id: `overdue-${t.id}`, taskId: t.id, type: 'overdue', message: `"${t.title}" is overdue (ended ${fmt(t.endDate)})` });
    } else if (t.endDate <= in2DaysStr) {
      const when = t.endDate === todayStr ? 'today' : t.endDate === tomorrowStr ? 'tomorrow' : 'in 2 days';
      notes.push({ id: `due-soon-${t.id}`, taskId: t.id, type: 'due-soon', message: `"${t.title}" is due ${when}` });
    } else if (t.startDate && t.startDate >= todayStr && t.startDate <= tomorrowStr) {
      const when = t.startDate === todayStr ? 'today' : 'tomorrow';
      notes.push({ id: `starting-${t.id}`, taskId: t.id, type: 'starting', message: `"${t.title}" starts ${when}` });
    }
  });
  return notes;
}

function statusColor(s) {
  if (s === 'Complete') return '#22c55e';
  if (s === 'In progress') return '#f59e0b';
  return '#2f6df6';
}

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}

export default function App() {
  const [people, setPeople] = useState(() => load('jb-people', defaultPeople));
  const [jobs, setJobs] = useState(() => load('jb-jobs', []));
  const [tasks, setTasks] = useState(() => load('jb-tasks', []));
  const [dismissed, setDismissed] = useState(() => load('jb-dismissed', []));

  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [activeTab, setActiveTab] = useState('planner');
  const [showNotifs, setShowNotifs] = useState(false);
  const [jobForm, setJobForm] = useState(blankJob);
  const [taskForm, setTaskForm] = useState(blankTask);
  const [personForm, setPersonForm] = useState({ name: '', role: '', skill: '' });

  useEffect(() => localStorage.setItem('jb-people', JSON.stringify(people)), [people]);
  useEffect(() => localStorage.setItem('jb-jobs', JSON.stringify(jobs)), [jobs]);
  useEffect(() => localStorage.setItem('jb-tasks', JSON.stringify(tasks)), [tasks]);
  useEffect(() => localStorage.setItem('jb-dismissed', JSON.stringify(dismissed)), [dismissed]);

  // Auto-select first job in task form when jobs load
  useEffect(() => {
    if (jobs.length) setTaskForm((p) => (p.jobId ? p : { ...p, jobId: jobs[0].id }));
  }, [jobs]);

  // --- notifications ---
  const allNotifs = useMemo(() => deriveNotifications(tasks), [tasks]);
  const activeNotifs = useMemo(() => allNotifs.filter((n) => !dismissed.includes(n.id)), [allNotifs, dismissed]);
  const dismissNotif = (id) => setDismissed((p) => [...p, id]);
  const dismissAll = () => setDismissed((p) => [...p, ...activeNotifs.map((n) => n.id)]);

  // --- jobs CRUD ---
  const addJob = (e) => {
    e.preventDefault();
    if (!jobForm.name.trim()) return;
    setJobs((p) => [{ ...jobForm, id: crypto.randomUUID(), name: jobForm.name.trim(), client: jobForm.client.trim() }, ...p]);
    setJobForm(blankJob());
  };
  const deleteJob = (id) => {
    setJobs((p) => p.filter((j) => j.id !== id));
    setTasks((p) => p.filter((t) => t.jobId !== id));
  };

  // --- tasks CRUD ---
  const addTask = (e) => {
    e.preventDefault();
    if (!taskForm.title.trim() || !taskForm.startDate || !taskForm.endDate || !taskForm.jobId) return;
    setTasks((p) => [...p, { ...taskForm, title: taskForm.title.trim(), description: taskForm.description.trim() }]);
    setTaskForm({ ...blankTask(), jobId: jobs[0]?.id || '' });
  };
  const deleteTask = (id) => setTasks((p) => p.filter((t) => t.id !== id));
  const updateTask = (id, patch) => setTasks((p) => p.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  // --- people CRUD ---
  const addPerson = (e) => {
    e.preventDefault();
    if (!personForm.name.trim()) return;
    setPeople((p) => [...p, { id: crypto.randomUUID(), name: personForm.name.trim(), role: personForm.role.trim() || 'Team member', skill: personForm.skill.trim() || 'General' }]);
    setPersonForm({ name: '', role: '', skill: '' });
  };
  const deletePerson = (id) => {
    setPeople((p) => p.filter((person) => person.id !== id));
    setTasks((p) => p.map((t) => (t.ownerId === id ? { ...t, ownerId: '' } : t)));
  };

  // --- calendar ---
  const monthDays = useMemo(() => {
    const [year, month] = selectedDate.split('-').map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const startDay = firstDay.getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    const cells = [];
    for (let i = 0; i < startDay; i++) cells.push({ date: new Date(year, month - 1, i - startDay + 1), isCurrentMonth: false });
    for (let d = 1; d <= daysInMonth; d++) cells.push({ date: new Date(year, month - 1, d), isCurrentMonth: true });
    while (cells.length % 7 !== 0) cells.push({ date: new Date(year, month, cells.length - daysInMonth - startDay + 1), isCurrentMonth: false });
    return cells;
  }, [selectedDate]);

  const todayStr = formatDate(new Date());
  const tasksForDate = useMemo(() => tasks.filter((t) => t.startDate <= selectedDate && t.endDate >= selectedDate), [tasks, selectedDate]);

  // --- gantt ---
  const ganttData = useMemo(() => {
    const [year, month] = selectedDate.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const pad = (n) => String(n).padStart(2, '0');
    const monthStart = `${year}-${pad(month)}-01`;
    const monthEnd = `${year}-${pad(month)}-${pad(daysInMonth)}`;

    const rows = tasks
      .filter((t) => t.endDate >= monthStart && t.startDate <= monthEnd)
      .map((t) => {
        const effStart = t.startDate < monthStart ? monthStart : t.startDate;
        const effEnd = t.endDate > monthEnd ? monthEnd : t.endDate;
        const startDay = parseInt(effStart.split('-')[2]);
        const endDay = parseInt(effEnd.split('-')[2]);
        const left = ((startDay - 1) / daysInMonth) * 100;
        const width = Math.max(((endDay - startDay + 1) / daysInMonth) * 100, 0.5);
        const jobIdx = jobs.findIndex((j) => j.id === t.jobId);
        const color = JOB_COLORS[Math.max(jobIdx, 0) % JOB_COLORS.length];
        const owner = people.find((p) => p.id === t.ownerId);
        const job = jobs.find((j) => j.id === t.jobId);
        return { ...t, left, width, color, ownerName: owner?.name || '', jobName: job?.name || '' };
      });

    const todayInMonth = todayStr >= monthStart && todayStr <= monthEnd;
    const todayDay = todayInMonth ? parseInt(todayStr.split('-')[2]) : null;
    const todayPct = todayDay !== null ? ((todayDay - 0.5) / daysInMonth) * 100 : null;

    return { rows, daysInMonth, todayPct };
  }, [tasks, jobs, people, selectedDate, todayStr]);

  const monthLabel = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(
    new Date(selectedDate.replace(/-/g, '/'))
  );

  return (
    <div className="app-shell">

      {/* ── Header ── */}
      <header className="topbar">
        <div className="brand-block">
          <img src={logo} alt="JobBoard" className="brand-icon" />
          <div>
            <p className="eyebrow">Project management</p>
            <h1>JobBoard</h1>
          </div>
        </div>
        <div className="top-actions">
          {['planner', 'people', 'jobs'].map((tab) => (
            <button key={tab} className={`pill${activeTab === tab ? ' active' : ''}`} onClick={() => setActiveTab(tab)}>
              {tab[0].toUpperCase() + tab.slice(1)}
            </button>
          ))}
          <div className="notif-wrap">
            <button className="notif-btn" onClick={() => setShowNotifs((s) => !s)} aria-label={`Notifications (${activeNotifs.length})`}>
              🔔{activeNotifs.length > 0 && <span className="notif-badge">{activeNotifs.length}</span>}
            </button>
            {showNotifs && (
              <div className="notif-panel">
                <div className="notif-header">
                  <strong>Notifications</strong>
                  {activeNotifs.length > 0 && <button className="notif-clear" onClick={dismissAll}>Clear all</button>}
                </div>
                {activeNotifs.length === 0
                  ? <p className="notif-empty">All clear</p>
                  : activeNotifs.map((n) => (
                    <div key={n.id} className={`notif-item ${n.type}`}>
                      <span>{n.message}</span>
                      <button onClick={() => dismissNotif(n.id)} aria-label="Dismiss">×</button>
                    </div>
                  ))
                }
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Stats ── */}
      <section className="hero-card">
        <div>
          <p className="eyebrow">Overview</p>
          <h2>Plan jobs, assign people, track progress.</h2>
          <p className="muted">Add jobs, break them into tasks, assign people, and watch the Gantt fill in.</p>
        </div>
        <div className="stats-grid">
          <div className="stat"><strong>{jobs.length}</strong><span>Jobs</span></div>
          <div className="stat"><strong>{people.length}</strong><span>People</span></div>
          <div className="stat"><strong>{tasks.length}</strong><span>Tasks</span></div>
          <div className="stat"><strong>{tasks.filter((t) => t.status === 'Complete').length}</strong><span>Done</span></div>
        </div>
      </section>

      {/* ── Calendar + Forms ── */}
      <main className="main-grid">
        <section className="panel calendar-panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Calendar</p>
              <h3>{monthLabel}</h3>
            </div>
            <input type="month" value={selectedDate.slice(0, 7)} onChange={(e) => setSelectedDate(`${e.target.value}-01`)} />
          </div>
          <div className="weekday-row">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <div key={d}>{d}</div>)}
          </div>
          <div className="calendar-grid">
            {monthDays.map((cell) => {
              const key = formatDate(cell.date);
              const cellTasks = tasks.filter((t) => t.startDate <= key && t.endDate >= key);
              return (
                <button
                  key={key}
                  className={['day-cell', cell.isCurrentMonth ? '' : 'muted', key === selectedDate ? 'selected' : '', key === todayStr ? 'today' : ''].filter(Boolean).join(' ')}
                  onClick={() => setSelectedDate(key)}
                >
                  <span className="day-number">{cell.date.getDate()}</span>
                  <div className="mini-list">
                    {cellTasks.slice(0, 2).map((t) => (
                      <span key={t.id} style={{ background: `${statusColor(t.status)}2a` }}>{t.title}</span>
                    ))}
                    {cellTasks.length > 2 && <span className="more">+{cellTasks.length - 2}</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="panel forms-panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Quick entry</p>
              <h3>{activeTab === 'planner' ? 'Add a task' : activeTab === 'people' ? 'Add a person' : 'Add a job'}</h3>
            </div>
          </div>

          {activeTab === 'planner' && (
            <form className="stack" onSubmit={addTask}>
              <input value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} placeholder="Task name" required />
              <input value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} placeholder="Description (optional)" />
              <div className="two-col">
                <label className="field-label">Start<input type="date" value={taskForm.startDate} onChange={(e) => setTaskForm({ ...taskForm, startDate: e.target.value })} required /></label>
                <label className="field-label">End<input type="date" value={taskForm.endDate} onChange={(e) => setTaskForm({ ...taskForm, endDate: e.target.value })} required /></label>
              </div>
              <select value={taskForm.jobId} onChange={(e) => setTaskForm({ ...taskForm, jobId: e.target.value })} required>
                {jobs.length === 0 ? <option value="">— Add a job first —</option> : jobs.map((j) => <option key={j.id} value={j.id}>{j.name}</option>)}
              </select>
              <select value={taskForm.ownerId} onChange={(e) => setTaskForm({ ...taskForm, ownerId: e.target.value })}>
                <option value="">Unassigned</option>
                {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select value={taskForm.status} onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}>
                {STATUS_OPTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <button type="submit" disabled={!jobs.length}>Save task</button>
            </form>
          )}

          {activeTab === 'people' && (
            <form className="stack" onSubmit={addPerson}>
              <input value={personForm.name} onChange={(e) => setPersonForm({ ...personForm, name: e.target.value })} placeholder="Full name" required />
              <input value={personForm.role} onChange={(e) => setPersonForm({ ...personForm, role: e.target.value })} placeholder="Role (e.g. Engineer)" />
              <input value={personForm.skill} onChange={(e) => setPersonForm({ ...personForm, skill: e.target.value })} placeholder="Skill (e.g. Field work)" />
              <button type="submit">Add person</button>
            </form>
          )}

          {activeTab === 'jobs' && (
            <form className="stack" onSubmit={addJob}>
              <input value={jobForm.name} onChange={(e) => setJobForm({ ...jobForm, name: e.target.value })} placeholder="Job name" required />
              <input value={jobForm.client} onChange={(e) => setJobForm({ ...jobForm, client: e.target.value })} placeholder="Client" />
              <label className="field-label">Due date<input type="date" value={jobForm.dueDate} onChange={(e) => setJobForm({ ...jobForm, dueDate: e.target.value })} /></label>
              <textarea value={jobForm.notes} onChange={(e) => setJobForm({ ...jobForm, notes: e.target.value })} placeholder="Notes" rows={3} />
              <select value={jobForm.status} onChange={(e) => setJobForm({ ...jobForm, status: e.target.value })}>
                {JOB_STATUS_OPTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <button type="submit">Save job</button>
            </form>
          )}

          <div className="panel-head" style={{ marginTop: '18px' }}>
            <div>
              <p className="eyebrow">Active on</p>
              <h3>{fmt(selectedDate)}</h3>
            </div>
          </div>
          <div className="list-stack">
            {tasksForDate.length === 0
              ? <div className="empty-card">No tasks on this date.</div>
              : tasksForDate.map((task) => {
                const owner = people.find((p) => p.id === task.ownerId);
                const job = jobs.find((j) => j.id === task.jobId);
                return (
                  <div key={task.id} className="item-card">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong>{task.title}</strong>
                      <p>{job?.name || 'No job'} · {owner?.name || 'Unassigned'}</p>
                    </div>
                    <span className="chip" style={{ background: `${statusColor(task.status)}28`, color: statusColor(task.status) }}>{task.status}</span>
                    <button className="mini" title="Toggle complete" onClick={() => updateTask(task.id, { status: task.status === 'Complete' ? 'Planned' : 'Complete' })}>✓</button>
                    <button className="mini del" title="Delete" onClick={() => deleteTask(task.id)}>×</button>
                  </div>
                );
              })
            }
          </div>
        </section>
      </main>

      {/* ── Gantt Chart ── */}
      <section className="panel gantt-panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Timeline</p>
            <h3>Gantt — {monthLabel}</h3>
          </div>
          <div className="gantt-legend">
            {jobs.slice(0, 6).map((j, i) => (
              <span key={j.id} className="legend-item">
                <span className="legend-dot" style={{ background: JOB_COLORS[i % JOB_COLORS.length] }} />
                {j.name}
              </span>
            ))}
          </div>
        </div>
        {ganttData.rows.length === 0
          ? <div className="empty-card">No tasks this month — add tasks with dates to see the Gantt chart.</div>
          : (
            <div className="gantt-wrap">
              <div className="gantt-labels">
                <div className="gantt-label-head" />
                {ganttData.rows.map((row) => (
                  <div key={row.id} className="gantt-label" title={row.title}>{row.title}</div>
                ))}
              </div>
              <div className="gantt-body">
                <div className="gantt-days">
                  {Array.from({ length: ganttData.daysInMonth }, (_, i) => (
                    <div key={i} className="gantt-day">{i + 1}</div>
                  ))}
                </div>
                <div className="gantt-rows">
                  {ganttData.rows.map((row) => (
                    <div key={row.id} className="gantt-row">
                      <div className="gantt-bar-track">
                        <div
                          className="gantt-bar"
                          style={{ left: `${row.left}%`, width: `${row.width}%`, background: row.color }}
                          title={`${row.title}${row.jobName ? ` · ${row.jobName}` : ''}${row.ownerName ? ` · ${row.ownerName}` : ''}`}
                        >
                          <span>{row.ownerName || row.title}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {ganttData.todayPct !== null && (
                    <div className="gantt-today-line" style={{ left: `${ganttData.todayPct}%` }} title="Today" />
                  )}
                </div>
              </div>
            </div>
          )
        }
      </section>

      {/* ── Jobs + People ── */}
      <section className="bottom-grid">
        <div className="panel">
          <div className="panel-head">
            <div><p className="eyebrow">Jobs</p><h3>All jobs</h3></div>
          </div>
          <div className="list-stack">
            {jobs.length === 0 && <div className="empty-card">No jobs yet. Add one in the Jobs tab.</div>}
            {jobs.map((job, i) => {
              const jobTasks = tasks.filter((t) => t.jobId === job.id);
              const done = jobTasks.filter((t) => t.status === 'Complete').length;
              return (
                <div key={job.id} className="item-card">
                  <div className="job-dot" style={{ background: JOB_COLORS[i % JOB_COLORS.length] }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong>{job.name}</strong>
                    <p>{job.client || 'No client'} · due {fmt(job.dueDate)} · {done}/{jobTasks.length} tasks done</p>
                  </div>
                  <span className="chip" style={{ background: `${statusColor(job.status === 'Active' ? 'In progress' : job.status)}28`, color: statusColor(job.status === 'Active' ? 'In progress' : job.status) }}>{job.status}</span>
                  <button className="mini del" title="Delete job and its tasks" onClick={() => deleteJob(job.id)}>×</button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <div><p className="eyebrow">People</p><h3>Team roster</h3></div>
          </div>
          <div className="list-stack">
            {people.length === 0 && <div className="empty-card">No people yet.</div>}
            {people.map((person) => {
              const assigned = tasks.filter((t) => t.ownerId === person.id).length;
              const inProgress = tasks.filter((t) => t.ownerId === person.id && t.status === 'In progress').length;
              return (
                <div key={person.id} className="item-card">
                  <div className="avatar">{person.name[0]}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong>{person.name}</strong>
                    <p>{person.role} · {person.skill} · {assigned} task{assigned !== 1 ? 's' : ''}{inProgress ? `, ${inProgress} in progress` : ''}</p>
                  </div>
                  <button className="mini del" title="Remove person" onClick={() => deletePerson(person.id)}>×</button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

    </div>
  );
}
