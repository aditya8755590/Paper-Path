import mongoose from 'mongoose';

const chunkSchema = new mongoose.Schema({
    // Removed required: true
    chunkId: { type: String },
    text: { type: String, required: true },
    embedding: { type: [Number], required: true }
});

const paperSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    authors: { type: String, default: "Unknown Author" },
    abstract: { type: String },

    // Removed required: true
    pdfUrl: { type: String },

    category: { type: String, default: "General", trim: true },
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    difficultyLevel: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' },
    tags: [{ type: String }],
    content: { type: String },
    chunks: [chunkSchema],
    embedding: { type: [Number] }
}, { timestamps: true });

export default mongoose.model('Paper', paperSchema, 'paper');