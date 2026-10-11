import React, { useState, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import { ProcessItem } from '../telemetry/types.js';
import { formatBytes, truncateText } from '../utils/formatters.js';

export type SortField = 'cpu' | 'mem' | 'pid' | 'name';

export interface ProcessTableProps {
  processes: ProcessItem[];
  pageSize?: number;
  onSelectProcess?: (process: ProcessItem | null) => void;
  onKillProcess?: (pid: number, signal: 'SIGTERM' | 'SIGKILL') => void;
  selectedProcess: ProcessItem | null;
  onToggleDetails?: () => void;
}

export const ProcessTable: React.FC<ProcessTableProps> = ({
  processes,
  pageSize = 18,
  onSelectProcess,
  onKillProcess,
  selectedProcess,
  onToggleDetails,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [sortField, setSortField] = useState<SortField>('cpu');
  const [sortAsc, setSortAsc] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Filter and sort processes
  const filteredProcesses = useMemo(() => {
    let list = processes;
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.pid.toString().includes(q) ||
          p.user.toLowerCase().includes(q)
      );
    }

    return [...list].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'cpu') cmp = b.cpu - a.cpu;
      else if (sortField === 'mem') cmp = b.mem - a.mem;
      else if (sortField === 'pid') cmp = b.pid - a.pid;
      else if (sortField === 'name') cmp = a.name.localeCompare(b.name);

      return sortAsc ? -cmp : cmp;
    });
  }, [processes, searchQuery, sortField, sortAsc]);

  const totalCount = filteredProcesses.length;
  const safeSelectedIndex = Math.min(Math.max(0, selectedIndex), Math.max(0, totalCount - 1));

  // Rolling-window continuous scroll calculation
  let effectiveScroll = scrollOffset;
  if (safeSelectedIndex >= effectiveScroll + pageSize) {
    effectiveScroll = safeSelectedIndex - pageSize + 1;
  } else if (safeSelectedIndex < effectiveScroll) {
    effectiveScroll = safeSelectedIndex;
  }
  const maxScroll = Math.max(0, totalCount - pageSize);
  const clampedScroll = Math.min(Math.max(0, effectiveScroll), maxScroll);

  const visibleProcesses = filteredProcesses.slice(clampedScroll, clampedScroll + pageSize);

  // Keyboard navigation & interaction
  useInput((input, key) => {
    if (isSearching) {
      if (key.return || key.escape) {
        setIsSearching(false);
      } else if (key.backspace || key.delete) {
        setSearchQuery((prev) => prev.slice(0, -1));
        setSelectedIndex(0);
        setScrollOffset(0);
      } else if (input && !key.ctrl && !key.meta) {
        setSearchQuery((prev) => prev + input);
        setSelectedIndex(0);
        setScrollOffset(0);
      }
      return;
    }

    // Smooth row-by-row and page scrolling
    if (key.downArrow || input === 'j') {
      const next = Math.min(safeSelectedIndex + 1, totalCount - 1);
      setSelectedIndex(next);
      if (next >= clampedScroll + pageSize) {
        setScrollOffset(next - pageSize + 1);
      }
      onSelectProcess?.(filteredProcesses[next] ?? null);
    } else if (key.upArrow || input === 'k') {
      const prev = Math.max(safeSelectedIndex - 1, 0);
      setSelectedIndex(prev);
      if (prev < clampedScroll) {
        setScrollOffset(prev);
      }
      onSelectProcess?.(filteredProcesses[prev] ?? null);
    } else if (key.pageDown || input === ']') {
      const next = Math.min(safeSelectedIndex + pageSize, totalCount - 1);
      setSelectedIndex(next);
      setScrollOffset(Math.min(clampedScroll + pageSize, maxScroll));
      onSelectProcess?.(filteredProcesses[next] ?? null);
    } else if (key.pageUp || input === '[') {
      const prev = Math.max(safeSelectedIndex - pageSize, 0);
      setSelectedIndex(prev);
      setScrollOffset(Math.max(0, clampedScroll - pageSize));
      onSelectProcess?.(filteredProcesses[prev] ?? null);
    } else if (input === 'g') {
      setSelectedIndex(0);
      setScrollOffset(0);
      onSelectProcess?.(filteredProcesses[0] ?? null);
    } else if (input === 'G') {
      const last = Math.max(0, totalCount - 1);
      setSelectedIndex(last);
      setScrollOffset(maxScroll);
      onSelectProcess?.(filteredProcesses[last] ?? null);
    } else if (input === '/') {
      setIsSearching(true);
    } else if (key.escape) {
      if (searchQuery) {
        setSearchQuery('');
        setSelectedIndex(0);
        setScrollOffset(0);
      }
    } else if (input === 'c') {
      setSortField('cpu');
      setSortAsc((prev) => (sortField === 'cpu' ? !prev : false));
    } else if (input === 'm') {
      setSortField('mem');
      setSortAsc((prev) => (sortField === 'mem' ? !prev : false));
    } else if (input === 'p') {
      setSortField('pid');
      setSortAsc((prev) => (sortField === 'pid' ? !prev : false));
    } else if (input === 'n') {
      setSortField('name');
      setSortAsc((prev) => (sortField === 'name' ? !prev : true));
    } else if (input === 'd' || key.return) {
      const curr = filteredProcesses[safeSelectedIndex];
      if (curr) {
        onSelectProcess?.(curr);
        onToggleDetails?.();
      }
    } else if (input === 'x' || (input === 'k' && !key.upArrow)) {
      const curr = filteredProcesses[safeSelectedIndex];
      if (curr) {
        const signal = input === 'x' ? 'SIGKILL' : 'SIGTERM';
        try {
          process.kill(curr.pid, signal);
          setStatusMessage(`Sent ${signal} to PID ${curr.pid} (${curr.name})`);
          onKillProcess?.(curr.pid, signal);
        } catch (err: any) {
          setStatusMessage(`Failed to kill PID ${curr.pid}: ${err.message}`);
        }
      }
    }
  });

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="cyan"
      paddingX={1}
      flexGrow={1}
    >
      {/* Header bar */}
      <Box justifyContent="space-between">
        <Box>
          <Text bold color="cyan">
            PROCESS INSPECTOR{' '}
          </Text>
          <Text color="gray">
            ({totalCount} processes | Sorted by: {sortField.toUpperCase()}{' '}
            {sortAsc ? '▲' : '▼'})
          </Text>
        </Box>
        <Box>
          {isSearching ? (
            <Text backgroundColor="yellow" color="black" bold>
              {' '}Search: {searchQuery}█{' '}
            </Text>
          ) : (
            <Text color="dim">
              {searchQuery ? `Filter: "${searchQuery}" [Esc to clear]` : `[/] Search`}
            </Text>
          )}
        </Box>
      </Box>

      {/* Action Status Feedback */}
      {statusMessage && (
        <Box marginY={0}>
          <Text color="yellow">⚠️ {statusMessage}</Text>
        </Box>
      )}

      {/* Table Headers */}
      <Box marginTop={1}>
        <Text bold color="yellow">
          {'  '}
          {'PID'.padEnd(8)}
          {'NAME'.padEnd(24)}
          {'CPU%'.padStart(7)}
          {'MEM%'.padStart(7)}
          {'RSS'.padStart(10)}
          {'STATE'.padStart(9)}
          {'  '}
          {'USER'}
        </Text>
      </Box>

      {/* Table Rows with high-contrast blue background selection */}
      {visibleProcesses.map((proc, idx) => {
        const absoluteIndex = clampedScroll + idx;
        const isSelected = absoluteIndex === safeSelectedIndex;

        return (
          <Box key={proc.pid}>
            <Text
              color={isSelected ? 'white' : 'white'}
              backgroundColor={isSelected ? 'blue' : undefined}
              bold={isSelected}
            >
              {isSelected ? '▶ ' : '  '}
              {proc.pid.toString().padEnd(8)}
              {truncateText(proc.name, 23).padEnd(24)}
              {proc.cpu.toFixed(1).padStart(6)}%
              {proc.mem.toFixed(1).padStart(6)}%
              {formatBytes(proc.memRss).padStart(10)}
              {(proc.state || 'active').slice(0, 7).padStart(9)}
              {'  '}
              {truncateText(proc.user || 'system', 14)}
            </Text>
          </Box>
        );
      })}

      {visibleProcesses.length === 0 && (
        <Box marginY={1}>
          <Text color="yellow">No matching processes found.</Text>
        </Box>
      )}

      {/* Footer controls guide */}
      <Box marginTop={1} justifyContent="space-between">
        <Text color="dim">
          [j/k or ↑/↓]: Smooth Scroll | [g/G]: Top/Bottom | [/]: Search | [c/m/p/n]: Sort | [d]: Memory Map
        </Text>
        <Text color="gray">
          Pos {safeSelectedIndex + 1} / {totalCount} (Viewing {clampedScroll + 1}–{Math.min(clampedScroll + pageSize, totalCount)})
        </Text>
      </Box>
    </Box>
  );
};
