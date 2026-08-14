import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { processCsvStream, processPdfAndIngest, answerPaperQuestion } from '../services/geminiServices.js';
import paperModel from '../models/paper.js';

const router = express.Router();

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 500 * 1024 * 1024 }
});

// --- REAL MONGODB GET ROUTES ---
router.get('/', async (req, res) => {
  try {
    // Only fetch active (non-archived) research papers, newest first
    const papers = await paperModel.find(
      { category: { $nin: ['Archived', 'CSV'] } },
      '-chunks.embedding'
    ).sort({ createdAt: -1 }).limit(100);
    res.json({ data: papers });
  } catch (error) {
    console.error("❌ Error fetching papers:", error);
    res.status(500).json({ message: "Failed to load papers." });
  }
});

// 🌐 PROXY ROUTE FOR EMBEDDING REMOTE PDF DOCUMENTS (ArXiv / External PDF URLs)
router.get('/proxy-pdf', async (req, res) => {
  try {
    const targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).send('Missing url parameter');

    console.log(`📡 Proxying PDF stream for: ${targetUrl}`);
    const fetchRes = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!fetchRes.ok) {
      return res.status(fetchRes.status).send('Failed to fetch remote PDF file.');
    }

    const arrayBuffer = await fetchRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
    res.send(buffer);
  } catch (error) {
    console.error('❌ PDF Proxy Error:', error.message);
    res.status(500).send('Proxy server failed to retrieve PDF file.');
  }
});

// 📄 EMBEDDED PDF DOCUMENT VIEWER ROUTE FOR ALL PAPERS
router.get('/:paperId/render-pdf', async (req, res) => {
  try {
    const paper = await paperModel.findById(req.params.paperId);
    if (!paper) return res.status(404).send('Paper not found');

    // If paper has a direct PDF URL, proxy or redirect to it
    if (paper.pdfUrl) {
      if (paper.pdfUrl.startsWith('http://localhost:3001') || paper.pdfUrl.startsWith('/uploads')) {
        return res.redirect(paper.pdfUrl);
      }
      return res.redirect(`/api/papers/proxy-pdf?url=${encodeURIComponent(paper.pdfUrl)}`);
    }

    // If no direct PDF URL exists, render a styled Academic PDF Document page for inline iframe viewing
    const authors = paper.authors || 'Academic Researcher';
    const abstract = paper.abstract || 'No abstract available.';
    const content = paper.content || (paper.chunks && paper.chunks.length > 0 ? paper.chunks.map(c => c.text).join('\n\n') : abstract);
    const scholarUrl = `https://scholar.google.com/scholar?q=${encodeURIComponent(paper.title)}`;
    const arxivUrl = `https://arxiv.org/search/?query=${encodeURIComponent(paper.title)}&searchtype=title`;

    const htmlDocument = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${paper.title} - Academic PDF Viewer</title>
  <style>
    body {
      margin: 0;
      padding: 30px;
      background: #525659;
      font-family: 'Times New Roman', Times, serif;
      color: #111;
      display: flex;
      justify-content: center;
    }
    .paper-page {
      background: #fff;
      width: 100%;
      max-width: 800px;
      padding: 60px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.3);
      border-radius: 2px;
      min-height: 1000px;
      box-sizing: border-box;
    }
    .header-bar {
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 11px;
      color: #666;
      border-bottom: 2px solid #222;
      padding-bottom: 8px;
      margin-bottom: 25px;
      display: flex;
      justify-content: space-between;
    }
    .paper-title {
      font-size: 26px;
      font-weight: bold;
      text-align: center;
      line-height: 1.3;
      margin-bottom: 15px;
    }
    .paper-authors {
      text-align: center;
      font-style: italic;
      font-size: 14px;
      color: #444;
      margin-bottom: 30px;
    }
    .abstract-box {
      background: #f8f9fa;
      border-left: 3px solid #0056b3;
      padding: 15px 20px;
      margin-bottom: 30px;
      font-size: 13.5px;
      line-height: 1.6;
    }
    .abstract-title {
      font-weight: bold;
      font-family: system-ui, sans-serif;
      font-size: 12px;
      text-transform: uppercase;
      color: #0056b3;
      margin-bottom: 5px;
    }
    .content-body {
      font-size: 14px;
      line-height: 1.7;
      text-align: justify;
    }
    .content-body p {
      margin-bottom: 18px;
      text-indent: 20px;
    }
    .action-row {
      font-family: system-ui, sans-serif;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      display: flex;
      gap: 10px;
      justify-content: center;
    }
    .btn {
      padding: 8px 16px;
      background: #238636;
      color: #fff;
      text-decoration: none;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
    }
    .btn-secondary {
      background: #0969da;
    }
  </style>
</head>
<body>
  <div class="paper-page">
    <div class="header-bar">
      <span>PAPERPATH ACADEMIC REPOSITORY</span>
      <span>INDEX: ${paper._id}</span>
    </div>

    <div class="paper-title">${paper.title}</div>
    <div class="paper-authors">Authors: ${authors}</div>

    <div class="abstract-box">
      <div class="abstract-title">Abstract</div>
      ${abstract}
    </div>

    <div class="content-body">
      ${content.split('\n\n').map(p => `<p>${p}</p>`).join('')}
    </div>

    <div class="action-row">
      <a href="${scholarUrl}" target="_blank" class="btn">🎓 Search on Google Scholar</a>
      <a href="${arxivUrl}" target="_blank" class="btn btn-secondary">🔍 Search on ArXiv</a>
    </div>
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.send(htmlDocument);
  } catch (error) {
    console.error('❌ Error rendering paper PDF:', error);
    res.status(500).send('Failed to render paper document');
  }
});

router.get('/:paperId', async (req, res) => {
  try {
    const paper = await paperModel.findById(req.params.paperId, '-chunks.embedding');
    if (!paper) return res.status(404).json({ message: 'Paper not found' });
    res.json({ data: paper });
  } catch (error) {
    console.error("❌ Error fetching paper details:", error);
    res.status(500).json({ message: "Failed to load paper details." });
  }
});

// 🤖 AI TUTOR PAPER CHAT ROUTE
router.post('/:paperId/ask', async (req, res) => {
  try {
    const { prompt } = req.body;
    const { paperId } = req.params;

    if (!prompt) return res.status(400).json({ message: 'Please provide a prompt.' });

    console.log(`🤖 User asked: "${prompt}" about paper: ${paperId}`);

    const paper = await paperModel.findById(paperId);
    if (!paper) {
      return res.status(404).json({ message: "Paper not found." });
    }

    const answerText = await answerPaperQuestion(paper, prompt);
    return res.json({ data: answerText });

  } catch (error) {
    console.error('❌ AI Chat Route failed:', error);
    return res.status(500).json({ message: "Failed to generate AI response.", error: error.message });
  }
});

// 🔀 SMART UPLOAD ROUTE
router.post('/upload', upload.single('dataset'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "Please upload a file using the form field 'dataset'." });

    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    console.log(`📥 Smart Router: Received a ${fileExtension} file`);

    if (fileExtension === '.csv') {
      const result = await processCsvStream(req.file.path);
      return res.status(201).json({ success: true, message: `Streaming ingestion completed! Processed ${result.count} rows.` });
    }

    if (fileExtension === '.pdf') {
      const pdfBuffer = fs.readFileSync(req.file.path);
      const cleanTitle = req.file.originalname.replace('.pdf', '');

      // Move uploaded file to uploads directory with permanent filename
      const permanentFilename = `${Date.now()}-${req.file.originalname.replace(/\s+/g, '_')}`;
      const permanentPath = path.join('uploads', permanentFilename);
      fs.copyFileSync(req.file.path, permanentPath);
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

      const serverBaseUrl = process.env.SERVER_BASE_URL || 'http://localhost:3001';
      const pdfUrl = `${serverBaseUrl}/uploads/${permanentFilename}`;

      const paper = await processPdfAndIngest(pdfBuffer, cleanTitle, pdfUrl);
      return res.status(201).json({ success: true, message: `Saved "${cleanTitle}" to Atlas!`, paper });
    }

    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    return res.status(400).json({ success: false, message: "Unsupported file format." });

  } catch (error) {
    console.error("❌ Smart Upload Route Failure:", error);
    return res.status(500).json({ success: false, message: "Ingestion failed", error: error.message });
  }
});

export default router;