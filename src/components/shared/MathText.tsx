
'use client';

import { InlineMath, BlockMath } from 'react-katex';

export function MathText({ text }: { text: string }) {
  // Simple parser for $...$ and $$...$$
  // It doesn't handle nested math or escaped dollars, but should be fine for this use case.
  if (!text) return null;
  
  const parts = text.split(/(\$\$[\s\S]*?\$\$|\$.*?\$)/g);

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          return <BlockMath key={index} math={part.slice(2, -2)} />;
        }
        if (part.startsWith('$') && part.endsWith('$')) {
          return <InlineMath key={index} math={part.slice(1, -1)} />;
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
}

    