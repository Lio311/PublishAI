import { SubmissionStatusService, STATUS_METADATA } from '../src/services/submission';

jest.mock('@/services/db', () => ({
  db: {
    insert: jest.fn().mockReturnValue({
      values: jest.fn().mockResolvedValue([]),
    }),
    update: jest.fn().mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([]),
      }),
    }),
    query: {
      submissions: {
        findFirst: jest.fn().mockResolvedValue({
          id: 101,
          paperId: 42,
          submittedTitle: "Deep Learning for Genomic Sequences",
          status: "under_review",
          submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          confirmationId: "MANUSCRIPT-2026-001",
          connection: {
            displayName: "Nature Biotechnology",
            platform: "ojs",
          },
        }),
      },
    },
  },
}));

describe('SubmissionStatusService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isValidTransition', () => {
    it('allows valid state transitions', () => {
      expect(SubmissionStatusService.isValidTransition('draft', 'submitted')).toBe(true);
      expect(SubmissionStatusService.isValidTransition('submitted', 'under_review')).toBe(true);
      expect(SubmissionStatusService.isValidTransition('under_review', 'revision_requested')).toBe(true);
      expect(SubmissionStatusService.isValidTransition('revision_requested', 'revised_submitted')).toBe(true);
      expect(SubmissionStatusService.isValidTransition('accepted', 'in_proofs')).toBe(true);
      expect(SubmissionStatusService.isValidTransition('in_proofs', 'published')).toBe(true);
    });

    it('rejects invalid state transitions', () => {
      expect(SubmissionStatusService.isValidTransition('draft', 'published')).toBe(false);
      expect(SubmissionStatusService.isValidTransition('published', 'under_review')).toBe(false);
      expect(SubmissionStatusService.isValidTransition('under_review', 'draft')).toBe(false);
    });
  });

  describe('getAvailableTransitions', () => {
    it('returns valid target statuses for submitted', () => {
      const transitions = SubmissionStatusService.getAvailableTransitions('submitted');
      expect(transitions).toContain('with_editor');
      expect(transitions).toContain('under_review');
      expect(transitions).toContain('rejected');
      expect(transitions).toContain('withdrawn');
    });
  });

  describe('getStatusMetadata', () => {
    it('returns appropriate metadata for status', () => {
      const meta = SubmissionStatusService.getStatusMetadata('revision_requested');
      expect(meta.requiresAuthorAction).toBe(true);
      expect(meta.isTerminal).toBe(false);
      expect(meta.badgeVariant).toBe('warning');

      const pubMeta = SubmissionStatusService.getStatusMetadata('published');
      expect(pubMeta.isTerminal).toBe(true);
      expect(pubMeta.requiresAuthorAction).toBe(false);
    });
  });

  describe('calculateDays', () => {
    it('calculates difference between dates in days', () => {
      const past = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      const days = SubmissionStatusService.calculateDays(past);
      expect(days).toBe(3);
    });
  });

  describe('transitionStatus', () => {
    it('transitions status successfully for valid transition', async () => {
      const result = await SubmissionStatusService.transitionStatus(101, 'reviews_received', {
        actor: 'editor',
        notes: 'Assigned reviewers',
      });
      expect(result.success).toBe(true);
    });

    it('disallows invalid status transition unless forced', async () => {
      const result = await SubmissionStatusService.transitionStatus(101, 'published', {
        force: false,
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid status transition');
    });
  });

  describe('recordReviewDecision', () => {
    it('records review decision and transitions to revision_requested', async () => {
      await SubmissionStatusService.recordReviewDecision(101, {
        round: 1,
        decision: 'minor_revision',
        editorComments: 'Please address reviewer 1 comments.',
      });

      const summary = await SubmissionStatusService.getTrackingSummary(101);
      expect(summary.currentStatus).toBe('revision_requested');
      expect(summary.latestFeedback?.decision).toBe('minor_revision');
    });
  });

  describe('getTrackingSummary', () => {
    it('returns tracking summary for a submission', async () => {
      const summary = await SubmissionStatusService.getTrackingSummary(101);
      expect(summary.submissionId).toBe(101);
      expect(summary.paperTitle).toBe('Deep Learning for Genomic Sequences');
      expect(summary.journal.journalName).toBe('Nature Biotechnology');
      expect(summary.nextStep?.description).toBeDefined();
    });
  });
});
