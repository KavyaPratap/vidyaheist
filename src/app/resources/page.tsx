"use client";

import { CmsSectionView } from "@/components/shared/CmsSectionView";

export default function ResourcesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <CmsSectionView
        collectionName="resources"
        title="Formula Sheets & Cutoffs Directory"
        subtitle="Downloadable worksheets, historical rank cutoffs, chapter-wise physics formulas, and dynamic PDFs managed by our team."
      />
    </div>
  );
}
