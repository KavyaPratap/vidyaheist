// src/app/counselling/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  School, 
  GraduationCap, 
  Library, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  Users,
  Star,
  Quote,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Lock,
  Unlock,
  Video,
  FileText,
  ExternalLink,
  PhoneCall,
  Sparkles,
  ChevronUp,
  ChevronDown,
  ListOrdered,
  BookOpen,
  Calendar,
  Clock,
  HelpCircle,
  Megaphone,
  Download,
  MessageSquare
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollectionQuery } from '@/firebase';
import { useToast } from "@/hooks/use-toast";
import { collection, addDoc, serverTimestamp, onSnapshot, query, where, orderBy, doc, setDoc } from "firebase/firestore";

const brochureFeatures = [
  {
    title: "All Round support",
    desc: "Complete operational tracking for IISER, NISER and research counseling cycles."
  },
  {
    title: "1-on-1 Guidance Support",
    desc: "Get personalized voice and video mentorship from verified IISER & NISER alumni."
  },
  {
    title: "Choice Filling Optimization",
    desc: "Strategically optimize your institute preference lists to fit your academic ranks."
  },
  {
    title: "AI College Predictor",
    desc: "Locate target seats with extreme precision matching expected cutoffs."
  },
  {
    title: "Parent Guidance Sessions",
    desc: "Special live webinars addressing scientific careers, placements, and salary scopes."
  },
  {
    title: "Zoom Live Strategy",
    desc: "Round-by-round strategy sessions explaining float, freeze, and backup choices."
  }
];

const testimonials = [
  {
    name: "Ankit Verma",
    college: "IIT Delhi (JoSAA)",
    text: "The choice filling strategy provided by VidyaHeist was the reason I got into my dream branch. They understand the trends perfectly!",
    rating: 5,
    image: "https://picsum.photos/seed/counsel1/100/100",
  },
  {
    name: "Sneha Rao",
    college: "IISER Mohali (IAT)",
    text: "Navigating the IISER preference list was so confusing until I spoke to the mentors here. Their 1-on-1 support is truly world-class.",
    rating: 5,
    image: "https://picsum.photos/seed/counsel2/100/100",
  },
  {
    name: "Patil Rohan",
    college: "COEP Pune (MHTCET)",
    text: "I was about to make a huge mistake in my CAP rounds. VidyaHeist corrected my list and saved my career. Grateful!",
    rating: 5,
    image: "https://picsum.photos/seed/counsel3/100/100",
  },
];

export default function CounsellingPage() {
  const [current, setCurrent] = useState(0);
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  // General Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [interest, setInterest] = useState("IAT & NEST");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Preference Reordering tool states
  const [rankInput, setRankInput] = useState("");
  const [categorySelect, setCategorySelect] = useState("General");
  const [preferenceList, setPreferenceList] = useState([
    "IISER Pune",
    "IISER Kolkata",
    "IISER Mohali",
    "IISER Bhopal",
    "IISER Thiruvananthapuram",
    "NISER Bhubaneswar",
    "CEBS Mumbai",
    "IISER Tirupati",
    "IISER Berhampur"
  ]);

  // Load user's purchases
  const { data: purchases, loading: purchasesLoading } = useCollectionQuery<any>(
    "purchases",
    "userId",
    "==",
    user?.uid || null
  );

  // Load dynamic CMS counselling assets
  const { data: cmsCounsellingItems } = useCollectionQuery<any>(
    "cms_content",
    "collection",
    "==",
    "counselling"
  );

  // Check if user is enrolled (Sudo / Admin gets instant access for previewing)
  const isEnrolled = useMemo(() => {
    if (!user) return false;
    if (user.email?.toLowerCase() === "vidyaheist@gmail.com") return true;
    const verifiedMatch = purchases?.find(
      (p) => p.seriesId === "counselling_2026" && p.status === "verified"
    );
    return !!verifiedMatch;
  }, [purchases, user]);

  // Segmented tab state for premium user view
  const [activeTab, setActiveTab] = useState<"resources" | "chat">("resources");

  // Counselling private chat states
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMsgText, setNewMsgText] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);

  useEffect(() => {
    if (!user || !firestore || !isEnrolled) return;
    
    const q = query(
      collection(firestore, "counselling_messages"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "asc")
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: any[] = [];
      snapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() });
      });
      setChatMessages(msgs);
    }, (error) => {
      console.error("Real-time chat load error:", error);
    });
    
    return () => unsubscribe();
  }, [user, firestore, isEnrolled]);

  // Check if student has unread messages from admin
  const hasUnreadFromAdmin = useMemo(() => {
    return chatMessages.some((msg) => msg.sender === "admin" && !msg.read);
  }, [chatMessages]);

  // Mark admin messages as read when student navigates to the chat tab
  useEffect(() => {
    if (!firestore || activeTab !== "chat" || chatMessages.length === 0) return;
    
    const unreadAdminMsgs = chatMessages.filter(
      (msg) => msg.sender === "admin" && !msg.read
    );
    
    if (unreadAdminMsgs.length === 0) return;
    
    unreadAdminMsgs.forEach(async (msg) => {
      try {
        const docRef = doc(firestore, "counselling_messages", msg.id);
        await setDoc(docRef, { read: true }, { merge: true });
      } catch (err) {
        console.error("Error marking admin message as read:", err);
      }
    });
  }, [activeTab, chatMessages, firestore]);

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsgText.trim() || !user || !firestore) return;
    
    setSendingMsg(true);
    try {
      await addDoc(collection(firestore, "counselling_messages"), {
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || "Student",
        userEmail: user.email,
        message: newMsgText.trim(),
        sender: "student",
        createdAt: serverTimestamp()
      });
      setNewMsgText("");
    } catch (error: any) {
      console.error("Failed to send chat message:", error);
      toast({
        title: "Send Error",
        description: "Failed to deliver your message. Try again.",
        variant: "destructive"
      });
    } finally {
      setSendingMsg(false);
    }
  };

  // Filter dynamic CMS assets
  const cmsZoomSessions = useMemo(() => {
    return cmsCounsellingItems?.filter(
      (item) => item.category?.toLowerCase() === "zoom" && item.status === "published"
    ) || [];
  }, [cmsCounsellingItems]);

  const cmsLinks = useMemo(() => {
    return cmsCounsellingItems?.filter(
      (item) => item.category?.toLowerCase() === "link" && item.status === "published"
    ) || [];
  }, [cmsCounsellingItems]);

  const cmsPdfs = useMemo(() => {
    return cmsCounsellingItems?.filter(
      (item) => item.category?.toLowerCase() === "pdf" && item.status === "published"
    ) || [];
  }, [cmsCounsellingItems]);

  // Handle re-ordering preferences
  const movePreference = (index: number, direction: 'up' | 'down') => {
    const list = [...preferenceList];
    if (direction === 'up' && index > 0) {
      const temp = list[index];
      list[index] = list[index - 1];
      list[index - 1] = temp;
    } else if (direction === 'down' && index < list.length - 1) {
      const temp = list[index];
      list[index] = list[index + 1];
      list[index + 1] = temp;
    }
    setPreferenceList(list);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore) return;

    if (!name.trim() || !phone.trim() || !message.trim()) {
      toast({
        title: "Required Fields",
        description: "Please fill all the fields before submitting.",
        variant: "destructive",
      });
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid 10-digit mobile number.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(firestore, "counsellingQueries"), {
        userId: user?.uid || null,
        userName: name,
        userEmail: user?.email || "anonymous@visitor.com",
        phone: phone,
        interest: interest,
        message: message,
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast({
        title: "Callback Request Submitted!",
        description: "Our counseling mentor will contact you shortly.",
      });

      setMessage("");
    } catch (err) {
      console.error(err);
      toast({
        title: "Submission Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const handlePrintPreference = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>VidyaHeist Counselling Preference List</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
            h1 { color: #2563eb; font-size: 24px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 5px; }
            .meta { font-size: 14px; color: #64748b; margin-bottom: 30px; font-weight: bold; }
            ol { padding-left: 20px; }
            li { font-size: 16px; margin-bottom: 12px; font-weight: 600; color: #0f172a; }
            .footer { margin-top: 50px; font-size: 12px; text-align: center; color: #94a3b8; border-top: 1px dashed #e2e8f0; padding-top: 15px; }
          </style>
        </head>
        <body>
          <h1>VidyaHeist IAT 2026 Choice-Filling Preference List</h1>
          <div class="meta">
            <span>Student Rank: ${rankInput || "Not Entered"}</span> &nbsp;|&nbsp; 
            <span>Category: ${categorySelect}</span> &nbsp;|&nbsp; 
            <span>Generated: ${new Date().toLocaleDateString()}</span>
          </div>
          <p>The following preference list has been custom-ordered by the candidate using the VidyaHeist Premium Counselling module. Review these choices during your choice filling locks.</p>
          <ol>
            ${preferenceList.map(pref => `<li>${pref}</li>`).join('')}
          </ol>
          <div class="footer">
            Generated via VidyaHeist Counselling & Research Guidance Portal. All Rights Reserved.
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleCheckoutRedirect = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please login to enroll in the premium counselling program.",
      });
      router.push("/login?redirect=/counselling");
    } else {
      router.push("/checkout/counselling_2026");
    }
  };

  // LOADER STATE FOR INITIAL DATABASE LOAD
  if (purchasesLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-sm font-bold text-muted-foreground animate-pulse">Loading counselling portal status...</p>
      </div>
    );
  }

  // ==========================================
  // VIEW A: PAID STUDENT PREMIUM DASHBOARD VIEW
  // ==========================================
  if (isEnrolled) {
    return (
      <div className="flex flex-col space-y-8 pb-20 px-4 max-w-7xl mx-auto">
        
        {/* Welcome Premium Header */}
        <section className="p-8 rounded-[2.5rem] border-2 border-primary/20 bg-gradient-to-r from-primary/10 via-background to-accent/5 shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6 mt-4">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-3xl -mr-20 -mt-20" />
          <div className="space-y-3 relative z-10 text-center md:text-left">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/20 border border-accent/30 px-4 py-1 text-xs font-black text-accent tracking-wider uppercase animate-pulse">
              <Sparkles className="h-3.5 w-3.5" /> Premium Counselling Unlocked
            </span>
            <h1 className="text-3xl md:text-4xl font-black text-primary">Counselling & Mentorship Dashboard</h1>
            <p className="text-sm text-muted-foreground font-semibold max-w-xl">
              Greetings! You now have complete access to choice filling guides, expected closing trends, parent webinars, and direct priority list creators.
            </p>
          </div>
          <div className="flex gap-3 relative z-10">
            <Button 
              onClick={() => router.push("/predictor")} 
              className="rounded-full px-6 py-6 font-bold shadow-lg hover:scale-105 transition-transform shrink-0"
            >
              Launch AI Predictor
            </Button>
            <a 
              href="https://wa.me/919999999999?text=Hi%20VidyaHeist,%20I%20have%20purchased%20premium%20counselling%20and%20need%20mentorship." 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center border border-primary text-primary hover:bg-primary/5 rounded-full px-6 py-3 font-bold text-sm hover:scale-105 transition-all"
            >
              <PhoneCall className="mr-2 w-4 h-4 text-primary" /> Ask Mentor
            </a>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Column Left & Middle: Sessions & PDFs */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Premium Interactive Tabs Segmented Control */}
            <div className="bg-muted/80 backdrop-blur-md p-1.5 rounded-[1.8rem] flex gap-1.5 border-2 border-border/80 shadow-inner">
              <button
                type="button"
                onClick={() => setActiveTab("resources")}
                className={`flex-grow py-3.5 px-6 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-300 ${
                  activeTab === "resources"
                    ? "bg-primary text-primary-foreground shadow-md scale-[1.01]"
                    : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                }`}
              >
                <Video className="w-4 h-4 shrink-0" /> Resources & Live Schedule
              </button>
              
              <button
                type="button"
                onClick={() => setActiveTab("chat")}
                className={`flex-grow py-3.5 px-6 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-300 relative ${
                  activeTab === "chat"
                    ? "bg-primary text-primary-foreground shadow-md scale-[1.01]"
                    : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                }`}
              >
                <MessageSquare className="w-4 h-4 shrink-0" /> 1-on-1 Alumni Chat Support
                <span className="absolute top-2.5 right-4 flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    hasUnreadFromAdmin ? "bg-blue-400" : "bg-green-400"
                  }`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${
                    hasUnreadFromAdmin ? "bg-blue-600 animate-pulse" : "bg-green-500"
                  }`}></span>
                </span>
              </button>
            </div>

            {activeTab === "resources" ? (
              <div className="space-y-8">
                
                {/* Live Webinars / Zoom Slots Panel */}
            <Card className="rounded-[2rem] border-2 border-border bg-card shadow-xl overflow-hidden">
              <CardHeader className="border-b bg-muted/40 p-6 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-black flex items-center gap-2 text-primary">
                    <Video className="w-5 h-5 text-primary" /> Live Zoom & Webinar Schedule
                  </CardTitle>
                  <CardDescription className="text-xs font-semibold pt-0.5">
                    Admins add dynamic links here for mock updates and rank webinars.
                  </CardDescription>
                </div>
              </CardHeader>
              
              <CardContent className="p-6">
                {cmsZoomSessions.length === 0 ? (
                  <div className="text-center py-10 space-y-4">
                    <Calendar className="w-12 h-12 text-muted-foreground/40 mx-auto" />
                    <div className="space-y-1">
                      <p className="font-extrabold text-foreground text-sm">No Live Webinars Scheduled Yet</p>
                      <p className="text-xs text-muted-foreground font-semibold max-w-sm mx-auto">
                        Your counsellors are preparing custom sessions. They will appear here immediately with join links.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cmsZoomSessions.map((session) => (
                      <div 
                        key={session.id} 
                        className="p-4 rounded-2xl border-2 border-border bg-secondary/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all hover:border-primary/20"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="bg-green-500/10 text-green-500 text-[9px] px-2 py-0.5 rounded-md font-black border border-green-500/20 uppercase tracking-wider">
                              {session.category || "Live"}
                            </span>
                            <h4 className="font-extrabold text-sm text-foreground">{session.title}</h4>
                          </div>
                          <p className="text-xs text-muted-foreground font-semibold line-clamp-2">{session.description}</p>
                          
                          <div className="flex flex-wrap items-center gap-4 text-[10px] text-muted-foreground font-bold font-mono">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-primary" /> {session.slug || "TBA"}
                            </span>
                          </div>
                        </div>

                        {session.linkUrl ? (
                          <a 
                            href={session.linkUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="w-full md:w-auto flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-black shadow-md hover:scale-[1.02] transition-transform"
                          >
                            Join Session <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <Button disabled className="w-full md:w-auto rounded-xl text-xs font-bold" variant="secondary">
                            Link Pending
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Premium Dynamic PDF Downloads Grid */}
            <Card className="rounded-[2rem] border-2 border-border bg-card shadow-xl overflow-hidden">
              <CardHeader className="border-b bg-muted/40 p-6 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-black flex items-center gap-2 text-primary">
                    <FileText className="w-5 h-5 text-primary" /> Downloadable Premium Guides & Sheets
                  </CardTitle>
                  <CardDescription className="text-xs font-semibold pt-0.5">
                    Printable checklists, Expected Marks vs Ranks, and research roadmaps.
                  </CardDescription>
                </div>
              </CardHeader>
              
              <CardContent className="p-6">
                {cmsPdfs.length === 0 ? (
                  <div className="text-center py-10 space-y-4">
                    <FileText className="w-12 h-12 text-muted-foreground/40 mx-auto" />
                    <div className="space-y-1">
                      <p className="font-extrabold text-foreground text-sm">No Premium PDF Guides Uploaded Yet</p>
                      <p className="text-xs text-muted-foreground font-semibold max-w-sm mx-auto">
                        Once an administrator uploads expected trends or guides in the CMS, they will instantly appear here for dynamic downloading!
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {cmsPdfs.map((pdf) => (
                      <div 
                        key={pdf.id} 
                        className="p-5 rounded-2xl border-2 border-primary/10 bg-primary/[0.01] flex flex-col justify-between gap-3 transition-all hover:border-primary/20"
                      >
                        <div className="space-y-1">
                          <h4 className="font-extrabold text-xs text-foreground flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-primary shrink-0 animate-pulse" /> {pdf.title}
                          </h4>
                          <p className="text-[10px] text-muted-foreground font-semibold leading-relaxed">{pdf.description}</p>
                        </div>
                        
                        {pdf.linkUrl ? (
                          <a 
                            href={pdf.linkUrl} 
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-fit inline-flex items-center gap-1 text-[10px] font-black text-primary uppercase tracking-wider hover:underline"
                          >
                            <Download className="w-3.5 h-3.5" /> Download Guide
                          </a>
                        ) : (
                          <span className="text-[10px] font-bold text-muted-foreground italic">Link Pending</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

              </div>
            ) : (
              /* Real-time 1-on-1 Alumni Chatbox */
              <Card className="rounded-[2.5rem] border-2 border-primary/20 bg-card shadow-2xl overflow-hidden flex flex-col h-[580px] transition-all animate-in fade-in zoom-in duration-300">
              <CardHeader className="border-b bg-muted/40 p-6 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 text-primary shrink-0">
                    <MessageSquare className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-black text-primary">1-on-1 Alumni Chat Support</CardTitle>
                    <CardDescription className="text-[10px] font-semibold pt-0.5 leading-normal">
                      Direct private help desk with verified IISER & NISER Alumni mentors.
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                  <span className="text-[9px] font-black text-green-600 uppercase tracking-widest">Active Support</span>
                </div>
              </CardHeader>
              
              {/* Message History Screen */}
              <div className="flex-1 p-6 overflow-y-auto bg-slate-50/50 space-y-4 flex flex-col">
                {chatMessages.length === 0 ? (
                  <div className="text-center py-8 space-y-4 my-auto">
                    <HelpCircle className="w-12 h-12 text-primary/30 mx-auto" />
                    <div className="space-y-2 max-w-md mx-auto">
                      <p className="font-extrabold text-foreground text-sm">Ask our Alumni Mentors Anything!</p>
                      <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
                        Have queries about your rank, IISER choice-filling locking, category status, research scope, or syllabus? 
                        Send a message below and an expert will reply to you directly!
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 flex-1 overflow-y-auto pr-2">
                    {chatMessages.map((msg) => {
                      const isAdminMsg = msg.sender === "admin";
                      return (
                        <div 
                          key={msg.id} 
                          className={`flex flex-col ${isAdminMsg ? "items-start" : "items-end"} space-y-1`}
                        >
                          <span className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-wider px-1">
                            {isAdminMsg ? "Alumni Mentor" : "You"}
                          </span>
                          <div 
                            className={`p-3 rounded-2xl max-w-[80%] text-xs font-semibold leading-relaxed shadow-sm ${
                              isAdminMsg 
                                ? "bg-white border text-slate-800 rounded-tl-sm" 
                                : "bg-primary text-primary-foreground rounded-tr-sm"
                            }`}
                          >
                            {msg.message}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              
              {/* Message Typing Panel */}
              <CardFooter className="p-4 border-t bg-card shrink-0">
                <form onSubmit={handleSendChatMessage} className="w-full flex gap-2">
                  <input
                    type="text"
                    placeholder="Type your question for the mentors..."
                    value={newMsgText}
                    onChange={(e) => setNewMsgText(e.target.value)}
                    disabled={sendingMsg}
                    className="flex-grow rounded-xl border-2 px-4 py-3 text-xs font-semibold bg-background border-input focus:outline-none focus:border-primary transition-colors"
                  />
                  <Button 
                    type="submit" 
                    disabled={sendingMsg || !newMsgText.trim()}
                    className="rounded-xl px-5 font-black text-xs uppercase tracking-wider shrink-0"
                  >
                    {sendingMsg ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send"}
                  </Button>
                </form>
              </CardFooter>
            </Card>
            )}

          </div>

          {/* Column Right: Preference Ordering List Creator */}
          <div className="space-y-8">
            
            {/* Preference Creator Tool */}
            <Card className="rounded-[2.5rem] border-2 border-primary/20 bg-gradient-to-br from-card to-primary/[0.02] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 blur-2xl" />
              
              <CardHeader className="p-6 border-b">
                <CardTitle className="text-lg font-black flex items-center gap-2">
                  <ListOrdered className="w-5 h-5 text-primary" /> Interactive Choice Order Builder
                </CardTitle>
                <CardDescription className="text-xs font-semibold pt-0.5">
                  Drag and sort your target preference list and print it instantly as a PDF!
                </CardDescription>
              </CardHeader>
              
              <CardContent className="p-6 space-y-4">
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-foreground uppercase tracking-wider">Your IAT Rank</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 1420"
                      value={rankInput}
                      onChange={(e) => setRankInput(e.target.value)}
                      className="w-full bg-secondary/40 border border-border px-3 py-2 rounded-xl text-xs font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-foreground uppercase tracking-wider">Category</label>
                    <select
                      value={categorySelect}
                      onChange={(e) => setCategorySelect(e.target.value)}
                      className="w-full bg-secondary/40 border border-border px-3 py-2.5 rounded-xl text-xs font-bold"
                    >
                      <option value="General">General / Open</option>
                      <option value="OBC-NCL">OBC-NCL</option>
                      <option value="SC">SC</option>
                      <option value="ST">ST</option>
                      <option value="EWS">EWS</option>
                    </select>
                  </div>
                </div>

                <div className="h-px bg-border my-2" />

                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                  {preferenceList.map((pref, index) => (
                    <div 
                      key={pref}
                      className="p-3 rounded-xl border border-border bg-background flex items-center justify-between text-xs font-bold shadow-sm"
                    >
                      <span className="text-primary font-black w-6">{index + 1}.</span>
                      <span className="flex-1 text-foreground text-left">{pref}</span>
                      
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => movePreference(index, 'up')}
                          disabled={index === 0}
                          className="p-1 rounded hover:bg-secondary text-muted-foreground disabled:opacity-30"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => movePreference(index, 'down')}
                          disabled={index === preferenceList.length - 1}
                          className="p-1 rounded hover:bg-secondary text-muted-foreground disabled:opacity-30"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <Button 
                  onClick={handlePrintPreference}
                  className="w-full rounded-xl py-5 font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" /> Print & Save Preference List
                </Button>

              </CardContent>
            </Card>

            {/* Quick Links & Alert Channels */}
            <Card className="rounded-[2rem] border-2 border-border bg-card shadow-xl overflow-hidden p-6 space-y-4">
              <h3 className="font-extrabold text-sm text-primary flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-primary animate-bounce" /> Verified Channels & Alerts
              </h3>
              <p className="text-[11px] text-muted-foreground font-semibold leading-relaxed">
                Stay updated with round-by-round seat cuts. Join these exclusive premium chat groups:
              </p>

              {cmsLinks.length === 0 ? (
                <div className="space-y-3 pt-2">
                  <a 
                    href="https://t.me/vidyaheist_counselling" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-blue-500/20 bg-blue-500/5 text-blue-600 hover:bg-blue-500/10 font-black text-xs transition-all"
                  >
                    <span>Premium Telegram Community</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <a 
                    href="https://whatsapp.com/channel/vidyaheist" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-green-500/20 bg-green-500/5 text-green-600 hover:bg-green-500/10 font-black text-xs transition-all"
                  >
                    <span>WhatsApp Announcement Channel</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  {cmsLinks.map((link) => (
                    <a 
                      key={link.id}
                      href={link.linkUrl || "#"} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-between p-3 rounded-xl border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 font-black text-xs transition-all"
                    >
                      <span>{link.title}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ))}
                </div>
              )}
            </Card>

          </div>

        </div>

      </div>
    );
  }

  // ==========================================
  // VIEW B: VISITOR LANDING / PRODUCT PAGE
  // ==========================================
  return (
    <div className="flex flex-col space-y-12 pb-20 px-4 max-w-7xl mx-auto">
      
      {/* Spectacular Hero landing banner */}
      <section className="relative rounded-[3rem] border-2 border-primary/20 bg-gradient-to-br from-primary/10 via-background to-secondary/5 shadow-2xl p-8 md:p-16 overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-12 mt-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(59,130,246,0.1),transparent_50%)]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 blur-3xl -mr-32 -mt-32" />
        
        <div className="flex-1 space-y-6 text-center lg:text-left relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 border border-primary/30 px-4 py-1.5 text-xs font-black text-primary tracking-wider uppercase animate-pulse">
            <Sparkles className="h-4.5 w-4.5 text-primary" /> India's Elite Research counselling
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-foreground leading-[1.1]">
            Crack the Counselling, <br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Not Just the Exam</span>
          </h1>
          
          <p className="text-sm md:text-base text-muted-foreground font-semibold max-w-xl mx-auto lg:mx-0 leading-relaxed">
            Ultimate end-to-end strategy portal for IISER (IAT), NISER (NEST) and research university admissions. Secure your seat with custom choices optimized by alumni.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center lg:justify-start pt-2">
            <Button 
              onClick={handleCheckoutRedirect} 
              className="rounded-full px-8 py-7 text-sm font-black uppercase tracking-wider shadow-xl hover:scale-105 transition-transform shrink-0"
            >
              Enroll Now • <span className="line-through opacity-60 mx-1.5">₹199</span> ₹0 Only (Free Testing)
            </Button>
            
            <Button 
              onClick={() => document.getElementById("counselling-form")?.scrollIntoView({ behavior: "smooth" })}
              className="rounded-full px-8 py-7 text-sm font-black uppercase tracking-wider shrink-0" 
              variant="outline"
            >
              Book Free Callback
            </Button>
          </div>

          <div className="flex items-center justify-center lg:justify-start gap-6 text-xs font-extrabold font-mono pt-4 text-muted-foreground border-t border-border/60 max-w-md">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-accent" /> 100% Verified Admins
            </div>
          </div>
        </div>

        {/* Brochure Poster Card */}
        <div className="w-full lg:w-[400px] shrink-0 relative z-10">
          <Card className="rounded-[2.5rem] border-2 border-primary/20 shadow-2xl overflow-hidden bg-background/50 backdrop-blur-md hover:scale-[1.01] transition-transform duration-300">
            <div className="relative aspect-[3/4] w-full bg-muted">
              <Image 
                src="/poster.jpeg" 
                alt="VidyaHeist Counselling Brochure" 
                fill 
                className="object-cover" 
                priority
              />
            </div>
          </Card>
        </div>
      </section>

      {/* Free Callback Submission Form (Placed above what serious students unlock!) */}
      <section id="counselling-form" className="container mx-auto px-4 max-w-3xl pt-2">
        <Card className="border-2 border-primary/20 shadow-2xl relative overflow-hidden rounded-[2.5rem] bg-card">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 blur-3xl rounded-full" />
          <CardHeader className="text-center relative">
            <CardTitle className="text-2xl font-black text-primary">Get in Touch with our Mentors</CardTitle>
            <CardDescription className="text-xs font-semibold">
              Fill in your details below. Our counselling expert will call or WhatsApp you within 24 hours.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6 relative">
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-secondary/40 border border-border px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-xs font-semibold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground">Phone Number</label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="10-digit mobile number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-secondary/40 border border-border px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-2 flex flex-col">
                <label className="text-xs font-bold text-foreground">Select Counselling Stream / Interest</label>
                <select
                  value={interest}
                  onChange={(e) => setInterest(e.target.value)}
                  className="w-full bg-secondary/40 border border-border px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-xs font-semibold cursor-pointer"
                >
                  <option value="JoSAA & JAC Delhi">JoSAA & JAC Delhi (IITs, NITs, IIITs, DTU)</option>
                  <option value="IAT & NEST">IAT & NEST (IISERs, NISER)</option>
                  <option value="MHTCET">MHTCET CAP Rounds</option>
                  <option value="General Guidance">General Study & College Counselling</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground">Your Query / Message</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Tell us about your rank, target college, or any questions you have..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-secondary/40 border border-border px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-xs font-semibold resize-none"
                />
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full py-5 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg transition-transform hover:scale-[1.01]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting Request...
                  </>
                ) : (
                  "Request Free Callback Session"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>

      {/* Brochure Content Specifications Grid */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl md:text-3xl font-black text-primary">What Serious Students Unlock</h2>
          <p className="text-xs text-muted-foreground font-semibold">
            We provide everything detailed in the brochure to guarantee zero friction in your seat freezing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {brochureFeatures.map((feat, idx) => (
            <Card key={idx} className="border border-border/80 bg-card/60 backdrop-blur-sm p-6 hover:shadow-xl hover:border-primary/15 transition-all group rounded-3xl relative overflow-hidden">
              <span className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-bl-md opacity-25 group-hover:scale-150 transition-transform" />
              <CardHeader className="p-0 pb-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-3">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <CardTitle className="text-sm font-black">{feat.title}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <p className="text-[11px] text-muted-foreground leading-relaxed font-semibold">{feat.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Premium Multi-College Comparison Matrix Table */}
      <section className="space-y-6 bg-accent/5 border border-accent/15 p-8 rounded-[3rem] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 blur-3xl rounded-full" />
        
        <div className="text-center max-w-xl mx-auto space-y-2 relative z-10">
          <h2 className="text-2xl md:text-3xl font-black text-primary">IISER vs IIT vs NISER Matrix</h2>
          <p className="text-xs text-muted-foreground font-semibold">
            Quick insight comparison to choose research vs engineering careers.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border-2 border-border bg-background/50 backdrop-blur-md relative z-10">
          <table className="w-full text-left border-collapse text-xs font-semibold">
            <thead>
              <tr className="border-b bg-muted/40 font-black text-primary">
                <th className="p-4 w-[20%]">Metric / Feature</th>
                <th className="p-4 w-[25%]">IISER</th>
                <th className="p-4 w-[25%]">IIT</th>
                <th className="p-4 w-[25%]">NISER</th>
              </tr>
            </thead>
            <tbody className="divide-y text-muted-foreground">
              <tr className="hover:bg-secondary/10">
                <td className="p-4 font-black text-foreground">Degree Type</td>
                <td className="p-4">5-Year BS-MS Dual Degree</td>
                <td className="p-4">4-Year B.Tech / Dual Degree</td>
                <td className="p-4">5-Year Integrated M.Sc</td>
              </tr>
              <tr className="hover:bg-secondary/10">
                <td className="p-4 font-black text-foreground">Core Focus</td>
                <td className="p-4">Interdisciplinary Natural Sciences</td>
                <td className="p-4">Applied Engineering & Technology</td>
                <td className="p-4">Pure and Applied Research Fields</td>
              </tr>
              <tr className="hover:bg-secondary/10">
                <td className="p-4 font-black text-foreground">Admissions Gate</td>
                <td className="p-4">IISER Aptitude Test (IAT)</td>
                <td className="p-4">JEE Advanced Rank</td>
                <td className="p-4">NEST Selection Exam</td>
              </tr>
              <tr className="hover:bg-secondary/10">
                <td className="p-4 font-black text-foreground">PhD Pathways</td>
                <td className="p-4">Extremely strong placements in foreign PhDs</td>
                <td className="p-4">Corporate roles / Tech internships focus</td>
                <td className="p-4">Direct PhDs and BARC selection benefits</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Testimonials Slider Test */}
      <section className="w-full py-10 bg-secondary/5 rounded-[3rem] border border-border/80 relative overflow-hidden">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black text-primary">Mentorship Success Stories</h2>
            <p className="text-xs text-muted-foreground font-semibold">What students say about our counselling support.</p>
          </div>

          <div className="relative max-w-4xl mx-auto px-2 sm:px-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5 }}
                className="bg-background rounded-3xl p-5 md:p-8 shadow-xl border border-border flex flex-col md:flex-row gap-6 items-center"
              >
                <div className="relative flex-shrink-0">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-4 border-accent/20 shadow-lg">
                    <Image 
                      src={testimonials[current].image} 
                      alt={testimonials[current].name}
                      width={100}
                      height={100}
                      className="object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-accent text-accent-foreground p-1.5 rounded-full shadow-lg">
                    <Quote className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="flex-grow space-y-3 text-center md:text-left">
                  <div className="flex justify-center md:justify-start gap-0.5">
                    {[...Array(testimonials[current].rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm font-bold italic text-foreground/90 leading-relaxed">
                    "{testimonials[current].text}"
                  </p>
                  <div>
                    <h4 className="text-base font-extrabold text-primary">{testimonials[current].name}</h4>
                    <p className="text-xs text-muted-foreground font-semibold">{testimonials[current].college}</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Controls */}
            <button 
              onClick={() => setCurrent((prev) => (prev - 1 + testimonials.length) % testimonials.length)}
              className="absolute left-0 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-background border border-border shadow-md hover:bg-secondary transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setCurrent((prev) => (prev + 1) % testimonials.length)}
              className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-background border border-border shadow-md hover:bg-secondary transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
