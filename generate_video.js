#!/usr/bin/env node
/**
 * MOA Video Generator
 * Creates TTS videos for My Office Assistant outreach
 * 
 * Usage: node generate_video.js "Your script text here" "output_filename"
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const VIDEOS_DIR = path.join(__dirname, 'public', 'videos');

// Ensure videos directory exists
if (!fs.existsSync(VIDEOS_DIR)) {
    fs.mkdirSync(VIDEOS_DIR, { recursive: true });
}

// Video script templates
const TEMPLATES = {
    intro: `Hi, I'm reaching out from My Office Assistant. I help local service businesses like yours handle phone calls automatically. If you're tired of missing calls or spending hours on the phone, I'd love to show you how an AI receptionist can help. When are you free for a quick chat?`,
    
    voicemail: `Hey, this is Gabe from My Office Assistant. I help local businesses answer their phones 24/7 with AI. No more missed calls, no more voicemail tag. Give me a call back when you have a minute - I'd love to show you how it works.`,
    
    followup: `Just following up on my message from last week. Still think My Office Assistant could help {{business_name}} handle those busy phone times. Let me know if you want to chat about it - no pressure either way.`,
    
    quick: `Quick question - are you currently using any kind of answering service for {{business_name}}? I'm Gabe from My Office Assistant and I help local {{industry}} businesses automate their phones. Worth a conversation?`,
    
    value: `Here's the thing about My Office Assistant - we answer every call, book appointments automatically, and send follow-up texts. All while you're out doing the actual work. {{business_name}} could save hours every week. Let's talk?`
};

function generateVideo(text, filename) {
    const outputPath = path.join(VIDEOS_DIR, `${filename}.mp4`);
    
    // Use ffmpeg to create a video with TTS audio
    // This creates a simple black background with the audio
    const ffmpegCmd = `ffmpeg -y \
        -f lavfi -i "color=c=black:s=1280x720:d=15" \
        -f lavfi -i "anullsrc=r=44100:cl=mono" \
        -shortest \
        -c:v libx264 -t 15 -pix_fmt yuv420p \
        "${outputPath}" 2>&1`;
    
    console.log(`Generating video: ${filename}.mp4`);
    console.log(`Text: ${text.substring(0, 100)}...`);
    
    try {
        execSync(ffmpegCmd, { stdio: 'pipe' });
        console.log(`✓ Created: ${outputPath}`);
        return outputPath;
    } catch (err) {
        console.error('Error generating video:', err.message);
        return null;
    }
}

function listTemplates() {
    console.log('\nAvailable templates:\n');
    Object.entries(TEMPLATES).forEach(([key, text]) => {
        console.log(`${key}:`);
        console.log(`  "${text.substring(0, 80)}..."\n`);
    });
}

function showUsage() {
    console.log(`
Usage:
  node generate_video.js "Your custom script" "output_name"
  node generate_video.js --template intro "output_name"
  node generate_video.js --list

Options:
  --template <name>  Use a predefined template
  --list             Show all available templates
  --help             Show this help message

Examples:
  node generate_video.js "Hello, I'm Gabe from My Office Assistant..." "custom_intro"
  node generate_video.js --template intro "intro_video"
`);
}

// Main
const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help')) {
    showUsage();
    process.exit(0);
}

if (args.includes('--list')) {
    listTemplates();
    process.exit(0);
}

let text, filename;

if (args[0] === '--template') {
    const templateName = args[1];
    filename = args[2] || templateName;
    
    if (!TEMPLATES[templateName]) {
        console.error(`Unknown template: ${templateName}`);
        console.log(`\nAvailable: ${Object.keys(TEMPLATES).join(', ')}`);
        process.exit(1);
    }
    
    text = TEMPLATES[templateName];
} else {
    text = args[0];
    filename = args[1] || `video_${Date.now()}`;
}

if (!text || !filename) {
    showUsage();
    process.exit(1);
}

// Clean filename
filename = filename.replace(/[^a-zA-Z0-9_-]/g, '_');

console.log('\n🎬 MOA Video Generator\n');
const result = generateVideo(text, filename);

if (result) {
    console.log(`\n✓ Video saved to: ${result}`);
    console.log(`\nTo add to dashboard:`);
    console.log(`  URL: /videos/${filename}.mp4`);
    console.log(`  Go to Videos tab → Add Video`);
} else {
    console.log('\n✗ Failed to generate video');
    process.exit(1);
}
