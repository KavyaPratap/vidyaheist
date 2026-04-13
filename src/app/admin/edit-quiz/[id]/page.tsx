"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useUser, useFirestore } from "@/firebase";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { doc, getDoc, collection, getDocs, updateDoc, deleteDoc, writeBatch, serverTimestamp } from "firebase/firestore";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShieldAlert, Trash2, Edit, Check, X, PlusCircle, ChevronRight, ChevronDown, ListChecks, Wrench, Zap, SquareCheck, Square, RefreshCcw } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import type { TestSeriesFullType, AdminQuestionType, TestType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ADMIN_EMAIL, EXAM_SUBJECTS } from "@/lib/constants";
import { MathText } from "@/components/shared/MathText";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

const testSeriesSchema = z.object({
  name: z.string().min(5, { message: "Course name must be at least 5 characters." }),
  description: z.string().optional(),
  price: z.coerce.number().min(0, { message: "Price must be a positive number or zero." }),
  subject: z.string().min(3, { message: "Exam category is required." }),
  numberOfTests: z.coerce.number().optional().nullable(),
  durationPerTest: z.coerce.number().optional().nullable(),
  imageUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  data_ai_hint: z.string().optional().nullable(),
});
type TestSeriesFormValues = z.infer<typeof testSeriesSchema>;

const questionOptionEditSchema = z.object({
  id: z.string(),
  text: z.string().min(1, { message: "Option text cannot be empty." }),
});

const questionEditSchema = z.object({
  text: z.string().min(10, { message: "Question text must be at least 10 characters." }),
  topic: z.string().optional(),
  subject: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  options: z.array(questionOptionEditSchema).min(2, "At least two options are required."),
  correctOptionId: z.string().optional(), // relaxed for manual validation
});
type QuestionEditFormValues = z.infer<typeof questionEditSchema>;


interface QuestionEditFormProps {
  questionData: AdminQuestionType;
  onSave: (data: QuestionEditFormValues) => Promise<void>;
  onCancel: () => void;
  formInstance: ReturnType<typeof useForm<QuestionEditFormValues>>;
}

function QuestionEditForm({ questionData, onSave, onCancel, formInstance }: QuestionEditFormProps) {
  const { toast } = useToast();
  const [uploadingImage, setUploadingImage] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { isSubmitting },
  } = formInstance;

  const { fields } = useFieldArray({
    control,
    name: "options",
  });

  const watchedCorrectOptionId = watch("correctOptionId");

  const onSubmit = async (data: QuestionEditFormValues) => {
    if (!data.correctOptionId || !data.options.find(opt => opt.id === data.correctOptionId)) {
        toast({
            title: "Invalid Correct Option",
            description: "Please select a valid correct answer radio button before saving.",
            variant: "destructive",
        });
        return;
    }
    await onSave(data);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploadingImage(true);
      try {
          const { getApps } = await import("firebase/app");
          const { getStorage, ref, uploadBytes, getDownloadURL } = await import("firebase/storage");
          const app = getApps()[0];
          const storage = getStorage(app);
          const storageRef = ref(storage, `questions/${Date.now()}_${file.name}`);
          const snapshot = await uploadBytes(storageRef, file);
          const url = await getDownloadURL(snapshot.ref);
          setValue("imageUrl", url, { shouldDirty: true, shouldValidate: true });
          toast({ title: "Success", description: "Image attached successfully!" });
      } catch (err: any) {
          toast({ title: "Upload Failed", description: err.message || "Could not upload image.", variant: "destructive" });
      } finally {
          setUploadingImage(false);
          if (e.target) e.target.value = ''; // Reset input
      }
  };

  const watchedOptions = watch("options");
  const watchedImageUrl = watch("imageUrl");

  return (
    <div className="bg-muted/10 p-6 rounded-2xl border-2 border-primary/20 space-y-6 animate-in fade-in zoom-in-95 duration-200">
      <div className="flex justify-between items-center bg-primary/5 -mx-6 -mt-6 p-4 rounded-t-2xl border-b border-primary/10">
        <h3 className="font-black text-primary flex items-center gap-2">
            <Edit className="w-4 h-4" /> Quick Edit Mode
        </h3>
        <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary">ID: {questionData.id}</Badge>
      </div>

    <Form {...formInstance}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={control}
          name="text"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Question Text</FormLabel>
              <FormControl>
                <Textarea {...field} rows={4} placeholder="Enter the full question text..." />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name="topic"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Topic (Optional)</FormLabel>
                <FormControl><Input {...field} placeholder="e.g., Kinematics" /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="subject"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subject (Optional)</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Select Subject" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {EXAM_SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4 border p-4 rounded bg-muted/20">
            <FormLabel>Question Diagram / Companion Image</FormLabel>
            {watchedImageUrl ? (
                <div className="relative inline-block border rounded overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={watchedImageUrl} alt="Attachment" className="max-h-48 object-contain" />
                    <Button type="button" variant="destructive" size="sm" className="absolute top-1 right-1 h-6 px-2" onClick={() => setValue("imageUrl", "")}><X className="w-3 h-3"/></Button>
                </div>
            ) : (
                <div className="flex items-center gap-4">
                    <Input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} className="w-full max-w-sm" />
                    {uploadingImage && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
                </div>
            )}
            <FormField control={control} name="imageUrl" render={({ field }) => <input type="hidden" {...field} />} />
        </div>

        <FormItem>
            <FormLabel>Options & Correct Answer</FormLabel>
            <RadioGroup
                value={watchedCorrectOptionId}
                onValueChange={(value) => setValue("correctOptionId", value, { shouldValidate: true, shouldDirty: true })}
                className="space-y-3 mt-2"
            >
                {fields.map((item, index) => {
                  const actualOptionId = watchedOptions?.[index]?.id || questionData.options[index]?.id;
                  return (
                    <Card key={item.id} className={cn("p-3 flex items-center gap-3 transition-all", watchedCorrectOptionId === actualOptionId && "bg-primary/10 ring-2 ring-primary")}>
                        <FormControl>
                            <RadioGroupItem value={actualOptionId} id={`edit-option-${actualOptionId}`} />
                        </FormControl>
                        <div className="flex-grow">
                        <FormField
                            control={control}
                            name={`options.${index}.text`}
                            render={({ field: optionTextCtrl }) => (
                            <FormItem className="w-full">
                                <FormControl>
                                <Input {...optionTextCtrl} placeholder={`Option ${index + 1} text`} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        </div>
                    </Card>
                  )
                })}
            </RadioGroup>
        </FormItem>

        <div className="flex gap-3 justify-end pt-4 border-t">
            <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" className="font-bold scale-105" disabled={isSubmitting}>
                {isSubmitting ? <><Loader2 className="animate-spin mr-2 h-4 w-4"/> Saving...</> : "Save Question Changes"}
            </Button>
        </div>
      </form>
    </Form>
    </div>
  );
}



export default function EditQuizPage() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [testSeriesData, setTestSeriesData] = useState<TestSeriesFullType | null>(null);
  const [isDeletingSeries, setIsDeletingSeries] = useState(false);
  
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editingTestId, setEditingTestId] = useState<string | null>(null);
  const [editingTestMetadata, setEditingTestMetadata] = useState<TestType | null>(null);
  const [currentEditingQuestionData, setCurrentEditingQuestionData] = useState<AdminQuestionType | null>(null);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);
  const [topicDialogOpen, setTopicDialogOpen] = useState(false);
  const [reorderDialogOpen, setReorderDialogOpen] = useState(false);
  const [activeTestId, setActiveTestId] = useState<string | null>(null);
  const [tempSubjectOrder, setTempSubjectOrder] = useState<string[]>([]);
  const [tempTopic, setTempTopic] = useState("");

  const getSubjectColor = (subject?: string | null) => {
      const s = subject?.toLowerCase() || '';
      if (s.includes('physics')) return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
      if (s.includes('chemistry')) return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800';
      if (s.includes('biology')) return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
      if (s.includes('math')) return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800';
      return 'bg-muted text-muted-foreground border-border';
  };

  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const seriesId = params.id as string;

  const testSeriesEditForm = useForm<TestSeriesFormValues>({
    resolver: zodResolver(testSeriesSchema),
  });

  const questionEditForm = useForm<QuestionEditFormValues>({
    resolver: zodResolver(questionEditSchema),
    defaultValues: {
        text: "",
        topic: "",
        subject: "",
        options: [],
        correctOptionId: "",
        imageUrl: ""
    }
  });

  const testMetaEditForm = useForm<{name: string, duration: number}>({
    resolver: zodResolver(z.object({ name: z.string().min(3), duration: z.coerce.number().min(1) }))
  });


  const fetchTestSeriesAndQuestions = useCallback(async (id: string) => {
    if (!firestore) return;
    setLoading(true);
    try {
      const seriesDocRef = doc(firestore, "testSeries", id);
      const seriesSnap = await getDoc(seriesDocRef);

      if (!seriesSnap.exists()) throw new Error("Course not found.");
      
      const seriesData = { id: seriesSnap.id, ...seriesSnap.data() } as TestSeriesFullType;

      // Fetch Tests
      const testsSnap = await getDocs(collection(firestore, "testSeries", id, "tests"));
      const testsData: TestType[] = [];

      for (const testDoc of testsSnap.docs) {
          const tData = { id: testDoc.id, ...testDoc.data() } as TestType;
          tData.id = testDoc.id; // Force priority
          // Fetch Questions for this test
          const questionsSnap = await getDocs(collection(firestore, "testSeries", id, "tests", testDoc.id, "questions"));
          tData.questions = questionsSnap.docs.map(qDoc => {
              const qData = { id: qDoc.id, ...qDoc.data() } as AdminQuestionType;
              qData.id = qDoc.id; 
              return qData;
          }).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
          testsData.push(tData);
      }

      seriesData.tests = testsData.sort((a, b) => (a.order || 0) - (b.order || 0));
      
      setTestSeriesData(seriesData);

      testSeriesEditForm.reset({
        name: seriesData.name || "",
        description: seriesData.description || "",
        price: seriesData.price || 0,
        subject: seriesData.subject || "",
        numberOfTests: seriesData.numberOfTests === null ? undefined : (seriesData.numberOfTests || testsData.length),
        durationPerTest: seriesData.durationPerTest === null ? undefined : seriesData.durationPerTest,
        imageUrl: seriesData.imageUrl || "",
        data_ai_hint: seriesData.data_ai_hint || "",
      });

    } catch (error: any) {
      console.error("Error fetching course details:", error);
      toast({ title: "Error", description: "Failed to load course data or insufficient permissions.", variant: "destructive" });
      router.push("/store"); 
    } finally {
        setLoading(false);
    }
  }, [firestore, testSeriesEditForm, router, toast]);


  useEffect(() => {
    if (!userLoading) {
      if (!user) {
        router.push("/login");
        return;
      }
      if (user.email === ADMIN_EMAIL) {
        setIsAdmin(true);
        if (seriesId) {
          fetchTestSeriesAndQuestions(seriesId);
        }
      } else {
        setIsAdmin(false);
      }
    }
  }, [user, userLoading, seriesId, fetchTestSeriesAndQuestions, router]);


  async function onTestSeriesUpdate(data: TestSeriesFormValues) {
    if (!user || !isAdmin || !seriesId || !firestore) {
      toast({ title: "Error", description: "Admin authentication required.", variant: "destructive" });
      return;
    }
    try {
      const seriesDocRef = doc(firestore, "testSeries", seriesId);
      
      const payload: any = { ...data, updatedAt: serverTimestamp() };
      // Firestore does not allow 'undefined', replace with null
      Object.keys(payload).forEach(key => {
          if (payload[key] === undefined) {
              payload[key] = null;
          }
      });

      await updateDoc(seriesDocRef, payload);

      toast({ title: "Success", description: `Course "${data.name}" updated successfully!` });
    } catch (error: any) {
      console.error("Error updating course:", error);
      toast({ title: "Error", description: error.message || "Failed to update course.", variant: "destructive" });
    }
  }

  async function handleDeleteTestSeries() {
    if (!seriesId || !isAdmin || !firestore) {
        toast({ title: "Error", description: "Cannot delete course.", variant: "destructive" });
        return;
    }
    setIsDeletingSeries(true);
    try {
        const batch = writeBatch(firestore);

        // Fetch all tests
        const testsSnap = await getDocs(collection(firestore, "testSeries", seriesId, "tests"));
        
        for (const testDoc of testsSnap.docs) {
            // Fetch all questions in this test
            const questionsSnap = await getDocs(collection(firestore, "testSeries", seriesId, "tests", testDoc.id, "questions"));
            questionsSnap.docs.forEach(qDoc => batch.delete(qDoc.ref));
            // Delete the test itself
            batch.delete(testDoc.ref);
        }

        // Delete the course
        const seriesDocRef = doc(firestore, "testSeries", seriesId);
        batch.delete(seriesDocRef);

        await batch.commit();

        toast({ title: "Success", description: "Course and all nested tests/questions deleted successfully." });
        router.push("/store");
    } catch (error: any) {
        console.error("Error deleting course:", error);
        toast({ title: "Error", description: error.message || "Failed to delete course.", variant: "destructive" });
    } finally {
        setIsDeletingSeries(false);
    }
  }

  const handleEditTestMetadataSubmit = async (data: {name: string, duration: number}) => {
      if (!editingTestMetadata || !seriesId || !isAdmin || !firestore) return;
      try {
          const testDocRef = doc(firestore, "testSeries", seriesId, "tests", editingTestMetadata.id);
          await updateDoc(testDocRef, {
              name: data.name,
              duration: data.duration,
              updatedAt: serverTimestamp()
          });
          toast({ title: "Success", description: "Test settings updated." });
          setEditingTestMetadata(null);
          await fetchTestSeriesAndQuestions(seriesId);
      } catch (err: any) {
          toast({ title: "Error", description: "Update failed: " + err.message, variant: "destructive" });
      }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploadingBanner(true);
      try {
          const { getApps } = await import("firebase/app");
          const { getStorage, ref, uploadBytes, getDownloadURL } = await import("firebase/storage");
          const app = getApps()[0];
          const storage = getStorage(app);
          const storageRef = ref(storage, `banners/${seriesId}_${Date.now()}_${file.name}`);
          const snapshot = await uploadBytes(storageRef, file);
          const url = await getDownloadURL(snapshot.ref);
          testSeriesEditForm.setValue("imageUrl", url, { shouldDirty: true, shouldValidate: true });
          toast({ title: "Success", description: "Banner uploaded! Save the course to apply changes." });
      } catch (err: any) {
          toast({ title: "Upload Failed", description: err.message || "Could not upload banner.", variant: "destructive" });
      } finally {
          setUploadingBanner(false);
          if (e.target) e.target.value = '';
      }
  };

  const handleFinalizeReorder = async () => {
      if (!activeTestId || !firestore || tempSubjectOrder.length === 0) return;
      const test = testSeriesData?.tests?.find(t => t.id === activeTestId);
      if (!test || !test.questions) return;

      try {
          const batch = writeBatch(firestore);
          let globalIdx = 0;
          const grouped: Record<string, AdminQuestionType[]> = {};
          test.questions.forEach(q => {
              const sub = q.subject || "No Subject";
              if (!grouped[sub]) grouped[sub] = [];
              grouped[sub].push(q);
          });

          tempSubjectOrder.forEach(subject => {
              if (grouped[subject]) {
                  grouped[subject].forEach(q => {
                      const qRef = doc(firestore, "testSeries", seriesId, "tests", activeTestId, "questions", q.id);
                      batch.update(qRef, { order: globalIdx++, updatedAt: serverTimestamp() });
                  });
                  delete grouped[subject];
              }
          });

          Object.values(grouped).flat().forEach(q => {
              const qRef = doc(firestore, "testSeries", seriesId, "tests", activeTestId, "questions", q.id);
              batch.update(qRef, { order: globalIdx++, updatedAt: serverTimestamp() });
          });

          await batch.commit();
          toast({ title: "Success", description: "Questions reordered by subject." });
          setReorderDialogOpen(false);
          await fetchTestSeriesAndQuestions(seriesId);
      } catch (err: any) {
          toast({ title: "Error", description: "Reordering failed: " + err.message, variant: "destructive" });
      }
  };

  const handleApplyBulkSubject = async (subject: string) => {
      const targetId = activeTestId || 'selected';
      await handleBulkUpdateQuestions(targetId, { subject }, 'metadata');
      setSubjectDialogOpen(false);
      setActiveTestId(null);
  };

  const handleApplyBulkTopic = async () => {
      const targetId = activeTestId || 'selected';
      await handleBulkUpdateQuestions(targetId, { topic: tempTopic }, 'metadata');
      setTopicDialogOpen(false);
      setTempTopic("");
      setActiveTestId(null);
  };


  const handleDeleteTest = async (testId: string) => {
    if (!seriesId || !isAdmin || !firestore) return;
    try {
        const batch = writeBatch(firestore);
        const questionsSnap = await getDocs(collection(firestore, "testSeries", seriesId, "tests", testId, "questions"));
        questionsSnap.docs.forEach(qDoc => batch.delete(qDoc.ref));
        
        const testDocRef = doc(firestore, "testSeries", seriesId, "tests", testId);
        batch.delete(testDocRef);

        await batch.commit();
        toast({ title: "Success", description: "Test deleted successfully." });
        await fetchTestSeriesAndQuestions(seriesId);
    } catch (error: any) {
        toast({ title: "Error", description: "Delete failed: " + error.message, variant: "destructive" });
    }
  };

  const handleBulkUpdateQuestions = async (testId: string | 'selected', updates: Partial<AdminQuestionType>, mode: 'correctAnswer' | 'metadata' | 'delete' | 'optionText', optionIdx?: number) => {
      if (!seriesId || !isAdmin || !firestore) return;
      
      const isSelectedMode = testId === 'selected';
      const targetQuestions = isSelectedMode 
          ? (testSeriesData?.tests?.flatMap(t => t.questions || []).filter(q => selectedQuestionIds.includes(q.id)) || [])
          : (testSeriesData?.tests?.find(t => t.id === testId)?.questions || []);
          
      if (!targetQuestions.length) return;

      try {
          const batch = writeBatch(firestore);
          let count = 0;
          
          for (const q of targetQuestions) {
              const parentTestId = isSelectedMode 
                  ? testSeriesData?.tests?.find(t => t.questions?.some(tq => tq.id === q.id))?.id 
                  : testId;
                  
              if (!parentTestId) continue;
              const qRef = doc(firestore, "testSeries", seriesId, "tests", parentTestId, "questions", q.id);
              
              if (mode === 'delete') {
                  batch.delete(qRef);
              } else if (mode === 'optionText' && optionIdx !== undefined && updates.options?.[0]) {
                  const newOptions = [...q.options];
                  if (newOptions[optionIdx]) {
                      newOptions[optionIdx] = { ...newOptions[optionIdx], text: updates.options[0].text };
                      batch.update(qRef, { options: newOptions, updatedAt: serverTimestamp() });
                  }
              } else {
                  const payload: any = { ...updates, updatedAt: serverTimestamp() };
                  
                  if (mode === 'correctAnswer' && updates.correctAnswerId && updates.correctAnswerId.length === 1) {
                      const letterIndex = updates.correctAnswerId.charCodeAt(0) - 65;
                      if (q.options[letterIndex]) {
                          payload.correctAnswerId = q.options[letterIndex].id;
                      } else {
                          continue; 
                      }
                  }
                  batch.update(qRef, payload);
              }
              count++;
          }
          
          await batch.commit();
          toast({ title: "Bulk Action Success", description: `${mode === 'delete' ? 'Deleted' : 'Updated'} ${count} questions successfully.` });
          if (isSelectedMode) setSelectedQuestionIds([]);
          await fetchTestSeriesAndQuestions(seriesId);
      } catch (err: any) {
          toast({ title: "Bulk Action Failed", description: err.message, variant: "destructive" });
      }
  };

  const toggleQuestionSelection = (qid: string) => {
    setSelectedQuestionIds(prev => 
        prev.includes(qid) ? prev.filter(id => id !== qid) : [...prev, qid]
    );
  };

  const toggleTestAllSelected = (test: TestType) => {
      const allQids = test.questions?.map(q => q.id) || [];
      const someAlreadySelectedInTest = allQids.some(id => selectedQuestionIds.includes(id));
      
      if (someAlreadySelectedInTest) {
          setSelectedQuestionIds(prev => prev.filter(id => !allQids.includes(id)));
      } else {
          setSelectedQuestionIds(prev => [...new Set([...prev, ...allQids])]);
      }
  };

  const handleEditQuestionClick = (testId: string, question: AdminQuestionType) => {
    setEditingQuestionId(question.id);
    setEditingTestId(testId);
    setCurrentEditingQuestionData(question);
    questionEditForm.reset({
      text: question.text,
      topic: question.topic || "",
      subject: question.subject || testSeriesData?.subject || "",
      imageUrl: question.imageUrl || "",
      options: question.options.map(opt => ({ text: opt.text, id: opt.id })),
      correctOptionId: question.correctAnswerId || "",
    });
  };

  const handleCancelEditQuestion = () => {
    setEditingQuestionId(null);
    setEditingTestId(null);
    setCurrentEditingQuestionData(null);
    questionEditForm.reset();
  };

  const handleSaveEditedQuestion = async (formData: QuestionEditFormValues) => {
    if (!editingQuestionId || !editingTestId || !currentEditingQuestionData || !firestore) return;

    try {
      const questionDocRef = doc(firestore, "testSeries", seriesId, "tests", editingTestId, "questions", editingQuestionId);
      
      await updateDoc(questionDocRef, {
        text: formData.text,
        topic: formData.topic || null,
        subject: formData.subject || null,
        imageUrl: formData.imageUrl || null,
        options: formData.options,
        correctAnswerId: formData.correctOptionId,
        updatedAt: serverTimestamp(),
      });

      toast({ title: "Success", description: "Question updated successfully." });
      setEditingQuestionId(null);
      setEditingTestId(null);
      setCurrentEditingQuestionData(null);
      await fetchTestSeriesAndQuestions(seriesId);
    } catch (error: any) {
      console.error("Error updating question:", error);
      toast({ title: "Error updating question", description: error.message, variant: "destructive" });
    }
  };
  
  const handleDeleteQuestion = async (testId: string, questionId: string) => {
    if (!isAdmin || !firestore) return;
    try {
        const questionDocRef = doc(firestore, "testSeries", seriesId, "tests", testId, "questions", questionId);
        await deleteDoc(questionDocRef);
        toast({title: "Success", description: "Question deleted successfully."});
        const updatedTests = testSeriesData?.tests?.map(t => {
            if (t.id === testId) {
                return { ...t, questions: t.questions?.filter(q => q.id !== questionId) || [] };
            }
            return t;
        });
        setTestSeriesData(prev => prev ? ({ ...prev, tests: updatedTests }) : null);
    } catch (error: any) {
        toast({title: "Error", description: "Failed to delete question.", variant: "destructive"});
    }
  };


  if (loading || isAdmin === null || userLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Verifying access...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center">
        <Card className="max-w-md p-8 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-destructive flex items-center justify-center">
              <ShieldAlert className="mr-2 h-8 w-8" /> Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">Unauthorized access.</p>
            <Button onClick={() => router.push("/")}>Go to Homepage</Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!testSeriesData) {
     return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center">
        <ShieldAlert className="h-12 w-12 text-destructive mb-4" />
        <p className="text-xl text-destructive mb-2">Course Not Found</p>
        <Button onClick={() => router.push("/store")} variant="outline">Back to Courses</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      <section className="text-center py-8 bg-primary/5 rounded-lg border">
        <h1 className="text-4xl font-bold tracking-tight text-primary">Edit Course & Tests</h1>
        <p className="mt-2 text-lg text-muted-foreground">Modify metadata, add tests, or manage questions for <span className="text-foreground font-semibold">{testSeriesData.name}</span></p>
      </section>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle>Course Information</CardTitle>
          <CardDescription>Main Course Display Settings</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...testSeriesEditForm}>
            <form onSubmit={testSeriesEditForm.handleSubmit(onTestSeriesUpdate)} className="space-y-6">
                <FormField control={testSeriesEditForm.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Course Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={testSeriesEditForm.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid md:grid-cols-2 gap-6">
                  <FormField control={testSeriesEditForm.control} name="price" render={({ field }) => (
                    <FormItem><FormLabel>Price (₹)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={testSeriesEditForm.control} name="subject" render={({ field }) => (
                    <FormItem><FormLabel>Category</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>

                <div className="space-y-4 border p-4 rounded bg-muted/20">
                    <FormLabel>Course Banner Image</FormLabel>
                    {testSeriesEditForm.watch("imageUrl") ? (
                        <div className="relative inline-block border rounded overflow-hidden group">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={testSeriesEditForm.watch("imageUrl")} alt="Banner" className="max-h-48 object-contain" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <Button type="button" variant="secondary" size="sm" onClick={() => testSeriesEditForm.setValue("imageUrl", "")}><Trash2 className="w-4 h-4 mr-1"/> Remove</Button>
                                <Label htmlFor="replace-banner" className="cursor-pointer bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-sm font-medium hover:bg-primary/90">Replace</Label>
                                <Input id="replace-banner" type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4">
                            <Input type="file" accept="image/*" onChange={handleBannerUpload} disabled={uploadingBanner} className="w-full max-w-sm" />
                            {uploadingBanner && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
                        </div>
                    )}
                </div>
              <div className="flex flex-col sm:flex-row justify-between gap-4 border-t pt-6">
                <Button type="submit" disabled={testSeriesEditForm.formState.isSubmitting}>
                  {testSeriesEditForm.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save Course Metadata
                </Button>

                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" disabled={isDeletingSeries}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Entire Course
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Destructive Action: Delete Course?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will PERMANENTLY delete the course, all contained mock tests, and all questions. 
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteTestSeries} className="bg-destructive hover:bg-destructive/90">
                            Delete Everything
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold flex items-center gap-2"><ListChecks className="text-primary"/> Mock Tests & Question Bank</h2>
            <Button onClick={() => router.push(`/admin/create-quiz?seriesId=${seriesId}`)} variant="outline">
                <PlusCircle className="mr-2 h-4 w-4" /> Add More Tests
            </Button>
        </div>

        {testSeriesData.tests && testSeriesData.tests.length > 0 ? (
            testSeriesData.tests.map((test) => (
                <Card key={test.id} className="border-2 overflow-hidden">
                    <CardHeader className="bg-muted/40 border-b flex flex-row items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Checkbox 
                                checked={test.questions?.every(q => selectedQuestionIds.includes(q.id)) || false}
                                onCheckedChange={() => toggleTestAllSelected(test)}
                                className="h-5 w-5 border-2"
                            />
                            <div>
                                <CardTitle className="text-xl">{test.name}</CardTitle>
                                <CardDescription>{test.questions?.length || 0} Questions • {test.duration} Minutes</CardDescription>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                             
                             <Button 
                                onClick={() => router.push(`/admin/create-quiz?seriesId=${seriesId}&testId=${test.id}`)}
                                variant="ghost" 
                                size="sm" 
                                className="text-primary hover:bg-primary/10"
                             >
                                <PlusCircle className="w-4 h-4 mr-1"/> Add Questions
                             </Button>

                             <Button 
                                onClick={() => {
                                    setActiveTestId(test.id);
                                    const subjectsInTest = [...new Set((test.questions || []).map(q => q.subject || "General"))];
                                    setTempSubjectOrder(subjectsInTest);
                                    setReorderDialogOpen(true);
                                }}
                                variant="ghost" 
                                size="sm" 
                                className="text-primary hover:bg-primary/10"
                             >
                                <RefreshCcw className="w-4 h-4 mr-1"/> Reorder Sections
                             </Button>

                             <AlertDialog open={!!editingTestMetadata && editingTestMetadata.id === test.id} onOpenChange={(open) => {
                                 if (open) {
                                     setEditingTestMetadata(test);
                                     testMetaEditForm.reset({ name: test.name, duration: test.duration });
                                 } else {
                                     setEditingTestMetadata(null);
                                 }
                             }}>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="hover:bg-primary/10"><Edit className="w-4 h-4 mr-1"/> Edit Setup</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader><AlertDialogTitle>Edit Test Settings</AlertDialogTitle></AlertDialogHeader>
                                    <Form {...testMetaEditForm}>
                                        <form id={`edit-test-${test.id}`} onSubmit={testMetaEditForm.handleSubmit(handleEditTestMetadataSubmit)} className="space-y-4 mt-4">
                                            <FormField control={testMetaEditForm.control} name="name" render={({ field }) => (
                                                <FormItem><FormLabel>Test Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                                            )} />
                                            <FormField control={testMetaEditForm.control} name="duration" render={({ field }) => (
                                                <FormItem><FormLabel>Duration (Minutes)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                                            )} />
                                        </form>
                                    </Form>
                                    <AlertDialogFooter className="mt-6">
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <Button type="submit" form={`edit-test-${test.id}`}>Save Changes</Button>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="hover:bg-primary/10"><Zap className="w-4 h-4 mr-1"/> Bulk Actions</Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel>Batch Set Answers</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => handleBulkUpdateQuestions(test.id, { correctAnswerId: 'A' }, 'correctAnswer')}>Set All to (A)</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleBulkUpdateQuestions(test.id, { correctAnswerId: 'B' }, 'correctAnswer')}>Set All to (B)</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleBulkUpdateQuestions(test.id, { correctAnswerId: 'C' }, 'correctAnswer')}>Set All to (C)</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleBulkUpdateQuestions(test.id, { correctAnswerId: 'D' }, 'correctAnswer')}>Set All to (D)</DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuLabel className="text-[10px] text-destructive uppercase tracking-widest px-2 py-1 bg-destructive/5 rounded">Test-Wide Actions (ALL Questions)</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => {
                                        setActiveTestId(test.id);
                                        setSubjectDialogOpen(true);
                                    }}>Set Subject for ALL...</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => {
                                        setActiveTestId(test.id);
                                        setTopicDialogOpen(true);
                                    }}>Set Topic for ALL...</DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuLabel>Reordering Tools</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => {
                                        setActiveTestId(test.id);
                                        const subjectsInTest = [...new Set((test.questions || []).map(q => q.subject || "General"))];
                                        setTempSubjectOrder(subjectsInTest);
                                        setReorderDialogOpen(true);
                                    }} className="text-primary font-bold">
                                        <RefreshCcw className="w-4 h-4 mr-2"/> Reorder by Subject
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10"><Trash2 className="w-4 h-4 mr-1"/> Delete Test</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader><AlertDialogTitle>Delete this Mock Test?</AlertDialogTitle><AlertDialogDescription>This will delete "{test.name}" and all questions inside it.</AlertDialogDescription></AlertDialogHeader>
                                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteTest(test.id)} className="bg-destructive hover:bg-destructive/90">Delete Test</AlertDialogAction></AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {test.questions && test.questions.length > 0 ? (
                            <div className="divide-y">
                                {test.questions.map((q, idx) => {
                                    const isEditing = editingQuestionId === q.id && editingTestId === test.id;
                                    return (
                                        <div key={q.id} className="p-4 bg-background">
                                            {isEditing ? (
                                                <QuestionEditForm
                                                    questionData={currentEditingQuestionData!}
                                                    onSave={handleSaveEditedQuestion}
                                                    onCancel={handleCancelEditQuestion}
                                                    formInstance={questionEditForm}
                                                />
                                            ) : (
                                                <div className="flex justify-between gap-4">
                                                    <div className="flex items-start gap-4 flex-grow">
                                                        <Checkbox 
                                                            checked={selectedQuestionIds.includes(q.id)}
                                                            onCheckedChange={() => toggleQuestionSelection(q.id)}
                                                            className="mt-1"
                                                        />
                                                        <div className="flex-grow space-y-3" onDoubleClick={() => handleEditQuestionClick(test.id, q)}>
                                                              <div className="flex items-center gap-3">
                                                                  <span className="text-muted-foreground font-bold font-mono">Q{idx+1}</span>
                                                                  <div className="flex gap-1.5 flex-wrap">
                                                                      {q.subject && (
                                                                          <Badge className={cn("text-[9px] px-1.5 py-0 h-4 uppercase font-black border tracking-wider", getSubjectColor(q.subject))}>
                                                                              {q.subject}
                                                                          </Badge>
                                                                      )}
                                                                      {q.topic && (
                                                                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 uppercase font-bold text-muted-foreground border-dashed">
                                                                              {q.topic}
                                                                          </Badge>
                                                                      )}
                                                                  </div>
                                                              </div>
                                                              <div className="text-sm font-semibold flex gap-2 cursor-text group relative">
                                                                  <div className="overflow-hidden flex-grow"><MathText text={q.text} /></div>
                                                                  <Edit className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity absolute -right-4 top-1"/>
                                                              </div>
                                                        {q.imageUrl && (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <div className="pl-7"><img src={q.imageUrl} alt="Diagram" className="max-h-64 object-contain rounded border" /></div>
                                                        )}
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-7">
                                                            {q.options.map((opt, oIdx) => (
                                                                <div key={opt.id} 
                                                                    className={cn(
                                                                        "text-xs p-2 rounded border flex items-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors",
                                                                        q.correctAnswerId === opt.id ? "bg-green-100 dark:bg-green-900/40 border-green-500 font-bold" : "bg-muted/30"
                                                                    )}
                                                                    onDoubleClick={() => handleEditQuestionClick(test.id, q)}
                                                                >
                                                                    <span className="text-[10px] text-muted-foreground">({String.fromCharCode(65+oIdx)})</span>
                                                                    <MathText text={opt.text}/>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditQuestionClick(test.id, q)}><Edit className="w-4 h-4"/></Button>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="w-4 h-4"/></Button></AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader><AlertDialogTitle>Remove Question?</AlertDialogTitle></AlertDialogHeader>
                                                                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteQuestion(test.id, q.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-muted-foreground bg-muted/20">This test has no questions yet.</div>
                        )}
                    </CardContent>
                </Card>
            ))
        ) : (
            <Card className="p-20 text-center border-dashed border-2">
                <CardDescription className="text-xl">This series is empty.</CardDescription>
                <Button className="mt-4" onClick={() => router.push(`/admin/create-quiz?seriesId=${seriesId}`)}>Create Your First Test</Button>
            </Card>
        )}
      </div>

      {selectedQuestionIds.length > 0 && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-5">
              <Card className="flex items-center gap-6 p-4 shadow-2xl border-2 border-primary bg-background/95 backdrop-blur">
                  <div className="flex flex-col items-center border-r pr-6">
                      <span className="text-lg font-bold text-primary">{selectedQuestionIds.length}</span>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Selected</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                       <Button variant="outline" size="sm" onClick={() => handleBulkUpdateQuestions('selected', { correctAnswerId: 'A' }, 'correctAnswer')}>A</Button>
                       <Button variant="outline" size="sm" onClick={() => handleBulkUpdateQuestions('selected', { correctAnswerId: 'B' }, 'correctAnswer')}>B</Button>
                       <Button variant="outline" size="sm" onClick={() => handleBulkUpdateQuestions('selected', { correctAnswerId: 'C' }, 'correctAnswer')}>C</Button>
                       <Button variant="outline" size="sm" onClick={() => handleBulkUpdateQuestions('selected', { correctAnswerId: 'D' }, 'correctAnswer')}>D</Button>
                       <div className="w-px h-8 bg-border mx-2" />
                       <Button variant="outline" size="sm" onClick={() => {
                           setActiveTestId(null); // 'selected' mode
                           setSubjectDialogOpen(true);
                       }}><ListChecks className="w-4 h-4 mr-1"/> Set Subject</Button>

                       <Button variant="outline" size="sm" onClick={() => {
                           setActiveTestId(null); // 'selected' mode
                           setTopicDialogOpen(true);
                       }}><Zap className="w-4 h-4 mr-1"/> Set Topic</Button>
                       
                       <Button variant="outline" size="sm" onClick={() => {
                           const letter = prompt("Which option to update? (A/B/C/D)");
                           const text = prompt(`Enter text for Option ${letter}:`);
                           if (letter && text) {
                               const letterIndex = letter.trim().toUpperCase().charCodeAt(0) - 65;
                               handleBulkUpdateQuestions('selected', { options: [{ id: 'placeholder', text }] }, 'optionText', letterIndex);
                           }
                       }}><Edit className="w-4 h-4 mr-1"/> Set Text</Button>

                       <AlertDialog>
                          <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm"><Trash2 className="w-4 h-4 mr-1"/> Delete</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                              <AlertDialogHeader><AlertDialogTitle>Delete {selectedQuestionIds.length} questions?</AlertDialogTitle><AlertDialogDescription>This action is non-reversible.</AlertDialogDescription></AlertDialogHeader>
                              <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleBulkUpdateQuestions('selected', {}, 'delete')} className="bg-destructive hover:bg-destructive/90">Delete All</AlertDialogAction></AlertDialogFooter>
                          </AlertDialogContent>
                       </AlertDialog>

                       <Button variant="ghost" size="icon" onClick={() => setSelectedQuestionIds([])}><X className="w-4 h-4"/></Button>
                  </div>
              </Card>
          </div>
      )}

      {/* Global Dialogs for Subject Selection */}
      <Dialog open={subjectDialogOpen} onOpenChange={setSubjectDialogOpen}>
          <DialogContent className="max-w-md">
              <DialogHeader>
                  <DialogTitle>Select Subject</DialogTitle>
                  <DialogDescription>Apply this subject to all selected questions.</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3 py-4">
                  {EXAM_SUBJECTS.map(sub => (
                      <Button key={sub} variant="outline" onClick={() => handleApplyBulkSubject(sub)} className="justify-start">
                          {sub}
                      </Button>
                  ))}
              </div>
          </DialogContent>
      </Dialog>

      <Dialog open={topicDialogOpen} onOpenChange={setTopicDialogOpen}>
          <DialogContent className="max-w-md">
              <DialogHeader>
                  <DialogTitle>Update Topic</DialogTitle>
                  <DialogDescription>Enter a topic to apply to all selected questions (e.g. "Thermodynamics").</DialogDescription>
              </DialogHeader>
              <div className="py-4">
                  <Input 
                    placeholder="Enter topic name..." 
                    value={tempTopic} 
                    onChange={(e) => setTempTopic(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleApplyBulkTopic()}
                  />
              </div>
              <DialogFooter>
                  <Button variant="ghost" onClick={() => setTopicDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleApplyBulkTopic} disabled={!tempTopic.trim()}>Update Topic</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>

      <Dialog open={reorderDialogOpen} onOpenChange={setReorderDialogOpen}>
          <DialogContent className="max-w-md">
              <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                      <RefreshCcw className="w-5 h-5 text-primary"/> Reorder Sections
                  </DialogTitle>
                  <DialogDescription>
                      Build the order you want your questions to appear in. Questions will be grouped by subject accordingly.
                  </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                  <div className="space-y-2">
                       <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest pl-1">New Sequence Order</Label>
                       <div className="flex flex-wrap gap-2 min-h-[60px] p-3 border-2 border-dashed rounded-xl bg-muted/20">
                           {tempSubjectOrder.map((sub, i) => (
                                <Badge key={`${sub}-${i}`} className={cn("pr-1.5 py-1 gap-1.5 animate-in slide-in-from-left-2 duration-200", getSubjectColor(sub))}>
                                    <span className="text-[10px] opacity-50 font-mono">{i+1}</span>
                                    <span className="font-black text-[10px] uppercase">{sub}</span>
                                    <X className="w-3 h-3 cursor-pointer hover:text-destructive transition-colors" onClick={() => setTempSubjectOrder(prev => prev.filter((_, idx) => idx !== i))}/>
                                </Badge>
                           ))}
                           {tempSubjectOrder.length === 0 && (
                               <div className="flex flex-col items-center justify-center w-full h-full text-muted-foreground text-xs italic gap-1 opacity-50">
                                   <span>No order set yet...</span>
                                   <span>Click options below to build sequence</span>
                               </div>
                           )}
                       </div>
                  </div>

                  <div className="space-y-2">
                       <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest pl-1">Detected Subjects in Test</Label>
                       <div className="grid grid-cols-2 gap-2">
                           {[...new Set((testSeriesData?.tests?.find(t => t.id === activeTestId)?.questions || []).map(q => q.subject || "No Subject"))].map(sub => (
                                <Button 
                                    key={sub} 
                                    variant="outline" 
                                    size="sm" 
                                    className={cn("justify-start border h-9 transition-all hover:scale-[1.02]", tempSubjectOrder.includes(sub) && "opacity-30 grayscale")} 
                                    onClick={() => !tempSubjectOrder.includes(sub) && setTempSubjectOrder(p => [...p, sub])}
                                >
                                    <PlusCircle className="w-3 h-3 mr-2 opacity-50"/> 
                                    <span className="font-bold text-[10px] uppercase">{sub}</span>
                                </Button>
                           ))}
                       </div>
                  </div>
                  
                  <div className="flex gap-2">
                       <Button 
                        variant="secondary" 
                        size="sm" 
                        className="flex-1 h-9 text-[10px] font-black uppercase tracking-tighter" 
                        onClick={() => setTempSubjectOrder(["Biology", "Physics", "Chemistry", "Mathematics"])}
                       >
                           Preset: BIO &gt; PHY &gt; CHE &gt; MAT
                       </Button>
                       <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-9 text-[10px] font-black uppercase tracking-tighter text-destructive hover:bg-destructive/10" 
                        onClick={() => setTempSubjectOrder([])}
                       >
                           Clear
                       </Button>
                  </div>
              </div>
              <DialogFooter className="bg-muted/30 -mx-6 -mb-6 p-4 border-t mt-4">
                  <Button variant="ghost" className="font-bold" onClick={() => setReorderDialogOpen(false)}>Cancel</Button>
                  <Button 
                    className="font-black animate-pulse shadow-primary/20 shadow-lg" 
                    onClick={handleFinalizeReorder} 
                    disabled={tempSubjectOrder.length === 0}
                  >
                      Apply Grouped Reordering
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
}
