"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Loader2, 
  Rocket, 
  BrainCircuit, 
  LineChart, 
  GraduationCap, 
  Users, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight,
  PlayCircle,
  Sparkles,
  ChevronRight,
  Target,
  Zap,
  BarChart3
} from "lucide-react";
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { APP_NAME } from "@/lib/constants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function MarketingPage() {
  const { user, loading } = useUser();
  const router = useRouter();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Handle Mouse Move for Global Spotlight Effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Redirect if logged in
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg font-medium text-foreground">Loading your experience...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground transition-colors duration-300">
      
      {/* Global Dynamic Spotlight */}
      <div 
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(41, 59, 95, 0.05), transparent 80%)`,
        }}
      />

      <div className="relative z-10 flex flex-col items-center pb-20">
        <HeroSection />
        <StatsSection />
        <FeaturesSection />
        <HowItWorksSection />
        <CTASection />
      </div>
    </div>
  );
}

function HeroSection() {
  return (
    <section className="relative w-full pt-20 md:pt-32 lg:pt-40 pb-16 overflow-hidden">
      <div className="container px-4 md:px-6 mx-auto grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
        
        {/* Left Content */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col justify-center space-y-8 text-center lg:text-left z-10"
        >
          <div className="space-y-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary backdrop-blur-sm"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              <span>Rank #1 in JEE & NEET Prep</span>
            </motion.div>
            
            <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl leading-[1.1]">
              Unlock Your <br className="hidden lg:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary animate-gradient-x">
                True Potential
              </span>
            </h1>
            
            <p className="max-w-[600px] mx-auto lg:mx-0 text-foreground/70 md:text-xl leading-relaxed font-light">
              Ace your exams with ultra-realistic NTA simulations, AI-powered mistake analysis, and expert-curated mock tests designed to guarantee success.
            </p>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
          >
            <a href="/signup" className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-primary-foreground bg-primary rounded-full overflow-hidden transition-transform hover:scale-105 active:scale-95 shadow-lg">
              <span className="relative flex items-center gap-2">
                Start Simulating <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </a>
            <a href="#features" className="group inline-flex items-center justify-center px-8 py-4 font-semibold text-foreground bg-secondary/50 hover:bg-secondary rounded-full transition-all backdrop-blur-md border border-border">
              <PlayCircle className="mr-2 w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
              Watch Demo
            </a>
          </motion.div>
        </motion.div>

        {/* Right Content - Floating Visual */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative lg:h-[600px] w-full max-w-[600px] mx-auto flex items-center justify-center"
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-primary/20 to-accent/20 blur-[100px] rounded-full z-0"></div>

          <motion.div
            animate={{ y: [0, -20, 0] }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
            className="relative z-10 w-full rounded-2xl border border-border bg-background/50 p-2 shadow-2xl backdrop-blur-xl"
          >
            <div className="relative rounded-xl overflow-hidden aspect-[4/3] bg-secondary/30">
              <img 
                src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2000&auto=format&fit=crop" 
                alt="Student analyzing performance" 
                className="object-cover w-full h-full opacity-80 mix-blend-overlay"
              />
              
              <div className="absolute inset-0 p-6 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div className="bg-background/80 backdrop-blur-md rounded-lg p-3 shadow-lg border border-border flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                      <LineChart className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Est. Rank</p>
                      <p className="font-bold text-foreground">Top 1%</p>
                    </div>
                  </div>
                </div>

                <motion.div 
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="self-end bg-background/80 backdrop-blur-md rounded-lg p-4 shadow-lg border border-border w-48"
                >
                  <p className="text-xs text-muted-foreground mb-2">Accuracy Rate</p>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: "85%" }} 
                      transition={{ duration: 1.5, delay: 1.2 }}
                      className="h-full bg-primary"
                    />
                  </div>
                  <p className="text-right text-sm font-bold mt-1">85%</p>
                </motion.div>
              </div>
            </div>
          </motion.div>

          <FloatingBadge icon={<BrainCircuit/>} text="AI Analysis" delay={0.2} top="-10%" left="10%" />
          <FloatingBadge icon={<ShieldCheck/>} text="NTA Pattern" delay={0.5} bottom="10%" right="-5%" />
        </motion.div>
      </div>
    </section>
  );
}

function FloatingBadge({ icon, text, delay, top, left, right, bottom }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1 + delay, type: "spring" }}
      className="absolute z-20 bg-background border border-border shadow-xl rounded-full px-4 py-2 flex items-center gap-2 backdrop-blur-md"
      style={{ top, left, right, bottom }}
    >
      <span className="text-primary">{icon}</span>
      <span className="text-sm font-medium">{text}</span>
    </motion.div>
  );
}

function StatsSection() {
  const stats = [
    { label: "Active Students", value: "50,000+" },
    { label: "Mock Tests Attempted", value: "1.2M+" },
    { label: "Questions Bank", value: "100K+" },
    { label: "Selection Rate", value: "3x Higher" },
  ];

  return (
    <section className="w-full py-10 border-y border-border bg-secondary/20 backdrop-blur-sm z-10">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((stat, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, margin: "-50px" }}
              transition={{ delay: index * 0.1 }}
              className="space-y-2"
            >
              <h3 className="text-3xl md:text-4xl font-extrabold text-primary">{stat.value}</h3>
              <p className="text-sm md:text-base text-muted-foreground font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      title: "Realistic Exam Simulation",
      description: "Experience the actual JEE/NEET environment with identical UI and timed tests.",
      icon: <Target className="w-8 h-8 text-primary" />,
      items: ["NTA Pattern Implementation", "Strict Timed Sessions", "Distraction-free mode", "Realistic UI", "Live Mock Feed"]
    },
    {
      title: "AI-Enhanced Explanations",
      description: "Never get stuck. Get detailed AI-generated logic for every single answer.",
      icon: <Zap className="w-8 h-8 text-primary" />,
      items: ["Step-by-step logic", "Core Concept Clarity", "Mistake Analysis", "Instant Clarification", "Topic Tagging"]
    },
    {
      title: "Performance Analytics",
      description: "Monitor progress with pinpoint accuracy. Identify weak chapters early.",
      icon: <BarChart3 className="w-8 h-8 text-primary" />,
      items: ["Subject-wise Tracking", "Time Management Stats", "Real-time Rank Estimator", "Error Pattern Recognition", "Growth Charts"]
    }
  ];

  return (
    <section id="features" className="w-full py-24 md:py-32 relative z-10">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: "-50px" }}
            className="inline-block rounded-full bg-secondary px-4 py-1.5 text-sm font-bold text-primary border border-border"
          >
            The Ultimate Toolkit
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: "-50px" }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-bold tracking-tighter sm:text-5xl"
          >
            Everything you need to <span className="text-primary">Succeed</span>
          </motion.h2>
          <p className="text-foreground/70 md:text-xl leading-relaxed">
            We've engineered every feature to give you an unfair advantage. Dive into tools built specifically for top rankers.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, margin: "-50px" }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
            >
              <Card className="h-full transition-all hover:shadow-xl hover:border-primary/50 group">
                <CardHeader>
                  <div className="mb-4 bg-primary/10 w-fit p-3 rounded-xl group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-2xl">{feature.title}</CardTitle>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {feature.items.map((item, i) => (
                      <li key={i} className="flex items-center text-sm text-muted-foreground">
                        <CheckCircle2 className="mr-2 h-4 w-4 text-green-500 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    { num: "01", title: "Create Profile", desc: "Sign up and tell us your target exam and current prep level." },
    { num: "02", title: "Take Diagnostic", desc: "Attempt a baseline mock test to identify your strong and weak zones." },
    { num: "03", title: "Follow AI Plan", desc: "Get a personalized study roadmap and targeted practice questions." },
    { num: "04", title: "Track & Conquer", desc: "Watch your rank improve in real-time as you clear your weaknesses." },
  ];

  return (
    <section className="w-full py-24 relative z-10">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="flex flex-col md:flex-row gap-16 items-center">
          
          <div className="w-full md:w-1/3 space-y-6 text-center md:text-left">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Your Path to <span className="text-primary">Victory</span></h2>
            <p className="text-lg text-muted-foreground">We've distilled the success strategies of top rankers into a simple, automated 4-step process. No more guessing, just focused execution.</p>
            <a href="/store" className="inline-flex items-center justify-center px-6 py-3 font-semibold rounded-lg bg-secondary text-foreground hover:bg-secondary/80 transition-colors">
              View Test Series
            </a>
          </div>

          <div className="w-full md:w-2/3 relative">
            {/* Timeline Line - Fixed centering and visibility */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-accent to-transparent z-0 opacity-20"></div>

            <div className="space-y-12 relative z-10">
              {steps.map((step, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: false, margin: "-100px" }}
                  transition={{ delay: idx * 0.15, duration: 0.5 }}
                  className="flex gap-6 items-start group"
                >
                  <div className="w-16 h-16 rounded-full bg-background border-2 border-primary/30 flex items-center justify-center text-xl font-bold text-primary flex-shrink-0 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shadow-lg">
                    {step.num}
                  </div>
                  <div className="space-y-2 pt-2 md:pt-4">
                    <h3 className="text-2xl font-bold">{step.title}</h3>
                    <p className="text-muted-foreground text-lg">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="w-full py-24 relative z-10">
      <div className="container px-4 md:px-6 mx-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: false, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="relative rounded-[3rem] overflow-hidden bg-primary px-6 py-16 md:py-24 text-center text-primary-foreground shadow-2xl"
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white/10 rounded-full animate-[spin_60s_linear_infinite] z-0 pointer-events-none"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white/20 rounded-full animate-[spin_40s_linear_infinite_reverse] z-0 pointer-events-none"></div>

          <div className="relative z-10 max-w-3xl mx-auto space-y-8">
            <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight">
              Stop Dreaming. <br/>Start Scoring.
            </h2>
            <p className="text-lg md:text-2xl text-primary-foreground/80 max-w-2xl mx-auto">
              Join thousands of students who have already transformed their preparation and secured their dream colleges.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-6">
              <a 
                href="/signup" 
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold bg-background text-primary rounded-full hover:scale-105 active:scale-95 transition-all shadow-xl"
              >
                Sign Up for Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </a>
            </div>
            <p className="text-sm text-primary-foreground/60 mt-6">No credit card required. 7-day free trial on premium tests.</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}