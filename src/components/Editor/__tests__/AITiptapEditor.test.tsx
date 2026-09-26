import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, act } from '@testing-library/react';
import AITiptapEditor from '../AITiptapEditor';

describe('AITiptapEditor Component', () => {
  it('renders editor container with data-testid', () => {
    const { getByTestId } = render(<AITiptapEditor initialContent="test" />);
    expect(getByTestId('tiptap-editor')).toBeInTheDocument();
  });

  it('renders toolbar buttons when readOnly is false', () => {
    render(<AITiptapEditor initialContent="Sample text" readOnly={false} />);
    expect(screen.getByTitle('Bold')).toBeInTheDocument();
    expect(screen.getByTitle('Italic')).toBeInTheDocument();
    expect(screen.getByTitle('Heading 1')).toBeInTheDocument();
  });

  it('hides toolbar buttons when readOnly is true', () => {
    render(<AITiptapEditor initialContent="Sample text" readOnly={true} />);
    expect(screen.queryByTitle('Bold')).not.toBeInTheDocument();
  });

  it('synchronizes content when initialContent changes', () => {
    const { rerender } = render(<AITiptapEditor initialContent="Initial version" />);
    expect(screen.getByTestId('tiptap-editor')).toBeInTheDocument();

    rerender(<AITiptapEditor initialContent="Updated version" />);
    expect(screen.getByTestId('tiptap-editor')).toBeInTheDocument();
  });

  it('cleans up autosave timer on unmount without throwing errors', () => {
    jest.useFakeTimers();
    const handleSave = jest.fn();
    const { unmount } = render(
      <AITiptapEditor initialContent="Autosave test" onSave={handleSave} autosaveInterval={1000} />
    );

    unmount();
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(handleSave).not.toHaveBeenCalled();
    jest.useRealTimers();
  });
});
