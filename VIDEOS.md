# MOA Video System

## How to Add Videos to the Dashboard

### Option 1: Via the Web UI
1. Go to the **Videos** tab in the dashboard
2. Click **+ Add Video**
3. Enter:
   - **Video URL**: Path to the video (e.g., `/videos/intro.mp4` or full URL)
   - **Display Name**: What you want to call it
   - **Duration**: Length in seconds (optional)
   - **Thumbnail URL**: Preview image (optional)
4. Click **Add Video**

### Option 2: Via API (for bulk uploads)
```bash
curl -X POST http://localhost:3000/api/videos \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "intro.mp4",
    "display_name": "Introduction Video",
    "url": "/videos/intro.mp4",
    "duration_seconds": 15
  }'
```

### Option 3: Generate TTS Videos (coming soon)
The `generate_video.js` script is a placeholder for TTS integration. For now, you can:
1. Use external tools to create TTS videos
2. Upload them to the `public/videos/` folder
3. Add them via the dashboard

## Video Storage

Videos are stored in two places:
1. **Database**: Metadata (name, URL, duration) stored in PostgreSQL
2. **Filesystem**: Actual video files in `public/videos/` (if self-hosted)

## Video Templates

Here are some script templates for 15-second outreach videos:

### Cold Intro
```
Hi, I'm reaching out from My Office Assistant. I help local service 
businesses handle phone calls automatically. If you're tired of missing 
calls or spending hours on the phone, I'd love to show you how an AI 
receptionist can help. When are you free for a quick chat?
```

### Voicemail Drop
```
Hey, this is Gabe from My Office Assistant. I help local businesses 
answer their phones 24/7 with AI. No more missed calls, no more 
voicemail tag. Give me a call back when you have a minute.
```

### Quick Question
```
Quick question - are you currently using any kind of answering service? 
I'm Gabe from My Office Assistant and I help local businesses automate 
their phones. Worth a conversation?
```

## Notes

- Keep videos under 30 seconds for best engagement
- 15 seconds is the sweet spot for cold outreach
- Videos auto-play in the modal when clicked
- Click the thumbnail or "Play" button to view
- Click "Delete" to remove from dashboard (doesn't delete file)
