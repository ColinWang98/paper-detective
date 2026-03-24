// Dexie.js database configuration for Paper Detective
import Dexie, { Table } from 'dexie';

import type {
  AIAnalysis,
  AIClueCard,
  CaseSetup,
  DeductionGraph,
  EvidenceRelationship,
  EvidenceSubmission,
  Group,
  GroupHighlight,
  Highlight,
  IntelligenceBrief,
  Paper,
} from '@/types';

export class PaperDetectiveDB extends Dexie {
  papers!: Table<Paper>;
  highlights!: Table<Highlight>;
  groups!: Table<Group>;
  groupHighlights!: Table<GroupHighlight>;
  aiAnalysis!: Table<AIAnalysis>;
  aiClueCards!: Table<AIClueCard>;
  intelligenceBriefs!: Table<IntelligenceBrief>;
  caseSetups!: Table<CaseSetup>;
  evidenceSubmissions!: Table<EvidenceSubmission>;
  evidenceRelationships!: Table<EvidenceRelationship>;
  deductionGraphs!: Table<DeductionGraph>;

  constructor() {
    super('PaperDetectiveDB');

    // Version 1: Initial schema
    this.version(1).stores({
      // Papers store - metadata for uploaded PDFs
      papers: '++id, title, author, uploadDate, pdfHash',

      // Highlights store - user highlights on PDF pages
      highlights: '++id, paperId, pageNumber, priority, color, createdAt',

      // Groups store - notebook folders including inbox
      groups: '++id, paperId, name, type, position, isSystem',

      // GroupHighlights store - many-to-many relationship
      groupHighlights: '++id, groupId, highlightId, position',

      // AIAnalysis store - cached AI analysis results
      aiAnalysis: '++id, paperId, createdAt, model',
    });

    // Version 2: Add AI Clue Cards (Story 2.2.1)
    this.version(2).stores({
      aiClueCards: '++id, paperId, type, confidence, createdAt',
    });

    // Version 3: Add Intelligence Briefs (Story 2.2.2)
    this.version(3).stores({
      intelligenceBriefs: '++id, paperId, generatedAt, model',
    });

    // Version 4: Add case investigation persistence
    this.version(4).stores({
      caseSetups: '++id, paperId, generatedAt, model, source',
      evidenceSubmissions: '++id, paperId, taskId, highlightId, evidenceType, createdAt',
    });

    // Version 5: Add missing compound index for groups inbox lookup
    this.version(5).stores({
      groups: '++id, paperId, name, type, [paperId+type], position, isSystem',
    });

    // Version 6: Add evidence relationship graph persistence
    this.version(6).stores({
      evidenceRelationships:
        '++id, paperId, taskId, fromSubmissionId, toSubmissionId, relationshipType, createdAt',
    });

    // Version 7: Persist React Flow graph nodes + edges by task
    this.version(7).stores({
      deductionGraphs: '++id, paperId, taskId, [paperId+taskId], updatedAt',
    });
  }
}

// Create database instance
export const db = new PaperDetectiveDB();

// Initialize default data
export async function initializeDatabase(): Promise<void> {
  try {
    await db.open();
    console.log('✅ Database initialized successfully');

    // Ensure every paper has an inbox group
    const papers = await db.papers.toArray();
    for (const paper of papers) {
      const existingInbox = await db.groups
        .where('[paperId+type]')
        .equals([paper.id!, 'inbox'])
        .first();

      if (!existingInbox) {
        await db.groups.add({
          paperId: paper.id!,
          name: '📥 收集箱',
          type: 'inbox',
          isSystem: true,
          position: 0,
          createdAt: new Date().toISOString(),
        });
        console.log(`✅ Created inbox for paper: ${paper.title}`);
      }
    }
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    throw error;
  }
}

// Helper functions for common operations
export const dbHelpers = {
  // Paper operations
  async addPaper(file: File): Promise<number> {
    const hash = await generateFileHash(file);
    const fileURL = URL.createObjectURL(file);
    const paper = {
      title: file.name,
      authors: [],
      year: new Date().getFullYear(),
      uploadDate: new Date().toISOString(),
      pdfHash: hash,
      fileSize: file.size,
      fileURL,
      fileName: file.name,
    } as Paper;

    const paperId = await db.papers.add(paper);

    // Create default inbox for this paper (HCI requirement)
    await db.groups.add({
      paperId,
      name: '📥 收集箱',
      type: 'inbox',
      isSystem: true,
      position: 0,
      createdAt: new Date().toISOString(),
    });

    return paperId;
  },

  async getPaper(id: number): Promise<Paper | undefined> {
    return await db.papers.get(id);
  },

  async getAllPapers(): Promise<Paper[]> {
    return await db.papers.toArray();
  },

  async deletePaper(id: number): Promise<void> {
    await db.transaction(
      'rw',
      [
        db.papers,
        db.highlights,
        db.groups,
        db.groupHighlights,
        db.aiAnalysis,
        db.aiClueCards,
        db.intelligenceBriefs,
        db.caseSetups,
        db.evidenceSubmissions,
        db.evidenceRelationships,
        db.deductionGraphs,
      ],
      async () => {
      // Delete all highlights for this paper
      const highlights = await db.highlights.where('paperId').equals(id).toArray();
      await db.highlights.bulkDelete(highlights.map(h => h.id!));

      // Delete all groups for this paper
      const groups = await db.groups.where('paperId').equals(id).toArray();
      await db.groups.bulkDelete(groups.map(g => g.id!));

      // Delete group highlights
      const groupHighlights = await db.groupHighlights
        .where('groupId')
        .anyOf(groups.map(g => g.id!))
        .toArray();
      await db.groupHighlights.bulkDelete(groupHighlights.map(gh => gh.id!));

      // Delete AI analysis
      const analyses = await db.aiAnalysis.where('paperId').equals(id).toArray();
      await db.aiAnalysis.bulkDelete(analyses.map(a => a.id!));

      // Delete AI clue cards
      const clueCards = await db.aiClueCards.where('paperId').equals(id).toArray();
      await db.aiClueCards.bulkDelete(clueCards.map(card => card.id!));

      // Delete intelligence briefs
      const briefs = await db.intelligenceBriefs.where('paperId').equals(id).toArray();
      await db.intelligenceBriefs.bulkDelete(briefs.map(brief => brief.id!));

      // Delete case setups
      const caseSetups = await db.caseSetups.where('paperId').equals(id).toArray();
      await db.caseSetups.bulkDelete(caseSetups.map(setup => setup.id!));

      // Delete evidence submissions
      const evidenceSubmissions = await db.evidenceSubmissions.where('paperId').equals(id).toArray();
      await db.evidenceSubmissions.bulkDelete(evidenceSubmissions.map(submission => submission.id!));

      // Delete evidence relationships
      const evidenceRelationships = await db.evidenceRelationships.where('paperId').equals(id).toArray();
      await db.evidenceRelationships.bulkDelete(evidenceRelationships.map((relationship) => relationship.id!));

      // Delete deduction graphs
      const deductionGraphs = await db.deductionGraphs.where('paperId').equals(id).toArray();
      await db.deductionGraphs.bulkDelete(deductionGraphs.map((graph) => graph.id!));

      // Finally delete the paper
      await db.papers.delete(id);
      }
    );
  },

  // Highlight operations
  async addHighlight(highlight: Omit<Highlight, 'id'>): Promise<number> {
    const id = await db.highlights.add(highlight);

    // Automatically add to inbox (HCI requirement: two-stage workflow)
    if (highlight.paperId) {
      const inbox = await db.groups
        .where('[paperId+type]')
        .equals([highlight.paperId, 'inbox'])
        .first();

      if (inbox) {
        await db.groupHighlights.add({
          groupId: inbox.id!,
          highlightId: id,
          position: Date.now(),
          addedAt: new Date().toISOString(),
        });
      }
    }

    return id;
  },

  async getHighlights(paperId: number): Promise<Highlight[]> {
    return await db.highlights.where('paperId').equals(paperId).toArray();
  },

  async updateHighlight(id: number, changes: Partial<Highlight>): Promise<number> {
    return await db.highlights.update(id, changes);
  },

  async deleteHighlight(id: number): Promise<void> {
    await db.highlights.delete(id);
  },

  // Group operations
  async addGroup(group: Group): Promise<number> {
    return await db.groups.add(group);
  },

  async getGroups(paperId: number): Promise<Group[]> {
    return await db.groups.where('paperId').equals(paperId).toArray();
  },

  async updateGroup(id: number, changes: Partial<Group>): Promise<number> {
    return await db.groups.update(id, changes);
  },

  async deleteGroup(id: number): Promise<void> {
    // Prevent deleting system groups (HCI requirement)
    const group = await db.groups.get(id);
    if (group?.isSystem) {
      throw new Error('Cannot delete system group (inbox)');
    }

    await db.transaction('rw', [db.groups, db.groupHighlights], async () => {
      // Remove all highlight associations
      await db.groupHighlights.where('groupId').equals(id).delete();
      await db.groups.delete(id);
    });
  },

  async moveHighlightToGroup(highlightId: number, toGroupId: number): Promise<void> {
    await db.transaction('rw', [db.groupHighlights], async () => {
      // Remove from all groups
      await db.groupHighlights.where('highlightId').equals(highlightId).delete();

      // Add to target group
      await db.groupHighlights.add({
        groupId: toGroupId,
        highlightId,
        position: Date.now(),
        addedAt: new Date().toISOString(),
      });
    });
  },

  async getGroupHighlights(groupId: number): Promise<Highlight[]> {
    const associations = await db.groupHighlights
      .where('groupId')
      .equals(groupId)
      .toArray();

    const highlights: Highlight[] = [];
    for (const assoc of associations) {
      const highlight = await db.highlights.get(assoc.highlightId);
      if (highlight) {
        highlights.push(highlight);
      }
    }

    return highlights;
  },

  async getGroupsWithHighlights(paperId: number): Promise<Group[]> {
    // Query 1: Get all groups for this paper
    const groups = await db.groups.where('paperId').equals(paperId).toArray();

    if (groups.length === 0) {
      return groups;
    }

    // Query 2: Batch fetch all group-highlight associations (O(1) instead of O(N))
    const groupIds = groups.map(g => g.id!);
    const allAssociations = await db.groupHighlights
      .where('groupId')
      .anyOf(groupIds)
      .toArray();

    if (allAssociations.length === 0) {
      // No highlights, return groups with empty items
      groups.forEach(group => group.items = []);
      return groups;
    }

    // Query 3: Batch fetch all highlights (O(1) instead of O(N))
    const highlightIds = [...new Set(allAssociations.map(a => a.highlightId))];
    const allHighlights = await db.highlights
      .where('id')
      .anyOf(highlightIds)
      .toArray();

    // Build a map for O(1) highlight lookup
    const highlightMap = new Map(allHighlights.map(h => [h.id, h]));

    // Attach highlights to groups in memory
    groups.forEach(group => {
      const associations = allAssociations.filter(a => a.groupId === group.id);
      group.items = associations
        .map(a => highlightMap.get(a.highlightId))
        .filter((h): h is Highlight => h !== undefined);
    });

    return groups;
  },

  // AI Analysis operations
  async saveAIAnalysis(analysis: AIAnalysis): Promise<number> {
    return await db.aiAnalysis.add(analysis);
  },

  async getAIAnalysis(paperId: number): Promise<AIAnalysis | undefined> {
    return await db.aiAnalysis.where('paperId').equals(paperId).first();
  },

  // AI Clue Cards operations (Story 2.2.1)
  async addClueCard(clueCard: Omit<AIClueCard, 'id'>): Promise<number> {
    return await db.aiClueCards.add(clueCard as AIClueCard);
  },

  async getClueCards(paperId: number): Promise<AIClueCard[]> {
    return await db.aiClueCards.where('paperId').equals(paperId).toArray();
  },

  async getClueCard(id: number): Promise<AIClueCard | undefined> {
    return await db.aiClueCards.get(id);
  },

  async updateClueCard(id: number, changes: Partial<AIClueCard>): Promise<number> {
    return await db.aiClueCards.update(id, changes);
  },

  async deleteClueCard(id: number): Promise<void> {
    await db.aiClueCards.delete(id);
  },

  async deleteClueCardsByPaper(paperId: number): Promise<void> {
    await db.aiClueCards.where('paperId').equals(paperId).delete();
  },

  // Intelligence Brief operations (Story 2.2.2)
  async addIntelligenceBrief(brief: IntelligenceBrief): Promise<number> {
    return await db.intelligenceBriefs.add(brief);
  },

  async getIntelligenceBrief(paperId: number): Promise<IntelligenceBrief | undefined> {
    return await db.intelligenceBriefs.where('paperId').equals(paperId).first();
  },

  async getAllIntelligenceBriefs(): Promise<IntelligenceBrief[]> {
    return await db.intelligenceBriefs.toArray();
  },

  async updateIntelligenceBrief(id: number, changes: Partial<IntelligenceBrief>): Promise<number> {
    return await db.intelligenceBriefs.update(id, changes);
  },

  async deleteIntelligenceBrief(id: number): Promise<void> {
    await db.intelligenceBriefs.delete(id);
  },

  async deleteIntelligenceBriefByPaper(paperId: number): Promise<void> {
    await db.intelligenceBriefs.where('paperId').equals(paperId).delete();
  },

  // Case setup operations
  async saveCaseSetup(caseSetup: CaseSetup): Promise<number> {
    await db.caseSetups.where('paperId').equals(caseSetup.paperId).delete();
    return await db.caseSetups.add(caseSetup);
  },

  async getCaseSetup(paperId: number): Promise<CaseSetup | undefined> {
    return await db.caseSetups.where('paperId').equals(paperId).first();
  },

  async deleteCaseSetupByPaper(paperId: number): Promise<void> {
    await db.caseSetups.where('paperId').equals(paperId).delete();
  },

  // Evidence submission operations
  async addEvidenceSubmission(submission: Omit<EvidenceSubmission, 'id'> | EvidenceSubmission): Promise<number> {
    return await db.evidenceSubmissions.add(submission as EvidenceSubmission);
  },

  async getEvidenceSubmissions(paperId: number): Promise<EvidenceSubmission[]> {
    return await db.evidenceSubmissions
      .where('paperId')
      .equals(paperId)
      .sortBy('createdAt');
  },

  async updateEvidenceSubmission(id: number, changes: Partial<EvidenceSubmission>): Promise<number> {
    return await db.evidenceSubmissions.update(id, changes);
  },

  async deleteEvidenceSubmission(id: number): Promise<void> {
    await db.evidenceSubmissions.delete(id);
  },

  async deleteEvidenceSubmissionsByPaper(paperId: number): Promise<void> {
    await db.evidenceSubmissions.where('paperId').equals(paperId).delete();
  },

  // Evidence relationship operations
  async addEvidenceRelationship(
    relationship: Omit<EvidenceRelationship, 'id'> | EvidenceRelationship
  ): Promise<number> {
    return await db.evidenceRelationships.add(relationship as EvidenceRelationship);
  },

  async getEvidenceRelationships(paperId: number): Promise<EvidenceRelationship[]> {
    return await db.evidenceRelationships.where('paperId').equals(paperId).sortBy('createdAt');
  },

  async deleteEvidenceRelationship(id: number): Promise<void> {
    await db.evidenceRelationships.delete(id);
  },

  async deleteEvidenceRelationshipsByPaper(paperId: number): Promise<void> {
    await db.evidenceRelationships.where('paperId').equals(paperId).delete();
  },

  async saveDeductionGraph(graph: DeductionGraph): Promise<number> {
    const existing = await db.deductionGraphs.where('[paperId+taskId]').equals([graph.paperId, graph.taskId]).first();
    const payload = {
      ...graph,
      updatedAt: new Date().toISOString(),
    };

    if (existing?.id) {
      await db.deductionGraphs.update(existing.id, payload);
      return existing.id;
    }

    return await db.deductionGraphs.add(payload);
  },

  async getDeductionGraphs(paperId: number): Promise<DeductionGraph[]> {
    return await db.deductionGraphs.where('paperId').equals(paperId).toArray();
  },

  async getDeductionGraph(paperId: number, taskId: string): Promise<DeductionGraph | undefined> {
    return await db.deductionGraphs.where('[paperId+taskId]').equals([paperId, taskId]).first();
  },

  async deleteDeductionGraph(id: number): Promise<void> {
    await db.deductionGraphs.delete(id);
  },

  async deleteDeductionGraphsByPaper(paperId: number): Promise<void> {
    await db.deductionGraphs.where('paperId').equals(paperId).delete();
  },

  // Reorder highlights within a group
  async reorderHighlightsInGroup(groupId: number, activeHighlightId: number, overHighlightId: number): Promise<void> {
    await db.transaction('rw', [db.groupHighlights], async () => {
      // Get the associations for this group
      const associations = await db.groupHighlights
        .where('groupId')
        .equals(groupId)
        .toArray();

      const activeAssoc = associations.find(a => a.highlightId === activeHighlightId);
      const overAssoc = associations.find(a => a.highlightId === overHighlightId);

      if (!activeAssoc || !overAssoc) return;

      // Swap positions
      const tempPosition = activeAssoc.position;
      activeAssoc.position = overAssoc.position;
      overAssoc.position = tempPosition;

      // Update in database
      await db.groupHighlights.update(activeAssoc.id!, { position: activeAssoc.position });
      await db.groupHighlights.update(overAssoc.id!, { position: overAssoc.position });
    });
  },
};

// Utility: Generate file hash
async function generateFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
