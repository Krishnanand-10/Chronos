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

  // Pair up cores for a compact 2-column grid
  const corePairs: [CpuCoreMetric, CpuCoreMetric | undefined][] = [];
  for (let i = 0; i < cores.length; i += 2) {
    corePairs.push([cores[i], cores[i + 1]]);
  }

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
      <Box marginTop={0} justifyContent="space-between">
        <Box>
          <Text color="white" bold>
            AVG:{' '}
          </Text>
          <Gauge percent={cpuAverage} width={16} />
        </Box>
        <Box marginLeft={2}>
          <Sparkline data={avgData} min={0} max={100} width={20} />
        </Box>
      </Box>

      {/* 2-Column Core Grid for Compact Layout */}
      <Box marginTop={1} flexDirection="column">
        {corePairs.slice(0, 8).map(([coreA, coreB]) => {
          const dataA = coreBuffers[coreA.core]?.toArray() || [];
          const dataB = coreB ? coreBuffers[coreB.core]?.toArray() || [] : [];

          return (
            <Box key={coreA.core} justifyContent="space-between">
              {/* Left Core */}
              <Box>
                <Text color="dim">C{coreA.core.toString().padStart(2, '0')}: </Text>
                <Gauge percent={coreA.usagePercent} width={8} showPercent={true} />
                <Box marginLeft={1}>
                  <Sparkline data={dataA} min={0} max={100} width={8} />
                </Box>
              </Box>

              {/* Right Core */}
              {coreB && (
                <Box marginLeft={2}>
                  <Text color="dim">C{coreB.core.toString().padStart(2, '0')}: </Text>
                  <Gauge percent={coreB.usagePercent} width={8} showPercent={true} />
                  <Box marginLeft={1}>
                    <Sparkline data={dataB} min={0} max={100} width={8} />
                  </Box>
                </Box>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};
