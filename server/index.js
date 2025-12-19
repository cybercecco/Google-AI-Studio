const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'mariadb',
  user: process.env.DB_USER || 'app_user',
  password: process.env.DB_PASS || 'app_password',
  database: process.env.DB_NAME || 'securepass_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Check DB connection
pool.getConnection()
  .then(conn => {
    console.log("Connected to MariaDB!");
    conn.release();
  })
  .catch(err => {
    console.error("Error connecting to MariaDB:", err);
  });

// --- ROUTES ---

// Login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await pool.execute(
      'SELECT id, name, email, role, password_hash FROM users WHERE email = ?', 
      [email]
    );
    
    if (rows.length > 0) {
      const user = rows[0];
      // Note: In production use bcrypt.compare()
      if (user.password_hash === password) {
        const { password_hash, ...safeUser } = user;
        res.json({ success: true, user: { ...safeUser, provider: 'local' } });
      } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
    } else {
      res.status(401).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Users (Admin)
app.get('/users', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, email, role FROM users');
    res.json({ success: true, result: rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/users', async (req, res) => {
  const { name, email } = req.body;
  const id = Math.random().toString(36).substr(2, 9);
  try {
    await pool.execute(
      'INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      [id, name, email, '12345678', 'user']
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/users/:id', async (req, res) => {
    try {
        await pool.execute('DELETE FROM users WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// History
app.get('/history', async (req, res) => {
  const { user_id, all } = req.query;
  try {
    let query = 'SELECT * FROM history ORDER BY timestamp DESC LIMIT 100';
    let params = [];
    
    if (!all && user_id) {
      query = 'SELECT * FROM history WHERE user_id = ? ORDER BY timestamp DESC LIMIT 50';
      params = [user_id];
    } else if (all) {
       // Join for admin
       query = 'SELECT h.*, u.name as user_name FROM history h LEFT JOIN users u ON h.user_id = u.id ORDER BY h.timestamp DESC LIMIT 100';
    }

    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/history', async (req, res) => {
  const { id, user_id, type, original, result, timestamp } = req.body;
  try {
    await pool.execute(
      'INSERT INTO history (id, user_id, type, original_text, result_text, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
      [id, user_id, type, original, result, timestamp]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/history', async (req, res) => {
  const { user_id } = req.query;
  try {
    if (user_id) {
        await pool.execute('DELETE FROM history WHERE user_id = ?', [user_id]);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Certificates
app.get('/certs', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM certificates ORDER BY timestamp DESC');
    res.json({ success: true, result: rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/certs', async (req, res) => {
  const body = req.body;
  // Handle single or bulk (though UI currently sends separate requests usually, let's support single logic from component)
  // The component sends one by one usually based on previous logic, but let's assume it sends standard fields
  const { id, user_id, clientName, domain, expirationDate, type, fileName, content, notes, timestamp } = body;
  
  try {
      // Check if ID exists (upsert logic if needed, but for archive insert is fine)
      // We generate ID in frontend, so we just insert
      await pool.execute(
          `INSERT INTO certificates (id, user_id, client_name, domain, expiration_date, type, file_name, content, notes, timestamp) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [id || Math.random().toString(36).substr(2,9), user_id, clientName, domain, expirationDate, type, fileName, content, notes, timestamp || Date.now()]
      );
      res.json({ success: true });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
  }
});

app.delete('/certs/:id', async (req, res) => {
    try {
        await pool.execute('DELETE FROM certificates WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
