export interface CpuCoreMetric {
  core: number;
  usagePercent: number;
}

export interface MemoryMetric {
  totalBytes: number;
  freeBytes: number;
  usedBytes: number;
  usedPercent: number;
  activeBytes: number;
  availableBytes: number;
  swapTotalBytes: number;
  swapUsedBytes: number;
}

export interface DiskIoMetric {
  readBytesSec: number;
  writeBytesSec: number;
  totalBytesSec: number;
}

export interface NetworkIoMetric {
  rxBytesSec: number;
  txBytesSec: number;
  totalBytesSec: number;
}

export interface SocketMetric {
  established: number;
  listen: number;
  timeWait: number;
  closeWait: number;
  other: number;
  total: number;
}

export interface ProcessItem {
  pid: number;
  name: string;
  cpu: number;
  mem: number;
  memRss: number;
  memVsz: number;
  user: string;
  state: string;
  command: string;
  path: string;
  priority: number;
}

export interface SystemSnapshot {
  timestamp: number;
  cpuAverage: number;
  cores: CpuCoreMetric[];
  memory: MemoryMetric;
  diskIo: DiskIoMetric;
  networkIo: NetworkIoMetric;
  sockets: SocketMetric;
  uptimeSeconds: number;
  osName: string;
  hostname: string;
  kernel: string;
  processes: ProcessItem[];
}
