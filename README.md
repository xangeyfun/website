# xangey.dev

A Windows XP-themed personal portfolio and sandbox, built with Flask and vanilla frontend code. The desktop-in-browser includes draggable windows, a file explorer, command prompt, Paint, Notepad, a live Discord presence feed, and plenty of easter eggs.

## Stack

- **Backend:** Python / Flask
- **Frontend:** Vanilla HTML, CSS, JavaScript
- **APIs:** Lanyard (Discord presence)

## Quickstart

```bash
pip install flask python-dotenv
python app.py
```

Visit `http://localhost:5000`.

## Main pages

| Route | Description |
|---|---|
| `/` | Windows XP desktop experience |
| `/api` | API documentation |

## Features

- Functional desktop with windows, taskbar, start menu, and right-click context menu
- Working Command Prompt with tab completion and command history
- File Explorer with a simulated file system
- Notepad and Paint applications (multiple instances)
- Live Discord status via Lanyard
- BSOD, shutdown screen, screensaver, and other nostalgic simulations
- Run dialog (Win+R) with various commands
- Easter eggs throughout

## Note

I used AI to help implement parts of the frontend because frontend development is not my strongest area. The backend, architecture, and core functionality were built by me.
