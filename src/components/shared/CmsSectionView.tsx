"use client";

import { useEffect, useState } from "react";
import { useFirestore } from "@/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { Loader2, Sparkles, BookOpen, Clock, Calendar, ArrowUpRight, Sigma, HelpCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MathText } from "@/components/shared/MathText";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

type CmsItem = {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  coverImage: string | null;
  linkUrl: string | null;
  content: string;
  createdAt?: any;
};

interface CmsSectionProps {
  collectionName: "researchHub" | "blogs" | "podcasts" | "resources";
  title: string;
  subtitle: string;
  accentColor?: string;
}

export function CmsSectionView({ collectionName, title, subtitle, accentColor = "primary" }: CmsSectionProps) {
  const firestore = useFirestore();
  const [items, setItems] = useState<CmsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeReadItem, setActiveReadItem] = useState<CmsItem | null>(null);

  useEffect(() => {
    if (!firestore) return;

    const fetchItems = async () => {
      try {
        const q = query(
          collection(firestore, "cms_content"),
          where("collection", "==", collectionName),
          where("status", "==", "published")
        );
        const snap = await getDocs(q);
        const docs = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as CmsItem[];
        
        // Sort by date if available
        docs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setItems(docs);
      } catch (err) {
        console.error("Error loading public CMS items:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [firestore, collectionName]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-sm font-bold text-muted-foreground animate-pulse">Loading {title}...</p>
      </div>
    );
  }

  // ----------------------------------------------------
  // GORGEOUS "COMING SOON" ANIMATED WIDGET IF EMPTY
  // ----------------------------------------------------
  if (items.length === 0) {
    return (
      <div className="relative min-h-[75vh] flex items-center justify-center overflow-hidden py-12 px-4">
        {/* Floating Background Particles */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <motion.div
            animate={{ y: [0, -30, 0], x: [0, 20, 0] }}
            transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
            className="absolute top-1/4 left-1/4 text-primary opacity-40"
          >
            <Sigma className="w-12 h-12" />
          </motion.div>
          <motion.div
            animate={{ y: [0, 45, 0], x: [0, -30, 0] }}
            transition={{ repeat: Infinity, duration: 11, ease: "easeInOut" }}
            className="absolute bottom-1/4 right-1/4 text-secondary opacity-40"
          >
            <Sparkles className="w-10 h-10" />
          </motion.div>
          <div className="absolute top-1/3 right-10 bg-primary/10 w-48 h-48 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/3 left-10 bg-secondary/15 w-64 h-64 rounded-full blur-3xl animate-pulse" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative max-w-2xl text-center space-y-8 z-10"
        >
          {/* Main sparkling coming soon badge */}
          <div className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/20 text-primary text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider animate-pulse">
            <Sparkles className="w-3.5 h-3.5" /> Launching Soon
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-br from-foreground via-foreground to-primary">
              {title}
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto font-semibold">
              Our experts and top researchers from IISERs & NISER are compiling high-yield strategies, profile templates, and dynamic cutoffs for you.
            </p>
          </div>

          {/* Spectacular loading orbit visual animation */}
          <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
            {/* Outer Orbit */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
              className="absolute inset-0 border-2 border-dashed border-primary/30 rounded-full"
            />
            {/* Inner Orbit */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
              className="absolute inset-4 border border-secondary/20 rounded-full flex items-center justify-between"
            >
              <div className="w-2.5 h-2.5 bg-primary rounded-full animate-ping" />
              <div className="w-2 h-2 bg-secondary rounded-full" />
            </motion.div>
            {/* Center Glowing Logo Icon */}
            <div className="w-16 h-16 rounded-full bg-card border-2 border-primary/20 shadow-lg flex items-center justify-center bg-gradient-to-br from-card to-primary/5">
              <BookOpen className="w-8 h-8 text-primary animate-pulse" />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild variant="outline" className="rounded-full px-8 py-5 font-bold">
              <Link href="/dashboard">Return to Dashboard</Link>
            </Button>
            <Button
              onClick={() => {
                alert("Thank you! We will notify you the moment this section goes live! 🎉");
              }}
              className="rounded-full px-8 py-5 font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:scale-103 transition-transform"
            >
              Get Notified on Launch
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ----------------------------------------------------
  // GORGEOUS CMS CARD VIEW IF CONTENT EXISTS
  // ----------------------------------------------------
  return (
    <div className="space-y-12 py-6">
      {/* Header Info */}
      <div className="space-y-2">
        <h1 className="text-4xl sm:text-5xl font-black text-foreground tracking-tight">{title}</h1>
        <p className="text-muted-foreground text-sm sm:text-base font-semibold max-w-2xl">{subtitle}</p>
      </div>

      {/* Primary responsive grid cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group flex flex-col bg-card border-2 border-primary/10 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-card via-card to-primary/[0.02] hover:-translate-y-1"
          >
            {/* Visual Cover Banner Graphic */}
            <div className="relative w-full h-48 overflow-hidden bg-muted">
              {item.coverImage ? (
                <Image
                  src={item.coverImage}
                  alt={item.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-primary/5 text-primary">
                  <BookOpen className="w-12 h-12 opacity-30" />
                </div>
              )}
              {item.category && (
                <span className="absolute top-4 left-4 bg-background/95 backdrop-blur-md border border-primary/20 text-primary text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-sm">
                  {item.category}
                </span>
              )}
            </div>

            {/* Body */}
            <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <h3 className="font-extrabold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-2">
                  {item.title}
                </h3>
                {item.description && (
                  <p className="text-muted-foreground text-xs font-semibold line-clamp-3 leading-relaxed">
                    {item.description}
                  </p>
                )}
              </div>

              {/* Action trigger button */}
              <div className="pt-2 border-t flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground font-bold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Verified Guide
                </span>
                
                {item.linkUrl ? (
                  <a
                    href={item.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-black text-primary hover:underline"
                  >
                    Open Resource <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <button
                    onClick={() => setActiveReadItem(item)}
                    className="inline-flex items-center gap-1 text-xs font-black text-primary hover:underline"
                  >
                    Read Guide <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ----------------------------------------------------
          HIGH-FIDELITY DETAILED READING OVERLAY DIALOG
         ---------------------------------------------------- */}
      <AnimatePresence>
        {activeReadItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveReadItem(null)}
              className="fixed inset-0 bg-background/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-4xl bg-card border-2 border-primary/20 shadow-2xl rounded-[2.5rem] overflow-hidden z-10 flex flex-col max-h-[85vh]"
            >
              {/* Close controls */}
              <button
                onClick={() => setActiveReadItem(null)}
                className="absolute top-4 right-4 bg-background/80 backdrop-blur border border-primary/10 text-muted-foreground hover:text-foreground p-2 rounded-full shadow-lg z-20 transition-all hover:scale-105"
              >
                <ArrowLeft className="w-4 h-4 inline-block mr-1.5" /> Back to list
              </button>

              {/* Scrollable details */}
              <div className="overflow-y-auto p-6 sm:p-10 space-y-6 pt-16">
                <div className="space-y-3">
                  <span className="bg-primary/10 text-primary border border-primary/25 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full">
                    {activeReadItem.category || "Resource"}
                  </span>
                  <h2 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight">
                    {activeReadItem.title}
                  </h2>
                  {activeReadItem.description && (
                    <p className="text-muted-foreground text-sm font-semibold italic">
                      {activeReadItem.description}
                    </p>
                  )}
                </div>

                {activeReadItem.coverImage && (
                  <div className="relative w-full h-64 sm:h-96 rounded-2xl overflow-hidden shadow-inner border">
                    <Image
                      src={activeReadItem.coverImage}
                      alt={activeReadItem.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                {/* Mathematical content body details */}
                <div className="unselectable bg-background/40 border rounded-2xl p-6 sm:p-8 prose prose-slate dark:prose-invert max-w-none shadow-inner leading-relaxed">
                  <MathText text={activeReadItem.content} />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
