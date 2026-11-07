import 'dotenv/config';
import dns from 'node:dns';
import express from 'express';
import mongoose from 'mongoose';

// Some Windows/router DNS servers refuse the SRV lookup that "mongodb+srv://" needs
// (error: querySrv ECONNREFUSED). Using public DNS servers fixes it.
dns.setServers(['8.8.8.8', '1.1.1.1']);
const dbUri = process.env.MONGODB_URI;
const port = Number(process.env.PORT) || 3000;
const app = express();

// ---------- Middleware ----------
function logger(req, res, next) {
  const time = new Date().toLocaleTimeString();
  console.log(`${time} ${req.method} ${req.path}`);
  next();
}

app.use(logger);
app.use(express.json());

// ---------- Routes ----------
app.get('/', (req, res) => {
  res.json({ message: 'Books API is running', books: '/api/books' });
});

// ---------- Errors ----------
// After all routes: nothing matched
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
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