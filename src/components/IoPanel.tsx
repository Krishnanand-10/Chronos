import React from 'react';
import { Box, Text } from 'ink';
import { DiskIoMetric, NetworkIoMetric, SocketMetric } from '../telemetry/types.js';
import { RingBuffer } from '../telemetry/RingBuffer.js';
import { Sparkline } from './Sparkline.js';
import { formatSpeed } from '../utils/formatters.js';

export interface IoPanelProps {
  diskIo: DiskIoMetric;
  networkIo: NetworkIoMetric;
  sockets: SocketMetric;
  diskReadBuffer: RingBuffer;
  diskWriteBuffer: RingBuffer;
  netRxBuffer: RingBuffer;
  netTxBuffer: RingBuffer;
}

export const IoPanel: React.FC<IoPanelProps> = ({
  diskIo,
  networkIo,
  sockets,
  diskReadBuffer,
  diskWriteBuffer,
  netRxBuffer,
  netTxBuffer,
}) => {
  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="blue"
      paddingX={1}
      flexGrow={1}
    >
      <Box justifyContent="space-between">
        <Text bold color="blue">
          I/O THROUGHPUT & SOCKET STATES
        </Text>
        <Text color="gray">Sockets: {sockets.total}</Text>
      </Box>

      {/* Network Row */}
      <Box marginTop={1} flexDirection="column">
        <Text bold color="cyan">
          NETWORK
        </Text>
        <Box justifyContent="space-between">
          <Text color="dim">RX (Down):</Text>
          <Text color="green">{formatSpeed(networkIo.rxBytesSec)}</Text>
          <Sparkline
            data={netRxBuffer.toArray()}
            width={16}
            gradient={false}
            color="green"
          />
        </Box>
        <Box justifyContent="space-between">
          <Text color="dim">TX (Up):  </Text>
          <Text color="yellow">{formatSpeed(networkIo.txBytesSec)}</Text>
          <Sparkline
            data={netTxBuffer.toArray()}
            width={16}
            gradient={false}
            color="yellow"
          />
        </Box>
      </Box>

      {/* Disk Row */}
      <Box marginTop={1} flexDirection="column">
        <Text bold color="yellow">
          DISK I/O
        </Text>
        <Box justifyContent="space-between">
          <Text color="dim">Read: </Text>
          <Text color="green">{formatSpeed(diskIo.readBytesSec)}</Text>
          <Sparkline
            data={diskReadBuffer.toArray()}
            width={16}
            gradient={false}
            color="green"
          />
        </Box>
        <Box justifyContent="space-between">
          <Text color="dim">Write:</Text>
          <Text color="red">{formatSpeed(diskIo.writeBytesSec)}</Text>
          <Sparkline
            data={diskWriteBuffer.toArray()}
            width={16}
            gradient={false}
            color="red"
          />
        </Box>
      </Box>

      {/* Sockets Breakdown */}
      <Box marginTop={1} flexDirection="column">
        <Text bold color="white">
          SOCKET STATES
        </Text>
        <Box justifyContent="space-between">
          <Text color="dim">ESTAB:</Text>
          <Text color="green">{sockets.established}</Text>
          <Text color="dim">LISTEN:</Text>
          <Text color="cyan">{sockets.listen}</Text>
        </Box>
        <Box justifyContent="space-between">
          <Text color="dim">TIME_WAIT:</Text>
          <Text color="yellow">{sockets.timeWait}</Text>
          <Text color="dim">CLOSE_WAIT:</Text>
          <Text color="red">{sockets.closeWait}</Text>
        </Box>
      </Box>
    </Box>
  );
};
