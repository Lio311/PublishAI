import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AddJournalButton from '@/components/journals/AddJournalButton';
import CitationSearch from '@/components/literature/CitationSearch';
import { toast } from 'sonner';

// Mock next/navigation
const mockRefresh = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: mockRefresh,
    push: jest.fn(),
  }),
}));

// Mock sonner
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock next-intl
jest.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: (namespace: string) => {
    return (key: string, params?: Record<string, any>) => {
      if (params) {
        let text = `${namespace}.${key}`;
        Object.entries(params).forEach(([k, v]) => {
          text += ` [${k}=${v}]`;
        });
        return text;
      }
      return `${namespace}.${key}`;
    };
  },
}));

// Mock fetch
const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = jest.fn();
  mockRefresh.mockClear();
  (toast.success as jest.Mock).mockClear();
  (toast.error as jest.Mock).mockClear();
});

afterEach(() => {
  global.fetch = originalFetch;
  jest.clearAllMocks();
});

describe('Journals and Literature Components', () => {
  describe('AddJournalButton', () => {
    it('renders the add journal trigger button with translated label', () => {
      render(<AddJournalButton />);
      const triggerBtn = screen.getByRole('button', { name: /Journals\.addButton/i });
      expect(triggerBtn).toBeInTheDocument();
    });

    it('opens modal on click and enables submit button only when valid name entered', () => {
      render(<AddJournalButton />);
      fireEvent.click(screen.getByRole('button', { name: /Journals\.addButton/i }));

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Journals.modalTitle')).toBeInTheDocument();

      const input = screen.getByPlaceholderText('Journals.namePlaceholder');
      const submitBtn = screen.getByRole('button', { name: /Journals\.saveButton/i });

      // Initially disabled because name is empty
      expect(submitBtn).toBeDisabled();

      // Only whitespace -> still disabled
      fireEvent.change(input, { target: { value: '   ' } });
      expect(submitBtn).toBeDisabled();

      // Valid text -> enabled
      fireEvent.change(input, { target: { value: 'Nature Biotechnology' } });
      expect(submitBtn).not.toBeDisabled();
    });

    it('shows loading state on submit and handles success response', async () => {
      let resolveFetch: (val: any) => void = () => {};
      (global.fetch as jest.Mock).mockReturnValue(
        new Promise((resolve) => {
          resolveFetch = resolve;
        })
      );

      render(<AddJournalButton />);
      fireEvent.click(screen.getByRole('button', { name: /Journals\.addButton/i }));

      const input = screen.getByPlaceholderText('Journals.namePlaceholder');
      fireEvent.change(input, { target: { value: 'Cell' } });

      const submitBtn = screen.getByRole('button', { name: /Journals\.saveButton/i });
      fireEvent.click(submitBtn);

      // Loading state on button
      expect(screen.getByRole('button', { name: /Journals\.saving/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Journals\.saving/i })).toBeDisabled();
      expect(screen.getByText('Journals.fetchingDetails')).toBeInTheDocument();
      expect(input).toBeDisabled();

      // Resolve successfully
      resolveFetch({
        ok: true,
        json: async () => ({ id: 1, name: 'Cell' }),
      });

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Journals.createSuccess');
        expect(mockRefresh).toHaveBeenCalled();
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('handles server error response gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Journal already exists' }),
      });

      render(<AddJournalButton />);
      fireEvent.click(screen.getByRole('button', { name: /Journals\.addButton/i }));

      const input = screen.getByPlaceholderText('Journals.namePlaceholder');
      fireEvent.change(input, { target: { value: 'Lancet' } });

      fireEvent.click(screen.getByRole('button', { name: /Journals\.saveButton/i }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Journal already exists');
      });

      // Modal stays open and buttons re-enabled
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Journals\.saveButton/i })).not.toBeDisabled();
    });

    it('handles network throw gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network failure'));

      render(<AddJournalButton />);
      fireEvent.click(screen.getByRole('button', { name: /Journals\.addButton/i }));

      const input = screen.getByPlaceholderText('Journals.namePlaceholder');
      fireEvent.change(input, { target: { value: 'Science' } });

      fireEvent.click(screen.getByRole('button', { name: /Journals\.saveButton/i }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('common.error');
      });

      expect(screen.getByRole('button', { name: /Journals\.saveButton/i })).not.toBeDisabled();
    });
  });

  describe('CitationSearch', () => {
    it('renders with translated title, placeholder, and search button disabled when empty', () => {
      render(<CitationSearch />);
      expect(screen.getByText('Literature.title')).toBeInTheDocument();

      const input = screen.getByPlaceholderText('Literature.placeholder');
      expect(input).toBeInTheDocument();

      const searchBtn = screen.getByRole('button', { name: /Literature\.search/i });
      expect(searchBtn).toBeDisabled();

      fireEvent.change(input, { target: { value: 'CRISPR Cas9' } });
      expect(searchBtn).not.toBeDisabled();
    });

    it('displays loading state during search and renders results on success', async () => {
      let resolveSearch: (val: any) => void = () => {};
      (global.fetch as jest.Mock).mockReturnValue(
        new Promise((resolve) => {
          resolveSearch = resolve;
        })
      );

      render(<CitationSearch />);
      const input = screen.getByPlaceholderText('Literature.placeholder');
      fireEvent.change(input, { target: { value: 'CRISPR Cas9' } });

      const searchBtn = screen.getByRole('button', { name: /Literature\.search/i });
      fireEvent.click(searchBtn);

      // Loading state on button and status container
      expect(screen.getByRole('button', { name: /Literature\.searching/i })).toBeDisabled();
      expect(screen.getByRole('status')).toBeInTheDocument();

      resolveSearch({
        ok: true,
        json: async () => ({
          query: 'CRISPR Cas9',
          total: 1,
          sources: { pubmed: 1, crossref: 0 },
          items: [
            {
              id: 'item-1',
              title: 'Genome editing with CRISPR-Cas9',
              authors: [{ name: 'Doudna JA' }, { name: 'Charpentier E' }],
              journal: 'Science',
              year: 2014,
              doi: '10.1126/science.1258096',
            },
          ],
        }),
      });

      await waitFor(() => {
        expect(screen.getByText('Genome editing with CRISPR-Cas9')).toBeInTheDocument();
        expect(screen.getByText('Doudna JA, Charpentier E')).toBeInTheDocument();
        expect(screen.getByText('Science')).toBeInTheDocument();
        expect(screen.getByText('10.1126/science.1258096')).toBeInTheDocument();
      });

      // Clear button resets search
      const clearBtn = screen.getByRole('button', { name: /Literature\.clear/i });
      fireEvent.click(clearBtn);
      expect(screen.queryByText('Genome editing with CRISPR-Cas9')).not.toBeInTheDocument();
      expect(input).toHaveValue('');
    });

    it('displays empty state when total is 0', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          query: 'xyznonexistentterm',
          total: 0,
          sources: { pubmed: 0, crossref: 0 },
          items: [],
        }),
      });

      render(<CitationSearch />);
      const input = screen.getByPlaceholderText('Literature.placeholder');
      fireEvent.change(input, { target: { value: 'xyznonexistentterm' } });
      fireEvent.click(screen.getByRole('button', { name: /Literature\.search/i }));

      await waitFor(() => {
        expect(screen.getByText('Literature.noResults')).toBeInTheDocument();
      });
    });

    it('handles 429 rate limit error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ source: 'PubMed', retryAfter: 10 }),
      });

      render(<CitationSearch />);
      const input = screen.getByPlaceholderText('Literature.placeholder');
      fireEvent.change(input, { target: { value: 'Cancer immunotherapy' } });
      fireEvent.click(screen.getByRole('button', { name: /Literature\.search/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByRole('alert')).toHaveTextContent('Literature.rateLimit [source=PubMed] [retryAfter=10]');
      });
    });

    it('handles 504 timeout error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 504,
        json: async () => ({ error: 'Gateway Timeout' }),
      });

      render(<CitationSearch />);
      const input = screen.getByPlaceholderText('Literature.placeholder');
      fireEvent.change(input, { target: { value: 'Cancer immunotherapy' } });
      fireEvent.click(screen.getByRole('button', { name: /Literature\.search/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByRole('alert')).toHaveTextContent('Literature.timeout');
      });
    });

    it('handles network failure', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Connection refused'));

      render(<CitationSearch />);
      const input = screen.getByPlaceholderText('Literature.placeholder');
      fireEvent.change(input, { target: { value: 'Cancer' } });
      fireEvent.click(screen.getByRole('button', { name: /Literature\.search/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByRole('alert')).toHaveTextContent('Connection refused');
      });
    });
  });
});
