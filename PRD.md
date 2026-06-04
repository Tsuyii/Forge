# Product Requirements Document
## MultiAgent — Agent Dev Environment Desktop App

**Version:** 2.0 (full feature audit complete)
**Date:** 2026-06-04
**Owner:** Badr
**Status:** Ready for planning

---

## 1. Overview

A native desktop application (Tauri) for running multiple AI coding agents in parallel — each in its own PTY terminal pane — with a built-in browser, file preview, git panel, agent memory system, voice input, task runner, and first-class account switching with session/weekly usage tracking.

Modeled on SXcode ("Agent Dev ENV") with one key addition: an **Agent Limits panel** for switching Claude/Codex/Gemini accounts in one click and seeing session + weekly quota remaining per account.

---

## 2. Complete Feature Inventory (from screenshots)

### 2.1 App Shell

**Window chrome:**
- Title bar: app name "SXcode" (ours will be our own name)
- Standard window controls: minimize, maximize, close
- Performance metrics in title bar: `IPS N/A | GPU 0% | CPU 9% | LAT N/A`

**Left sidebar:**
- App logo + name + "AGENT DEV ENV" tagline
- **WORKSPACES** section header with `+` button
- List of open workspaces: each shows name + pane count badge + `×` close
- Bottom: **Settings** button (opens Settings modal)
- Below Settings: **THEME** quick-swatches (same 10 themes as Settings → Appearance, instant apply)

---

### 2.2 Workspace Launcher (Home Screen)

Shown on first open and when creating a new workspace.

**Layout mode cards:**
- **Workspace** — "Tabbed terminals in a grid"
- **Canvas** — "Infinite surface with agent cards"

**Inputs:**
- Directory path picker (text field)
- Workspace display name (optional)
- Recent workspaces: pill chips (clickable to pre-fill)

**Agent selector row (horizontal, scrollable):**

| Agent | Notes |
|-------|-------|
| Claude | Claude Code CLI |
| Codex | Codex CLI |
| Gemini | Gemini CLI |
| Agy | Agy CLI |
| Custom | User-defined command |
| Shell | Plain terminal (no AI) |

- Selected agent shows `[-] [N] [+]` count controls
- Workspace mode quick buttons: **1 each** / **Fill** / **Clear**
- Canvas mode buttons: **Select all** / **Clear**
- Grid distribution slider

**Open button:** `Open (N)` — N = total agent instances

---

### 2.3 Active Workspace — Grid Mode

**Left sidebar:**
- "spaces" label
- List of workspaces: colored status dot (green=idle, orange=working) + name + agent type + status text
- `new` button, `menu` button (with dot indicator)
- `agents / all` toggle

**Top tab bar:** numbered tabs (`1`, `2`...) + `+` add tab

**Workspace toolbar** (between tab bar and pane area):

| Control | What it does |
|---------|-------------|
| `N/M` | Pane counter: current pane / total panes (e.g. `1/12`) |
| `- 100% +` | Terminal font zoom |
| 🌐 Globe | **Built-in Browser** — full Chromium, multi-tab, URL bar, opens as side panel |
| 📄 File | **File Preview** — file tree (FILES/WORKSPACE tabs) + content viewer + Save |
| 🐱 Git | **Git Panel** — Changes / Files / History tabs for current workspace directory |
| ⊞ Grid/checkbox | **Agent Tasks** — send a task to an agent, history of tasks |
| ✦ Sparkle | **Skills** (opens Settings → Skills or dedicated skills tab) |
| 🧠 Brain | **Memory** — opens dedicated Memory window (Notes + Graph views) |
| 🎙 Mic | **SXvoice** — local Whisper voice dictation side panel |
| 🔔 Bell | **Sound Notifications** — toggle completion sounds |
| `×` | Close workspace |
| **Agent ▼** | **Agent dropdown** — add/switch agents in panes |

**Each terminal pane:**
- Full PTY terminal emulator
- Pane tab: `[agent-icon] AgentName | WorkspaceName` + `[✏️ rename] [⊡ expand] [× close]`
- Bottom status bar: `Model · AccountName [████░░ N%]`
- `bypass permissions on` toggle (Shift+Tab to cycle)
- Update/error notifications

---

### 2.4 Agent Dropdown (Agent ▼ button)

Opens as overlay on the toolbar. Lists all agent types with `+` to spawn a new pane of that type:

```
● Claude Code          [+]
● Gemini CLI           [+]
● Codex CLI            [+]
● Agy                  [+]
● Shell    Ctrl+Shift+S [+]

Custom
[opencode          ] [Open]
Run any command in a new pane.
```

- Clicking `+` next to an agent spawns a new pane with that agent in the current workspace
- Custom: text input for any shell command + Open button

---

### 2.5 Agent Tasks Panel

Opened via the ⊞ toolbar icon. Slides in as a side panel.

```
⊞ Agent Tasks                              [×]

[ Ask an agent to do a concrete task...      ]
[                                            ]

[Active pane]  [New pane]

[Claude Code] [Codex CLI] [Gemini CLI]
[Agy]  [Shell]

[▶ Run task]

HISTORY
No agent tasks yet.
```

- Text area: describe the task in plain language
- **Active pane** / **New pane**: run in current focused terminal or open a new one
- Agent type selector: choose which agent to send the task to
- **Run task** — sends the task as input to the selected agent
- **HISTORY** — log of all tasks sent, with status

---

### 2.6 Built-in Browser

Opened via 🌐 toolbar icon. Full Chromium browser embedded as a side panel.

```
Tab 1  [×]  [+]
[www.google.com              ] [Go] [↗] [×]
─────────────────────────────────────────────
[ full browser viewport ]
```

- Multi-tab (add with `+`, close with `×` per tab)
- Real URL navigation (Go button or Enter)
- Opens external link in OS browser (↗)
- Close panel (×)
- Use cases: preview running dev servers, search docs, test web apps

---

### 2.7 File Preview Panel

Opened via 📄 toolbar icon. Side panel with file tree + viewer.

```
Preview                              [↗] [⊡] [×]
[FILES] [WORKSPACE]
──────────────────
Filter files...
▶ 📁 .sxcode
▶ 📁 Badr
▶ 📁 competitor-intel
  ...
▶ 📁 SXclone
  📄 auth-variants.html
──────────────────
                 [ No file selected ]
                 Plain Text ▼    [Save]
                 Select a file from the workspace.
```

- **FILES tab**: full file tree of the workspace directory
- **WORKSPACE tab**: alternate view
- Click file → content appears on right
- File type dropdown (Plain Text, etc.)
- Save button to write changes back

---

### 2.8 Git Panel

Opened via 🐱 toolbar icon. Side panel.

```
Git                               [↻] [→] [⊡] [×]
[Changes] [Files] [History]
──────────────────
(shows diff/staged/unstaged for current workspace dir)
Error state: "Not a git repository: could not find
repository at 'C:\Users\Badr\Desktop'..."
```

- **Changes** tab: staged/unstaged file diffs
- **Files** tab: all tracked files
- **History** tab: commit log
- Auto-detects git repo from workspace directory
- Shows error message if folder is not a git repo

---

### 2.9 Memory System

Opened via 🧠 toolbar icon. Opens as a **separate dedicated window** (not just a panel).

**Notes view:**
```
Memory  Agent vault · what we were working on
                    [Notes] [Graph]
[Auto-save ☑]  [Save session]  [↻] [↗] [×]

Search memory...  [+]

DESKTOP                           [Preview] [Edit]
  Session — Desktop  4 juin 23:12           [Send to agent ▼] [Save] [🗑]
  Session — Desktop  4 juin 23:12
  Session — Desktop  4 juin 21:31
HEARMEOUT
  Session — HearMeOut  4 juin 22:41
TEST
  Session — TEST  4 juin 22:40
  Session — TEST  4 juin 21:31
```

**Session detail (Preview):**
```
Session — Desktop

• Workspace: Desktop
• Folder: C:\Users\Badr\Desktop
• Saved: 04/06/2026 23:12:07
• Agents: Claude Code

## What we did
Claude Code · Claude Code
Activity captured in the full transcript below.

## Full transcript
▶ Claude Code · Claude Code
```

**Graph view:**
- Force-directed network graph
- Node types (color-coded): Workspace (white) · Session (blue) · Note (yellow) · Agent (orange)
- Interactive: drag nodes, scroll to zoom, click to open
- Shows relationships between agents, workspaces, and sessions

**Controls:**
- **Auto-save** checkbox — automatically saves sessions on close
- **Save session** button — manual save current session
- **Send to agent** dropdown — push memory notes as context to a running agent
- **Edit** tab — edit session notes in markdown
- `+` button — create new manual note
- Search memory

---

### 2.10 SXvoice Panel

Opened via 🎙 toolbar icon. Side panel.

```
SXvoice                                   READY   [×]

Local voice model
┌─────────────────────────────────────────────┐
│ Missing local Whisper engine and model.     │
│ Set SXCODE_WHISPER_BIN                      │
│ and SXCODE_WHISPER_MODEL.          [Install model] │
└─────────────────────────────────────────────┘

[🎙 Hold to talk]

Push-to-talk hotkey:    Ctrl + Shift + M

HISTORY                                   [Clear]
No voice entries yet.
```

- Local Whisper model (not cloud) — requires `SXCODE_WHISPER_BIN` + `SXCODE_WHISPER_MODEL` env vars
- **Hold to talk** button — hold to record, release to transcribe + send to focused pane
- **Push-to-talk hotkey**: `Ctrl + Shift + M` (configurable)
- **HISTORY**: log of all voice transcriptions with clear option
- `READY` / status indicator

---

### 2.11 Sound Notifications

Toggled via 🔔 toolbar icon. Also configurable in Settings → Notifications.

- Plays a system sound when an agent task completes
- Simple on/off toggle

---

### 2.12 Agent Limits Panel (YOUR ADDITION)

Accessible via: toolbar Agent ▼ dropdown → "Manage limits", or `Ctrl+Shift+L`.

```
AGENT LIMITS                              [↻]
──────────────────────────────────────────────
Claude Code                    2 accounts

  ● Account 1                    [ACTIVE]
  ┌────────────────────────────────────┐
  │ Session   [████████░░]   43% left  │
  │ Resets in 4 hours                  │
  │ Weekly    [████████████] 84% left  │
  │ Resets in 6 days                   │
  └────────────────────────────────────┘
                              [Switch]

  ○ Account 2
  ┌────────────────────────────────────┐
  │ Session   [██████████] 100% left   │
  │ Resets in 4 hours                  │
  │ Weekly    [████████░░]  61% left   │
  │ Resets in 6 days                   │
  └────────────────────────────────────┘
                              [Switch]

  [+ Add account]

──────────────────────────────────────────────
Codex CLI                      1 account

  ● Account 1                    [ACTIVE]
  Session   [█████████░]   95% left
  Weekly    N/A
──────────────────────────────────────────────
Gemini CLI                     1 account
  ...
```

**Per account:**
- Active indicator (filled dot + ACTIVE badge)
- Session % remaining + progress bar + reset time
- Weekly % remaining + progress bar + reset time
- **Switch** button — instantly swaps credentials for that provider, hot-reloads panes

**Add account:** modal → paste API key / select credentials file → test connection → save to OS keychain

**Smart auto-switch (optional):** when session drops below 10%, offer to auto-switch to next account with most quota

---

### 2.13 Settings Modal

Opened via sidebar Settings button. Modal overlay.

**Left nav tabs:**
1. **Appearance**
2. **Skills**
3. **Voice**
4. **Notifications**
5. **General**

---

#### Settings → Appearance

**Theme** (10 built-in, click to apply instantly):

| Name | Color |
|------|-------|
| Midnight | Pure black |
| Paper | White / light |
| Navy | Dark blue |
| **Graphite** | Dark gray (default) |
| Orange | Warm brown-orange |
| Red | Dark red |
| Green | Dark forest green |
| Purple | Dark purple |
| Ember | Gray-brown |
| Twilight | Dark magenta |

**Terminal Font Size:** slider, 9px – 24px (default 13px)

---

#### Settings → Skills

- "Create and manage custom agent skills"
- **New Skill** button
- List of user-created skills (empty state: "No skills created yet — Create a skill to teach agents custom behaviors")
- Skills are reusable instructions/prompts that can be triggered on any agent

---

#### Settings → Voice (SXvoice)

- **Activation Hotkey**: `Ctrl + Shift + M` (hold to record) — rebindable
- **Voice History**: **Clear History** button — "Remove all saved voice transcriptions"

---

#### Settings → Notifications

- **Sound Notifications** checkbox — "Play a sound when tasks complete"

---

#### Settings → General

- "More settings coming soon" (placeholder — SXcode v0.1.4 is early)
- Our version will add: shell path, env vars, startup workspace, keybindings

---

## 3. Tech Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Desktop | **Tauri 2** (Rust) | Same foundation as SXcode; native PTY, small binary |
| Frontend | **React + TypeScript** | Rich component ecosystem |
| Styling | **Tailwind + shadcn/ui** | Dense dark-first UI, accessible |
| Terminal | **xterm.js** + Tauri PTY | Full VT100 emulation |
| Browser pane | **Tauri WebView** child window or `<webview>` tag | Embedded Chromium |
| State | **Zustand** | Flat store per workspace |
| Persistence | **SQLite** (Tauri plugin) | Sessions, tasks, memory, usage logs |
| Secrets | **OS Keychain** (Tauri plugin) | API keys per provider per account |
| Voice | **Whisper** (local, GGML) | No cloud dependency; runs via env-var path |
| Memory graph | **D3-force** | Lightweight force-directed graph |
| Updates | **Tauri updater** | Built-in auto-update |

---

## 4. Screens / States

| Screen | Trigger |
|--------|---------|
| Home / Launcher | App start, + new workspace |
| Workspace Grid | After opening workspace |
| Canvas Mode | Canvas selected in launcher |
| Agent dropdown overlay | Agent ▼ button |
| Agent Tasks panel | ⊞ toolbar icon |
| Built-in Browser panel | 🌐 toolbar icon |
| File Preview panel | 📄 toolbar icon |
| Git panel | 🐱 toolbar icon |
| Memory window | 🧠 toolbar icon (separate window) |
| SXvoice panel | 🎙 toolbar icon |
| Agent Limits panel | Ctrl+Shift+L or via Agent ▼ |
| Settings modal | Sidebar Settings button, Ctrl+, |

---

## 5. Milestones

| Phase | Scope |
|-------|-------|
| **1 — Shell** | Launcher, workspace grid, PTY terminal, sidebar, theme system |
| **2 — Agents** | Claude + Codex + Gemini + Shell agents, Agent dropdown, status bar |
| **3 — Tools** | File Preview, Git panel, Built-in Browser, Agent Tasks |
| **4 — Memory** | Memory window (Notes + Graph), auto-save sessions, send to agent |
| **5 — Voice** | SXvoice panel, Whisper integration, push-to-talk hotkey |
| **6 — Limits** | Agent Limits panel, account add/switch, session + weekly tracking |
| **7 — Polish** | Skills system, Settings all tabs, sound notifications, Canvas mode, auto-update |

---

## 6. Open Questions

1. **Name** — what do you want to call it?
2. **OS** — Windows-only v1 or Windows + macOS from the start?
3. **Voice model** — ship with a bundled Whisper binary or require user to install?
4. **Memory storage** — local SQLite only, or optional sync to a file (export/import)?
5. **Canvas mode** — v1 or defer to v2?
