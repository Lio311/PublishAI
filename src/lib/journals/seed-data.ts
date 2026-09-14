export const INITIAL_JOURNALS = [
  {
    name: "Nature",
    field: "Multidisciplinary",
    instructionsUrl: "https://www.nature.com/nature/for-authors/initial-submission",
    citationStyle: "Nature",
    wordLimit: 3000,
    abstractLimit: 150,
    rules: {
      sections: ["Abstract", "Introduction", "Results", "Discussion", "Methods", "References"],
      notes: "High impact, extremely concise formatting required."
    }
  },
  {
    name: "Science",
    field: "Multidisciplinary",
    instructionsUrl: "https://www.science.org/content/page/instructions-authors",
    citationStyle: "Science",
    wordLimit: 2500,
    abstractLimit: 125,
    rules: {
      sections: ["Abstract", "One-sentence summary", "Main Text", "References"],
      notes: "Focus on general scientific audience."
    }
  },
  {
    name: "IEEE Transactions on Pattern Analysis and Machine Intelligence (TPAMI)",
    field: "Computer Science",
    instructionsUrl: "https://www.computer.org/csdl/journal/tp",
    citationStyle: "IEEE",
    wordLimit: 10000,
    abstractLimit: 200,
    rules: {
      sections: ["Abstract", "Introduction", "Related Work", "Methodology", "Experiments", "Conclusion", "References"],
      notes: "Math-heavy, two-column format."
    }
  }
];
