# ⚡ Chronos — OS Telemetry & Terminal Dashboard

> **Low-overhead background systems monitor and live Terminal User Interface (TUI)** built in TypeScript using **Ink (React for CLI)**. Captures real-time OS performance metrics and renders responsive charts directly inside your terminal.

---

## 🚀 Key Features

* **50ms High-Frequency Metric Sampling:** Captures per-core CPU utilization and memory pressure at 20Hz using delta calculations from Node's `os` counters and `systeminformation`.
* **Zero-GC Circular Ring Buffer:** Timeseries data is managed in fixed-size typed `Float64Array` buffers. Pushing and querying metrics produce zero dynamic V8 garbage collection allocations.
* **Interactive Terminal User Interface:** Declarative layout powered by React and Ink featuring live multi-level ASCII sparklines (` ▂▃▄▅▆▇█`), dynamic gauges, and network/disk throughput meters.
* **Full Process Inspector:**
  * Interactive table with keyboard navigation (`j` / `k` or arrows, `PgUp` / `PgDn`).
  * Real-time search and filter mode (`/`).
  * Instant column sorting by CPU (`c`), Memory (`m`), PID (`p`), or Name (`n`).
  * Memory map modal inspection (`d` / `Enter`) showing RSS, Virtual Memory (VSZ), priority, user, and command path.
  * Process termination signals: graceful `SIGTERM` (`k`) or forceful `SIGKILL` (`x`).

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
│   │   ├── Sparkline.tsx        # High-resolution ASCII sparkline renderer
│   │   ├── Gauge.tsx            # Percentage progress gauge with color thresholds
│   │   ├── CpuPanel.tsx         # Multi-core CPU utilization & history
│   │   ├── MemoryPanel.tsx      # RAM & Swap allocation breakdown
│   │   ├── IoPanel.tsx          # Disk I/O, Network speeds, Socket states
│   │   ├── ProcessTable.tsx     # Keyboard-driven process list
│   │   ├── ProcessDetails.tsx   # Detailed process memory map modal
│   │   ├── Header.tsx           # Uptime, host metadata, and tab bar
│   │   └── HelpModal.tsx        # Keyboard cheat sheet overlay
│   ├── utils/
│   │   └── formatters.ts        # Unit formatting (bytes, speeds, uptime)
│   ├── App.tsx                  # Root Ink application component
│   └── index.tsx                # CLI binary entry point
├── test/
│   ├── ringbuffer.test.ts       # Zero-allocation ring buffer tests
│   └── sampler.test.ts          # 50ms live OS sampler tests
├── package.json
└── tsconfig.json
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Description |
| :--- | :--- |
| `1` | Switch to **Overview Dashboard** view |
| `2` | Switch to **Process Inspector** view |
| `?` | Toggle **Help & Keybindings** modal |
| `j` / `↓` | Move selection down |
| `k` / `↑` | Move selection up |
| `PgUp` / `PgDn` | Page through processes |
| `/` | Enter **Search / Filter** mode |
| `Esc` | Clear search query or close detail modal |
| `c` | Sort processes by **CPU %** |
| `m` | Sort processes by **Memory %** |
| `p` | Sort processes by **PID** |
| `n` | Sort processes by **Process Name** |
| `d` / `Enter` | Open **Memory Map & Process Details** modal |
| `k` | Terminate process gracefully (`SIGTERM`) |
| `x` | Force kill process (`SIGKILL`) |
| `q` / `Ctrl+C` | Exit Chronos safely |

---

## 🛠️ Getting Started

### Prerequisites
* Node.js v18+ (tested on Node v24)
* A modern terminal emulator (Windows Terminal, iTerm2, Alacritty, Kitty, or native terminal)

### Running Chronos

```bash
# Install dependencies
npm install

# Run directly with tsx
npm start

# Or compile and run the production build
npm run build
node dist/index.js
```

### Running Tests
```bash
npx tsx test/ringbuffer.test.ts
npx tsx test/sampler.test.ts
```

---

## 🔬 Design Decisions & Performance

1. **Decoupled Sampling from TUI Rendering:**
   * High-frequency telemetry runs at **50ms** directly into the `Float64Array` ring buffers.
   * Ink's React state update is throttled to **100ms (~10 FPS)** to prevent terminal emulator cursor flicker and buffer tearing while maintaining responsive UI charts.
2. **Zero Dynamic GC Allocation:**
   * Traditional JavaScript array manipulations (`push`/`shift`) at 20Hz create constant heap garbage and trigger V8 GC pauses. `RingBuffer` uses pre-allocated typed arrays that overwrite in $O(1)$ without allocating objects.
