import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import DocumentEditor from '../DocumentEditor';

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('DocumentEditor Component', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('renders editor with title and content textarea', () => {
    render(<DocumentEditor initialTitle="My Paper" initialContent={`# Abstract\nThis is a test abstract.`} />);
    const titleInput = screen.getByLabelText('Document Title');
    const contentTextarea = screen.getByLabelText('Document Content');

    expect(titleInput).toHaveValue('My Paper');
    expect(contentTextarea).toHaveValue(`# Abstract\nThis is a test abstract.`);
  });

  it('synchronizes content when initialContent prop updates', () => {
    const { rerender } = render(<DocumentEditor initialContent="Initial text" />);
    const textarea = screen.getByLabelText('Document Content');
    expect(textarea).toHaveValue('Initial text');

    rerender(<DocumentEditor initialContent="Updated text from server" />);
    expect(textarea).toHaveValue('Updated text from server');
  });

  it('synchronizes title when initialTitle prop updates', () => {
    const { rerender } = render(<DocumentEditor initialTitle="Old Title" />);
    const input = screen.getByLabelText('Document Title');
    expect(input).toHaveValue('Old Title');

    rerender(<DocumentEditor initialTitle="New Title" />);
    expect(input).toHaveValue('New Title');
  });

  it('computes dynamic word counts and sections from markdown headings', () => {
    const markdown = `# Abstract\nFirst section content.\n\n# 1. Introduction\nSecond section longer content with more words.`;
    render(<DocumentEditor initialContent={markdown} />);

    // Abstract should show 3w
    expect(screen.getByText('Abstract')).toBeInTheDocument();
    expect(screen.getByText('3w')).toBeInTheDocument();

    // 1. Introduction should show 7w
    expect(screen.getByText('1. Introduction')).toBeInTheDocument();
    expect(screen.getByText('7w')).toBeInTheDocument();
  });

  it('handles manual save and calls onSave callback upon successful API response', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        document: { id: "00000000-0000-0000-0000-000000000001" },
      }),
    });

    const handleSave = jest.fn();
    render(
      <DocumentEditor
        documentId="00000000-0000-0000-0000-000000000001"
        initialTitle="Paper Title"
        initialContent="Paper content"
        onSave={handleSave}
      />
    );

    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(handleSave).toHaveBeenCalledWith("Paper content", "Paper Title");
    });
  });

  it('handles save errors gracefully without unhandled rejection', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: "Database unavailable" }),
    });

    render(
      <DocumentEditor
        documentId="00000000-0000-0000-0000-000000000001"
        initialTitle="Paper Title"
        initialContent="Paper content"
      />
    );

    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/unsaved/i)).toBeInTheDocument();
    });
  });

  it('cleans up autosave timer on unmount', () => {
    jest.useFakeTimers();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    const { unmount } = render(
      <DocumentEditor documentId="doc-new" initialContent="Some text" />
    );

    const textarea = screen.getByLabelText('Document Content');
    fireEvent.change(textarea, { target: { value: "Changed text" } });

    unmount();

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(global.fetch).not.toHaveBeenCalled();
    jest.useRealTimers();
  });
});
