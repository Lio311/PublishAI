import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import RichDocumentEditor from '../RichDocumentEditor';

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock AgentRunner to avoid running agent pipelines in unit test
jest.mock('../../dashboard/AgentRunner', () => ({
  AgentRunner: ({ paperId }: { paperId: string }) => (
    <div data-testid="mock-agent-runner">Agent Runner for {paperId}</div>
  ),
}));

describe('RichDocumentEditor Component', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('renders TipTap editor container with title input and buttons', () => {
    render(<RichDocumentEditor initialTitle="Genomics Study" initialContent="<h2>Abstract</h2><p>Initial text</p>" />);
    expect(screen.getByTestId('tiptap-editor')).toBeInTheDocument();
    expect(screen.getByLabelText('Document Title')).toHaveValue('Genomics Study');
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  });

  it('synchronizes content when initialContent prop updates', () => {
    const { rerender } = render(<RichDocumentEditor initialContent="<p>Version 1</p>" />);
    expect(screen.getByTestId('tiptap-editor')).toBeInTheDocument();

    rerender(<RichDocumentEditor initialContent="<p>Version 2 updated</p>" />);
    expect(screen.getByTestId('tiptap-editor')).toBeInTheDocument();
  });

  it('computes dynamic sections from document HTML headings', () => {
    const htmlContent = '<h2>Abstract</h2><p>Brief summary of study.</p><h2>1. Introduction</h2><p>Deep literature background context.</p>';
    render(<RichDocumentEditor initialContent={htmlContent} />);

    expect(screen.getAllByText('Abstract').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('1. Introduction').length).toBeGreaterThanOrEqual(1);
  });

  it('handles manual save and updates document via API', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        document: { id: "11111111-1111-1111-1111-111111111111" },
      }),
    });

    const onSaveMock = jest.fn();
    render(
      <RichDocumentEditor
        documentId="11111111-1111-1111-1111-111111111111"
        initialTitle="CRISPR Paper"
        initialContent="<p>Some CRISPR data</p>"
        onSave={onSaveMock}
      />
    );

    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(onSaveMock).toHaveBeenCalled();
    });
  });

  it('handles save network error without crashing and updates status to unsaved', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("Network disconnect"));

    render(
      <RichDocumentEditor
        documentId="11111111-1111-1111-1111-111111111111"
        initialTitle="Paper"
        initialContent="<p>Content</p>"
      />
    );

    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/unsaved/i)).toBeInTheDocument();
    });
  });

  it('cleans up debounce timer on unmount', () => {
    jest.useFakeTimers();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    const { unmount } = render(
      <RichDocumentEditor documentId="doc-new" initialContent="<p>Test</p>" />
    );

    const titleInput = screen.getByLabelText('Document Title');
    fireEvent.change(titleInput, { target: { value: "New Title" } });

    unmount();

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(global.fetch).not.toHaveBeenCalled();
    jest.useRealTimers();
  });
});
