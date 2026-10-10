const { v4: uuidv4 } = require('uuid');
const { runAsync, getAsync, allAsync } = require('../db');

const createTicket = async (req, res) => {
  try {
    const { booking_id, subject, category, description, priority = 'medium' } = req.body;

    if (!subject || !category || !description) {
      return res.status(400).json({ error: 'Subject, category, and description are required.' });
    }

    const ticketId = 'tkt_' + uuidv4().substring(0, 10);
    const ticketNumber = 'QH-TKT-' + Math.floor(100 + Math.random() * 900);

    await runAsync(`
      INSERT INTO support_tickets (id, ticket_number, user_id, booking_id, subject, category, description, priority, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open')
    `, [ticketId, ticketNumber, req.user.id, booking_id || null, subject, category, description, priority]);

    // Send notification to admin
    await runAsync(`
      INSERT INTO notifications (id, user_id, title, message, type, link)
      VALUES (?, 'usr_admin_01', 'New Support Ticket Filed', ?, 'system', '/admin?tab=support')
    `, ['notif_' + uuidv4().substring(0, 8), `Ticket ${ticketNumber}: "${subject}" filed by ${req.user.name}`]);

    const created = await getAsync('SELECT * FROM support_tickets WHERE id = ?', [ticketId]);
    return res.status(201).json({ message: 'Support ticket submitted.', ticket: created });
  } catch (error) {
    console.error('createTicket error:', error);
    return res.status(500).json({ error: 'Failed to create support ticket.' });
  }
};

const getUserTickets = async (req, res) => {
  try {
    const tickets = await allAsync(`
      SELECT st.*, b.booking_number
      FROM support_tickets st
      LEFT JOIN bookings b ON st.booking_id = b.id
      WHERE st.user_id = ?
      ORDER BY st.created_at DESC
    `, [req.user.id]);

    return res.json({ tickets });
  } catch (error) {
    console.error('getUserTickets error:', error);
    return res.status(500).json({ error: 'Failed to fetch tickets.' });
  }
};

const getAllTickets = async (req, res) => {
  try {
    const { status, category } = req.query;
    let sql = `
      SELECT st.*, u.name as user_name, u.email as user_email, u.phone as user_phone, u.role as user_role, b.booking_number
      FROM support_tickets st
      JOIN users u ON st.user_id = u.id
      LEFT JOIN bookings b ON st.booking_id = b.id
      WHERE 1=1
    `;
    const params = [];
    if (status) {
      sql += ` AND st.status = ?`;
      params.push(status);
    }
    if (category) {
      sql += ` AND st.category = ?`;
      params.push(category);
    }
    sql += ` ORDER BY st.created_at DESC`;

    const tickets = await allAsync(sql, params);
    return res.json({ tickets });
  } catch (error) {
    console.error('getAllTickets error:', error);
    return res.status(500).json({ error: 'Failed to retrieve all tickets.' });
  }
};

const updateTicket = async (req, res) => {
  try {
    const ticketId = req.params.id;
    const { status, admin_response, priority } = req.body;

    const ticket = await getAsync('SELECT * FROM support_tickets WHERE id = ?', [ticketId]);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found.' });
    }

    await runAsync(`
      UPDATE support_tickets
      SET status = COALESCE(?, status),
          admin_response = COALESCE(?, admin_response),
          priority = COALESCE(?, priority),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [status, admin_response, priority, ticketId]);

    // Notify user if admin responded
    if (admin_response) {
      await runAsync(`
        INSERT INTO notifications (id, user_id, title, message, type, link)
        VALUES (?, ?, 'Support Ticket Updated #${ticket.ticket_number}', ?, 'system', '/customer?tab=support')
      `, ['notif_' + uuidv4().substring(0, 8), ticket.user_id, `QuickHaul Support has replied to your inquiry: "${admin_response.substring(0, 50)}..."`]);
    }

    const updated = await getAsync('SELECT * FROM support_tickets WHERE id = ?', [ticketId]);
    return res.json({ message: 'Ticket updated successfully.', ticket: updated });
  } catch (error) {
    console.error('updateTicket error:', error);
    return res.status(500).json({ error: 'Failed to update ticket.' });
  }
};

module.exports = {
  createTicket,
  getUserTickets,
  getAllTickets,
  updateTicket
};
