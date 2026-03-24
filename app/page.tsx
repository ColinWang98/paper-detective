'use client';

import { useEffect, useState } from 'react';

import APIKeyManager from "@/components/APIKeyManager";
import { IntelligenceBriefViewer } from "@/components/brief/IntelligenceBriefViewer";
import { CaseSetupPanel } from "@/components/case/CaseSetupPanel";
import { TutorialModal } from "@/components/case/TutorialModal";
import { WelcomeModal } from "@/components/case/WelcomeModal";
import DetectiveNotebook from "@/components/DetectiveNotebook";
import Header from "@/components/Header";
import { Modal } from "@/components/Modal";
import RealPDFViewer from "@/components/RealPDFViewer";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { extractPDFText } from "@/lib/pdf";
import { usePaperStore } from "@/lib/store";
import { getAPIKey, getActiveProviderConfig } from "@/services/apiKeyManager";
import type { Highlight } from "@/types";

export const dynamic = 'force-dynamic';

export default function Home() {
  // Enable keyboard shortcuts for undo/redo
  useKeyboardShortcuts();
  const {
    currentPaper,
    caseSetup,
    investigationPhase,
    loadCaseSetup,
    setActiveTask,
    setInvestigationPhase,
  } = usePaperStore();
  const [activeMode, setActiveMode] = useState<'notes' | 'brief'>('notes');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isGeneratingCaseSetup, setIsGeneratingCaseSetup] = useState(false);
  const [caseSetupError, setCaseSetupError] = useState<string | null>(null);
  const [caseSetupProgress, setCaseSetupProgress] = useState(0);
  const [caseSetupStage, setCaseSetupStage] = useState('Preparing investigation setup');
  const [showAPIKeyModal, setShowAPIKeyModal] = useState(false);
  const [caseSetupRetryNonce, setCaseSetupRetryNonce] = useState(0);
  const [playerName, setPlayerName] = useState('');
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [pendingEvidenceHighlight, setPendingEvidenceHighlight] = useState<Highlight | null>(null);

  useEffect(() => {
    if (!hasCompletedOnboarding && !showTutorialModal) {
      setShowWelcomeModal(true);
    }
  }, [hasCompletedOnboarding, showTutorialModal]);

  useEffect(() => {
    if (!currentPaper?.id) {
      setActiveMode('notes');
    }
  }, [currentPaper?.id]);

  useEffect(() => {
    setCaseSetupError(null);
    setCaseSetupProgress(0);
    setCaseSetupStage('Preparing investigation setup');
  }, [currentPaper?.id, pdfFile]);

  useEffect(() => {
    if (!currentPaper?.id || !pdfFile || investigationPhase !== 'setup' || caseSetup || isGeneratingCaseSetup) {
      return;
    }

    let isCancelled = false;
    const paperId = currentPaper.id;

    const generateCaseSetup = async () => {
      setIsGeneratingCaseSetup(true);
      setCaseSetupError(null);
      setCaseSetupProgress(8);
      setCaseSetupStage('Extracting paper text');
      let progressTimer: ReturnType<typeof setInterval> | null = null;

      try {
        const apiKey = getAPIKey();
        const activeProviderConfig = getActiveProviderConfig();

        if (!apiKey) {
          throw new Error('请先配置 BigModel API Key');
        }

        const extractCaseSetupText = async (): Promise<string> => {
          if (activeProviderConfig.id !== 'bigmodel') {
            return extractPDFText(pdfFile);
          }

          const parserForm = new FormData();
          parserForm.append('file', pdfFile);
          parserForm.append('apiKey', apiKey);

          const parserResponse = await fetch('/api/pdf/parse-sync', {
            method: 'POST',
            body: parserForm,
          });

          if (parserResponse.ok) {
            const parserPayload = await parserResponse.json().catch(() => null);
            const parsedText = parserPayload?.data?.text;
            if (typeof parsedText === 'string' && parsedText.trim().length > 0) {
              return parsedText;
            }
          }

          return extractPDFText(pdfFile);
        };

        const pdfText = await extractCaseSetupText();
        setCaseSetupProgress(28);
        setCaseSetupStage('Preparing AI case file');

        progressTimer = setInterval(() => {
          setCaseSetupProgress((value) => (value >= 88 ? value : value + 4));
        }, 900);
        setCaseSetupProgress(42);
        setCaseSetupStage('Analyzing paper structure and generating tasks');

        const response = await fetch('/api/ai/case-setup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paperId,
            pdfText,
            apiKey,
            model: activeProviderConfig.model,
          }),
        });

        if (!response.ok) {
          const errorPayload = await response.json().catch(() => null);
          const errorMessage =
            typeof errorPayload?.error?.message === 'string'
              ? errorPayload.error.message
              : response.statusText;
          throw new Error(errorMessage);
        }

        if (!isCancelled) {
          const result = await response.json();
          setCaseSetupProgress(96);
          setCaseSetupStage('Finalizing investigation tasks');

          if (result?.success && result.data) {
            usePaperStore.setState({
              caseSetup: result.data,
              investigationTasks: result.data.tasks ?? [],
              activeTaskId: result.data.tasks?.find((task: { status: string; id: string }) => task.status === 'available')?.id ?? null,
            });
          } else {
            await loadCaseSetup(paperId);
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to generate case setup';
        setCaseSetupError(message);
        console.error('Failed to generate case setup:', error);
      } finally {
        if (progressTimer) {
          clearInterval(progressTimer);
        }
        if (!isCancelled) {
          setIsGeneratingCaseSetup(false);
        }
      }
    };

    void generateCaseSetup();

    return () => {
      isCancelled = true;
    };
  }, [caseSetup, caseSetupRetryNonce, currentPaper?.id, investigationPhase, loadCaseSetup, pdfFile]);

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
            <RealPDFViewer
              onPdfFileChange={setPdfFile}
              onEvidenceRequest={(highlight) => setPendingEvidenceHighlight(highlight)}
            />
          </div>

          {/* Analysis Section */}
          <div className="newspaper-border bg-white/80 backdrop-blur-sm overflow-hidden">
            {shouldShowCaseSetup ? (
              <CaseSetupPanel
                caseSetup={caseSetup}
                errorMessage={caseSetupError}
                isGenerating={isGeneratingCaseSetup}
                progress={caseSetupProgress}
                progressLabel={caseSetupStage}
                onBeginInvestigation={() => setInvestigationPhase('investigate')}
                onSelectTask={(taskId) => {
                  setActiveTask(taskId);
                  setInvestigationPhase('investigate');
                }}
                onConfigureAPIKey={() => setShowAPIKeyModal(true)}
                onRetryGeneration={() => {
                  setCaseSetupError(null);
                  setCaseSetupRetryNonce((value) => value + 1);
                }}
              />
            ) : activeMode === 'notes' ? (
              <DetectiveNotebook
                pdfFile={pdfFile}
                pendingEvidenceHighlight={pendingEvidenceHighlight}
                onCloseEvidenceModal={() => setPendingEvidenceHighlight(null)}
              />
            ) : currentPaper?.id ? (
              <IntelligenceBriefViewer
                paperId={currentPaper.id}
                pdfFile={pdfFile ?? undefined}
                mode="direct-brief"
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

      <Modal
        isOpen={showAPIKeyModal}
        title="配置 BigModel API Key"
        confirmLabel="关闭"
        cancelLabel=""
        onConfirm={() => setShowAPIKeyModal(false)}
        onCancel={() => setShowAPIKeyModal(false)}
      >
        <APIKeyManager
          onSaved={() => {
            setShowAPIKeyModal(false);
            setCaseSetupError(null);
            setCaseSetupRetryNonce((value) => value + 1);
          }}
        />
      </Modal>

      <WelcomeModal
        isOpen={showWelcomeModal}
        defaultName={playerName}
        onConfirm={(name) => {
          setPlayerName(name);
          setShowWelcomeModal(false);
          setShowTutorialModal(true);
        }}
      />

      <TutorialModal
        isOpen={showTutorialModal}
        playerName={playerName}
        onConfirm={() => {
          setShowTutorialModal(false);
          setHasCompletedOnboarding(true);
        }}
      />
    </div>
  );
}
