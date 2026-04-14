import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { parseQuestionFile } from "@/lib/tex-parser";

const PAPERS_DIRECTORY = path.join(process.cwd(), "papers");

export interface FileNode {
  name: string;
  type: "file" | "directory";
  path: string; // Relative path from papers root
  children?: FileNode[];
  questionCount?: number;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filePath = searchParams.get("filePath");

  if (filePath) {
    try {
      const absolutePath = path.resolve(PAPERS_DIRECTORY, filePath);
      if (!absolutePath.startsWith(PAPERS_DIRECTORY)) {
        return NextResponse.json({ error: "Invalid path" }, { status: 400 });
      }

      const content = await fs.readFile(absolutePath, "utf-8");
      const ext = path.extname(absolutePath).toLowerCase();
      
      // Heuristic: identify subject from path
      const pathParts = filePath.split("/");
      let subject = "Physics"; // default
      if (pathParts.includes("biology")) subject = "Biology";
      else if (pathParts.includes("chemistry")) subject = "Chemistry";
      else if (pathParts.includes("maths")) subject = "Maths";
      else if (pathParts.includes("physics")) subject = "Physics";

      let questions: any[] = [];
      if (ext === ".tex") {
        questions = parseQuestionFile(content, "tex", subject);
      } else if (ext === ".txt") {
        questions = parseQuestionFile(content, "txt", subject);
      }

      return NextResponse.json({ questions });
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  // No filePath specified: return the directory tree with heuristic counts
  try {
    const tree = await buildDirectoryTree(PAPERS_DIRECTORY, "");
    return NextResponse.json({ tree });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { filePaths } = await request.json();
    if (!Array.isArray(filePaths)) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

    let allQuestions: any[] = [];

    for (const relativePath of filePaths) {
      const absolutePath = path.resolve(PAPERS_DIRECTORY, relativePath);
      if (!absolutePath.startsWith(PAPERS_DIRECTORY)) continue;

      try {
        const content = await fs.readFile(absolutePath, "utf-8");
        const ext = path.extname(absolutePath).toLowerCase();

        const pathParts = relativePath.split("/");
        let subject = "Physics";
        if (pathParts.includes("biology")) subject = "Biology";
        else if (pathParts.includes("chemistry")) subject = "Chemistry";
        else if (pathParts.includes("maths")) subject = "Maths";
        else if (pathParts.includes("physics")) subject = "Physics";

        if (ext === ".tex") {
          allQuestions.push(...parseQuestionFile(content, "tex", subject));
        } else if (ext === ".txt") {
          allQuestions.push(...parseQuestionFile(content, "txt", subject));
        }
      } catch (err) {
        console.error("Failed to read", relativePath, err);
      }
    }

    return NextResponse.json({ questions: allQuestions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function buildDirectoryTree(dirPath: string, relativePath: string): Promise<FileNode[]> {
  let nodes: FileNode[] = [];
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;

      const fullPath = path.join(dirPath, entry.name);
      const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        const children = await buildDirectoryTree(fullPath, relPath);
        if (children.length > 0) {
          const folderCount = children.reduce((sum, n) => sum + (n.questionCount || 0), 0);
          nodes.push({
            name: entry.name,
            type: "directory",
            path: relPath.replace(/\\/g, "/"),
            children,
            questionCount: folderCount,
          });
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (ext === ".tex" || ext === ".txt") {
          
          let questionCount = 0;
          try {
            const content = await fs.readFile(fullPath, "utf-8");
            if (ext === ".tex") {
              const pathParts = relPath.split("/");
              let subject = "Physics";
              if (pathParts.includes("biology")) subject = "Biology";
              else if (pathParts.includes("chemistry")) subject = "Chemistry";
              else if (pathParts.includes("maths")) subject = "Maths";
              else if (pathParts.includes("physics")) subject = "Physics";
              questionCount = parseQuestionFile(content, "tex", subject).length;
            } else if (ext === ".txt") {
              const pathParts = relPath.split("/");
              let subject = "Physics";
              if (pathParts.includes("biology")) subject = "Biology";
              else if (pathParts.includes("chemistry")) subject = "Chemistry";
              else if (pathParts.includes("maths")) subject = "Maths";
              else if (pathParts.includes("physics")) subject = "Physics";
              let inferredType: "tex" | "txt" = (content.includes("\\item") || content.includes("\\begin{document}")) ? "tex" : "txt";
              questionCount = parseQuestionFile(content, inferredType, subject).length;
            }
          } catch(e) {
            console.error("Error reading file for count:", e);
          }

          nodes.push({
            name: entry.name,
            type: "file",
            path: relPath.replace(/\\/g, "/"),
            questionCount,
          });
        }
      }
    }
  } catch (error: any) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
  
  nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return nodes;
}
