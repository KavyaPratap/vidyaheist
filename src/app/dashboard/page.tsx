"use client";

import { useUser } from "@/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, BarChart2, BookOpenCheck, GitBranch, User } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { user, loading } = useUser();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading dashboard...</p>
      </div>
    );
  }

  if (!user) {
    // This can happen briefly on logout or if accessed directly without being logged in.
    // The main page logic should redirect non-logged-in users away.
    return (
      <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
        <p className="text-lg text-muted-foreground">Redirecting to login...</p>
      </div>
    );
  }

  const displayName = user.displayName || user.email?.split('@')[0] || "Aspirant";

  const dashboardCards = [
    {
      title: "View Test Series",
      description: "Browse and start practicing from our curated collection of tests.",
      href: "/store",
      icon: <BookOpenCheck className="w-8 h-8 text-primary" />,
    },
    {
      title: "Check Your Rank",
      description: "Use our predictor tool to estimate your rank. (Coming Soon!)",
      href: "/predictor",
      icon: <GitBranch className="w-8 h-8 text-primary" />,
    },
    {
      title: "Performance Analytics",
      description: "Dive deep into your results and track your progress. (Coming Soon!)",
      href: "/profile",
      icon: <BarChart2 className="w-8 h-8 text-primary" />,
    },
     {
      title: "Manage Profile",
      description: "Update your personal details and password.",
      href: "/profile",
      icon: <User className="w-8 h-8 text-primary" />,
    },
  ];

  return (
    <div className="flex flex-col space-y-8">
      <section className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-primary">
          Welcome back, {displayName}!
        </h1>
        <p className="text-lg text-muted-foreground">
          Your journey to success continues here. What would you like to do today?
        </p>
      </section>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {dashboardCards.map((item) => (
          <Link href={item.href} key={item.title} className="group">
            <Card className="h-full flex flex-col justify-between">
              <CardHeader>
                <div className="bg-primary/10 p-3 rounded-full w-fit">
                    {item.icon}
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="mb-2 group-hover:text-primary transition-colors">{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

       <Card>
        <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>An overview of your recent tests and performance.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="text-center py-12 text-muted-foreground">
                <p>You haven't taken any tests yet.</p>
                <Button asChild variant="link" className="mt-2">
                    <Link href="/store">Explore Test Series</Link>
                </Button>
            </div>
        </CardContent>
       </Card>
    </div>
  );
}
