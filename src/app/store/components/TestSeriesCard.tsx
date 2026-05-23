
"use client";

import type { TestSeriesType, PurchaseType } from "@/lib/types";
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
    <div className="hybrid-clay-card flex flex-col h-full overflow-hidden">
      <div className="relative h-48 w-full overflow-hidden rounded-t-[22px] border-b border-border/50">
        <Image
          src={series.imageUrl || "https://picsum.photos/seed/course/600/400"}
          alt={series.name}
          fill
          className="object-cover"
        />
        {!isUnlocked && (
           <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center">
              <div className="bg-primary text-primary-foreground p-3 rounded-full shadow-2xl border border-foreground/10">
                <Lock className="w-6 h-6" />
              </div>
           </div>
        )}
      </div>
      <div className="p-6 flex flex-col flex-grow">
        <div className="flex justify-between items-start gap-2 mb-3">
           <h3 className="text-xl font-extrabold text-foreground leading-snug">{series.name}</h3>
           {purchaseStatus === 'pending' && <span className="bg-yellow-500/20 text-yellow-500 text-[10px] px-2.5 py-1 rounded-full font-extrabold border border-yellow-500/30">VERIFYING</span>}
           {purchaseStatus === 'verified' && <span className="bg-green-500/20 text-green-400 text-[10px] px-2.5 py-1 rounded-full font-extrabold border border-green-500/30">UNLOCKED</span>}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-3 mb-5 leading-relaxed">{series.description}</p>
        <div className="mt-auto space-y-2 text-sm text-muted-foreground font-semibold flex items-center gap-2">
          <BookCheck className="w-4 h-4 text-primary" /> <span>{series.subject}</span>
        </div>
      </div>
      <div className="flex justify-between items-center p-6 pt-0 mt-2">
        <p className="text-2xl font-black text-primary">{isFree ? 'FREE' : `₹${series.price}`}</p>
        <div className="flex gap-2">
          {isAdmin && (
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link href={`/admin/edit-quiz/${series.id}`}>Edit</Link>
            </Button>
          )}
          <Button asChild size="sm" className="rounded-full px-6 font-extrabold hover:scale-105 active:scale-95 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
            <Link href={isUnlocked ? `/store/${series.id}` : `/checkout/${series.id}`}>
              {isUnlocked ? 'Start' : 'Buy Now'}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
