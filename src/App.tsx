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

    // Throttle rendering for terminal performance
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
    } else if (input === '3') {
      setActiveTab('io');
    } else if (input === '?') {
      setActiveTab((prev) => (prev === 'help' ? 'dashboard' : 'help'));
    } else if (input === 'q') {
      sampler.stop();
      exit();
    } else if (input === 'd' && activeTab === 'processes') {
      setShowProcessDetails((prev) => !prev);
    } else if (key.escape && showProcessDetails) {
      setShowProcessDetails(false);
    } else if (key.tab) {
      // Cycle tabs
      setActiveTab((prev) => {
        if (prev === 'dashboard') return 'processes';
        if (prev === 'processes') return 'io';
        if (prev === 'io') return 'dashboard';
        return 'dashboard';
      });
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

      {/* View 1: Main Overview Dashboard (Compact & fits in screen) */}
      {activeTab === 'dashboard' && (
        <Box flexDirection="column">
          {/* Top telemetry row: CPU (2-col grid) & Memory */}
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

          {/* Middle row: I/O Throughput & Sockets (3-col horizontal) */}
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
        </Box>
      )}

      {/* View 2: Expanded Full-Screen Scrollable Process Inspector */}
      {activeTab === 'processes' && (
        <Box flexDirection="column">
          <ProcessTable
            processes={snapshot.processes}
            pageSize={18}
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

      {/* View 3: Dedicated Full I/O & Network View */}
      {activeTab === 'io' && (
        <Box flexDirection="column">
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
      )}

      {/* View 4: Keybindings Help Modal */}
      {activeTab === 'help' && (
        <HelpModal onClose={() => setActiveTab('dashboard')} />
      )}
    </Box>
  );
};
