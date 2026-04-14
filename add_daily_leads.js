const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'leads.db'));

// 5 new Sonoma County leads for My Office Assistant
const newLeads = [
    {
        business_name: 'West Bay Locksmith Services',
        contact_name: '',
        phone: '(707) 775-7069',
        industry: 'Locksmith',
        status: 'cold',
        priority: 'high',
        notes: `Location: Santa Rosa, Sonoma County, CA
Services: Residential, automotive, and commercial locksmith services
24/7 emergency service available
CA Licensed, Fully Insured, 5.0/5 Google rating
Services: Home lockouts, car key replacement, lock rekeying, smart locks, commercial security
Website: westbaylock.com
Notes: Licensed locksmith with excellent reputation. 2 techs on duty. Flat rate quotes over phone before dispatch. Strong fit for AI receptionist - handles emergency calls.`
    },
    {
        business_name: 'Keen Garage Doors',
        contact_name: '',
        phone: '(707) 407-1484',
        industry: 'Garage Door Service',
        status: 'cold',
        priority: 'high',
        notes: `Location: Sonoma, Sonoma County, CA
Services: Garage door repair, installation, spring repair, opener installation
Family run, local company
Emergency garage door repair available
Services: Broken springs, rollers, cable repair, panel replacement, door off track, locks, openers, safety sensors
Website: keengaragedoors.com
Notes: Highest rated garage door repair in Sonoma. Family-owned business serving residential and commercial customers. Strong candidate for after-hours emergency call handling.`
    },
    {
        business_name: 'Next Day Air & Heating',
        contact_name: '',
        phone: '(707) 408-4328',
        industry: 'HVAC',
        status: 'cold',
        priority: 'high',
        notes: `Location: 586 Martin Ave Ste 3, Rohnert Park, CA 94928
Services: Full service HVAC Contractor, Bryant Heating & Cooling Systems Premier Dealer
Serves: Sonoma, Napa, & Lake Counties
Specializes in residential HVAC upgrades
Member of Rohnert Park Chamber of Commerce
Notes: Established HVAC company with chamber membership. Bryant Premier Dealer status indicates quality business. Serves multiple counties - high value lead.`
    },
    {
        business_name: 'Good Ol Plumbers',
        contact_name: '',
        phone: '(707) 332-6455',
        industry: 'Plumbing',
        status: 'cold',
        priority: 'medium',
        notes: `Location: Sonoma County, CA
Email: goodolplumbers@gmail.com
Services: Plumbing services
Website: goodolplumbers.com
Notes: Local Sonoma County plumbing company. Good candidate for service business lead list. Email contact available for outreach.`
    },
    {
        business_name: 'Hanson Overhead Garage Door Service',
        contact_name: '',
        phone: '(707) 526-7800',
        industry: 'Garage Door Service',
        status: 'cold',
        priority: 'high',
        notes: `Location: 466 Primero Court Suite A, Cotati, CA 94931
Email: info@hansongaragedoor.com
Services: Garage door repair, replacement, installation
Family-owned and operated since establishment
Serves: Sonoma, Napa and Marin Counties
Worry-Free Warranties offered
Website: hansongaragedoor.com
Notes: Independent family-owned business. Owners Adam and Teresa raised family in Sonoma County. Strong community ties. Local focus makes them ideal for personalized AI receptionist service.`
    }
];

const stmt = db.prepare(`
    INSERT INTO leads (business_name, contact_name, phone, industry, status, priority, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
`);

let imported = 0;
for (const lead of newLeads) {
    try {
        stmt.run(
            lead.business_name,
            lead.contact_name,
            lead.phone,
            lead.industry,
            lead.status,
            lead.priority,
            lead.notes
        );
        imported++;
        console.log(`✓ Added: ${lead.business_name}`);
    } catch (e) {
        console.error(`✗ Failed: ${lead.business_name} - ${e.message}`);
    }
}

console.log(`\nTotal imported: ${imported} leads`);

// Show current lead count
const count = db.prepare('SELECT COUNT(*) as total FROM leads').get();
console.log(`Total leads in database: ${count.total}`);

db.close();
