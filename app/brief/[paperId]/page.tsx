'use client';

import React from 'react';

import { ArrowLeft, Home } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { IntelligenceBriefViewer } from '@/components/brief/IntelligenceBriefViewer';

/**
 * Intelligence Brief Page
 * Standalone page for viewing intelligence brief for a specific paper
 *
 * Route: /brief/[paperId]
 *
 * @component
 */
export default function IntelligenceBriefPage() {
  const params = useParams();
  const paperId = params?.paperId ? Number(params.paperId) : undefined;

  // Invalid paperId
  if (!paperId || isNaN(paperId)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-newspaper-cream to-white flex items-center justify-center p-4">
        <div className="bg-white border-2 border-newspaper-error rounded-lg p-8 max-w-md">
          <h1 className="text-2xl font-bold text-red-700 mb-4">无效的论文ID</h1>
          <p className="text-gray-700 mb-6">请检查URL或返回主页面。</p>
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 bg-newspaper-primary text-white rounded-lg hover:bg-newspaper-primary/90 transition-colors"
          >
            <Home className="w-4 h-4 mr-2" />
            返回主页
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-newspaper-cream to-white">
      {/* Navigation Header */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b-2 border-newspaper-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="inline-flex items-center px-3 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回
              </Link>
              <h1 className="text-xl font-bold text-gray-900">
                情报简报
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                论文 #{paperId}
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <IntelligenceBriefViewer
          paperId={paperId}
          className="animate-in fade-in duration-300"
        />
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t-2 border-newspaper-border bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <p>© 2026 Paper Detective - Sprint 4 Execution</p>
            <div className="flex items-center gap-4">
              <Link href="/" className="hover:text-gray-900">
                主页
              </Link>
              <Link href="/brief/[paperId]" className="hover:text-gray-900">
                简报
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
