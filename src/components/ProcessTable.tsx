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
  pageSize = 12,
  onSelectProcess,
  onKillProcess,
  selectedProcess,
  onToggleDetails,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [sortField, setSortField] = useState<SortField>('cpu');
  const [sortAsc, setSortAsc] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Filter processes based on search query
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

  // Pagination calculation
  const totalCount = filteredProcesses.length;
  const safeSelectedIndex = Math.min(Math.max(0, selectedIndex), Math.max(0, totalCount - 1));
  const pageStart = Math.floor(safeSelectedIndex / pageSize) * pageSize;
  const visibleProcesses = filteredProcesses.slice(pageStart, pageStart + pageSize);

  // Keyboard navigation & interaction
  useInput((input, key) => {
    if (isSearching) {
      if (key.return || key.escape) {
        setIsSearching(false);
      } else if (key.backspace || key.delete) {
        setSearchQuery((prev) => prev.slice(0, -1));
        setSelectedIndex(0);
      } else if (input && !key.ctrl && !key.meta) {
        setSearchQuery((prev) => prev + input);
        setSelectedIndex(0);
      }
      return;
    }

    // Normal Table Mode
    if (key.downArrow || input === 'j') {
      const next = Math.min(safeSelectedIndex + 1, totalCount - 1);
      setSelectedIndex(next);
      onSelectProcess?.(filteredProcesses[next] ?? null);
    } else if (key.upArrow || input === 'k') {
      const prev = Math.max(safeSelectedIndex - 1, 0);
      setSelectedIndex(prev);
      onSelectProcess?.(filteredProcesses[prev] ?? null);
    } else if (key.pageDown) {
      const next = Math.min(safeSelectedIndex + pageSize, totalCount - 1);
      setSelectedIndex(next);
      onSelectProcess?.(filteredProcesses[next] ?? null);
    } else if (key.pageUp) {
      const prev = Math.max(safeSelectedIndex - pageSize, 0);
      setSelectedIndex(prev);
      onSelectProcess?.(filteredProcesses[prev] ?? null);
    } else if (input === '/') {
      setIsSearching(true);
    } else if (key.escape) {
      if (searchQuery) {
        setSearchQuery('');
        setSelectedIndex(0);
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
    } else if (input === 'k' || input === 'x') {
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
      borderColor="green"
      paddingX={1}
      flexGrow={1}
    >
      {/* Header bar */}
      <Box justifyContent="space-between">
        <Box>
          <Text bold color="green">
            PROCESS INSPECTOR{' '}
          </Text>
          <Text color="gray">
            ({totalCount} processes | Sorted by: {sortField.toUpperCase()}{' '}
            {sortAsc ? '▲' : '▼'})
          </Text>
        </Box>
        <Box>
          {isSearching ? (
            <Text backgroundColor="blue" color="white">
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
        <Text bold color="white">
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

      {/* Table Rows */}
      {visibleProcesses.map((proc, idx) => {
        const absoluteIndex = pageStart + idx;
        const isSelected = absoluteIndex === safeSelectedIndex;

        return (
          <Box key={proc.pid}>
            <Text
              color={isSelected ? 'black' : 'white'}
              backgroundColor={isSelected ? 'green' : undefined}
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
          [j/k]: Nav | [/]: Filter | [c/m/p/n]: Sort | [d]: Memory Map | [k/x]: Kill
        </Text>
        <Text color="gray">
          Page {Math.floor(safeSelectedIndex / pageSize) + 1} /{' '}
          {Math.max(1, Math.ceil(totalCount / pageSize))}
        </Text>
      </Box>
    </Box>
  );
};
