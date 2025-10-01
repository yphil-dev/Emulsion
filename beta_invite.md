📣 Invitation to Emulsion Beta Program
Hi everyone,

I’m excited to invite you to participate in the private beta for Emulsion—our new desktop application for organizing and launching games across all your emulators. Your feedback will be invaluable as we polish the user experience, squash bugs, and add the final finishing touches before our broader world-wide rollout.

💡 Background & Purpose
Emulsion is an extra-curricular side-project aimed at:

Unifying your gaming libraries (Steam, local ROMs, retro consoles) under one clean interface

Automatically fetching cover art and metadata from multiple sources (SteamGridDB, GiantBomb)

Customizing themes, layouts, and input mappings to fit your personal setup

Our goal in this beta is to validate core workflows, uncover any stability issues, and refine the UI/UX so that Emulsion feels rock-solid for day-to-day use.

🔑 How to Access the Beta
GitHub Invite
You’ll receive an email invitation to join the private GitHub repository. Click the link and accept the invite—no special setup required.

Download the Release
Once you’ve joined the repo, head to

bash
Copy
Edit
https://github.com/yPhil-gh/emulsion/releases/latest
and download the binary for your platform:

Windows: emulsion_x64.exe

Linux: emulsion_amd64.deb or emulsion_x86_64.AppImage

Install & Launch
Follow the usual install steps for your OS (double-click the EXE, or install the DEB/AppImage). Then launch Emulsion from your Start Menu or application launcher.

🕵️ What to Look For
Please spend 15–30 minutes exploring the following key areas:

1. Core Navigation & Layout
Can you easily switch between platforms (NES, SNES, PS1, etc.)?

Does the gallery grid feel responsive as you resize the window?

Are settings (themes, number of columns, recent-play) intuitive to find and use?

2. Cover Art & Metadata Fetching
When browsing a platform library, do cover images load reliably?

If no image is found, is the “no cover art” placeholder clear?

How does the performance feel when scrolling through hundreds of entries?

3. Game Launching & Emulator Integration
Does clicking a game launch your configured emulator?

If you change the emulator path in Settings, does it “stick” on relaunch?

Are command-line arguments passed correctly (e.g. --fullscreen)?

4. Stability & Error Handling
Any crashes, freezes, or unexpected quits?

Any console errors in the DevTools window (right-click → Inspect)?

Edge cases: what happens if your games folder is empty, or contains unusual filenames?

📝 How to Report Feedback
Please log all your findings in our GitHub issue tracker:

Go to Issues:
https://github.com/yPhil-gh/emulsion/issues

Click “New issue”, choose the Beta Feedback template.

Fill in:

What you tested (feature or area)

What happened (expected vs. actual)

Steps to reproduce (if it’s a bug)

Screenshots or logs (attach files or copy-paste console errors)

If you’d rather chat, feel free to ping me directly on Slack in the #emulsion-beta channel.

📅 Timeline & Next Steps
April 25–May 2: Active beta testing window

May 3: Triage and prioritize bugs

May 5: Private MVP release for extended in-org trial

Your timely feedback during this window is critical. Even a quick note like “I couldn’t find the theme toggle” or “launching Super Mario World works great” helps us focus on the biggest wins.

Thanks in advance for your time and insights—your perspective will make Emulsion truly shine for everyone. Let me know if you run into any roadblocks getting set up!

— Phil (yPhil)
Emulsion Lead Developer
