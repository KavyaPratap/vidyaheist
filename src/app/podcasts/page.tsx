"use client";

import { CmsSectionView } from "@/components/shared/CmsSectionView";

export default function PodcastsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <CmsSectionView
        collectionName="podcasts"
        title="Podcasts & Success Stories"
        subtitle="Exclusive interviews with research scholars, professors, and toppers sharing academic breakthroughs and journey insights."
      />
    </div>
  );
}
