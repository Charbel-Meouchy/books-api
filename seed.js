// Fills the database with sample books: npm run seed
// Warning: it deletes every existing book first.
import 'dotenv/config';
import dns from 'node:dns';
import mongoose from 'mongoose';
import { Book } from './models/Book.js';

// Same DNS fix as server.js (for "mongodb+srv://" connection strings on some networks).
dns.setServers(['8.8.8.8', '1.1.1.1']);

const sampleBooks = [
  { title: 'The Hobbit', author: 'J.R.R. Tolkien', year: 1937, genre: 'fantasy', read: true },
  { title: 'Sapiens', author: 'Yuval Noah Harari', year: 2011, genre: 'history', read: false },
  { title: 'A Brief History of Time', author: 'Stephen Hawking', year: 1988, genre: 'science', read: true },
  { title: 'The Prophet', author: 'Kahlil Gibran', year: 1923, genre: 'fiction', read: false },
  { title: 'Steve Jobs', author: 'Walter Isaacson', year: 2011, genre: 'biography', read: false },
];

if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI is missing. Copy .env.example to .env and add your connection string.');
  process.exit(1);
}

try {
  await mongoose.connect(process.env.MONGODB_URI);
  await Book.deleteMany({});
  const books = await Book.insertMany(sampleBooks);
  console.log(`Seeded ${books.length} books`);
} catch (err) {
  console.error('Seeding failed:', err.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}