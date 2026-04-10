"use client";

import { useState } from "react";
import { useStorage, useUser } from "@/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, X, CheckCircle2, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";

interface BannerUploadProps {
  value: string;
  onChange: (url: string) => void;
}

export function BannerUpload({ value, onChange }: BannerUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const storage = useStorage();
  const { user } = useUser();
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!user) {
        toast({
          title: "Not Authenticated",
          description: "You must be logged in to upload images.",
          variant: "destructive",
        });
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }
      setFile(selectedFile);
      handleUpload(selectedFile);
    }
  };

  const handleUpload = (fileToUpload: File) => {
    if (!storage || !user) return;

    setUploading(true);
    setProgress(0);
    console.log("Starting upload for:", fileToUpload.name);

    const storageRef = ref(storage, `banners/${Date.now()}_${fileToUpload.name}`);
    const uploadTask = uploadBytesResumable(storageRef, fileToUpload);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progressPercent = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log(`Upload is ${progressPercent}% done`);
        setProgress(progressPercent);
      },
      (error) => {
        console.error("Upload error:", error);
        setUploading(false);
        toast({
          title: "Upload Failed",
          description: error.message,
          variant: "destructive",
        });
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        setUploading(false);
        onChange(downloadURL);
        toast({
          title: "Upload Successful",
          description: "Banner image has been updated.",
        });
      }
    );
  };

  const clearImage = () => {
    setFile(null);
    onChange("");
  };

  return (
    <div className="space-y-4 w-full">
      {value ? (
        <div className="relative group aspect-video w-full overflow-hidden rounded-lg border bg-muted shadow-inner">
          <Image
            src={value}
            alt="Banner Preview"
            fill
            className="object-cover transition-transform group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={clearImage}
              className="rounded-full"
            >
              <X className="w-4 h-4 mr-2" /> Remove Image
            </Button>
          </div>
          <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full shadow-lg">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center aspect-video w-full rounded-lg border-2 border-dashed border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/40 transition-all cursor-pointer group">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <div className="p-4 bg-primary/10 rounded-full mb-4 group-hover:scale-110 transition-transform">
              {uploading ? (
                <Progress value={progress} className="w-12 h-1 text-primary" />
              ) : (
                <Upload className="w-8 h-8 text-primary" />
              )}
            </div>
            <p className="mb-2 text-sm text-primary font-semibold">
              {uploading ? `Uploading... ${Math.round(progress)}%` : "Click to upload banner"}
            </p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
              SVG, PNG, JPG (MAX. 5MB)
            </p>
          </div>
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>
      )}

      {uploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-medium text-muted-foreground">
            <span>Progressing...</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}
    </div>
  );
}
