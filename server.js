import 'dotenv/config';
import dns from 'node:dns';
import express from 'express';
import mongoose from 'mongoose';
import { Book } from './models/Book.js';
import { validateId, validateBook, validateBookUpdate } from './middleware/validation.js';

// Some Windows/router DNS servers refuse the SRV lookup that "mongodb+srv://" needs
// (error: querySrv ECONNREFUSED). Using public DNS servers fixes it.
dns.setServers(['8.8.8.8', '1.1.1.1']);

const dbUri = process.env.MONGODB_URI;
const port = Number(process.env.PORT) || 3000;
const app = express();

const SORT_OPTIONS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  title: { title: 1 },
  year: { year: -1 },
};

// ---------- Middleware ----------
function logger(req, res, next) {
  const time = new Date().toLocaleTimeString();
  console.log(`${time} ${req.method} ${req.path}`);
  next();
}

app.use(logger);
app.use(express.json());

// ---------- Helpers ----------
// Only these fields come from the client. The database sets _id, createdAt and updatedAt.
function pickBookFields(body) {
  const { title, author, year, genre, read } = body;
  return { title, author, year, genre, read };
}

// Makes user text safe to use inside a search pattern (so "C++" searches for "C++").
function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function sendServerError(res, err) {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server. Please try again.' });
}

// ---------- Routes ----------
app.get('/', (req, res) => {
  res.json({ message: 'Books API is running', books: '/api/books' });
});

// List all books, with optional ?search=, ?read=, ?genre= and ?sort=
app.get('/api/books', async (req, res) => {
  const { search, read, genre, sort = 'newest' } = req.query;
  const filter = {};

  if (search) {
    const pattern = { $regex: escapeRegex(String(search)), $options: 'i' };
    filter.$or = [{ title: pattern }, { author: pattern }];
  }

  if (read !== undefined) {
    if (read !== 'true' && read !== 'false') {
      return res.status(400).json({ error: 'read must be "true" or "false"' });
    }
    filter.read = read === 'true';
  }

  if (genre) {
    filter.genre = String(genre);
  }

  const sortBy = SORT_OPTIONS[sort];
  if (!sortBy) {
    return res.status(400).json({ error: `sort must be one of: ${Object.keys(SORT_OPTIONS).join(', ')}` });
  }

  try {
    const books = await Book.find(filter).sort(sortBy);
    res.json(books);
  } catch (err) {
    sendServerError(res, err);
  }
});

// Get one book
app.get('/api/books/:id', validateId, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    res.json(book);
  } catch (err) {
    sendServerError(res, err);
  }
});

// Create a book
app.post('/api/books', validateBook, async (req, res) => {
  try {
    const book = await Book.create(pickBookFields(req.body));
    res.status(201).json(book);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    sendServerError(res, err);
  }
});

// Replace a book: every field is set, and fields left out go back to their defaults
app.put('/api/books/:id', validateId, validateBook, async (req, res) => {
  const { title, author, year = null, genre = 'other', read = false } = req.body;

  try {
    const book = await Book.findByIdAndUpdate(
      req.params.id,
      { title, author, year, genre, read },
      { returnDocument: 'after', runValidators: true },
    );
    if (!book) return res.status(404).json({ error: 'Book not found' });
    res.json(book);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    sendServerError(res, err);
  }
});

// Update only the fields that are sent
app.patch('/api/books/:id', validateId, validateBookUpdate, async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(req.params.id, pickBookFields(req.body), {
      returnDocument: 'after',
      runValidators: true,
    });
    if (!book) return res.status(404).json({ error: 'Book not found' });
    res.json(book);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    sendServerError(res, err);
  }
});

// Delete a book
app.delete('/api/books/:id', validateId, async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    res.sendStatus(204);
  } catch (err) {
    sendServerError(res, err);
  }
});

// ---------- Errors ----------
// After all routes: nothing matched
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});


// Error handler (Express knows it is one because it has 4 parameters).
// Catches broken JSON bodies and any error a route did not handle, so the server never crashes.
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Malformed JSON in request body' });
  }
  sendServerError(res, err);
});

// ---------- Start: connect first, then listen ----------
if (!dbUri) {
  console.error('MONGODB_URI is missing. Copy .env.example to .env and add your connection string.');
  process.exit(1);
}

try {
  await mongoose.connect(dbUri);
  console.log('connected to MongoDB');
  app.listen(port, () => console.log(`Books API listening on http://localhost:${port}`));
} catch (err) {
  console.error('DB connection failed:', err.message);
  process.exit(1);
}