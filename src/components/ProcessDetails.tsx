import React from 'react';
import { Box, Text } from 'ink';
import { ProcessItem } from '../telemetry/types.js';
import { formatBytes } from '../utils/formatters.js';

export interface ProcessDetailsProps {
  process: ProcessItem | null;
  onClose: () => void;
  onKill: (pid: number, signal: 'SIGTERM' | 'SIGKILL') => void;
}

export const ProcessDetails: React.FC<ProcessDetailsProps> = ({
  process: proc,
  onKill,
}) => {
  if (!proc) return null;

  return (
    <Box
      flexDirection="column"
      borderStyle="double"
      borderColor="yellow"
      paddingX={2}
      paddingY={1}
      marginTop={1}
    >
      <Box justifyContent="space-between">
        <Text bold color="yellow">
          PROCESS MEMORY MAP & DETAILS — PID {proc.pid}
        </Text>
        <Text color="gray">[Press 'd' or 'Esc' to Close]</Text>
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Box>
          <Text bold color="white">Name: </Text>
          <Text color="cyan">{proc.name}</Text>
        </Box>
        <Box>
          <Text bold color="white">User: </Text>
          <Text>{proc.user || 'N/A'}</Text>
        </Box>
        <Box>
          <Text bold color="white">State: </Text>
          <Text color={proc.state === 'running' ? 'green' : 'dim'}>
            {proc.state || 'N/A'}
          </Text>
        </Box>
        <Box>
          <Text bold color="white">Priority / Nice: </Text>
          <Text>{proc.priority}</Text>
        </Box>

        {/* Memory Map Breakdown */}
        <Box marginTop={1} flexDirection="column">
          <Text bold color="magenta">
            MEMORY ALLOCATION:
          </Text>
          <Box justifyContent="space-between">
            <Text color="dim">Resident Set Size (RSS):</Text>
            <Text color="green" bold>{formatBytes(proc.memRss)}</Text>
          </Box>
          <Box justifyContent="space-between">
            <Text color="dim">Virtual Memory Size (VSZ):</Text>
            <Text color="yellow" bold>{formatBytes(proc.memVsz)}</Text>
          </Box>
          <Box justifyContent="space-between">
            <Text color="dim">Memory Utilization %:</Text>
            <Text color="cyan">{proc.mem.toFixed(2)}%</Text>
          </Box>
          <Box justifyContent="space-between">
            <Text color="dim">CPU Utilization %:</Text>
            <Text color="red">{proc.cpu.toFixed(2)}%</Text>
          </Box>
        </Box>

        <Box marginTop={1} flexDirection="column">
          <Text bold color="white">Path:</Text>
          <Text color="gray">{proc.path || 'N/A'}</Text>
          <Text bold color="white">Command:</Text>
          <Text color="gray">{proc.command || 'N/A'}</Text>
        </Box>

        <Box marginTop={1}>
          <Text bold color="red">
            Actions: [k] Terminate (SIGTERM) | [x] Kill Forcefully (SIGKILL)
          </Text>
        </Box>
      </Box>
    </Box>
  );
};
