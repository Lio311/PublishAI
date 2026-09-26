import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NetworkGraph, { NetworkGraphSkeleton } from '@/components/analytics/NetworkGraph';
import AnalyticsDashboard, { AnalyticsDashboardSkeleton } from '@/app/[locale]/(dashboard)/analytics/AnalyticsDashboard';
import EntityHighlighter from '@/components/graph/EntityHighlighter';
import KnowledgeGraphViewer, { KnowledgeGraphViewerSkeleton } from '@/components/graph/KnowledgeGraphViewer';
import LogicConsistencyReport, { LogicConsistencyReportSkeleton } from '@/components/graph/LogicConsistencyReport';

// Mock next-intl
jest.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string) => key,
}));

// Mock fetch
const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  global.fetch = originalFetch;
  jest.clearAllMocks();
});

describe('Analytics & Graph Components', () => {
  describe('NetworkGraph & Skeleton', () => {
    it('renders NetworkGraphSkeleton with accessible status', () => {
      render(<NetworkGraphSkeleton />);
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText(/Simulating GraphRAG Knowledge Network/i)).toBeInTheDocument();
    });

    it('renders NetworkGraph with loaded data and accessible elements', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          nodes: [
            { id: '1', name: 'Aspirin', type: 'drug', description: 'Pain reliever' },
            { id: '2', name: 'COX-2', type: 'protein', description: 'Enzyme' },
          ],
          edges: [
            { source: '1', target: '2', type: 'inhibits', confidenceScore: 0.9 },
          ],
        }),
      });

      render(<NetworkGraph />);

      await waitFor(() => {
        expect(screen.getByRole('region', { name: /Scientific concept network graph/i })).toBeInTheDocument();
      });

      expect(screen.getByText('Aspirin')).toBeInTheDocument();
      expect(screen.getByText('COX-2')).toBeInTheDocument();
      expect(screen.getByText('Entity Types')).toBeInTheDocument();
    });

    it('renders error state with retry button on network failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      render(<NetworkGraph />);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
      expect(screen.getByText(/Failed to load network graph/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
    });
  });

  describe('EntityHighlighter', () => {
    it('handles non-array entity responses gracefully without crashing', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ error: 'Database timeout' }),
      });

      render(<EntityHighlighter text="Testing non-array fallback." />);

      await waitFor(() => {
        expect(screen.getByText('Testing non-array fallback.')).toBeInTheDocument();
      });
    });

    it('highlights matched entities with keyboard-accessible mark', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: 'e1', name: 'Metformin', type: 'drug', description: 'Anti-diabetic medication' },
        ],
      });

      render(<EntityHighlighter text="Patients were treated with Metformin daily." />);

      await waitFor(() => {
        const mark = screen.getByRole('mark');
        expect(mark).toBeInTheDocument();
        expect(mark).toHaveAttribute('tabindex', '0');
      });

      expect(screen.getAllByText('Metformin').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Type: drug')).toBeInTheDocument();
    });

    it('safely escapes special characters in entity names', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: 'e2', name: 'p53 [tumor protein]', type: 'gene', description: 'Tumor suppressor' },
        ],
      });

      // Should not throw SyntaxError when regex escapes brackets
      render(<EntityHighlighter text="Expression of p53 [tumor protein] was elevated." />);

      await waitFor(() => {
        expect(screen.getByText(/Expression of/i)).toBeInTheDocument();
      });
    });
  });

  describe('KnowledgeGraphViewer & Skeleton', () => {
    it('renders KnowledgeGraphViewerSkeleton with accessible role', () => {
      render(<KnowledgeGraphViewerSkeleton />);
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText(/Constructing Knowledge Graph/i)).toBeInTheDocument();
    });

    it('renders dual view mode and allows switching to accessible table view', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          nodes: [
            { id: 'n1', name: 'Curcumin', group: 'drug', description: 'Polyphenol' },
            { id: 'n2', name: 'NF-kB', group: 'protein', description: 'Transcription factor' },
          ],
          links: [
            { source: 'n1', target: 'n2', label: 'inhibits', evidence: 'In vitro assay' },
          ],
        }),
      });

      render(<KnowledgeGraphViewer paperId={42} />);

      await waitFor(() => {
        expect(screen.getByText('Interactive Entity Network')).toBeInTheDocument();
      });

      // Click Table toggle button
      const tableToggleBtn = screen.getByRole('button', { name: /Switch to accessible table view/i });
      fireEvent.click(tableToggleBtn);

      expect(screen.getByText('Entities (2)')).toBeInTheDocument();
      expect(screen.getByText('Curcumin')).toBeInTheDocument();
      expect(screen.getByText('NF-kB')).toBeInTheDocument();
      expect(screen.getByText('inhibits')).toBeInTheDocument();
      expect(screen.getByText('In vitro assay')).toBeInTheDocument();
    });
  });

  describe('LogicConsistencyReport & Skeleton', () => {
    it('renders LogicConsistencyReportSkeleton', () => {
      render(<LogicConsistencyReportSkeleton />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('allows entering claims and displays verification results with live region', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            claim: 'Curcumin decreases inflammation',
            isConsistent: true,
            supportingEvidence: ['Suppressed cytokine production in mice'],
          },
        ],
      });

      render(<LogicConsistencyReport paperId={42} />);

      const textarea = screen.getByPlaceholderText(/Enter claims to check/i);
      fireEvent.change(textarea, { target: { value: 'Curcumin decreases inflammation' } });

      const submitBtn = screen.getByRole('button', { name: /Run Logic Check/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText('Consistent')).toBeInTheDocument();
      });

      expect(screen.getByText('Suppressed cytokine production in mice')).toBeInTheDocument();
    });
  });

  describe('AnalyticsDashboard & Skeleton', () => {
    it('renders AnalyticsDashboardSkeleton with accessible role', () => {
      render(<AnalyticsDashboardSkeleton />);
      expect(screen.getByRole('status', { name: /Loading analytics dashboard/i })).toBeInTheDocument();
    });

    it('renders AnalyticsDashboard with metric cards, charts, and screen reader tables', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            summary: {
              totalEntities: 15,
              totalRelationships: 24,
              mostCommonEntityType: 'drug',
              mostCommonRelationship: 'treats',
            },
            entityDistribution: [{ name: 'drug', value: 10 }, { name: 'protein', value: 5 }],
            relationshipDistribution: [{ name: 'treats', value: 14 }, { name: 'inhibits', value: 10 }],
            topEntities: [{ id: '1', name: 'Aspirin', type: 'drug', connections: 8 }],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ nodes: [], edges: [] }),
        });

      render(<AnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('15')).toBeInTheDocument();
        expect(screen.getByText('24')).toBeInTheDocument();
        expect(screen.getByText('Aspirin')).toBeInTheDocument();
      });

      // Accessible regions for charts
      expect(screen.getByRole('region', { name: /Entity Distribution Pie Chart/i })).toBeInTheDocument();
      expect(screen.getByRole('region', { name: /Relationship Distribution Bar Chart/i })).toBeInTheDocument();
    });
  });
});
