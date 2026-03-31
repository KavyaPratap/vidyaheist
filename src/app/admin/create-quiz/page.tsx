"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser, useFirestore } from "@/firebase";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, FileUp, Dices, CheckCircle2, ArrowLeft, RefreshCw, Folder, FileText, ChevronRight, ChevronDown, CheckSquare, ListChecks } from "lucide-react";
import { collection, addDoc, doc, getDoc, serverTimestamp } from "firebase/firestore";
import { ADMIN_EMAIL } from "@/lib/constants";
import { MathText } from "@/components/shared/MathText";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Zap } from "lucide-react";

const seriesSchema = z.object({
  name: z.string().min(5),
  description: z.string().optional(),
  price: z.coerce.number().min(0),
  subject: z.string().min(2),
  imageUrl: z.string().url().optional().or(z.literal('')),
});

const testSchema = z.object({
  name: z.string().min(3),
  duration: z.coerce.number().min(1),
});

interface FileNode {
  name: string;
  type: "file" | "directory";
  path: string;
  children?: FileNode[];
  questionCount?: number;
}

const TreeViewNode = ({ node, activeFilePath, setActiveFilePath, selectedPaths, onTogglePath }: {
  node: FileNode;
  activeFilePath: string | null;
  setActiveFilePath: (path: string) => void;
  selectedPaths: string[];
  onTogglePath: (path: string, isSelected: boolean) => void;
}) => {
  const [expanded, setExpanded] = useState(false);

  const isFile = node.type === "file";
  const isActive = isFile && activeFilePath === node.path;
  const isSelected = selectedPaths.includes(node.path);

  const handleClick = (e: React.MouseEvent) => {
    // If clicking text, activate review
    if (isFile) setActiveFilePath(node.path);
    else setExpanded(!expanded);
  };

  const handleCheckbox = (checked: boolean) => {
    onTogglePath(node.path, checked);
  };

  return (
    <div className="pl-4 py-0.5">
      <div
        className={`flex items-center gap-2 p-1.5 rounded cursor-pointer group transition-colors ${isActive ? 'bg-primary/20 text-primary font-semibold' : 'hover:bg-muted/50'}`}
      >
        <Checkbox 
           checked={isSelected} 
           onCheckedChange={handleCheckbox}
           className="h-4 w-4"
        />
        <div className="flex items-center gap-2 flex-grow truncate select-none ml-1" onClick={handleClick}>
          {!isFile ? (
            <div className="p-0.5 text-muted-foreground shrink-0">
              {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </div>
          ) : null}
          {!isFile ? <Folder className="w-4 h-4 text-primary" /> : <FileText className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />}
          <span className="text-sm truncate">{node.name}</span>
        </div>
        {(node.questionCount && node.questionCount > 0) ? (
          <span className="text-xs text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity whitespace-nowrap hidden md:inline-block">~{node.questionCount}</span>
        ) : null}
      </div>
      {expanded && node.children && (
        <div className="border-l border-muted-foreground/20 ml-2 mt-1">
          {node.children.map(child => <TreeViewNode key={child.path} node={child} activeFilePath={activeFilePath} setActiveFilePath={setActiveFilePath} selectedPaths={selectedPaths} onTogglePath={onTogglePath} />)}
        </div>
      )}
    </div>
  );
};

export default function CreateQuizPage() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const seriesForm = useForm<z.infer<typeof seriesSchema>>({
    resolver: zodResolver(seriesSchema),
    defaultValues: { name: "", description: "", price: 0, subject: "", imageUrl: "" }
  });

  const testForm = useForm<z.infer<typeof testSchema>>({
    resolver: zodResolver(testSchema),
    defaultValues: { name: "", duration: 180 }
  });

  const [step, setStep] = useState<"series" | "tests" | "questions">("series");
  const [activeSeriesId, setActiveSeriesId] = useState<string | null>(null);
  
  // Checking for passed ID:
  useEffect(() => {
    const urlSeriesId = searchParams?.get("seriesId");
    const urlTestId = searchParams?.get("testId");
    
    if (urlSeriesId) {
      setActiveSeriesId(urlSeriesId);
      if (urlTestId) {
          // Fetch existing test meta
          const fetchTestMeta = async () => {
              if (!firestore) return;
              try {
                  const tSnap = await getDoc(doc(firestore, "testSeries", urlSeriesId, "tests", urlTestId));
                  if (tSnap.exists()) {
                      const data = tSnap.data();
                      testForm.reset({ name: data.name, duration: data.duration });
                      setActiveTestId(urlTestId);
                      setStep("questions");
                  }
              } catch (e) { console.error(e) }
          }
          fetchTestMeta();
      } else {
          setStep("tests");
      }
    }
  }, [searchParams, firestore, testForm]);

  const [activeTestId, setActiveTestId] = useState<string | null>(null);

  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null);
  const [loadingPool, setLoadingPool] = useState(false);

  const [stagedQuestions, setStagedQuestions] = useState<any[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
  const [totalInjectedCount, setTotalInjectedCount] = useState(0);
  const [isRandomModalOpen, setIsRandomModalOpen] = useState(false);
  const [randomCount, setRandomCount] = useState(30);
  const [isProcessingRandom, setIsProcessingRandom] = useState(false);


  useEffect(() => {
    if (!userLoading && (!user || user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase())) {
      router.push("/");
    }
  }, [user, userLoading, router]);

  const loadTree = async () => {
    try {
      const res = await fetch("/api/questions");
      const data = await res.json();
      setFileTree(data.tree || []);
    } catch (e) {
      console.error("Failed to load pool tree", e);
    }
  };

  const onTogglePath = (path: string, isSelected: boolean) => {
    if (isSelected) {
        setSelectedPaths(prev => [...prev.filter(p => !p.startsWith(path)), path]);
    } else {
        setSelectedPaths(prev => prev.filter(p => p !== path));
    }
  };

  const getAllFilesFromSelectedPaths = () => {
      const files: string[] = [];
      const traverse = (nodes: FileNode[]) => {
          for (const node of nodes) {
              // If node itself is selected
              if (selectedPaths.some(p => node.path === p)) {
                  // Collect all nested files
                  const collectFiles = (n: FileNode) => {
                      if (n.type === "file") files.push(n.path);
                      if (n.children) n.children.forEach(collectFiles);
                  };
                  collectFiles(node);
              } else if (node.children) {
                  traverse(node.children);
              }
          }
      };
      traverse(fileTree);
      return Array.from(new Set(files));
  };

  useEffect(() => {
    if (step === "questions") {
      loadTree();
    }
  }, [step]);

  // Auto layout fetch on active file change
  useEffect(() => {
    const fetchQuestionsForFile = async () => {
      if (!activeFilePath) return;
      setLoadingPool(true);
      try {
        const res = await fetch(`/api/questions?filePath=${encodeURIComponent(activeFilePath)}`);
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();
        setStagedQuestions(data.questions || []);
        setSelectedQuestionIds([]); // reset selection
      } catch (e) {
        toast({ title: "Read Error", description: "Failed to parse questions from this file.", variant: "destructive" });
        setStagedQuestions([]);
      } finally {
        setLoadingPool(false);
      }
    };
    fetchQuestionsForFile();
  }, [activeFilePath, toast]);

  const handleRandomSelect = async () => {
      const filesToScan = getAllFilesFromSelectedPaths();
      if (filesToScan.length === 0) {
          toast({ title: "No Selection", description: "Select at least one folder or file on the left.", variant: "destructive" });
          return;
      }
      setIsProcessingRandom(true);
      try {
          // 1. Fetch ALL questions from selected files
          const res = await fetch("/api/questions", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ filePaths: filesToScan })
          });
          const data = await res.json();
          let allQuestions: any[] = data.questions || [];

          if (allQuestions.length === 0) throw new Error("No questions found in selection.");

          // 2. Shuffle
          allQuestions.sort(() => Math.random() - 0.5);

          // 3. Pick N unique
          const pool = allQuestions.slice(0, Math.min(randomCount, allQuestions.length));

          // 4. Inject
          let success = 0;
          for (const q of pool) {
              await importQuestion(q);
              success++;
          }
          
          toast({ title: "Random Injection Complete", description: `Added ${success} random questions to the test.` });
          setTotalInjectedCount(prev => prev + success);
          setIsRandomModalOpen(false);
      } catch (err: any) {
          toast({ title: "Random Injection Failed", description: err.message, variant: "destructive" });
      } finally {
          setIsProcessingRandom(false);
      }
  };


  async function onSeriesSubmit(data: z.infer<typeof seriesSchema>) {
    if (!firestore || !user) return;
    try {
      const docRef = await addDoc(collection(firestore, "testSeries"), {
        ...data,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
      });
      setActiveSeriesId(docRef.id);
      setStep("tests");
      toast({ title: "Series Created", description: "Now add tests to this series." });
    } catch (e: any) {
      toast({ title: "Permission Denied", description: "You don't have permission to create a series.", variant: "destructive" });
    }
  }

  async function onTestSubmit(data: z.infer<typeof testSchema>) {
    if (!firestore || !activeSeriesId) return;
    try {
      const docRef = await addDoc(collection(firestore, "testSeries", activeSeriesId, "tests"), {
        ...data,
        createdAt: serverTimestamp(),
        order: Date.now(),
      });
      setActiveTestId(docRef.id);
      setStep("questions");
      toast({ title: "Test Created", description: "Now import or add questions." });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  }

  const importQuestion = async (q: any) => {
    if (!firestore || !activeSeriesId || !activeTestId) return;
    try {
      // Destructure out the static string 'id' from parser so it doesn't overwrite Firestore's native random unique id!
      const { id: _, ...questionData } = q;
      await addDoc(collection(firestore, "testSeries", activeSeriesId, "tests", activeTestId, "questions"), {
        ...questionData,
        createdAt: serverTimestamp(),
      });
    } catch (e: any) {
      console.error(e)
    }
  };

  const finalizeSelection = async () => {
    if (selectedQuestionIds.length === 0) return;
    const confirmUpload = stagedQuestions.filter(q => selectedQuestionIds.includes(q.id));

    let successCount = 0;
    for (const q of confirmUpload) {
      await importQuestion(q);
      successCount++;
    }
    toast({ title: "Injection Successful", description: `Added ${successCount} questions to the mock test!` });
    setTotalInjectedCount(prev => prev + successCount);
    setSelectedQuestionIds([]); // clear selection after injecting
  };

  const toggleModalCheck = (id: string) => {
    setSelectedQuestionIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleAllModalChecks = () => {
    if (selectedQuestionIds.length === stagedQuestions.length) setSelectedQuestionIds([]);
    else setSelectedQuestionIds(stagedQuestions.map(q => q.id));
  };


  if (userLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-primary">Admin: Curriculum Builder</h1>
        <Button variant="outline" onClick={() => router.push("/store")}>Exit to Store</Button>
      </div>

      {step === "series" && (
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>Step 1: Create Test Series (Course Container)</CardTitle>
            <CardDescription>Define the overall course name, price, and category.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...seriesForm}>
              <form onSubmit={seriesForm.handleSubmit(onSeriesSubmit)} className="space-y-4">
                <FormField control={seriesForm.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Series Name</FormLabel><FormControl><Input placeholder="e.g. IAT 2024 Full Course" {...field} /></FormControl></FormItem>
                )} />
                <FormField control={seriesForm.control} name="subject" render={({ field }) => (
                  <FormItem><FormLabel>Subject Category</FormLabel><FormControl><Input placeholder="Physics, Chemistry, IAT, etc." {...field} /></FormControl></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={seriesForm.control} name="price" render={({ field }) => (
                    <FormItem><FormLabel>Price (INR)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                  )} />
                  <FormField control={seriesForm.control} name="imageUrl" render={({ field }) => (
                    <FormItem><FormLabel>Banner Image URL (Optional)</FormLabel><FormControl><Input placeholder="https://..." {...field} /></FormControl></FormItem>
                  )} />
                </div>
                <FormField control={seriesForm.control} name="description" render={({ field }) => (
                  <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="What will students learn?" {...field} /></FormControl></FormItem>
                )} />
                <Button type="submit" className="w-full">Create Series & Add First Test</Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {step === "tests" && (activeSeriesId && (
        <Card className="max-w-3xl">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => setStep("series")}><ArrowLeft className="w-4 h-4" /></Button>
              <div>
                <CardTitle>Step 2: Add Mock Test to Series</CardTitle>
                <CardDescription>Create an individual mock exam within this series.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...testForm}>
              <form onSubmit={testForm.handleSubmit(onTestSubmit)} className="space-y-4">
                <FormField control={testForm.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Test Title</FormLabel><FormControl><Input placeholder="e.g. Full Syllabus Mock 1" {...field} /></FormControl></FormItem>
                )} />
                <FormField control={testForm.control} name="duration" render={({ field }) => (
                  <FormItem><FormLabel>Duration (Minutes)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                )} />
                <Button type="submit" className="w-full">Initialize Test & Add Questions</Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      ))}

      {step === "questions" && (
        <div className="space-y-4">
          {/* Context Header */}
          <div className="flex flex-col md:flex-row items-center justify-between bg-primary/5 p-4 rounded-lg border border-primary/20">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2"><ListChecks className="w-5 h-5 text-primary" /> Mock Test: {testForm.getValues("name")}</h2>
              <p className="text-sm text-muted-foreground">{totalInjectedCount} questions successfully injected so far.</p>
            </div>
            <div className="flex gap-2 mt-4 md:mt-0">
              <Button variant="outline" onClick={() => { 
                  testForm.reset({ name: "", duration: 180 }); 
                  setActiveTestId(null);
                  setStep("tests"); 
                  setTotalInjectedCount(0); 
                  // Clear query param of testId if we are starting a fresh new test
                  router.push(`/admin/create-quiz?seriesId=${activeSeriesId}`);
              }}>
                <Plus className="mr-2 w-4 h-4" /> Add Another Test
              </Button>
              <Button onClick={() => router.push("/store")}>
                <CheckCircle2 className="mr-2 w-4 h-4" /> Finish Curriculum
              </Button>
            </div>
          </div>

          {/* Split Pane Interface */}
          <div className="grid lg:grid-cols-3 gap-6">

            {/* File Tree Left Panel */}
            <Card className="lg:col-span-1 h-[650px] flex flex-col shadow-md">
              <CardHeader className="py-4 border-b bg-muted/20 flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2"><Folder className="w-4 h-4" /> Question Bank</CardTitle>
                <Button variant="ghost" size="icon" onClick={loadTree} title="Refresh File Tree" className="h-8 w-8">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="flex-grow overflow-y-auto px-2 py-4">
                {fileTree.length === 0 ? (
                  <p className="text-sm text-center py-4 text-muted-foreground">No files found in /papers</p>
                ) : (
                  fileTree.map(node => (
                    <TreeViewNode
                      key={node.path}
                      node={node}
                      activeFilePath={activeFilePath}
                      setActiveFilePath={setActiveFilePath}
                      selectedPaths={selectedPaths}
                      onTogglePath={onTogglePath}
                    />
                  ))
                )}
              </CardContent>
              <CardFooter className="p-3 border-t bg-muted/20">
                    <Dialog open={isRandomModalOpen} onOpenChange={setIsRandomModalOpen}>
                        <DialogTrigger asChild>
                            <Button className="w-full bg-primary/10 text-primary border-primary hover:bg-primary/20" variant="outline">
                                <Zap className="w-4 h-4 mr-2" /> Select Random
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add Random Questions</DialogTitle>
                                <DialogDescription>
                                    Inject random unique questions from your checked selection.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-4 space-y-4">
                                <Label>Number of questions to pick:</Label>
                                <Input type="number" value={randomCount} onChange={(e) => setRandomCount(Number(e.target.value))} min={1} max={500} />
                                <p className="text-xs text-muted-foreground">Selection identifies {getAllFilesFromSelectedPaths().length} files to scan.</p>
                            </div>
                            <DialogFooter>
                                <Button variant="ghost" onClick={() => setIsRandomModalOpen(false)}>Cancel</Button>
                                <Button onClick={handleRandomSelect} disabled={isProcessingRandom}>
                                    {isProcessingRandom ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Dices className="w-4 h-4 mr-2" />}
                                    Inject Randomly
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
              </CardFooter>
            </Card>

            {/* Live Preview Right Panel */}
            <Card className="lg:col-span-2 h-[650px] flex flex-col shadow-md border-primary/30 relative">
              <CardHeader className="py-4 border-b bg-primary/5 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg truncate max-w-sm" title={activeFilePath || ''}>
                    {activeFilePath ? activeFilePath.split('/').pop() : 'Select a File'}
                  </CardTitle>
                  <CardDescription>
                    {activeFilePath ? `${stagedQuestions.length} valid questions parsed.` : 'Browse the tree on the left.'}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={toggleAllModalChecks} variant="outline" size="sm" disabled={!activeFilePath || stagedQuestions.length === 0}>
                    <CheckSquare className="w-4 h-4 mr-2" />
                    {selectedQuestionIds.length === stagedQuestions.length && stagedQuestions.length > 0 ? "Deselect All" : "Select All"}
                  </Button>
                  <Button onClick={finalizeSelection} size="sm" disabled={selectedQuestionIds.length === 0} className="bg-primary hover:bg-primary/90">
                    <FileUp className="w-4 h-4 mr-2" />
                    Inject {selectedQuestionIds.length}
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="flex-grow overflow-y-auto p-4 bg-muted/10">
                {loadingPool ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <Loader2 className="animate-spin w-8 h-8 mb-4" />
                    <p>Extracting and rendering LaTeX...</p>
                  </div>
                ) : !activeFilePath ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <FileText className="w-12 h-12 mb-4 opacity-20" />
                    <p>No file selected.</p>
                  </div>
                ) : stagedQuestions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <Dices className="w-12 h-12 mb-4 opacity-20" />
                    <p>We couldn't extract any questions.</p>
                    <p className="text-xs mt-2">Check the file formatting.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {stagedQuestions.map((q, idx) => (
                      <div key={q.id} className={`transition-all p-4 rounded-lg border bg-background flex gap-4 ${selectedQuestionIds.includes(q.id) ? 'ring-2 ring-primary border-primary' : ''}`}>
                        <Checkbox
                          className="mt-1 flex-shrink-0"
                          checked={selectedQuestionIds.includes(q.id)}
                          onCheckedChange={() => toggleModalCheck(q.id)}
                        />
                        <div className="flex-grow space-y-3 overflow-hidden">
                          <div>
                            <span className="font-bold mr-2 text-primary">Q{idx + 1}.</span>
                            <MathText text={q.text} />
                          </div>
                          <div className="pl-6 grid grid-cols-1 md:grid-cols-2 gap-2">
                            {q.options.map((opt: any, optIdx: number) => (
                              <div key={opt.id} className="flex gap-2">
                                <span className="font-semibold text-xs mt-0.5 text-muted-foreground">({String.fromCharCode(65 + optIdx)})</span>
                                <div className="text-sm"><MathText text={opt.text} /></div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
