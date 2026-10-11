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

// Clear console on launch
process.stdout.write('\x1b[2J\x1b[0f');

const appInstance = render(<App sampler={sampler} />);

const cleanup = () => {
  sampler.stop();
  appInstance.unmount();
  // Ensure cursor is visible
  process.stdout.write('\x1b[?25h');
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
