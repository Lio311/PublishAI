// Verified data from official journal websites
// Last verified: 2026-09-23

export const INITIAL_JOURNALS = [
  {
    name: "Nature",
    field: "Multidisciplinary",
    instructionsUrl: "https://www.nature.com/nature/for-authors",
    wordLimit: 3000,
    abstractLimit: 200,
    requiredSections: ["Title","Authors & Affiliations","Summary Paragraph","Main Text","Methods","Data Availability Statement","Code Availability Statement","References","Acknowledgements","Author Contributions","Competing Interests","Extended Data","Supplementary Information"],
    dataSource: "official-website",
    lastVerifiedAt: new Date("2026-09-23")
  },
  {
    name: "Science",
    field: "Multidisciplinary",
    instructionsUrl: "https://www.science.org/content/page/instructions-authors",
    wordLimit: 4500,
    abstractLimit: 125,
    requiredSections: ["Title","Authors & Affiliations","One-Sentence Summary","Abstract","Main Text","References and Notes","Acknowledgments","Funding","Author Contributions","Competing Interests","Data and Materials Availability","Supplementary Materials"],
    dataSource: "official-website",
    lastVerifiedAt: new Date("2026-09-23")
  },
  {
    name: "IEEE TPAMI",
    field: "Computer Science",
    instructionsUrl: "https://www.computer.org/csdl/journal/tp",
    wordLimit: 10000,
    abstractLimit: 200,
    requiredSections: ["Title","Author Byline & Affiliations","Abstract","Index Terms","Introduction","Related Work","Methodology","Experiments & Results","Discussion & Limitations","Conclusion","Acknowledgments","References","Author Biographies & Photos"],
    dataSource: "official-website",
    lastVerifiedAt: new Date("2026-09-23")
  },
  {
    name: "The Lancet",
    field: "Medicine",
    instructionsUrl: "https://www.thelancet.com/lancet/information-for-authors",
    wordLimit: 3500,
    abstractLimit: 300,
    requiredSections: ["Title Page","Structured Abstract","Research in Context Panel","Introduction","Methods","Results","Discussion","Contributors","Declaration of Interests","Funding","Data Sharing Statement","Acknowledgments","References"],
    dataSource: "official-website",
    lastVerifiedAt: new Date("2026-09-23")
  },
  {
    name: "Cell",
    field: "Biology",
    instructionsUrl: "https://www.cell.com/cell/authors",
    wordLimit: 7000,
    abstractLimit: 150,
    requiredSections: ["Title Page","Highlights","eTOC Blurb","Summary","Introduction","Results","Discussion","Acknowledgments","Author Contributions","Declaration of Interests","STAR Methods","References","Figures & Tables","Graphical Abstract"],
    dataSource: "official-website",
    lastVerifiedAt: new Date("2026-09-23")
  },
  {
    name: "PNAS",
    field: "Multidisciplinary",
    instructionsUrl: "https://www.pnas.org/author-center",
    wordLimit: 4000,
    abstractLimit: 250,
    requiredSections: ["Title Page","Significance Statement","Abstract","Introduction","Results","Discussion","Materials and Methods","Data Availability","Acknowledgments","Author Contributions","Competing Interest","References","SI Appendix"],
    dataSource: "official-website",
    lastVerifiedAt: new Date("2026-09-23")
  },
  {
    name: "NEJM",
    field: "Medicine",
    instructionsUrl: "https://www.nejm.org/author-center/new-manuscripts",
    wordLimit: 2700,
    abstractLimit: 250,
    requiredSections: ["Title Page","Structured Abstract","Introduction","Methods","Results","Discussion","References","Tables & Figures","ICMJE Forms","Data Sharing Statement"],
    dataSource: "official-website",
    lastVerifiedAt: new Date("2026-09-23")
  },
  {
    name: "PLOS ONE",
    field: "Multidisciplinary",
    instructionsUrl: "https://journals.plos.org/plosone/s/submission-guidelines",
    wordLimit: null,
    abstractLimit: 300,
    requiredSections: ["Title Page","Abstract","Introduction","Materials and Methods","Results","Discussion","Conclusions","Acknowledgments","References","Supporting Information","Data Availability Statement","Financial Disclosure","Competing Interests","Ethics Statement"],
    dataSource: "official-website",
    lastVerifiedAt: new Date("2026-09-23")
  },
  {
    name: "BMJ",
    field: "Medicine",
    instructionsUrl: "https://www.bmj.com/about-bmj/resources-authors",
    wordLimit: null,
    abstractLimit: 300,
    requiredSections: ["Title Page","Structured Abstract","What is already known / What this study adds","Introduction","Methods (with PPI statement)","Results","Discussion","Ethics & Consent","Data Sharing","Transparency Declaration","Funding Role","Competing Interests","Contributorship","References"],
    dataSource: "official-website",
    lastVerifiedAt: new Date("2026-09-23")
  },
  {
    name: "Nature Medicine",
    field: "Medicine / Biomedical",
    instructionsUrl: "https://www.nature.com/nm/submission-guidelines",
    wordLimit: 4000,
    abstractLimit: 150,
    requiredSections: ["Title","Authors & Affiliations","Abstract","Main Text","Methods","Data Availability","Code Availability","Acknowledgments","Author Contributions","Competing Interests","References","Extended Data","Supplementary Information"],
    dataSource: "official-website",
    lastVerifiedAt: new Date("2026-09-23")
  }
];

export const INITIAL_CITATION_RULES = [
  {
    journalName: "Nature",
    style: "Nature",
    inTextFormat: "superscript",
    referenceListOrder: "order-of-appearance",
    etAlThreshold: 5,
    etAlDisplayCount: 1,
    volumeFormat: "bold",
    yearFormat: "parentheses-end",
    journalTitleFormat: "italic-abbreviated",
    authorFormat: "surname-initials",
    lastAuthorSeparator: "&",
    articleTitleFormat: "plain",
    personalCommsInRefList: false,
    exampleRef: "Shi, Y., Evans, J. E. & Rock, K. L. Molecular identification of a danger signal that alerts the immune system to dying cells. Nature 425, 516–521 (2003)."
  },
  {
    journalName: "Science",
    style: "Science",
    inTextFormat: "italic-parentheses",
    referenceListOrder: "order-of-appearance",
    etAlThreshold: 6,
    etAlDisplayCount: 1,
    volumeFormat: "bold",
    yearFormat: "parentheses-end",
    journalTitleFormat: "italic-abbreviated",
    authorFormat: "initials-surname",
    lastAuthorSeparator: ",",
    articleTitleFormat: "plain",
    personalCommsInRefList: false,
    exampleRef: "J. D. Smith, M. R. Johnson, Machine learning in diagnostics. Science 383, 123–145 (2024).",
    notes: "References and Notes section integrates bibliographic citations and explanatory notes in single numbered list"
  },
  {
    journalName: "IEEE TPAMI",
    style: "IEEE",
    inTextFormat: "brackets",
    referenceListOrder: "order-of-appearance",
    etAlThreshold: 7,
    etAlDisplayCount: 1,
    volumeFormat: "plain",
    yearFormat: "after-journal",
    journalTitleFormat: "italic-abbreviated",
    authorFormat: "initials-surname",
    lastAuthorSeparator: "and",
    articleTitleFormat: "quotes",
    personalCommsInRefList: false,
    exampleRef: "[1] J. K. Author, \"Title of paper,\" IEEE Trans. Pattern Anal. Mach. Intell., vol. 45, no. 3, pp. 1234–1245, Mar. 2023."
  },
  {
    journalName: "The Lancet",
    style: "Vancouver",
    inTextFormat: "superscript",
    referenceListOrder: "order-of-appearance",
    etAlThreshold: 7,
    etAlDisplayCount: 6,
    volumeFormat: "bold",
    yearFormat: "inline",
    journalTitleFormat: "italic-abbreviated",
    authorFormat: "surname-initials",
    lastAuthorSeparator: ",",
    articleTitleFormat: "plain",
    personalCommsInRefList: false,
    exampleRef: "Murray CJ, Vos T, Lozano R, et al. Disability-adjusted life years (DALYs) for 291 diseases. Lancet 2012; 380: 2197–223."
  },
  {
    journalName: "Cell",
    style: "Cell Press Harvard",
    inTextFormat: "parentheses",
    referenceListOrder: "alphabetical",
    etAlThreshold: 3,
    etAlDisplayCount: 1,
    volumeFormat: "italic",
    yearFormat: "parentheses-end",
    journalTitleFormat: "italic-full",
    authorFormat: "surname-initials",
    lastAuthorSeparator: "and",
    articleTitleFormat: "plain",
    personalCommsInRefList: false,
    exampleRef: "Smith, A.B., and Jones, C.D. (2024). Mechanism of metabolic reprogramming in human cell lines. Cell 187, 1204–1218.",
    notes: "Author-Date system — unique among top journals. References ordered alphabetically, not by appearance."
  },
  {
    journalName: "PNAS",
    style: "PNAS",
    inTextFormat: "parentheses",
    referenceListOrder: "order-of-appearance",
    etAlThreshold: null,
    etAlDisplayCount: null,
    volumeFormat: "bold",
    yearFormat: "parentheses-end",
    journalTitleFormat: "italic-abbreviated",
    authorFormat: "initials-surname",
    lastAuthorSeparator: ",",
    articleTitleFormat: "plain",
    personalCommsInRefList: false,
    exampleRef: "J. A. Smith, B. C. Jones, Quantum coherent control of single electron spins. Proc. Natl. Acad. Sci. U.S.A. 120, e2201948120 (2023).",
    notes: "Uses parentheses (1, 2) — NOT superscript and NOT square brackets"
  },
  {
    journalName: "NEJM",
    style: "Vancouver/AMA",
    inTextFormat: "superscript",
    referenceListOrder: "order-of-appearance",
    etAlThreshold: 7,
    etAlDisplayCount: 3,
    volumeFormat: "bold",
    yearFormat: "inline",
    journalTitleFormat: "italic-abbreviated",
    authorFormat: "surname-initials",
    lastAuthorSeparator: ",",
    articleTitleFormat: "plain",
    personalCommsInRefList: false,
    exampleRef: "Shapiro AMJ, Lakey JRT, Ryan EA, et al. Islet transplantation in seven patients. N Engl J Med 2000; 343: 230–8."
  },
  {
    journalName: "PLOS ONE",
    style: "Vancouver",
    inTextFormat: "brackets",
    referenceListOrder: "order-of-appearance",
    etAlThreshold: 7,
    etAlDisplayCount: 6,
    volumeFormat: "plain",
    yearFormat: "after-journal",
    journalTitleFormat: "plain",
    authorFormat: "surname-initials",
    lastAuthorSeparator: ",",
    articleTitleFormat: "plain",
    personalCommsInRefList: false,
    exampleRef: "Duckles JM, Chen SY, Brown CT. The role of open data in reproducible biomedical research. PLOS ONE. 2021;16(4): e0249821."
  },
  {
    journalName: "BMJ",
    style: "Vancouver",
    inTextFormat: "brackets",
    referenceListOrder: "order-of-appearance",
    etAlThreshold: 7,
    etAlDisplayCount: 6,
    volumeFormat: "bold",
    yearFormat: "inline",
    journalTitleFormat: "italic-abbreviated",
    authorFormat: "surname-initials",
    lastAuthorSeparator: ",",
    articleTitleFormat: "plain",
    personalCommsInRefList: false,
    exampleRef: "Smith JA, Jones BC, Baker LM, et al. Effectiveness of telemedicine consultations. BMJ 2022; 378: e071234.",
    notes: "CRITICAL: BMJ explicitly forbids superscript for references — must use square brackets [1]"
  },
  {
    journalName: "Nature Medicine",
    style: "Nature",
    inTextFormat: "superscript",
    referenceListOrder: "order-of-appearance",
    etAlThreshold: 5,
    etAlDisplayCount: 1,
    volumeFormat: "bold",
    yearFormat: "parentheses-end",
    journalTitleFormat: "italic-abbreviated",
    authorFormat: "surname-initials",
    lastAuthorSeparator: ",",
    articleTitleFormat: "plain",
    personalCommsInRefList: false,
    exampleRef: "Topalian, S. L. et al. Mechanism-driven biomarkers to guide immune checkpoint blockade. Nat. Med. 26, 1450–1457 (2020)."
  }
];

export const INITIAL_ARTICLE_TYPES = [
  // Nature
  { journalName: "Nature", name: "Article", isPrimary: true, wordLimit: 3000, displayItems: 6, refs: 50, abstractWordLimit: 200, notes: "Excludes summary, methods, refs, legends", methods: 3000 },
  { journalName: "Nature", name: "Review", isPrimary: false, wordLimit: 5000, displayItems: 6, refs: 100, abstractWordLimit: 200 },
  { journalName: "Nature", name: "Matters Arising", isPrimary: false, wordLimit: 1200, displayItems: 2, refs: 15 },
  { journalName: "Nature", name: "Correspondence", isPrimary: false, wordLimit: 500, displayItems: 1, refs: 5 },
  
  // Science
  { journalName: "Science", name: "Research Article", isPrimary: true, wordLimit: 4500, displayItems: 6, refs: 50, abstractWordLimit: 125, notes: "Excludes title, affiliations, One-Sentence Summary, abstract, acknowledgments, refs, SM" },
  { journalName: "Science", name: "Short Research Article", isPrimary: false, wordLimit: 2500, displayItems: 4, refs: 30 },
  { journalName: "Science", name: "Review", isPrimary: false, wordLimit: 6000, displayItems: 6, refs: 100 },
  { journalName: "Science", name: "Perspective", isPrimary: false, wordLimit: 1500, displayItems: 2, refs: 15 },
  { journalName: "Science", name: "Technical Comment", isPrimary: false, wordLimit: 1000, displayItems: 2, refs: 15 },
  
  // IEEE TPAMI
  { journalName: "IEEE TPAMI", name: "Regular Paper", isPrimary: true, wordLimit: 10000, displayItems: null, refs: null, abstractWordLimit: 200, notes: "12-14 double-column pages; overlength charges for pages 13-14" },
  { journalName: "IEEE TPAMI", name: "Short Paper", isPrimary: false, wordLimit: 7000, displayItems: null, refs: null, abstractWordLimit: 50, notes: "Max 8 double-column pages; no author biographies" },
  { journalName: "IEEE TPAMI", name: "Survey Paper", isPrimary: false, wordLimit: 16000, notes: "Up to 20 double-column pages" },
  { journalName: "IEEE TPAMI", name: "Comments Paper", isPrimary: false, wordLimit: 2000, notes: "Up to 2.5 double-column pages" },

  // The Lancet
  { journalName: "The Lancet", name: "Original Research", isPrimary: true, wordLimit: 3500, displayItems: 6, refs: null, abstractWordLimit: 300, notes: "4500 words for RCTs. Excludes title page, abstract, Research in Context, tables, legends, refs" },
  { journalName: "The Lancet", name: "Systematic Review", isPrimary: false, wordLimit: 4500, displayItems: 6, refs: null, abstractWordLimit: 300 },
  { journalName: "The Lancet", name: "Seminar/Review", isPrimary: false, wordLimit: 5000, displayItems: 6, refs: null },
  { journalName: "The Lancet", name: "Viewpoint", isPrimary: false, wordLimit: 1500, displayItems: 2, refs: null },
  { journalName: "The Lancet", name: "Comment", isPrimary: false, wordLimit: 1000, displayItems: 1, refs: 10 },
  { journalName: "The Lancet", name: "Correspondence", isPrimary: false, wordLimit: 400, displayItems: 1, refs: 5 },

  // Cell
  { journalName: "Cell", name: "Research Article", isPrimary: true, wordLimit: 7000, displayItems: 7, refs: null, abstractWordLimit: 150, notes: "Excludes Summary, STAR Methods, references, figure legends" },
  { journalName: "Cell", name: "Review", isPrimary: false, wordLimit: 8000, displayItems: null, refs: 150 },
  { journalName: "Cell", name: "Perspective", isPrimary: false, wordLimit: 6000, displayItems: null, refs: null },
  { journalName: "Cell", name: "Preview", isPrimary: false, wordLimit: 1500, displayItems: 2, refs: null },

  // PNAS
  { journalName: "PNAS", name: "Research Article", isPrimary: true, wordLimit: 4000, displayItems: null, refs: null, abstractWordLimit: 250, notes: "6 journal pages; can purchase up to 6 additional pages" },
  { journalName: "PNAS", name: "Brief Report", isPrimary: false, wordLimit: 2000, displayItems: null, refs: null },

  // NEJM
  { journalName: "NEJM", name: "Original Article", isPrimary: true, wordLimit: 2700, displayItems: 5, refs: 40, abstractWordLimit: 250, notes: "Introduction through Discussion only" },
  { journalName: "NEJM", name: "Brief Report", isPrimary: false, wordLimit: 1500, displayItems: 3, refs: 20 },
  { journalName: "NEJM", name: "Clinical Practice", isPrimary: false, wordLimit: 2500, displayItems: null, refs: null },
  { journalName: "NEJM", name: "Review", isPrimary: false, wordLimit: 4000, displayItems: null, refs: null },
  { journalName: "NEJM", name: "Correspondence", isPrimary: false, wordLimit: 175, displayItems: null, refs: 5 },

  // PLOS ONE
  { journalName: "PLOS ONE", name: "Research Article", isPrimary: true, wordLimit: null, displayItems: null, refs: null, abstractWordLimit: 300, notes: "No formal word, reference, or figure limits" },

  // BMJ
  { journalName: "BMJ", name: "Original Research", isPrimary: true, wordLimit: null, displayItems: null, refs: null, abstractWordLimit: 300, notes: "No fixed word limit. Up to 400 words for RCT/systematic review abstracts" },
  { journalName: "BMJ", name: "Editorial", isPrimary: false, wordLimit: 1000, displayItems: null, refs: 12 },
  { journalName: "BMJ", name: "Analysis", isPrimary: false, wordLimit: 3000, displayItems: null, refs: null },
  { journalName: "BMJ", name: "Clinical Review", isPrimary: false, wordLimit: 3000, displayItems: null, refs: null },

  // Nature Medicine
  { journalName: "Nature Medicine", name: "Article", isPrimary: true, wordLimit: 4000, displayItems: 8, refs: 50, abstractWordLimit: 150, notes: "Excludes abstract, Methods, refs, legends. Methods after refs, no word limit" },
  { journalName: "Nature Medicine", name: "Brief Communication", isPrimary: false, wordLimit: 1500, displayItems: 3, refs: 15 },
  { journalName: "Nature Medicine", name: "Review", isPrimary: false, wordLimit: 5000, displayItems: null, refs: 100 },
  { journalName: "Nature Medicine", name: "Perspective", isPrimary: false, wordLimit: 4000, displayItems: null, refs: null },
  { journalName: "Nature Medicine", name: "Resource", isPrimary: false, wordLimit: 4000, displayItems: null, refs: null }
];

export const INITIAL_ABSTRACT_RULES = [
  { 
    journalName: "Nature", type: "unstructured", limit: 200, label: "Summary Paragraph", allowCitations: true, headings: null, 
    additionalRequirements: { naturalStructure: ["introduction","background","main-finding-here-we-show","implications"] } 
  },
  { 
    journalName: "Science", type: "unstructured", limit: 125, label: "Abstract", allowCitations: false, headings: null, 
    additionalRequirements: { oneSentenceSummary: { required: true, maxCharacters: 150, placement: "below-affiliations-above-abstract" } } 
  },
  { 
    journalName: "IEEE TPAMI", type: "unstructured", limit: 200, label: "Abstract", allowCitations: false, headings: null, 
    additionalRequirements: { indexTerms: { required: true, count: "4-8", source: "IEEE taxonomy" } }, 
    notes: "No math expressions or bibliographic references in abstract" 
  },
  { 
    journalName: "The Lancet", type: "structured", limit: 300, label: "Abstract", allowCitations: false, 
    structuredHeadings: ["Background","Methods","Findings","Interpretation","Funding"],
    additionalRequirements: { researchInContext: { required: true, sections: ["Evidence before this study","Added value of this study","Implications of all the available evidence"] } }
  },
  { 
    journalName: "Cell", type: "unstructured", limit: 150, label: "Summary", allowCitations: false, headings: null, 
    additionalRequirements: { highlights: { required: true, count: "3-4", maxCharsPerBullet: 85 }, eTocBlurb: { required: true, wordLimit: "50-80", thirdPerson: true } } 
  },
  { 
    journalName: "PNAS", type: "unstructured", limit: 250, label: "Abstract", allowCitations: false, 
    additionalRequirements: { significanceStatement: { required: true, wordLimit: "50-120", description: "Explains general scientific relevance outside narrow field" } } 
  },
  { 
    journalName: "NEJM", type: "structured", limit: 250, label: "Abstract", allowCitations: false, 
    structuredHeadings: ["Background","Methods","Results","Conclusions"] 
  },
  { 
    journalName: "PLOS ONE", type: "unstructured", limit: 300, label: "Abstract", allowCitations: false, 
    notes: "No subheadings; minimal abbreviations" 
  },
  { 
    journalName: "BMJ", type: "structured", limit: 300, label: "Abstract", allowCitations: false, 
    structuredHeadings: ["Objective","Design","Setting","Participants","Interventions","Main outcome measures","Results","Conclusions","Trial registration"], 
    notes: "Up to 400 words for RCTs/systematic reviews",
    additionalRequirements: { whatThisStudyAdds: { required: true, sections: ["What is already known on this topic","What this study adds"] }, ppiStatement: { required: true, description: "Patient and Public Involvement statement in Methods" }, transparencyDeclaration: { required: true } }
  },
  { 
    journalName: "Nature Medicine", type: "unstructured", limit: 150, label: "Abstract", allowCitations: false, 
    notes: "Single paragraph for broad biomedical readership" 
  }
];

export const INITIAL_COVER_LETTER_RULES = [
  { 
    journalName: "Nature", required: true, maxPages: 1, shownToReviewers: false, 
    requiredContent: ["significance-and-fit","originality-statement","co-author-approval","related-work-disclosure","reviewer-suggestions","reviewer-exclusions"], 
    uniqueRequirements: "If opting for double-anonymized review, include full author details in cover letter", 
    toneGuidance: "broad-scientific-impact" 
  },
  { 
    journalName: "Science", required: true, maxPages: 1, shownToReviewers: false, 
    requiredContent: ["significance-and-fit","key-findings-identification","colleague-review-disclosure","prior-editorial-contact","related-work-disclosure","reviewer-suggestions","reviewer-exclusions","compliance-declarations"], 
    uniqueRequirements: "Must explicitly list colleagues who reviewed a draft before submission (unique Science requirement)", 
    toneGuidance: "cross-disciplinary-significance" 
  },
  { 
    journalName: "IEEE TPAMI", required: true, maxPages: null, shownToReviewers: false, 
    requiredContent: ["originality-sole-submission","conference-extension-disclosure","co-author-approval","conflicts-of-interest","scope-justification-edics","reviewer-nominations"], 
    uniqueRequirements: "30% Rule: If extending a conference paper, must have ≥30% substantial new technical content. Must upload PDF of prior conference paper.", 
    toneGuidance: "technical-scope-justification" 
  },
  { 
    journalName: "The Lancet", required: true, maxPages: 1, shownToReviewers: false, 
    requiredContent: ["clinical-significance-worldwide","why-lancet-not-specialty","originality-statement","co-author-approval","overlapping-submissions","conflicts-of-interest","reviewer-suggestions"], 
    toneGuidance: "clinical-impact" 
  },
  { 
    journalName: "Cell", required: true, maxPages: null, shownToReviewers: false, 
    requiredContent: ["discovery-elevator-pitch","conceptual-advance-justification","related-manuscripts","competing-interests","reviewer-suggestions","reviewer-exclusions"], 
    uniqueRequirements: "Must justify mechanistic completeness of the biological discovery", 
    toneGuidance: "fundamental-biological-discovery" 
  },
  { 
    journalName: "PNAS", required: false, maxPages: 1, shownToReviewers: false, 
    requiredContent: ["multidisciplinary-significance","editor-classification-justification","major-minor-category","preprint-disclosure","dual-use-research-disclosure"], 
    toneGuidance: "multidisciplinary-significance" 
  },
  { 
    journalName: "NEJM", required: false, maxPages: 1, shownToReviewers: false, 
    requiredContent: ["clinical-impact-pitch","trial-registration","prior-publication-disclosure","co-author-approval"], 
    toneGuidance: "clinical-impact" 
  },
  { 
    journalName: "PLOS ONE", required: true, maxPages: 1, shownToReviewers: false, 
    requiredContent: ["findings-summary","relationship-to-prior-work","article-type-identification","previous-plos-interactions","academic-editor-suggestions","financial-disclosures"], 
    uniqueRequirements: "Suggest Academic Editors from the PLOS ONE editorial board. Evaluation based on methodological rigor, not perceived novelty.", 
    toneGuidance: "methodological-rigor" 
  },
  { 
    journalName: "BMJ", required: true, maxPages: null, shownToReviewers: false, 
    requiredContent: ["importance-to-bmj-readership","novelty-summary","clinical-practice-policy-relevance","competing-interests","funding-sources"], 
    toneGuidance: "clinical-practice-policy" 
  },
  { 
    journalName: "Nature Medicine", required: true, maxPages: 1, shownToReviewers: false, 
    requiredContent: ["core-question-and-findings","translational-bridge","why-nature-medicine","related-manuscripts","reviewer-suggestions","reviewer-exclusions"], 
    uniqueRequirements: "Must explain the translational bridge: how basic mechanistic discoveries connect to human disease, clinical diagnosis, therapy, or patient management", 
    toneGuidance: "translational-medicine" 
  }
];
