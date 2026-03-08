
"use client";

import { useEffect, useState, Suspense } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { APP_NAME } from "@/lib/constants";
import { useAuth } from "@/firebase";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


const resetPasswordSchema = z.object({
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string().min(6, { message: "Password must be at least 6 characters." }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"], 
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

function ResetPasswordForm_Internal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const auth = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTokenValid, setIsTokenValid] = useState(false); 
  const [message, setMessage] = useState<string | null>(null);
  const [oobCode, setOobCode] = useState<string | null>(null);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });


  useEffect(() => {
    const code = searchParams.get('oobCode');
    if (!code || !auth) {
      setError("Invalid or missing password reset code.");
      return;
    }
    setOobCode(code);
    verifyPasswordResetCode(auth, code)
      .then(() => {
        setIsTokenValid(true);
        setMessage("You can now set your new password.");
      })
      .catch((err) => {
        console.error("Error verifying password reset code:", err);
        setError("The password reset link is invalid, expired, or has already been used. Please request a new one.");
        setIsTokenValid(false);
      });
  }, [searchParams, auth]);

  async function onSubmit(data: ResetPasswordFormValues) {
    if (!oobCode || !auth) {
        setError("Cannot reset password. The request is invalid.");
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await confirmPasswordReset(auth, oobCode, data.password);
      toast({
        title: "Password Updated Successfully",
        description: "Your password has been changed. You can now log in with your new password.",
      });
      router.push("/login");
    } catch (err: any) {
      console.error("Reset password error (onSubmit):", err);
      const errorMessage = err.message || "Failed to update password. The session might have expired. Please try resetting your password again.";
      setError(errorMessage);
      toast({
        title: "Error Updating Password",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (!oobCode && !error) { 
    return (
        <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-3 text-lg">Verifying link...</p>
        </div>
    );
  }

  if (error && !isTokenValid) { 
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center py-12">
         <Card className="w-full max-w-md shadow-xl">
           <CardHeader className="text-center">
             <CardTitle className="text-2xl font-bold text-destructive">Password Reset Error</CardTitle>
           </CardHeader>
           <CardContent>
             <Alert variant="destructive">
               <AlertCircle className="h-4 w-4" />
               <AlertTitle>Error</AlertTitle>
               <AlertDescription>{error}</AlertDescription>
             </Alert>
              <Button asChild className="mt-6 w-full">
               <Link href="/forgot-password">Request New Link</Link>
             </Button>
             <Button variant="outline" asChild className="mt-2 w-full">
               <Link href="/login">Back to Login</Link>
             </Button>
           </CardContent>
         </Card>
       </div>
    );
  }

  if (isTokenValid) {
    return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center py-12">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">Reset Your Password</CardTitle>
          <CardDescription>
            Enter and confirm your new password for {APP_NAME}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {message && !error && (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" /> 
              <AlertTitle>Information</AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
          {error && (
             <Alert variant="destructive" className="mb-4">
               <AlertCircle className="h-4 w-4" />
               <AlertTitle>Update Error</AlertTitle>
               <AlertDescription>{error}</AlertDescription>
             </Alert>
          )}
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <Button type="submit" className="w-full" disabled={isLoading || form.formState.isSubmitting}>
                    {isLoading || form.formState.isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating...
                        </>
                    ) : (
                        "Set New Password"
                    )}
                </Button>
                </form>
            </Form>
        </CardContent>
      </Card>
    </div>
    );
  }

  return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-lg">Verifying...</p>
      </div>
  );
}


export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-lg">Loading page...</p>
      </div>
    }>
      <ResetPasswordForm_Internal />
    </Suspense>
  );
}
