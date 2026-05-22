import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext';
import TaskCard from '../components/tasks/TaskCard';
import TaskModal from '../components/tasks/TaskModal';
import TeamPanel from '../components/team/TeamPanel';
import styles from './ProjectBoard.module.css';

const COLUMNS = [
  { key: 'todo', label: 'To Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'review', label: 'Review' },
  { key: 'done', label: 'Done' },
];

export default function ProjectBoard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const socket = useSocket();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTaskStatus, setNewTaskStatus] = useState('todo');
  const [showTeam, setShowTeam] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [projRes, taskRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/projects/${id}/tasks`),
      ]);
      setProject(projRes.data);
      setTasks(taskRes.data);
    } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!socket) return;
    socket.emit('join_project', id);
    socket.on('task_created', t => setTasks(prev => [t, ...prev]));
    socket.on('task_updated', t => setTasks(prev => prev.map(x => x.id === t.id ? t : x)));
    socket.on('task_deleted', tid => setTasks(prev => prev.filter(x => x.id !== tid)));
    return () => {
      socket.emit('leave_project', id);
      socket.off('task_created');
      socket.off('task_updated');
      socket.off('task_deleted');
    };
  }, [socket, id]);

  const handleTaskSave = async (taskData, taskId) => {
    try {
      if (taskId) {
        const { data } = await api.put(`/projects/${id}/tasks/${taskId}`, taskData);
        setTasks(prev => prev.map(t => t.id === taskId ? data : t));
        socket?.emit('task_updated', { projectId: id, task: data });
      } else {
        const { data } = await api.post(`/projects/${id}/tasks`, { ...taskData, status: newTaskStatus });
        setTasks(prev => [data, ...prev]);
        socket?.emit('task_created', { projectId: id, task: data });
      }
      setShowNewTask(false);
      setSelectedTask(null);
    } catch (err) { alert('Error saving task'); }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    await api.delete(`/projects/${id}/tasks/${taskId}`);
    setTasks(prev => prev.filter(t => t.id !== taskId));
    socket?.emit('task_deleted', { projectId: id, taskId });
    setSelectedTask(null);
  };

  if (loading) return <div className={styles.loading}>Loading board...</div>;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.back} onClick={() => navigate('/dashboard')}>← Dashboard</button>
          <div>
            <h1 className={styles.projectName}>{project?.name}</h1>
            <p className={styles.projectDesc}>{project?.description}</p>
          </div>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.teamBtn} onClick={() => setShowTeam(true)}>👥 Team ({project?.members?.length})</button>
        </div>
      </header>

      <div className={styles.board}>
        {COLUMNS.map(col => {
          const colTasks = tasks.filter(t => t.status === col.key);
          return (
            <div key={col.key} className={styles.column}>
              <div className={styles.colHeader}>
                <span className={styles.colTitle}>{col.label}</span>
                <span className={styles.colCount}>{colTasks.length}</span>
              </div>
              <div className={styles.taskList}>
                {colTasks.map(task => (
                  <TaskCard key={task.id} task={task} onClick={() => setSelectedTask(task)} />
                ))}
                <button className={styles.addTask} onClick={() => { setNewTaskStatus(col.key); setShowNewTask(true); }}>
                  + Add task
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {(showNewTask || selectedTask) && (
        <TaskModal
          task={selectedTask}
          projectId={id}
          members={project?.members || []}
          onSave={handleTaskSave}
          onDelete={handleDelete}
          onClose={() => { setShowNewTask(false); setSelectedTask(null); }}
        />
      )}

      {showTeam && (
        <TeamPanel
          project={project}
          onClose={() => setShowTeam(false)}
          onUpdate={fetchData}
        />
      )}
    </div>
  );
}
