import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { fetchProjects(); }, []);

  const fetchProjects = async () => {
    try {
      const { data } = await api.get('/projects');
      setProjects(data);
    } finally { setLoading(false); }
  };

  const createProject = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/projects', form);
      setProjects([data, ...projects]);
      setShowNew(false);
      setForm({ name: '', description: '' });
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.logo}>Task<span>Flow</span></div>
        <div className={styles.userBar}>
          <span className={styles.userName}>{user?.name}</span>
          <button className={styles.logoutBtn} onClick={() => { logout(); navigate('/login'); }}>Logout</button>
        </div>
      </header>
      <main className={styles.main}>
        <div className={styles.top}>
          <div>
            <h1 className={styles.greeting}>Good day, {user?.name?.split(' ')[0]} 👋</h1>
            <p className={styles.sub}>You have {projects.length} active project{projects.length !== 1 ? 's' : ''}</p>
          </div>
          <button className={styles.newBtn} onClick={() => setShowNew(true)}>+ New Project</button>
        </div>

        {showNew && (
          <div className={styles.modal}>
            <div className={styles.modalCard}>
              <h2>New Project</h2>
              <form onSubmit={createProject} className={styles.form}>
                <input placeholder="Project name" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })} required />
                <textarea placeholder="Description (optional)" value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })} rows={3} />
                <div className={styles.modalActions}>
                  <button type="button" onClick={() => setShowNew(false)} className={styles.cancelBtn}>Cancel</button>
                  <button type="submit" className={styles.submitBtn}>Create</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {loading ? (
          <div className={styles.loading}>Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className={styles.empty}>
            <p>No projects yet.</p>
            <button onClick={() => setShowNew(true)} className={styles.newBtn}>Create your first project</button>
          </div>
        ) : (
          <div className={styles.grid}>
            {projects.map(p => (
              <div key={p.id} className={styles.card} onClick={() => navigate(`/project/${p.id}`)}>
                <div className={styles.cardTop}>
                  <h3 className={styles.cardTitle}>{p.name}</h3>
                  <span className={styles.cardOwner}>{p.owner_name}</span>
                </div>
                <p className={styles.cardDesc}>{p.description || 'No description'}</p>
                <div className={styles.cardMeta}>
                  <span>📋 {p.task_count} tasks</span>
                  <span>👥 {p.member_count} members</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
