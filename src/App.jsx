import { useEffect, useMemo, useState } from 'react';
import logo from './assets/logo.svg';

const defaultPeople = [
  { id: crypto.randomUUID(), name: 'Mina Lee', role: 'Project Lead', skill: 'Coordination' },
  { id: crypto.randomUUID(), name: 'Derek Cole', role: 'Engineer', skill: 'Design' },
  { id: crypto.randomUUID(), name: 'Rae Ortiz', role: 'Installer', skill: 'Field work' }
];

function blankTask() {
  return {
    id: crypto.randomUUID(),
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    ownerId: '',
    jobId: '',
    status: 'Planned'
  };
}

function blankJob() {
  return {
    id: crypto.randomUUID(),
    name: '',
    client: '',
    dueDate: '',
    notes: '',
    status: 'Active'
  };
}

function formatDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function fmt(date) {
  if (!date) return '';
  const [year, month, day] = date.split('-');
  return `${month}/${day}/${year.slice(2)}`;
}

function App() {
  const [people, setPeople] = useState(() => {
    try {
      const saved = localStorage.getItem('jobboard-people');
      return saved ? JSON.parse(saved) : defaultPeople;
    } catch {
      return defaultPeople;
    }
  });

  const [jobs, setJobs] = useState(() => {
    try {
      const saved = localStorage.getItem('jobboard-jobs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem('jobboard-tasks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [activeTab, setActiveTab] = useState('planner');
  const [jobForm, setJobForm] = useState(blankJob());
  const [taskForm, setTaskForm] = useState(blankTask());
  const [personForm, setPersonForm] = useState({ name: '', role: '', skill: '' });

  useEffect(() => localStorage.setItem('jobboard-people', JSON.stringify(people)), [people]);
  useEffect(() => localStorage.setItem('jobboard-jobs', JSON.stringify(jobs)), [jobs]);
  useEffect(() => localStorage.setItem('jobboard-tasks', JSON.stringify(tasks)), [tasks]);

  useEffect(() => {
    if (!jobs.length) return;
    setTaskForm((prev) => ({ ...prev, jobId: prev.jobId || jobs[0].id }));
  }, [jobs]);

  const tasksForDate = useMemo(() => tasks.filter((task) => task.startDate <= selectedDate && task.endDate >= selectedDate), [tasks, selectedDate]);

  const upcoming = useMemo(() => {
    const now = formatDate(new Date());
    return tasks.filter((task) => task.startDate >= now).slice(0, 4);
  }, [tasks]);

  const addJob = (e) => {
    e.preventDefault();
    if (!jobForm.name.trim()) return;
    setJobs((current) => [
      { ...jobForm, id: crypto.randomUUID(), name: jobForm.name.trim(), client: jobForm.client.trim(), dueDate: jobForm.dueDate, notes: jobForm.notes, status: jobForm.status },
      ...current
    ]);
    setJobForm(blankJob());
  };

  const addTask = (e) => {
    e.preventDefault();
    if (!taskForm.title.trim() || !taskForm.startDate || !taskForm.endDate || !taskForm.jobId) return;
    setTasks((current) => [
      ...current,
      {
        ...taskForm,
        title: taskForm.title.trim(),
        description: taskForm.description.trim(),
        startDate: taskForm.startDate,
        endDate: taskForm.endDate,
        ownerId: taskForm.ownerId,
        jobId: taskForm.jobId,
        status: taskForm.status
      }
    ]);
    setTaskForm(blankTask());
    setTaskForm((prev) => ({ ...prev, jobId: jobs[0]?.id || '' }));
  };

  const addPerson = (e) => {
    e.preventDefault();
    if (!personForm.name.trim()) return;
    setPeople((current) => [
      ...current,
      { id: crypto.randomUUID(), name: personForm.name.trim(), role: personForm.role.trim() || 'Team member', skill: personForm.skill.trim() || 'General' }
    ]);
    setPersonForm({ name: '', role: '', skill: '' });
  };

  const updateTask = (id, patch) => {
    setTasks((current) => current.map((task) => task.id === id ? { ...task, ...patch } : task));
  };

  const monthDays = useMemo(() => {
    const cursor = new Date(selectedDate);
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDay = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];

    for (let i = 0; i < startDay; i += 1) {
      cells.push({ date: new Date(year, month, i - startDay + 1), isCurrentMonth: false });
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push({ date: new Date(year, month, day), isCurrentMonth: true });
    }
    while (cells.length % 7 !== 0) {
      cells.push({ date: new Date(year, month + 1, cells.length - daysInMonth - startDay + 1), isCurrentMonth: false });
    }
    return cells;
  }, [selectedDate]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-block">
          <img src={logo} alt="JobBoard" className="brand-icon" />
          <div>
            <p className="eyebrow">Project management</p>
            <h1>JobBoard</h1>
          </div>
        </div>
        <div className="top-actions">
          <button className={activeTab === 'planner' ? 'pill active' : 'pill'} onClick={() => setActiveTab('planner')}>Planner</button>
          <button className={activeTab === 'people' ? 'pill active' : 'pill'} onClick={() => setActiveTab('people')}>People</button>
          <button className={activeTab === 'jobs' ? 'pill active' : 'pill'} onClick={() => setActiveTab('jobs')}>Jobs</button>
        </div>
      </header>

      <section className="hero-card">
        <div>
          <p className="eyebrow">Fast workflow</p>
          <h2>Plan jobs, assign people, and keep the calendar moving.</h2>
          <p className="muted">Add people, tie them to jobs, and adjust timelines without extra clicks.</p>
        </div>
        <div className="stats-grid">
          <div className="stat">
            <strong>{jobs.length}</strong>
            <span>Jobs</span>
          </div>
          <div className="stat">
            <strong>{people.length}</strong>
            <span>People</span>
          </div>
          <div className="stat">
            <strong>{tasks.length}</strong>
            <span>Tasks</span>
          </div>
        </div>
      </section>

      <main className="main-grid">
        <section className="panel calendar-panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Calendar</p>
              <h3>{new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(new Date(selectedDate))}</h3>
            </div>
            <input type="month" value={selectedDate.slice(0, 7)} onChange={(e) => setSelectedDate(`${e.target.value}-01`)} />
          </div>
          <div className="weekday-row">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <div key={day}>{day}</div>)}
          </div>
          <div className="calendar-grid">
            {monthDays.map((cell) => {
              const key = formatDate(cell.date);
              const cellTasks = tasks.filter((task) => task.startDate <= key && task.endDate >= key);
              return (
                <button key={key} className={`day-cell ${cell.isCurrentMonth ? '' : 'muted'}`} onClick={() => setSelectedDate(key)}>
                  <span className="day-number">{cell.date.getDate()}</span>
                  <div className="mini-list">
                    {cellTasks.slice(0, 2).map((task) => <span key={task.id}>{task.title}</span>)}
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
              <h3>{activeTab === 'planner' ? 'Add a task' : activeTab === 'people' ? 'Add people' : 'Add a job'}</h3>
            </div>
          </div>

          {activeTab === 'planner' && (
            <form className="stack" onSubmit={addTask}>
              <input value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} placeholder="Task name" />
              <input value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} placeholder="What needs to get done" />
              <div className="two-col">
                <input type="date" value={taskForm.startDate} onChange={(e) => setTaskForm({ ...taskForm, startDate: e.target.value })} />
                <input type="date" value={taskForm.endDate} onChange={(e) => setTaskForm({ ...taskForm, endDate: e.target.value })} />
              </div>
              <select value={taskForm.jobId} onChange={(e) => setTaskForm({ ...taskForm, jobId: e.target.value })}>
                {jobs.length === 0 && <option value="">Add a job first</option>}
                {jobs.map((job) => <option key={job.id} value={job.id}>{job.name || 'Untitled job'}</option>)}
              </select>
              <select value={taskForm.ownerId} onChange={(e) => setTaskForm({ ...taskForm, ownerId: e.target.value })}>
                <option value="">Assign person</option>
                {people.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
              </select>
              <select value={taskForm.status} onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}>
                <option value="Planned">Planned</option>
                <option value="In progress">In progress</option>
                <option value="Complete">Complete</option>
              </select>
              <button type="submit">Save task</button>
            </form>
          )}

          {activeTab === 'people' && (
            <form className="stack" onSubmit={addPerson}>
              <input value={personForm.name} onChange={(e) => setPersonForm({ ...personForm, name: e.target.value })} placeholder="Person name" />
              <input value={personForm.role} onChange={(e) => setPersonForm({ ...personForm, role: e.target.value })} placeholder="Role" />
              <input value={personForm.skill} onChange={(e) => setPersonForm({ ...personForm, skill: e.target.value })} placeholder="What they do" />
              <button type="submit">Add person</button>
            </form>
          )}

          {activeTab === 'jobs' && (
            <form className="stack" onSubmit={addJob}>
              <input value={jobForm.name} onChange={(e) => setJobForm({ ...jobForm, name: e.target.value })} placeholder="Job name" />
              <input value={jobForm.client} onChange={(e) => setJobForm({ ...jobForm, client: e.target.value })} placeholder="Client" />
              <input type="date" value={jobForm.dueDate} onChange={(e) => setJobForm({ ...jobForm, dueDate: e.target.value })} />
              <textarea value={jobForm.notes} onChange={(e) => setJobForm({ ...jobForm, notes: e.target.value })} placeholder="Notes" rows={3} />
              <select value={jobForm.status} onChange={(e) => setJobForm({ ...jobForm, status: e.target.value })}>
                <option value="Active">Active</option>
                <option value="Hold">Hold</option>
                <option value="Complete">Complete</option>
              </select>
              <button type="submit">Save job</button>
            </form>
          )}

          <div className="panel-head" style={{ marginTop: '18px' }}>
            <div>
              <p className="eyebrow">Today</p>
              <h3>{fmt(selectedDate)}</h3>
            </div>
          </div>
          <div className="list-stack">
            {tasksForDate.length === 0 && <div className="empty-card">No tasks for this date yet.</div>}
            {tasksForDate.map((task) => {
              const owner = people.find((person) => person.id === task.ownerId);
              const job = jobs.find((entry) => entry.id === task.jobId);
              return (
                <div key={task.id} className="item-card">
                  <div>
                    <strong>{task.title}</strong>
                    <p>{job?.name || 'Unlinked job'} · {owner?.name || 'Unassigned'}</p>
                  </div>
                  <button className="mini" onClick={() => updateTask(task.id, { status: task.status === 'Complete' ? 'Planned' : 'Complete' })}>✓</button>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <section className="bottom-grid">
        <div className="panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Jobs</p>
              <h3>Linked timeline</h3>
            </div>
          </div>
          <div className="list-stack">
            {jobs.map((job) => (
              <div key={job.id} className="item-card">
                <div>
                  <strong>{job.name || 'Untitled job'}</strong>
                  <p>{job.client || 'No client'} · due {fmt(job.dueDate)}</p>
                </div>
                <span className="chip">{job.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">People</p>
              <h3>Who is on it</h3>
            </div>
          </div>
          <div className="list-stack">
            {people.map((person) => (
              <div key={person.id} className="item-card">
                <div>
                  <strong>{person.name}</strong>
                  <p>{person.role} · {person.skill}</p>
                </div>
                <span className="chip">{person.role}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default App;
