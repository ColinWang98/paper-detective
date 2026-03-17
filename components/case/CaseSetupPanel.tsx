'use client';

import type { CaseSetup } from '@/types';

interface CaseSetupPanelProps {
  caseSetup: CaseSetup | null;
  onBeginInvestigation: () => void;
}

export function CaseSetupPanel({ caseSetup, onBeginInvestigation }: CaseSetupPanelProps) {
  return (
    <div className="flex h-full flex-col justify-between bg-newspaper-cream p-6 text-newspaper-ink">
      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-newspaper-faded">
            Case Setup
          </p>
          <h2 className="mt-2 text-2xl font-bold">
            {caseSetup?.caseTitle ?? 'Preparing investigation setup'}
          </h2>
        </div>

        <p className="text-sm leading-6 text-newspaper-faded">
          {caseSetup?.caseBackground ?? 'The system is preparing a structure map and investigation tasks for this paper.'}
        </p>

        {caseSetup ? (
          <div className="space-y-3 text-sm leading-6">
            <p>
              <span className="font-semibold">Core dispute:</span> {caseSetup.coreDispute}
            </p>
            <p>
              <span className="font-semibold">Opening judgment:</span> {caseSetup.openingJudgment}
            </p>
            <p>
              <span className="font-semibold">Investigation goal:</span> {caseSetup.investigationGoal}
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-6">
        <button
          type="button"
          onClick={onBeginInvestigation}
          className="rounded-md bg-newspaper-ink px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!caseSetup}
        >
          Begin Investigation
        </button>
      </div>
    </div>
  );
}
