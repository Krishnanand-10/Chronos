import React from 'react';
import { Text } from 'ink';

const TICKS = [' ', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

export interface SparklineProps {
  data: number[];
  min?: number;
  max?: number;
  width?: number;
  color?: string;
  gradient?: boolean;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  min,
  max,
  width,
  color = 'cyan',
  gradient = true,
}) => {
  if (!data || data.length === 0) {
    return <Text color="gray">{'─'.repeat(width || 10)}</Text>;
  }

  // Slice to max width if specified
  const values = width && data.length > width ? data.slice(data.length - width) : data;

  const dataMin = min !== undefined ? min : Math.min(...values);
  const dataMax = max !== undefined ? max : Math.max(...values);
  const range = dataMax - dataMin || 1;

  if (gradient) {
    return (
      <Text>
        {values.map((val, idx) => {
          const normalized = Math.min(Math.max((val - dataMin) / range, 0), 1);
          const tickIndex = Math.min(
            Math.floor(normalized * TICKS.length),
            TICKS.length - 1
          );
          const char = TICKS[tickIndex];

          let charColor = 'green';
          if (normalized > 0.8) charColor = 'red';
          else if (normalized > 0.5) charColor = 'yellow';

          return (
            <Text key={idx} color={charColor}>
              {char}
            </Text>
          );
        })}
      </Text>
    );
  }

  const chars = values
    .map((val) => {
      const normalized = Math.min(Math.max((val - dataMin) / range, 0), 1);
      const tickIndex = Math.min(
        Math.floor(normalized * TICKS.length),
        TICKS.length - 1
      );
      return TICKS[tickIndex];
    })
    .join('');

  return <Text color={color}>{chars}</Text>;
};
