import { db } from "./src/services/db";
import { scientificEntities, scientificRelationships } from "./src/services/db/schema";
import { v4 as uuid } from "uuid";

async function seed() {
  console.log("Seeding GraphRAG data...");
  const entities = [
    { id: uuid(), name: "Pembrolizumab", type: "drug", description: "PD-1 inhibitor" },
    { id: uuid(), name: "Nivolumab", type: "drug", description: "PD-1 inhibitor" },
    { id: uuid(), name: "PD-1", type: "protein", description: "Programmed cell death protein 1" },
    { id: uuid(), name: "PD-L1", type: "protein", description: "Programmed death-ligand 1" },
    { id: uuid(), name: "CD274", type: "gene", description: "Gene encoding PD-L1" },
    { id: uuid(), name: "Melanoma", type: "disease", description: "Skin cancer" },
    { id: uuid(), name: "Non-small cell lung cancer", type: "disease", description: "Lung cancer" },
    { id: uuid(), name: "Immunotherapy", type: "concept", description: "Treatment using immune system" },
    { id: uuid(), name: "T-cell exhaustion", type: "concept", description: "State of T-cell dysfunction" },
    { id: uuid(), name: "KEYNOTE-001", type: "study", description: "Phase 1 trial of pembrolizumab" },
    { id: uuid(), name: "CheckMate 017", type: "study", description: "Phase 3 trial of nivolumab" },
    { id: uuid(), name: "Immunohistochemistry", type: "method", description: "Staining method for proteins" },
  ];

  await db.insert(scientificEntities).values(entities as any).onConflictDoNothing();

  const getEntity = (name: string) => entities.find(e => e.name === name)!.id;

  const relationships = [
    { sourceEntityId: getEntity("Pembrolizumab"), targetEntityId: getEntity("PD-1"), relationshipType: "affects", evidenceText: "Binds to PD-1", confidenceScore: 0.99 },
    { sourceEntityId: getEntity("Nivolumab"), targetEntityId: getEntity("PD-1"), relationshipType: "affects", evidenceText: "Binds to PD-1", confidenceScore: 0.99 },
    { sourceEntityId: getEntity("PD-L1"), targetEntityId: getEntity("PD-1"), relationshipType: "affects", evidenceText: "Ligand for PD-1", confidenceScore: 0.95 },
    { sourceEntityId: getEntity("CD274"), targetEntityId: getEntity("PD-L1"), relationshipType: "causes", evidenceText: "Encodes protein", confidenceScore: 1.0 },
    { sourceEntityId: getEntity("Pembrolizumab"), targetEntityId: getEntity("Melanoma"), relationshipType: "treats", evidenceText: "Approved for advanced melanoma", confidenceScore: 0.98 },
    { sourceEntityId: getEntity("Nivolumab"), targetEntityId: getEntity("Non-small cell lung cancer"), relationshipType: "treats", evidenceText: "Approved for NSCLC", confidenceScore: 0.97 },
    { sourceEntityId: getEntity("PD-1"), targetEntityId: getEntity("T-cell exhaustion"), relationshipType: "correlates", evidenceText: "Marker of exhaustion", confidenceScore: 0.85 },
    { sourceEntityId: getEntity("Immunotherapy"), targetEntityId: getEntity("Melanoma"), relationshipType: "treats", evidenceText: "Standard of care", confidenceScore: 0.92 },
    { sourceEntityId: getEntity("KEYNOTE-001"), targetEntityId: getEntity("Pembrolizumab"), relationshipType: "supports", evidenceText: "Clinical trial", confidenceScore: 0.99 },
    { sourceEntityId: getEntity("CheckMate 017"), targetEntityId: getEntity("Nivolumab"), relationshipType: "supports", evidenceText: "Clinical trial", confidenceScore: 0.99 },
    { sourceEntityId: getEntity("Immunohistochemistry"), targetEntityId: getEntity("PD-L1"), relationshipType: "correlates", evidenceText: "Used to measure expression", confidenceScore: 0.9 },
  ];

  await db.insert(scientificRelationships).values(relationships as any);
  console.log("Seeding complete!");
}

seed().catch(console.error);
