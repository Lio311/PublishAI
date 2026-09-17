import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SubmissionDashboard from '@/components/SubmissionDashboard';
import ReviewResponseInterface from '@/components/ReviewResponseInterface';

const MOCK_SUBMISSIONS = [
  {
    id: "1",
    paperId: "p1",
    title: "Deep Learning for Genomic Variant Interpretation: A Multi-Omics Perspective",
    journalName: "Nature Methods",
    status: "under_review" as any,
    publishMode: "review" as any,
    submittedAt: "2026-08-15T09:00:00Z",
    updatedAt: "2026-09-02T14:30:00Z",
    articleType: "Research Article",
    authors: ["Jane Doe", "John Smith"],
    commentsCount: 3,
    unresolvedCommentsCount: 3
  },
  {
    id: "2",
    paperId: "p2",
    title: "Zero-Shot Protein Structure Alignment Using Hyperbolic Geometric Transformers",
    journalName: "Cell Systems",
    status: "revision_required" as any,
    publishMode: "review" as any,
    submittedAt: "2026-06-20T11:00:00Z",
    updatedAt: "2026-09-10T16:45:00Z",
    articleType: "Method",
    authors: ["Alice Johnson", "Bob Lee"],
    commentsCount: 12,
    unresolvedCommentsCount: 5
  },
  {
    id: "3",
    paperId: "p3",
    title: "Automated Evidence Synthesis in Systematic Reviews via LLM Debate Protocols",
    journalName: "JAMA Network Open",
    status: "submitted" as any,
    publishMode: "publish" as any,
    submittedAt: "2026-09-12T08:15:00Z",
    updatedAt: "2026-09-12T08:15:00Z",
    articleType: "Review",
    authors: ["Carol Williams"]
  }
];

const MOCK_COMMENTS = [
  {
    id: "c1",
    reviewerId: "Reviewer 1",
    rawText: "The authors claim that their hyperbolic embedding preserves phylogenetic distance better than Euclidean baselines, but the supplementary figures do not clearly show the ablation study comparing dimensions. Please provide a more detailed comparison in a new Supplementary Figure 4.",
    category: "Methodology",
    severity: "Major",
    status: "unresolved" as any,
    authorResponse: "",
    suggestedEdits: "Consider adding a t-SNE or UMAP visualization of the embedding space in the supplement, explicitly comparing Euclidean vs. Hyperbolic distances across the 5 benchmark families."
  }
];

describe('SubmissionDashboard Component', () => {
  it('renders default submissions and metric cards properly', () => {
    render(<SubmissionDashboard locale="en" submissions={MOCK_SUBMISSIONS} />);

    expect(screen.getByText('Journal Submissions Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Total Submissions')).toBeInTheDocument();
    expect(screen.getByText('Under Peer Review')).toBeInTheDocument();
    expect(screen.getByText('Revisions Requested')).toBeInTheDocument();

    expect(
      screen.getByText('Deep Learning for Genomic Variant Interpretation: A Multi-Omics Perspective')
    ).toBeInTheDocument();
  });

  it('filters submissions by search query', () => {
    render(<SubmissionDashboard locale="en" submissions={MOCK_SUBMISSIONS} />);

    const searchInput = screen.getByPlaceholderText('Search title, journal, ID...');
    fireEvent.change(searchInput, { target: { value: 'Cell Systems' } });

    expect(
      screen.getByText('Zero-Shot Protein Structure Alignment Using Hyperbolic Geometric Transformers')
    ).toBeInTheDocument();

    expect(
      screen.queryByText('Automated Evidence Synthesis in Systematic Reviews via LLM Debate Protocols')
    ).not.toBeInTheDocument();
  });

  it('triggers onNavigateToReviews when clicking rebuttal CTA', () => {
    const handleNavigate = jest.fn();
    render(<SubmissionDashboard locale="en" submissions={MOCK_SUBMISSIONS} onNavigateToReviews={handleNavigate} />);

    const rebuttalBtn = screen.getByText(/Draft Rebuttal Responses/i);
    fireEvent.click(rebuttalBtn);

    expect(handleNavigate).toHaveBeenCalled();
  });
});

describe('ReviewResponseInterface Component', () => {
  it('renders reviewer comments and rebuttal editor', () => {
    render(<ReviewResponseInterface locale="en" comments={MOCK_COMMENTS} />);

    expect(screen.getByText('Reviewer Rebuttal Manager')).toBeInTheDocument();
    expect(screen.getByText('Rebuttal Resolution Progress')).toBeInTheDocument();
    expect(screen.getByText('Export Response Letter')).toBeInTheDocument();

    expect(
      screen.getByText(/The authors claim that their hyperbolic embedding preserves phylogenetic distance/i)
    ).toBeInTheDocument();
  });

  it('allows toggling resolution status of a comment', () => {
    const handleToggle = jest.fn();
    render(<ReviewResponseInterface locale="en" comments={MOCK_COMMENTS} onToggleResolve={handleToggle} />);

    const markResolvedButtons = screen.getAllByText('Mark Resolved');
    expect(markResolvedButtons.length).toBeGreaterThan(0);

    fireEvent.click(markResolvedButtons[0]);
    expect(handleToggle).toHaveBeenCalled();
  });

  it('updates author rebuttal response text', () => {
    render(<ReviewResponseInterface locale="en" comments={MOCK_COMMENTS} />);

    const textareas = screen.getAllByPlaceholderText(
      'Draft your evidence-based point-by-point response to this reviewer comment...'
    );
    expect(textareas.length).toBeGreaterThan(0);

    fireEvent.change(textareas[0], { target: { value: 'Custom author response text here.' } });
    expect(textareas[0]).toHaveValue('Custom author response text here.');
  });
});
