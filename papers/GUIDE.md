# Vidyaheist Team: Question Paper Creation Guide

This guide explains how to format your LaTeX question papers so they are **100% compatible** with the Vidyaheist website and can be correctly parsed by the Admin Curriculum Builder.

## 1. Basic Structure
Each `.tex` file should start with a standard LaTeX header and wrap all questions in a single `enumerate` block.

```latex
\documentclass{article}
\usepackage{amsmath}
\usepackage{enumerate}
\begin{document}

\begin{enumerate}
    \item Question goes here...
    \item Next question...
\end{enumerate}

\end{document}
```

## 2. Setting the Correct Answer
To tell the website which option is correct, you **must** add `\hfill \textbf{ (A) }` at the end of the line where the `\item` (the question) is.

✅ **Correct:**
`\item What is 2 + 2? \hfill \textbf{(B)}`

## 3. Options Format
There are two ways to write options. Both are supported:

### A. Nested List (Recommended)
This is the cleanest and most reliable format.
```latex
\item Who discovered gravity? \hfill \textbf{(A)}
\begin{enumerate}[(A)]
    \item Isaac Newton
    \item Albert Einstein
\end{enumerate}
```

### B. Inline Options
Use this if you want to save space. The website handles backslashes `\\` automatically now.
```latex
\item What is the capital of India? \hfill \textbf{(C)}
\\(A) Mumbai (B) Kolkata (C) New Delhi (D) Chennai
```

## 4. Special Questions (Match the Following)
For match-the-following questions, simply list the items in the question text and provided the combined options below.

```latex
\item Match the following: \hfill \textbf{(A)}
\\1. Heart -> (a) Pumping
\\2. Lungs -> (b) Gas exchange
\\(A) 1-a, 2-b
\\(B) 1-b, 2-a
```

## 5. Subject Placement
The website automatically detects the subject based on the folder you put the file in:
- Folder `papers/biology/` -> Tagged as **Biology**
- Folder `papers/chemistry/` -> Tagged as **Chemistry**
- Folder `papers/maths/` -> Tagged as **Maths**
- Folder `papers/physics/` -> Tagged as **Physics**

## 6. Pro Tips
- **Formulas:** Always use `$...$` for chemical formulas or math variables.
- **Images:** If a question needs an image, please leave a comment like `% IMAGE_HERE` for the admin to upload manually in the dashboard.
- **Verification:** Always "Select All" and "Inject" in the Admin Dashboard to verify the count of questions!
