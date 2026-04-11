const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Explicit root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize PostgreSQL pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Create tables if not exists
async function initDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        business_name TEXT NOT NULL,
        contact_name TEXT,
        phone TEXT,
        email TEXT,
        website TEXT,
        industry TEXT,
        status TEXT DEFAULT 'cold',
        priority TEXT DEFAULT 'medium',
        notes TEXT,
        email_tracking_enabled INTEGER DEFAULT 0,
        call_script TEXT,
        reasons_to_buy TEXT,
        proof_reviews TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_contacted TIMESTAMP,
        next_follow_up DATE
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS emails (
        id SERIAL PRIMARY KEY,
        lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
        subject TEXT,
        body TEXT,
        status TEXT DEFAULT 'draft',
        sent_at TIMESTAMP,
        opened_at TIMESTAMP,
        replied_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Database initialized');
  } finally {
    client.release();
  }
}

// Migration endpoint - add new columns
app.get('/api/migrate', async (req, res) => {
  try {
    await pool.query(`
      ALTER TABLE leads 
      ADD COLUMN IF NOT EXISTS call_script TEXT,
      ADD COLUMN IF NOT EXISTS reasons_to_buy TEXT,
      ADD COLUMN IF NOT EXISTS proof_reviews TEXT
    `);
    res.json({ message: 'Migration complete' });
  } catch (err) {
    console.error('Migration error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get all leads
app.get('/api/leads', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM leads ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching leads:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get single lead
app.get('/api/leads/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM leads WHERE id = $1', [req.params.id]);
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Lead not found' });
    }
  } catch (err) {
    console.error('Error fetching lead:', err);
    res.status(500).json({ error: err.message });
  }
});

// Create lead
app.post('/api/leads', async (req, res) => {
  const { business_name, contact_name, phone, email, website, industry, status, priority, notes, next_follow_up, call_script, reasons_to_buy, proof_reviews } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO leads (business_name, contact_name, phone, email, website, industry, status, priority, notes, next_follow_up, call_script, reasons_to_buy, proof_reviews)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [business_name, contact_name, phone, email, website, industry, status || 'cold', priority || 'medium', notes, next_follow_up, call_script, reasons_to_buy, proof_reviews]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating lead:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update lead
app.patch('/api/leads/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const fields = Object.keys(updates).map((key, index) => `${key} = $${index + 1}`).join(', ');
    const values = Object.values(updates);
    
    const result = await pool.query(
      `UPDATE leads SET ${fields} WHERE id = $${values.length + 1} RETURNING *`,
      [...values, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating lead:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete lead
app.delete('/api/leads/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM leads WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting lead:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get stats
app.get('/api/stats', async (req, res) => {
  try {
    const total = await pool.query('SELECT COUNT(*) as count FROM leads');
    const byStatus = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM leads
      GROUP BY status
    `);
    const byIndustry = await pool.query(`
      SELECT industry, COUNT(*) as count
      FROM leads
      WHERE industry IS NOT NULL AND industry != ''
      GROUP BY industry
    `);
    const followUpsToday = await pool.query(`
      SELECT COUNT(*) as count
      FROM leads
      WHERE next_follow_up = CURRENT_DATE
    `);

    res.json({
      total: parseInt(total.rows[0].count),
      byStatus: byStatus.rows,
      byIndustry: byIndustry.rows,
      followUpsToday: parseInt(followUpsToday.rows[0].count)
    });
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: err.message });
  }
});

// EMAIL ENDPOINTS

// Get emails for a lead
app.get('/api/leads/:id/emails', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM emails WHERE lead_id = $1 ORDER BY created_at DESC',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching emails:', err);
    res.status(500).json({ error: err.message });
  }
});

// Create email draft
app.post('/api/leads/:id/emails', async (req, res) => {
  const { subject, body, status } = req.body;
  const leadId = req.params.id;

  try {
    const result = await pool.query(
      `INSERT INTO emails (lead_id, subject, body, status)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [leadId, subject, body, status || 'draft']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating email:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update email
app.patch('/api/emails/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const fields = Object.keys(updates).map((key, index) => `${key} = $${index + 1}`).join(', ');
    const values = Object.values(updates);
    
    const result = await pool.query(
      `UPDATE emails SET ${fields} WHERE id = $${values.length + 1} RETURNING *`,
      [...values, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating email:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete email
app.delete('/api/emails/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM emails WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting email:', err);
    res.status(500).json({ error: err.message });
  }
});

// Bulk create email drafts
app.post('/api/emails/bulk', async (req, res) => {
  const { leadIds, subject, body } = req.body;

  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const id of leadIds) {
        await client.query(
          `INSERT INTO emails (lead_id, subject, body, status) VALUES ($1, $2, $3, 'draft')`,
          [id, subject, body]
        );
      }
      await client.query('COMMIT');
      res.json({ created: leadIds.length });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error creating bulk emails:', err);
    res.status(500).json({ error: err.message });
  }
});

// Initialize database and start server
initDatabase().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Lead Dashboard running at http://0.0.0.0:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
