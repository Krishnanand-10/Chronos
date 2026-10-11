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

  const displayedCores = cores.slice(0, 8);

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
          CPU ({cores.length} Cores)
        </Text>
        <Text color="gray">
          <Text color="green">{minAvg.toFixed(0)}%</Text>-<Text color="red">{maxAvg.toFixed(0)}%</Text>
        </Text>
      </Box>

      {/* Average CPU Bar + Sparkline */}
      <Box marginTop={0} justifyContent="space-between">
        <Box>
          <Text color="white" bold>
            AVG:{' '}
          </Text>
          <Gauge percent={cpuAverage} width={8} />
        </Box>
        <Box marginLeft={1}>
          <Sparkline data={avgData} min={0} max={100} width={10} />
        </Box>
      </Box>

      {/* Core Rows: Compact gauge & sparklines to fit 40-col split */}
      <Box marginTop={1} flexDirection="column">
        {displayedCores.map((core) => {
          const coreData = coreBuffers[core.core]?.toArray() || [];
          return (
            <Box key={core.core} justifyContent="space-between">
              <Box>
                <Text color="dim">C{core.core.toString().padStart(2, '0')}: </Text>
                <Gauge percent={core.usagePercent} width={7} showPercent={true} />
              </Box>
              <Box marginLeft={1}>
                <Sparkline data={coreData} min={0} max={100} width={8} />
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};
