import { TelemetrySampler } from '../src/telemetry/Sampler.js';

console.log('Testing TelemetrySampler (50ms sampling)...');

const sampler = new TelemetrySampler({
  sampleIntervalMs: 50,
  historyLength: 20,
  processIntervalMs: 500,
  ioIntervalMs: 200,
});

sampler.start();

let tickCount = 0;
const unsubscribe = sampler.subscribe((snap) => {
  tickCount++;
  if (tickCount === 5) {
    console.log(`Snapshot at tick ${tickCount}:`);
    console.log(`- Hostname: ${snap.hostname}`);
    console.log(`- OS: ${snap.osName}`);
    console.log(`- CPU Avg: ${snap.cpuAverage.toFixed(2)}%`);
    console.log(`- Cores: ${snap.cores.length}`);
    console.log(`- Memory: ${snap.memory.usedPercent.toFixed(2)}% used`);
    console.log(`- CPU RingBuffer points: ${sampler.cpuAverageBuffer.size}`);
    console.log(`- Sockets Total: ${snap.sockets.total}`);

    unsubscribe();
    sampler.stop();
    console.log('✅ TelemetrySampler tests passed successfully!');
    process.exit(0);
  }
});
