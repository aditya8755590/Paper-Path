# PaperPath Frontend - Instructions

## Project Context

This is a React frontend application for PaperPath, a platform that helps students understand research papers with AI-assisted explanations.

## Current Implementation Status

- [x] Project structure scaffolded
- [x] React 18 + Vite setup
- [x] Tailwind CSS configured
- [x] Full App component implemented with:
  - Login authentication view
  - Dashboard with paper browsing
  - Paper reader with AI tutor chat
  - Mock API adapter for development

## Development Workflow

1. **Development Server**: `npm run dev` (localhost:3000)
2. **Build**: `npm run build` (output to dist/)
3. **Preview**: `npm run preview`

## Key Files to Know

- `src/App.jsx` - Main application with all views and state management
- `tailwind.config.js` - Tailwind CSS customization
- `vite.config.js` - Build configuration

## Integration Points (Next Steps)

Replace mock API calls with actual backend:

1. Authentication endpoints in `handleLogin()`
2. Paper fetching in `fetchDashboardData()`
3. Save/bookmark endpoints in `toggleSave()`
4. AI chat endpoint in `handleSendMessage()`

## Styling Guidelines

- Uses Tailwind CSS utility classes
- Color scheme: Indigo primary, slate for neutral
- Mobile-first responsive design
- Icons from lucide-react library

## Common Tasks

- To add new pages: Create new component function in App.jsx, add to router
- To modify styling: Update Tailwind classes in component JSX
- To add mock data: Modify MOCK_PAPERS array
- To change API delays: Update simulateApi() calls with different delay values

## Troubleshooting

If dependencies don't install:

- Clear node_modules: `rm -r node_modules`
- Clear npm cache: `npm cache clean --force`
- Reinstall: `npm install`
