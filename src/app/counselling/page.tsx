// src/app/counselling/page.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CounsellingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-16rem)] py-12">
      <style jsx global>{`
        .dot-flashing {
          position: relative;
          width: 10px;
          height: 10px;
          border-radius: 5px;
          background-color: hsl(var(--primary));
          color: hsl(var(--primary));
          animation: dotFlashing 1s infinite linear alternate;
          animation-delay: .5s;
        }
        
        .dot-flashing::before, .dot-flashing::after {
          content: '';
          display: inline-block;
          position: absolute;
          top: 0;
        }
        
        .dot-flashing::before {
          left: -15px;
          width: 10px;
          height: 10px;
          border-radius: 5px;
          background-color: hsl(var(--primary));
          color: hsl(var(--primary));
          animation: dotFlashing 1s infinite alternate;
          animation-delay: 0s;
        }
        
        .dot-flashing::after {
          left: 15px;
          width: 10px;
          height: 10px;
          border-radius: 5px;
          background-color: hsl(var(--primary));
          color: hsl(var(--primary));
          animation: dotFlashing 1s infinite alternate;
          animation-delay: 1s;
        }
        
        @keyframes dotFlashing {
          0% {
            background-color: hsl(var(--primary));
          }
          50%,
          100% {
            background-color: hsla(var(--primary) / 0.3);
          }
        }
      `}</style>
      <Card className="w-full max-w-lg text-center shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary">
            Counselling Services
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-xl text-muted-foreground">
            Coming Soon
          </p>
          <div className="flex justify-center items-center h-10">
            <div className="dot-flashing"></div>
          </div>
          <p className="text-sm text-muted-foreground">
            We are working hard to bring you dedicated counselling support. Please check back later!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
