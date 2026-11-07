import express from 'express';

const port = 3000;
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

app.listen(port, () => console.log(`Books API listening on http://localhost:${port}`));