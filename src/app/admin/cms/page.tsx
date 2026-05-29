"use client";

import { useEffect, useState, useRef, Suspense, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useCollection, useStorage } from "@/firebase";
import { doc, setDoc, addDoc, collection, deleteDoc, serverTimestamp, query, where, getDocs, onSnapshot, orderBy } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import {
  Loader2,
  ShieldAlert,
  PlusCircle,
  Trash,
  Edit,
  CheckCircle2,
  ArrowLeft,
  Upload,
  FileText,
  Eye,
  Settings,
  GraduationCap,
  ShoppingBag,
  Rss,
  Mic,
  FolderOpen,
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link2,
  Image as ImageIcon,
  Quote,
  Code,
  Table2,
  Sigma,
  Globe,
  Sparkles,
  X,
  HelpCircle,
  Megaphone,
  Video,
  Volume2,
  BookOpen,
  Film,
  Play,
  MessageSquare,
  Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { MathText } from "@/components/shared/MathText";

type CmsItemType = {
  id: string;
  collection: "researchHub" | "productDetails" | "blogs" | "podcasts" | "resources" | "globalAnnouncement" | "employeeManagement" | "counselling" | "counsellingChats";
  title: string;
  slug: string;
  description: string;
  category: string;
  coverImage: string | null;
  linkUrl?: string | null;
  content: string;
  status: "draft" | "published";
  createdAt: any;
  updatedAt: any;
};

const collectionsList = [
  { id: "researchHub", label: "Research Hub", desc: "IISERs, IISc, NISER college guides", icon: GraduationCap },
  { id: "productDetails", label: "Product Details", desc: "Detailed outlines for E-books & Courses", icon: ShoppingBag },
  { id: "blogs", label: "Blogs & strategy", desc: "Preparation guidelines & scientific career articles", icon: Rss },
  { id: "podcasts", label: "Podcasts Hub", desc: "Professor interviews & student journeys", icon: Mic },
  { id: "resources", label: "Resources directory", desc: "Formula sheets, syllabus sheets, and cutoffs", icon: FolderOpen },
  { id: "counselling", label: "Counselling Program", desc: "Zoom links, PDFs, WhatsApp/Telegram groups", icon: HelpCircle },
  { id: "globalAnnouncement", label: "Global Announcement", desc: "Promo modals & notifications for all visitors", icon: Megaphone },
] as const;

const CMS_TEMPLATES: Record<string, string> = {
  counselling: `### 🗓️ Premium Counselling Session / Asset Details
Provide comprehensive details for this premium asset.

* **Asset Type:** Select category tag (zoom, link, or pdf).
* **Schedule / Details:** "Live on Zoom at 6:00 PM"
* **Access Rules:** Only visible to premium ₹199 counselling students.

Make it informative and clear!`,

  researchHub: `## 🏛️ Institute Overview
Write a captivating introduction about the research institute, its legacy, campus life, and academic prestige.

## 🎓 Academic Programs & Admission Gateway
* **Programs Offered:** BS-MS dual degree, Integrated PhD, PhD.
* **Admission Channel:** IAT (IISER Aptitude Test), KVPY, JEE Advanced.

## 📊 Seat Matrix & Reservation Splits
Provide the seat division details here (Gen, EWS, OBC, SC, ST, PwD).

## 📈 Past Cutoffs (Closing Ranks)
* **General:** Rank XXX
* **OBC-NCL:** Rank XXX
* **SC/ST:** Rank XXX

## 💬 Student Reviews & Honest Opinions
Add real feedback from seniors regarding hostels, mess, research labs, and academic pressure.`,

  productDetails: `## 🌟 Storefront Study Material Overview
Provide an exciting introduction highlighting why this mock kit, booklet, or handbook is a MUST-HAVE for every serious aspirant trying to crack IISER/NISER!

## 🚀 Key Highlights & High-Yield Features
* **Topic-Wise Breakdown:** Comprehensive Coverage of all chapters.
* **Frictionless Reading:** Complete clear layouts, LaTeX scientific formulas, and premium diagrams.
* **Quality Assurance:** Handcrafted solutions double-checked by top IISER alumni.

## 📚 Complete Syllabus & Chapters Index
* **Chapter 1:** Introduction and core basic foundations.
* **Chapter 2:** Advanced applications and formula sheets.
* **Chapter 3:** High-yield mock questions with step-by-step math breakdowns.

## 💡 Access & Deliverables Instructions
Upon payment verification, this premium PDF will be instantly unlocked on your **Book Orders** profile tab for on-device reading!`,

  blogs: `## 📝 Strategy Title: Crack Your Scientific Entrance
Write an inspiring introduction explaining the strategy, its importance, and what the reader will gain from reading this guide.

## ⏱️ Daily Routine & Time Management
Explain how to divide study hours between Physics, Chemistry, Mathematics, and Biology.

## 🧠 Smart Learning & Revision Techniques
* **Active Recall:** How to quiz yourself on biology terms.
* **Spaced Repetition:** When to revise physics formulas.
* **Syllabus Auditing:** How to identify weak areas.

## 🎯 Step-by-Step Action Plan
1. Master core NCERT concepts.
2. Solve previous years' question papers under time limits.
3. Review mistakes systematically.`,

  podcasts: `## 🎙️ Podcast Episode Details
Welcome to Episode X! In this conversation, we talk with **[Guest Name]**, who scored **AIR [Rank]** in [Exam] and is currently studying at **[College Name]**.

## 📍 Key Conversation Highlights
* **[02:15]** - Early preparation days and resource selection.
* **[12:40]** - How to handle demotivation and test anxiety.
* **[25:10]** - Master plan for organic chemistry revision.

## 💎 Best Advice for Aspirants
"[Insert a powerful inspiring quote from the guest regarding consistency, mindset, or dedication]"`,

  resources: `## 📁 Free Resource Details
This premium booklet is compiled to help you revise key concepts and formulas rapidly before your test.

## 🗒️ Index & Topic Coverage
* **Topic 1:** Electromagnetism and core formulas.
* **Topic 2:** Kinetics, mechanics, and quick reference index.
* **Topic 3:** Essential organic reactions chart.

## 📥 Download Guidelines
Click the animated **"Download PDF Now"** button below to download the official print-ready document directly to your device!`,

  globalAnnouncement: `### 🚀 Exciting Platform Update!
We are absolutely thrilled to launch our brand new **Admissions Counselling Program 2026**! 

* **Expert Mentorship:** 1-on-1 calls with top IISER & NISER alumni.
* **Seat Allocation Optimization:** Customized choices matching your rank.
* **Document Assistance:** Step-by-step verification checks.

Click the **"Learn More & Enroll"** button below to secure your seat and join our premium scientific community today!`
};

function CmsHubContent() {
  const { user, loading: userLoading, isAdmin, isMicroAdmin } = useUser();
  const firestore = useFirestore();
  const storage = useStorage();
  const router = useRouter();
  const { toast } = useToast();

  const [activeCollection, setActiveCollection] = useState<CmsItemType["collection"]>("researchHub");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<CmsItemType | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<CmsItemType["status"]>("draft");
  const [price, setPrice] = useState("0");

  // Editor Preview states
  const [editorTab, setEditorTab] = useState<"edit" | "preview">("edit");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Storage / Upload States
  const [imageUploading, setImageUploading] = useState(false);
  const [imageProgress, setImageProgress] = useState(0);
  const [attachmentUploading, setAttachmentUploading] = useState(false);
  const [attachmentProgress, setAttachmentProgress] = useState(0);
  const [saving, setSaving] = useState(false);

  // Editor Dynamic Media Uploader States
  const [editorMediaUploading, setEditorMediaUploading] = useState(false);
  const [editorMediaProgress, setEditorMediaProgress] = useState(0);
  const [showGuideModal, setShowGuideModal] = useState(false);

  // Counselling Chats states
  const [adminChats, setAdminChats] = useState<any[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [adminReplyText, setAdminReplyText] = useState("");
  const [adminSendingMsg, setAdminSendingMsg] = useState(false);

  useEffect(() => {
    if (!firestore || activeCollection !== "counsellingChats") return;
    
    // 1. Subscribe to all chat messages
    const qChats = query(
      collection(firestore, "counselling_messages"),
      orderBy("createdAt", "asc")
    );
    
    const unsubscribeChats = onSnapshot(qChats, (snapshot) => {
      const msgs: any[] = [];
      snapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() });
      });
      setAdminChats(msgs);
    }, (error) => {
      console.error("Admin chat read error:", error);
    });

    // 2. Subscribe to verified counselling purchases
    const qPurchases = query(
      collection(firestore, "purchases"),
      where("seriesId", "==", "counselling_2026"),
      where("status", "==", "verified")
    );

    const unsubscribePurchases = onSnapshot(qPurchases, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setEnrolledStudents(list);
    }, (error) => {
      console.error("Enrolled students query error:", error);
    });
    
    return () => {
      unsubscribeChats();
      unsubscribePurchases();
    };
  }, [firestore, activeCollection]);

  const studentSessions = useMemo(() => {
    const studentsMap: Record<string, { userId: string; userName: string; userEmail: string; messages: any[]; lastMessage: string; lastMessageTime: any }> = {};
    
    // First, populate the map with ALL enrolled students
    enrolledStudents.forEach((p) => {
      const uid = p.userId;
      if (!uid) return;
      studentsMap[uid] = {
        userId: uid,
        userName: p.userName || "Student",
        userEmail: p.userEmail || "",
        messages: [],
        lastMessage: "New Enrolled Student! No messages yet.",
        lastMessageTime: p.createdAt || null
      };
    });

    // Second, overlay/populate with any chat messages
    adminChats.forEach((msg) => {
      const uid = msg.userId;
      if (!uid) return;
      
      if (!studentsMap[uid]) {
        studentsMap[uid] = {
          userId: uid,
          userName: msg.userName || "Student",
          userEmail: msg.userEmail || "",
          messages: [],
          lastMessage: "",
          lastMessageTime: null
        };
      }
      studentsMap[uid].messages.push(msg);
      studentsMap[uid].lastMessage = msg.message;
      studentsMap[uid].lastMessageTime = msg.createdAt;
    });
    
    return Object.values(studentsMap).sort((a, b) => {
      const timeA = a.lastMessageTime?.seconds || 0;
      const timeB = b.lastMessageTime?.seconds || 0;
      return timeB - timeA;
    });
  }, [enrolledStudents, adminChats]);

  const handleSendAdminReply = async (e: React.FormEvent, student: any) => {
    e.preventDefault();
    if (!adminReplyText.trim() || !student || !firestore) return;
    
    setAdminSendingMsg(true);
    try {
      await addDoc(collection(firestore, "counselling_messages"), {
        userId: student.userId,
        userName: student.userName,
        userEmail: student.userEmail,
        message: adminReplyText.trim(),
        sender: "admin",
        createdAt: serverTimestamp()
      });
      setAdminReplyText("");
    } catch (error: any) {
      console.error("Failed to send admin reply:", error);
      toast({
        title: "Reply Error",
        description: "Failed to deliver your reply. Please try again.",
        variant: "destructive"
      });
    } finally {
      setAdminSendingMsg(false);
    }
  };

  // Mark student messages as read when admin clicks/selects the conversation session
  useEffect(() => {
    if (!firestore || !selectedStudentId) return;
    
    const unreadMsgs = adminChats.filter(
      (msg) => msg.userId === selectedStudentId && msg.sender === "student" && !msg.read
    );
    
    if (unreadMsgs.length === 0) return;
    
    unreadMsgs.forEach(async (msg) => {
      try {
        const docRef = doc(firestore, "counselling_messages", msg.id);
        await setDoc(docRef, { read: true }, { merge: true });
      } catch (err) {
        console.error("Error marking message as read:", err);
      }
    });
  }, [selectedStudentId, adminChats, firestore]);

  // Employee/Team Management states & handlers
  const [teamUsers, setTeamUsers] = useState<any[]>([]);
  const [teamSearchQuery, setTeamSearchQuery] = useState("");
  const [teamLoading, setTeamLoading] = useState(false);
  const [selectedTeamUser, setSelectedTeamUser] = useState<any | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordUpdating, setPasswordUpdating] = useState(false);

  const dynamicCollectionsList = useMemo(() => {
    const list = [...collectionsList] as any[];
    if (isAdmin || isMicroAdmin || user?.email?.toLowerCase() === "vidyaheist@gmail.com") {
      list.push({
        id: "counsellingChats",
        label: "Counselling Support",
        desc: "Live private messenger with paid aspirants",
        icon: MessageSquare
      });
    }
    if (user?.email?.toLowerCase() === "vidyaheist@gmail.com") {
      list.push({
        id: "employeeManagement",
        label: "Team Sudo Roles",
        desc: "Sudo & Microadmin privileges control panel",
        icon: ShieldAlert
      });
    }
    return list;
  }, [user, isAdmin, isMicroAdmin]);

  const fetchTeamUsers = async () => {
    if (!firestore || user?.email !== "vidyaheist@gmail.com") return;
    setTeamLoading(true);
    try {
      const q = query(collection(firestore, "users"));
      const querySnapshot = await getDocs(q);
      const list: any[] = [];
      querySnapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setTeamUsers(list);
    } catch (error) {
      console.error("Error fetching team users:", error);
      toast({
        title: "Error fetching users",
        description: "Failed to read employee accounts from the database.",
        variant: "destructive"
      });
    } finally {
      setTeamLoading(false);
    }
  };

  const handleUpdateRole = async (targetUid: string, targetEmail: string, roleToSet: "admin" | "microadmin" | "student") => {
    if (targetEmail.toLowerCase() === "vidyaheist@gmail.com") {
      toast({
        title: "Action Forbidden",
        description: "The master super-user cannot be demoted or modified.",
        variant: "destructive"
      });
      return;
    }

    try {
      const idToken = await user?.getIdToken();
      if (!idToken) throw new Error("Authentication token not found");

      const res = await fetch("/api/admin/update-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify({
          targetUid,
          action: "updateRole",
          role: roleToSet
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update role");
      }

      toast({
        title: "Role Updated! 🎉",
        description: `Successfully modified ${targetEmail} status to ${roleToSet}.`,
      });

      fetchTeamUsers();
    } catch (err: any) {
      console.error("Role Update Error:", err);
      toast({
        title: "Update Failed",
        description: err.message || "An unexpected error occurred.",
        variant: "destructive"
      });
    }
  };

  const handleUpdatePassword = async () => {
    if (!selectedTeamUser || !newPassword || newPassword.length < 6) {
      toast({
        title: "Invalid Input",
        description: "Please specify a password containing at least 6 characters.",
        variant: "destructive"
      });
      return;
    }

    setPasswordUpdating(true);
    try {
      const idToken = await user?.getIdToken();
      if (!idToken) throw new Error("Authentication token not found");

      const res = await fetch("/api/admin/update-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify({
          targetUid: selectedTeamUser.id,
          action: "updatePassword",
          password: newPassword
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update password");
      }

      toast({
        title: "Password Updated! 🔒",
        description: `Successfully changed password for ${selectedTeamUser.email}.`,
      });

      setShowPasswordModal(false);
      setNewPassword("");
      setSelectedTeamUser(null);
    } catch (err: any) {
      console.error("Password Update Error:", err);
      toast({
        title: "Password Reset Failed",
        description: err.message || "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setPasswordUpdating(false);
    }
  };

  useEffect(() => {
    if (activeCollection === "employeeManagement") {
      fetchTeamUsers();
    }
  }, [activeCollection]);

  // Dynamic media uploader for rich content editor
  const handleEditorMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !storage || !user) return;

    if (file.size > 15 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Media uploads must be smaller than 15MB.",
        variant: "destructive",
      });
      return;
    }

    setEditorMediaUploading(true);
    setEditorMediaProgress(0);

    const storageRef = ref(storage, `cms/editor_media/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const percent = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setEditorMediaProgress(percent);
      },
      (error) => {
        console.error("Editor media upload error:", error);
        setEditorMediaUploading(false);
        toast({
          title: "Upload Failed",
          description: error.message,
          variant: "destructive",
        });
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        setEditorMediaUploading(false);

        const isVideo = file.type.startsWith("video/") || file.name.endsWith(".mp4") || file.name.endsWith(".mov") || file.name.endsWith(".webm");
        let mediaTag = "";
        if (isVideo) {
          mediaTag = `\n<video src="${downloadURL}" controls className="w-full rounded-2xl border my-4 shadow-sm max-h-[400px] object-cover" />\n`;
        } else {
          mediaTag = `![${file.name.replace(/[^a-zA-Z0-9]/g, " ")}](${downloadURL})`;
        }

        insertMediaAtCursor(mediaTag);

        toast({
          title: "Media Inserted",
          description: `${file.name} successfully uploaded and inserted into the content editor!`,
        });
      }
    );
  };

  const insertMediaAtCursor = (mediaText: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setContent((prev) => prev + mediaText);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent = content.substring(0, start) + mediaText + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + mediaText.length, start + mediaText.length);
    }, 50);
  };

  // Firestore Collection Queries
  const [items, setItems] = useState<CmsItemType[]>([]);
  const [itemsLoading, setItemsLoading] = useState(true);

  // Interactive Help Guide Tour State
  const [tourStep, setTourStep] = useState<number | null>(null);

  const [booksCatalog, setBooksCatalog] = useState<{ id: string; name: string }[]>([]);

  // Fetch books catalog from Firestore books collection
  useEffect(() => {
    if (!firestore) return;
    const fetchBooks = async () => {
      try {
        const snap = await getDocs(collection(firestore, "books"));
        const catalog = snap.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name || doc.id,
        }));
        setBooksCatalog(catalog);
      } catch (err) {
        console.error("Error fetching books catalog:", err);
      }
    };
    fetchBooks();
  }, [firestore]);

  // Load items based on activeCollection
  const fetchCmsItems = async () => {
    if (!firestore) return;
    setItemsLoading(true);
    try {
      const q = query(
        collection(firestore, "cms_content"),
        where("collection", "==", activeCollection)
      );
      const snap = await getDocs(q);
      const dataList = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as CmsItemType[];

      // Sort locally by updatedAt or createdAt desc
      dataList.sort((a, b) => {
        const timeA = a.updatedAt?.seconds || 0;
        const timeB = b.updatedAt?.seconds || 0;
        return timeB - timeA;
      });

      setItems(dataList);
    } catch (err) {
      console.error("Error loading CMS items:", err);
      toast({
        title: "Database Error",
        description: "Failed to pull CMS directory items.",
        variant: "destructive"
      });
    } finally {
      setItemsLoading(false);
    }
  };

  useEffect(() => {
    if (firestore) {
      fetchCmsItems();
    }
  }, [firestore, activeCollection]);

  // Handle selected item binding
  const handleSelectItem = (item: CmsItemType) => {
    setSelectedItem(item);
    setTitle(item.title);
    setSlug(item.slug);
    setDescription(item.description);
    setCategory(item.category);
    setCoverImage(item.coverImage || "");
    setLinkUrl(item.linkUrl || "");
    setContent(item.content);
    setStatus(item.status);
    setPrice(String((item as any).price || 0));
    setEditorTab("edit");
  };

  // Handle setting up new form
  const handleNewItem = (colOverride?: CmsItemType["collection"]) => {
    const col = colOverride || activeCollection;
    setSelectedItem(null);
    setTitle("");
    setSlug("");
    setDescription("");
    setCategory("");
    setCoverImage("");
    setLinkUrl("");
    setContent(CMS_TEMPLATES[col] || "");
    setStatus("draft");
    setPrice("0");
    setEditorTab("edit");
  };

  // Auto generator helper for slug from title
  const generateSlug = () => {
    if (!title) return;
    const cleanSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "") // remove special chars
      .replace(/\s+/g, "-") // replace spaces with hyphens
      .replace(/-+/g, "-"); // remove double hyphens
    setSlug(cleanSlug);
  };

  // Handle banner cover image uploads
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !storage || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Cover banners must be smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setImageUploading(true);
    setImageProgress(0);

    const storageRef = ref(storage, `cms/banners/${activeCollection}/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const percent = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setImageProgress(percent);
      },
      (error) => {
        console.error("CMS Banner upload error:", error);
        setImageUploading(false);
        toast({
          title: "Upload Failed",
          description: error.message,
          variant: "destructive",
        });
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        setImageUploading(false);
        setCoverImage(downloadURL);
        toast({
          title: "Banner Uploaded",
          description: "Visual cover banner set successfully.",
        });
      }
    );
  };

  // Handle external attachments / PDF / audio uploads
  const handleAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !storage || !user) return;

    // Support up to 25MB for PDFs/sheets/documents/audio
    if (file.size > 25 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Attachments must be smaller than 25MB.",
        variant: "destructive",
      });
      return;
    }

    setAttachmentUploading(true);
    setAttachmentProgress(0);

    const storageRef = ref(storage, `cms/attachments/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const percent = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setAttachmentProgress(percent);
      },
      (error) => {
        console.error("CMS Attachment upload error:", error);
        setAttachmentUploading(false);
        toast({
          title: "Upload Failed",
          description: error.message,
          variant: "destructive",
        });
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        setAttachmentUploading(false);
        setLinkUrl(downloadURL);
        toast({
          title: "Attachment Uploaded",
          description: "File URL is now populated in the attachment field.",
        });
      }
    );
  };

  // Safe injection formatting helper at cursor point
  const insertFormat = (before: string, after: string = "", placeholder: string = "text") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const replacement = before + (selectedText || placeholder) + after;

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);

    // Reposition cursor and refocus
    setTimeout(() => {
      textarea.focus();
      const offsetBefore = before.length;
      if (selectedText) {
        textarea.setSelectionRange(start + offsetBefore, start + offsetBefore + selectedText.length);
      } else {
        textarea.setSelectionRange(start + offsetBefore, start + offsetBefore + placeholder.length);
      }
    }, 50);
  };

  // Form submit handler
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !user) return;

    const finalSlug = slug.trim();
    if (!title.trim() || !finalSlug || !category.trim() || !content.trim()) {
      toast({
        title: "Required Fields",
        description: "Please fill out the title, custom slug, category, and formatted body content.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const docId = finalSlug;
      const documentPath = doc(firestore, "cms_content", docId);

      const payload: Omit<CmsItemType, "id"> = {
        collection: activeCollection,
        title: title.trim(),
        slug: finalSlug,
        description: description.trim(),
        category: category.trim(),
        coverImage: coverImage.trim() || null,
        linkUrl: linkUrl.trim() || null,
        content: content,
        status: status,
        updatedAt: serverTimestamp(),
        createdAt: selectedItem?.createdAt || serverTimestamp(),
        price: Number(price) || 0,
      } as any;

      await setDoc(documentPath, payload, { merge: true });

      // If saving a productDetails entry, synchronize it to the main Bookstore "books" catalog!
      if (activeCollection === "productDetails") {
        const bookDocRef = doc(firestore, "books", finalSlug);
        const bookPayload = {
          name: title.trim(),
          description: description.trim(),
          subject: category.trim(),
          imageUrl: coverImage.trim() || null,
          pdfUrl: linkUrl.trim() || null,
          price: Number(price) || 0,
          content: content,
          updatedAt: serverTimestamp(),
          createdAt: selectedItem?.createdAt || serverTimestamp(),
        };
        await setDoc(bookDocRef, bookPayload, { merge: true });
      }

      toast({
        title: selectedItem ? "Content Updated" : "Content Published",
        description: activeCollection === "productDetails"
          ? `"${title}" has been saved and is now live on the store!`
          : `"${title}" has been successfully saved in ${activeCollection}.`,
      });

      // Reload sidebar list
      await fetchCmsItems();
      // Set active select
      setSelectedItem({ id: docId, ...payload } as CmsItemType);
    } catch (err: any) {
      console.error("Error saving CMS document:", err);
      toast({
        title: "Save Failed",
        description: err.message || "Could not write content to database.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Delete handler
  const handleDelete = async () => {
    if (!firestore || !selectedItem) return;

    if (!confirm(`Are you sure you want to permanently delete "${selectedItem.title}"? This cannot be undone.`)) {
      return;
    }

    try {
      await deleteDoc(doc(firestore, "cms_content", selectedItem.id));
      if (activeCollection === "productDetails") {
        await deleteDoc(doc(firestore, "books", selectedItem.id));
      }
      toast({
        title: "Entry Deleted",
        description: "Content successfully removed from the platform database.",
      });
      handleNewItem();
      await fetchCmsItems();
    } catch (err: any) {
      console.error("Error deleting CMS document:", err);
      toast({
        title: "Delete Failed",
        description: "Could not remove entry from Firestore.",
        variant: "destructive",
      });
    }
  };

  // Filter lists by search query
  const filteredItems = items.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Authenticate Admin / MicroAdmin roles
  if (userLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin && !isMicroAdmin) {
    return (
      <div className="text-center py-20 flex flex-col items-center">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4 animate-pulse" />
        <h1 className="text-2xl font-black">Access Denied</h1>
        <p className="text-muted-foreground mt-2">Only administrators and designated micro-admins can access Content Management tools.</p>
        <Button className="mt-6 rounded-full px-8" onClick={() => router.push("/")}>Go Home</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Upper Navigation Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-4xl font-black text-primary flex items-center gap-2 tracking-tight">
            <Sparkles className="w-8 h-8 text-primary" />
            Content Management Hub
          </h1>
          <p className="text-muted-foreground font-medium mt-1">
            Build, edit, and publish rich syllabus reviews, research institute guides, strategy blogs, and product briefs.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="rounded-full shadow-sm">
            <Link href="/dashboard">
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Dashboard
            </Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowGuideModal(true)}
            className="rounded-full shadow-sm gap-1.5 text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 font-black uppercase tracking-tight text-xs"
          >
            <BookOpen className="w-4 h-4 text-amber-500 animate-pulse" /> Admin Manual (0-Knowledge)
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setTourStep(1)}
            className="rounded-full shadow-sm gap-1.5 text-primary border-primary/20 hover:bg-primary/5 font-bold"
          >
            <HelpCircle className="w-4 h-4 text-primary" /> Guide Tour
          </Button>
          <Button onClick={() => handleNewItem()} className="rounded-full bg-primary font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:scale-105 transition-all">
            <PlusCircle className="mr-1.5 h-4 w-4" /> Create New Page
          </Button>
        </div>
      </div>

      {/* Main CMS Sub-Collection Selectors */}
      <div className={`grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 transition-all duration-300 ${tourStep === 1 ? "ring-4 ring-primary ring-offset-4 rounded-[2rem] shadow-xl z-20 bg-background scale-[1.01]" : ""}`}>
        {dynamicCollectionsList.map((col) => {
          const Icon = col.icon;
          const isActive = activeCollection === col.id;
          return (
            <button
              key={col.id}
              onClick={() => {
                setActiveCollection(col.id);
                if (col.id !== "employeeManagement") {
                  handleNewItem(col.id);
                }
              }}
              className={`p-4 rounded-3xl border-2 text-left transition-all flex flex-col gap-2 relative overflow-hidden ${isActive
                  ? "border-primary bg-primary/5 text-primary shadow-md scale-[1.02]"
                  : "border-border/60 text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                }`}
            >
              <div className={`p-2.5 rounded-2xl w-fit ${isActive ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-extrabold text-sm leading-tight">{col.label}</p>
                <p className="text-[10px] text-muted-foreground leading-normal mt-0.5 font-semibold line-clamp-2">{col.desc}</p>
              </div>
              {isActive && (
                <span className="absolute top-0 right-0 w-3 h-3 bg-primary rounded-bl-xl" />
              )}
            </button>
          );
        })}
      </div>

      {/* Employee Management or Standard CMS Dual Layout */}
      {activeCollection === "counsellingChats" ? (
        <div className="space-y-6">
          <Card className="rounded-[2.5rem] border-2 border-primary/20 bg-card shadow-xl overflow-hidden">
            <CardHeader className="border-b bg-muted/40 p-6 flex flex-row items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-xl font-black flex items-center gap-2 text-primary">
                  <MessageSquare className="w-6 h-6 text-primary animate-pulse" /> Counselling Support Chat Console
                </CardTitle>
                <CardDescription className="text-xs font-semibold">
                  Reply in real-time to active premium aspirants seeking counseling guidance.
                </CardDescription>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">Live Desk Active</span>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
                
                {/* Students Sidebar (1/3) */}
                <div className="md:col-span-1 border-r pr-4 overflow-y-auto space-y-3">
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-muted-foreground pb-2">Active Students ({studentSessions.length})</h3>
                  {studentSessions.length === 0 ? (
                    <div className="text-center py-10 italic text-muted-foreground text-xs font-semibold">
                      No active student chats found.
                    </div>
                  ) : (
                    studentSessions.map((student) => {
                      const isSelected = selectedStudentId === student.userId;
                      const hasUnread = student.messages.some((msg: any) => msg.sender === "student" && !msg.read);
                      return (
                        <button
                          key={student.userId}
                          type="button"
                          onClick={() => setSelectedStudentId(student.userId)}
                          className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex flex-col gap-1.5 relative ${
                            isSelected 
                              ? "border-primary bg-primary/5 text-primary shadow-sm animate-none" 
                              : "border-border/60 hover:bg-secondary/40 text-foreground"
                          }`}
                        >
                          <div className="flex justify-between items-center w-full">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-xs max-w-[130px] truncate">{student.userName}</span>
                              {hasUnread && (
                                <span className="flex h-2 w-2 relative">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600 animate-pulse"></span>
                                </span>
                              )}
                            </div>
                            <span className="text-[9px] font-bold text-muted-foreground truncate max-w-[90px]">{student.userEmail}</span>
                          </div>
                          <p className="text-[11px] font-semibold text-muted-foreground line-clamp-1 italic">
                            {student.lastMessage || "No messages"}
                          </p>
                        </button>
                      );
                    })
                  )}
                </div>
                
                {/* Conversation Panel (2/3) */}
                <div className="md:col-span-2 flex flex-col h-full">
                  {(() => {
                    const currentStudent = studentSessions.find(s => s.userId === selectedStudentId);
                    if (!currentStudent) {
                      return (
                        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                          <MessageSquare className="w-12 h-12 text-primary/30 mx-auto" />
                          <div className="space-y-1">
                            <p className="font-extrabold text-sm text-foreground">Select a Student to Start Counselling</p>
                            <p className="text-xs text-muted-foreground font-semibold max-w-sm">
                              Paid student queries will appear on the sidebar immediately. Click any student to review history and reply.
                            </p>
                          </div>
                        </div>
                      );
                    }
                    
                    return (
                      <div className="flex-grow flex flex-col h-full justify-between">
                        {/* Messages Thread */}
                        <div className="flex-1 overflow-y-auto space-y-4 pr-2 pb-4 max-h-[450px]">
                          {currentStudent.messages.map((msg: any) => {
                            const isUserAdmin = msg.sender === "admin";
                            return (
                              <div
                                key={msg.id}
                                className={`flex flex-col ${isUserAdmin ? "items-end" : "items-start"} space-y-1`}
                              >
                                <span className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-wider px-1">
                                  {isUserAdmin ? "You (Mentor)" : currentStudent.userName}
                                </span>
                                <div
                                  className={`p-3 rounded-2xl max-w-[80%] text-xs font-semibold leading-relaxed shadow-sm ${
                                    isUserAdmin
                                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                                      : "bg-slate-100 border text-slate-800 rounded-tl-sm"
                                  }`}
                                >
                                  {msg.message}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* Reply Form */}
                        <form
                          onSubmit={(e) => handleSendAdminReply(e, currentStudent)}
                          className="border-t pt-4 flex gap-2"
                        >
                          <input
                            type="text"
                            placeholder={`Reply to ${currentStudent.userName}...`}
                            value={adminReplyText}
                            onChange={(e) => setAdminReplyText(e.target.value)}
                            disabled={adminSendingMsg}
                            className="flex-1 rounded-xl border-2 px-4 py-3 text-xs font-semibold bg-background border-input focus:outline-none focus:border-primary transition-colors"
                          />
                          <Button
                            type="submit"
                            disabled={adminSendingMsg || !adminReplyText.trim()}
                            className="rounded-xl px-5 font-black text-xs uppercase tracking-wider"
                          >
                            {adminSendingMsg ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send"}
                          </Button>
                        </form>
                      </div>
                    );
                  })()}
                </div>
                
              </div>
            </CardContent>
          </Card>
        </div>
      ) : activeCollection === "employeeManagement" ? (
        <div className="space-y-6">
          <Card className="rounded-[2.5rem] border-2 border-primary/20 bg-gradient-to-br from-card to-primary/[0.02] shadow-xl overflow-hidden p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-primary/10 pb-6">
              <div className="space-y-1">
                <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                  <ShieldAlert className="w-7 h-7 text-secondary animate-pulse" /> Sudo Team privileges control panel
                </h2>
                <p className="text-xs text-muted-foreground font-semibold">
                  Secure administration interface for granting microadmin/sudo roles and resetting system passwords.
                </p>
              </div>
              <div className="flex gap-2">
                <Button type="button" onClick={() => fetchTeamUsers()} disabled={teamLoading} variant="outline" className="rounded-full font-bold text-xs bg-background">
                  {teamLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1 text-primary" /> : null} Sync Database
                </Button>
              </div>
            </div>

            {/* Filter Search Input */}
            <div className="pt-6 pb-4">
              <div className="relative">
                <Input
                  placeholder="Search user emails, names, or roles..."
                  value={teamSearchQuery}
                  onChange={(e) => setTeamSearchQuery(e.target.value)}
                  className="rounded-2xl border-2 pl-10 py-5 bg-background shadow-inner text-sm font-semibold"
                />
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60">🔍</span>
              </div>
            </div>

            {/* Users Table */}
            <div className="border border-primary/10 rounded-3xl overflow-hidden bg-background/50 backdrop-blur-sm overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-semibold">
                <thead>
                  <tr className="bg-primary/5 border-b border-primary/10 text-muted-foreground font-extrabold uppercase text-[10px] tracking-wider">
                    <th className="p-4">Staff Member Email</th>
                    <th className="p-4">Display Name</th>
                    <th className="p-4">Current Authority Level</th>
                    <th className="p-4 text-right">Administrative Options</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/5">
                  {teamLoading ? (
                    <tr>
                      <td colSpan={4} className="p-16 text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2 opacity-50" />
                        <p className="text-muted-foreground font-bold italic">Querying user logs...</p>
                      </td>
                    </tr>
                  ) : teamUsers.filter(u =>
                    u.email?.toLowerCase().includes(teamSearchQuery.toLowerCase()) ||
                    u.displayName?.toLowerCase().includes(teamSearchQuery.toLowerCase()) ||
                    u.role?.toLowerCase().includes(teamSearchQuery.toLowerCase())
                  ).length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-16 text-center text-muted-foreground font-bold italic">
                        No team or student registrations matching search criteria found.
                      </td>
                    </tr>
                  ) : (
                    teamUsers.filter(u =>
                      u.email?.toLowerCase().includes(teamSearchQuery.toLowerCase()) ||
                      u.displayName?.toLowerCase().includes(teamSearchQuery.toLowerCase()) ||
                      u.role?.toLowerCase().includes(teamSearchQuery.toLowerCase())
                    ).map((u) => {
                      const isMaster = u.email?.toLowerCase() === "vidyaheist@gmail.com";
                      const currentRole = isMaster ? "admin" : (u.role || "student");

                      return (
                        <tr key={u.id} className="hover:bg-primary/[0.01] transition-all">
                          <td className="p-4 font-mono font-bold text-foreground text-left">
                            {u.email}
                            {isMaster && (
                              <span className="ml-2 bg-secondary/10 text-secondary border border-secondary/25 text-[8px] font-black uppercase px-2 py-0.5 rounded-full">
                                MASTER SUDO
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-muted-foreground font-extrabold text-left">{u.displayName || "Unspecified"}</td>
                          <td className="p-4 text-left">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${currentRole === "admin"
                                ? "bg-red-500/10 text-red-600 border-red-500/20"
                                : currentRole === "microadmin"
                                  ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                                  : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                              }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${currentRole === "admin" ? "bg-red-500 animate-pulse" : currentRole === "microadmin" ? "bg-yellow-500" : "bg-blue-500"
                                }`} />
                              {currentRole === "admin" ? "Sudo" : currentRole === "microadmin" ? "Microadmin" : "Student"}
                            </span>
                          </td>
                          <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                            {/* Promote to Sudo */}
                            <Button
                              type="button"
                              onClick={() => handleUpdateRole(u.id, u.email, "admin")}
                              disabled={isMaster || currentRole === "admin"}
                              size="sm"
                              className="rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] h-7 px-3"
                            >
                              Make Sudo
                            </Button>

                            {/* Promote to Microadmin */}
                            <Button
                              type="button"
                              onClick={() => handleUpdateRole(u.id, u.email, "microadmin")}
                              disabled={isMaster || currentRole === "microadmin"}
                              variant="outline"
                              size="sm"
                              className="rounded-full text-[10px] h-7 px-3 border-yellow-600/30 text-yellow-600 hover:bg-yellow-600/10 font-bold bg-background"
                            >
                              Make Micro
                            </Button>

                            {/* Demote / Remove Privileges */}
                            <Button
                              type="button"
                              onClick={() => handleUpdateRole(u.id, u.email, "student")}
                              disabled={isMaster || currentRole === "student"}
                              variant="ghost"
                              size="sm"
                              className="rounded-full text-[10px] h-7 px-3 text-muted-foreground hover:text-red-600 hover:bg-red-500/5 font-semibold"
                            >
                              Revoke
                            </Button>

                            {/* Reset Password */}
                            <Button
                              type="button"
                              onClick={() => {
                                setSelectedTeamUser(u);
                                setShowPasswordModal(true);
                              }}
                              disabled={isMaster}
                              variant="outline"
                              size="sm"
                              className="rounded-full text-[10px] h-7 px-3 border-primary/20 text-primary hover:bg-primary/5 font-bold bg-background"
                            >
                              🔒 Password
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Beautiful System Role Rights Definitions Card */}
          <Card className="rounded-[2.5rem] border-2 border-primary/20 bg-gradient-to-br from-card to-primary/[0.01] shadow-xl overflow-hidden p-8 mt-6">
            <div className="space-y-6">
              <div className="border-b border-primary/10 pb-4">
                <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary animate-pulse" /> Platform Staff Authority Definitions
                </h3>
                <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                  Detailed permissions, boundaries, and direct authority matrix for all platform roles.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Master Sudo */}
                <div className="p-5 rounded-3xl border border-secondary/20 bg-secondary/5 space-y-3.5 relative overflow-hidden flex flex-col justify-between">
                  <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-secondary rounded-bl-lg" />
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-secondary/10 text-secondary">
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                      <h4 className="font-extrabold text-sm text-foreground">1. Master Sudo <span className="text-[9px] text-secondary font-mono">(vidyaheist@gmail.com)</span></h4>
                    </div>
                    
                    <div className="space-y-2 text-[10px] leading-relaxed">
                      <div>
                        <span className="text-secondary font-bold uppercase text-[9px] tracking-wider block">Privileges:</span>
                        <p className="text-muted-foreground font-semibold">Absolute root control over the entire platform, databases, and APIs.</p>
                      </div>
                      <div>
                        <span className="text-secondary font-bold uppercase text-[9px] tracking-wider block">Sudo Actions:</span>
                        <p className="text-muted-foreground font-semibold">Only account authorized to promote/demote staff members or manually set/reset system passwords.</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t border-secondary/10">
                    <span className="text-secondary font-bold uppercase text-[9px] tracking-wider block">Security Constraint:</span>
                    <p className="text-[10px] text-foreground font-bold italic">Irreversible; cannot be demoted or edited by any other administrator.</p>
                  </div>
                </div>

                {/* Sudo */}
                <div className="p-5 rounded-3xl border border-red-500/20 bg-red-500/5 space-y-3.5 relative overflow-hidden flex flex-col justify-between">
                  <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-bl-lg animate-pulse" />
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-red-500/10 text-red-600">
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                      <h4 className="font-extrabold text-sm text-foreground">2. Sudo (Admin)</h4>
                    </div>
                    
                    <div className="space-y-2 text-[10px] leading-relaxed">
                      <div>
                        <span className="text-red-500 font-bold uppercase text-[9px] tracking-wider block">Privileges:</span>
                        <p className="text-muted-foreground font-semibold">Full operational management of courses, test series, books, and JoSAA counselling leads.</p>
                      </div>
                      <div>
                        <span className="text-red-500 font-bold uppercase text-[9px] tracking-wider block">Sudo Actions:</span>
                        <p className="text-muted-foreground font-semibold">Approve Razorpay orders, view student files, edit/publish blogs, and update book tracking info.</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-red-500/10">
                    <span className="text-red-500 font-bold uppercase text-[9px] tracking-wider block">Restriction:</span>
                    <p className="text-[10px] text-foreground font-bold italic">Cannot access the team privileges panel, promote staff, or reset passwords.</p>
                  </div>
                </div>

                {/* Microadmin */}
                <div className="p-5 rounded-3xl border border-yellow-500/20 bg-yellow-500/5 space-y-3.5 relative overflow-hidden flex flex-col justify-between">
                  <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-yellow-500 rounded-bl-lg" />
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-yellow-500/10 text-yellow-600">
                        <Settings className="w-4 h-4" />
                      </div>
                      <h4 className="font-extrabold text-sm text-foreground">3. Micro-Admin</h4>
                    </div>
                    
                    <div className="space-y-2 text-[10px] leading-relaxed">
                      <div>
                        <span className="text-yellow-600 font-bold uppercase text-[9px] tracking-wider block">Privileges:</span>
                        <p className="text-muted-foreground font-semibold">Content drafting and inventory management.</p>
                      </div>
                      <div>
                        <span className="text-yellow-600 font-bold uppercase text-[9px] tracking-wider block">Sudo Actions:</span>
                        <p className="text-muted-foreground font-semibold">Create books, upload blogs, add resources, publish podcasts, and update physical book tracking IDs.</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-yellow-500/10">
                    <span className="text-yellow-600 font-bold uppercase text-[9px] tracking-wider block">Restriction:</span>
                    <p className="text-[10px] text-foreground font-bold italic">Cannot manage team roles, verify financial transactions, or access student counselling logs.</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Password Update Modal */}
          {showPasswordModal && selectedTeamUser && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <div onClick={() => {
                setShowPasswordModal(false);
                setSelectedTeamUser(null);
              }} className="fixed inset-0 bg-background/80 backdrop-blur-sm" />
              <div className="relative w-full max-w-md bg-card border-2 border-primary/20 shadow-2xl rounded-[2.5rem] overflow-hidden p-6 z-10 space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h3 className="text-lg font-black tracking-tight text-foreground">Reset User Password</h3>
                    <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">Changing credentials for {selectedTeamUser.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordModal(false);
                      setSelectedTeamUser(null);
                    }}
                    className="p-1.5 bg-muted rounded-full text-muted-foreground hover:text-foreground transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-muted-foreground">New Security Password</label>
                  <Input
                    type="password"
                    placeholder="Enter at least 6 characters..."
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="rounded-xl border-2 bg-background"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <Button
                    type="button"
                    onClick={() => {
                      setShowPasswordModal(false);
                      setSelectedTeamUser(null);
                    }}
                    variant="ghost"
                    className="rounded-full text-xs font-bold"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleUpdatePassword}
                    disabled={passwordUpdating || newPassword.length < 6}
                    className="rounded-full px-6 font-black bg-primary"
                  >
                    {passwordUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null} Save Password
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: List Entries */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="rounded-3xl border shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold flex items-center justify-between">
                  <span>Directory</span>
                  <span className="text-xs bg-primary/10 text-primary font-black uppercase px-2.5 py-1 rounded-full border border-primary/20">
                    {filteredItems.length} items
                  </span>
                </CardTitle>
                <CardDescription className="font-semibold">Manage pages in this dynamic category.</CardDescription>
                <div className="pt-2">
                  <Input
                    placeholder="Search pages, slugs, or tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="rounded-xl border-2"
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
                {itemsLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
                    <p className="text-xs font-semibold text-muted-foreground">Reading database catalog...</p>
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="text-center py-16 bg-muted/20 rounded-3xl border-2 border-dashed">
                    <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-60" />
                    <p className="text-sm text-muted-foreground font-bold italic">No cataloged pages found.</p>
                    <Button variant="link" size="sm" onClick={() => handleNewItem()} className="text-primary font-bold mt-1">Create one now</Button>
                  </div>
                ) : (
                  filteredItems.map((item) => {
                    const isSelected = selectedItem?.id === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelectItem(item)}
                        className={`w-full text-left p-4 rounded-2xl border transition-all flex flex-col gap-1.5 ${isSelected
                            ? "border-primary bg-primary/[0.03] shadow-md ring-2 ring-primary/25"
                            : "border-border/60 hover:bg-secondary/40"
                          }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span className="font-extrabold text-sm leading-snug text-foreground truncate max-w-[170px]">{item.title}</span>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${item.status === "published"
                              ? "bg-green-500/10 text-green-600 border-green-500/20"
                              : "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                            }`}>
                            {item.status}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[11px] text-muted-foreground font-semibold">
                          <span className="font-mono bg-muted px-1.5 py-0.5 rounded">/{item.slug}</span>
                          <span>{item.category}</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Complete Creator / Editor Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSave} className="space-y-6">
              <Card className="shadow-lg border-2 border-primary/20 rounded-[2rem] overflow-hidden">
                <CardHeader className="bg-primary/5 rounded-t-[22px] border-b pb-4 flex flex-row items-center justify-between gap-4 flex-wrap">
                  <div>
                    <CardTitle className="text-xl font-black flex items-center gap-2">
                      {activeCollection === "productDetails" ? (
                        <>
                          <ShoppingBag className="w-5.5 h-5.5 text-primary animate-pulse" />
                          {selectedItem ? `Product Listing: ${selectedItem.title}` : "Create Storefront Product Details"}
                        </>
                      ) : (
                        <>
                          <FileText className="w-5 h-5 text-primary" />
                          {selectedItem ? `Editing: ${selectedItem.title}` : "Create New Form Entry"}
                        </>
                      )}
                    </CardTitle>
                    <CardDescription className="font-semibold text-xs mt-1">
                      {activeCollection === "productDetails"
                        ? "Configure marketing briefs, pricing details, custom syllabus guides, and covers."
                        : "Fill out structural attributes to publish this content card."}
                    </CardDescription>
                  </div>
                  {selectedItem && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 rounded-full font-black text-xs h-9 px-4 shrink-0 border border-destructive/15"
                      onClick={handleDelete}
                    >
                      <Trash className="w-3.5 h-3.5 mr-1" /> Delete Entry
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  {/* Title & Slug Generator Fields */}
                  <div className={`space-y-4 p-4 rounded-3xl transition-all duration-300 ${tourStep === 2 ? "ring-4 ring-primary ring-offset-4 shadow-xl z-20 bg-background" : ""}`}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="title" className="font-bold">
                          {activeCollection === "productDetails" ? "Product / Course Name" :
                            activeCollection === "resources" ? "Resource PDF Document Title" :
                              activeCollection === "podcasts" ? "Podcast Episode Title" :
                                activeCollection === "globalAnnouncement" ? "Global Popup Announcement Title" :
                                  activeCollection === "counselling" ? "Counselling Session / Resource Title" :
                                    "Page / Resource Title"}
                        </Label>
                        <Input
                          id="title"
                          placeholder={
                            activeCollection === "productDetails" ? "e.g. IAT 2026 Physics & Math Master Kit" :
                              activeCollection === "resources" ? "e.g. IAT 2025 Comprehensive Physics Formula Sheet" :
                                activeCollection === "podcasts" ? "e.g. Episode #3: Crack NEST 2026 with AIR 12 Student" :
                                  activeCollection === "globalAnnouncement" ? "e.g. 🚀 Admissions Counselling Program 2026 is LIVE!" :
                                    activeCollection === "counselling" ? "e.g. Zoom Live Session: Dream vs Safe IISER Choices" :
                                      "e.g. IISER Pune College Profile"
                          }
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          required
                          className="rounded-xl border-2 font-semibold"
                        />
                      </div>
                      {activeCollection === "productDetails" ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <Label className="font-bold flex items-center justify-between">
                              <span>Link Store Catalog Book</span>
                              <span className="text-[10px] text-primary font-bold">Auto-pairs slug ID</span>
                            </Label>
                            <select
                              className="w-full rounded-xl border-2 p-2.5 bg-background font-bold text-sm"
                              value={slug}
                              onChange={(e) => {
                                const val = e.target.value;
                                setSlug(val);
                                const foundBook = booksCatalog.find((b) => b.id === val);
                                if (foundBook) {
                                  setTitle(foundBook.name);
                                }
                              }}
                            >
                              <option value="">-- Choose Product catalog item --</option>
                              {booksCatalog.map((b) => (
                                <option key={b.id} value={b.id}>
                                  {b.name} ({b.id})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="slug" className="font-bold flex items-center justify-between">
                              <span>Unique Routing Slug</span>
                              <button
                                type="button"
                                onClick={generateSlug}
                                className="text-[10px] text-primary hover:underline font-extrabold focus:outline-none"
                              >
                                Auto-Generate
                              </button>
                            </Label>
                            <div className="flex gap-2">
                              <span className="flex items-center text-xs text-muted-foreground font-mono bg-muted border-2 border-r-0 rounded-l-xl px-3 shrink-0">
                                /
                              </span>
                              <Input
                                id="slug"
                                placeholder="e.g. custom-product-slug"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                                required
                                className="rounded-r-xl border-2 rounded-l-none"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <Label htmlFor="slug" className="font-bold flex items-center justify-between">
                            <span>Unique Routing Slug</span>
                            <button
                              type="button"
                              onClick={generateSlug}
                              className="text-[10px] text-primary hover:underline font-extrabold focus:outline-none"
                            >
                              Auto-Generate
                            </button>
                          </Label>
                          <div className="flex gap-2">
                            <span className="flex items-center text-xs text-muted-foreground font-mono bg-muted border-2 border-r-0 rounded-l-xl px-3 shrink-0">
                              /
                            </span>
                            <Input
                              id="slug"
                              placeholder={activeCollection === "globalAnnouncement" ? "e.g. iat-counseling-alert" : "e.g. iiser-pune"}
                              value={slug}
                              onChange={(e) => setSlug(e.target.value)}
                              required
                              className="rounded-r-xl border-2 rounded-l-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Subtitle / Description Section */}
                  <div className="space-y-1">
                    <Label htmlFor="description" className="font-bold">
                      {activeCollection === "productDetails" ? "Marketing Highlights / Bullet Specifications" :
                        activeCollection === "resources" ? "Resource Summary / Inclusions" :
                          activeCollection === "podcasts" ? "Episode Details / Guest Highlights" :
                            activeCollection === "globalAnnouncement" ? "Short Marketing Caption / Subtitle" :
                              activeCollection === "counselling" ? "Counselling Resource / Live Session Short Details" :
                                "Short Description / Subtitle Summary"}
                    </Label>
                    <Textarea
                      id="description"
                      placeholder={
                        activeCollection === "productDetails" ? "e.g. Package details: Includes 10 solved mock books, full LaTeX formula index cards, and chapter guides..." :
                          activeCollection === "resources" ? "e.g. 20-page comprehensive formula reference list covering electromagnetism, kinematics, and optics..." :
                            activeCollection === "podcasts" ? "e.g. Discussion on student life at NISER Bhubaneswar, high-yield topics, and personal routines..." :
                              activeCollection === "globalAnnouncement" ? "e.g. Get 1-on-1 mentorship from top researchers and alumni. Limited seats available!" :
                                activeCollection === "counselling" ? "e.g. Expected expected closing trends, seat divisions, and round by round choices..." :
                                  "Provide a high-yield summary or description for card widgets..."
                      }
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={2}
                      className="rounded-xl border-2 resize-none font-semibold"
                    />
                  </div>

                  {/* Category & Custom URL Links */}
                  <div className={cn(
                    "grid grid-cols-1 gap-4",
                    activeCollection === "productDetails" ? "sm:grid-cols-3" : "sm:grid-cols-2"
                  )}>
                    <div className="space-y-1">
                      <Label htmlFor="category" className="font-bold">
                        {activeCollection === "productDetails" ? "Publisher / Brand Category" :
                          activeCollection === "resources" ? "Study Material Category / Subject" :
                            activeCollection === "podcasts" ? "Academic Stream / Guest Stream" :
                              activeCollection === "globalAnnouncement" ? "Announcement Badge Category" :
                                activeCollection === "counselling" ? "Counselling Asset Type (zoom / link / pdf)" :
                                  "Category Tag / Subject Domain"}
                      </Label>
                      {activeCollection === "counselling" ? (
                        <select
                          id="category"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          required
                          className="w-full rounded-xl border-2 px-3 h-10 bg-background font-semibold text-sm border-input"
                        >
                          <option value="">-- Select Type --</option>
                          <option value="zoom">Live Zoom Webinar (zoom)</option>
                          <option value="link">Social Community Link (link)</option>
                          <option value="pdf">Downloadable PDF Guide (pdf)</option>
                        </select>
                      ) : (
                        <Input
                          id="category"
                          placeholder={
                            activeCollection === "productDetails" ? "e.g. E-Books / Physics / IAT Mock Exams" :
                              activeCollection === "resources" ? "e.g. Physics Formula Sheet, Math PDF, NEST Syllabus" :
                                activeCollection === "podcasts" ? "e.g. Biology Research, Student Journey, College Life" :
                                  activeCollection === "globalAnnouncement" ? "e.g. New Launch, Special Offer, Platform Alert" :
                                    "e.g. Admission, Physics, Careers, IISER Kolkata"
                          }
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          required
                          className="rounded-xl border-2 font-semibold"
                        />
                      )}
                    </div>

                    {activeCollection === "productDetails" && (
                      <div className="space-y-1">
                        <Label htmlFor="price" className="font-bold flex items-center justify-between">
                          <span>List Price (INR)</span>
                          <span className="text-[10px] text-primary font-bold">0 = Free Book</span>
                        </Label>
                        <Input
                          id="price"
                          type="number"
                          placeholder="e.g. 499"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          required
                          className="rounded-xl border-2 font-semibold"
                        />
                      </div>
                    )}

                    {activeCollection === "globalAnnouncement" ? (
                      <div className="space-y-1">
                        <Label htmlFor="linkUrl" className="font-bold flex items-center justify-between">
                          <span>Action Redirect URL (Learn More Link)</span>
                          <span className="text-[10px] text-secondary font-bold">CTA Button URL</span>
                        </Label>
                        <Input
                          id="linkUrl"
                          placeholder="e.g. /store/books/counselling-2026"
                          value={linkUrl}
                          onChange={(e) => setLinkUrl(e.target.value)}
                          className="rounded-xl border-2 font-semibold"
                        />
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Label htmlFor="linkUrl" className="font-bold flex items-center justify-between">
                          <span>
                            {activeCollection === "resources" ? "Primary Downloadable PDF / Sheet Asset" :
                              activeCollection === "podcasts" ? "Podcast Audio Recording (.mp3 / .wav)" :
                                activeCollection === "counselling" ? "Zoom Join Link / PDF Download URL / Group Link" :
                                  "External Attachment / Sheet / PDF URL"}
                          </span>
                          {attachmentUploading && (
                            <span className="text-[10px] text-primary animate-pulse font-bold">Uploading file...</span>
                          )}
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            id="linkUrl"
                            placeholder={
                              activeCollection === "resources" ? "PDF URL or click Upload Sheet..." :
                                activeCollection === "podcasts" ? "Audio MP3 URL or click Upload Audio..." :
                                  activeCollection === "counselling" ? "Paste link here or upload sheet/file..." :
                                    "Attachment URL link or click Upload File..."
                            }
                            value={linkUrl}
                            onChange={(e) => setLinkUrl(e.target.value)}
                            className="rounded-xl border-2 flex-1 font-semibold"
                          />
                          <label className="flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/95 shadow-md px-4 rounded-xl cursor-pointer shrink-0 transition-all font-bold text-xs gap-1.5 hover:scale-103">
                            <Upload className="w-3.5 h-3.5" />
                            {activeCollection === "resources" ? "Upload PDF" :
                              activeCollection === "podcasts" ? "Upload Audio" :
                                "Upload File"}
                            <input
                              type="file"
                              accept={
                                activeCollection === "resources" ? "application/pdf" :
                                  activeCollection === "podcasts" ? "audio/*" :
                                    "image/*,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,audio/*"
                              }
                              className="hidden"
                              onChange={handleAttachmentUpload}
                              disabled={attachmentUploading}
                            />
                          </label>
                        </div>
                        {attachmentUploading && (
                          <div className="space-y-1">
                            <Progress value={attachmentProgress} className="h-1.5 mt-1" />
                            <span className="text-[9px] text-muted-foreground font-semibold">Uploading... {Math.round(attachmentProgress)}%</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Visual Cover Banner Asset Uploader */}
                  <div className={`bg-secondary/20 p-4 rounded-2xl border-2 border-dashed border-primary/20 space-y-3 transition-all duration-300 ${tourStep === 3 ? "ring-4 ring-primary ring-offset-4 shadow-xl z-20 bg-background" : ""}`}>
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-primary" />
                      <Label className="font-bold text-sm">Upload Page Banner / Book Graphic Cover</Label>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Image URL link or upload cover..."
                        value={coverImage}
                        onChange={(e) => setCoverImage(e.target.value)}
                        className="rounded-xl border-2 bg-background flex-1"
                      />
                      <label className="flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/95 shadow-md px-4 rounded-xl cursor-pointer shrink-0 transition-all font-bold text-xs gap-1.5">
                        <Upload className="w-3.5 h-3.5" /> Upload File
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                          disabled={imageUploading}
                        />
                      </label>
                    </div>
                    {imageUploading && (
                      <div className="space-y-1.5">
                        <Progress value={imageProgress} className="h-1.5" />
                        <span className="text-[10px] text-muted-foreground font-bold">Uploading file... {Math.round(imageProgress)}%</span>
                      </div>
                    )}
                  </div>

                  {/* Rich Formatting Toolbar & Content Area */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <Label className="font-bold">Content Editor (Supports Markdown, HTML, and LaTeX)</Label>
                      {/* Editor Tab Toggle */}
                      <div className={`flex bg-muted p-1 rounded-xl shadow-inner text-xs font-bold gap-1 transition-all duration-300 ${tourStep === 5 ? "ring-4 ring-primary ring-offset-4 shadow-xl z-20 scale-105" : ""}`}>
                        <button
                          type="button"
                          onClick={() => setEditorTab("edit")}
                          className={`px-3 py-1.5 rounded-lg transition-all ${editorTab === "edit" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                        >
                          <Edit className="w-3 h-3 inline-block mr-1" /> Edit Content
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditorTab("preview")}
                          className={`px-3 py-1.5 rounded-lg transition-all ${editorTab === "preview" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                        >
                          <Eye className="w-3 h-3 inline-block mr-1" /> Live Preview
                        </button>
                      </div>
                    </div>

                    {editorTab === "edit" ? (
                      <div className={`border-2 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:border-primary transition-all duration-300 ${tourStep === 4 ? "ring-4 ring-primary ring-offset-4 shadow-xl z-20 bg-background" : ""}`}>
                        {/* Rich Formatting Helper Toolbar */}
                        <div className="bg-muted/60 p-2 border-b flex flex-wrap gap-1 items-center">
                          <button type="button" onClick={() => insertFormat("**", "**", "boldText")} title="Bold" className="p-1.5 hover:bg-secondary rounded-lg transition-colors"><Bold className="w-4 h-4 text-foreground" /></button>
                          <button type="button" onClick={() => insertFormat("*", "*", "italicText")} title="Italic" className="p-1.5 hover:bg-secondary rounded-lg transition-colors"><Italic className="w-4 h-4 text-foreground" /></button>
                          <span className="w-[1px] h-4 bg-border/80 mx-1" />
                          <button type="button" onClick={() => insertFormat("# ", "", "H1 Header")} title="Heading 1" className="p-1.5 hover:bg-secondary rounded-lg transition-colors"><Heading1 className="w-4 h-4 text-foreground" /></button>
                          <button type="button" onClick={() => insertFormat("## ", "", "H2 Header")} title="Heading 2" className="p-1.5 hover:bg-secondary rounded-lg transition-colors"><Heading2 className="w-4 h-4 text-foreground" /></button>
                          <button type="button" onClick={() => insertFormat("### ", "", "H3 Header")} title="Heading 3" className="p-1.5 hover:bg-secondary rounded-lg transition-colors"><Heading3 className="w-4 h-4 text-foreground" /></button>
                          <span className="w-[1px] h-4 bg-border/80 mx-1" />
                          <button type="button" onClick={() => insertFormat("- ", "", "ListItem")} title="Unordered List" className="p-1.5 hover:bg-secondary rounded-lg transition-colors"><List className="w-4 h-4 text-foreground" /></button>
                          <button type="button" onClick={() => insertFormat("1. ", "", "ListItem")} title="Ordered List" className="p-1.5 hover:bg-secondary rounded-lg transition-colors"><ListOrdered className="w-4 h-4 text-foreground" /></button>
                          <span className="w-[1px] h-4 bg-border/80 mx-1" />
                          <button type="button" onClick={() => insertFormat("[", "](url)", "LinkText")} title="Add Hyperlink" className="p-1.5 hover:bg-secondary rounded-lg transition-colors"><Link2 className="w-4 h-4 text-foreground" /></button>

                          {/* Direct Native Media File Uploader in Editor Toolbar */}
                          <div className="relative flex items-center">
                            <label
                              title="Upload and Insert Image/Video File"
                              className={`p-1.5 hover:bg-secondary rounded-lg transition-all flex items-center gap-1.5 text-xs font-black text-primary cursor-pointer ${editorMediaUploading ? "animate-pulse pointer-events-none opacity-50" : ""
                                }`}
                            >
                              <ImageIcon className="w-4 h-4 text-foreground" />
                              <span className="text-[10px] text-primary font-black uppercase tracking-tight">Upload</span>
                              <input
                                type="file"
                                accept="image/*,video/*"
                                className="hidden"
                                onChange={handleEditorMediaUpload}
                                disabled={editorMediaUploading}
                              />
                            </label>
                            {editorMediaUploading && (
                              <span className="text-[9px] text-primary font-black ml-1 animate-pulse bg-primary/10 px-1.5 py-0.5 rounded-full">
                                {Math.round(editorMediaProgress)}%
                              </span>
                            )}
                          </div>
                          <span className="w-[1px] h-4 bg-border/80 mx-1" />
                          <button type="button" onClick={() => insertFormat("> ", "", "blockQuote")} title="Blockquote" className="p-1.5 hover:bg-secondary rounded-lg transition-colors"><Quote className="w-4 h-4 text-foreground" /></button>
                          <button type="button" onClick={() => insertFormat("```\n", "\n```", "codeContent")} title="Code Block" className="p-1.5 hover:bg-secondary rounded-lg transition-colors"><Code className="w-4 h-4 text-foreground" /></button>
                          <button type="button" onClick={() => insertFormat("\n| Header 1 | Header 2 |\n| -------- | -------- |\n| Content  | Content  |\n")} title="Table grid" className="p-1.5 hover:bg-secondary rounded-lg transition-colors"><Table2 className="w-4 h-4 text-foreground" /></button>
                          <span className="w-[1px] h-4 bg-border/80 mx-1" />
                          <button type="button" onClick={() => insertFormat("$", "$", "inlineEquation")} title="Inline LaTeX ($...$)" className="p-1.5 hover:bg-secondary rounded-lg transition-colors flex items-center gap-0.5 text-xs font-bold text-primary"><Sigma className="w-3.5 h-3.5" /> In</button>
                          <button type="button" onClick={() => insertFormat("$$\n", "\n$$", "blockEquation")} title="Block LaTeX ($$...$$)" className="p-1.5 hover:bg-secondary rounded-lg transition-colors flex items-center gap-0.5 text-xs font-bold text-primary"><Sigma className="w-3.5 h-3.5" /> Blk</button>
                          {activeCollection === "productDetails" && (
                            <button
                              type="button"
                              onClick={() => {
                                setContent(`### 🛍️ Product Features & Highlights
*   **10 Complete Practice Tests** aligned exactly with the latest IAT/NEST paper patterns.
*   **Step-by-Step AI Solutions** with complete mathematical breakdowns ($\\Sigma$ & formulas).
*   **High-Yield Syllabus Checklists** to monitor your prep daily.

---

### 📖 Extended Syllabus Coverage
#### 1. Physics & Math Core
*   Electromagnetism, Quantum Foundations, and KaTeX Integrals:
    $$\\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}$$
*   Coordinate Geometry and Matrices.

#### 2. Chemistry & Biology Highlights
*   Organic Reaction Mechanisms and Molecular Genetics.`);
                                toast({
                                  title: "Storefront Details Template Loaded",
                                  description: "Product layout outlines populated successfully.",
                                });
                              }}
                              className="ml-auto bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 text-[10px] font-black uppercase px-2.5 py-1.5 rounded-lg flex items-center gap-1 shrink-0 transition-all hover:scale-103 cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-secondary animate-pulse" /> Load Storefront Details Template
                            </button>
                          )}
                        </div>

                        {/* Spacious Content Input Textarea */}
                        <textarea
                          id="content"
                          ref={textareaRef}
                          placeholder="Start typing your rich syllabus outline or research guidelines. Use $...$ for equations and standard markdown tables. Toggle the Live Preview tab to verify formatting anytime."
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          rows={16}
                          required
                          className="w-full p-4 bg-background outline-none border-none resize-y min-h-[300px] text-base leading-relaxed placeholder:text-muted-foreground/60 focus:ring-0"
                        />
                      </div>
                    ) : (
                      /* Dynamic High-Fidelity Showcase Preview Mocks */
                      activeCollection === "productDetails" ? (
                        <div className="border-2 border-primary/20 rounded-[2rem] p-6 bg-gradient-to-br from-card to-primary/[0.02] shadow-xl space-y-6 max-h-[600px] overflow-y-auto">
                          <div className="flex flex-col lg:flex-row gap-6">
                            {/* Image Gallery and Product Card Cover */}
                            <div className="w-full lg:w-[200px] shrink-0 space-y-3">
                              <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden border shadow-md bg-muted flex items-center justify-center">
                                {coverImage ? (
                                  <img
                                    src={coverImage}
                                    alt={title || "Product Cover"}
                                    className="object-cover w-full h-full"
                                  />
                                ) : (
                                  <div className="text-center p-4 text-muted-foreground flex flex-col items-center gap-2">
                                    <ImageIcon className="w-8 h-8 opacity-40 text-primary" />
                                    <span className="text-xs font-bold">No cover uploaded</span>
                                  </div>
                                )}
                                <span className="absolute top-2 left-2 bg-red-600 text-white font-extrabold text-[9px] uppercase px-2 py-0.5 rounded shadow">
                                  HOT DEAL
                                </span>
                              </div>
                              <Button className="w-full rounded-xl bg-[#ff9f00] hover:bg-[#ff9f00]/90 text-white font-black text-xs h-9 uppercase shadow-sm">
                                Add to Cart
                              </Button>
                              <Button className="w-full rounded-xl bg-[#fb641b] hover:bg-[#fb641b]/90 text-white font-black text-xs h-9 uppercase shadow-sm">
                                Buy Now
                              </Button>
                            </div>

                            {/* Storefront Details Content */}
                            <div className="flex-1 space-y-4 text-left">
                              <div className="space-y-1">
                                <p className="text-[10px] text-primary font-black tracking-wider uppercase bg-primary/10 px-2.5 py-0.5 rounded-full w-fit">
                                  {category || "Publisher Category"}
                                </p>
                                <h3 className="text-xl font-extrabold tracking-tight text-foreground leading-tight">
                                  {title || "Unnamed Product listing"}
                                </h3>
                                {/* Mock Ratings */}
                                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                                  <span className="bg-green-700 text-white text-[10px] px-1.5 py-0.5 rounded font-black flex items-center gap-0.5">
                                    4.9 ★
                                  </span>
                                  <span>142 Ratings & 48 Reviews</span>
                                  <span className="text-green-600 font-bold ml-1">✓ Assured Partner</span>
                                </div>
                              </div>

                              {/* Bullet Highlights Section */}
                              <div className="space-y-1 bg-secondary/10 p-3.5 rounded-2xl border border-secondary/10">
                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">
                                  Key Highlights
                                </p>
                                {description ? (
                                  <p className="text-xs text-foreground font-semibold leading-relaxed whitespace-pre-line italic">
                                    {description}
                                  </p>
                                ) : (
                                  <p className="text-xs text-muted-foreground italic font-semibold">
                                    No highlights entered. Fill the highlights box above!
                                  </p>
                                )}
                              </div>

                              {/* Specifications Grid */}
                              <div className="space-y-2">
                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">
                                  Product Specifications
                                </p>
                                <div className="grid grid-cols-2 gap-2 text-[11px] bg-muted/50 p-3 rounded-2xl border font-semibold">
                                  <div>
                                    <span className="text-muted-foreground">Publisher:</span> VidyaHeist Pub
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Format:</span> Secure Digital PDF
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Language:</span> English
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Catalog Slug:</span> {slug || "Not Linked"}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Description rendering LaTeX formulas */}
                          <div className="border-t pt-4 space-y-2 text-left">
                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">
                              Detailed Description & Syllabus Inclusions
                            </p>
                            <div className="prose prose-slate dark:prose-invert max-w-none text-xs font-semibold leading-relaxed border bg-background p-4 sm:p-6 rounded-2xl shadow-inner">
                              {content.trim() ? (
                                <MathText text={content} />
                              ) : (
                                <span className="text-muted-foreground italic font-bold">Content is empty. Type in the editor!</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : activeCollection === "podcasts" ? (
                        <div className="border-2 border-primary/20 rounded-[2rem] p-6 bg-gradient-to-br from-card to-primary/[0.02] shadow-xl space-y-6 max-h-[500px] overflow-y-auto">
                          <div className="flex flex-col sm:flex-row gap-5 items-center text-left">
                            <div className="relative w-24 h-24 rounded-2xl overflow-hidden border shadow bg-muted shrink-0 flex items-center justify-center">
                              {coverImage ? (
                                <img src={coverImage} alt={title} className="object-cover w-full h-full" />
                              ) : (
                                <Mic className="w-8 h-8 opacity-40 text-primary" />
                              )}
                            </div>
                            <div className="flex-1 space-y-2">
                              <span className="bg-primary/10 text-primary border border-primary/25 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full">
                                🎧 PODCAST EPISODE
                              </span>
                              <h3 className="text-lg font-black tracking-tight">{title || "Unnamed Podcast Episode"}</h3>
                              <p className="text-xs text-muted-foreground font-bold">{category || "Guest Academic Stream"}</p>
                            </div>
                          </div>

                          {/* Audio Player Layout */}
                          <div className="bg-secondary/20 p-4 rounded-2xl border border-secondary/10 space-y-3 text-left">
                            <div className="flex items-center gap-3">
                              <Button className="w-10 h-10 rounded-full bg-primary hover:scale-103 shrink-0 flex items-center justify-center p-0">
                                <Play className="w-4 h-4 fill-white text-white translate-x-0.5" />
                              </Button>
                              <div className="flex-1 space-y-1">
                                <div className="h-1 bg-border rounded-full overflow-hidden">
                                  <div className="h-full bg-primary w-[30%]" />
                                </div>
                                <div className="flex justify-between text-[9px] font-bold text-muted-foreground">
                                  <span>02:14</span>
                                  <span>{linkUrl ? "Audio Stream Connected" : "No Audio File Uploaded"}</span>
                                </div>
                              </div>
                            </div>
                            {linkUrl && (
                              <div className="text-[10px] text-green-600 font-extrabold flex items-center gap-1 justify-center">
                                <Volume2 className="w-3.5 h-3.5" /> Direct Audio Stream: {linkUrl.substring(0, 45)}...
                              </div>
                            )}
                          </div>

                          <div className="prose prose-slate dark:prose-invert max-w-none text-xs font-semibold leading-relaxed border bg-background p-4 rounded-2xl shadow-inner text-left">
                            {content.trim() ? (
                              <MathText text={content} />
                            ) : (
                              <span className="text-muted-foreground italic font-bold">No episode synopsis details added.</span>
                            )}
                          </div>
                        </div>
                      ) : activeCollection === "resources" ? (
                        <div className="border-2 border-primary/20 rounded-[2rem] p-6 bg-gradient-to-br from-card to-primary/[0.02] shadow-xl space-y-4 max-h-[500px] overflow-y-auto text-left">
                          <div className="flex items-start gap-4">
                            <div className="p-3 bg-primary/10 border border-primary/20 rounded-2xl text-primary shrink-0">
                              <FolderOpen className="w-8 h-8 text-primary" />
                            </div>
                            <div className="space-y-1.5 flex-1">
                              <span className="bg-green-700/10 text-green-600 border border-green-700/25 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full">
                                📂 STUDY DOWNLOAD SHEET
                              </span>
                              <h3 className="text-lg font-black tracking-tight leading-tight">{title || "Untitled Study Sheet"}</h3>
                              <p className="text-xs text-muted-foreground font-bold">{category || "Physics / Chemistry Sheet"}</p>
                            </div>
                          </div>

                          {description && (
                            <p className="text-xs text-foreground bg-secondary/15 p-3 rounded-xl border font-bold leading-relaxed italic">
                              {description}
                            </p>
                          )}

                          {/* Download CTA Box */}
                          <div className="bg-primary/5 p-4 rounded-2xl border-2 border-dashed border-primary/15 flex flex-col sm:flex-row items-center justify-between gap-3">
                            <div className="text-center sm:text-left">
                              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">File Status</p>
                              <p className="text-xs font-black text-foreground">{linkUrl ? "📥 Direct PDF Download Link Ready" : "⚠️ No PDF Attachment uploaded yet"}</p>
                            </div>
                            {linkUrl ? (
                              <Button className="rounded-xl font-black text-xs gap-1.5 shadow" asChild>
                                <a href={linkUrl} target="_blank" rel="noreferrer">
                                  <Upload className="w-3.5 h-3.5 rotate-180" /> Download PDF Now
                                </a>
                              </Button>
                            ) : (
                              <Button disabled className="rounded-xl font-black text-xs gap-1.5 shadow opacity-50">
                                <Upload className="w-3.5 h-3.5 rotate-180" /> No File Linked
                              </Button>
                            )}
                          </div>

                          <div className="prose prose-slate dark:prose-invert max-w-none text-xs font-semibold leading-relaxed border bg-background p-4 rounded-2xl shadow-inner text-left">
                            {content.trim() ? (
                              <MathText text={content} />
                            ) : (
                              <span className="text-muted-foreground italic font-bold">No syllabus information specified yet.</span>
                            )}
                          </div>
                        </div>
                      ) : activeCollection === "globalAnnouncement" ? (
                        /* High-Fidelity Announcement Modal preview inside CMS page */
                        <div className="border-2 border-secondary/20 rounded-[2.5rem] p-6 bg-gradient-to-br from-card via-card to-primary/[0.03] shadow-2xl relative overflow-hidden text-left space-y-6">
                          {coverImage && (
                            <div className="relative w-full h-44 rounded-2xl overflow-hidden border shadow-sm">
                              <img src={coverImage} alt={title} className="object-cover w-full h-full" />
                              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
                            </div>
                          )}

                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="bg-primary/10 text-primary border border-primary/25 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1">
                                <Megaphone className="w-3 h-3" />
                                {category || "Announcement"}
                              </span>
                              <span className="text-[10px] text-muted-foreground font-extrabold flex items-center gap-0.5">
                                <Sparkles className="w-3.5 h-3.5 text-secondary animate-pulse" />
                                NEW PLATFORM UPDATE
                              </span>
                            </div>

                            <h2 className="text-2xl font-black text-foreground tracking-tight leading-tight">
                              {title || "Dynamic Modal Title"}
                            </h2>

                            {description && (
                              <p className="text-muted-foreground text-sm font-semibold italic">
                                {description}
                              </p>
                            )}
                          </div>

                          {/* Body Details */}
                          <div className="prose prose-slate dark:prose-invert max-w-none text-xs leading-relaxed border bg-background/50 p-4 rounded-2xl shadow-inner max-h-[150px] overflow-y-auto">
                            {content.trim() ? (
                              <MathText text={content} />
                            ) : (
                              <span className="text-muted-foreground italic font-semibold">Write the popup body inside the editor! Supports math equations.</span>
                            )}
                          </div>

                          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                            <Button variant="ghost" className="rounded-full font-bold text-xs">
                              Dismiss Update
                            </Button>
                            {linkUrl ? (
                              <Button className="rounded-full px-6 py-4 font-black shadow text-xs flex items-center gap-1.5 bg-primary">
                                Learn More & Enroll <PlusCircle className="w-3.5 h-3.5 rotate-45" />
                              </Button>
                            ) : (
                              <Button disabled className="rounded-full px-6 py-4 font-black text-xs opacity-50">
                                No action URL configured
                              </Button>
                            )}
                          </div>
                        </div>
                      ) : (
                        /* High-Fidelity Standard Markdown + LaTeX Preview tab */
                        <div className="border-2 rounded-2xl p-6 bg-background/50 backdrop-blur-sm min-h-[360px] max-h-[500px] overflow-y-auto prose prose-slate dark:prose-invert max-w-none shadow-inner text-left">
                          {content.trim() ? (
                            <MathText text={content} />
                          ) : (
                            <div className="flex flex-col items-center justify-center h-52 text-center text-muted-foreground italic gap-2 font-bold">
                              <Eye className="w-8 h-8 opacity-40 animate-pulse text-primary" />
                              <span>Preview is empty. Write some markdown content first!</span>
                            </div>
                          )}
                        </div>
                      )
                    )}
                  </div>

                  {/* Document Status Selection */}
                  <div className="flex items-center gap-6 justify-between pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground font-extrabold uppercase">Save Configuration</span>
                    </div>
                    <div className="flex gap-4 items-center">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setStatus("draft")}
                          className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${status === "draft"
                              ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/30 scale-102"
                              : "border-border/60 text-muted-foreground hover:bg-secondary/40"
                            }`}
                        >
                          Keep Draft
                        </button>
                        <button
                          type="button"
                          onClick={() => setStatus("published")}
                          className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 ${status === "published"
                              ? "bg-green-500/10 text-green-600 border-green-500/30 scale-102"
                              : "border-border/60 text-muted-foreground hover:bg-secondary/40"
                            }`}
                        >
                          <Globe className="w-3.5 h-3.5" /> Publish Live
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className={`bg-primary/[0.02] border-t p-6 flex justify-between gap-4 flex-wrap transition-all duration-300 ${tourStep === 6 ? "ring-4 ring-primary ring-offset-4 rounded-b-[22px] shadow-xl z-20" : ""}`}>
                  {selectedItem ? (
                    <Button type="button" variant="outline" onClick={() => handleNewItem()} className="rounded-full font-bold px-6">
                      Cancel Edit
                    </Button>
                  ) : (
                    <div />
                  )}
                  <Button type="submit" disabled={saving} className="rounded-full px-10 py-6 font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:scale-105 transition-all">
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving Entry...
                      </>
                    ) : selectedItem ? (
                      "Update Page Card"
                    ) : (
                      "Publish Content Page"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </div>
        </div>
      )}

      {/* Floating Tutorial Tour Tooltip Card */}
      {tourStep !== null && (
        <div className="fixed bottom-24 right-6 z-[99] w-[calc(100vw-3rem)] sm:w-full sm:max-w-sm bg-card border-2 border-primary shadow-2xl rounded-3xl p-6 space-y-4 animate-fade-in bg-gradient-to-br from-card to-primary/[0.02] ring-2 ring-primary/25">
          <div className="flex justify-between items-start">
            <span className="bg-primary/10 text-primary border border-primary/20 text-[10px] font-black uppercase px-2.5 py-1 rounded-full">
              Step {tourStep} of 6
            </span>
            <button
              type="button"
              onClick={() => setTourStep(null)}
              className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1.5">
            <h4 className="font-extrabold text-sm text-foreground">
              {tourStep === 1 && "1. Select Category Directories"}
              {tourStep === 2 && "2. Specify Attributes"}
              {tourStep === 3 && "3. Upload Cover Banners"}
              {tourStep === 4 && "4. Rich Formatting Editor Workspace"}
              {tourStep === 5 && "5. Scientific Math Preview Tab"}
              {tourStep === 6 && "6. Draft & Publish Save Sync"}
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
              {tourStep === 1 && "Choose which section directory page you are managing. Toggle between IISER/NISER guides, course Product Details, Strategy Blogs, Podcasts, or cutoff sheets."}
              {tourStep === 2 && "Define the Title. Clicking 'Auto-Generate' parses it into a clean custom routing slug. Add category domains, description briefs, or sheet links."}
              {tourStep === 3 && "Provide a banner image URL, or click 'Upload File' to stream graphic attachments directly into Firebase Storage. Visual progress tracks state automatically."}
              {tourStep === 4 && "Draft body outlines with standard Markdown. Use formatting toolbar buttons to quickly insert list bullets, tables, blockquotes, links, and Math LaTeX formulas."}
              {tourStep === 5 && "Verify linear algebra and KaTeX formulas ($x^2$) instantly before going live. Switch to 'Live Preview' to inspect the final look students will see."}
              {tourStep === 6 && "Select status to keep it as a private Draft or publish it immediately. Click 'Publish Content Page' to sync updates live across your application!"}
            </p>
          </div>

          <div className="flex justify-between items-center pt-2 gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={tourStep === 1}
              onClick={() => setTourStep(tourStep - 1)}
              className="rounded-full text-xs font-bold"
            >
              Back
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setTourStep(null)}
                className="rounded-full text-xs font-bold"
              >
                Skip Tour
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  if (tourStep < 6) {
                    setTourStep(tourStep + 1);
                  } else {
                    setTourStep(null);
                    toast({
                      title: "Tour Completed! 🎉",
                      description: "You are now ready to publish mathematical and strategy content with ease.",
                    });
                  }
                }}
                className="rounded-full text-xs font-bold bg-primary shadow-sm"
              >
                {tourStep === 6 ? "Finish" : "Next"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Zero-Knowledge Layman Admin Manual Modal */}
      <AnimatePresence>
        {showGuideModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowGuideModal(false)}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm animate-fade-in"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-3xl bg-card border-2 border-primary/20 shadow-2xl rounded-[2.5rem] overflow-hidden z-10 max-h-[90vh] flex flex-col p-1"
            >
              {/* Header */}
              <div className="bg-primary/5 rounded-t-[2.3rem] border-b p-6 flex items-center justify-between gap-4 shrink-0">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-secondary animate-pulse" />
                  <div>
                    <h2 className="text-xl font-black text-foreground tracking-tight">Zero-Knowledge Admin Manual</h2>
                    <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">Simple layman explanations for managing the VidyaHeist CMS portals</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowGuideModal(false)}
                  className="bg-background border border-primary/10 text-muted-foreground hover:text-foreground p-1.5 rounded-full shadow transition-all hover:scale-105"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Guide Content */}
              <div className="p-6 overflow-y-auto space-y-6 text-sm flex-1 leading-relaxed">
                <div className="space-y-4">
                  {/* Category Guide Cards */}

                  <div className="border border-primary/15 rounded-3xl p-4 space-y-2 bg-gradient-to-br from-card to-primary/[0.01]">
                    <div className="flex items-center gap-2 text-primary font-black text-sm">
                      <GraduationCap className="w-5 h-5" /> 🎓 Research Hub Guides
                    </div>
                    <p className="text-xs font-semibold text-muted-foreground">
                      This is where you write <strong>College Admission Guides</strong> (e.g. for IISER, NISER, and IISc admissions).
                    </p>
                    <ul className="list-disc pl-4 text-[11px] font-semibold text-muted-foreground/90 space-y-1">
                      <li>Use the <strong>Page Title</strong> for the college guide name (e.g. <code>IISER Pune College Admission Guide 2026</code>).</li>
                      <li>Use the <strong>Slug</strong> area to set the web address name (e.g. <code>iiser-pune</code>). Keep it simple and use lowercase letters and hyphens!</li>
                      <li>Type academic details, admission cutoffs, and exam strategy in the text editor below.</li>
                    </ul>
                  </div>

                  <div className="border border-primary/15 rounded-3xl p-4 space-y-2 bg-gradient-to-br from-card to-primary/[0.01]">
                    <div className="flex items-center gap-2 text-primary font-black text-sm">
                      <ShoppingBag className="w-5 h-5" /> 🛍️ Product Details (Premium Storefront)
                    </div>
                    <p className="text-xs font-semibold text-muted-foreground">
                      This is where you write the <strong>extended description details</strong> for study books and mock exam packages sold on your website.
                    </p>
                    <ul className="list-disc pl-4 text-[11px] font-semibold text-muted-foreground/90 space-y-1">
                      <li>Use the <strong>Link Store Catalog Book</strong> dropdown to choose the actual product item you are linking. This ensures students see the description on the correct page automatically!</li>
                      <li>Click the sparkly <strong>Load Storefront Details Template</strong> button in the text editor to instantly load a beautiful mock template (bullet specs, math outlines).</li>
                      <li>Set the status to <strong>Publish Live</strong> (green) to make it immediately visible to prospective bookstore buyers.</li>
                    </ul>
                  </div>

                  <div className="border border-primary/15 rounded-3xl p-4 space-y-2 bg-gradient-to-br from-card to-primary/[0.01]">
                    <div className="flex items-center gap-2 text-primary font-black text-sm">
                      <Rss className="w-5 h-5" /> 📝 Blogs & strategy
                    </div>
                    <p className="text-xs font-semibold text-muted-foreground">
                      Use this to post <strong>preparation articles, news alerts, and general motivation posts</strong> for students.
                    </p>
                    <ul className="list-disc pl-4 text-[11px] font-semibold text-muted-foreground/90 space-y-1">
                      <li>Write high-yield articles with tips for cracking chemistry reaction mechanisms, linear algebra, or physics.</li>
                      <li>Make sure to upload a visual cover banner to make the blog grid look beautiful on the front-end homepage!</li>
                    </ul>
                  </div>

                  <div className="border border-primary/15 rounded-3xl p-4 space-y-2 bg-gradient-to-br from-card to-primary/[0.01]">
                    <div className="flex items-center gap-2 text-primary font-black text-sm">
                      <Mic className="w-5 h-5" /> 🎧 Podcasts Hub
                    </div>
                    <p className="text-xs font-semibold text-muted-foreground">
                      This is for posting <strong>interviews with professors, research scientists, and topper students</strong>.
                    </p>
                    <ul className="list-disc pl-4 text-[11px] font-semibold text-muted-foreground/90 space-y-1">
                      <li>Type the episode name in the <strong>Title</strong> field (e.g. <code>Episode #4: Research Life at IISER Mohali</code>).</li>
                      <li>Use the <strong>Upload Audio</strong> button to stream a <code>.mp3</code> or <code>.wav</code> voice recording file from your device.</li>
                      <li>The front-end website will automatically render a beautiful, responsive audio player so students can play it right on their browsers!</li>
                    </ul>
                  </div>

                  <div className="border border-primary/15 rounded-3xl p-4 space-y-2 bg-gradient-to-br from-card to-primary/[0.01]">
                    <div className="flex items-center gap-2 text-primary font-black text-sm">
                      <FolderOpen className="w-5 h-5" /> 📂 Resources directory
                    </div>
                    <p className="text-xs font-semibold text-muted-foreground">
                      This is where you upload <strong>free study downloads</strong> like formulas, syllabus booklets, chemistry cheatsheets, or previous years' cutoffs.
                    </p>
                    <ul className="list-disc pl-4 text-[11px] font-semibold text-muted-foreground/90 space-y-1">
                      <li>In the attachment block, click <strong>Upload PDF</strong> and select your PDF booklet file (up to 25 Megabytes!).</li>
                      <li>Students will be presented with a large, animated, secure <strong>"Download PDF Now"</strong> button.</li>
                    </ul>
                  </div>

                  <div className="border border-primary/15 rounded-3xl p-4 space-y-2 bg-gradient-to-br from-card to-primary/[0.01]">
                    <div className="flex items-center gap-2 text-primary font-black text-sm">
                      <Megaphone className="w-5 h-5" /> 🚀 Global Popup Announcements
                    </div>
                    <p className="text-xs font-semibold text-muted-foreground">
                      This is the powerful <strong>Announcement Popup Modal</strong> that pops up to greet every visitor who loads the homepage!
                    </p>
                    <ul className="list-disc pl-4 text-[11px] font-semibold text-muted-foreground/90 space-y-1">
                      <li>Give each announcement a unique custom slug (e.g. <code>iat-2026-counseling</code>). If there are multiple active announcements, students will see them in a gorgeous carousel on the homepage!</li>
                      <li>In the <strong>Action Redirect URL</strong>, type the address where the user goes when they click "Learn More" (e.g., <code>/store/books/math-guide</code>).</li>
                      <li>Set status to <strong>Publish Live</strong> to turn it on immediately, or set it to <strong>Draft Mode</strong> to disable the announcement completely!</li>
                      <li>Every time you edit it and save, it automatically shows up as a fresh alert to all users. Users can dismiss it, and they will not see it again until you update it next time!</li>
                    </ul>
                  </div>

                </div>

                {/* Rich formatting help */}
                <div className="border-t pt-4 space-y-2">
                  <h4 className="font-extrabold text-foreground flex items-center gap-1"><Sparkles className="w-4 h-4 text-secondary animate-pulse" /> Super-Simple Editor Guide</h4>
                  <p className="text-xs font-semibold text-muted-foreground">
                    You do not need to know any programming! We have built special quick buttons for you in the editor toolbar:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-semibold text-muted-foreground/80">
                    <div className="p-2 bg-muted rounded-xl"><code>B</code> / <code>I</code> : Highlight words to make them <strong>Bold</strong> or <em>Italic</em>.</div>
                    <div className="p-2 bg-muted rounded-xl"><code>H1 / H2</code> : Create structured page headers.</div>
                    <div className="p-2 bg-muted rounded-xl"><code>Upload File</code> : Instantly uploads any image/video from your device and places it in your article.</div>
                    <div className="p-2 bg-muted rounded-xl"><code>Σ In / Σ Blk</code> : Inserts advanced science math symbols (LaTeX).</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CmsHubPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    }>
      <CmsHubContent />
    </Suspense>
  );
}
