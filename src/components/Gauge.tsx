import React from 'react';
import { Box, Text } from 'ink';

export interface GaugeProps {
  percent: number;
  width?: number;
  showPercent?: boolean;
  filledChar?: string;
  emptyChar?: string;
}

export const Gauge: React.FC<GaugeProps> = ({
  percent,
  width = 16,
  showPercent = true,
  filledChar = '█',
  emptyChar = '░',
}) => {
  const safePercent = Math.max(0, Math.min(100, percent));
  const filledCount = Math.round((safePercent / 100) * width);
  const emptyCount = Math.max(0, width - filledCount);

  let barColor = 'green';
  if (safePercent >= 85) {
    barColor = 'red';
  } else if (safePercent >= 65) {
    barColor = 'yellow';
  }

  return (
    <Box>
      <Text color={barColor}>{filledChar.repeat(filledCount)}</Text>
      <Text color="gray">{emptyChar.repeat(emptyCount)}</Text>
      {showPercent && (
        <Text color="white" bold>
          {' '}{safePercent.toFixed(1).padStart(5)}%
        </Text>
      )}
    </Box>
  );
};
