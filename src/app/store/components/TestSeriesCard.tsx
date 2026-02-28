
import type { TestSeriesType } from "@/lib/types";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { BookCheck, Clock, Edit, ListChecks } from "lucide-react";

type TestSeriesCardProps = {
  series: TestSeriesType;
  isAdmin?: boolean;
};

export function TestSeriesCard({ series, isAdmin }: TestSeriesCardProps) {
  const defaultImageUrl = "https://placehold.co/600x400.png";
  const displayImageUrl = series.imageUrl || defaultImageUrl;

  const isLatexBank = series.id === 'latex-question-bank';
  const href = isLatexBank ? '/exam/latex-question-bank' : `/exam/${series.id}`;

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="p-0">
        <Image
          src={displayImageUrl}
          alt={series.name}
          width={600}
          height={400}
          className="rounded-t-lg object-cover aspect-[3/2]"
          data-ai-hint={series.data_ai_hint || (series.subject ? (series.subject.toLowerCase().includes("jee") ? "jee exam" : series.subject.toLowerCase().includes("neet") ? "neet medical" : "education online") : "education online")}
          unoptimized={!series.imageUrl} 
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.onerror = null; 
            target.src = defaultImageUrl;
          }}
        />
      </CardHeader>
      <div className="p-6 flex flex-col flex-grow">
        <CardTitle className="text-xl mb-2 hover:text-primary transition-colors">{series.name}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-grow">
          {series.description || "No description available."}
        </CardDescription>
        <div className="space-y-2 text-sm text-muted-foreground mb-4">
          {series.subject && (
            <div className="flex items-center">
              <BookCheck className="w-4 h-4 mr-2 text-accent" />
              <span>{series.subject}</span>
            </div>
          )}
          {series.numberOfTests != null && (
             <div className="flex items-center">
              <ListChecks className="w-4 h-4 mr-2 text-accent" />
              <span>{series.numberOfTests} {series.numberOfTests === 1 ? 'Part' : 'Tests'}</span>
            </div>
          )}
          {series.durationPerTest != null && (
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-2 text-accent" />
              <span>{series.durationPerTest} mins per test</span>
            </div>
          )}
        </div>
      </div>
      <CardFooter className="flex justify-between items-center mt-auto pt-0 p-6">
        <p className="text-2xl font-semibold text-primary">
          {isLatexBank ? 'Free' : `₹${series.price}`}
        </p>
        <div className="flex items-center gap-2">
            {isAdmin && !isLatexBank && (
              <Button asChild variant="outline" size="sm">
                <Link href={`/admin/edit-quiz/${series.id}`}> 
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </Link>
              </Button>
            )}
            <Button asChild size="sm">
              <Link href={href}>{isLatexBank ? 'Start Quiz' : 'View Details'}</Link>
            </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

    