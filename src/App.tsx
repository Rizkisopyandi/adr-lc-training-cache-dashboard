import {TrainingCalendar} from './components/TrainingCalendar';
import {TrainingDashboard} from './components/TrainingDashboard';
import {demoTraining} from './services/demoTraining';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { DatabaseCard } from './components/DatabaseCard';
import { BackendDiagnosticModal } from './components/BackendDiagnosticModal';
import { PreviewDataModal } from './components/PreviewDataModal';
import { SetWebAppModal } from './components/SetWebAppModal';
import { AppsScriptCodeModal } from './components/AppsScriptCodeModal';
import { CachePanel } from './components/CachePanel';
import { AppNavigation, useAppPage } from './components/AppNavigation';
import type { CacheViewState } from './components/CachePanel';
import type { CacheSource } from './types/cache';

import { EXECUTIVE_DATABASES } from './config/databases';
import { DatabaseSourceKey, DatabaseSourceConfig, DatabaseStatusState, ProxyResponse, StatusResponseContract } from './types/database';
import { getStoredWebAppUrl, setStoredWebAppUrl, testGasConnection } from './services/gasBridge';
import { Database, ShieldCheck, CheckCircle2, AlertTriangle, RefreshCw, KeyRound, Sparkles, Code2, Link2 } from 'lucide-react';

export default function App() {
  const [webAppUrl, setWebAppUrl] = useState<string>(() => getStoredWebAppUrl());
  const page = useAppPage();
  const demo=new URLSearchParams(location.search).get('demo')==='1';
  const demoView=React.useMemo(()=>demo?demoTraining():null,[demo]);
  const [cacheView, setCacheView] = useState<CacheViewState>({ status:null,report:null,error:'' });

  // Initial Status States for all 5 Executive Databases
  const [statusMap, setStatusMap] = useState<Record<DatabaseSourceKey, DatabaseStatusState>>({
    ptu: { key: 'ptu', status: 'Disconnected', sheetName: 'DataBase', columnCount: 0, idColumnFound: false, lastTestedAt: null },
    pto: { key: 'pto', status: 'Disconnected', sheetName: 'DataBase', columnCount: 0, idColumnFound: false, lastTestedAt: null },
    otomasi: { key: 'otomasi', status: 'Disconnected', sheetName: 'DataBase', columnCount: 0, idColumnFound: false, lastTestedAt: null },
    staff: { key: 'staff', status: 'Disconnected', sheetName: 'DataBase', columnCount: 0, idColumnFound: false, lastTestedAt: null },
    eksternal: { key: 'eksternal', status: 'Disconnected', sheetName: 'DataBase', columnCount: 0, idColumnFound: false, lastTestedAt: null },
  });

  const [isTestingAll, setIsTestingAll] = useState(false);
  const lastAcceptedSnapshot = useRef('');
  const acceptSnapshot = useCallback((sources: CacheSource[], generatedAt: string) => {
    if (lastAcceptedSnapshot.current === generatedAt) return;
    lastAcceptedSnapshot.current = generatedAt;
    setStatusMap(previous => {
      const next = { ...previous };
      for (const source of sources) {
        const key = source.key as DatabaseSourceKey;
        if (!next[key]) continue;
        next[key] = { ...next[key], status: 'Connected', sheetName: source.sheetName, columnCount: source.columnCount, idColumnFound: source.idColumnFound === true, lastTestedAt: generatedAt, cachedAt: generatedAt };
      }
      return next;
    });
  }, []);
  const [testingKeys, setTestingKeys] = useState<Record<string, boolean>>({});

  // Active Modals State
  const [selectedDiagnosticKey, setSelectedDiagnosticKey] = useState<DatabaseSourceKey | null>(null);
  const [selectedPreviewKey, setSelectedPreviewKey] = useState<DatabaseSourceKey | null>(null);
  const [isSetWebAppModalOpen, setIsSetWebAppModalOpen] = useState(false);
  const [isAppsScriptGuideOpen, setIsAppsScriptGuideOpen] = useState(false);

  // Read saved URL from localStorage on mount
  useEffect(() => {
    const saved = getStoredWebAppUrl();
    if (saved) {
      setWebAppUrl(saved);
    }
  }, []);

  // Single Database API Connection Test
  const runTestDatabaseApi = useCallback(async (key: DatabaseSourceKey, targetUrl?: string) => {
    setTestingKeys(prev => ({ ...prev, [key]: true }));
    setStatusMap(prev => ({
      ...prev,
      [key]: { ...prev[key], status: 'Testing' },
    }));

    const activeUrl = targetUrl || webAppUrl || getStoredWebAppUrl();
    const res: ProxyResponse<StatusResponseContract> = await testGasConnection(key, activeUrl);

    const isSuccess = res.validationResult.isContractValid;
    const rawJson = res.rawJson;

    setStatusMap(prev => ({
      ...prev,
      [key]: {
        key,
        status: isSuccess ? 'Connected' : 'Error',
        sheetName: rawJson?.sheetName || EXECUTIVE_DATABASES.find(d => d.key === key)?.defaultSheetName || 'DataBase',
        columnCount: typeof rawJson?.columnCount === 'number' ? rawJson.columnCount : 0,
        idColumnFound: Boolean(rawJson?.idColumnFound),
        lastTestedAt: new Date().toISOString(),
        errorMessage: res.error || res.validationResult.summaryMessage,
        diagnosticData: res,
        cachedAt: undefined,
      },
    }));

    setTestingKeys(prev => ({ ...prev, [key]: false }));
    return res;
  }, [webAppUrl]);

  // Test All Connections Function
  const handleTestAllConnections = async () => {
    setIsTestingAll(true);
    for (const db of EXECUTIVE_DATABASES) {
      await runTestDatabaseApi(db.key);
    }
    setIsTestingAll(false);
  };

  // Open Diagnostic Modal
  const handleOpenDiagnostic = async (key: DatabaseSourceKey) => {
    setSelectedDiagnosticKey(key);
    // If not yet tested, auto-run test
    if (!statusMap[key].diagnosticData) {
      await runTestDatabaseApi(key);
    }
  };

  // Open Preview Modal
  const handleOpenPreview = (key: DatabaseSourceKey) => {
    setSelectedPreviewKey(key);
  };

  // Handle Save WebApp URL
  const handleSaveWebAppUrl = (newUrl: string) => {
    if (newUrl.trim() !== webAppUrl.trim()) {
      lastAcceptedSnapshot.current = '';
      setStatusMap(previous => Object.fromEntries(Object.entries(previous).map(([key,value]) => [key,{...value,status:'Disconnected',columnCount:0,idColumnFound:false,cachedAt:undefined,lastTestedAt:null,diagnosticData:undefined,errorMessage:undefined}])) as Record<DatabaseSourceKey,DatabaseStatusState>);
    }
    setWebAppUrl(newUrl);
    setStoredWebAppUrl(newUrl);
  };

  const activeDiagnosticConfig = EXECUTIVE_DATABASES.find(d => d.key === selectedDiagnosticKey) || EXECUTIVE_DATABASES[0];
  const activePreviewConfig = EXECUTIVE_DATABASES.find(d => d.key === selectedPreviewKey) || EXECUTIVE_DATABASES[0];

  const connectedCount = Object.values(statusMap).filter(s => s.status === 'Connected').length;
  const ptuState = statusMap.ptu;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-['Inter',sans-serif] flex flex-col text-slate-900">
      {/* Top Header */}
      <Header
        showDatabaseActions={page === 'database'}
        webAppUrl={webAppUrl}
        onOpenSetWebAppModal={() => setIsSetWebAppModalOpen(true)}
        onTestAllConnections={handleTestAllConnections}
        isTestingAll={isTestingAll}
        onOpenAppsScriptGuide={() => setIsAppsScriptGuideOpen(true)}
      />

      <div className="flex flex-1 flex-col lg:flex-row">
      <AppNavigation page={page} />
      {/* Main Container */}
      <main className="flex-1 min-w-0 w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6 print:p-0">
        <div hidden={page!=='calendar'&&page!=='training'}>
          {!demo&&(cacheView.error||cacheView.status?.stale)&&<div role="alert" className="training-alert">{cacheView.error||'Pembaruan diperlukan. Jadwal memakai snapshot lengkap terakhir.'}</div>}
          <TrainingCalendar data={(demoView||cacheView).report?.calendar} snapshotId={(demoView||cacheView).report?.snapshotId||''} demo={demo} mode={page==='training'?'training':'calendar'}/>
        </div>
        {page==='dashboard'&&<TrainingDashboard view={demoView||cacheView} demo={demo}/>}
        {page==='meetdir'&&<TrainingDashboard view={demoView||cacheView} meetdir demo={demo}/>}
        <div hidden={page !== 'database'} className="space-y-6 print:hidden">
        <div><p className="text-xs uppercase tracking-widest font-semibold text-emerald-700">Controller</p><h1 className="text-2xl font-bold text-slate-900 mt-1">Database</h1><p className="text-sm text-slate-500 mt-1">Pantau koneksi, proses cache, dan sumber yang perlu diperiksa.</p></div>
        <CachePanel webAppUrl={demo?'':webAppUrl} onSnapshot={acceptSnapshot} onData={setCacheView} hideReport />

        {/* Summary Dashboard Banner */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-2xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Monitoring &amp; Cache Data
                </span>
                <span className="text-xs font-medium text-slate-500">
                  PTU · PTO · Otomasi · Staff · Eksternal
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Integrasi 5 Database Utama Executive Training
              </h2>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-3 text-xs">
              <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">
                <span>Sumber tersedia: </span>
                <strong className={`font-bold font-mono ${connectedCount > 0 ? 'text-emerald-700' : 'text-slate-500'}`}>
                  {connectedCount} / 5 Database
                </strong>
              </div>

              <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">
                <span>Database PTU: </span>
                <strong className={`font-bold ${ptuState.status === 'Connected' ? 'text-emerald-700' : 'text-slate-500'}`}>
                  {ptuState.status === 'Connected' ? `${ptuState.cachedAt ? 'Cache siap' : 'Connected'} (${ptuState.columnCount} Kolom)` : ptuState.status}
                </strong>
              </div>
            </div>
          </div>

          {/* WebApp URL Warning or Success Notice */}
          <div className="mt-4 pt-1 flex items-center justify-between gap-3 text-xs">
            {webAppUrl ? (
              <div className="flex items-center gap-2 text-slate-600">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Google Apps Script Web App URL aktif dan siap diuji.</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-900 bg-amber-50 p-2.5 rounded-md border border-amber-200/80 w-full">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span>
                    URL Apps Script belum dikonfigurasi. Klik tombol <strong>Set WebApp URL</strong> untuk memasukkan URL Web App Anda.
                  </span>
                  <button
                    onClick={() => setIsSetWebAppModalOpen(true)}
                    className="px-2.5 py-1 text-xs font-semibold text-white bg-amber-700 rounded hover:bg-amber-800 shrink-0"
                  >
                    Set WebApp URL Sekarang
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 5 Executive Database Cards Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              Daftar 5 Database Executive Training (Allowlist Active)
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Sumber sesuai konfigurasi masing-masing
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {EXECUTIVE_DATABASES.map(db => (
              <DatabaseCard
                key={db.key}
                config={db}
                statusState={statusMap[db.key]}
                onTestApi={() => handleOpenDiagnostic(db.key)}
                onPreviewData={() => handleOpenPreview(db.key)}
                isTesting={Boolean(testingKeys[db.key])}
              />
            ))}
          </div>
        </div>

        {/* Deployment Helper Banner */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2.5">
            <Code2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold text-slate-900 block">Butuh Memperbarui Kode Google Apps Script?</span>
              <span className="text-slate-500">
                Laporan memakai CacheEngine.gs dan MeetdirReport.gs terbaru. URL Executive sudah terpasang; konfigurasi hanya diperlukan jika deployment diganti.
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsAppsScriptGuideOpen(true)}
            className="px-3.5 py-2 font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors shrink-0"
          >
            Lihat Backend Code.gs &amp; Deployment Guide
          </button>
        </div>

        </div>
      </main>
      </div>

      {/* Footer */}
      <footer className="mt-auto py-4 border-t border-slate-200 bg-white text-center text-xs text-slate-500 space-y-1">
        <p className="font-semibold text-slate-700">
          ADR Learning Center &bull; Executive Training Dashboard System
        </p>
        <p className="text-[11px] text-slate-400 font-mono">
          Laporan dari cache tersimpan &bull; Database sumber hanya dibaca
        </p>
      </footer>

      {/* Backend Diagnostic Modal */}
      {selectedDiagnosticKey && (
        <BackendDiagnosticModal
          isOpen={Boolean(selectedDiagnosticKey)}
          onClose={() => setSelectedDiagnosticKey(null)}
          config={activeDiagnosticConfig}
          diagnosticData={statusMap[selectedDiagnosticKey]?.diagnosticData || null}
          onReTest={() => runTestDatabaseApi(selectedDiagnosticKey)}
          isTesting={Boolean(testingKeys[selectedDiagnosticKey])}
        />
      )}

      {/* Preview Data Modal */}
      {selectedPreviewKey && (
        <PreviewDataModal
          isOpen={Boolean(selectedPreviewKey)}
          onClose={() => setSelectedPreviewKey(null)}
          config={activePreviewConfig}
        />
      )}

      {/* Set WebApp Modal */}
      <SetWebAppModal
        isOpen={isSetWebAppModalOpen}
        onClose={() => setIsSetWebAppModalOpen(false)}
        currentUrl={webAppUrl}
        onSaveUrl={handleSaveWebAppUrl}
        onOpenAppsScriptGuide={() => {
          setIsSetWebAppModalOpen(false);
          setIsAppsScriptGuideOpen(true);
        }}
      />

      {/* Apps Script Guide Modal */}
      <AppsScriptCodeModal
        isOpen={isAppsScriptGuideOpen}
        onClose={() => setIsAppsScriptGuideOpen(false)}
        spreadsheetId={EXECUTIVE_DATABASES[0].spreadsheetId}
      />
    </div>
  );
}
