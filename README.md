# Byte-Sized Business Boost

Byte-Sized Business Boost is a community-focused web app that helps people discover, support, and stay connected with small, local businesses. It combines curated business listings, user reviews, and favourites to make it easy to find great local spots and keep coming back.

## Why it matters (non-technical overview)

- **More visibility for local owners:** The app spotlights small businesses with clear categories, reviews, and featured deals so they are easier to discover.
- **Trust through community reviews:** Visitors can read honest, recent feedback to decide where to shop, eat, or book services.
- **Repeat engagement:** Favouriting makes it simple to return to businesses you love, helping owners build recurring customers.
- **Local economic impact:** When people choose local options, more dollars stay in the community, supporting jobs and neighborhood growth.

## Features

- Google Sign-In for returning users plus guest session support
- Browse local businesses with categories, ratings, deals, and favourite counts
- Favourite businesses and manage your favourites list (registered users)
- Create and read one review per user, per business
- Dedicated profile pages for your account and other users
- Branded 404 page for missing routes and JSON 404 responses for unknown API routes
- Responsive UI with polished interactions

## Design inspiration and UI toolkit

- **Main page layout inspiration:** Modrinth
- **Business page inspiration:** Yelp
- **UI toolkit usage:** Bootstrap is used for icons, accordions, dropdown menus, and other interface elements

## Tech stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js, Express, EJS templates
- **Database:** MongoDB with Mongoose
- **Authentication:** Google OAuth (ID token verification) + UUID guest sessions
- **Desktop packaging:** Electron + electron-builder
- **Testing:** Mocha, Chai, Supertest

## Architecture overview

- **Express API + EJS pages:** EJS renders the login, profile, business, and 404 pages; the rest of the experience uses JSON APIs.
- **Data models:** Businesses, users, and reviews are stored in MongoDB. Reviews are limited to one per user per business.
- **Authentication:** Guests receive a UUID token; Google users authenticate via ID token verification and receive a session token stored in MongoDB.
- **Route behavior:** Unknown API routes return JSON `{ error: "Route not found" }`, while unknown browser routes render the custom 404 page.

## API overview

All API routes are prefixed with `/api`.
Routes marked with **(auth)** require the `x-user-token` header.

- **Auth**
  - `POST /api/auth/google` - Log in with Google (expects `{ token }`)

- **Users**
  - `POST /api/users/generate` - Create a guest session
  - `POST /api/users/logout` **(auth)** - End the current session
  - `GET /api/users/me` **(auth)** - Get the current authenticated user profile
  - `GET /api/users/favourites` **(auth)** - Get the current user’s favourite business IDs
  - `GET /api/users/:id` **(auth)** - Get a specific user profile

- **Businesses**
  - `GET /api/businesses` - List businesses with computed review/favourite stats
  - `GET /api/businesses?ids=<comma-separated IDs>` - Fetch only selected businesses in the same order
  - `GET /api/businesses/:id` - Fetch one business with computed rating/review/favourite stats

- **Favourites**
  - `GET /api/favourites/:businessId` **(auth)** - Check favourite status
  - `POST /api/favourites/:businessId` **(auth)** - Toggle favourite status (guest users cannot favourite)

- **Reviews**
  - `POST /api/reviews/:businessId` **(auth)** - Create a review (registered users only)
  - `GET /api/reviews/me` **(auth)** - List reviews written by the current user
  - `GET /api/reviews/user/:userId` **(auth)** - List reviews written by a specific user
  - `GET /api/reviews/:businessId` - List reviews for a business

- **Categories**
  - `GET /api/categories` - List supported business categories and icon mappings

## Creator and chapter

- **Name:** Mohid Faisal Mushtaq
- **School:** Lester B. Pearson CI
- **FBLC Chapter:** Lester B Pearson C. I

## Copyrighted material

- Seeded business image asset ownership/usage details are documented in `COPYRIGHTED MATERIAL.md`.

## Local development

### Prerequisites

- Node.js 18+
- MongoDB (local instance or hosted)
- Google OAuth Client ID

### Environment variables

Create a `.env` file in the project root:

```env
PORT=3000
MONGODB_URI=your_mongodb_uri
GOOGLE_CLIENT_ID=your_google_client_id
```

### Install and run web app

```bash
npm install
npm run seed
npm run start:web
```

Then visit `http://localhost:3000`.

## Electron desktop app

### Run Electron locally

```bash
npm install
npm run seed
npm start
```

`npm start` launches Electron (configured to boot from `desktop/main.js`).

### Build distributables

```bash
npm run build:dir   # Unpacked build for local smoke testing
npm run build:win   # Windows installer + portable package
```

Build artifacts are written to `release/`.

## Testing

```bash
npm run test
```

## Project structure

```text
.
├── desktop/             # Electron entry and desktop wrapper code
├── middleware/          # Auth middleware
├── models/              # Mongoose schemas
├── public/              # Frontend assets
├── routes/              # API routes
├── test/                # Mocha/Supertest test suite
├── views/               # EJS templates
├── server.js            # Express app entry
├── database.js          # MongoDB connection helpers
└── seed.js              # Seed script
```