
"use client";

import type { TestSeriesType, PurchaseType } from "@/lib/types";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { BookCheck, Edit, ListChecks, Lock, CheckCircle2, Clock3 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser, useCollectionQuery } from "@/firebase";
import { useMemo } from "react";

type TestSeriesCardProps = {
  series: TestSeriesType;
  isAdmin?: boolean;
};

export function TestSeriesCard({ series, isAdmin }: TestSeriesCardProps) {
  const router = useRouter();
  const { user } = useUser();

  const { data: purchases } = useCollectionQuery<PurchaseType>(
    "purchases",
    "userId",
    "==",
    user?.uid || null
  );

  const purchaseStatus = useMemo(() => {
    if (!user) return null;
    const p = purchases?.find(p => p.seriesId === series.id);
    return p ? p.status : null;
  }, [purchases, series.id, user]);

  const isFree = series.price === 0;
  const isUnlocked = isFree || purchaseStatus === 'verified' || isAdmin;

  return (
    <Card className="flex flex-col h-full overflow-hidden transition-all hover:shadow-lg border-2 border-transparent hover:border-primary/20">
      <CardHeader className="p-0 relative h-48">
        <Image
          src={series.imageUrl || "https://picsum.photos/seed/course/600/400"}
          alt={series.name}
          fill
          className="object-cover"
        />
        {!isUnlocked && (
           <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center">
              <div className="bg-primary text-primary-foreground p-2 rounded-full shadow-xl">
                <Lock className="w-6 h-6" />
              </div>
           </div>
        )}
      </CardHeader>
      <div className="p-6 flex flex-col flex-grow">
        <div className="flex justify-between items-start gap-2 mb-2">
           <CardTitle className="text-xl">{series.name}</CardTitle>
           {purchaseStatus === 'pending' && <span className="bg-yellow-100 text-yellow-700 text-[10px] px-2 py-1 rounded-full font-bold">VERIFYING</span>}
           {purchaseStatus === 'verified' && <span className="bg-green-100 text-green-700 text-[10px] px-2 py-1 rounded-full font-bold">UNLOCKED</span>}
        </div>
        <CardDescription className="line-clamp-3 mb-4">{series.description}</CardDescription>
        <div className="mt-auto space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2"><BookCheck className="w-4 h-4" /> {series.subject}</div>
        </div>
      </div>
      <CardFooter className="flex justify-between items-center p-6 pt-0">
        <p className="text-xl font-bold text-primary">{isFree ? 'FREE' : `₹${series.price}`}</p>
        <div className="flex gap-2">
          {isAdmin && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/edit-quiz/${series.id}`}>Edit</Link>
            </Button>
          )}
          <Button asChild size="sm" className="rounded-full px-6">
            <Link href={isUnlocked ? `/store/${series.id}` : `/checkout/${series.id}`}>
              {isUnlocked ? 'Start' : 'Buy Now'}
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
