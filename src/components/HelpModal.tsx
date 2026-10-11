import React from 'react';
import { Box, Text } from 'ink';

export interface HelpModalProps {
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  return (
    <Box
      flexDirection="column"
      borderStyle="double"
      borderColor="yellow"
      paddingX={2}
      paddingY={1}
      flexGrow={1}
    >
      <Box justifyContent="space-between">
        <Text bold color="yellow">
          📖 CHRONOS — KEYBOARD SHORTCUTS & HELP
        </Text>
        <Text color="gray">[Press '?' or '1' to return]</Text>
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text bold color="cyan">
          VIEW NAVIGATION:
        </Text>
        <Text>  [1]           Switch to Overview Dashboard</Text>
        <Text>  [2]           Switch to Full-Screen Process Inspector</Text>
        <Text>  [?]           Toggle this Help Screen</Text>
        <Text>  [q] / [Ctrl+C] Exit Chronos</Text>
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text bold color="green">
          PROCESS INSPECTOR & CONTROLS:
        </Text>
        <Text>  [j] / [Down]  Move selection down</Text>
        <Text>  [k] / [Up]    Move selection up</Text>
        <Text>  [PgUp/PgDn]   Scroll table by page</Text>
        <Text>  [/]           Enter Search / Filter mode</Text>
        <Text>  [Esc]         Clear search filter or dismiss modal</Text>
        <Text>  [c]           Sort processes by CPU % (toggle asc/desc)</Text>
        <Text>  [m]           Sort processes by Memory % (toggle asc/desc)</Text>
        <Text>  [p]           Sort processes by PID</Text>
        <Text>  [n]           Sort processes by Process Name</Text>
        <Text>  [d] / [Enter] Inspect Process Details & Memory Map</Text>
        <Text>  [k]           Send graceful SIGTERM signal</Text>
        <Text>  [x]           Send forceful SIGKILL signal</Text>
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text bold color="magenta">
          ARCHITECTURE & SAMPLING:
        </Text>
        <Text color="gray">
          • Metric Ingestion: OS performance counters queried every 50ms.
        </Text>
        <Text color="gray">
          • Zero-GC Buffers: Timeseries recorded via Float64Array ring buffers.
        </Text>
        <Text color="gray">
          • Responsive TUI: Declarative Ink terminal rendering.
        </Text>
      </Box>
    </Box>
  );
};
