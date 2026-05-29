"use client";

import { useEffect, useState } from "react";
import { useFirestore } from "@/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { X, Sparkles, ArrowRight, Megaphone, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MathText } from "@/components/shared/MathText";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";

type PromoItem = {
  slug: string;
  title: string;
  description: string;
  category: string;
  coverImage: string | null;
  linkUrl: string | null;
  content: string;
  status: string;
  updatedAt?: { seconds: number } | any;
};

export function GlobalPromoModal() {
  const firestore = useFirestore();
  const [promos, setPromos] = useState<PromoItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!firestore) return;

    const checkPromos = async () => {
      try {
        const q = query(
          collection(firestore, "cms_content"),
          where("collection", "==", "globalAnnouncement"),
          where("status", "==", "published")
        );
        const querySnapshot = await getDocs(q);
        
        const activeUnseen: PromoItem[] = [];
        const dismissedMap = JSON.parse(localStorage.getItem("vidyaheist_dismissed_promos") || "{}");

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const slug = doc.id;
          const lastUpdated = data.updatedAt?.seconds || 0;

          // If the user hasn't dismissed this specific announcement version yet, show it
          if (dismissedMap[slug] !== String(lastUpdated)) {
            activeUnseen.push({
              slug,
              title: data.title,
              description: data.description,
              category: data.category,
              coverImage: data.coverImage,
              linkUrl: data.linkUrl,
              content: data.content,
              status: data.status,
              updatedAt: data.updatedAt,
            });
          }
        });

        if (activeUnseen.length > 0) {
          setPromos(activeUnseen);
          setCurrentIndex(0);
          // Trigger modal after a slight delay for high-end feel
          setTimeout(() => {
            setIsOpen(true);
          }, 2000);
        }
      } catch (err) {
        console.error("Error loading global promotion announcements:", err);
      }
    };

    checkPromos();
  }, [firestore]);

  const currentPromo = promos[currentIndex];

  const handleDismissCurrent = () => {
    if (!currentPromo) return;

    // Save dismissed timestamp for this specific announcement slug
    const dismissedMap = JSON.parse(localStorage.getItem("vidyaheist_dismissed_promos") || "{}");
    const lastUpdated = currentPromo.updatedAt?.seconds || 0;
    dismissedMap[currentPromo.slug] = String(lastUpdated);
    localStorage.setItem("vidyaheist_dismissed_promos", JSON.stringify(dismissedMap));

    // Transition to the next announcement if available
    if (currentIndex < promos.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsOpen(false);
    }
  };

  const handleDismissAll = () => {
    const dismissedMap = JSON.parse(localStorage.getItem("vidyaheist_dismissed_promos") || "{}");
    promos.forEach((p) => {
      const lastUpdated = p.updatedAt?.seconds || 0;
      dismissedMap[p.slug] = String(lastUpdated);
    });
    localStorage.setItem("vidyaheist_dismissed_promos", JSON.stringify(dismissedMap));
    setIsOpen(false);
  };

  const handleAction = () => {
    if (currentPromo) {
      const dismissedMap = JSON.parse(localStorage.getItem("vidyaheist_dismissed_promos") || "{}");
      const lastUpdated = currentPromo.updatedAt?.seconds || 0;
      dismissedMap[currentPromo.slug] = String(lastUpdated);
      localStorage.setItem("vidyaheist_dismissed_promos", JSON.stringify(dismissedMap));
    }
    setIsOpen(false);
    if (currentPromo?.linkUrl) {
      window.open(currentPromo.linkUrl, "_self");
    }
  };

  if (!currentPromo) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Blur backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleDismissAll}
            className="fixed inset-0 bg-background/80 backdrop-blur-md animate-fade-in"
          />

          {/* Premium modal panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="relative w-full max-w-2xl bg-card border-2 border-primary/20 shadow-2xl rounded-[2.5rem] overflow-hidden z-10 p-1 bg-gradient-to-br from-card via-card to-primary/[0.03]"
          >
            {/* Header graphic cover banner */}
            <AnimatePresence mode="wait">
              {currentPromo.coverImage && (
                <motion.div
                  key={currentPromo.slug + "_image"}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="relative w-full h-44 sm:h-56 rounded-t-[2.3rem] overflow-hidden"
                >
                  <Image
                    src={currentPromo.coverImage}
                    alt={currentPromo.title}
                    fill
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/45 to-transparent" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Absolute close button */}
            <button
              onClick={handleDismissAll}
              className="absolute top-4 right-4 bg-background/80 backdrop-blur border border-primary/10 text-muted-foreground hover:text-foreground hover:bg-background p-2 rounded-full shadow-lg z-20 transition-all hover:scale-105"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Scrollable announcement body */}
            <div className={`p-6 sm:p-8 space-y-6 ${currentPromo.coverImage ? "pt-2" : "pt-8"}`}>
              
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-primary/10 text-primary border border-primary/25 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1">
                      <Megaphone className="w-3 h-3" />
                      {currentPromo.category || "Announcement"}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-extrabold flex items-center gap-0.5">
                      <Sparkles className="w-3.5 h-3.5 text-secondary animate-pulse" />
                      NEW PLATFORM UPDATE
                    </span>
                  </div>

                  {/* Carousel Page Navigation Controls */}
                  {promos.length > 1 && (
                    <div className="flex items-center gap-2 bg-secondary/35 border border-primary/10 rounded-full px-2 py-0.5">
                      <button
                        onClick={() => setCurrentIndex((prev) => (prev > 0 ? prev - 1 : promos.length - 1))}
                        className="p-1 bg-background border border-primary/5 rounded-full text-muted-foreground hover:text-foreground hover:scale-105 transition-all"
                      >
                        <ChevronLeft className="w-3 h-3" />
                      </button>
                      <span className="text-[9px] font-extrabold text-foreground min-w-[28px] text-center">
                        {currentIndex + 1} of {promos.length}
                      </span>
                      <button
                        onClick={() => setCurrentIndex((prev) => (prev < promos.length - 1 ? prev + 1 : 0))}
                        className="p-1 bg-background border border-primary/5 rounded-full text-muted-foreground hover:text-foreground hover:scale-105 transition-all"
                      >
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentPromo.slug + "_text"}
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-2"
                  >
                    <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight leading-tight">
                      {currentPromo.title}
                    </h2>
                    {currentPromo.description && (
                      <p className="text-muted-foreground text-xs font-semibold italic">
                        {currentPromo.description}
                      </p>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Formatted body detail (Markdown/LaTeX) */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentPromo.slug + "_content"}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="unselectable max-h-[190px] overflow-y-auto pr-1 text-xs bg-background/50 border border-primary/10 rounded-2xl p-4 sm:p-5 prose prose-slate dark:prose-invert max-w-none shadow-inner"
                >
                  <MathText text={currentPromo.content} />
                </motion.div>
              </AnimatePresence>

              {/* Carousel sliding navigation dots */}
              {promos.length > 1 && (
                <div className="flex justify-center gap-1.5 py-1">
                  {promos.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        idx === currentIndex ? "w-6 bg-primary" : "w-1.5 bg-primary/20 hover:bg-primary/45"
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Navigation Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
                <Button
                  variant="ghost"
                  onClick={handleDismissAll}
                  className="rounded-full text-xs font-semibold text-muted-foreground hover:text-foreground order-3 sm:order-1"
                >
                  Dismiss All Updates
                </Button>

                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto order-1 sm:order-2">
                  <Button
                    variant="outline"
                    onClick={handleDismissCurrent}
                    className="rounded-full text-xs font-bold px-5"
                  >
                    {currentIndex < promos.length - 1 ? "Next Update ➔" : "Dismiss This Update"}
                  </Button>
                  {currentPromo.linkUrl && (
                    <Button
                      onClick={handleAction}
                      className="rounded-full px-6 py-4 text-xs font-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] hover:scale-103 transition-transform flex items-center justify-center gap-1 bg-primary"
                    >
                      Learn More <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
