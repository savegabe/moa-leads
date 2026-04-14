#!/usr/bin/env node
/**
 * Register videos with the dashboard database
 * Usage: node register_videos.js
 */

const fs = require('fs');
const path = require('path');

const API_BASE = process.env.API_URL || 'http://localhost:3000';

// Video metadata - matches the converted files
const videos = [
    {
        filename: 'moa_generic_intro.mp4',
        display_name: 'Generic Introduction',
        url: '/videos/moa_generic_intro.mp4',
        duration_seconds: 15
    },
    {
        filename: 'moa_plumber_outreach.mp4',
        display_name: 'Plumber Outreach',
        url: '/videos/moa_plumber_outreach.mp4',
        duration_seconds: 15
    },
    {
        filename: 'moa_hvac_outreach.mp4',
        display_name: 'HVAC Outreach',
        url: '/videos/moa_hvac_outreach.mp4',
        duration_seconds: 15
    },
    {
        filename: 'moa_locksmith_outreach.mp4',
        display_name: 'Locksmith Outreach',
        url: '/videos/moa_locksmith_outreach.mp4',
        duration_seconds: 15
    },
    {
        filename: 'moa_garagedoor_outreach.mp4',
        display_name: 'Garage Door Outreach',
        url: '/videos/moa_garagedoor_outreach.mp4',
        duration_seconds: 15
    },
    {
        filename: 'moa_followup.mp4',
        display_name: 'Follow-up Message',
        url: '/videos/moa_followup.mp4',
        duration_seconds: 15
    }
];

async function registerVideo(video) {
    try {
        const response = await fetch(`${API_BASE}/api/videos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(video)
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log(`  ✓ Registered: ${video.display_name} (ID: ${data.id})`);
            return true;
        } else {
            const error = await response.text();
            console.error(`  ✗ Failed: ${video.display_name} - ${error}`);
            return false;
        }
    } catch (err) {
        console.error(`  ✗ Error: ${video.display_name} - ${err.message}`);
        return false;
    }
}

async function main() {
    console.log('📝 Registering MOA videos with dashboard...\n');
    console.log(`API: ${API_BASE}\n`);
    
    let success = 0;
    let failed = 0;
    
    for (const video of videos) {
        const result = await registerVideo(video);
        if (result) success++;
        else failed++;
    }
    
    console.log(`\n✓ Done: ${success} registered, ${failed} failed`);
    console.log('\nView your videos in the dashboard: Videos tab');
}

// Check if fetch is available (Node 18+)
if (typeof fetch === 'undefined') {
    console.error('This script requires Node.js 18+ with native fetch support');
    console.log('Alternative: Manually add videos via the dashboard UI');
    process.exit(1);
}

main().catch(err => {
    console.error('Fatal error:', err.message);
    process.exit(1);
});
