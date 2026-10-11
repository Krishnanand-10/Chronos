import React from 'react';
import { Box, Text } from 'ink';
import { MemoryMetric } from '../telemetry/types.js';
import { RingBuffer } from '../telemetry/RingBuffer.js';
import { Gauge } from './Gauge.js';
import { Sparkline } from './Sparkline.js';
import { formatBytes } from '../utils/formatters.js';

export interface MemoryPanelProps {
  memory: MemoryMetric;
  memBuffer: RingBuffer;
}

export const MemoryPanel: React.FC<MemoryPanelProps> = ({ memory, memBuffer }) => {
  const memData = memBuffer.toArray();
  const swapPercent =
    memory.swapTotalBytes > 0
      ? (memory.swapUsedBytes / memory.swapTotalBytes) * 100
      : 0;

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="magenta"
      paddingX={1}
      flexGrow={1}
    >
      <Box justifyContent="space-between">
        <Text bold color="magenta">
          MEMORY PRESSURE
        </Text>
        <Text color="gray">
          {formatBytes(memory.usedBytes)} / {formatBytes(memory.totalBytes)}
        </Text>
      </Box>

      {/* RAM Gauge + Sparkline */}
      <Box marginTop={1} justifyContent="space-between">
        <Box>
          <Text color="white" bold>
            RAM:{' '}
          </Text>
          <Gauge percent={memory.usedPercent} width={20} />
        </Box>
        <Box marginLeft={2}>
          <Sparkline data={memData} min={0} max={100} width={24} />
        </Box>
      </Box>

      {/* Detailed Memory Stats */}
      <Box marginTop={1} flexDirection="column">
        <Box justifyContent="space-between">
          <Text color="dim">Free Memory:</Text>
          <Text color="green">{formatBytes(memory.freeBytes)}</Text>
        </Box>
        <Box justifyContent="space-between">
          <Text color="dim">Active / Used:</Text>
          <Text color="yellow">{formatBytes(memory.activeBytes)}</Text>
        </Box>
        <Box justifyContent="space-between">
          <Text color="dim">Available:</Text>
          <Text color="cyan">{formatBytes(memory.availableBytes)}</Text>
        </Box>

        {memory.swapTotalBytes > 0 && (
          <Box marginTop={1} flexDirection="column">
            <Box justifyContent="space-between">
              <Text color="dim">Swap Usage:</Text>
              <Text color="gray">
                {formatBytes(memory.swapUsedBytes)} / {formatBytes(memory.swapTotalBytes)}
              </Text>
            </Box>
            <Box marginTop={0}>
              <Gauge percent={swapPercent} width={18} />
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};
