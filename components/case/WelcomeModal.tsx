'use client';

import { useEffect, useState } from 'react';

import { Modal } from '@/components/Modal';

interface WelcomeModalProps {
  isOpen: boolean;
  defaultName?: string;
  onConfirm: (playerName: string) => void;
}

export function WelcomeModal({ isOpen, defaultName = '', onConfirm }: WelcomeModalProps) {
  const [playerName, setPlayerName] = useState(defaultName);

  useEffect(() => {
    if (isOpen) {
      setPlayerName(defaultName);
    }
  }, [defaultName, isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      title="Welcome, Detective"
      confirmLabel="Start Briefing"
      cancelLabel=""
      onConfirm={() => onConfirm(playerName.trim() || 'Detective')}
    >
      <div className="space-y-4 text-sm text-gray-700">
        <p>
          You are an academic detective. Every paper is a case file, and every claim needs evidence.
        </p>
        <p>
          Your job is to collect clues, test arguments, and decide whether the paper truly holds up.
        </p>
        <label className="block">
          <span className="mb-1 block font-medium text-gray-900">Player name</span>
          <input
            value={playerName}
            onChange={(event) => setPlayerName(event.target.value)}
            placeholder="Enter your detective name"
            className="w-full rounded border border-gray-300 px-3 py-2"
          />
        </label>
      </div>
    </Modal>
  );
}
