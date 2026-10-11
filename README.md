# ⚡ Chronos — OS Telemetry & Terminal Dashboard

> **Low-overhead background systems monitor and live Terminal User Interface (TUI)** built in TypeScript using **Ink (React for CLI)**. Captures real-time OS performance metrics and renders responsive charts directly inside your terminal.

---

## 🚀 Key Features

* **50ms High-Frequency Metric Sampling:** Captures per-core CPU utilization and memory pressure at 20Hz using delta calculations from Node's `os` counters and `systeminformation`.
* **Zero-GC Circular Ring Buffer:** Timeseries data is managed in fixed-size typed `Float64Array` buffers. Pushing and querying metrics produce zero dynamic V8 garbage collection allocations.
* **Full-Screen Alternate Buffer Mode:** Runs in-place full-screen (`\x1b[?1049h`) just like `btop` or `htop`. Never clutters terminal scrollback history and cleanly restores your shell prompt upon exit.
* **Compact Multi-Core Grid:** Automatically displays CPU cores in a responsive 2-column side-by-side grid, allowing 16+ core machines to display cleanly on standard terminal windows without overflow.
* **Horizontal 3-Column I/O Matrix:** Network throughput (Rx/Tx), Disk throughput (Read/Write), and socket connection states (`ESTABLISHED`, `LISTEN`, `TIME_WAIT`, `CLOSE_WAIT`) arranged side-by-side.
* **Full-Screen Process Inspector with Continuous Rolling Scroll:**
  * **Smooth Rolling-Window Scrolling:** Navigate through 300+ processes row-by-row using `j`/`k` or arrow keys.
  * **Instant Jumps:** Jump to top (`g`) or bottom (`G`), and page up/down with `[` / `]`.
  * **Real-Time Search & Filter:** Press `/` to filter processes by name, PID, or user.
  * **Instant Column Sorting:** Sort by CPU (`c`), Memory (`m`), PID (`p`), or Name (`n`).
  * **Deep Memory Map Inspection:** Press `d` to inspect Resident Set Size (RSS), Virtual Memory (VSZ), priority, user, state, and execution path.
  * **Process Termination Signals:** Send graceful `SIGTERM` (`k`) or forceful `SIGKILL` (`x`) signals directly from the TUI.
* **High-Contrast Readability:** Crisp, theme-consistent color palette (blue/cyan accents, yellow headers) engineered for dark and light terminal emulators.

---

## 📁 Project Architecture

```
chronos/
├── src/
│   ├── telemetry/
│   │   ├── RingBuffer.ts        # Zero-GC Float64Array circular buffer
│   │   ├── Sampler.ts           # 50ms OS metrics collection engine
│   │   └── types.ts             # Strongly typed telemetry interfaces
│   ├── components/
│   │   ├── Sparkline.tsx        # High-resolution ASCII sparkline renderer ( ▂▃▄▅▆▇█)
│   │   ├── Gauge.tsx            # Percentage progress gauge with color thresholds
│   │   ├── CpuPanel.tsx         # 2-column compact multi-core CPU utilization & history
│   │   ├── MemoryPanel.tsx      # RAM & Swap allocation breakdown
│   │   ├── IoPanel.tsx          # 3-column Disk I/O, Network speeds, Socket states
│   │   ├── ProcessTable.tsx     # Smooth-scrolling process inspector table
│   │   ├── ProcessDetails.tsx   # Detailed process memory map modal
│   │   ├── Header.tsx           # Uptime, host metadata, and high-contrast tab bar
│   │   └── HelpModal.tsx        # Keyboard cheat sheet overlay
│   ├── utils/
│   │   └── formatters.ts        # Unit formatting (bytes, speeds, uptime)
│   ├── App.tsx                  # Root Ink application component
│   └── index.tsx                # CLI binary entry point (alternate screen buffer)
├── test/
│   ├── ringbuffer.test.ts       # Zero-allocation ring buffer tests
│   └── sampler.test.ts          # 50ms live OS sampler tests
├── package.json
└── tsconfig.json
```

---

## ⌨️ Views & Keyboard Shortcuts

### View Tabs
| Key | View |
| :--- | :--- |
| `1` | **Dashboard View** — Compact overview with CPU grid, RAM, and I/O rates |
| `2` | **Process Inspector** — Full-screen continuous rolling process table |
| `3` | **Network & Disks** — Expanded I/O throughput & socket states |
| `Tab` | Cycle through views (`1` ➔ `2` ➔ `3` ➔ `1`) |
| `?` | Toggle **Help & Keybindings** modal |
| `q` / `Ctrl+C` | Exit Chronos and restore terminal screen |

### Process Inspector Navigation (Tab `[2]`)
| Shortcut | Action |
| :--- | :--- |
| `j` / `↓` | Move selection down (continuous smooth scroll) |
| `k` / `↑` | Move selection up (continuous smooth scroll) |
| `[` / `]` (or `PgUp` / `PgDn`) | Scroll table by page |
| `g` | Jump to the **top** (first process) |
| `G` | Jump to the **bottom** (last process) |
| `/` | Enter **Search / Filter** mode |
| `Esc` | Clear search query or close detail modal |
| `c` | Sort processes by **CPU %** (toggle asc/desc) |
| `m` | Sort processes by **Memory %** (toggle asc/desc) |
| `p` | Sort processes by **PID** |
| `n` | Sort processes by **Process Name** |
| `d` / `Enter` | Inspect **Memory Map & Process Details** (RSS, VSZ, path) |
| `k` | Send graceful termination signal (`SIGTERM`) |
| `x` | Send forceful termination signal (`SIGKILL`) |

---

## 🛠️ Getting Started

### Prerequisites
* Node.js v18+ (tested on Node v24)
* A modern terminal emulator (Windows Terminal, PowerShell, iTerm2, Alacritty, Kitty)

### Running Chronos

```bash
# Clone the repository
git clone https://github.com/Krishnanand-10/Chronos.git
cd Chronos

# Install dependencies
npm install

# Run the live TUI
npm start

# Or compile and run the production build
npm run build
node dist/index.js
```

### Running the Test Suite
```bash
npm test
```

---

## 🔬 Design Decisions & Performance

1. **Decoupled 50ms Sampling vs 100ms Rendering:**
   * Hardware metrics query the OS performance counters every **50ms (20Hz)** into typed arrays.
   * Ink's React reconciler updates are batched at **100ms (~10 FPS)** to eliminate terminal screen tearing while maintaining buttery smooth sparklines.
2. **Zero Dynamic Garbage Collection Allocations:**
   * Pushing data points to standard JavaScript arrays (`Array.push` / `shift`) at 20Hz creates continuous garbage collection pressure. Chronos uses a custom **`Float64Array` Circular Ring Buffer**, guaranteeing zero dynamic memory allocations on every tick.
3. **Alternate Screen Buffer:**
   * Uses terminal control sequences (`\x1b[?1049h` / `\x1b[?1049l`) to prevent polluting the terminal scrollback history.
