'use client';

import React, { memo, useCallback, useEffect, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Download, FileText, Loader2, RefreshCw, Trash2 } from 'lucide-react';

import APIKeyManager from '@/components/APIKeyManager';
import { Modal } from '@/components/Modal';
import ToastContainer, { useToast } from '@/components/Toast';
import { useIntelligenceBrief } from '@/hooks/useIntelligenceBrief';

import { BriefClipSummary } from './BriefClipSummary';
import { BriefClueCards } from './BriefClueCards';
import { BriefHeader } from './BriefHeader';
import { BriefMetadataFooter } from './BriefMetadataFooter';
import { BriefStructuredInfo } from './BriefStructuredInfo';
import { BriefUserHighlights } from './BriefUserHighlights';

interface IntelligenceBriefViewerProps {
  paperId: number;
  pdfFile?: File;
  className?: string;
  mode?: 'direct-brief' | 'final-report';
}

export function IntelligenceBriefViewer({
  paperId,
  pdfFile,
  className = '',
  mode = 'direct-brief',
}: IntelligenceBriefViewerProps): React.JSX.Element {
  const {
    status,
    brief,
    error,
    progress,
    isReportLocked,
    generateBrief,
    regenerateBrief,
    exportAsMarkdown,
    exportAsBibTeX,
    deleteBrief,
  } = useIntelligenceBrief({ mode });

  const [isExportingMarkdown, setIsExportingMarkdown] = useState(false);
  const [isExportingBibTeX, setIsExportingBibTeX] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAPIKeyModal, setShowAPIKeyModal] = useState(false);
  const { toasts, showToast, dismissToast } = useToast();

  useEffect(() => {
    if (mode === 'direct-brief' && !brief && !error && status === 'idle' && pdfFile) {
      void generateBrief(pdfFile);
    }
  }, [brief, error, status, pdfFile, generateBrief, mode]);

  const triggerDownload = useCallback((content: string, fileName: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, []);

  const handleExportMarkdown = useCallback(() => {
    if (!brief) {
      return;
    }

    setIsExportingMarkdown(true);
    setExportError(null);

    try {
      const markdown = exportAsMarkdown();
      if (markdown) {
        const fileName = `${brief.caseFile.title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}_情报简报.md`;
        triggerDownload(markdown, fileName, 'text/markdown');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '导出失败';
      setExportError(message);
      setTimeout(() => setExportError(null), 5000);
    } finally {
      setIsExportingMarkdown(false);
    }
  }, [brief, exportAsMarkdown, triggerDownload]);

  const handleExportBibTeX = useCallback(() => {
    if (!brief) {
      return;
    }

    setIsExportingBibTeX(true);
    setExportError(null);

    try {
      const bibtex = exportAsBibTeX();
      if (bibtex) {
        const fileName = `${brief.caseFile.title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}_引用.bib`;
        triggerDownload(bibtex, fileName, 'text/plain');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '导出失败';
      setExportError(message);
      setTimeout(() => setExportError(null), 5000);
    } finally {
      setIsExportingBibTeX(false);
    }
  }, [brief, exportAsBibTeX, triggerDownload]);

  const handleRegenerate = useCallback(() => {
    setIsRegenerating(true);
    void (async () => {
      try {
        await regenerateBrief(pdfFile);
      } catch (error) {
        const message = error instanceof Error ? error.message : '未知错误';
        showToast(`重新生成失败: ${message}`, 'error');
      } finally {
        setIsRegenerating(false);
      }
    })();
  }, [pdfFile, regenerateBrief, showToast]);

  const confirmDelete = useCallback(() => {
    setShowDeleteModal(false);
    setIsDeleting(true);
    void (async () => {
      try {
        await deleteBrief();
      } catch (error) {
        const message = error instanceof Error ? error.message : '未知错误';
        showToast(`删除失败: ${message}`, 'error');
      } finally {
        setIsDeleting(false);
      }
    })();
  }, [deleteBrief, showToast]);

  if (status === 'loading' || status === 'generating') {
    return (
      <div className={`rounded-lg border border-newspaper-border bg-newspaper-cream p-8 ${className}`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center space-y-4 text-center"
        >
          <Loader2 className="h-12 w-12 animate-spin text-newspaper-accent" aria-hidden="true" />
          <div>
            <h3 className="mb-1 text-lg font-bold text-gray-900">正在生成情报简报...</h3>
            <p className="text-sm text-gray-600">AI 正在分析论文并提取关键信息</p>
          </div>
          {progress > 0 && (
            <div className="w-full max-w-md space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>进度</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                  className="h-full bg-newspaper-accent"
                />
              </div>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  if (status === 'error' && error) {
    return (
      <>
        <div className={`rounded-lg border border-red-200 bg-red-50 p-6 ${className}`}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3"
          >
            <AlertCircle className="mt-0.5 h-6 w-6 flex-shrink-0 text-red-600" aria-hidden="true" />
            <div className="flex-1">
              <h3 className="mb-1 text-base font-bold text-red-900">生成情报简报失败</h3>
              <p className="mb-3 text-sm text-red-700">{error}</p>
              <div className="flex gap-2">
                <button
                  onClick={handleRegenerate}
                  disabled={isRegenerating}
                  className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} aria-hidden="true" />
                  {isRegenerating ? '重试中...' : '重试'}
                </button>
                <button
                  onClick={() => setShowAPIKeyModal(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
                  aria-label="配置 API Key"
                >
                  配置 API Key
                </button>
              </div>
            </div>
          </motion.div>
        </div>
        <Modal
          isOpen={showAPIKeyModal}
          title="配置 BigModel API Key"
          confirmLabel="关闭"
          cancelLabel=""
          onConfirm={() => setShowAPIKeyModal(false)}
          onCancel={() => setShowAPIKeyModal(false)}
        >
          <APIKeyManager />
        </Modal>
      </>
    );
  }

  if (mode === 'final-report' && !brief && isReportLocked) {
    return (
      <>
        <div className={`rounded-lg border border-dashed border-newspaper-border bg-newspaper-cream p-8 ${className}`}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center space-y-4 text-center"
          >
            <FileText className="h-12 w-12 text-gray-400" aria-hidden="true" />
            <div>
              <h3 className="mb-1 text-lg font-bold text-gray-900">Final Case Report Locked</h3>
              <p className="text-sm text-gray-600">
                Complete every core investigation task before generating the final case report.
              </p>
            </div>
          </motion.div>
        </div>
        <Modal
          isOpen={showAPIKeyModal}
          title="配置 BigModel API Key"
          confirmLabel="关闭"
          cancelLabel=""
          onConfirm={() => setShowAPIKeyModal(false)}
          onCancel={() => setShowAPIKeyModal(false)}
        >
          <APIKeyManager />
        </Modal>
      </>
    );
  }

  if (!brief) {
    const emptyTitle = mode === 'direct-brief' ? 'AI Brief Ready to Generate' : '暂无情报简报';
    const emptyDescription = mode === 'direct-brief'
      ? 'Upload a paper and generate a direct AI brief with structure, findings, and key takeaways.'
      : '点击下方按钮生成 AI 分析报告';
    const actionLabel = mode === 'direct-brief' ? 'Generate AI Brief' : '生成情报简报';

    return (
      <>
        <div className={`rounded-lg border border-dashed border-newspaper-border bg-newspaper-cream p-8 ${className}`}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center space-y-4 text-center"
          >
            <FileText className="h-12 w-12 text-gray-400" aria-hidden="true" />
            <div>
              <h3 className="mb-1 text-lg font-bold text-gray-900">{emptyTitle}</h3>
              <p className="text-sm text-gray-600">{emptyDescription}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (pdfFile) {
                    void generateBrief(pdfFile);
                  }
                }}
                disabled={!pdfFile}
                className="flex items-center gap-2 rounded-lg bg-newspaper-accent px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                {actionLabel}
              </button>
              <button
                onClick={() => setShowAPIKeyModal(true)}
                className="flex items-center gap-2 rounded-lg border border-newspaper-accent bg-white px-4 py-2 text-sm font-medium text-newspaper-accent shadow-sm transition-colors hover:bg-newspaper-accent/10"
                aria-label="配置 API Key"
              >
                配置 API Key
              </button>
            </div>
          </motion.div>
        </div>
        <Modal
          isOpen={showAPIKeyModal}
          title="配置 BigModel API Key"
          confirmLabel="关闭"
          cancelLabel=""
          onConfirm={() => setShowAPIKeyModal(false)}
          onCancel={() => setShowAPIKeyModal(false)}
        >
          <APIKeyManager />
        </Modal>
      </>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`overflow-hidden rounded-lg border border-newspaper-border bg-white ${className}`}
      >
        <BriefHeader
          brief={brief as any}
          onRegenerate={handleRegenerate}
          isRegenerating={isRegenerating}
        />

        <div className="flex items-center justify-between border-b border-newspaper-border bg-gray-50 px-4 py-2">
          <span className="text-xs text-gray-600">情报简报 #{paperId}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportMarkdown}
              disabled={isExportingMarkdown}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-newspaper-accent/10 hover:text-newspaper-accent disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="导出为 Markdown"
            >
              <Download className={`h-3.5 w-3.5 ${isExportingMarkdown ? 'animate-bounce' : ''}`} aria-hidden="true" />
              {isExportingMarkdown ? '导出中...' : '导出 Markdown'}
            </button>
            <button
              onClick={handleExportBibTeX}
              disabled={isExportingBibTeX}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-newspaper-accent/10 hover:text-newspaper-accent disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="导出为 BibTeX"
            >
              <Download className={`h-3.5 w-3.5 ${isExportingBibTeX ? 'animate-bounce' : ''}`} aria-hidden="true" />
              {isExportingBibTeX ? '导出中...' : '导出 BibTeX'}
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              disabled={isDeleting}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="删除简报"
            >
              <Trash2 className={`h-3.5 w-3.5 ${isDeleting ? 'animate-pulse' : ''}`} aria-hidden="true" />
              {isDeleting ? '删除中...' : '删除'}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {exportError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-b border-red-200 bg-red-50 px-4 py-2"
              role="alert"
            >
              <p className="text-xs text-red-800">{exportError}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="divide-y divide-newspaper-border">
          {brief.clipSummary && (
            <div className="p-4">
              <BriefClipSummary clipSummary={brief.clipSummary} />
            </div>
          )}
          {brief.structuredInfo && (
            <div className="p-4">
              <BriefStructuredInfo structuredInfo={brief.structuredInfo} />
            </div>
          )}
          {brief.clueCards && brief.clueCards.length > 0 && (
            <div className="p-4">
              <BriefClueCards cards={brief.clueCards} />
            </div>
          )}
          {brief.userHighlights?.topHighlights && brief.userHighlights.topHighlights.length > 0 && (
            <div className="p-4">
              <BriefUserHighlights userHighlights={brief.userHighlights} />
            </div>
          )}
        </div>

        <BriefMetadataFooter brief={brief as any} />
      </motion.div>

      <Modal
        isOpen={showDeleteModal}
        title="删除确认"
        confirmLabel="删除"
        cancelLabel="取消"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteModal(false)}
        variant="danger"
      >
        <p className="text-gray-700">确定要删除这份情报简报吗？此操作无法撤销。</p>
      </Modal>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}

export default memo(IntelligenceBriefViewer);
