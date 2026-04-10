const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const db = new Database('leads.db');

// Read CSV
const csvPath = '/root/.openclaw/workspace/moa_leads_sonoma_county.csv';
const csv = fs.readFileSync(csvPath, 'utf8');
const lines = csv.split('\n').filter(l => l.trim());
const headers = lines[0].split(',');

// Parse CSV (simple parser for this format)
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}

const stmt = db.prepare(`
    INSERT INTO leads (business_name, contact_name, phone, industry, status, priority, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
`);

let imported = 0;
for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length < 5) continue;
    
    const businessName = cols[0];
    const businessType = cols[1];
    const phone = cols[2];
    const location = cols[3];
    const notes = cols[10];
    const priority = cols[11]?.toLowerCase().replace('very ', '');
    const researchNotes = cols[12];
    
    if (!businessName) continue;
    
    // Map priority
    let dbPriority = 'medium';
    if (priority?.includes('high')) dbPriority = 'high';
    else if (priority?.includes('low')) dbPriority = 'low';
    
    // Combine notes
    let fullNotes = location ? `Location: ${location}\n` : '';
    if (notes) fullNotes += notes + '\n';
    if (researchNotes) fullNotes += researchNotes;
    
    try {
        stmt.run(businessName, '', phone || '', businessType, 'cold', dbPriority, fullNotes.trim());
        imported++;
    } catch (e) {
        console.error('Failed to import:', businessName, e.message);
    }
}

console.log(`Imported ${imported} leads`);
db.close();
