#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import { App } from './App.js';
import { TelemetrySampler } from './telemetry/Sampler.js';

// Instantiate sampler with 50ms fast loop
const sampler = new TelemetrySampler({
  sampleIntervalMs: 50,
  historyLength: 80,
  processIntervalMs: 1000,
  ioIntervalMs: 250,
});

// Enter alternate screen buffer & hide cursor
process.stdout.write('\x1b[?1049h\x1b[?25l');

const appInstance = render(<App sampler={sampler} />);

let isCleaningUp = false;
const cleanup = () => {
  if (isCleaningUp) return;
  isCleaningUp = true;
  sampler.stop();
  appInstance.unmount();
  // Clear screen, leave alternate screen buffer & restore cursor cleanly
  process.stdout.write('\x1b[2J\x1b[0f\x1b[?1049l\x1b[?25h');
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Handle exit when user presses 'q' or when Ink unmounts
appInstance.waitUntilExit().then(cleanup).catch(cleanup);
