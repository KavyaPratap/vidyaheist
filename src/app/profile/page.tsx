
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useAuth, useUser } from "@/firebase";
import { updatePassword } from "firebase/auth";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Award, BarChart2, BookOpenCheck, Edit3, KeyRound, Loader2 } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const changePasswordSchema = z.object({
  newPassword: z.string().min(6, { message: "New password must be at least 6 characters." }),
  confirmPassword: z.string().min(6, { message: "Password must be at least 6 characters." }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export default function ProfilePage() {
  const { user, loading: userLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const passwordForm = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/login");
    }
  }, [user, userLoading, router]);

  async function onChangePasswordSubmit(data: ChangePasswordFormValues) {
    if (!auth?.currentUser) {
      toast({ title: "Error", description: "You must be logged in to change your password.", variant: "destructive" });
      return;
    }
    try {
      await updatePassword(auth.currentUser, data.newPassword);
      toast({
        title: "Password Updated",
        description: "Your password has been successfully changed.",
      });
      passwordForm.reset();
    } catch (error: any) {
      console.error("Error changing password:", error);
      let description = "Could not update your password. Please try again.";
      if (error.code === 'auth/requires-recent-login') {
        description = "This action is sensitive and requires recent authentication. Please log in again before retrying."
      }
      toast({
        title: "Error Changing Password",
        description,
        variant: "destructive",
      });
    }
  }

  if (userLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading profile...</p>
      </div>
    );
  }

  if (!user) {
    // This will be briefly visible before the useEffect redirects
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)]">
        <p className="text-lg text-muted-foreground mb-4">Redirecting to login...</p>
      </div>
    );
  }

  const displayName = user.displayName || user.email?.split('@')[0] || "User";
  const joinDate = user.metadata.creationTime ? formatDistanceToNow(new Date(user.metadata.creationTime), { addSuffix: true }) : "N/A";
  const avatarUrl = user.photoURL || `https://avatar.vercel.sh/${displayName.replace(/\s+/g, '')}.png`;

  return (
    <div className="space-y-8">
      <section className="text-center py-8 bg-primary/5 rounded-lg">
        <h1 className="text-4xl font-bold tracking-tight text-primary">My Profile</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Manage your account details and track your progress.
        </p>
      </section>

      <Card className="shadow-xl">
        <CardHeader className="flex flex-row items-center space-x-4 pb-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback>{displayName.substring(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-2xl">{displayName}</CardTitle>
            <CardDescription>{user.email}</CardDescription>
            <CardDescription>Joined: {joinDate}</CardDescription>
          </div>
          <Button variant="outline" size="sm" className="ml-auto" disabled> {/* Edit profile not implemented yet */}
            <Edit3 className="mr-2 h-4 w-4" /> Edit Profile
          </Button>
        </CardHeader>
        
        <Separator />

        <CardContent className="pt-6 grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-primary flex items-center">
              <BarChart2 className="mr-2 h-5 w-5" /> Performance Overview
            </h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Tests Taken: Coming Soon</p>
              <p>Average Score: Coming Soon</p>
            </div>
            <Button variant="link" className="p-0 h-auto" disabled>View Detailed Analytics</Button>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-primary flex items-center">
              <BookOpenCheck className="mr-2 h-5 w-5" /> Purchased Test Series
            </h3>
            <p className="text-sm text-muted-foreground">No test series purchased yet. (Feature coming soon)</p>
             <Button variant="link" className="p-0 h-auto" onClick={() => router.push('/store')}>Browse Store</Button>
          </div>
        </CardContent>

        <Separator />

        <CardContent className="pt-6">
           <h3 className="text-lg font-semibold text-primary flex items-center mb-4">
              <Award className="mr-2 h-5 w-5" /> Achievements & Badges
            </h3>
            <p className="text-sm text-muted-foreground">Feature coming soon! Earn badges for your accomplishments.</p>
        </CardContent>
      </Card>

      {/* Change Password Card */}
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center">
            <KeyRound className="mr-2 h-5 w-5 text-primary" /> Change Password
          </CardTitle>
          <CardDescription>
            Update your password here. Make sure it's strong and memorable.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onChangePasswordSubmit)} className="space-y-6 max-w-md">
              <FormField
                control={passwordForm.control}
                name="newPassword"
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
                control={passwordForm.control}
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
              <Button type="submit" disabled={passwordForm.formState.isSubmitting}>
                {passwordForm.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Change Password"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

    </div>
  );
}
