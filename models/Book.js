import mongoose from 'mongoose';

export const GENRES = ['fiction', 'non-fiction', 'science', 'history', 'biography', 'fantasy', 'other'];

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'title is required'],
      trim: true,
      maxlength: [120, 'title must be at most 120 characters'],
    },
    author: {
      type: String,
      required: [true, 'author is required'],
      trim: true,
      maxlength: [80, 'author must be at most 80 characters'],
    },
    year: {
      type: Number,
      min: [0, 'year cannot be negative'],
      default: null,
    },
    genre: {
      type: String,
      enum: { values: GENRES, message: `genre must be one of: ${GENRES.join(', ')}` },
      default: 'other',
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

export const Book = mongoose.model('Book', bookSchema);