import { dbHelpers, db } from '@/lib/db';
import type { Group, Highlight } from '@/types';

describe('dbHelpers.getGroupsWithHighlights', () => {
  const createGroup = (id: number): Group => ({
    id,
    paperId: 1,
    name: `Group ${id}`,
    type: 'custom',
    position: id,
    isSystem: false,
    createdAt: '2026-02-10T10:00:00Z',
    items: [],
  });

  const createHighlight = (id: number, text: string): Highlight => ({
    id,
    paperId: 1,
    pageNumber: 1,
    text,
    priority: 'important',
    color: 'yellow',
    position: { x: 100, y: 100, width: 200, height: 20 },
    timestamp: '2026-02-10T10:00:00Z',
    createdAt: '2026-02-10T10:00:00Z',
  });

  const createGroupHighlight = (groupId: number, highlightId: number) => ({
    id: groupId * 100 + highlightId,
    groupId,
    highlightId,
    position: Date.now(),
    addedAt: '2026-02-10T10:00:00Z',
  });

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('uses three batched queries and attaches highlights to the correct groups', async () => {
    const groups = [createGroup(1), createGroup(2)];
    const associations = [
      createGroupHighlight(1, 10),
      createGroupHighlight(1, 11),
      createGroupHighlight(2, 20),
    ];
    const highlights = [
      createHighlight(10, 'A1'),
      createHighlight(11, 'A2'),
      createHighlight(20, 'B1'),
    ];

    const groupsToArray = jest.fn().mockResolvedValue(groups);
    const associationToArray = jest.fn().mockResolvedValue(associations);
    const highlightToArray = jest.fn().mockResolvedValue(highlights);

    const groupsWhere = jest.spyOn(db.groups, 'where').mockReturnValue({
      equals: jest.fn().mockReturnValue({ toArray: groupsToArray }),
    } as any);
    const groupHighlightsWhere = jest.spyOn(db.groupHighlights, 'where').mockReturnValue({
      anyOf: jest.fn().mockReturnValue({ toArray: associationToArray }),
    } as any);
    const highlightsWhere = jest.spyOn(db.highlights, 'where').mockReturnValue({
      anyOf: jest.fn().mockReturnValue({ toArray: highlightToArray }),
    } as any);

    const result = await dbHelpers.getGroupsWithHighlights(1);

    expect(groupsWhere).toHaveBeenCalledWith('paperId');
    expect(groupHighlightsWhere).toHaveBeenCalledWith('groupId');
    expect(highlightsWhere).toHaveBeenCalledWith('id');
    expect(result).toHaveLength(2);
    expect(result[0].items?.map((item) => item.text)).toEqual(['A1', 'A2']);
    expect(result[1].items?.map((item) => item.text)).toEqual(['B1']);
  });

  it('deduplicates highlight ids before the highlight batch query', async () => {
    const groups = [createGroup(1), createGroup(2)];
    const associations = [
      createGroupHighlight(1, 100),
      createGroupHighlight(1, 200),
      createGroupHighlight(2, 100),
      createGroupHighlight(2, 300),
    ];

    const highlightAnyOf = jest.fn().mockReturnValue({
      toArray: jest.fn().mockResolvedValue([
        createHighlight(100, 'Shared'),
        createHighlight(200, 'Second'),
        createHighlight(300, 'Third'),
      ]),
    });

    jest.spyOn(db.groups, 'where').mockReturnValue({
      equals: jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue(groups) }),
    } as any);
    jest.spyOn(db.groupHighlights, 'where').mockReturnValue({
      anyOf: jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue(associations) }),
    } as any);
    jest.spyOn(db.highlights, 'where').mockReturnValue({
      anyOf: highlightAnyOf,
    } as any);

    await dbHelpers.getGroupsWithHighlights(1);

    expect(highlightAnyOf).toHaveBeenCalledWith([100, 200, 300]);
  });

  it('returns groups with empty items when there are no associations', async () => {
    const groups = [createGroup(1)];

    jest.spyOn(db.groups, 'where').mockReturnValue({
      equals: jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue(groups) }),
    } as any);
    const groupHighlightsWhere = jest.spyOn(db.groupHighlights, 'where').mockReturnValue({
      anyOf: jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue([]) }),
    } as any);
    const highlightsWhere = jest.spyOn(db.highlights, 'where');

    const result = await dbHelpers.getGroupsWithHighlights(1);

    expect(groupHighlightsWhere).toHaveBeenCalledWith('groupId');
    expect(highlightsWhere).not.toHaveBeenCalled();
    expect(result).toHaveLength(1);
    expect(result[0].items).toEqual([]);
  });

  it('filters out missing highlights from the final group items', async () => {
    const groups = [createGroup(1)];

    jest.spyOn(db.groups, 'where').mockReturnValue({
      equals: jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue(groups) }),
    } as any);
    jest.spyOn(db.groupHighlights, 'where').mockReturnValue({
      anyOf: jest.fn().mockReturnValue({
        toArray: jest.fn().mockResolvedValue([createGroupHighlight(1, 999)]),
      }),
    } as any);
    jest.spyOn(db.highlights, 'where').mockReturnValue({
      anyOf: jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue([]) }),
    } as any);

    const result = await dbHelpers.getGroupsWithHighlights(1);

    expect(result[0].items).toEqual([]);
  });
});
