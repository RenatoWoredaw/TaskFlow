import { useState } from 'react';
import api from '../../api/axios';
import styles from './TeamPanel.module.css';

export default function TeamPanel({ project, onClose, onUpdate }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const addMember = async (e) => {
    e.preventDefault(); setError(''); setSuccess('');
    try {
      await api.post(`/projects/${project.id}/members`, { email });
      setSuccess(`${email} added!`); setEmail(''); onUpdate();
    } catch (err) { setError(err.response?.data?.message || 'Failed'); }
  };

  const removeMember = async (userId) => {
    if (!window.confirm('Remove this member?')) return;
    try { await api.delete(`/projects/${project.id}/members/${userId}`); onUpdate(); }
    catch { alert('Error'); }
  };

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.panel}>
        <div className={styles.header}><h2>Team Members</h2><button onClick={onClose} className={styles.closeBtn}>✕</button></div>
        <div className={styles.body}>
          <form onSubmit={addMember} className={styles.addForm}>
            <input placeholder="Add by email" value={email} onChange={e => setEmail(e.target.value)} type="email" required />
            <button type="submit">Add</button>
          </form>
          {error && <p className={styles.error}>{error}</p>}
          {success && <p className={styles.success}>{success}</p>}
          <div className={styles.memberList}>
            {project?.members?.map(m => (
              <div key={m.id} className={styles.member}>
                <div className={styles.memberAvatar}>{m.name[0]}</div>
                <div className={styles.memberInfo}>
                  <span className={styles.memberName}>{m.name}</span>
                  <span className={styles.memberEmail}>{m.email}</span>
                </div>
                <span className={styles.role}>{m.role}</span>
                {m.role !== 'owner' && <button className={styles.removeBtn} onClick={() => removeMember(m.id)}>✕</button>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
