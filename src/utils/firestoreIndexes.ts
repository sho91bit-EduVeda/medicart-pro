// Firestore indexes for optimized queries
// This file documents the required indexes for the application

/*
Collection: offers
Query: enabled == true ORDER BY created_at DESC
Index Type: Composite
*/

export const requiredIndexes = {
  offers: {
    query: "enabled == true ORDER BY created_at DESC",
    fields: [
      { fieldPath: "enabled", mode: "ASCENDING" },
      { fieldPath: "created_at", mode: "DESCENDING" }
    ]
  }
};