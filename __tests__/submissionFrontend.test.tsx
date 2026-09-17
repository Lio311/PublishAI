import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SubmissionDashboard, { DEFAULT_SUBMISSIONS } from '@/components/SubmissionDashboard';
import ReviewResponseInterface, { DEFAULT_REVIEW_COMMENTS } from '@/components/ReviewResponseInterface';

describe('SubmissionDashboard Component', () => {
  it('renders default submissions and metric cards properly', () => {
    render(<SubmissionDashboard locale="en" />);

    expect(screen.getByText('Journal Submissions Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Total Submissions')).toBeInTheDocument();
    expect(screen.getByText('Under Peer Review')).toBeInTheDocument();
    expect(screen.getByText('Revisions Requested')).toBeInTheDocument();

    // Check one of the paper titles
    expect(
      screen.getByText('Deep Learning for Genomic Variant Interpretation: A Multi-Omics Perspective')
    ).toBeInTheDocument();
  });

  it('filters submissions by search query', () => {
    render(<SubmissionDashboard locale="en" />);

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
    render(<SubmissionDashboard locale="en" onNavigateToReviews={handleNavigate} />);

    const rebuttalBtn = screen.getByText('Draft Rebuttal Responses');
    fireEvent.click(rebuttalBtn);

    expect(handleNavigate).toHaveBeenCalled();
  });
});

describe('ReviewResponseInterface Component', () => {
  it('renders reviewer comments and rebuttal editor', () => {
    render(<ReviewResponseInterface locale="en" />);

    expect(screen.getByText('Reviewer Rebuttal Manager')).toBeInTheDocument();
    expect(screen.getByText('Rebuttal Resolution Progress')).toBeInTheDocument();
    expect(screen.getByText('Export Response Letter')).toBeInTheDocument();

    // Reviewer 1 critique snippet
    expect(
      screen.getByText(/The authors claim that their hyperbolic embedding preserves phylogenetic distance/i)
    ).toBeInTheDocument();
  });

  it('allows toggling resolution status of a comment', () => {
    const handleToggle = jest.fn();
    render(<ReviewResponseInterface locale="en" onToggleResolve={handleToggle} />);

    // Find Mark Resolved button
    const markResolvedButtons = screen.getAllByText('Mark Resolved');
    expect(markResolvedButtons.length).toBeGreaterThan(0);

    fireEvent.click(markResolvedButtons[0]);
    expect(handleToggle).toHaveBeenCalled();
  });

  it('updates author rebuttal response text', () => {
    render(<ReviewResponseInterface locale="en" />);

    const textareas = screen.getAllByPlaceholderText(
      'Draft your evidence-based point-by-point response to this reviewer comment...'
    );
    expect(textareas.length).toBeGreaterThan(0);

    fireEvent.change(textareas[0], { target: { value: 'Custom author response text here.' } });
    expect(textareas[0]).toHaveValue('Custom author response text here.');
  });
});
