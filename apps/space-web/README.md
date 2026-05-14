# LMS SYSTEM Frontend

This is the frontend application for the Learning Management System (LMS), built with **Next.js 15**, **TypeScript**, and **Tailwind CSS**.

## Prerequisites

- **Node.js**: v18.x or later
- **npm** or **yarn**

## Getting Started

### 1. Install Dependencies

Navigate to the frontend directory and install the required packages:

```bash
cd lms-system-fe
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the `lms-system-fe` directory and add the backend API URL:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Run Development Server

Start the development server:

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Project Structure

- `src/app/`: Next.js App Router pages and layouts.
  - `login/`: Login page implementation.
- `src/lib/`: Core utilities, including the API client.
  - `api/`: API services and BaseRestApiClient.
- `public/`: Static assets.

## Features Implemented

- **Authentication**: JWT-based login integration.
- **Token Management**: Automatic storage of `accessToken` and `refreshToken` in `localStorage`.
- **Protected Routes**: Basic redirection to login if unauthenticated on the Home page.
- **API Client**: Standardized fetch client with automatic Authorization headers and 401 handling.

## Available Scripts

- `npm run dev`: Starts the development server.
- `npm run build`: Builds the application for production.
- `npm run start`: Starts the production server.
- `npm run lint`: Runs ESLint to check for code quality issues.
