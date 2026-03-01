"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { GitBranch, ExternalLink } from "lucide-react";

export default function PredictorPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-16rem)] py-12">
      <Card className="w-full max-w-lg text-center shadow-xl">
        <CardHeader>
          <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
            <GitBranch className="w-10 h-10 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold text-primary">
            Rank Predictor
          </CardTitle>
          <CardDescription className="pt-2">
            Visit our dedicated Rank Predictor tool on our other website to estimate your exam rank based on your performance.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            Click the button below to be redirected.
          </p>
          <Button asChild size="lg">
            {/* TODO: Replace "#" with the actual URL to your rank predictor website */}
            <Link href="#" target="_blank" rel="noopener noreferrer">
              Go to Rank Predictor <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
