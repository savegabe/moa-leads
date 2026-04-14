#!/usr/bin/env node
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'leads.db');

const videos = JSON.parse(fs.readFileSync('captioned_videos.json', 'utf8'));

console.log('📝 Adding captioned videos to dashboard...\n');

const db = new Database(DB_PATH);

const insert = db.prepare(`
    INSERT INTO videos (filename, display_name, url, thumbnail_url, duration_seconds)
    VALUES (?, ?, ?, ?, ?)
`);

const existing = db.prepare('SELECT url FROM videos').all();
const existingUrls = new Set(existing.map(v => v.url));

let added = 0;

for (const video of videos) {
    if (existingUrls.has(video.url)) {
        console.log(`  ⚠ Already exists: ${video.display_name}`);
        continue;
    }
    
    insert.run(
        video.filename,
        video.display_name,
        video.url,
        null,
        video.duration_seconds
    );
    console.log(`  ✓ Added: ${video.display_name} (${video.duration_seconds}s)`);
    added++;
}

db.close();

console.log(`\n✓ Done: ${added} new videos added`);
console.log('\nGo to your dashboard → Videos tab to see them');
