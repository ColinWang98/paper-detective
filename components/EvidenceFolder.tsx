'use client';

import React, { useState } from 'react';

import { ChevronDown, ChevronRight, FolderOpen, Plus } from 'lucide-react';

interface EvidenceFolderProps {
  id: string;
  name: string;
  itemCount: number;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

export default function EvidenceFolder({
  id: _id,
  name,
  itemCount,
  children,
  defaultExpanded = true,
}: EvidenceFolderProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="bg-white border-2 border-newspaper-border rounded-lg overflow-hidden shadow-card">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full bg-newspaper-aged p-3 hover:bg-newspaper-border transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-newspaper-accent" />
            <h3 className="font-bold text-sm text-newspaper-ink">{name}</h3>
            <span className="bg-newspaper-accent text-white text-xs px-2 py-0.5 rounded-full">
              {itemCount}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Handle add item
              }}
              className="p-1 hover:bg-white rounded transition-colors"
            >
              <Plus className="w-3 h-3 text-newspaper-faxed" />
            </button>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-newspaper-faxed" />
            ) : (
              <ChevronRight className="w-4 h-4 text-newspaper-faxed" />
            )}
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="p-3 min-h-[60px] border-t border-newspaper-border bg-newspaper-cream/50">
          {children}
        </div>
      )}
    </div>
  );
}
