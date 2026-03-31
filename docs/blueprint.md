# **App Name**: LearnVerse

LearnVerse is a comprehensive "Test Series Selling and Making Software" that features a robust plug-and-play architecture for managing questions and creating mock exams.

## Architecture Guidelines

- **Framework**: Next.js 15+ (App Router)
- **Styling**: Tailwind CSS & Shadcn UI components for a modern, responsive design.
- **Backend & Database**: Firebase (Authentication, Firestore Database, Storage if needed).
- **Core Principle**: "Plug-in Plug-out" architecture. The curriculum is purely data-driven, meaning that new courses, test series, tests, and questions can be generated directly by uploading `.tex` or `.txt` files to a central question pool without changing the underlying codebase.

## Database Entities & Schemas

The application uses Firestore to manage structured data with the following collections:

### 1. `users`
- `uid` (string): Unique identifier.
- `email` (string): User's email.
- `displayName` (string): Full name.
- `photoURL` (string): Optional avatar URI.
- `mobileNumber` (string): Contact number.

### 2. `testSeries` (Courses)
- `name` (string): Title of the test series.
- `description` (string): Comprehensive description.
- `price` (number): Price mapping for purchasing.
- `subject` (string): Category (e.g. PCM, IAT).
- `imageUrl` (string): Banner graphic.
- `createdAt` (date-time): When the series was initiated.

### 3. `testSeries/{id}/tests` (Individual Mock Exams)
- `name` (string): Title of the specific test (e.g., Mock Test 1).
- `duration` (number): Time limit in minutes.
- `order` (number): Used for chronological ordering.
- `createdAt` (date-time): Creation timestamp.

### 4. `testSeries/{id}/tests/{id}/questions`
- Structured documents representing the parsed JSON from `.tex` or `.txt` pools, containing:
  - `text` (string): The actual question text, supporting LaTeX ($...$ and $$...$$).
  - `options` (array): Array of choices with IDs and text.
  - `correctAnswerId` (string): The correct choice identifier.
  - `topic`/`subject` (string): Origin domain information.

### 5. `bookings` & `purchases`
- Tracks counseling bookings with states like `pending`, `confirmed`, `completed` or `cancelled`.
- Tracks course purchases verifying payments states like `pending`, `verified`, `rejected`.

## The Question Pool Engine

To make curriculum creation frictionless for administrators, the system implements a "deeply nested filesystem reader":
- Questions are uploaded locally to the `/papers` directory at the project root.
- The directory supports arbitrary deep nesting (e.g. `/papers/physics/mechanics/kinematics/2024.tex`).
- An API endpoint dynamically traverses this filesystem to present a unified file browser UI for the administrator.
- The administrator can inject random or specific questions directly from these text-based pools straight into a `testSeries` creating a fast, modular test generation pipeline.

## Style Guidelines:
- Primary color: Deep blue (`#34495E`) to evoke trust and knowledge.
- Background color: Light gray (`#F0F3F4`) for a clean interface.
- Accent color: Teal (`#008080`) to highlight important interactive elements.
- Use clear and simple icons ( Lucide React ) to represent different categories.
- Ensure subtle transitions and animations for a premium feel.