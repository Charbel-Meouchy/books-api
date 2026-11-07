import mongoose from 'mongoose';
import { GENRES } from '../models/Book.js';

const BOOK_FIELDS = ['title', 'author', 'year', 'genre', 'read'];
const CURRENT_YEAR = new Date().getFullYear();

// 400 if :id is not a valid MongoDB ObjectId (stops it before it reaches the database).
export function validateId(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid id: it must be a 24-character MongoDB ObjectId' });
  }
  next();
}

// Checks each field and collects every problem, so the client can fix them all at once.
function findErrors(body, isPartial) {
  const errors = {};

  if (!isPartial || body.title !== undefined) {
    if (typeof body.title !== 'string' || !body.title.trim()) {
      errors.title = 'title is required and must be a non-empty string';
    } else if (body.title.trim().length > 120) {
      errors.title = 'title must be at most 120 characters';
    }
  }

  if (!isPartial || body.author !== undefined) {
    if (typeof body.author !== 'string' || !body.author.trim()) {
      errors.author = 'author is required and must be a non-empty string';
    } else if (body.author.trim().length > 80) {
      errors.author = 'author must be at most 80 characters';
    }
  }

  if (body.year !== undefined && body.year !== null) {
    if (!Number.isInteger(body.year) || body.year < 0 || body.year > CURRENT_YEAR) {
      errors.year = `year must be a whole number between 0 and ${CURRENT_YEAR}`;
    }
  }

  if (body.genre !== undefined && !GENRES.includes(body.genre)) {
    errors.genre = `genre must be one of: ${GENRES.join(', ')}`;
  }

  if (body.read !== undefined && typeof body.read !== 'boolean') {
    errors.read = 'read must be true or false';
  }

  return errors;
}

function makeBookValidator(isPartial) {
  return function validate(req, res, next) {
    const body = req.body;

    if (body === undefined || body === null || typeof body !== 'object' || Array.isArray(body)) {
      return res.status(400).json({
        error: 'Request body must be a JSON object (set the header Content-Type: application/json)',
      });
    }

    if (isPartial && !BOOK_FIELDS.some((field) => body[field] !== undefined)) {
      return res.status(400).json({ error: `Send at least one field to update: ${BOOK_FIELDS.join(', ')}` });
    }

    const errors = findErrors(body, isPartial);
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    next();
  };
}

// POST and PUT need a complete book. PATCH accepts any subset of the fields.
export const validateBook = makeBookValidator(false);
export const validateBookUpdate = makeBookValidator(true);