import { render, screen } from '@testing-library/react';

import { DoctorPanel } from '@/components/case/DoctorPanel';
import type { DoctorState, QuestionNode } from '@/types';

describe('DoctorPanel', () => {
  const questionNodes: QuestionNode[] = [
    {
      id: 'claim-q1',
      paperId: 1,
      title: 'What is the core claim?',
      prompt: 'Lock the exact central claim.',
      type: 'claim',
      status: 'open',
      parentQuestionId: null,
      dependsOnQuestionIds: [],
      assignedEvidenceIds: [],
      position: { x: 120, y: 120 },
    },
  ];

  it('renders doctor mode, message, and active question focus', () => {
    const doctorState: DoctorState = {
      paperId: 1,
      activeQuestionId: 'claim-q1',
      mode: 'checking',
      message: 'The claim is identified, but support is still incomplete.',
      updatedAt: '2026-03-26T00:00:00.000Z',
    };

    render(<DoctorPanel doctorState={doctorState} questionNodes={questionNodes} />);

    const panel = screen.getByRole('heading', { name: 'Bird-Head Doctor' }).closest('section');
    expect(panel).toBeInTheDocument();
    expect(panel).toHaveTextContent('Checking');
    expect(panel).toHaveTextContent('The claim is identified, but support is still incomplete.');
    expect(panel).toHaveTextContent('What is the core claim?');
  });

  it('renders an idle prompt when no doctor state exists yet', () => {
    render(<DoctorPanel doctorState={null} questionNodes={questionNodes} />);

    const panel = screen.getByRole('heading', { name: 'Bird-Head Doctor' }).closest('section');
    expect(panel).toBeInTheDocument();
    expect(panel).toHaveTextContent('Awaiting diagnosis');
    expect(panel).toHaveTextContent('Generate a case setup to start the investigation diagnosis.');
  });
});
