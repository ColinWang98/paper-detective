'use client';

import type { PaperStructureNode } from '@/types';

interface StructureTreeProps {
  nodes: PaperStructureNode[];
}

export function StructureTree({ nodes }: StructureTreeProps) {
  return (
    <section className="space-y-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-newspaper-faded">
          Paper Structure
        </p>
      </div>
      <div className="space-y-3">
        {nodes.map((node) => (
          <article key={node.id} className="rounded-lg border border-newspaper-border bg-white p-4">
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-base font-semibold text-newspaper-ink">{node.title}</h3>
                <span className="text-xs uppercase tracking-wide text-newspaper-faded">
                  Status: {node.status}
                </span>
              </div>
              <p className="text-sm text-newspaper-faded">{node.summary}</p>
              <p className="text-xs text-newspaper-faded">Kind: {node.kind}</p>
              <p className="text-xs text-newspaper-faded">Pages: {node.pageHints.join(', ')}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
