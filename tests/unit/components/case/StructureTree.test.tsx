import React from 'react';
import { render, screen } from '@testing-library/react';

import { StructureTree } from '@/components/case/StructureTree';
import type { PaperStructureNode } from '@/types';

describe('StructureTree', () => {
  it('renders structure nodes with statuses', () => {
    const nodes: PaperStructureNode[] = [
      {
        id: 'intro-1',
        kind: 'intro',
        title: 'Introduction',
        summary: 'Frames the core problem.',
        pageHints: [1, 2],
        importance: 'critical',
        status: 'investigating',
      },
      {
        id: 'result-1',
        kind: 'result',
        title: 'Results',
        summary: 'Benchmarks support the claim.',
        pageHints: [7],
        importance: 'important',
        status: 'confirmed',
      },
    ];

    render(<StructureTree nodes={nodes} />);

    const introductionCard = screen.getByRole('heading', { name: 'Introduction' }).closest('article');
    const resultsCard = screen.getByRole('heading', { name: 'Results' }).closest('article');

    expect(introductionCard).toHaveTextContent('Status: investigating');
    expect(introductionCard).toHaveTextContent('Pages: 1, 2');
    expect(resultsCard).toHaveTextContent('Status: confirmed');
  });
});
