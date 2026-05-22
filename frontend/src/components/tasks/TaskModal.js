import { useState, useEffect } from 'react';
import api from '../../api/axios';
import styles from './TaskModal.module.css';

export default function TaskModal({ task, projectId, members, onSave, onDelete, onClose }) {
  const [form, setForm] = useState({
    title: '', description: '', status: 'todo',
    priority: 'medium', assignee_id: '', due_date: '',
  });
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [tab, setTab] = useState('details');

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || '', description: task.description || '',
        status: task.status || 'todo', priority: task.priority || 'medium',
        assignee_id: task.assignee_id || '', due_date: task.due_date?.split('T')[0] || '',
      });
      loadComments();
    }
  }, [task]);

  const loadComments = async () => {
    try {
      const { data } = await api.get(`/projects/${projectId}/tasks/${task.id}/comments`);
      setComments(data);
    } catch {}
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form, task?.id);
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const { data } = await api.post(`/projects/${projectId}/tasks/${task.id}/comments`, { content: newComment });
      setComments([...comments, data]);
      setNewComment('');
    } catch {}
  };

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>{task ? 'Edit Task' : 'New Task'}</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {task && (
          <div className={styles.tabs}>
            <button className={tab === 'details' ? styles.activeTab : styles.tab} onClick={() => setTab('details')}>Details</button>
            <button className={tab === 'comments' ? styles.activeTab : styles.tab} onClick={() => setTab('comments')}>Comments ({comments.length})</button>
          </div>
        )}

        {tab === 'details' ? (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label>Title</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Task title" required />
            </div>
            <div className={styles.field}>
              <label>Description</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Details..." rows={3} />
            </div>
            <div className={styles.row}>
              <div className={styles.field}>
                <label>Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="done">Done</option>
                </select>
              </div>
              <div className={styles.field}>
                <label>Priority</label>
                <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div className={styles.row}>
              <div className={styles.field}>
                <label>Assignee</label>
                <select value={form.assignee_id} onChange={e => setForm({ ...form, assignee_id: e.target.value })}>
                  <option value="">Unassigned</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div className={styles.field}>
                <label>Due Date</label>
                <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
              </div>
            </div>
            <div className={styles.actions}>
              {task && <button type="button" className={styles.deleteBtn} onClick={() => onDelete(task.id)}>Delete</button>}
              <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
              <button type="submit" className={styles.saveBtn}>Save Task</button>
            </div>
          </form>
        ) : (
          <div className={styles.comments}>
            <div className={styles.commentList}>
              {comments.length === 0 ? (
                <p className={styles.noComments}>No comments yet.</p>
              ) : comments.map(c => (
                <div key={c.id} className={styles.comment}>
                  <div className={styles.commentAvatar}>{c.user_name?.[0]}</div>
                  <div>
                    <div className={styles.commentMeta}>
                      <span className={styles.commentUser}>{c.user_name}</span>
                      <span className={styles.commentTime}>{new Date(c.created_at).toLocaleString()}</span>
                    </div>
                    <p className={styles.commentText}>{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={submitComment} className={styles.commentForm}>
              <textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Add a comment..." rows={2} />
              <button type="submit" className={styles.saveBtn}>Post</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
