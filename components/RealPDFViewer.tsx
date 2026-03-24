'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';

import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Upload, X } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';

import { getPdfWorkerSrc } from '@/lib/pdfWorker';
import { usePaperStore } from '@/lib/store';
import { PRIORITY_COLOR_MAP, type Highlight, type HighlightColor, type HighlightPriority } from '@/types';

import { HighlightOverlay } from './HighlightOverlay';
import PriorityLegend from './PriorityLegend';

function normalizeSelectionText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function isSelectionInsidePdfTextLayer(selection: Selection, container: HTMLDivElement | null): boolean {
  if (!container || selection.rangeCount === 0) {
    return false;
  }

  const range = selection.getRangeAt(0);
  const commonAncestor = range.commonAncestorContainer;
  const element = commonAncestor.nodeType === Node.ELEMENT_NODE
    ? commonAncestor as Element
    : commonAncestor.parentElement;

  return Boolean(element?.closest('.react-pdf__Page__textContent')) && container.contains(element ?? null);
}

function getBoundingRectFromClientRects(rects: DOMRectList): DOMRect | null {
  if (rects.length === 0) {
    return null;
  }

  let left = Number.POSITIVE_INFINITY;
  let top = Number.POSITIVE_INFINITY;
  let right = Number.NEGATIVE_INFINITY;
  let bottom = Number.NEGATIVE_INFINITY;

  for (const rect of Array.from(rects)) {
    if (rect.width === 0 || rect.height === 0) {
      continue;
    }

    left = Math.min(left, rect.left);
    top = Math.min(top, rect.top);
    right = Math.max(right, rect.right);
    bottom = Math.max(bottom, rect.bottom);
  }

  if (!Number.isFinite(left) || !Number.isFinite(top) || !Number.isFinite(right) || !Number.isFinite(bottom)) {
    return null;
  }

  return new DOMRect(left, top, right - left, bottom - top);
}

function getRelativeRects(rects: DOMRectList, pageRect: DOMRect) {
  return Array.from(rects)
    .filter((rect) => rect.width > 0 && rect.height > 0)
    .map((rect) => ({
      x: Math.max(0, Math.min(100, ((rect.left - pageRect.left) / pageRect.width) * 100)),
      y: Math.max(0, Math.min(100, ((rect.top - pageRect.top) / pageRect.height) * 100)),
      width: Math.max(0, Math.min(100, (rect.width / pageRect.width) * 100)),
      height: Math.max(0, Math.min(100, (rect.height / pageRect.height) * 100)),
    }));
}

// 配置PDF.js worker
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = getPdfWorkerSrc(pdfjs.version);
}

interface RealPDFViewerProps {
  _onHighlightAdd?: (highlight: any) => void;
  onPdfFileChange?: (file: File | null) => void;
  onEvidenceRequest?: (highlight: Highlight) => void;
}

export default function RealPDFViewer({ _onHighlightAdd, onPdfFileChange, onEvidenceRequest }: RealPDFViewerProps) {
  // Zustand store
  const { currentPaper, addHighlight, highlights, selectedPriority, setSelectedPriority } = usePaperStore();

  // PDF state
  const [pdfFile, setPdfFile] = useState<string | null>(null);
  const [_pdfFileObject, setPdfFileObject] = useState<File | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [pageWidth, setPageWidth] = useState<number>(600);

  // Highlight state
  const [selectionRange, setSelectionRange] = useState<any>(null);
  const [selectionDraftText, setSelectionDraftText] = useState<string>('');
  const [_highlightAreas, setHighlightAreas] = useState<Map<number, any[]>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const pageOverlayRef = useRef<HTMLDivElement>(null);

  // Initialize database on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      void import('@/lib/db').then(({ initializeDatabase }) => {
        void initializeDatabase();
      });
    }
  }, []);

  // Load highlights when paper changes
  useEffect(() => {
    if (currentPaper) {
      void usePaperStore.getState().loadHighlights(currentPaper.id!);
    }
  }, [currentPaper]);

  // Handle file upload
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {return;}

    // Validate file type
    if (file.type !== 'application/pdf') {
      alert('请选择PDF文件');
      return;
    }

    // Validate file size (50MB limit)
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    if (file.size > MAX_FILE_SIZE) {
      alert('文件过大，请选择小于50MB的PDF文件');
      return;
    }

    const fileURL = URL.createObjectURL(file);
    setPdfFile(fileURL);
    setPdfFileObject(file);
    setCurrentPage(1);
    onPdfFileChange?.(file);

    try {
      const paperId = await usePaperStore.getState().addPaper(file);
      const papers = usePaperStore.getState().papers;
      const paper = papers.find(p => p.id === paperId);
      if (paper) {
        usePaperStore.getState().setCurrentPaper(paper);
      }
    } catch (error) {
      console.error('Failed to save paper:', error);
    }
  };

  // PDF document loaded
  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  }, []);

  // Page navigation
  const goToPreviousPage = () => setCurrentPage((prev) => Math.max(1, prev - 1));
  const goToNextPage = () => setCurrentPage((prev) => Math.min(numPages, prev + 1));

  const zoomIn = () => {
    setScale((prev) => Math.min(2.4, Number((prev + 0.1).toFixed(2))));
  };

  const zoomOut = () => {
    setScale((prev) => Math.max(0.6, Number((prev - 0.1).toFixed(2))));
  };

  // HCI-compliant: priority-based colors
  const priorities = [
    { name: 'critical' as HighlightPriority, color: 'red' as HighlightColor, bg: 'bg-red-100 hover:bg-red-200 border-red-500', label: '🔴', description: '关键 - 必须记住' },
    { name: 'important' as HighlightPriority, color: 'yellow' as HighlightColor, bg: 'bg-yellow-100 hover:bg-yellow-200 border-yellow-500', label: '🟡', description: '重要 - 值得记录' },
    { name: 'interesting' as HighlightPriority, color: 'orange' as HighlightColor, bg: 'bg-orange-100 hover:bg-orange-200 border-orange-500', label: '🟠', description: '有趣 - 可能相关' },
    { name: 'archived' as HighlightPriority, color: 'gray' as HighlightColor, bg: 'bg-gray-100 hover:bg-gray-200 border-gray-400', label: '⚪', description: '存档 - 备用' },
  ];

  // Handle text selection
  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || !isSelectionInsidePdfTextLayer(selection, containerRef.current)) {
      setSelectionRange(null);
      setSelectionDraftText('');
      return;
    }

    const text = normalizeSelectionText(selection.toString());

    if (!text || text.length === 0) {
      setSelectionRange(null);
      setSelectionDraftText('');
      return;
    }

    const range = selection?.getRangeAt(0);
    if (!range) {return;}

    const rects = range.getClientRects();
    const boundingRect = getBoundingRectFromClientRects(rects);
    const pageRect = pageOverlayRef.current?.getBoundingClientRect();
    if (!boundingRect || !pageRect) {return;}
    const relativeRects = getRelativeRects(rects, pageRect);
    if (relativeRects.length === 0) {
      setSelectionRange(null);
      setSelectionDraftText('');
      return;
    }

    const relativeX = ((boundingRect.left - pageRect.left) / pageRect.width) * 100;
    const relativeY = ((boundingRect.top - pageRect.top) / pageRect.height) * 100;
    const relativeWidth = (boundingRect.width / pageRect.width) * 100;
    const relativeHeight = (boundingRect.height / pageRect.height) * 100;

    setSelectionRange({
      text,
      rect: {
        x: boundingRect.left - pageRect.left,
        y: boundingRect.top - pageRect.top,
        width: boundingRect.width,
        height: boundingRect.height,
      },
      position: {
        x: Math.max(0, Math.min(100, relativeX)),
        y: Math.max(0, Math.min(100, relativeY)),
        width: Math.max(0, Math.min(100, relativeWidth)),
        height: Math.max(0, Math.min(100, relativeHeight)),
      },
      rects: relativeRects,
      range,
    });
    setSelectionDraftText(text);
  }, []);

  // Create highlight from selection
  const createHighlight = async () => {
    if (!selectionRange || !currentPaper) {return;}

    const startTime = performance.now();

    try {
      const normalizedText = normalizeSelectionText(selectionDraftText);
      if (!normalizedText) {
        return;
      }

      const color = PRIORITY_COLOR_MAP[selectedPriority];
      const highlightData: Omit<Highlight, 'id'> = {
        paperId: currentPaper.id!,
        pageNumber: currentPage,
        text: normalizedText,
        priority: selectedPriority,
        color,
        position: selectionRange.position,
        rects: selectionRange.rects,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      const highlightId = await addHighlight(highlightData);
      const createdHighlight = { ...highlightData, id: highlightId } as Highlight;
      _onHighlightAdd?.(createdHighlight);
      onEvidenceRequest?.(createdHighlight);

      // Clear selection
      window.getSelection()?.removeAllRanges();
      setSelectionRange(null);
      setSelectionDraftText('');

      const duration = performance.now() - startTime;
      if (duration > 200) {
        console.warn(`Highlight creation took ${duration.toFixed(2)}ms (target: <200ms)`);
      }
    } catch (error) {
      console.error('Failed to create highlight:', error);
    }
  };

  // Listen for text selection
  useEffect(() => {
    document.addEventListener('mouseup', handleTextSelection);

    return () => {
      document.removeEventListener('mouseup', handleTextSelection);
    };
  }, [handleTextSelection]);

  useEffect(() => {
    if (!containerRef.current || typeof ResizeObserver === 'undefined') {
      return;
    }

    const updatePageWidth = () => {
      if (!containerRef.current) {
        return;
      }

      const nextWidth = Math.max(320, Math.floor(containerRef.current.clientWidth - 64));
      setPageWidth(nextWidth);
    };

    updatePageWidth();

    const observer = new ResizeObserver(() => {
      updatePageWidth();
    });

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [pdfFile]);

  // Close PDF
  const closePDF = () => {
    // Revoke object URL to prevent memory leak
    if (pdfFile) {
      URL.revokeObjectURL(pdfFile);
    }
    setPdfFile(null);
    setPdfFileObject(null);
    setNumPages(0);
    setCurrentPage(1);
    setHighlightAreas(new Map());
    setSelectionRange(null);
    setSelectionDraftText('');
    onPdfFileChange?.(null);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pdfFile) {
        URL.revokeObjectURL(pdfFile);
      }
    };
  }, [pdfFile]);

  return (
    <div className="h-full flex flex-col bg-newspaper-cream">
      {/* PDF Toolbar */}
      <div className="bg-newspaper-aged border-b border-newspaper-border p-3">
        <div className="flex items-center justify-between">
          {/* File upload */}
          <div className="flex items-center gap-2 flex-1">
            {!pdfFile ? (
              <label className="flex items-center gap-2 px-4 py-2 bg-newspaper-accent text-white rounded cursor-pointer hover:bg-red-900 transition-colors">
                <Upload className="w-4 h-4" />
                <span>导入PDF</span>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => { void handleFileChange(e); }}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-newspaper-ink max-w-md truncate">
                  📄 {currentPaper?.title || '论文.pdf'}
                </span>
                <button
                  onClick={closePDF}
                  className="p-1 hover:bg-red-100 rounded"
                  title="关闭PDF"
                >
                  <X className="w-4 h-4 text-red-600" />
                </button>
              </div>
            )}
          </div>

          {/* Navigation and zoom */}
          {pdfFile && (
            <div className="flex items-center gap-3">
              {/* Page navigation */}
              <div className="flex items-center gap-1 border-r border-newspaper-border pr-3">
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage <= 1}
                  className="p-1.5 hover:bg-newspaper-cream rounded disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="上一页"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-mono px-2" aria-label="当前页码">
                  {currentPage} / {numPages}
                </span>
                <button
                  onClick={goToNextPage}
                  disabled={currentPage >= numPages}
                  className="p-1.5 hover:bg-newspaper-cream rounded disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="下一页"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Zoom controls */}
              <div className="flex items-center gap-1">
                <button
                  onClick={zoomOut}
                  className="p-1.5 hover:bg-newspaper-cream rounded"
                  aria-label="缩小"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-sm font-mono px-2 w-16 text-center" aria-label="缩放比例">
                  {Math.round(scale * 100)}%
                </span>
                <button
                  onClick={zoomIn}
                  className="p-1.5 hover:bg-newspaper-cream rounded"
                  aria-label="放大"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Priority selector (HCI-compliant) */}
          {pdfFile && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {priorities.map((priority) => (
                  <button
                    key={priority.name}
                    onClick={() => setSelectedPriority(priority.name)}
                    className={`px-3 py-1.5 text-xs rounded border-2 transition-all ${
                      selectedPriority === priority.name
                        ? `${priority.bg} ring-2 ring-newspaper-accent ring-offset-1 shadow-md`
                        : `${priority.bg} opacity-70 hover:opacity-100 hover:ring-2 hover:ring-newspaper-sepia hover:ring-offset-1`
                    }`}
                    title={priority.description}
                    aria-label={`选择优先级: ${priority.description}`}
                  >
                    {priority.label}
                  </button>
                ))}
              </div>
              <PriorityLegend />
            </div>
          )}
        </div>
      </div>

      {/* PDF content area */}
      <div className="flex-1 overflow-auto p-8 bg-newspaper-cream" ref={containerRef}>
        {!pdfFile ? (
          /* Empty state */
          <div className="h-full flex flex-col items-center justify-center text-newspaper-faxed">
            <div className="text-6xl mb-4">📰</div>
            <h3 className="text-xl font-bold text-newspaper-ink mb-2">
              欢迎来到Paper Detective
            </h3>
            <p className="text-sm mb-6">导入一篇论文，开始你的侦探之旅</p>
            <label className="px-6 py-3 bg-newspaper-accent text-white rounded-lg cursor-pointer hover:bg-red-900 transition-colors shadow-lg">
              <Upload className="w-5 h-5 inline mr-2" />
              选择PDF文件
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => { void handleFileChange(e); }}
                className="hidden"
              />
            </label>
          </div>
        ) : (
          /* PDF rendering */
          <div className="flex justify-center relative">
            <div ref={pageOverlayRef} className="relative inline-block">
            <Document
              file={pdfFile}
              onLoadSuccess={onDocumentLoadSuccess}
              className="shadow-paper"
              loading={
                <div className="flex items-center justify-center p-12">
                  <div className="text-newspaper-faxed">加载中...</div>
                </div>
              }
              error={
                <div className="flex flex-col items-center justify-center p-12 text-red-600">
                  <p className="font-bold">PDF加载失败</p>
                  <p className="text-sm">请尝试重新上传文件</p>
                </div>
              }
            >
              <Page
                pageNumber={currentPage}
                renderTextLayer={true}
                renderAnnotationLayer={false}
                className="bg-white"
                width={Math.floor(pageWidth * scale)}
              />
            </Document>
            <HighlightOverlay highlights={highlights} currentPage={currentPage} />
            </div>

            {/* Highlight selection popup */}
            {false && selectionRange && (
              <div
                className="absolute z-50 bg-newspaper-accent text-white px-4 py-2 rounded-lg shadow-xl flex items-center gap-3"
                style={{
                  left: selectionRange.rect.x + selectionRange.rect.width / 2,
                  top: selectionRange.rect.y + selectionRange.rect.height + 10,
                  transform: 'translateX(-50%)',
                }}
              >
                <span className="text-sm">添加到收集箱</span>
                <button
                  onClick={() => { void createHighlight(); }}
                  className="px-3 py-1 bg-white text-newspaper-accent rounded text-sm font-bold hover:bg-newspaper-cream transition-colors"
                >
                  确定
                </button>
                <button
                  onClick={() => {
                    window.getSelection()?.removeAllRanges();
                    setSelectionRange(null);
                  }}
                  className="px-3 py-1 bg-transparent text-white rounded text-sm hover:bg-white/20 transition-colors"
                >
                  取消
                </button>
              </div>
            )}
            {selectionRange ? (
              <div className="fixed bottom-6 right-6 z-50 w-[min(28rem,calc(100vw-3rem))] rounded-lg bg-newspaper-accent px-4 py-3 text-white shadow-xl">
                <p className="text-sm font-semibold">Review extracted text before saving</p>
                <textarea
                  value={selectionDraftText}
                  onChange={(event) => setSelectionDraftText(event.target.value)}
                  className="mt-2 min-h-24 w-full rounded-md border border-white/30 bg-white/10 p-2 text-sm text-white placeholder:text-white/70"
                  placeholder="Edit the extracted text if the PDF selection is noisy."
                />
                <div className="mt-3 flex items-center justify-end gap-3">
                  <button
                    onClick={() => {
                      window.getSelection()?.removeAllRanges();
                      setSelectionRange(null);
                      setSelectionDraftText('');
                    }}
                    className="rounded px-3 py-1 text-sm hover:bg-white/20 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => { void createHighlight(); }}
                    className="rounded bg-white px-3 py-1 text-sm font-bold text-newspaper-accent hover:bg-newspaper-cream transition-colors"
                  >
                    Save Highlight
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Instructions */}
      {pdfFile && (
        <div className="bg-newspaper-aged border-t border-newspaper-border p-2 text-center">
          <p className="text-xs text-newspaper-faxed">
            💡 选择文本自动添加到收集箱 | 拖拽高亮到右侧分组 | 点击AI卡片定位原文
          </p>
        </div>
      )}
    </div>
  );
}
