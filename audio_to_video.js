#!/usr/bin/env node
/**
 * Convert MP3 audio files to MP4 videos with static background
 * Usage: node audio_to_video.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const VIDEOS_DIR = path.join(__dirname, 'public', 'videos');

// Video files to convert
const audioFiles = [
    { file: 'moa_generic_intro.mp3', name: 'Generic Introduction', duration: 15 },
    { file: 'moa_plumber_outreach.mp3', name: 'Plumber Outreach', duration: 15 },
    { file: 'moa_hvac_outreach.mp3', name: 'HVAC Outreach', duration: 15 },
    { file: 'moa_locksmith_outreach.mp3', name: 'Locksmith Outreach', duration: 15 },
    { file: 'moa_garagedoor_outreach.mp3', name: 'Garage Door Outreach', duration: 15 },
    { file: 'moa_followup.mp3', name: 'Follow-up Message', duration: 15 }
];

function convertToVideo(audioFile, outputName) {
    const inputPath = path.join(VIDEOS_DIR, audioFile);
    const outputPath = path.join(VIDEOS_DIR, outputName.replace('.mp3', '.mp4'));
    
    if (!fs.existsSync(inputPath)) {
        console.log(`⚠ Skipping ${audioFile} - file not found`);
        return null;
    }
    
    // Create a video with dark background and audio
    // Uses ffmpeg to create a 1280x720 video with the audio
    const ffmpegCmd = `ffmpeg -y \
        -f lavfi -i "color=c=#0a0a0f:s=1280x720:r=30" \
        -i "${inputPath}" \
        -c:v libx264 -preset fast -crf 23 \
        -c:a aac -b:a 128k \
        -shortest \
        -pix_fmt yuv420p \
        "${outputPath}" 2>&1`;
    
    console.log(`Converting: ${audioFile} → ${path.basename(outputPath)}`);
    
    try {
        execSync(ffmpegCmd, { stdio: 'pipe' });
        console.log(`  ✓ Created: ${outputPath}`);
        return outputPath;
    } catch (err) {
        console.error(`  ✗ Failed: ${err.message}`);
        return null;
    }
}

function getAudioDuration(filePath) {
    try {
        const result = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`, { encoding: 'utf8' });
        return Math.round(parseFloat(result.trim()));
    } catch (err) {
        return 15; // Default to 15 seconds
    }
}

console.log('🎬 Converting MOA audio files to video format...\n');

const results = [];

for (const item of audioFiles) {
    const inputPath = path.join(VIDEOS_DIR, item.file);
    if (fs.existsSync(inputPath)) {
        const duration = getAudioDuration(inputPath);
        const outputFile = item.file.replace('.mp3', '.mp4');
        const result = convertToVideo(item.file, outputFile);
        if (result) {
            results.push({
                filename: outputFile,
                display_name: item.name,
                duration: duration
            });
        }
    } else {
        console.log(`⚠ Not found: ${item.file}`);
    }
}

console.log('\n✓ Conversion complete!');
console.log('\nTo add these to your dashboard, run:');
console.log('  node register_videos.js');
console.log('\nOr manually add via the Videos tab in the dashboard.');

// Save metadata for registration
const metadataPath = path.join(__dirname, 'video_metadata.json');
fs.writeFileSync(metadataPath, JSON.stringify(results, null, 2));
console.log(`\nMetadata saved to: ${metadataPath}`);
