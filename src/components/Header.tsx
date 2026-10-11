import React from 'react';
import { Box, Text, useStdout } from 'ink';
import { formatUptime, truncateText } from '../utils/formatters.js';

export type ActiveTab = 'dashboard' | 'processes' | 'io' | 'help';

export interface HeaderProps {
  osName: string;
  hostname: string;
  uptimeSeconds: number;
  activeTab: ActiveTab;
}

export const Header: React.FC<HeaderProps> = ({
  osName,
  hostname,
  uptimeSeconds,
  activeTab,
}) => {
  const { stdout } = useStdout();
  const width = process.stdout.columns || (stdout as any)?.columns || 80;
  const isCompact = width < 105;

  return (
    <Box
      flexDirection="column"
      borderStyle="classic"
      borderColor="cyan"
      paddingX={1}
      marginBottom={1}
    >
      {/* Top Title & Host Row */}
      <Box justifyContent="space-between">
        <Box>
          <Text bold color="cyan">
            ⚡ CHRONOS
          </Text>
          {!isCompact && (
            <Text color="gray"> — OS Telemetry & Terminal Dashboard</Text>
          )}
        </Box>
        <Box>
          <Text color="dim">Host: </Text>
          <Text color="white" bold>
            {truncateText(hostname, isCompact ? 14 : 28)}
          </Text>
          <Text color="dim"> | Uptime: </Text>
          <Text color="green">{formatUptime(uptimeSeconds)}</Text>
        </Box>
      </Box>

      {/* Navigation Tabs Row - Responsive to terminal width */}
      <Box justifyContent="space-between" marginTop={0}>
        <Box>
          <Text color="dim">OS: </Text>
          <Text color="gray">{truncateText(osName, isCompact ? 18 : 36)}</Text>
        </Box>
        <Box>
          <Text
            color={activeTab === 'dashboard' ? 'black' : 'gray'}
            backgroundColor={activeTab === 'dashboard' ? 'cyan' : undefined}
            bold={activeTab === 'dashboard'}
          >
            {isCompact ? ' [1] Dash ' : ' [1] Dashboard '}
          </Text>
          <Text
            color={activeTab === 'processes' ? 'white' : 'gray'}
            backgroundColor={activeTab === 'processes' ? 'blue' : undefined}
            bold={activeTab === 'processes'}
          >
            {isCompact ? ' [2] Procs ' : ' [2] Processes (Scroll) '}
          </Text>
          <Text
            color={activeTab === 'io' ? 'white' : 'gray'}
            backgroundColor={activeTab === 'io' ? 'magenta' : undefined}
            bold={activeTab === 'io'}
          >
            {isCompact ? ' [3] I/O ' : ' [3] Network & Disks '}
          </Text>
          <Text
            color={activeTab === 'help' ? 'black' : 'gray'}
            backgroundColor={activeTab === 'help' ? 'yellow' : undefined}
            bold={activeTab === 'help'}
          >
            {' '}[?] Help{' '}
          </Text>
        </Box>
      </Box>
    </Box>
  );
};
