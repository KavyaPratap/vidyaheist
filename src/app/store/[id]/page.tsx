
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser, useFirestore, useDoc, useCollection } from "@/firebase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, PlayCircle, Clock, BookOpen, ChevronLeft } from "lucide-react";
import type { TestSeriesType, TestType } from "@/lib/types";
import { collection, query, where, getDocs } from "firebase/firestore";
import { ADMIN_EMAIL } from "@/lib/constants";

export default function TestSelectionPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const seriesId = params.id as string;

  const { data: series, loading: seriesLoading } = useDoc<TestSeriesType>({ path: `testSeries/${seriesId}` });
  const { data: tests, loading: testsLoading } = useCollection<TestType>(`testSeries/${seriesId}/tests`);

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/signup");
      return;
    }

    const checkAccess = async () => {
      if (!user || !seriesId || !firestore) return;
      
      const isAdminUser = user.email === ADMIN_EMAIL;
      if (isAdminUser || series?.price === 0) {
        setIsUnlocked(true);
        setCheckingAccess(false);
        return;
      }

      const q = query(
        collection(firestore, "purchases"),
        where("userId", "==", user.uid),
        where("seriesId", "==", seriesId),
        where("status", "==", "verified")
      );
      const snap = await getDocs(q);
      if (snap.empty) {
        router.push(`/checkout/${seriesId}`);
      } else {
        setIsUnlocked(true);
      }
      setCheckingAccess(false);
    };

    if (series) checkAccess();
  }, [user, userLoading, seriesId, firestore, series, router]);

  if (seriesLoading || testsLoading || checkingAccess) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="animate-spin h-12 w-12 text-primary mb-4" />
        <p className="text-muted-foreground">Verifying access...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Button variant="ghost" onClick={() => router.push("/store")}>
        <ChevronLeft className="mr-2 h-4 w-4" /> Back to Store
      </Button>

      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-primary">{series?.name}</h1>
        <p className="text-muted-foreground">{series?.description}</p>
      </div>

      <div className="grid gap-4">
        {tests && tests.length > 0 ? (
          tests.sort((a, b) => a.order - b.order).map((test) => (
            <Card key={test.id} className="hover:border-primary/50 transition-colors shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-6">
                <div>
                  <CardTitle className="text-xl font-bold">{test.name}</CardTitle>
                  <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {test.duration} mins</span>
                    <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" /> Mock Exam</span>
                  </div>
                </div>
                <Button onClick={() => router.push(`/exam/${seriesId}/${test.id}`)} className="rounded-full px-6">
                  <PlayCircle className="mr-2 h-4 w-4" /> Start Test
                </Button>
              </CardHeader>
            </Card>
          ))
        ) : (
          <div className="text-center py-12 bg-muted/20 rounded-lg border-2 border-dashed">
            <p>No tests have been added to this series yet.</p>
            {user?.email === ADMIN_EMAIL && (
              <Button variant="outline" className="mt-4" onClick={() => router.push(`/admin/create-quiz?seriesId=${seriesId}`)}>
                Add First Test
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
