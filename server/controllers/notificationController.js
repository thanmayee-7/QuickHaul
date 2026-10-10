const { runAsync, allAsync } = require('../db');

const getNotifications = async (req, res) => {
  try {
    const notifications = await allAsync(`
      SELECT * FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 30
    `, [req.user.id]);

    return res.json({ notifications });
  } catch (error) {
    console.error('getNotifications error:', error);
    return res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    if (id === 'all') {
      await runAsync('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.user.id]);
    } else {
      await runAsync('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [id, req.user.id]);
    }
    return res.json({ message: 'Notifications marked as read.' });
  } catch (error) {
    console.error('markAsRead error:', error);
    return res.status(500).json({ error: 'Failed to update notification status.' });
  }
};

module.exports = {
  getNotifications,
  markAsRead
};
