# PaperPath

PaperPath is a full-stack research paper learning platform that helps users discover, save, read, and interact with academic papers through an AI-powered tutor experience. The project combines a React frontend, an Express backend, MongoDB storage, and local AI inference for paper understanding and question answering.

---

## 1. Project Overview

PaperPath is designed for students, researchers, and curious learners who want to:

- browse and explore research papers,
- save papers to a personal library,
- track what they have read,
- upload datasets in PDF or CSV format,
- ask questions about papers through an AI tutor.

The application is split into two main parts:

- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express + MongoDB

---

## 2. Features

### User features

- User registration and login
- JWT-based authentication
- Personal saved papers library
- Reading history tracking
- Dashboard for browsing papers
- Reader experience for individual papers

### AI and content features

- PDF ingestion support
- CSV ingestion support
- Automatic paper metadata storage
- AI-powered paper Q&A using local embeddings and generation
- Search-like semantic retrieval over stored paper chunks

### Admin/Developer features

- REST API structure for frontend integration
- Upload endpoint for datasets
- MongoDB-backed persistence
- Easy deployment for frontend and backend separately

---

## 3. Tech Stack

### Frontend

- React 18
- Vite
- Tailwind CSS
- Lucide React

### Backend

- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- Multer for file uploads
- dotenv for environment configuration

### AI Layer

- Local Ollama server
- Embedding model: nomic-embed-text
- Generation model: qwen2.5:0.5b

---

## 4. Project Structure

```text
PaperPath/
├── Paper_Path_Backend/
│   ├── server.js
│   ├── package.json
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   └── services/
│   └── uploads/
├── Paper_Path_Frontend/
│   ├── index.html
│   ├── package.json
│   ├── public/
│   └── src/
│       ├── components/
│       ├── services/
│       ├── App.jsx
│       ├── main.jsx
│       └── index.css
├── .env.example
├── RagAractictura.md
└── Readme.md
```

---

## 5. Prerequisites

Before running the project locally, make sure you have:

- Node.js 16 or newer
- npm or pnpm
- MongoDB Atlas account or a local MongoDB instance
- Ollama or gemnani api or openrouter api
- A browser to view the frontend

### Install Ollama

If you want the AI features to work, install Ollama and pull the required models:

```bash
ollama pull nomic-embed-text
ollama pull qwen2.5:0.5b
```

Then make sure Ollama is running on:

```text
http://localhost:11434
```

---

## 6. Installation Guide

### Step 1: Clone the repository

```bash
git clone <your-repo-url>
cd PaperPath
```

### Step 2: Install backend dependencies

```bash
cd Paper_Path_Backend
npm install
```

### Step 3: Install frontend dependencies

```bash
cd ../Paper_Path_Frontend
npm install
```

---

## 7. Environment Variables

Create a `.env` file inside the backend folder based on the example file:

```bash
cp ../.env.example .env
```

### Notes

- `MONGO_DB_URL` is required for database connectivity.
- `JWT_SECRET` is required for authentication.
- `VITE_API_BASE_URL` is used by the frontend to call the backend.
- The current AI flow uses local Ollama rather than Gemini, so local Ollama must be running for AI features to work.

---

## 8. Running the Project Locally

### Start the backend

```bash
cd Paper_Path_Backend
npm run dev
```

The backend will run on:

```text
http://localhost:3001
```

### Start the frontend

Open a second terminal:

```bash
cd Paper_Path_Frontend
npm run dev
```

The frontend will run on:

```text
http://localhost:3000
```

---

## 9. API Overview

The backend exposes the following API groups:

### Authentication

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/profile`

### Papers

- `GET /api/papers`
- `GET /api/papers/:paperId`
- `POST /api/papers/:paperId/ask`
- `POST /api/papers/upload`

### User library

- `GET /api/users/library`
- `POST /api/users/save/:paperId`
- `POST /api/users/history/:paperId`

These routes are used by the React frontend through the API service layer.

---

## 10. How the App Works

### Flow overview

1. A user registers or logs in.
2. The frontend fetches papers from the backend.
3. The user can save papers and view reading history.
4. The user can open a paper in the reader view.
5. The AI tutor can answer questions based on paper content and retrieved context.
6. Uploading a PDF or CSV stores the content in MongoDB and makes it searchable.

---

## 11. Frontend Deployment on Netlify

To deploy the frontend on Netlify, use the following settings:

- Base directory: `Paper_Path_Frontend`
- Build command: `npm run build`
- Publish directory: `dist`
- Functions directory: leave empty

### Environment variable for Netlify

Add this environment variable in Netlify:

```text
VITE_API_BASE_URL=https://your-backend-domain.com/api
```

Replace `your-backend-domain.com` with the actual URL of your deployed backend.

---

## 12. Backend Deployment Suggestions

The backend can be deployed on services such as:

- Render
- Railway
- Cyclic
- Fly.io
- VPS or cloud server

### Important deployment notes

- Make sure MongoDB Atlas is reachable from the deployed backend.
- Set your environment variables securely in the hosting platform.
- If you deploy the backend, update the frontend environment variable to point to the new backend URL.
- If using a cloud deployment, ensure CORS is enabled correctly for your frontend domain.

---

## 13. Troubleshooting

### Backend not starting

- Check whether MongoDB is reachable.
- Confirm your `.env` values are correct.
- Make sure dependencies are installed.

### Frontend cannot connect to backend

- Verify `VITE_API_BASE_URL` is set correctly.
- Confirm the backend is actually running.
- Check for CORS issues if frontend and backend are on different domains.

### AI features not working

- Ensure Ollama is installed and running.
- Verify the required models are downloaded.
- Check that the backend can reach `http://localhost:11434`.

---

## 14. Future Improvements

Possible enhancements for the project include:

- user profile customization,
- paper search and filtering improvements,
- full-text search and ranking,
- better AI summarization,
- admin dashboard for managing uploaded content,
- improved deployment automation with CI/CD.

---

## 15. Credits

This project was built as a full-stack academic paper learning application with a focus on accessibility, search, and AI-assisted learning.

Author and Creator :
Aditya Kushwaha
