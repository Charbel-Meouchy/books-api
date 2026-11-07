# Books API

A RESTful API for a personal book collection, built with **Node.js**, **Express** and **MongoDB** (through Mongoose). It supports full CRUD on one resource, `books`: list, search and filter, get one, create, replace, update and delete. Every request is validated and every error comes back as JSON with the right status code.

## Tech

- Node.js 20+ with ES modules (`"type": "module"`)
- Express 5
- MongoDB + Mongoose 9
- dotenv for environment variables
- Postman collection for testing (`postman/books-api.postman_collection.json`)

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up the database connection

The connection string is kept in a `.env` file, which is listed in `.gitignore` and never committed. Copy the example file:

```bash
# macOS / Linux / Git Bash
cp .env.example .env

# Windows (PowerShell or Command Prompt)
copy .env.example .env
```

Then open `.env` and set `MONGODB_URI` to your MongoDB connection string:

- **MongoDB Atlas (free cloud database):** create a free cluster, add a database user, allow your IP under *Network Access*, then click *Connect → Drivers* and copy the string. Add the database name `books-api` before the `?`:
  `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/books-api?retryWrites=true&w=majority`
- **MongoDB installed locally:** `mongodb://127.0.0.1:27017/books-api`

```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/books-api?retryWrites=true&w=majority
PORT=3000
```

### 3. (Optional) Add sample data

```bash
npm run seed
```

This **deletes all books** and inserts 5 sample ones.

### 4. Start the dev server

```bash
npm run dev
```

You should see:

```
connected to MongoDB
Books API listening on http://localhost:3000
```

If the server prints `querySrv ECONNREFUSED`, your network's DNS server is refusing the lookup that `mongodb+srv://` addresses need. `server.js` and `seed.js` already tell Node.js to use public DNS servers (`8.8.8.8` and `1.1.1.1`) to avoid this, so check that your network allows them.

`npm run dev` restarts the server whenever a file is saved. Use `npm start` to run it without watching.

| Script | What it does |
| ------ | ------------ |
| `npm run dev` | Starts the server and restarts it on every save |
| `npm start` | Starts the server |
| `npm run seed` | Replaces all books with 5 sample books |

## The Book resource

| Field | Type | Rules |
| ----- | ---- | ----- |
| `_id` | string | Set by MongoDB. Never sent by the client. |
| `title` | string | **Required.** 1–120 characters, trimmed. |
| `author` | string | **Required.** 1–80 characters, trimmed. |
| `year` | number or `null` | Optional. A whole number from 0 to the current year. Default `null`. |
| `genre` | string | Optional. One of `fiction`, `non-fiction`, `science`, `history`, `biography`, `fantasy`, `other`. Default `other`. |
| `read` | boolean | Optional. `true` or `false`. Default `false`. |
| `createdAt`, `updatedAt` | date | Set automatically by the database. |

Any other field in the request body (including `_id` or `createdAt`) is ignored.

## Routes

Base URL: `http://localhost:3000`

| Method | Path | What it does | Success | Errors |
| ------ | ---- | ------------ | ------- | ------ |
| GET | `/api/books` | List all books (with optional filters) | 200 | 400, 500 |
| GET | `/api/books/:id` | Get one book | 200 | 400, 404, 500 |
| POST | `/api/books` | Create a book | 201 | 400, 500 |
| PUT | `/api/books/:id` | Replace a whole book | 200 | 400, 404, 500 |
| PATCH | `/api/books/:id` | Update only the fields sent | 200 | 400, 404, 500 |
| DELETE | `/api/books/:id` | Delete a book | 204 | 400, 404, 500 |

The curl examples below work in macOS/Linux terminals and Git Bash. In Windows PowerShell, type `curl.exe` instead of `curl`.

---

### GET `/api/books`: list all books

Optional query parameters:

| Query | Example | Effect |
| ----- | ------- | ------ |
| `search` | `?search=tolkien` | Books whose title **or** author contains the text (not case-sensitive) |
| `read` | `?read=true` | Only read (`true`) or unread (`false`) books |
| `genre` | `?genre=fantasy` | Only books of that genre |
| `sort` | `?sort=title` | `newest` (default), `oldest`, `title` (A–Z), `year` (newest year first) |

```bash
curl "http://localhost:3000/api/books?search=hobbit&read=true"
```

**200 OK**

```json
[
  {
    "_id": "672cbe4f8a1d3f0c8e2a9b10",
    "title": "The Hobbit",
    "author": "J.R.R. Tolkien",
    "year": 1937,
    "genre": "fantasy",
    "read": true,
    "createdAt": "2026-11-07T13:27:33.284Z",
    "updatedAt": "2026-11-07T13:27:33.284Z",
    "__v": 0
  }
]
```

No match returns `200` with an empty array `[]`.

**400 Bad Request** (invalid filter, e.g. `?read=maybe` or `?sort=price`)

```json
{ "error": "read must be \"true\" or \"false\"" }
```

---

### GET `/api/books/:id`: get one book

```bash
curl http://localhost:3000/api/books/672cbe4f8a1d3f0c8e2a9b10
```

**200 OK**: the book object (same shape as above).

**400 Bad Request** (the id is not a valid MongoDB ObjectId, e.g. `/api/books/123`)

```json
{ "error": "Invalid id: it must be a 24-character MongoDB ObjectId" }
```

**404 Not Found** (valid id, but no book has it)

```json
{ "error": "Book not found" }
```

---

### POST `/api/books`: create a book

`title` and `author` are required.

```bash
curl -X POST http://localhost:3000/api/books \
  -H "Content-Type: application/json" \
  -d '{"title":"Dune","author":"Frank Herbert","year":1965,"genre":"fiction"}'
```

Request body:

```json
{
  "title": "Dune",
  "author": "Frank Herbert",
  "year": 1965,
  "genre": "fiction"
}
```

**201 Created**

```json
{
  "_id": "672cbe5d8a1d3f0c8e2a9b15",
  "title": "Dune",
  "author": "Frank Herbert",
  "year": 1965,
  "genre": "fiction",
  "read": false,
  "createdAt": "2026-11-07T13:27:57.724Z",
  "updatedAt": "2026-11-07T13:27:57.724Z",
  "__v": 0
}
```

**400 Bad Request** (invalid data: every problem is listed)

Request body: `{ "year": "abc", "genre": "poetry", "read": "yes" }`

```json
{
  "error": "Validation failed",
  "details": {
    "title": "title is required and must be a non-empty string",
    "author": "author is required and must be a non-empty string",
    "year": "year must be a whole number between 0 and 2026",
    "genre": "genre must be one of: fiction, non-fiction, science, history, biography, fantasy, other",
    "read": "read must be true or false"
  }
}
```

**400 Bad Request** (the body is not valid JSON, e.g. `{ "title": "Broken", `)

```json
{ "error": "Malformed JSON in request body" }
```

**400 Bad Request** (no body, or the body is not a JSON object)

```json
{ "error": "Request body must be a JSON object (set the header Content-Type: application/json)" }
```

---

### PUT `/api/books/:id`: replace a book

PUT replaces the **whole** book. `title` and `author` are required, and any optional field left out goes back to its default (`year: null`, `genre: "other"`, `read: false`).

```bash
curl -X PUT http://localhost:3000/api/books/672cbe5d8a1d3f0c8e2a9b15 \
  -H "Content-Type: application/json" \
  -d '{"title":"Dune Messiah","author":"Frank Herbert","year":1969,"genre":"fiction","read":true}'
```

**200 OK**

```json
{
  "_id": "672cbe5d8a1d3f0c8e2a9b15",
  "title": "Dune Messiah",
  "author": "Frank Herbert",
  "year": 1969,
  "genre": "fiction",
  "read": true,
  "createdAt": "2026-11-07T13:27:57.724Z",
  "updatedAt": "2026-11-07T13:28:10.102Z",
  "__v": 0
}
```

**400 Bad Request** (e.g. `{ "title": "Only a title" }`)

```json
{
  "error": "Validation failed",
  "details": { "author": "author is required and must be a non-empty string" }
}
```

**400** for an invalid id and **404** `{ "error": "Book not found" }` for a missing book, as in GET one.

---

### PATCH `/api/books/:id`: update some fields

PATCH changes **only** the fields you send and keeps the rest.

```bash
curl -X PATCH http://localhost:3000/api/books/672cbe5d8a1d3f0c8e2a9b15 \
  -H "Content-Type: application/json" \
  -d '{"read":false}'
```

**200 OK**: the updated book (only `read` and `updatedAt` changed).

```json
{
  "_id": "672cbe5d8a1d3f0c8e2a9b15",
  "title": "Dune Messiah",
  "author": "Frank Herbert",
  "year": 1969,
  "genre": "fiction",
  "read": false,
  "createdAt": "2026-11-07T13:27:57.724Z",
  "updatedAt": "2026-11-07T13:28:15.481Z",
  "__v": 0
}
```

**400 Bad Request** (empty body `{}`)

```json
{ "error": "Send at least one field to update: title, author, year, genre, read" }
```

**400 Bad Request** (invalid field, e.g. `{ "title": "" }`)

```json
{
  "error": "Validation failed",
  "details": { "title": "title is required and must be a non-empty string" }
}
```

**400** for an invalid id and **404** for a missing book, as in GET one.

---

### DELETE `/api/books/:id`: delete a book

```bash
curl -i -X DELETE http://localhost:3000/api/books/672cbe5d8a1d3f0c8e2a9b15
```

**204 No Content**: deleted. The response has no body.

Running it again on the same id returns **404 Not Found**:

```json
{ "error": "Book not found" }
```

---

### Errors on any route

| Situation | Status | Body |
| --------- | ------ | ---- |
| Unknown route, e.g. `GET /api/authors` | 404 | `{ "error": "Route not found: GET /api/authors" }` |
| Unexpected server or database problem | 500 | `{ "error": "Something went wrong on the server. Please try again." }` |

Errors are always JSON with an `error` message. The server catches every error, so malformed input or a missing record never crashes it.

## Testing with Postman or Thunder Client

The collection `postman/books-api.postman_collection.json` has a request for every route, including the error cases (17 requests). Each request has automatic checks on the status code and the response body (31 checks).

### Option A: Postman or Thunder Client

1. Start the server with `npm run dev`.
2. In **Postman**: *Import* → choose the collection file. In **Thunder Client** (VS Code): *Collections* → menu → *Import* → choose the same file.
3. Run the whole collection **in order** (Postman: *Run collection*). The *Create a book* request saves the new book's id in the `bookId` variable, and the requests after it use that id.

### Option B: from the terminal (no account needed)

Start the server with `npm start` (not `npm run dev`: dev mode restarts the server when a file changes, which interrupts a test run). Then, in a second terminal:

```bash
npm run seed
npx -y newman run postman/books-api.postman_collection.json
```

[Newman](https://www.npmjs.com/package/newman) is Postman's command-line runner. It runs every request and prints each check with a summary table.

### Test evidence

`postman/test-results.txt` is the saved output of a full run against this API with a MongoDB Atlas database: **17 requests, 31 checks, 0 failures**.

## Project structure

```
books-api/
├── server.js                  # Express app: middleware, routes, error handling, DB connection
├── models/
│   └── Book.js                # Mongoose schema and model
├── middleware/
│   └── validation.js          # validateId, validateBook (POST/PUT), validateBookUpdate (PATCH)
├── seed.js                    # npm run seed: sample data
├── postman/
│   ├── books-api.postman_collection.json   # every route, with automatic checks
│   └── test-results.txt                    # output of a full test run
├── .env.example               # copy to .env and fill in
├── .gitignore                 # node_modules and .env
└── package.json
```

## How errors are handled

- **Invalid ids** are rejected with `400` by the `validateId` middleware before the database is queried. Valid ids that match nothing return `404`.
- **Invalid bodies** are rejected with `400` by the validation middleware, which lists every invalid field. The Mongoose schema repeats the same rules, so the database never stores bad data.
- **Malformed JSON** is caught by the error-handling middleware at the end of `server.js` and returned as `400`.
- **Database or server failures** are caught in each route's `try` / `catch` and returned as `500` with a JSON message, and the error is logged in the terminal.
- **Unknown routes** fall through to the catch-all `404` handler.
- The server **connects to MongoDB first, then starts listening**. If `MONGODB_URI` is missing or the connection fails, it prints a clear message and stops instead of running without a database.
