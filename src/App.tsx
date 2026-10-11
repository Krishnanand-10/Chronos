import React, { useState, useEffect } from 'react';
import { Box, useApp, useInput } from 'ink';
import { TelemetrySampler } from './telemetry/Sampler.js';
import { SystemSnapshot, ProcessItem } from './telemetry/types.js';
import { Header, ActiveTab } from './components/Header.js';
import { CpuPanel } from './components/CpuPanel.js';
import { MemoryPanel } from './components/MemoryPanel.js';
import { IoPanel } from './components/IoPanel.js';
import { ProcessTable } from './components/ProcessTable.js';
import { ProcessDetails } from './components/ProcessDetails.js';
import { HelpModal } from './components/HelpModal.js';

interface AppProps {
  sampler: TelemetrySampler;
}

export const App: React.FC<AppProps> = ({ sampler }) => {
  const { exit } = useApp();
  const [snapshot, setSnapshot] = useState<SystemSnapshot>(() => sampler.getSnapshot());
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedProcess, setSelectedProcess] = useState<ProcessItem | null>(null);
  const [showProcessDetails, setShowProcessDetails] = useState<boolean>(false);

  useEffect(() => {
    sampler.start();

    // Subscribe to snapshot updates throttled for terminal rendering smoothness
    let lastRenderTime = 0;
    const unsubscribe = sampler.subscribe((snap) => {
      const now = Date.now();
      if (now - lastRenderTime >= 100) {
        lastRenderTime = now;
        setSnapshot(snap);
      }
    });

    return () => {
      unsubscribe();
      sampler.stop();
    };
  }, [sampler]);

  // Global key bindings
  useInput((input, key) => {
    if (key.ctrl && input === 'c') {
      sampler.stop();
      exit();
      return;
    }

    if (input === '1') {
      setActiveTab('dashboard');
      setShowProcessDetails(false);
    } else if (input === '2') {
      setActiveTab('processes');
    } else if (input === '?') {
      setActiveTab((prev) => (prev === 'help' ? 'dashboard' : 'help'));
    } else if (input === 'q') {
      sampler.stop();
      exit();
    } else if (input === 'd' && activeTab === 'processes') {
      setShowProcessDetails((prev) => !prev);
    } else if (key.escape && showProcessDetails) {
      setShowProcessDetails(false);
    }
  });

  return (
    <Box flexDirection="column" padding={1} width="100%">
      {/* Top Header & Navigation */}
      <Header
        osName={snapshot.osName}
        hostname={snapshot.hostname}
        uptimeSeconds={snapshot.uptimeSeconds}
        activeTab={activeTab}
      />

      {/* View 1: Main Dashboard Overview */}
      {activeTab === 'dashboard' && (
        <Box flexDirection="column">
          {/* Top telemetry row: CPU & Memory */}
          <Box flexDirection="row">
            <CpuPanel
              cpuAverage={snapshot.cpuAverage}
              cores={snapshot.cores}
              avgBuffer={sampler.cpuAverageBuffer}
              coreBuffers={sampler.cpuCoreBuffers}
            />
            <Box marginLeft={1} flexGrow={1}>
              <MemoryPanel
                memory={snapshot.memory}
                memBuffer={sampler.memoryBuffer}
              />
            </Box>
          </Box>

          {/* Middle row: I/O Throughput & Sockets */}
          <Box marginTop={1}>
            <IoPanel
              diskIo={snapshot.diskIo}
              networkIo={snapshot.networkIo}
              sockets={snapshot.sockets}
              diskReadBuffer={sampler.diskReadBuffer}
              diskWriteBuffer={sampler.diskWriteBuffer}
              netRxBuffer={sampler.netRxBuffer}
              netTxBuffer={sampler.netTxBuffer}
            />
          </Box>

          {/* Bottom row: Compact Process List */}
          <Box marginTop={1}>
            <ProcessTable
              processes={snapshot.processes}
              pageSize={6}
              selectedProcess={selectedProcess}
              onSelectProcess={setSelectedProcess}
              onToggleDetails={() => setShowProcessDetails((prev) => !prev)}
            />
          </Box>
        </Box>
      )}

      {/* View 2: Expanded Process Inspector */}
      {activeTab === 'processes' && (
        <Box flexDirection="column">
          <ProcessTable
            processes={snapshot.processes}
            pageSize={16}
            selectedProcess={selectedProcess}
            onSelectProcess={setSelectedProcess}
            onToggleDetails={() => setShowProcessDetails((prev) => !prev)}
          />

          {showProcessDetails && (
            <ProcessDetails
              process={selectedProcess}
              onClose={() => setShowProcessDetails(false)}
              onKill={(pid, signal) => {
                try {
                  process.kill(pid, signal);
                } catch {}
              }}
            />
          )}
        </Box>
      )}

      {/* View 3: Keybindings Help Modal */}
      {activeTab === 'help' && (
        <HelpModal onClose={() => setActiveTab('dashboard')} />
      )}
    </Box>
  );
};
