import React, { useState, useMemo } from 'react';
import {
  MOCK_TRAINING_PROGRAMS,
  DEFAULT_TARGET_CONFIG,
  DEFAULT_VIEW_SETTINGS,
} from '../../data/mockTrainingData';
import {
  FilterState,
  TargetConfig,
  ViewSettings,
  SupervisorFinding,
} from '../../types/training';
import {
  getFilteredDataset,
  calculateCEOMetrics,
  calculateL1Metrics,
  calculateL2Metrics,
  generateSupervisorFindings,
} from '../../utils/trainingCalculations';
import { DashboardHeader } from './DashboardHeader';
import { SectionCEO } from './SectionCEO';
import { SectionL1 } from './SectionL1';
import { SectionL2 } from './SectionL2';
import { SectionSupervisor } from './SectionSupervisor';
import { ChartDrilldownModal } from '../modals/ChartDrilldownModal';
import { FindingDetailModal } from '../modals/FindingDetailModal';
import { ViewCustomizerModal } from '../modals/ViewCustomizerModal';
import { TargetSettingsModal } from '../modals/TargetSettingsModal';

export const DashboardView: React.FC = () => {
  // Filters State
  const [filters, setFilters] = useState<FilterState>({
    period: 'all',
    source: 'Semua',
    department: 'Semua',
    searchQuery: '',
  });

  // Target Settings State (Adjustable in Demo)
  const [targetConfig, setTargetConfig] = useState<TargetConfig>(DEFAULT_TARGET_CONFIG);

  // View Settings State (Customize displayed charts and sections)
  const [viewSettings, setViewSettings] = useState<ViewSettings>(DEFAULT_VIEW_SETTINGS);

  // Supervisor Reviewed Findings State (Local memory state)
  const [reviewedFindingIds, setReviewedFindingIds] = useState<Set<string>>(new Set());

  // Modals State
  const [isViewCustomizerOpen, setIsViewCustomizerOpen] = useState(false);
  const [isTargetSettingsOpen, setIsTargetSettingsOpen] = useState(false);
  const [selectedFinding, setSelectedFinding] = useState<SupervisorFinding | null>(null);

  // Drilldown Modal State
  const [drilldownData, setDrilldownData] = useState<{
    isOpen: boolean;
    title: string;
    category: string;
    description: string;
    records: any[];
  }>({
    isOpen: false,
    title: '',
    category: '',
    description: '',
    records: [],
  });

  // 1. Filtered Dataset calculation (Single source of truth!)
  const filteredDataset = useMemo(() => {
    return getFilteredDataset(MOCK_TRAINING_PROGRAMS, filters);
  }, [filters]);

  // 2. Computed Metrics for each section
  const ceoMetrics = useMemo(() => {
    return calculateCEOMetrics(filteredDataset);
  }, [filteredDataset]);

  const l1Metrics = useMemo(() => {
    return calculateL1Metrics(filteredDataset, targetConfig);
  }, [filteredDataset, targetConfig]);

  const l2Metrics = useMemo(() => {
    return calculateL2Metrics(filteredDataset);
  }, [filteredDataset]);

  const supervisorFindings = useMemo(() => {
    // We pass the filtered programs to inspect current scope, or all programs
    return generateSupervisorFindings(filteredDataset.filteredPrograms, reviewedFindingIds);
  }, [filteredDataset.filteredPrograms, reviewedFindingIds]);

  // Handlers
  const handleToggleReview = (id: string) => {
    setReviewedFindingIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

    if (selectedFinding && selectedFinding.id === id) {
      setSelectedFinding((prev) =>
        prev
          ? {
              ...prev,
              reviewStatus: prev.reviewStatus === 'Ditinjau Demo' ? 'Perlu Ditinjau' : 'Ditinjau Demo',
            }
          : null
      );
    }
  };

  const handleOpenDrilldown = (
    title: string,
    category: string,
    description: string,
    records: any[]
  ) => {
    setDrilldownData({
      isOpen: true,
      title,
      category,
      description,
      records,
    });
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-100">
      {/* Top Interactive Filter Header */}
      <DashboardHeader
        filters={filters}
        onFilterChange={setFilters}
        onOpenViewCustomizer={() => setIsViewCustomizerOpen(true)}
        onOpenTargetSettings={() => setIsTargetSettingsOpen(true)}
        completedClassesCount={ceoMetrics.kelasTerlaksana}
        totalParticipantsCount={ceoMetrics.partisipasiHadir}
      />

      {/* Main Sections Viewport (Stacked vertically with collapsible controls) */}
      <section className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] w-full mx-auto">
        {/* Section 1: CEO / Manajemen */}
        <SectionCEO
          metrics={ceoMetrics}
          viewSettings={viewSettings}
          onDrilldown={handleOpenDrilldown}
        />

        {/* Section 2: Subdivisi — Evaluasi L1 */}
        <SectionL1
          metrics={l1Metrics}
          targetConfig={targetConfig}
          viewSettings={viewSettings}
          onOpenTargetModal={() => setIsTargetSettingsOpen(true)}
          onDrilldown={handleOpenDrilldown}
        />

        {/* Section 3: Departemen — Pelaksanaan & L2 */}
        <SectionL2
          metrics={l2Metrics}
          targetConfig={targetConfig}
          viewSettings={viewSettings}
          onOpenTargetModal={() => setIsTargetSettingsOpen(true)}
          onDrilldown={handleOpenDrilldown}
        />

        {/* Section 4: Supervisor / Eksekutor */}
        <SectionSupervisor
          findings={supervisorFindings}
          viewSettings={viewSettings}
          onSelectFinding={setSelectedFinding}
          onToggleReview={handleToggleReview}
        />
      </section>

      {/* Modals */}
      <ChartDrilldownModal
        isOpen={drilldownData.isOpen}
        onClose={() => setDrilldownData((prev) => ({ ...prev, isOpen: false }))}
        title={drilldownData.title}
        category={drilldownData.category}
        description={drilldownData.description}
        records={drilldownData.records}
      />

      <FindingDetailModal
        finding={selectedFinding}
        onClose={() => setSelectedFinding(null)}
        onToggleReview={handleToggleReview}
      />

      <ViewCustomizerModal
        isOpen={isViewCustomizerOpen}
        onClose={() => setIsViewCustomizerOpen(false)}
        settings={viewSettings}
        onSave={setViewSettings}
      />

      <TargetSettingsModal
        isOpen={isTargetSettingsOpen}
        onClose={() => setIsTargetSettingsOpen(false)}
        config={targetConfig}
        onSave={setTargetConfig}
      />
    </div>
  );
};
