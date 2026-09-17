export interface DocumentSection {
  id: string;
  title: string;
  content: string;
  wordCount: number;
  status: "draft" | "generated" | "reviewed";
  order: number;
}

export interface DocumentVersion {
  id: number;
  versionNumber: number;
  changesSummary: string;
  format: string;
  fileUrl?: string;
  createdAt: string;
}

export interface DocumentAuthor {
  name: string;
  affiliation: string;
  email?: string;
  isCorresponding?: boolean;
}

export interface DocumentJournal {
  id: number;
  name: string;
  field: string;
  citationStyle: string;
  wordLimit?: number;
  abstractLimit?: number;
}

export interface DocumentMetrics {
  wordCount: number;
  targetWordLimit: number;
  sectionsCompleted: number;
  totalSections: number;
  figuresCount: number;
  referencesCount: number;
}

export interface AcademicDocument {
  id: number;
  userId: string;
  title: string;
  abstract: string;
  status: "pending" | "in_progress" | "awaiting_approval" | "approved" | "completed" | "failed";
  stage: "clarification" | "planning" | "knowledge" | "scientific_review" | "writing" | "execution" | "qa" | "verification" | "compilation" | "rebuttal";
  targetJournalId?: number | null;
  targetJournal?: DocumentJournal;
  metrics: DocumentMetrics;
  authors: DocumentAuthor[];
  keywords: string[];
  sections?: DocumentSection[];
  versions?: DocumentVersion[];
  originalFileUrl?: string | null;
  originalFormat?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const DUMMY_USER = {
  id: "usr_mock_publishai_01",
  name: "Dr. Jane Doe",
  email: "jane.doe@stanford.edu",
  image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jane",
  role: "Lead Researcher",
  institution: "Stanford University",
  field: "Computational Biology & Genomics",
  credits: 50,
  stripeSubscriptionId: "sub_mock_active_tier_pro",
  isMock: true,
};

export const DUMMY_DOCUMENTS: AcademicDocument[] = [
  {
    id: 1,
    userId: "usr_mock_publishai_01",
    title: "Deep Learning for Single-Cell RNA Sequencing Trajectory Inference",
    abstract:
      "Single-cell RNA sequencing (scRNA-seq) has transformed developmental biology by uncovering cellular heterogeneity at unprecedented resolution. However, continuous lineage reconstruction from discrete expression snapshots remains computationally demanding due to high-dimensional noise and drop-out artifacts. Here, we present a self-supervised topological deep learning architecture designed to infer continuous manifold trajectories with minimal inductive bias. Our model achieves a 32% increase in pseudotime correlation compared to benchmark baseline algorithms across embryonic stem cell differentiation assays.",
    status: "in_progress",
    stage: "writing",
    targetJournalId: 101,
    targetJournal: {
      id: 101,
      name: "Nature Biotechnology",
      field: "Computational Biology",
      citationStyle: "Nature",
      wordLimit: 5000,
      abstractLimit: 200,
    },
    metrics: {
      wordCount: 4320,
      targetWordLimit: 5000,
      sectionsCompleted: 4,
      totalSections: 7,
      figuresCount: 6,
      referencesCount: 48,
    },
    authors: [
      { name: "Dr. Jane Doe", affiliation: "Stanford University", email: "jane.doe@stanford.edu", isCorresponding: true },
      { name: "Dr. Alexander Chen", affiliation: "Broad Institute of MIT and Harvard", email: "achen@broadinstitute.org", isCorresponding: false },
      { name: "Prof. Elena Rostova", affiliation: "Stanford University", email: "erostova@stanford.edu", isCorresponding: false },
    ],
    keywords: ["Single-Cell Genomics", "Deep Learning", "Trajectory Inference", "Manifold Learning", "Gene Regulatory Networks"],
    sections: [
      {
        id: "sec_1",
        title: "Abstract",
        content: "Single-cell RNA sequencing (scRNA-seq) has transformed developmental biology by uncovering cellular heterogeneity at unprecedented resolution...",
        wordCount: 185,
        status: "reviewed",
        order: 1,
      },
      {
        id: "sec_2",
        title: "Introduction",
        content: "Biological systems develop through dynamic state transitions coordinated by tight gene regulatory networks. Characterizing these transitions requires tracing continuous differentiation paths...",
        wordCount: 1120,
        status: "reviewed",
        order: 2,
      },
      {
        id: "sec_3",
        title: "Methodology & Architecture",
        content: "We formulate trajectory inference as a Riemannian geodesic optimization over latent spaces learned via variational graph autoencoders...",
        wordCount: 1450,
        status: "generated",
        order: 3,
      },
      {
        id: "sec_4",
        title: "Experimental Results",
        content: "Evaluation on synthetic branching datasets and human hematopoietic stem cell differentiation reveals robust noise resistance...",
        wordCount: 1565,
        status: "draft",
        order: 4,
      },
    ],
    versions: [
      {
        id: 1,
        versionNumber: 1,
        changesSummary: "Initial draft generation from uploaded experimental lab notes",
        format: "markdown",
        createdAt: "2026-09-02T14:30:00.000Z",
      },
      {
        id: 2,
        versionNumber: 2,
        changesSummary: "Added deep manifold graph topology section and updated references",
        format: "markdown",
        createdAt: "2026-09-10T18:15:00.000Z",
      },
    ],
    createdAt: "2026-09-02T12:00:00.000Z",
    updatedAt: "2026-09-17T20:10:00.000Z",
  },
  {
    id: 2,
    userId: "usr_mock_publishai_01",
    title: "Quantum Error Mitigation via Zero-Noise Extrapolation in NISQ Hardware",
    abstract:
      "Noisy Intermediate-Scale Quantum (NISQ) devices are severely limited by decoherence and gate infidelities. While fault-tolerant quantum error correction requires substantial qubit overhead, error mitigation techniques offer a near-term alternative. In this work, we propose an adaptive pulse-level Richardson extrapolation technique that scales noise intentionally while maintaining Hamiltonian symmetry. We demonstrate high-fidelity expectation value recovery on IBM superconducting quantum processors.",
    status: "awaiting_approval",
    stage: "scientific_review",
    targetJournalId: 102,
    targetJournal: {
      id: 102,
      name: "Physical Review Letters",
      field: "Quantum Physics",
      citationStyle: "APS",
      wordLimit: 3750,
      abstractLimit: 150,
    },
    metrics: {
      wordCount: 3610,
      targetWordLimit: 3750,
      sectionsCompleted: 6,
      totalSections: 6,
      figuresCount: 4,
      referencesCount: 38,
    },
    authors: [
      { name: "Dr. Jane Doe", affiliation: "Stanford University", email: "jane.doe@stanford.edu", isCorresponding: true },
      { name: "Dr. Marcus Vance", affiliation: "Caltech", email: "mvance@caltech.edu", isCorresponding: false },
    ],
    keywords: ["Quantum Computing", "NISQ", "Error Mitigation", "Zero-Noise Extrapolation", "Superconducting Qubits"],
    sections: [
      {
        id: "sec_1",
        title: "Abstract",
        content: "Noisy Intermediate-Scale Quantum (NISQ) devices are severely limited by decoherence and gate infidelities...",
        wordCount: 142,
        status: "reviewed",
        order: 1,
      },
      {
        id: "sec_2",
        title: "Main Text",
        content: "State preparation and measurement (SPAM) errors together with two-qubit gate infidelities represent the dominant noise channels...",
        wordCount: 3468,
        status: "reviewed",
        order: 2,
      },
    ],
    versions: [
      {
        id: 1,
        versionNumber: 1,
        changesSummary: "First full manuscript draft prepared for PRL submission criteria",
        format: "latex",
        createdAt: "2026-08-25T11:00:00.000Z",
      },
    ],
    createdAt: "2026-08-20T09:30:00.000Z",
    updatedAt: "2026-09-16T15:20:00.000Z",
  },
  {
    id: 3,
    userId: "usr_mock_publishai_01",
    title: "Multi-Agent Consensus Verification for Scientific Evidence Grounding",
    abstract:
      "Large language models (LLMs) used in research synthesis are prone to hallucinating citations and misattributing empirical findings. We design a decentralized multi-agent verification protocol, featuring adversarial critic agents and deterministic citation-graph traversals. Our benchmark demonstrates zero fabricated references across 1,000 synthesized systematic reviews.",
    status: "completed",
    stage: "compilation",
    targetJournalId: 103,
    targetJournal: {
      id: 103,
      name: "ACM Computing Surveys",
      field: "Computer Science",
      citationStyle: "ACM",
      wordLimit: 12000,
      abstractLimit: 250,
    },
    metrics: {
      wordCount: 10850,
      targetWordLimit: 12000,
      sectionsCompleted: 8,
      totalSections: 8,
      figuresCount: 9,
      referencesCount: 95,
    },
    authors: [
      { name: "Dr. Jane Doe", affiliation: "Stanford University", email: "jane.doe@stanford.edu", isCorresponding: true },
    ],
    keywords: ["Multi-Agent Systems", "Evidence Verification", "Scientific Synthesis", "Hallucination Reduction"],
    sections: [
      { id: "sec_1", title: "Abstract", content: "Large language models used in research synthesis...", wordCount: 195, status: "reviewed", order: 1 },
      { id: "sec_2", title: "Introduction", content: "Automated synthesis of scientific literature promises to accelerate discoveries...", wordCount: 2100, status: "reviewed", order: 2 },
      { id: "sec_3", title: "Related Work", content: "Prior attempts at retrieval-augmented generation in science...", wordCount: 2450, status: "reviewed", order: 3 },
      { id: "sec_4", title: "Architecture", content: "The multi-agent consensus framework consists of synthesizer, extractor, and adversary...", wordCount: 3100, status: "reviewed", order: 4 },
      { id: "sec_5", title: "Empirical Evaluation", content: "We evaluate on biomedical and computer science corpus benchmarks...", wordCount: 3005, status: "reviewed", order: 5 },
    ],
    versions: [
      {
        id: 1,
        versionNumber: 1,
        changesSummary: "Compiled camera-ready manuscript",
        format: "pdf",
        createdAt: "2026-09-12T16:00:00.000Z",
      },
    ],
    createdAt: "2026-07-15T10:00:00.000Z",
    updatedAt: "2026-09-12T16:45:00.000Z",
  },
];
