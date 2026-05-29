"use client";

import { CmsSectionView } from "@/components/shared/CmsSectionView";

export default function ResearchHubPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <CmsSectionView
        collectionName="researchHub"
        title="Research Hub Portal"
        subtitle="Explore detailed institute profiles, career scopes, admission guides, and strategy sessions for IISERs, IISc, NISER, and other elite research institutes."
      />
    </div>
  );
}
