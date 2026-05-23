"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  ChevronDown,
  Lock,
  Unlock,
  Search,
  ArrowRight,
  GraduationCap,
  Sparkles,
  Phone,
  Mail,
  LogIn,
} from "lucide-react";
import { useUser } from "@/firebase";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

// ─── DATA ────────────────────────────────────────────────────────────────────

const categories = ["General", "OBC-NCL", "EWS", "SC", "ST", "PWD"] as const;
type Category = (typeof categories)[number];

type Row = { marks: string; college: string };

const data: Record<Category, Row[]> = {
  General: [
    { marks: "220+", college: "IISc Bangalore" },
    { marks: "210+", college: "IIT Madras" },
    { marks: "200+", college: "IISER Pune" },
    { marks: "190+", college: "IIT Guwahati" },
    { marks: "180+", college: "IISER Bhopal BTech" },
    { marks: "170+", college: "IISER Kolkata Data Science" },
    { marks: "160+", college: "IISER Kolkata BS-MS" },
    { marks: "155+", college: "IISER Mohali" },
    { marks: "140+", college: "IISER TVM" },
    { marks: "130+", college: "IACS Kolkata" },
    { marks: "125+", college: "IIEST Shibpur" },
    { marks: "115+", college: "IISER Tirupati Economics & Statistics" },
    { marks: "110+", college: "IISER Tirupati BS-MS" },
    { marks: "100+", college: "IISER Berhampur" },
  ],
  "OBC-NCL": [
    { marks: "190+", college: "IISc Bangalore" },
    { marks: "180+", college: "IIT Madras" },
    { marks: "170+", college: "IISER Pune" },
    { marks: "160+", college: "IIT Guwahati" },
    { marks: "150+", college: "IISER Bhopal BTech" },
    { marks: "140+", college: "IISER Kolkata" },
    { marks: "135+", college: "IISER Kolkata BS-MS" },
    { marks: "125+", college: "IISER Mohali" },
    { marks: "120+", college: "IISER TVM" },
    { marks: "115+", college: "IACS Kolkata" },
    { marks: "110+", college: "IIEST Shibpur" },
    { marks: "100+", college: "IISER Tirupati" },
    { marks: "90+",  college: "IISER Berhampur" },
  ],
  EWS: [
    { marks: "195+", college: "IISc Bangalore" },
    { marks: "185+", college: "IIT Madras" },
    { marks: "175+", college: "IISER Pune" },
    { marks: "165+", college: "IIT Guwahati" },
    { marks: "155+", college: "IISER Bhopal BTech" },
    { marks: "145+", college: "IISER Kolkata" },
    { marks: "140+", college: "IISER Kolkata BS-MS" },
    { marks: "130+", college: "IISER Mohali" },
    { marks: "125+", college: "IISER TVM" },
    { marks: "120+", college: "IACS Kolkata" },
    { marks: "115+", college: "IIEST Shibpur" },
    { marks: "105+", college: "IISER Tirupati" },
    { marks: "95+",  college: "IISER Berhampur" },
  ],
  SC: [
    { marks: "150+", college: "IISc Bangalore" },
    { marks: "140+", college: "IIT Madras" },
    { marks: "130+", college: "IISER Pune" },
    { marks: "120+", college: "IIT Guwahati" },
    { marks: "110+", college: "IISER Bhopal BTech" },
    { marks: "100+", college: "IISER Kolkata" },
    { marks: "90+",  college: "IISER Mohali" },
    { marks: "80+",  college: "IISER TVM" },
    { marks: "75+",  college: "IACS Kolkata" },
    { marks: "65+",  college: "IIEST Shibpur" },
    { marks: "60+",  college: "IISER Tirupati" },
    { marks: "50+",  college: "IISER Berhampur" },
  ],
  ST: [
    { marks: "130+", college: "IISc Bangalore" },
    { marks: "120+", college: "IIT Madras" },
    { marks: "110+", college: "IISER Pune" },
    { marks: "100+", college: "IIT Guwahati" },
    { marks: "90+",  college: "IISER Bhopal" },
    { marks: "80+",  college: "IISER Kolkata" },
    { marks: "70+",  college: "IISER Mohali" },
    { marks: "60+",  college: "IISER TVM" },
    { marks: "50+",  college: "IACS Kolkata" },
    { marks: "45+",  college: "IIEST Shibpur" },
    { marks: "40+",  college: "IISER Tirupati" },
    { marks: "35+",  college: "IISER Berhampur" },
  ],
  PWD: [
    { marks: "110+", college: "IISER Pune" },
    { marks: "100+", college: "IIT Guwahati" },
    { marks: "90+",  college: "IISER Bhopal" },
    { marks: "80+",  college: "IISER Kolkata" },
    { marks: "70+",  college: "IISER Mohali" },
    { marks: "60+",  college: "IISER TVM" },
    { marks: "50+",  college: "IACS Kolkata" },
    { marks: "45+",  college: "IIEST Shibpur" },
    { marks: "40+",  college: "IISER Tirupati" },
    { marks: "35+",  college: "IISER Berhampur" },
  ],
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function getBestCollege(marks: number, category: Category): Row | null {
  const rows = data[category];
  for (const row of rows) {
    const threshold = parseInt(row.marks.replace("+", ""));
    if (marks >= threshold) return row;
  }
  return null;
}

function getRankInCategory(marks: number, category: Category): number {
  const rows = data[category];
  for (let i = 0; i < rows.length; i++) {
    const threshold = parseInt(rows[i].marks.replace("+", ""));
    if (marks >= threshold) return i + 1;
  }
  return rows.length + 1;
}

// ─── CONTACT GATE ─────────────────────────────────────────────────────────────

function ContactGate({ onUnlock }: { onUnlock: () => void }) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emailOk = email.trim().length > 0 && /\S+@\S+\.\S+/.test(email.trim());
    const phoneOk = phone.trim().length >= 10;
    if (!emailOk && !phoneOk) {
      setError("Please enter a valid email OR phone number to view results.");
      return;
    }
    setError("");
    toast({ title: "Access granted!", description: "You can now see predictions." });
    onUnlock();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-md mx-auto mt-8"
    >
      <div className="relative hybrid-clay-card p-8">

        <div className="relative text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/15 mb-4">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-2xl font-bold mb-1">Unlock Your Prediction</h3>
          <p className="text-muted-foreground text-sm">
            Enter your email <span className="text-primary font-medium">OR</span> phone number — at least one is required.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 relative">
          <div className="flex items-center gap-3 bg-secondary/50 border border-border rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-primary transition-all">
            <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-transparent border-none outline-none w-full text-sm text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div className="text-center text-xs text-muted-foreground font-semibold tracking-widest uppercase">— OR —</div>

          <div className="flex items-center gap-3 bg-secondary/50 border border-border rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-primary transition-all">
            <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <input
              type="tel"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="bg-transparent border-none outline-none w-full text-sm text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {error && <p className="text-destructive text-xs font-medium text-center">{error}</p>}

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
          >
            <Unlock className="w-4 h-4" />
            View My Prediction
          </button>
        </form>

        <div className="relative mt-6 pt-6 border-t border-border/50 text-center">
          <p className="text-xs text-muted-foreground mb-3">Already have an account?</p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            <LogIn className="w-4 h-4" />
            Login for full access
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// ─── RESULT DISPLAY ───────────────────────────────────────────────────────────

function PredictionResult({
  marks,
  category,
}: {
  marks: number;
  category: Category;
}) {
  const best = getBestCollege(marks, category);
  const rank = getRankInCategory(marks, category);
  const rows = data[category];
  const total = rows.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="mt-8 space-y-6"
    >
      {/* Highlight card */}
      <div className="relative hybrid-clay-card overflow-hidden">
        <div className="relative p-8 flex flex-col md:flex-row items-center gap-6">
          <div className="flex-shrink-0 w-20 h-20 rounded-2xl bg-primary/15 flex items-center justify-center">
            <Trophy className="w-10 h-10 text-primary" />
          </div>
          <div className="text-center md:text-left">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-1">
              Best Expected College
            </p>
            {best ? (
              <>
                <h3 className="text-3xl font-extrabold text-foreground">{best.college}</h3>
                <p className="text-primary font-medium mt-1">
                  Marks threshold: {best.marks} · Category: {category}
                </p>
              </>
            ) : (
              <h3 className="text-2xl font-bold text-muted-foreground">
                Score needs improvement — below minimum threshold
              </h3>
            )}
          </div>
        </div>
      </div>

      {/* Rank badge */}
      {best && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: "Your Score", value: `${marks}`, sub: "marks" },
            { label: "Tier Rank", value: `#${rank}`, sub: `out of ${total} tiers` },
            { label: "Category", value: category, sub: "reservation" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-secondary/30 p-5 text-center">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-1">{s.label}</p>
              <p className="text-2xl font-extrabold text-primary">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Full table */}
      <div>
        <h4 className="text-lg font-bold mb-3 flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-primary" />
          Full {category} Cutoff Table
        </h4>
        <div className="rounded-2xl border border-border overflow-hidden shadow-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-primary/10 border-b border-border">
                <th className="px-5 py-3.5 text-left font-bold text-foreground">Min. Marks</th>
                <th className="px-5 py-3.5 text-left font-bold text-foreground">Expected Best College</th>
                <th className="px-5 py-3.5 text-right font-bold text-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const threshold = parseInt(row.marks.replace("+", ""));
                const achieved = marks >= threshold;
                return (
                  <tr
                    key={i}
                    className={`border-b last:border-0 transition-colors ${
                      achieved
                        ? "bg-green-500/5 hover:bg-green-500/10"
                        : "hover:bg-secondary/30"
                    }`}
                  >
                    <td className="px-5 py-4 font-bold text-primary">{row.marks}</td>
                    <td className="px-5 py-4 text-foreground">{row.college}</td>
                    <td className="px-5 py-4 text-right">
                      {achieved ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 dark:text-green-400 bg-green-500/10 px-2.5 py-1 rounded-full">
                          ✓ Eligible
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-3 text-center">
          * Based on IAT 2026 expected cutoffs. Actual results may vary. Data is indicative only.
        </p>
      </div>
    </motion.div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function PredictorPage() {
  const { user } = useUser();

  const [marksInput, setMarksInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category>("General");
  const [hasSearched, setHasSearched] = useState(false);
  const [contactUnlocked, setContactUnlocked] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const marks = parseInt(marksInput) || 0;
  const canShowResult = user || contactUnlocked;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!marksInput || marks < 0 || marks > 300) return;
    setHasSearched(true);
  };

  return (
    <div className="max-w-4xl mx-auto min-h-[80vh]">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl mb-8 mt-2">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/80 to-accent/60" />
        <div className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.15) 0%, transparent 50%),
                              radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)`
          }}
        />
        {/* Animated rings */}
        <div className="absolute top-1/2 right-10 -translate-y-1/2 w-64 h-64 border border-white/10 rounded-full animate-[spin_20s_linear_infinite]" />
        <div className="absolute top-1/2 right-16 -translate-y-1/2 w-40 h-40 border border-white/20 rounded-full animate-[spin_15s_linear_infinite_reverse]" />

        <div className="relative px-8 py-12 md:px-16 md:py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-semibold text-white mb-4">
              <Sparkles className="w-4 h-4" />
              IAT 2026 · All Categories
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
              Marks vs College
              <br />
              <span className="text-white/80">Predictor</span>
            </h1>
            <p className="text-white/75 text-lg leading-relaxed max-w-lg">
              Enter your IAT 2026 expected score and category to instantly see
              which IISERs, IISc, IITs & NISER you can target.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Input Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="hybrid-clay-card p-6 md:p-8 mb-6"
      >
        <h2 className="text-xl font-bold mb-5 flex items-center gap-2">
          <Search className="w-5 h-5 text-primary" />
          Enter Your Details
        </h2>
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          {/* Marks input */}
          <div className="flex-1">
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
              Your Score (out of 300)
            </label>
            <input
              type="number"
              min={0}
              max={300}
              value={marksInput}
              onChange={(e) => setMarksInput(e.target.value)}
              placeholder="e.g. 175"
              className="w-full rounded-xl border border-border bg-secondary/50 px-4 py-3 text-lg font-bold text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary transition-all"
              required
            />
          </div>

          {/* Category dropdown */}
          <div className="flex-1 relative">
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
              Category
            </label>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full rounded-xl border border-border bg-secondary/50 px-4 py-3 text-left text-base font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary transition-all flex items-center justify-between"
            >
              {selectedCategory}
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="absolute z-50 mt-1.5 w-full rounded-xl border border-border bg-card shadow-2xl overflow-hidden"
                >
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors hover:bg-primary/10 hover:text-primary ${
                        selectedCategory === cat ? "bg-primary/10 text-primary font-bold" : "text-foreground"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 hover:scale-[1.03] active:scale-[0.97] transition-all shadow-lg text-base"
            >
              Predict <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </motion.div>

      {/* Results */}
      <AnimatePresence>
        {hasSearched && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {canShowResult ? (
              <PredictionResult marks={marks} category={selectedCategory} />
            ) : (
              <ContactGate onUnlock={() => setContactUnlocked(true)} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
