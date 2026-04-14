#!/usr/bin/env node
/**
 * MOA Video Generator with Karaoke-Style Captions
 * Creates TTS videos with smooth text transitions
 * Each phrase stays on screen for 3-4 seconds minimum
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const VIDEOS_DIR = path.join(__dirname, 'public', 'videos');

// Ensure directory exists
if (!fs.existsSync(VIDEOS_DIR)) {
    fs.mkdirSync(VIDEOS_DIR, { recursive: true });
}

// Video content with timed phrases - each phrase shown for 3-4 seconds
const VIDEO_SCRIPTS = {
    generic_intro: {
        name: 'Generic Introduction',
        audio: 'moa_generic_intro.mp3',
        phrases: [
            { text: "Hi, I'm Gabe from My Office Assistant.", start: 0, duration: 3.5 },
            { text: "I help local businesses handle their phones automatically.", start: 3.5, duration: 4 },
            { text: "Tired of missing calls while you're out on jobs?", start: 7.5, duration: 4 },
            { text: "My AI receptionist can help.", start: 11.5, duration: 3 },
            { text: "When are you free for a quick chat?", start: 14.5, duration: 3.5 }
        ]
    },
    plumber_outreach: {
        name: 'Plumber Outreach',
        audio: 'moa_plumber_outreach.mp3',
        phrases: [
            { text: "Hey there, Gabe here from My Office Assistant.", start: 0, duration: 3 },
            { text: "I work with plumbers tired of missing calls", start: 3, duration: 3.5 },
            { text: "while they're under sinks.", start: 6.5, duration: 2.5 },
            { text: "My AI answers 24/7, books appointments,", start: 9, duration: 3.5 },
            { text: "and sends follow-up texts.", start: 12.5, duration: 3 },
            { text: "Worth a quick conversation?", start: 15.5, duration: 3 }
        ]
    },
    hvac_outreach: {
        name: 'HVAC Outreach',
        audio: 'moa_hvac_outreach.mp3',
        phrases: [
            { text: "Hi, Gabe from My Office Assistant.", start: 0, duration: 3 },
            { text: "I help HVAC companies handle the flood", start: 3, duration: 3.5 },
            { text: "of calls during summer and winter peaks.", start: 6.5, duration: 3.5 },
            { text: "While you're on service calls,", start: 10, duration: 3 },
            { text: "my AI answers every phone call.", start: 13, duration: 3.5 },
            { text: "Let me show you how it works.", start: 16.5, duration: 3 }
        ]
    },
    locksmith_outreach: {
        name: 'Locksmith Outreach',
        audio: 'moa_locksmith_outreach.mp3',
        phrases: [
            { text: "Hey, this is Gabe with My Office Assistant.", start: 0, duration: 3.5 },
            { text: "I know locksmiths get calls at all hours", start: 3.5, duration: 3.5 },
            { text: "when people are locked out.", start: 7, duration: 2.5 },
            { text: "My AI handles those emergency calls,", start: 9.5, duration: 3.5 },
            { text: "takes messages, and sends you details.", start: 13, duration: 3.5 },
            { text: "When can we chat?", start: 16.5, duration: 3 }
        ]
    },
    garagedoor_outreach: {
        name: 'Garage Door Outreach',
        audio: 'moa_garagedoor_outreach.mp3',
        phrases: [
            { text: "Hi, Gabe here from My Office Assistant.", start: 0, duration: 3 },
            { text: "I help garage door companies catch", start: 3, duration: 3 },
            { text: "every call while you're out on repairs.", start: 6, duration: 3.5 },
            { text: "Missed calls are missed money.", start: 9.5, duration: 3 },
            { text: "My AI answers 24/7 and books appointments", start: 12.5, duration: 4 },
            { text: "automatically. Worth a conversation?", start: 16.5, duration: 3.5 }
        ]
    },
    followup: {
        name: 'Follow-up Message',
        audio: 'moa_followup.mp3',
        phrases: [
            { text: "Hey, just following up.", start: 0, duration: 3 },
            { text: "Gabe from My Office Assistant.", start: 3, duration: 3 },
            { text: "I reached out about helping with", start: 6, duration: 3 },
            { text: "your phone calls.", start: 9, duration: 2.5 },
            { text: "No pressure at all, just checking in.", start: 11.5, duration: 3.5 },
            { text: "If you're curious about how AI receptionist works,", start: 15, duration: 4 },
            { text: "I'm happy to explain. Let me know.", start: 19, duration: 3.5 }
        ]
    }
};

function generateDrawTextFilter(phrases) {
    const filters = [];
    
    phrases.forEach((phrase, index) => {
        const fadeIn = phrase.start;
        const fadeOut = phrase.start + phrase.duration - 0.5;
        const end = phrase.start + phrase.duration;
        
        // Escape special characters for ffmpeg
        const text = phrase.text
            .replace(/'/g, "'\\''")
            .replace(/:/g, '\\:')
            .replace(/,/g, '\\,');
        
        filters.push(
            `drawtext=text='${text}':` +
            `fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:` +
            `fontsize=42:` +
            `fontcolor=white:` +
            `x=(w-text_w)/2:` +
            `y=(h-text_h)/2:` +
            `enable='between(t\\,${phrase.start}\\,${end})':` +
            `alpha='if(lt(t\\,${fadeIn}+0.5)\\,(t-${fadeIn})/0.5\\,if(lt(t\\,${fadeOut})\\,1\\,(1-(t-${fadeOut})/0.5)))'`
        );
    });
    
    return filters.join(',');
}

function createVideo(key, config) {
    const inputAudio = path.join(VIDEOS_DIR, config.audio);
    const outputVideo = path.join(VIDEOS_DIR, `${key}_captioned.mp4`);
    
    if (!fs.existsSync(inputAudio)) {
        console.log(`⚠ Skipping ${key} - audio file not found`);
        return null;
    }
    
    // Calculate total duration from audio
    let duration = 20;
    try {
        const ffprobeResult = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${inputAudio}"`, { encoding: 'utf8' });
        duration = Math.ceil(parseFloat(ffprobeResult.trim())) + 1;
    } catch (e) {
        console.log(`  Using default duration for ${key}`);
    }
    
    const drawTextFilter = generateDrawTextFilter(config.phrases);
    
    const ffmpegCmd = `ffmpeg -y \
        -f lavfi -i "color=c=#0a0a0f:s=1280x720:d=${duration}:r=30" \
        -i "${inputAudio}" \
        -vf "${drawTextFilter}" \
        -c:v libx264 -preset medium -crf 23 \
        -c:a aac -b:a 128k \
        -shortest \
        -pix_fmt yuv420p \
        "${outputVideo}" 2>&1`;
    
    console.log(`Creating: ${config.name}`);
    
    try {
        execSync(ffmpegCmd, { stdio: 'pipe', maxBuffer: 10 * 1024 * 1024 });
        console.log(`  ✓ Created: ${path.basename(outputVideo)} (${duration}s)`);
        return {
            filename: `${key}_captioned.mp4`,
            display_name: `${config.name} (Captioned)`,
            url: `/videos/${key}_captioned.mp4`,
            duration_seconds: duration
        };
    } catch (err) {
        console.error(`  ✗ Failed: ${err.message.substring(0, 200)}`);
        return null;
    }
}

console.log('🎬 Creating captioned MOA videos with smooth transitions...\n');

const results = [];

for (const [key, config] of Object.entries(VIDEO_SCRIPTS)) {
    const result = createVideo(key, config);
    if (result) results.push(result);
}

console.log(`\n✓ Done: ${results.length} videos created`);

// Save metadata
const metadataPath = path.join(__dirname, 'captioned_videos.json');
fs.writeFileSync(metadataPath, JSON.stringify(results, null, 2));
console.log(`\nMetadata saved: ${metadataPath}`);

console.log('\nTo add these to your dashboard:');
console.log('  node add_captioned_videos.js');
