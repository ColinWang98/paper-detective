'use client';

import React, { useState, useCallback, useEffect } from 'react';

import { motion } from 'framer-motion';
import { Loader2, DollarSign, Zap, CheckCircle, X, FileText } from 'lucide-react';

import { extractPDFText } from '@/lib/pdf';
import { usePaperStore } from '@/lib/store';
import { aiClueCardService } from '@/services/aiClueCardService';
import { aiService } from '@/services/aiService';

// Use the same status type as AIAnalysisButton
export type AIAnalysisStatus = 'idle' | 'extracting' | 'analyzing' | 'generating' | 'completed' | 'error';

interface AIClueCardGeneratorProps {
  pdfFile: File | null;
  onComplete?: () => void;
}

export default function AIClueCardGenerator({ pdfFile, onComplete }: AIClueCardGeneratorProps) {
  const { currentPaper, highlights, loadAIClueCards } = usePaperStore();

  const [clipStatus, setClipStatus] = useState<AIAnalysisStatus>('idle');
  const [structuredStatus, setStructuredStatus] = useState<AIAnalysisStatus>('idle');
  const [streamingText, setStreamingText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pdfText, setPdfText] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState(false);

  // Extract PDF text when file changes
  useEffect(() => {
    if (pdfFile && !pdfText) {
      setIsExtracting(true);
      extractPDFText(pdfFile)
        .then(setPdfText)
        .catch(err => {
          console.error('Failed to extract PDF text:', err);
          setError('无法提取PDF文本，请确保文件有效');
        })
        .finally(() => setIsExtracting(false));
    }
  }, [pdfFile, pdfText]);

  // Estimate costs (simple calculation based on token count)
  const clipCost = pdfText ? (pdfText.length / 4) * 0.000003 * 1.5 : 0; // ~1.5x input for output
  const structuredCost = pdfText ? (pdfText.length / 4) * 0.000003 * 2 : 0; // ~2x input for output
  const totalCost = clipCost + structuredCost;

  // Generate Clip Summary
  const generateClip = useCallback(async () => {
    if (!currentPaper || !pdfText || clipStatus === 'extracting' || clipStatus === 'analyzing' || clipStatus === 'generating') {
      return;
    }

    setClipStatus('extracting');
    setError(null);
    setStreamingText('');

    try {
      // First generate the clip summary using aiService
      const clipResult = await aiService.generateClipSummary({
        paperId: currentPaper.id!,
        pdfText,
        highlights,
        onProgress: (chunk) => {
          setStreamingText(prev => prev + chunk);
          setClipStatus('generating');
        },
      });

      // Then convert to cards using aiClueCardService
      await aiClueCardService.generateCardsFromClipSummary(
        currentPaper.id!,
        clipResult.summary,
        clipResult.confidence
      );

      setClipStatus('completed');
      await loadAIClueCards(currentPaper.id!);
      onComplete?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : '生成失败';
      setError(message);
      setClipStatus('error');
    }
  }, [currentPaper, pdfText, highlights, clipStatus, loadAIClueCards, onComplete]);

  // Generate Structured Info Cards
  const generateStructured = useCallback(async () => {
    if (!currentPaper || !pdfText || structuredStatus === 'extracting' || structuredStatus === 'analyzing' || structuredStatus === 'generating') {
      return;
    }

    setStructuredStatus('extracting');
    setError(null);
    setStreamingText('');

    try {
      // First generate structured info using aiService
      const structuredResult = await aiService.extractStructuredInfo({
        paperId: currentPaper.id!,
        pdfText,
        highlights,
        onProgress: (chunk) => {
          setStreamingText(prev => prev + chunk);
          setStructuredStatus('generating');
        },
      });

      // Then convert to cards using aiClueCardService
      await aiClueCardService.generateCardsFromStructuredInfo(
        currentPaper.id!,
        {
          researchQuestion: structuredResult.researchQuestion,
          methodology: structuredResult.methodology,
          findings: structuredResult.findings,
          conclusions: structuredResult.conclusions,
        },
        structuredResult.confidence
      );

      setStructuredStatus('completed');
      await loadAIClueCards(currentPaper.id!);
      onComplete?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : '生成失败';
      setError(message);
      setStructuredStatus('error');
    }
  }, [currentPaper, pdfText, highlights, structuredStatus, loadAIClueCards, onComplete]);

  // Generate both
  const generateAll = useCallback(async () => {
    await generateClip();
    await generateStructured();
  }, [generateClip, generateStructured]);

  const isGenerating = clipStatus === 'extracting' || clipStatus === 'analyzing' || clipStatus === 'generating';
  const isStructuring = structuredStatus === 'extracting' || structuredStatus === 'analyzing' || structuredStatus === 'generating';

  if (!pdfFile) {
    return (
      <div className="bg-newspaper-cream border border-newspaper-border rounded-lg p-4 text-center">
        <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600">请先导入PDF文件</p>
      </div>
    );
  }

  if (isExtracting) {
    return (
      <div className="bg-newspaper-cream border border-newspaper-border rounded-lg p-4 text-center">
        <Loader2 className="w-8 h-8 text-newspaper-accent animate-spin mx-auto mb-2" />
        <p className="text-sm text-gray-600">正在提取PDF文本...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Cost Estimate */}
      {pdfText && (
        <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-newspaper-border">
          <DollarSign className="w-4 h-4 text-green-600" />
          <div className="flex-1">
            <p className="text-xs text-gray-600">预估成本</p>
            <p className="text-sm font-bold text-gray-900">
              ${(totalCost * 100).toFixed(2)}¢
              <span className="text-xs font-normal text-gray-500 ml-2">
                (Clip: ${(clipCost * 100).toFixed(2)}¢ + 结构化: ${(structuredCost * 100).toFixed(2)}¢)
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Generate Buttons */}
      <div className="space-y-2">
        {/* Clip Summary Button */}
        <button
          onClick={() => { void generateClip(); }}
          disabled={!pdfText || isGenerating}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>生成中...</span>
            </>
          ) : clipStatus === 'completed' ? (
            <>
              <CheckCircle className="w-4 h-4" />
              <span>已生成</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              <span>生成 Clip 摘要</span>
            </>
          )}
        </button>

        {/* Structured Info Button */}
        <button
          onClick={() => { void generateStructured(); }}
          disabled={!pdfText || isStructuring}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
        >
          {isStructuring ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>生成中...</span>
            </>
          ) : structuredStatus === 'completed' ? (
            <>
              <CheckCircle className="w-4 h-4" />
              <span>已生成</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              <span>生成结构化信息</span>
            </>
          )}
        </button>

        {/* Generate All Button */}
        {(clipStatus === 'completed' || structuredStatus === 'completed') &&
         clipStatus !== 'completed' && structuredStatus !== 'completed' && (
          <button
            onClick={() => { void generateAll(); }}
            disabled={isGenerating || isStructuring}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-newspaper-accent to-red-900 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
          >
            <Zap className="w-4 h-4" />
            <span>生成全部 AI 线索</span>
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2"
        >
          <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-bold text-red-800">生成失败</p>
            <p className="text-xs text-red-700 mt-1">{error}</p>
          </div>
        </motion.div>
      )}

      {/* Streaming Preview */}
      {(isGenerating || isStructuring) && streamingText && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="p-3 bg-newspaper-cream border border-newspaper-accent/30 rounded-lg"
        >
          <p className="text-xs text-gray-600 mb-2 font-medium flex items-center gap-2">
            <Loader2 className="w-3 h-3 animate-spin" />
            AI 正在生成...
          </p>
          <p className="text-sm text-gray-800 whitespace-pre-wrap">{streamingText.slice(-200)}</p>
        </motion.div>
      )}
    </div>
  );
}
