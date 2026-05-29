"use client";

import { CmsSectionView } from "@/components/shared/CmsSectionView";

export default function BlogsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <CmsSectionView
        collectionName="blogs"
        title="Preparation Blogs & Strategies"
        subtitle="High-yield exam preparation guidelines, scientific career planning resources, subject-wise weightages, and notes curated by toppers."
      />
    </div>
  );
}
