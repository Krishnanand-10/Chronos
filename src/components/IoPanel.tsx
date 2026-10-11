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

      {/* 3 Horizontal Columns: Network | Disk | Sockets */}
      <Box marginTop={1} flexDirection="row" justifyContent="space-between">
        {/* Column 1: Network */}
        <Box flexDirection="column" flexGrow={1}>
          <Text bold color="cyan">
            NETWORK
          </Text>
          <Box justifyContent="space-between">
            <Text color="dim">RX (Down):</Text>
            <Text color="green">{formatSpeed(networkIo.rxBytesSec)}</Text>
            <Sparkline
              data={netRxBuffer.toArray()}
              width={10}
              gradient={false}
              color="green"
            />
          </Box>
          <Box justifyContent="space-between">
            <Text color="dim">TX (Up):  </Text>
            <Text color="yellow">{formatSpeed(networkIo.txBytesSec)}</Text>
            <Sparkline
              data={netTxBuffer.toArray()}
              width={10}
              gradient={false}
              color="yellow"
            />
          </Box>
        </Box>

        {/* Column 2: Disk */}
        <Box flexDirection="column" flexGrow={1} marginLeft={2}>
          <Text bold color="yellow">
            DISK I/O
          </Text>
          <Box justifyContent="space-between">
            <Text color="dim">Read: </Text>
            <Text color="green">{formatSpeed(diskIo.readBytesSec)}</Text>
            <Sparkline
              data={diskReadBuffer.toArray()}
              width={10}
              gradient={false}
              color="green"
            />
          </Box>
          <Box justifyContent="space-between">
            <Text color="dim">Write:</Text>
            <Text color="red">{formatSpeed(diskIo.writeBytesSec)}</Text>
            <Sparkline
              data={diskWriteBuffer.toArray()}
              width={10}
              gradient={false}
              color="red"
            />
          </Box>
        </Box>

        {/* Column 3: Sockets */}
        <Box flexDirection="column" flexGrow={1} marginLeft={2}>
          <Text bold color="white">
            SOCKET STATES
          </Text>
          <Box justifyContent="space-between">
            <Text color="dim">ESTAB: </Text>
            <Text color="green">{sockets.established}</Text>
            <Text color="dim">LISTEN: </Text>
            <Text color="cyan">{sockets.listen}</Text>
          </Box>
          <Box justifyContent="space-between">
            <Text color="dim">TIME_W:</Text>
            <Text color="yellow">{sockets.timeWait}</Text>
            <Text color="dim">CLOSE_W:</Text>
            <Text color="red">{sockets.closeWait}</Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
