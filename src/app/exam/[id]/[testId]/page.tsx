
"use client";

import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { useParams, useRouter } from "next/navigation";
import { APP_NAME, ADMIN_EMAIL } from "@/lib/constants";
import type { QuestionType, TestSeriesType, TestType, UserAnswer, ExamPhase } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Bookmark, Check, ListChecks, Loader2, RefreshCcw, Send, XCircle, Clock, HelpCircle, ShieldX } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ExplanationModal } from "../components/ExplanationModal";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useFirestore, useUser } from "@/firebase";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import { MathText } from "@/components/shared/MathText";

const QuestionPalette = memo(function QuestionPalette({
  questions,
  userAnswers,
  currentQuestionIndex,
  examPhase,
  answeredCount,
  notAnsweredCount,
  markedForReviewCount,
  answeredAndMarkedCount,
  notVisitedCount,
  navigateQuestion,
  setExamPhase
}: any) {
  return (
    <Card className="lg:w-[320px] flex-shrink-0 flex flex-col shadow-lg h-full max-h-[calc(100vh-10rem)]">
      <CardHeader className="border-b p-4">
        <CardTitle className="text-primary text-lg">Question Palette</CardTitle>
         <div className="text-xs mt-2 space-y-1 text-muted-foreground">
            <p><span className="inline-block w-3 h-3 bg-green-500 rounded-sm mr-1.5 align-middle"></span>Answered ({answeredCount})</p>
            <p><span className="inline-block w-3 h-3 bg-red-500 rounded-sm mr-1.5 align-middle"></span>Not Answered ({notAnsweredCount})</p>
            <p><span className="inline-block w-3 h-3 bg-purple-500 rounded-sm mr-1.5 align-middle"></span>Marked for Review ({markedForReviewCount})</p>
            <p><span className="inline-block w-3 h-3 border border-border bg-background rounded-sm mr-1.5 align-middle"></span>Not Visited ({notVisitedCount})</p>
        </div>
      </CardHeader>
      <ScrollArea className="flex-grow">
        <CardContent className="p-3 grid grid-cols-5 gap-1.5">
          {questions.map((q: any, index: number) => {
            const answer = userAnswers.find((ans: any) => ans.questionId === q.id);
            let statusClass = "bg-background text-foreground";
            
            if (answer?.isAnswered) statusClass = "bg-green-500 text-white border-green-600";
            else if (answer?.visited) statusClass = "bg-red-500 text-white border-red-600";
            if (answer?.isMarkedForReview) statusClass = "bg-purple-500 text-white border-purple-600";
            
            if (currentQuestionIndex === index) {
                statusClass = cn(statusClass, "ring-2 ring-primary ring-offset-2");
            }
            
            return (
              <Button
                key={q.id}
                variant="outline"
                size="icon"
                className={cn("h-9 w-9 text-xs font-bold", statusClass)}
                onClick={() => navigateQuestion(index)}
                disabled={examPhase === 'summary'}
              >
                {index + 1}
              </Button>
            );
          })}
        </CardContent>
      </ScrollArea>
    </Card>
  );
});

export default function ExamPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params.id as string; // Test Series ID
  const testId = params.testId as string;
  const firestore = useFirestore();
  const { user, loading: userLoading } = useUser();

  const [test, setTest] = useState<TestType | null>(null);
  const [questions, setQuestions] = useState<QuestionType[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [examPhase, setExamPhase] = useState<ExamPhase>('loading');
  const [score, setScore] = useState(0);
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  const [explanationContext, setExplanationContext] = useState<any>(null);

  useEffect(() => {
    const fetchTestDetails = async () => {
      if (!firestore || !user) return;
      setExamPhase('loading');
      try {
        // Verify Access
        const seriesSnap = await getDoc(doc(firestore, "testSeries", id));
        if (!seriesSnap.exists()) throw new Error("Course not found");
        const seriesData = seriesSnap.data() as TestSeriesType;

        if (user.email !== ADMIN_EMAIL && seriesData.price > 0) {
            const q = query(collection(firestore, "purchases"), 
                where("userId", "==", user.uid), 
                where("seriesId", "==", id), 
                where("status", "==", "verified")
            );
            const pSnap = await getDocs(q);
            if (pSnap.empty) {
                router.push(`/checkout/${id}`);
                return;
            }
        }

        const testDoc = await getDoc(doc(firestore, "testSeries", id, "tests", testId));
        if (!testDoc.exists()) throw new Error("Test not found");
        const testData = { id: testDoc.id, ...testDoc.data() } as TestType;
        
        const qSnap = await getDocs(collection(firestore, "testSeries", id, "tests", testId, "questions"));
        const qData = qSnap.docs.map(d => {
            const data = d.data() as QuestionType;
            return { ...data, id: d.id }; // Ensure Firestore ID is the primary ID
        });

        setTest(testData);
        setQuestions(qData);
        setTimeLeft(testData.duration * 60);
        setUserAnswers(qData.map(q => ({
          questionId: q.id,
          selectedOptionId: null,
          isMarkedForReview: false,
          isAnswered: false,
          visited: false,
        })));
        setExamPhase('instructions');
      } catch (e: any) {
        console.error(e);
        setExamPhase('error');
      }
    };
    if (!userLoading) fetchTestDetails();
  }, [id, testId, firestore, user, userLoading, router]);

  useEffect(() => {
    if (examPhase === 'taking' && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
      return () => clearInterval(timer);
    } else if (examPhase === 'taking' && timeLeft === 0) {
      handleFinish();
    }
  }, [examPhase, timeLeft]);

  const handleFinish = useCallback(() => {
    let finalScore = 0;
    userAnswers.forEach(ans => {
        const q = questions.find(q => q.id === ans.questionId);
        if (q && q.correctAnswerId === ans.selectedOptionId) finalScore++;
    });
    setScore(finalScore);
    setExamPhase('summary');
  }, [userAnswers, questions]);

  const handleAnswer = (qid: string, optid: string) => {
    setUserAnswers(prev => prev.map(ans => ans.questionId === qid ? { ...ans, selectedOptionId: optid, isAnswered: true } : ans));
  };

  const handleMarkReview = (qid: string) => {
    setUserAnswers(prev => prev.map(ans => ans.questionId === qid ? { ...ans, isMarkedForReview: !ans.isMarkedForReview } : ans));
  };

  const navigateQuestion = (index: number) => {
    if (index < 0 || index >= questions.length) return;
    setUserAnswers(prev => prev.map((a, i) => i === currentQuestionIndex ? { ...a, visited: true } : a));
    setCurrentQuestionIndex(index);
  };

  if (examPhase === 'loading') return <div className="flex justify-center py-20"><Loader2 className="animate-spin h-12 w-12" /></div>;

  if (examPhase === 'instructions') {
    return (
      <Card className="max-w-2xl mx-auto my-8 shadow-xl">
        <CardHeader><CardTitle className="text-3xl text-primary">{test?.name}</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-muted rounded-lg grid grid-cols-2 gap-4">
            <p><strong>Duration:</strong> {test?.duration} mins</p>
            <p><strong>Questions:</strong> {questions.length}</p>
          </div>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Timed assessment. Ensure submission before time ends.</li>
            <li>Use the palette to jump between questions.</li>
            <li>LaTeX formatting is supported for math equations.</li>
          </ul>
          <Button className="w-full h-12 text-lg font-bold" onClick={() => setExamPhase('taking')}>Start Simulation</Button>
        </CardContent>
      </Card>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = userAnswers.find(a => a.questionId === currentQuestion?.id);

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-grow space-y-6">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row justify-between items-center border-b py-4">
            <CardTitle>Question {currentQuestionIndex + 1} of {questions.length}</CardTitle>
            <div className="flex items-center gap-2 text-destructive font-mono font-bold text-xl border-2 border-destructive/20 p-2 rounded">
              <Clock className="w-5 h-5" /> {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="text-xl mb-6 leading-relaxed"><MathText text={currentQuestion?.text} /></div>
            {currentQuestion?.imageUrl && (
                 // eslint-disable-next-line @next/next/no-img-element
                 <img src={currentQuestion.imageUrl} alt="Diagram" className="max-h-80 object-contain rounded-lg border shadow-sm mb-10" />
            )}
            <RadioGroup 
                value={currentAnswer?.selectedOptionId || ""} 
                onValueChange={(v) => handleAnswer(currentQuestion.id, v)}
                disabled={examPhase === 'review' || examPhase === 'summary'}
                className="space-y-4"
            >
              {currentQuestion?.options.map(opt => (
                <div key={opt.id} 
                    className={cn(
                        "flex items-center space-x-3 p-4 border-2 rounded-xl transition-all hover:bg-muted/50 cursor-pointer",
                        currentAnswer?.selectedOptionId === opt.id ? "border-primary bg-primary/5" : "border-transparent bg-muted/20"
                    )}
                    onClick={() => handleAnswer(currentQuestion.id, opt.id)}
                >
                  <RadioGroupItem value={opt.id} id={opt.id} />
                  <Label htmlFor={opt.id} className="flex-grow cursor-pointer text-lg"><MathText text={opt.text} /></Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
          <CardFooter className="border-t p-6 flex justify-between bg-muted/10">
            <Button variant="outline" disabled={currentQuestionIndex === 0} onClick={() => navigateQuestion(currentQuestionIndex - 1)}>
                <ArrowLeft className="mr-2 w-4 h-4" /> Previous
            </Button>
            <Button variant={currentAnswer?.isMarkedForReview ? "secondary" : "outline"} onClick={() => handleMarkReview(currentQuestion.id)}>
                <Bookmark className="mr-2 w-4 h-4" /> Review
            </Button>
            {currentQuestionIndex === questions.length - 1 ? (
              <Button onClick={handleFinish} className="bg-green-600 hover:bg-green-700 text-white px-8">Submit Test</Button>
            ) : (
              <Button onClick={() => navigateQuestion(currentQuestionIndex + 1)}>
                Save & Next <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
      
      <QuestionPalette 
        questions={questions} 
        userAnswers={userAnswers} 
        currentQuestionIndex={currentQuestionIndex} 
        answeredCount={userAnswers.filter(a => a.isAnswered).length}
        notAnsweredCount={userAnswers.filter(a => a.visited && !a.isAnswered).length}
        markedForReviewCount={userAnswers.filter(a => a.isMarkedForReview).length}
        notVisitedCount={questions.length - userAnswers.filter(a => a.visited).length}
        navigateQuestion={navigateQuestion}
      />

      {examPhase === 'summary' && (
          <Card className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <Card className="max-w-md w-full p-8 text-center shadow-2xl">
                  <CardHeader><CardTitle className="text-3xl">Test Finished!</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                      <p className="text-muted-foreground text-lg">You scored</p>
                      <p className="text-6xl font-extrabold text-primary">{score} / {questions.length}</p>
                      <Button className="w-full mt-6" onClick={() => router.push('/store')}>Back to Courses</Button>
                  </CardContent>
              </Card>
          </Card>
      )}
    </div>
  );
}
