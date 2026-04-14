#!/usr/bin/env node
/**
 * Directly add videos to the SQLite database
 * Usage: node add_videos_to_db.js
 */

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'leads.db');

const videos = [
    {
        filename: 'moa_generic_intro.mp4',
        display_name: 'Generic Introduction',
        url: '/videos/moa_generic_intro.mp4',
        thumbnail_url: null,
        duration_seconds: 15
    },
    {
        filename: 'moa_plumber_outreach.mp4',
        display_name: 'Plumber Outreach',
        url: '/videos/moa_plumber_outreach.mp4',
        thumbnail_url: null,
        duration_seconds: 15
    },
    {
        filename: 'moa_hvac_outreach.mp4',
        display_name: 'HVAC Outreach',
        url: '/videos/moa_hvac_outreach.mp4',
        thumbnail_url: null,
        duration_seconds: 15
    },
    {
        filename: 'moa_locksmith_outreach.mp4',
        display_name: 'Locksmith Outreach',
        url: '/videos/moa_locksmith_outreach.mp4',
        thumbnail_url: null,
        duration_seconds: 15
    },
    {
        filename: 'moa_garagedoor_outreach.mp4',
        display_name: 'Garage Door Outreach',
        url: '/videos/moa_garagedoor_outreach.mp4',
        thumbnail_url: null,
        duration_seconds: 15
    },
    {
        filename: 'moa_followup.mp4',
        display_name: 'Follow-up Message',
        url: '/videos/moa_followup.mp4',
        thumbnail_url: null,
        duration_seconds: 15
    }
];

try {
    console.log('📝 Adding videos to database...\n');
    
    const db = new Database(DB_PATH);
    
    // Ensure videos table exists
    db.exec(`
        CREATE TABLE IF NOT EXISTS videos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL,
            display_name TEXT NOT NULL,
            url TEXT NOT NULL,
            thumbnail_url TEXT,
            duration_seconds INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
    
    // Check for existing videos to avoid duplicates
    const existing = db.prepare('SELECT url FROM videos').all();
    const existingUrls = new Set(existing.map(v => v.url));
    
    const insert = db.prepare(`
        INSERT INTO videos (filename, display_name, url, thumbnail_url, duration_seconds)
        VALUES (?, ?, ?, ?, ?)
    `);
    
    let added = 0;
    let skipped = 0;
    
    for (const video of videos) {
        if (existingUrls.has(video.url)) {
            console.log(`  ⚠ Skipped (exists): ${video.display_name}`);
            skipped++;
            continue;
        }
        
        insert.run(
            video.filename,
            video.display_name,
            video.url,
            video.thumbnail_url,
            video.duration_seconds
        );
        console.log(`  ✓ Added: ${video.display_name}`);
        added++;
    }
    
    db.close();
    
    console.log(`\n✓ Done: ${added} added, ${skipped} skipped`);
    console.log('\nView your videos in the dashboard: Videos tab');
    
} catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
}
