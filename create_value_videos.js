#!/usr/bin/env node
/**
 * MOA Value Proposition Video Generator
 * Creates visual videos explaining WHY each business needs MOA
 * Multiple scenes with text overlays, not just captions
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const VIDEOS_DIR = path.join(__dirname, 'public', 'videos');

if (!fs.existsSync(VIDEOS_DIR)) {
    fs.mkdirSync(VIDEOS_DIR, { recursive: true });
}

// Video scripts showing VALUE PROPOSITION - why they need MOA
const VALUE_VIDEOS = {
    plumber_value: {
        name: "Why Plumbers Need MOA",
        duration: 20,
        scenes: [
            {
                start: 0,
                duration: 5,
                title: "PLUMBERS: MISSING CALLS = MISSING MONEY",
                bullets: ["You're under sinks when phones ring", "Every missed call is a $300+ job lost"],
                bg: "#1a1a2e"
            },
            {
                start: 5,
                duration: 5,
                title: "THE PROBLEM",
                bullets: ["Customers call 3 plumbers, hire the first to answer", "Voicemail = customer calls competitor"],
                bg: "#16213e"
            },
            {
                start: 10,
                duration: 5,
                title: "MY OFFICE ASSISTANT SOLUTION",
                bullets: ["AI answers EVERY call instantly", "Books appointments while you work"],
                bg: "#0f3460"
            },
            {
                start: 15,
                duration: 5,
                title: "RESULTS",
                bullets: ["No more missed emergency calls", "Capture jobs while fixing pipes"],
                bg: "#1a1a2e"
            }
        ]
    },
    hvac_value: {
        name: "Why HVAC Needs MOA",
        duration: 20,
        scenes: [
            {
                start: 0,
                duration: 5,
                title: "HVAC: PEAK SEASON CHAOS",
                bullets: ["Summer heat = phone explodes", "You're on roofs, phones ring nonstop"],
                bg: "#2d1b69"
            },
            {
                start: 5,
                duration: 5,
                title: "THE COST",
                bullets: ["AC emergencies = $500+ calls", "One missed call = $3000+ install job"],
                bg: "#1e1050"
            },
            {
                start: 10,
                duration: 5,
                title: "24/7 AI RECEPTIONIST",
                bullets: ["Handles emergency calls instantly", "Dispatches urgent jobs to you"],
                bg: "#4a148c"
            },
            {
                start: 15,
                duration: 5,
                title: "YOUR EDGE",
                bullets: ["Beat competitors to every call", "Scale without hiring receptionist"],
                bg: "#2d1b69"
            }
        ]
    },
    locksmith_value: {
        name: "Why Locksmiths Need MOA",
        duration: 20,
        scenes: [
            {
                start: 0,
                duration: 5,
                title: "LOCKSMITHS: 24/7 EMERGENCY BUSINESS",
                bullets: ["People locked out at 2 AM panic", "They call until someone answers"],
                bg: "#1a237e"
            },
            {
                start: 5,
                duration: 5,
                title: "THE REALITY",
                bullets: ["You're picking locks, phone rings", "$150 service call goes to competitor"],
                bg: "#0d1642"
            },
            {
                start: 10,
                duration: 5,
                title: "NEVER MISS EMERGENCY",
                bullets: ["AI answers in 3 seconds flat", "Texts you location + details"],
                bg: "#283593"
            },
            {
                start: 15,
                duration: 5,
                title: "CAPTURE MORE CALLS",
                bullets: ["Wake up to booked appointments", "Dominate local locksmith search"],
                bg: "#1a237e"
            }
        ]
    },
    garagedoor_value: {
        name: "Why Garage Door Needs MOA",
        duration: 20,
        scenes: [
            {
                start: 0,
                duration: 5,
                title: "GARAGE DOOR: TRAPPED CUSTOMERS",
                bullets: ["Car stuck at 6 AM = angry customer", "They need help NOW, not later"],
                bg: "#263238"
            },
            {
                start: 5,
                duration: 5,
                title: "THE MATH",
                bullets: ["Average repair: $200-500", "New install: $1000-3000", "Missed call = competitor gets it"],
                bg: "#1c262b"
            },
            {
                start: 10,
                duration: 5,
                title: "INSTANT RESPONSE",
                bullets: ["AI answers while you repair", "Quotes prices, books appointments"],
                bg: "#37474f"
            },
            {
                start: 15,
                duration: 5,
                title: "GROW YOUR BUSINESS",
                bullets: ["Handle 3x more calls", "Focus on repairs, not phones"],
                bg: "#263238"
            }
        ]
    },
    generic_value: {
        name: "Why Service Businesses Need MOA",
        duration: 20,
        scenes: [
            {
                start: 0,
                duration: 5,
                title: "THE SERVICE BUSINESS PROBLEM",
                bullets: ["You're working, phones ring", "Customers hire who answers first"],
                bg: "#311b92"
            },
            {
                start: 5,
                duration: 5,
                title: "MISSED CALLS = LOST REVENUE",
                bullets: ["Every ring is potential money", "Voicemail kills 70% of leads"],
                bg: "#1a237e"
            },
            {
                start: 10,
                duration: 5,
                title: "MY OFFICE ASSISTANT FIXES THIS",
                bullets: ["AI answers 24/7 instantly", "Books jobs while you work"],
                bg: "#4527a0"
            },
            {
                start: 15,
                duration: 5,
                title: "COMPETITIVE ADVANTAGE",
                bullets: ["Be the first to answer", "Scale without hiring staff"],
                bg: "#311b92"
            }
        ]
    },
    roi_explainer: {
        name: "MOA ROI Calculator",
        duration: 18,
        scenes: [
            {
                start: 0,
                duration: 4,
                title: "THE MATH IS SIMPLE",
                bullets: ["1 missed call/week = 52/year"],
                bg: "#1b5e20"
            },
            {
                start: 4,
                duration: 4,
                title: "AVERAGE JOB VALUE",
                bullets: ["Service call: $200-500", "Install/repair: $1000+"],
                bg: "#2e7d32"
            },
            {
                start: 8,
                duration: 5,
                title: "CONSERVATIVE ESTIMATE",
                bullets: ["Capture just 2 extra jobs/month", "That's $1000-2000 MORE revenue"],
                bg: "#388e3c"
            },
            {
                start: 13,
                duration: 5,
                title: "MOA COSTS LESS THAN",
                bullets: ["1 day of missed calls", "Start capturing revenue TODAY"],
                bg: "#1b5e20"
            }
        ]
    }
};

function escapeFfmpegText(text) {
    return text
        .replace(/'/g, "'\\''")
        .replace(/:/g, '\\:')
        .replace(/,/g, '\\,')
        .replace(/\$/g, '\\$')
        .replace(/%/g, '\\%');
}

function generateSceneFilters(scenes, totalDuration) {
    const filters = [];
    
    scenes.forEach((scene, index) => {
        const start = scene.start;
        const end = scene.start + scene.duration;
        
        // Background color for this scene
        const bgFilter = `color=c=${scene.bg}:s=1280x720:d=${scene.duration}`;
        
        // Title text - large, centered
        const titleText = escapeFfmpegText(scene.title);
        const titleFilter = 
            `drawtext=text='${titleText}':` +
            `fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:` +
            `fontsize=48:` +
            `fontcolor=white:` +
            `x=(w-text_w)/2:` +
            `y=150:` +
            `enable='between(t\\,${start}\\,${end})':` +
            `alpha='if(lt(t\\,${start}+0.3)\\,(t-${start})/0.3\\,if(lt(t\\,${end}-0.3)\\,1\\,(1-(t-${end}+0.3)/0.3)))':` +
            `box=1:boxcolor=black@0.5:boxborderw=10`;
        
        filters.push(titleFilter);
        
        // Bullet points
        scene.bullets.forEach((bullet, bulletIndex) => {
            const bulletText = escapeFfmpegText("• " + bullet);
            const yPos = 280 + (bulletIndex * 80);
            const bulletDelay = bulletIndex * 0.3; // Stagger bullet appearance
            
            const bulletFilter =
                `drawtext=text='${bulletText}':` +
                `fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:` +
                `fontsize=36:` +
                `fontcolor=#e0e0e0:` +
                `x=(w-text_w)/2:` +
                `y=${yPos}:` +
                `enable='between(t\\,${start + bulletDelay}\\,${end})':` +
                `alpha='if(lt(t\\,${start + bulletDelay + 0.4})\\,(t-${start + bulletDelay})/0.4\\,if(lt(t\\,${end}-0.3)\\,1\\,(1-(t-${end}+0.3)/0.3)))':` +
                `box=1:boxcolor=black@0.3:boxborderw=8`;
            
            filters.push(bulletFilter);
        });
    });
    
    // Add background transitions
    const bgColors = [];
    let currentTime = 0;
    
    scenes.forEach(scene => {
        // Create colored background segment
        const bgSegment = `color=c=${scene.bg}:s=1280x720:r=30:d=${scene.duration}`;
        bgColors.push(bgSegment);
        currentTime += scene.duration;
    });
    
    return { bgColors, filters };
}

function createValueVideo(key, config) {
    const outputVideo = path.join(VIDEOS_DIR, `${key}.mp4`);
    
    console.log(`Creating: ${config.name}`);
    
    // Generate filter complex for text overlays
    const { filters } = generateSceneFilters(config.scenes, config.duration);
    
    // Create a color video with the full duration
    const filterComplex = filters.join(',');
    
    const ffmpegCmd = `ffmpeg -y \
        -f lavfi -i "color=c=${config.scenes[0].bg}:s=1280x720:d=${config.duration}:r=30" \
        -vf "${filterComplex}" \
        -c:v libx264 -preset medium -crf 23 \
        -pix_fmt yuv420p \
        -r 30 \
        "${outputVideo}" 2>&1`;
    
    try {
        execSync(ffmpegCmd, { stdio: 'pipe', maxBuffer: 20 * 1024 * 1024 });
        console.log(`  ✓ Created: ${path.basename(outputVideo)} (${config.duration}s)`);
        return {
            filename: `${key}.mp4`,
            display_name: config.name,
            url: `/videos/${key}.mp4`,
            duration_seconds: config.duration
        };
    } catch (err) {
        console.error(`  ✗ Failed: ${err.message.substring(0, 300)}`);
        return null;
    }
}

console.log('🎬 Creating VALUE PROPOSITION videos...');
console.log('These explain WHY each business needs MOA\n');

const results = [];

for (const [key, config] of Object.entries(VALUE_VIDEOS)) {
    const result = createValueVideo(key, config);
    if (result) results.push(result);
}

console.log(`\n✓ Done: ${results.length} value videos created`);

// Save metadata
const metadataPath = path.join(__dirname, 'value_videos.json');
fs.writeFileSync(metadataPath, JSON.stringify(results, null, 2));
console.log(`\nMetadata saved: ${metadataPath}`);

console.log('\nTo add to dashboard: node add_value_videos.js');
