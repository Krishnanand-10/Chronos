import React from 'react';
import { Box, Text } from 'ink';
import { formatUptime } from '../utils/formatters.js';

export type ActiveTab = 'dashboard' | 'processes' | 'help';

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
  return (
    <Box
      flexDirection="column"
      borderStyle="classic"
      borderColor="white"
      paddingX={1}
      marginBottom={1}
    >
      <Box justifyContent="space-between">
        <Box>
          <Text bold color="cyan">
            ⚡ CHRONOS
          </Text>
          <Text color="gray"> — OS Telemetry & Terminal Dashboard</Text>
        </Box>
        <Box>
          <Text color="dim">Host: </Text>
          <Text color="white" bold>
            {hostname}
          </Text>
          <Text color="dim"> | Uptime: </Text>
          <Text color="green">{formatUptime(uptimeSeconds)}</Text>
        </Box>
      </Box>

      <Box justifyContent="space-between" marginTop={0}>
        <Box>
          <Text color="dim">OS: </Text>
          <Text color="gray">{osName}</Text>
        </Box>
        <Box>
          <Text
            color={activeTab === 'dashboard' ? 'black' : 'white'}
            backgroundColor={activeTab === 'dashboard' ? 'cyan' : undefined}
            bold={activeTab === 'dashboard'}
          >
            {' '}[1] Dashboard{' '}
          </Text>
          <Text
            color={activeTab === 'processes' ? 'black' : 'white'}
            backgroundColor={activeTab === 'processes' ? 'green' : undefined}
            bold={activeTab === 'processes'}
          >
            {' '}[2] Processes{' '}
          </Text>
          <Text
            color={activeTab === 'help' ? 'black' : 'white'}
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
