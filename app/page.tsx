'use client';

import { useEffect, useState } from 'react';

import { IntelligenceBriefViewer } from "@/components/brief/IntelligenceBriefViewer";
import { CaseSetupPanel } from "@/components/case/CaseSetupPanel";
import DetectiveNotebook from "@/components/DetectiveNotebook";
import Header from "@/components/Header";
import RealPDFViewer from "@/components/RealPDFViewer";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { usePaperStore } from "@/lib/store";

export const dynamic = 'force-dynamic';

export default function Home() {
  // Enable keyboard shortcuts for undo/redo
  useKeyboardShortcuts();
  const {
    currentPaper,
    caseSetup,
    investigationPhase,
    setInvestigationPhase,
  } = usePaperStore();
  const [activeMode, setActiveMode] = useState<'notes' | 'brief'>('notes');
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  useEffect(() => {
    if (!currentPaper?.id) {
      setActiveMode('notes');
    }
  }, [currentPaper?.id]);

  const shouldShowCaseSetup = Boolean(
    currentPaper?.id &&
    pdfFile &&
    investigationPhase === 'setup'
  );

  return (
    <div className="min-h-screen vintage-paper">
      <Header
        caseNumber={142}
        activeMode={activeMode}
        onToggleMode={() => {
          setActiveMode((prev) => (prev === 'notes' ? 'brief' : 'notes'));
        }}
        toggleDisabled={!currentPaper?.id}
      />

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-140px)]">
          {/* PDF Viewer Section */}
          <div className="newspaper-border bg-white/80 backdrop-blur-sm overflow-hidden">
            <RealPDFViewer onPdfFileChange={setPdfFile} />
          </div>

          {/* Analysis Section */}
          <div className="newspaper-border bg-white/80 backdrop-blur-sm overflow-hidden">
            {shouldShowCaseSetup ? (
              <CaseSetupPanel
                caseSetup={caseSetup}
                onBeginInvestigation={() => setInvestigationPhase('investigate')}
              />
            ) : activeMode === 'notes' ? (
              <DetectiveNotebook pdfFile={pdfFile} />
            ) : currentPaper?.id ? (
              <IntelligenceBriefViewer
                paperId={currentPaper.id}
                pdfFile={pdfFile ?? undefined}
                className="h-full overflow-auto rounded-none border-0"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-newspaper-cream p-8 text-center text-newspaper-faded">
                <div>
                  <h3 className="text-lg font-bold text-newspaper-ink">AI 简报模式</h3>
                  <p className="mt-2 text-sm">先导入论文，系统会生成故事背景、结构化信息和 AI 线索。</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
