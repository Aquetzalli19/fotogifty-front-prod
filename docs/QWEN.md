# FotoGifty Frontend

## Project Overview

FotoGifty is a Next.js web application bootstrapped with `create-next-app`. It's a frontend application for a photo gift service that allows users to create and order photo-based products. The application is built with modern React practices and follows the Next.js App Router pattern.

### Key Technologies & Architecture

- **Framework**: Next.js 15.4.7 (using App Router)
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: zustand (for global state), react-hook-form (for form handling)
- **UI Components**: shadcn/ui with Radix UI primitives
- **Icons**: Lucide React
- **Animations**: React Spring and motion
- **Font Loading**: Google Fonts (Poppins and Raleway)

### Project Structure
```
src/
├── app/                 # Next.js App Router pages
│   ├── (presentation)/  # Presentation section
│   ├── admin/          # Admin section with sub-sections
│   │   ├── (presentation)/
│   │   ├── delivercontrol/
│   │   └── itemcontrol/
│   ├── test/           # Test pages
│   ├── user/           # User section
│   ├── globals.css     # Global styles
│   └── layout.tsx      # Root layout
├── components/         # Reusable React components
│   ├── admin/         # Admin components
│   ├── common/         # Common components
│   ├── editor-components/ # Editor-specific components
│   ├── landing-page/   # Landing page components
│   ├── ui/            # shadcn/ui components
│   ├── user/          # User-specific components
│   ├── modeToggle.tsx # Theme toggle component
│   └── SliderControl.tsx # Slider component
├── hooks/             # Custom React hooks
├── interfaces/        # TypeScript interface definitions
├── lib/              # Utility functions and shared code
│   ├── canvas-utils.ts # Canvas-related utilities
│   ├── types.ts      # Type definitions
│   └── utils.ts      # General utility functions
├── stores/           # Zustand stores for state management
├── test-data/        # Test data files
└── validations/      # Zod validation schemas
```

## Building and Running

### Development
- Start the development server: `npm run dev` (or `yarn dev`, `pnpm dev`, `bun dev`)
- This uses Next.js with Turbopack for faster bundling
- Access the application at http://localhost:3000

### Production
- Build the application: `npm run build`
- Start the production server: `npm run start`

### Linting
- Run ESLint: `npm run lint`

## Development Conventions

### Component Development
- Components follow the shadcn/ui pattern with Radix UI primitives
- TypeScript is used throughout the application
- File-based routing with Next.js App Router
- Path aliases are configured (`@/*` maps to `./src/*`)

### Styling
- Tailwind CSS is used for styling with CSS variables
- The project uses the "new-york" style from shadcn/ui
- Two fonts are used: Raleway (primary) and Poppins (secondary)

### State Management
- Local component state is managed with React hooks
- Global state is managed with Zustand
- Forms are handled with react-hook-form and validated with Zod

### Naming Conventions
- Component files use PascalCase
- Page and layout files use lowercase
- CSS classes follow Tailwind's utility-first approach
- TypeScript interfaces are defined in the interfaces/ directory

### Project-Specific Information
- The application has an admin panel with multiple sections (itemcontrol, delivercontrol)
- The admin section appears to use layout groups for navigation organization
- A test-data directory suggests comprehensive testing practices
- The project includes canvas utilities, indicating possible image manipulation features
- The project includes a theme provider for dark/light mode support