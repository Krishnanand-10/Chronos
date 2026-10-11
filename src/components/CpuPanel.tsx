import React from 'react';
import { Box, Text } from 'ink';
import { CpuCoreMetric } from '../telemetry/types.js';
import { RingBuffer } from '../telemetry/RingBuffer.js';
import { Sparkline } from './Sparkline.js';
import { Gauge } from './Gauge.js';

export interface CpuPanelProps {
  cpuAverage: number;
  cores: CpuCoreMetric[];
  avgBuffer: RingBuffer;
  coreBuffers: RingBuffer[];
}

export const CpuPanel: React.FC<CpuPanelProps> = ({
  cpuAverage,
  cores,
  avgBuffer,
  coreBuffers,
}) => {
  const avgData = avgBuffer.toArray();
  const minAvg = avgBuffer.getMin();
  const maxAvg = avgBuffer.getMax();

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="cyan"
      paddingX={1}
      flexGrow={1}
    >
      <Box justifyContent="space-between">
        <Text bold color="cyan">
          CPU UTILIZATION ({cores.length} Cores)
        </Text>
        <Text color="gray">
          Min: <Text color="green">{minAvg.toFixed(1)}%</Text> | Max:{' '}
          <Text color="red">{maxAvg.toFixed(1)}%</Text>
        </Text>
      </Box>

      {/* Average CPU Bar + Sparkline */}
      <Box marginTop={1} justifyContent="space-between">
        <Box>
          <Text color="white" bold>
            AVG:{' '}
          </Text>
          <Gauge percent={cpuAverage} width={20} />
        </Box>
        <Box marginLeft={2}>
          <Sparkline data={avgData} min={0} max={100} width={24} />
        </Box>
      </Box>

      <Box
        marginTop={1}
        flexDirection="column"
        overflow="hidden"
      >
        {/* Render cores in rows (2 cores per row or responsive list) */}
        {cores.slice(0, 8).map((core) => {
          const coreData = coreBuffers[core.core]?.toArray() || [];
          return (
            <Box key={core.core} justifyContent="space-between" marginY={0}>
              <Box>
                <Text color="dim">
                  C{core.core.toString().padStart(2, '0')}:{' '}
                </Text>
                <Gauge percent={core.usagePercent} width={12} showPercent={true} />
              </Box>
              <Box marginLeft={1}>
                <Sparkline data={coreData} min={0} max={100} width={16} />
              </Box>
            </Box>
          );
        })}
        {cores.length > 8 && (
          <Text color="dim" italic>
            + {cores.length - 8} more cores active...
          </Text>
        )}
      </Box>
    </Box>
  );
};
