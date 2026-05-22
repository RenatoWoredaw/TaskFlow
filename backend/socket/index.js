const jwt = require('jsonwebtoken');
const pool = require('../config/db');

module.exports = (io) => {
  // Authenticate socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.name} (${socket.id})`);

    // Join a project room
    socket.on('join_project', (projectId) => {
      socket.join(`project_${projectId}`);
      console.log(`${socket.user.name} joined project_${projectId}`);
    });

    // Leave a project room
    socket.on('leave_project', (projectId) => {
      socket.leave(`project_${projectId}`);
    });

    // Task created
    socket.on('task_created', async ({ projectId, task }) => {
      socket.to(`project_${projectId}`).emit('task_created', task);
      // Notify assignee
      if (task.assignee_id && task.assignee_id !== socket.user.id) {
        await pool.query(
          'INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)',
          [task.assignee_id, `You were assigned to "${task.title}"`, 'task']
        );
        io.to(`user_${task.assignee_id}`).emit('notification', {
          message: `You were assigned to "${task.title}"`,
          type: 'task',
        });
      }
    });

    // Task updated
    socket.on('task_updated', ({ projectId, task }) => {
      socket.to(`project_${projectId}`).emit('task_updated', task);
    });

    // Task deleted
    socket.on('task_deleted', ({ projectId, taskId }) => {
      socket.to(`project_${projectId}`).emit('task_deleted', taskId);
    });

    // Comment added
    socket.on('comment_added', ({ projectId, taskId, comment }) => {
      socket.to(`project_${projectId}`).emit('comment_added', { taskId, comment });
    });

    // User personal room for notifications
    socket.on('join_user_room', () => {
      socket.join(`user_${socket.user.id}`);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.name}`);
    });
  });
};
