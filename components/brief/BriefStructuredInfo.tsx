'use client';

import React, { useState, useCallback, memo } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Target, Beaker, Lightbulb, AlertTriangle, Copy, Check } from 'lucide-react';

import type { StructuredInfo } from '@/types/ai.types';

interface BriefStructuredInfoProps {
  structuredInfo: StructuredInfo;
  className?: string;
}

type InfoSection = {
  id: keyof StructuredInfo;
  label: string;
  icon: typeof Target;
  color: string;
  bgColor: string;
};

const SECTIONS: InfoSection[] = [
  {
    id: 'researchQuestion',
    label: '研究问题',
    icon: Target,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    id: 'methods',
    label: '方法论',
    icon: Beaker,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    id: 'findings',
    label: '主要发现',
    icon: Lightbulb,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
  },
  {
    id: 'limitations',
    label: '局限性与结论',
    icon: AlertTriangle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
];

/**
 * BriefStructuredInfo Component
 * Displays structured information extracted from the paper
 *
 * @component
 * @example
 * ```tsx
 * <BriefStructuredInfo
 *   structuredInfo={brief.structuredInfo}
 * />
 * ```
 */
export const BriefStructuredInfo = memo(({
  structuredInfo,
  className = '',
}: BriefStructuredInfoProps) => {
  const [expandedSections, setExpandedSections] = useState<Set<keyof StructuredInfo>>(
    new Set(['researchQuestion', 'findings']) // Default expand key sections
  );
  const [copied, setCopied] = useState<string | null>(null);

  const toggleSection = useCallback((sectionId: keyof StructuredInfo) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }, []);

  const copySection = useCallback((sectionId: string, content: string) => {
    void (async () => {
      try {
        await navigator.clipboard.writeText(content);
        setCopied(sectionId);
        setTimeout(() => setCopied(null), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    })();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className={`space-y-2 ${className}`}
      role="region"
      aria-label="结构化信息"
    >
      {SECTIONS.map(section => {
        const content = structuredInfo[section.id];
        if (!content) {return null;}

        const Icon = section.icon;
        const isExpanded = expandedSections.has(section.id);
        const isCopied = copied === section.id;

        return (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className={`bg-white border border-newspaper-border rounded-lg overflow-hidden`}
          >
            {/* Section Header */}
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors text-left"
              aria-expanded={isExpanded}
              aria-controls={`section-${section.id}`}
            >
              <div className="flex items-center gap-2">
                <div className={`p-1.5 ${section.bgColor} rounded-lg`}>
                  <Icon className={`w-4 h-4 ${section.color}`} aria-hidden="true" />
                </div>
                <h4 className="text-sm font-bold text-gray-900">
                  {section.label}
                </h4>
              </div>
              <motion.div
                animate={{ rotate: isExpanded ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRight className="w-4 h-4 text-gray-600" aria-hidden="true" />
              </motion.div>
            </button>

            {/* Section Content */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  id={`section-${section.id}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="px-3 pb-3">
                    <div className={`p-3 ${section.bgColor} border border-${section.color.replace('text-', '')}-200 rounded-lg`}>
                      {/* Handle different content types */}
                      {Array.isArray(content) ? (
                        <ul className="text-sm text-gray-800 leading-relaxed list-disc list-inside space-y-1">
                          {content.map((item, idx) => (
                            <li key={idx}>{typeof item === 'string' ? item : JSON.stringify(item)}</li>
                          ))}
                        </ul>
                      ) : typeof content === 'object' && content !== null ? (
                        <div className="text-sm text-gray-800 leading-relaxed space-y-2">
                          {Object.entries(content as Record<string, unknown>).map(([key, value]) => (
                            <div key={key}>
                              <strong>{key}:</strong> {typeof value === 'number' ? `${value}%` : String(value)}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                          {content}
                        </p>
                      )}
                    </div>

                    {/* Copy Button */}
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={() => {
                          const contentToCopy = Array.isArray(content)
                            ? content.join('\n')
                            : typeof content === 'object' && content !== null
                              ? JSON.stringify(content, null, 2)
                              : String(content);
                          copySection(section.id, contentToCopy);
                        }}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-newspaper-accent hover:bg-newspaper-accent/10 rounded transition-colors"
                        aria-label={`复制${section.label}`}
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>已复制</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>复制</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </motion.div>
  );
});
