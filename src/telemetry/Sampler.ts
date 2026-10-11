import os from 'os';
import si from 'systeminformation';
import { RingBuffer } from './RingBuffer.js';
import {
  CpuCoreMetric,
  DiskIoMetric,
  MemoryMetric,
  NetworkIoMetric,
  ProcessItem,
  SocketMetric,
  SystemSnapshot,
} from './types.js';

export interface SamplerConfig {
  sampleIntervalMs?: number;    // default 50ms
  historyLength?: number;       // default 80 datapoints
  processIntervalMs?: number;   // default 1000ms
  ioIntervalMs?: number;        // default 250ms
}

export class TelemetrySampler {
  private isRunning: boolean = false;
  private fastTimer: NodeJS.Timeout | null = null;
  private ioTimer: NodeJS.Timeout | null = null;
  private procTimer: NodeJS.Timeout | null = null;

  public readonly config: Required<SamplerConfig>;

  // Ring buffers (Float64Array zero-GC)
  public readonly cpuAverageBuffer: RingBuffer;
  public readonly cpuCoreBuffers: RingBuffer[];
  public readonly memoryBuffer: RingBuffer;
  public readonly diskReadBuffer: RingBuffer;
  public readonly diskWriteBuffer: RingBuffer;
  public readonly netRxBuffer: RingBuffer;
  public readonly netTxBuffer: RingBuffer;

  // Previous CPU times for delta calculations
  private lastCpuTimes: os.CpuInfo[];

  // Current metric states
  private currentCores: CpuCoreMetric[] = [];
  private currentCpuAvg: number = 0;
  private currentMemory: MemoryMetric;
  private currentDiskIo: DiskIoMetric = { readBytesSec: 0, writeBytesSec: 0, totalBytesSec: 0 };
  private currentNetworkIo: NetworkIoMetric = { rxBytesSec: 0, txBytesSec: 0, totalBytesSec: 0 };
  private currentSockets: SocketMetric = {
    established: 0,
    listen: 0,
    timeWait: 0,
    closeWait: 0,
    other: 0,
    total: 0,
  };
  private currentProcesses: ProcessItem[] = [];

  // Static OS metadata
  public readonly osName: string;
  public readonly hostname: string;
  public readonly kernel: string;

  private listeners: ((snapshot: SystemSnapshot) => void)[] = [];

  constructor(config: SamplerConfig = {}) {
    this.config = {
      sampleIntervalMs: config.sampleIntervalMs ?? 50,
      historyLength: config.historyLength ?? 80,
      processIntervalMs: config.processIntervalMs ?? 1000,
      ioIntervalMs: config.ioIntervalMs ?? 250,
    };

    const initialCpus = os.cpus();
    this.lastCpuTimes = initialCpus;

    this.cpuAverageBuffer = new RingBuffer(this.config.historyLength);
    this.cpuCoreBuffers = initialCpus.map(() => new RingBuffer(this.config.historyLength));
    this.memoryBuffer = new RingBuffer(this.config.historyLength);
    this.diskReadBuffer = new RingBuffer(this.config.historyLength);
    this.diskWriteBuffer = new RingBuffer(this.config.historyLength);
    this.netRxBuffer = new RingBuffer(this.config.historyLength);
    this.netTxBuffer = new RingBuffer(this.config.historyLength);

    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    this.currentMemory = {
      totalBytes: totalMem,
      freeBytes: freeMem,
      usedBytes: usedMem,
      usedPercent: (usedMem / totalMem) * 100,
      activeBytes: usedMem,
      availableBytes: freeMem,
      swapTotalBytes: 0,
      swapUsedBytes: 0,
    };

    this.osName = `${os.type()} ${os.release()} (${os.arch()})`;
    this.hostname = os.hostname();
    this.kernel = os.version?.() || os.release();
  }

  /**
   * Register a listener for telemetry updates.
   */
  public subscribe(callback: (snapshot: SystemSnapshot) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  /**
   * Start the telemetry sampling loops.
   */
  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    // Initial warm-up
    this.sampleFastCounters();
    this.sampleIoAndSockets();
    this.sampleProcesses();

    // 1. High-frequency 50ms loop for CPU & Memory
    this.fastTimer = setInterval(() => {
      this.sampleFastCounters();
    }, this.config.sampleIntervalMs);

    // 2. I/O and Sockets loop
    this.ioTimer = setInterval(() => {
      this.sampleIoAndSockets();
    }, this.config.ioIntervalMs);

    // 3. Process inspection loop
    this.procTimer = setInterval(() => {
      this.sampleProcesses();
    }, this.config.processIntervalMs);
  }

  /**
   * Stop all telemetry timers.
   */
  public stop(): void {
    this.isRunning = false;
    if (this.fastTimer) {
      clearInterval(this.fastTimer);
      this.fastTimer = null;
    }
    if (this.ioTimer) {
      clearInterval(this.ioTimer);
      this.ioTimer = null;
    }
    if (this.procTimer) {
      clearInterval(this.procTimer);
      this.procTimer = null;
    }
    this.listeners = [];
  }

  /**
   * 50ms Fast sampling: per-core CPU and memory pressure.
   */
  private sampleFastCounters(): void {
    const currentCpus = os.cpus();
    let sumUsage = 0;
    const newCoreMetrics: CpuCoreMetric[] = [];

    for (let i = 0; i < currentCpus.length; i++) {
      const prev = this.lastCpuTimes[i]?.times || { user: 0, nice: 0, sys: 0, idle: 0, irq: 0 };
      const curr = currentCpus[i].times;

      const prevTotal = prev.user + prev.nice + prev.sys + prev.idle + prev.irq;
      const currTotal = curr.user + curr.nice + curr.sys + curr.idle + curr.irq;

      const deltaTotal = currTotal - prevTotal;
      const deltaIdle = curr.idle - prev.idle;

      let usage = 0;
      if (deltaTotal > 0) {
        usage = ((deltaTotal - deltaIdle) / deltaTotal) * 100;
        usage = Math.max(0, Math.min(100, usage));
      }

      sumUsage += usage;
      newCoreMetrics.push({ core: i, usagePercent: usage });

      if (this.cpuCoreBuffers[i]) {
        this.cpuCoreBuffers[i].push(usage);
      }
    }

    this.lastCpuTimes = currentCpus;
    this.currentCores = newCoreMetrics;
    this.currentCpuAvg = currentCpus.length > 0 ? sumUsage / currentCpus.length : 0;
    this.cpuAverageBuffer.push(this.currentCpuAvg);

    // Memory sampling
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;
    const percent = total > 0 ? (used / total) * 100 : 0;

    this.currentMemory = {
      ...this.currentMemory,
      totalBytes: total,
      freeBytes: free,
      usedBytes: used,
      usedPercent: percent,
      availableBytes: free,
    };
    this.memoryBuffer.push(percent);

    this.notifySnapshot();
  }

  /**
   * Disk I/O, Network I/O, and Socket states sampling.
   */
  private async sampleIoAndSockets(): Promise<void> {
    try {
      const [netStats, sockets, memDetailed, diskStats] = await Promise.allSettled([
        si.networkStats(),
        si.networkConnections(),
        si.mem(),
        si.disksIO(),
      ]);

      // Network Stats
      if (netStats.status === 'fulfilled' && Array.isArray(netStats.value) && netStats.value.length > 0) {
        let totalRxSec = 0;
        let totalTxSec = 0;
        for (const iface of netStats.value) {
          if (iface.rx_sec && iface.rx_sec > 0) totalRxSec += iface.rx_sec;
          if (iface.tx_sec && iface.tx_sec > 0) totalTxSec += iface.tx_sec;
        }
        this.currentNetworkIo = {
          rxBytesSec: totalRxSec,
          txBytesSec: totalTxSec,
          totalBytesSec: totalRxSec + totalTxSec,
        };
        this.netRxBuffer.push(totalRxSec);
        this.netTxBuffer.push(totalTxSec);
      }

      // Disk I/O
      if (diskStats.status === 'fulfilled' && diskStats.value) {
        const d = diskStats.value;
        const rSec = d.rIO_sec ? d.rIO_sec * 512 : 0; // standard sector size estimate if bytes not explicit
        const wSec = d.wIO_sec ? d.wIO_sec * 512 : 0;
        this.currentDiskIo = {
          readBytesSec: rSec,
          writeBytesSec: wSec,
          totalBytesSec: rSec + wSec,
        };
        this.diskReadBuffer.push(rSec);
        this.diskWriteBuffer.push(wSec);
      }

      // Memory breakdown details (active, swap, buffers)
      if (memDetailed.status === 'fulfilled' && memDetailed.value) {
        const m = memDetailed.value;
        this.currentMemory = {
          ...this.currentMemory,
          activeBytes: m.active || this.currentMemory.usedBytes,
          availableBytes: m.available || this.currentMemory.freeBytes,
          swapTotalBytes: m.swaptotal || 0,
          swapUsedBytes: m.swapused || 0,
        };
      }

      // Socket states breakdown
      if (sockets.status === 'fulfilled' && Array.isArray(sockets.value)) {
        let established = 0;
        let listen = 0;
        let timeWait = 0;
        let closeWait = 0;
        let other = 0;

        for (const conn of sockets.value) {
          const st = (conn.state || '').toUpperCase();
          if (st === 'ESTABLISHED') established++;
          else if (st === 'LISTEN' || st === 'LISTENING') listen++;
          else if (st === 'TIME_WAIT') timeWait++;
          else if (st === 'CLOSE_WAIT') closeWait++;
          else if (st && st !== 'FOREIGN') other++;
        }

        this.currentSockets = {
          established,
          listen,
          timeWait,
          closeWait,
          other,
          total: sockets.value.length,
        };
      }
    } catch {
      // Graceful fallback to avoid uncaught exceptions during quick polling
    }
  }

  /**
   * Process inspection sampling.
   */
  private async sampleProcesses(): Promise<void> {
    try {
      const procData = await si.processes();
      if (!procData || !procData.list) return;

      this.currentProcesses = procData.list.map((p) => ({
        pid: p.pid,
        name: p.name || 'unknown',
        cpu: p.cpu || 0,
        mem: p.mem || 0,
        memRss: (p.memRss || 0) * 1024, // KB to Bytes
        memVsz: (p.memVsz || 0) * 1024, // KB to Bytes
        user: p.user || '',
        state: p.state || '',
        command: p.command || p.name || '',
        path: p.path || '',
        priority: p.priority ?? 0,
      }));
    } catch {
      // Keep existing processes on transient error
    }
  }

  public getSnapshot(): SystemSnapshot {
    return {
      timestamp: Date.now(),
      cpuAverage: this.currentCpuAvg,
      cores: this.currentCores,
      memory: this.currentMemory,
      diskIo: this.currentDiskIo,
      networkIo: this.currentNetworkIo,
      sockets: this.currentSockets,
      uptimeSeconds: os.uptime(),
      osName: this.osName,
      hostname: this.hostname,
      kernel: this.kernel,
      processes: this.currentProcesses,
    };
  }

  private notifySnapshot(): void {
    if (this.listeners.length === 0) return;
    const snap = this.getSnapshot();
    for (const listener of this.listeners) {
      listener(snap);
    }
  }
}
