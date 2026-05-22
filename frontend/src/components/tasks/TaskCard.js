import styles from './TaskCard.module.css';

const priorityIcon = { low: '🟢', medium: '🟡', high: '🔴' };

export default function TaskCard({ task, onClick }) {
  return (
    <div className={styles.card} onClick={onClick}>
      <div className={styles.top}>
        <span className={styles.priority}>{priorityIcon[task.priority]}</span>
        {task.due_date && (
          <span className={styles.due}>{new Date(task.due_date).toLocaleDateString()}</span>
        )}
      </div>
      <h4 className={styles.title}>{task.title}</h4>
      {task.description && <p className={styles.desc}>{task.description.slice(0, 80)}{task.description.length > 80 ? '...' : ''}</p>}
      <div className={styles.footer}>
        {task.assignee_name ? (
          <span className={styles.assignee}>
            <span className={styles.avatar}>{task.assignee_name[0]}</span>
            {task.assignee_name}
          </span>
        ) : <span className={styles.unassigned}>Unassigned</span>}
      </div>
    </div>
  );
}
