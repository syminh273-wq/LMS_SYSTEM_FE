# LMS Monorepo Project

Welcome to the Learning Management System (LMS) Monorepo. This project is structured to manage multiple frontend applications and a shared backend in a single repository using **npm workspaces**.

## Project Structure

- **`lms-backend/`**: Django Backend API (Independent project).
- **Frontend Monorepo**:
  - `apps/consumer-web`: Next.js frontend for Students/Consumers (Port 3000).
  - `apps/space-web`: Next.js frontend for Organizations/Spaces (Port 3001).
  - `packages/shared`: Shared logic, components, and API client.

---

## Getting Started

### 1. Installation

Install frontend monorepo dependencies:
```bash
npm install
```

Install backend dependencies:
```bash
cd lms-backend
pip install -r requirements.txt
```

### 2. Running the Applications

#### Backend
```bash
npm run dev:backend
# or
cd lms-backend && python manage.py runserver
```

---

## Tech Stack

### Frontend (Apps & Shared)
- **Framework**: Next.js 15+ (App Router)
- **UI Components**: Shadcn UI, Tailwind CSS
- **State Management**: Redux Toolkit
- **Icons**: Lucide React
- **Language**: TypeScript

### Backend
- **Framework**: Django & Django REST Framework
- **Database**: Cassandra (via `cassandra-driver`)
- **Authentication**: JWT (SimpleJWT)

---

## Development Notes

### Shared Logic
When adding new API endpoints or shared components, always place them in `packages/shared`. This ensures consistency across both the Consumer and Space applications.

### Port Management
- **Consumer Web**: [http://localhost:3000](http://localhost:3000)
- **Space Web**: [http://localhost:3001](http://localhost:3001)
- **API Backend**: [http://localhost:8000](http://localhost:8000)
