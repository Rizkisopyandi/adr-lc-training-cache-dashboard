/**
 * ADR Learning Center — Training Intelligence
 * Pure Calculation Engine for Dashboard Metrics & Codex Integration
 */

import {
  TrainingProgram,
  TrainingSession,
  Participant,
  FilterState,
  TargetConfig,
  SupervisorFinding,
  DatabaseSource,
} from '../types/training';

export interface CEOMetrics {
  kelasTerlaksana: number;
  partisipasiHadir: number;
  biayaAktual: number;
  anggaranSamaKelas: number;
  selisihBiaya: number; // Anggaran - Aktual (varian serapan)
  biayaPerPartisipasi: number;
  programBreakdown: Array<{
    programId: string;
    programTitle: string;
    source: DatabaseSource;
    department: string;
    kelasTerlaksana: number;
    partisipasiHadir: number;
    anggaran: number;
    biayaAktual: number;
    selisih: number;
  }>;
  costBySource: Array<{
    source: DatabaseSource;
    cost: number;
    percentage: number;
    sessionCount: number;
  }>;
  monthlyTrend: Array<{
    periodLabel: string;
    biayaAktual: number;
    partisipasiHadir: number;
  }>;
}

export interface L1Metrics {
  totalHadir: number;
  responsValid: number;
  belumAdaRespons: number;
  cakupanPersen: number;
  weightedScore: number;
  targetScore: number;
  gapScore: number;
  aspectScores: {
    materi: number;
    trainer: number;
    fasilitas: number;
    penyelenggaraan: number;
  };
  programScores: Array<{
    programTitle: string;
    source: DatabaseSource;
    score: number;
    responseCount: number;
    targetScore: number;
  }>;
  periodTrend: Array<{
    periodLabel: string;
    score: number;
    responseCount: number;
  }>;
}

export interface L2Metrics {
  rencanaKelas: number;
  kelasTerlaksana: number;
  totalUndanganSelesai: number;
  hadirCount: number;
  izinCount: number;
  tidakHadirCount: number;
  belumDiisiCount: number;
  tingkatKehadiranPersen: number;
  pairedCount: number;
  kelengkapanPasanganPersen: number;
  avgPretest: number;
  avgPosttest: number;
  deltaScore: number;
  programTable: Array<{
    programId: string;
    code: string;
    programTitle: string;
    department: string;
    source: DatabaseSource;
    rencana: number;
    terlaksana: number;
    undangan: number;
    hadir: number;
    pasanganValid: number;
    avgPretest: number | null;
    avgPosttest: number | null;
    deltaPoin: number | null;
  }>;
  pairedDistribution: Array<{
    programTitle: string;
    pretest: number;
    posttest: number;
    delta: number;
    validCount: number;
  }>;
  periodAttendanceTrend: Array<{
    periodLabel: string;
    kehadiranPersen: number;
    hadirCount: number;
    totalCount: number;
  }>;
}

export interface FilteredDataset {
  filteredPrograms: TrainingProgram[];
  filteredSessions: TrainingSession[];
  filteredParticipants: Participant[];
}

/**
 * Filter programs and their sessions based on selected Period, Source, and Department.
 */
export function getFilteredDataset(
  programs: TrainingProgram[],
  filters: FilterState
): FilteredDataset {
  const filteredPrograms: TrainingProgram[] = [];
  const filteredSessions: TrainingSession[] = [];
  const filteredParticipants: Participant[] = [];

  programs.forEach((prog) => {
    // Filter Source
    if (filters.source !== 'Semua' && prog.source !== filters.source) {
      return;
    }

    // Filter Department
    if (filters.department !== 'Semua' && prog.department !== filters.department) {
      return;
    }

    // Search query match
    if (filters.searchQuery.trim() !== '') {
      const q = filters.searchQuery.toLowerCase();
      const match =
        prog.title.toLowerCase().includes(q) ||
        prog.code.toLowerCase().includes(q) ||
        prog.department.toLowerCase().includes(q);
      if (!match) return;
    }

    // Filter Sessions by Period
    const matchingSessions = prog.sessions.filter((sess) => {
      if (filters.period === 'all') return true;
      if (filters.period === '2026-Q4') {
        return (
          sess.period === '2026-10' ||
          sess.period === '2026-11' ||
          sess.period === '2026-12' ||
          sess.period === '2026-Q4'
        );
      }
      if (filters.period === '2026-Q3') {
        return sess.period.includes('2026-07') || sess.period.includes('2026-08') || sess.period.includes('2026-09') || sess.period === '2026-Q3';
      }
      return sess.period === filters.period;
    });

    if (matchingSessions.length > 0 || filters.period === 'all') {
      const progClone = { ...prog, sessions: matchingSessions };
      filteredPrograms.push(progClone);

      matchingSessions.forEach((sess) => {
        filteredSessions.push(sess);
        sess.participants.forEach((p) => {
          filteredParticipants.push(p);
        });
      });
    }
  });

  return {
    filteredPrograms,
    filteredSessions,
    filteredParticipants,
  };
}

/**
 * Section 1: Calculate CEO & Management Metrics
 */
export function calculateCEOMetrics(dataset: FilteredDataset): CEOMetrics {
  const { filteredPrograms, filteredSessions } = dataset;

  // Only sessions that are 'Terlaksana' (completed)
  const completedSessions = filteredSessions.filter((s) => s.status === 'Terlaksana');
  const kelasTerlaksana = completedSessions.length;

  let partisipasiHadir = 0;
  completedSessions.forEach((s) => {
    s.participants.forEach((p) => {
      if (p.attendance === 'Hadir') {
        partisipasiHadir += 1;
      }
    });
  });

  const biayaAktual = completedSessions.reduce((sum, s) => sum + s.actualCost, 0);
  // Important rule: Anggaran and Aktual must compare the exact same group of completed classes!
  const anggaranSamaKelas = completedSessions.reduce((sum, s) => sum + s.budgetPlan, 0);
  const selisihBiaya = anggaranSamaKelas - biayaAktual;
  const biayaPerPartisipasi = partisipasiHadir > 0 ? Math.round(biayaAktual / partisipasiHadir) : 0;

  // Program Breakdown Table
  const programBreakdown = filteredPrograms
    .map((prog) => {
      const progCompletedSessions = prog.sessions.filter((s) => s.status === 'Terlaksana');
      const sessionsCount = progCompletedSessions.length;
      if (sessionsCount === 0) return null;

      let progHadir = 0;
      let progBudget = 0;
      let progActual = 0;

      progCompletedSessions.forEach((s) => {
        progBudget += s.budgetPlan;
        progActual += s.actualCost;
        s.participants.forEach((p) => {
          if (p.attendance === 'Hadir') progHadir += 1;
        });
      });

      return {
        programId: prog.id,
        programTitle: prog.title,
        source: prog.source,
        department: prog.department,
        kelasTerlaksana: sessionsCount,
        partisipasiHadir: progHadir,
        anggaran: progBudget,
        biayaAktual: progActual,
        selisih: progBudget - progActual,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  // Cost by Source Composition
  const sources: DatabaseSource[] = ['PTU', 'PTO', 'Otomasi', 'Staff', 'Eksternal'];
  const costBySource = sources
    .map((src) => {
      const srcSessions = completedSessions.filter((s) => {
        const prog = filteredPrograms.find((p) => p.sessions.some((sess) => sess.id === s.id));
        return prog?.source === src;
      });
      const cost = srcSessions.reduce((sum, s) => sum + s.actualCost, 0);
      const sessionCount = srcSessions.length;
      return {
        source: src,
        cost,
        percentage: biayaAktual > 0 ? Math.round((cost / biayaAktual) * 100) : 0,
        sessionCount,
      };
    })
    .filter((item) => item.cost > 0 || filteredPrograms.some((p) => p.source === item.source));

  // Monthly Trend (Oktober vs November)
  const periods = [
    { key: '2026-10', label: 'Okt 2026' },
    { key: '2026-11', label: 'Nov 2026' },
  ];
  const monthlyTrend = periods.map((per) => {
    const periodSessions = filteredSessions.filter(
      (s) => s.status === 'Terlaksana' && s.period === per.key
    );
    const cost = periodSessions.reduce((sum, s) => sum + s.actualCost, 0);
    let hadir = 0;
    periodSessions.forEach((s) => {
      s.participants.forEach((p) => {
        if (p.attendance === 'Hadir') hadir += 1;
      });
    });
    return {
      periodLabel: per.label,
      biayaAktual: cost,
      partisipasiHadir: hadir,
    };
  });

  return {
    kelasTerlaksana,
    partisipasiHadir,
    biayaAktual,
    anggaranSamaKelas,
    selisihBiaya,
    biayaPerPartisipasi,
    programBreakdown,
    costBySource,
    monthlyTrend,
  };
}

/**
 * Section 2: Calculate Subdivisi L1 Evaluation Metrics
 */
export function calculateL1Metrics(dataset: FilteredDataset, targetConfig: TargetConfig): L1Metrics {
  const { filteredPrograms, filteredSessions } = dataset;

  // Denominator: Participants who attended completed sessions
  const completedSessions = filteredSessions.filter((s) => s.status === 'Terlaksana');
  const attendedParticipants: Participant[] = [];

  completedSessions.forEach((s) => {
    s.participants.forEach((p) => {
      if (p.attendance === 'Hadir') {
        attendedParticipants.push(p);
      }
    });
  });

  const totalHadir = attendedParticipants.length;
  const validResponses = attendedParticipants.filter((p) => p.l1Completed && p.l1Scores);
  const responsValid = validResponses.length;
  const belumAdaRespons = Math.max(0, totalHadir - responsValid);
  const cakupanPersen = totalHadir > 0 ? Math.round((responsValid / totalHadir) * 100) : 0;

  // Weighted Average Calculation
  let sumScore = 0;
  let sumMateri = 0;
  let sumTrainer = 0;
  let sumFasilitas = 0;
  let sumPenyelenggaraan = 0;

  validResponses.forEach((p) => {
    if (p.l1Scores) {
      const overall =
        (p.l1Scores.materi +
          p.l1Scores.trainer +
          p.l1Scores.fasilitas +
          p.l1Scores.penyelenggaraan) /
        4;
      sumScore += overall;
      sumMateri += p.l1Scores.materi;
      sumTrainer += p.l1Scores.trainer;
      sumFasilitas += p.l1Scores.fasilitas;
      sumPenyelenggaraan += p.l1Scores.penyelenggaraan;
    }
  });

  const weightedScore = responsValid > 0 ? Number((sumScore / responsValid).toFixed(2)) : 0;
  const aspectScores = {
    materi: responsValid > 0 ? Number((sumMateri / responsValid).toFixed(2)) : 0,
    trainer: responsValid > 0 ? Number((sumTrainer / responsValid).toFixed(2)) : 0,
    fasilitas: responsValid > 0 ? Number((sumFasilitas / responsValid).toFixed(2)) : 0,
    penyelenggaraan: responsValid > 0 ? Number((sumPenyelenggaraan / responsValid).toFixed(2)) : 0,
  };

  const gapScore = Number((weightedScore - targetConfig.l1Target).toFixed(2));

  // Program L1 Scores
  const programScores = filteredPrograms
    .map((prog) => {
      const progSessions = prog.sessions.filter((s) => s.status === 'Terlaksana');
      const progValidParticipants: Participant[] = [];
      progSessions.forEach((s) => {
        s.participants.forEach((p) => {
          if (p.attendance === 'Hadir' && p.l1Completed && p.l1Scores) {
            progValidParticipants.push(p);
          }
        });
      });

      if (progValidParticipants.length === 0) return null;

      const pSum = progValidParticipants.reduce((sum, p) => {
        const avg =
          (p.l1Scores!.materi +
            p.l1Scores!.trainer +
            p.l1Scores!.fasilitas +
            p.l1Scores!.penyelenggaraan) /
          4;
        return sum + avg;
      }, 0);

      const progAvg = Number((pSum / progValidParticipants.length).toFixed(2));

      return {
        programTitle: prog.title,
        source: prog.source,
        score: progAvg,
        responseCount: progValidParticipants.length,
        targetScore: targetConfig.l1Target,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  // Period Trend
  const periods = [
    { key: '2026-10', label: 'Okt 2026' },
    { key: '2026-11', label: 'Nov 2026' },
  ];

  const periodTrend = periods.map((per) => {
    const periodSessions = filteredSessions.filter(
      (s) => s.status === 'Terlaksana' && s.period === per.key
    );
    const periodValid: Participant[] = [];
    periodSessions.forEach((s) => {
      s.participants.forEach((p) => {
        if (p.attendance === 'Hadir' && p.l1Completed && p.l1Scores) {
          periodValid.push(p);
        }
      });
    });

    const pSum = periodValid.reduce((sum, p) => {
      const avg =
        (p.l1Scores!.materi +
          p.l1Scores!.trainer +
          p.l1Scores!.fasilitas +
          p.l1Scores!.penyelenggaraan) /
        4;
      return sum + avg;
    }, 0);

    const score = periodValid.length > 0 ? Number((pSum / periodValid.length).toFixed(2)) : 0;
    return {
      periodLabel: per.label,
      score,
      responseCount: periodValid.length,
    };
  });

  return {
    totalHadir,
    responsValid,
    belumAdaRespons,
    cakupanPersen,
    weightedScore,
    targetScore: targetConfig.l1Target,
    gapScore,
    aspectScores,
    programScores,
    periodTrend,
  };
}

/**
 * Section 3: Calculate Department Execution & L2 Learning Metrics
 */
export function calculateL2Metrics(dataset: FilteredDataset): L2Metrics {
  const { filteredPrograms, filteredSessions } = dataset;

  // Planned classes
  const rencanaKelas = filteredPrograms.reduce((sum, p) => sum + p.plannedClasses, 0);

  // Sessions by completion
  const completedSessions = filteredSessions.filter((s) => s.status === 'Terlaksana');
  const kelasTerlaksana = completedSessions.length;

  // Attendance in completed sessions (crucial: Upcoming sessions NOT in denominator!)
  let totalUndanganSelesai = 0;
  let hadirCount = 0;
  let izinCount = 0;
  let tidakHadirCount = 0;
  let belumDiisiCount = 0;

  // Paired pretest & posttest collection
  const pairedParticipants: Participant[] = [];

  completedSessions.forEach((s) => {
    s.participants.forEach((p) => {
      totalUndanganSelesai += 1;
      if (p.attendance === 'Hadir') {
        hadirCount += 1;
        // Check if pretest & posttest pair is valid (both NOT null)
        if (p.pretestScore !== null && p.posttestScore !== null) {
          pairedParticipants.push(p);
        }
      } else if (p.attendance === 'Izin') {
        izinCount += 1;
      } else if (p.attendance === 'Tidak Hadir') {
        tidakHadirCount += 1;
      } else if (p.attendance === 'Belum Diisi') {
        belumDiisiCount += 1;
      }
    });
  });

  const tingkatKehadiranPersen =
    totalUndanganSelesai > 0 ? Math.round((hadirCount / totalUndanganSelesai) * 100) : 0;

  const pairedCount = pairedParticipants.length;
  const kelengkapanPasanganPersen =
    hadirCount > 0 ? Math.round((pairedCount / hadirCount) * 100) : 0;

  // Averages for paired tests
  let sumPre = 0;
  let sumPost = 0;
  pairedParticipants.forEach((p) => {
    sumPre += p.pretestScore!;
    sumPost += p.posttestScore!;
  });

  const avgPretest = pairedCount > 0 ? Number((sumPre / pairedCount).toFixed(1)) : 0;
  const avgPosttest = pairedCount > 0 ? Number((sumPost / pairedCount).toFixed(1)) : 0;
  const deltaScore = Number((avgPosttest - avgPretest).toFixed(1));

  // Program Table breakdown
  const programTable = filteredPrograms.map((prog) => {
    const progCompletedSessions = prog.sessions.filter((s) => s.status === 'Terlaksana');
    const terlaksana = progCompletedSessions.length;

    let undangan = 0;
    let hadir = 0;
    const progPairs: Participant[] = [];

    progCompletedSessions.forEach((s) => {
      s.participants.forEach((p) => {
        undangan += 1;
        if (p.attendance === 'Hadir') {
          hadir += 1;
          if (p.pretestScore !== null && p.posttestScore !== null) {
            progPairs.push(p);
          }
        }
      });
    });

    const progPairCount = progPairs.length;
    let pPre: number | null = null;
    let pPost: number | null = null;
    let pDelta: number | null = null;

    if (progPairCount > 0) {
      const sPre = progPairs.reduce((sum, p) => sum + p.pretestScore!, 0);
      const sPost = progPairs.reduce((sum, p) => sum + p.posttestScore!, 0);
      pPre = Number((sPre / progPairCount).toFixed(1));
      pPost = Number((sPost / progPairCount).toFixed(1));
      pDelta = Number((pPost - pPre).toFixed(1));
    }

    return {
      programId: prog.id,
      code: prog.code,
      programTitle: prog.title,
      department: prog.department,
      source: prog.source,
      rencana: prog.plannedClasses,
      terlaksana,
      undangan,
      hadir,
      pasanganValid: progPairCount,
      avgPretest: pPre,
      avgPosttest: pPost,
      deltaPoin: pDelta,
    };
  });

  // Paired distribution by program
  const pairedDistribution = programTable
    .filter((p) => p.avgPretest !== null && p.avgPosttest !== null)
    .map((p) => ({
      programTitle: p.programTitle,
      pretest: p.avgPretest!,
      posttest: p.avgPosttest!,
      delta: p.deltaPoin!,
      validCount: p.pasanganValid,
    }));

  // Attendance trend
  const periods = [
    { key: '2026-10', label: 'Okt 2026' },
    { key: '2026-11', label: 'Nov 2026' },
  ];

  const periodAttendanceTrend = periods.map((per) => {
    const periodSessions = filteredSessions.filter(
      (s) => s.status === 'Terlaksana' && s.period === per.key
    );
    let pTotal = 0;
    let pHadir = 0;
    periodSessions.forEach((s) => {
      s.participants.forEach((p) => {
        pTotal += 1;
        if (p.attendance === 'Hadir') pHadir += 1;
      });
    });
    return {
      periodLabel: per.label,
      kehadiranPersen: pTotal > 0 ? Math.round((pHadir / pTotal) * 100) : 0,
      hadirCount: pHadir,
      totalCount: pTotal,
    };
  });

  return {
    rencanaKelas,
    kelasTerlaksana,
    totalUndanganSelesai,
    hadirCount,
    izinCount,
    tidakHadirCount,
    belumDiisiCount,
    tingkatKehadiranPersen,
    pairedCount,
    kelengkapanPasanganPersen,
    avgPretest,
    avgPosttest,
    deltaScore,
    programTable,
    pairedDistribution,
    periodAttendanceTrend,
  };
}

/**
 * Section 4: Generate Actionable Supervisor Findings from the Dataset
 */
export function generateSupervisorFindings(
  programs: TrainingProgram[],
  reviewedIds: Set<string>
): SupervisorFinding[] {
  const findings: SupervisorFinding[] = [];

  programs.forEach((prog) => {
    prog.sessions.forEach((sess) => {
      // 1. Kehadiran belum diisi pada sesi lampau
      const isPastSession = sess.status === 'Terlaksana' || sess.date <= '2026-11-08';
      const unrecordedParticipants = sess.participants.filter(
        (p) => p.attendance === 'Belum Diisi'
      );

      if (isPastSession && unrecordedParticipants.length > 0) {
        const id = `finding-att-${sess.id}`;
        findings.push({
          id,
          category: 'Kehadiran Belum Diisi',
          severity: 'Tinggi',
          title: `Kehadiran ${unrecordedParticipants.length} peserta belum diinput`,
          programTitle: prog.title,
          sessionCode: sess.sessionCode,
          department: prog.department,
          source: prog.source,
          evidenceCount: unrecordedParticipants.length,
          evidenceDetails: unrecordedParticipants.map(
            (p) => `${p.employeeId} - ${p.name} (${p.department})`
          ),
          inspectorRecommendation:
            'Segera konfirmasi daftar presensi manual ke trainer/instruktur dan input status kehadiran.',
          reviewStatus: reviewedIds.has(id) ? 'Ditinjau Demo' : 'Perlu Ditinjau',
        });
      }

      // 2. Peserta hadir dengan evaluasi belum lengkap (L1 / L2)
      const incompleteEvaluation = sess.participants.filter(
        (p) =>
          p.attendance === 'Hadir' &&
          (!p.l1Completed || p.posttestScore === null)
      );

      if (sess.status === 'Terlaksana' && incompleteEvaluation.length > 0) {
        const id = `finding-eval-${sess.id}`;
        findings.push({
          id,
          category: 'Evaluasi Belum Lengkap',
          severity: 'Sedang',
          title: `${incompleteEvaluation.length} peserta hadir belum melengkapi evaluasi L1/L2`,
          programTitle: prog.title,
          sessionCode: sess.sessionCode,
          department: prog.department,
          source: prog.source,
          evidenceCount: incompleteEvaluation.length,
          evidenceDetails: incompleteEvaluation.map(
            (p) =>
              `${p.employeeId} - ${p.name} (L1: ${p.l1Completed ? 'Selesai' : 'Belum'}, Posttest: ${
                p.posttestScore !== null ? p.posttestScore : 'Kosong'
              })`
          ),
          inspectorRecommendation:
            'Kirimkan broadcast pengingat pengisian kuesioner L1 & pengerjaan posttest ke peserta dan atasan langsung.',
          reviewStatus: reviewedIds.has(id) ? 'Ditinjau Demo' : 'Perlu Ditinjau',
        });
      }

      // 3. Training mendatang tanpa trainer / ruangan lengkap
      if (sess.status === 'Mendatang') {
        const missingFields: string[] = [];
        if (!sess.trainer || sess.trainer.trim() === '') missingFields.push('Nama Trainer / Instruktur');
        if (!sess.location || sess.location.trim() === '') missingFields.push('Ruangan / Fasilitas');

        if (missingFields.length > 0) {
          const id = `finding-upcoming-${sess.id}`;
          findings.push({
            id,
            category: 'Training Mendatang Tidak Lengkap',
            severity: 'Tinggi',
            title: `Kelengkapan logistik sesi mendatang belum diatur (${missingFields.join(', ')})`,
            programTitle: prog.title,
            sessionCode: sess.sessionCode,
            department: prog.department,
            source: prog.source,
            evidenceCount: missingFields.length,
            evidenceDetails: [
              `Tanggal Sesi: ${sess.date} (${sess.startTime} - ${sess.endTime})`,
              ...missingFields.map((f) => `Data kosong: ${f}`),
            ],
            inspectorRecommendation:
              'Tetapkan trainer pengajar dan lakukan booking ruang pelatihan di GA/Admin sebelum H-3 pelaksanaan.',
            reviewStatus: reviewedIds.has(id) ? 'Ditinjau Demo' : 'Perlu Ditinjau',
          });
        }
      }

      // 4. Status pelaksanaan belum jelas (tanggal lampau tapi masih status 'Berjalan')
      if (sess.status === 'Berjalan' && sess.date < '2026-11-08') {
        const id = `finding-status-${sess.id}`;
        findings.push({
          id,
          category: 'Status Pelaksanaan Belum Jelas',
          severity: 'Sedang',
          title: `Status kelas masih 'Berjalan' padahal tanggal sesi sudah berlalu`,
          programTitle: prog.title,
          sessionCode: sess.sessionCode,
          department: prog.department,
          source: prog.source,
          evidenceCount: 1,
          evidenceDetails: [
            `Tanggal Pelaksanaan: ${sess.date}`,
            `Status tercatat: Berjalan`,
            `Jumlah peserta terdaftar: ${sess.participants.length} orang`,
          ],
          inspectorRecommendation:
            'Verifikasi penutupan sesi kelas training dan update status menjadi "Terlaksana".',
          reviewStatus: reviewedIds.has(id) ? 'Ditinjau Demo' : 'Perlu Ditinjau',
        });
      }

      // 5. Konflik data (status batal tetapi memiliki peserta hadir)
      if (sess.status === 'Dibatalkan') {
        const conflictingParticipants = sess.participants.filter(
          (p) => p.attendance === 'Hadir'
        );
        if (conflictingParticipants.length > 0) {
          const id = `finding-conflict-${sess.id}`;
          findings.push({
            id,
            category: 'Konflik Data',
            severity: 'Tinggi',
            title: `Sesi berstatus 'Dibatalkan' namun memiliki data kehadiran Hadir`,
            programTitle: prog.title,
            sessionCode: sess.sessionCode,
            department: prog.department,
            source: prog.source,
            evidenceCount: conflictingParticipants.length,
            evidenceDetails: conflictingParticipants.map(
              (p) => `${p.employeeId} - ${p.name} (Status Hadir pada sesi Batal)`
            ),
            inspectorRecommendation:
              'Koreksi status sesi atau hapus presensi jika training memang dibatalkan, agar tidak merusak metrik partisipasi.',
            reviewStatus: reviewedIds.has(id) ? 'Ditinjau Demo' : 'Perlu Ditinjau',
          });
        }
      }
    });
  });

  return findings;
}

/**
 * Currency formatter helper
 */
export function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format short numbers (e.g. 14.5 Jt)
 */
export function formatRupiahShort(value: number): string {
  if (value >= 1_000_000_000) {
    return `Rp ${(value / 1_000_000_000).toFixed(1)} M`;
  }
  if (value >= 1_000_000) {
    return `Rp ${(value / 1_000_000).toFixed(1)} Jt`;
  }
  return formatRupiah(value);
}
