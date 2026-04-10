const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Force redeploy timestamp: 2026-04-11-0439

// Initialize database
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'leads.db');
const db = new Database(dbPath);

// Create tables if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_contacted DATETIME,
    next_follow_up DATE
  )
`);

// Create emails table
db.exec(`
  CREATE TABLE IF NOT EXISTS emails (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id INTEGER NOT NULL,
    subject TEXT,
    body TEXT,
    status TEXT DEFAULT 'draft',
    sent_at DATETIME,
    opened_at DATETIME,
    replied_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
  )
`);

// Get all leads
app.get('/api/leads', (req, res) => {
  const stmt = db.prepare('SELECT * FROM leads ORDER BY created_at DESC');
  const leads = stmt.all();
  res.json(leads);
});

// Get single lead
app.get('/api/leads/:id', (req, res) => {
  const stmt = db.prepare('SELECT * FROM leads WHERE id = ?');
  const lead = stmt.get(req.params.id);
  if (lead) {
    res.json(lead);
  } else {
    res.status(404).json({ error: 'Lead not found' });
  }
});

// Create lead
app.post('/api/leads', (req, res) => {
  const { business_name, contact_name, phone, email, website, industry, status, priority, notes, next_follow_up } = req.body;

  const stmt = db.prepare(`
    INSERT INTO leads (business_name, contact_name, phone, email, website, industry, status, priority, notes, next_follow_up)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(business_name, contact_name, phone, email, website, industry, status || 'cold', priority || 'medium', notes, next_follow_up);

  res.status(201).json({ id: result.lastInsertRowid, ...req.body });
});

// Update lead
app.patch('/api/leads/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  // Build dynamic query
  const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
  const values = Object.values(updates);

  const stmt = db.prepare(`UPDATE leads SET ${fields} WHERE id = ?`);
  stmt.run(...values, id);

  res.json({ id, ...updates });
});

// Delete lead
app.delete('/api/leads/:id', (req, res) => {
  const stmt = db.prepare('DELETE FROM leads WHERE id = ?');
  stmt.run(req.params.id);
  res.status(204).send();
});

// Get stats
app.get('/api/stats', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as count FROM leads').get();
  const byStatus = db.prepare(`
    SELECT status, COUNT(*) as count
    FROM leads
    GROUP BY status
  `).all();

  const byIndustry = db.prepare(`
    SELECT industry, COUNT(*) as count
    FROM leads
    WHERE industry IS NOT NULL AND industry != ''
    GROUP BY industry
  `).all();

  const followUpsToday = db.prepare(`
    SELECT COUNT(*) as count
    FROM leads
    WHERE date(next_follow_up) = date('now')
  `).get();

  res.json({
    total: total.count,
    byStatus,
    byIndustry,
    followUpsToday: followUpsToday.count
  });
});

// EMAIL ENDPOINTS

// Get emails for a lead
app.get('/api/leads/:id/emails', (req, res) => {
  const stmt = db.prepare('SELECT * FROM emails WHERE lead_id = ? ORDER BY created_at DESC');
  const emails = stmt.all(req.params.id);
  res.json(emails);
});

// Create email draft
app.post('/api/leads/:id/emails', (req, res) => {
  const { subject, body, status } = req.body;
  const leadId = req.params.id;

  const stmt = db.prepare(`
    INSERT INTO emails (lead_id, subject, body, status)
    VALUES (?, ?, ?, ?)
  `);

  const result = stmt.run(leadId, subject, body, status || 'draft');
  res.status(201).json({ id: result.lastInsertRowid, lead_id: leadId, ...req.body });
});

// Update email (mark as sent, update content, etc.)
app.patch('/api/emails/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
  const values = Object.values(updates);

  const stmt = db.prepare(`UPDATE emails SET ${fields} WHERE id = ?`);
  stmt.run(...values, id);

  res.json({ id, ...updates });
});

// Delete email
app.delete('/api/emails/:id', (req, res) => {
  const stmt = db.prepare('DELETE FROM emails WHERE id = ?');
  stmt.run(req.params.id);
  res.status(204).send();
});

// Bulk create email drafts
app.post('/api/emails/bulk', (req, res) => {
  const { leadIds, subject, body } = req.body;

  const stmt = db.prepare(`
    INSERT INTO emails (lead_id, subject, body, status)
    VALUES (?, ?, ?, 'draft')
  `);

  const insertMany = db.transaction((ids) => {
    for (const id of ids) {
      stmt.run(id, subject, body);
    }
  });

  insertMany(leadIds);
  res.json({ created: leadIds.length });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Lead Dashboard running at http://0.0.0.0:${PORT}`);
});
