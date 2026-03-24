'use client';

import { Modal } from '@/components/Modal';

interface TutorialModalProps {
  isOpen: boolean;
  playerName: string;
  onConfirm: () => void;
}

export function TutorialModal({ isOpen, playerName, onConfirm }: TutorialModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      title="Investigation Briefing"
      confirmLabel="Enter Notebook"
      cancelLabel=""
      onConfirm={onConfirm}
    >
      <div className="space-y-4 text-sm text-gray-700">
        <p>Detective {playerName || 'Detective'}, here is how this case works:</p>
        <ol className="list-decimal space-y-2 pl-5">
          <li>Open a question and follow its section hints before collecting evidence.</li>
          <li>Select text from the PDF, clean it up if needed, and save it as a clue.</li>
          <li>Submit evidence to the active question. Some questions only need evidence, others allow an optional judgment.</li>
        </ol>
      </div>
    </Modal>
  );
}
