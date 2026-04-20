const Database = require('better-sqlite3');
const fs = require('fs');

const db = new Database('leads.db');

// Read CSV
const csvPath = '/root/.openclaw/workspace/moa_leads_sonoma_county.csv';
const csv = fs.readFileSync(csvPath, 'utf8');
const lines = csv.split('\n').filter(l => l.trim());
const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

// Parse CSV (handles quotes)
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

// Find column indices
const colMap = {};
headers.forEach((h, i) => {
    colMap[h] = i;
});

console.log('CSV columns:', headers.join(', '));

const stmt = db.prepare(`
    INSERT INTO leads (business_name, contact_name, phone, website, industry, status, priority, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

let imported = 0;
for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length < 5) continue;
    
    const businessName = cols[colMap['company name']] || cols[0];
    const businessType = cols[colMap['industry']] || cols[1];
    const phone = cols[colMap['phone']] || cols[3];
    const website = cols[colMap['website']] || cols[4] || '';
    const location = cols[colMap['location']] || cols[2];
    const notes = cols[colMap['review analysis']] || cols[8];
    const priority = cols[colMap['success probability score (1-10)']]?.toString().toLowerCase() || '';
    const researchNotes = cols[colMap['research notes']] || cols[10];
    
    if (!businessName) continue;
    
    // Map priority
    let dbPriority = 'medium';
    if (priority?.includes('high') || priority?.includes('9') || priority?.includes('10')) dbPriority = 'high';
    else if (priority?.includes('low') || priority?.includes('1') || priority?.includes('2') || priority?.includes('3')) dbPriority = 'low';
    
    // Combine notes
    let fullNotes = location ? `Location: ${location}\n` : '';
    if (notes) fullNotes += notes + '\n';
    if (researchNotes) fullNotes += researchNotes;
    
    try {
        stmt.run(businessName, '', phone || '', website || '', businessType, 'cold', dbPriority, fullNotes.trim());
        imported++;
    } catch (e) {
        console.error('Failed to import:', businessName, e.message);
    }
}

console.log(`Imported ${imported} leads`);
db.close();
