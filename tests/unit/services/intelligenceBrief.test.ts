import { IntelligenceBriefService, intelligenceBriefService } from '@/services/intelligenceBriefService';

describe('intelligenceBriefService exports', () => {
  it('exports the service class', () => {
    expect(IntelligenceBriefService).toBeDefined();
  });

  it('exports a singleton instance', () => {
    expect(intelligenceBriefService).toBeInstanceOf(IntelligenceBriefService);
  });
});
