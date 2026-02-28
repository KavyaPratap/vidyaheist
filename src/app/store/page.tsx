
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TestSeriesCard } from "./components/TestSeriesCard";
import type { TestSeriesType } from "@/lib/types";
import { useUser, useFirestore } from "@/firebase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, PlusCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

export default function StorePage() {
  const [allTestSeries, setAllTestSeries] = useState<TestSeriesType[]>([]);
  const [filteredSeries, setFilteredSeries] = useState<TestSeriesType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const { user, loading: userLoading } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const firestore = useFirestore();

  useEffect(() => {
    if (!userLoading) {
      const adminUID = process.env.NEXT_PUBLIC_ADMIN_UID;
      if (user && adminUID && user.uid === adminUID) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    }
  }, [user, userLoading]);

  useEffect(() => {
    if (!firestore) return;
    
    const fetchInitialData = async () => {
      setLoading(true);
      setError(null);
      try {
        const seriesQuery = query(collection(firestore, "testSeries"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(seriesQuery);
        
        const mappedData = querySnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
        })) as TestSeriesType[];

        const questionBankSeries: TestSeriesType = {
          id: 'latex-question-bank',
          name: 'General Question Bank (from .tex)',
          description: 'A collection of questions rendered from a LaTeX file. This is a view-only document, not an interactive quiz.',
          price: 0,
          imageUrl: 'https://picsum.photos/seed/latex-questions/600/400',
          data_ai_hint: 'library books',
          subject: 'General',
          numberOfTests: 1,
          durationPerTest: null,
          createdAt: new Date().toISOString(),
        };

        setAllTestSeries([questionBankSeries, ...mappedData]);
        // Set initial filtered series to all, including the new one
        setFilteredSeries([questionBankSeries, ...mappedData]);
      } catch (err: any) {
        console.error("Error fetching test series:", err);
        setError("Failed to load test series. Please try again later.");
        
        // Also add the static bank even if firestore fails
        const questionBankSeries: TestSeriesType = {
          id: 'latex-question-bank',
          name: 'General Question Bank (from .tex)',
          description: 'A collection of questions rendered from a LaTeX file. This is a view-only document, not an interactive quiz.',
          price: 0,
          imageUrl: 'https://picsum.photos/seed/latex-questions/600/400',
          data_ai_hint: 'library books',
          subject: 'General',
          numberOfTests: 1,
          durationPerTest: null,
          createdAt: new Date().toISOString(),
        };
        setAllTestSeries([questionBankSeries]);
        setFilteredSeries([questionBankSeries]);

      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [firestore]); 

  useEffect(() => {
    let seriesToDisplay = allTestSeries;
    if (activeTab === "jee") {
      seriesToDisplay = allTestSeries.filter(
        (series) => series.subject && series.subject.toLowerCase().includes("jee")
      );
    } else if (activeTab === "neet") {
      seriesToDisplay = allTestSeries.filter(
        (series) => series.subject && series.subject.toLowerCase().includes("neet")
      );
    } else if (activeTab === "iat") {
      seriesToDisplay = allTestSeries.filter(
        (series) => series.subject && series.subject.toLowerCase().includes("iat")
      );
    }
    setFilteredSeries(seriesToDisplay);
  }, [activeTab, allTestSeries]);

  return (
    <div className="space-y-8">
      <section className="text-center py-8 bg-primary/5 rounded-lg relative">
        <h1 className="text-4xl font-bold tracking-tight text-primary">Test Series Store</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Find the perfect test series to boost your exam preparation.
        </p>
        {isAdmin && (
          <div className="absolute top-4 right-4">
            <Button asChild variant="outline" size="lg">
              <Link href="/admin/create-quiz">
                <PlusCircle className="mr-2 h-5 w-5" /> Create New Test Series
              </Link>
            </Button>
          </div>
        )}
      </section>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 md:w-1/2 mx-auto">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="jee">JEE</TabsTrigger>
          <TabsTrigger value="iat">IAT</TabsTrigger>
          <TabsTrigger value="neet">NEET</TabsTrigger>
        </TabsList>

        {loading && !error && ( 
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="ml-3 text-muted-foreground">Loading series...</p>
          </div>
        )}

        {error && ( 
            <Alert variant="destructive" className="my-8 max-w-lg mx-auto">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}

        {!loading && (
          <TabsContent value={activeTab} forceMount>
              {filteredSeries.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-6">
                  {filteredSeries.map((series) => (
                    <TestSeriesCard key={series.id} series={series} isAdmin={isAdmin} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-xl text-muted-foreground">
                    No test series available in the '{activeTab}' category yet.
                  </p>
                </div>
              )}
            </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
