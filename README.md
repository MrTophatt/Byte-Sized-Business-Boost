yte-Sized Business Boost is a community-focused web app that helps people discover, support, and stay connected with small, local businesses. It combines curated business listings, user reviews, and favourites to make it easy to find great local spots and keep coming back.

## Why it matters (non-technical overview)

- **More visibility for local owners:** The app spotlights small businesses with clear categories, reviews, and featured deals so they are easier to discover.
- **Trust through community reviews:** Visitors can read honest, recent feedback to decide where to shop, eat, or book services.
- **Repeat engagement:** Favouriting makes it simple to return to businesses you love, helping owners build recurring customers.
- **Local economic impact:** When people choose local options, more dollars stay in the community—supporting jobs and neighborhood growth.

## How this website could help small businesses

- **Discovery & reach:** A dedicated directory helps local businesses show up when people search by category or browse recommendations.
- **Reputation building:** Ratings and reviews allow owners to build credibility and highlight great customer experiences.
- **Customer retention:** Favourites and saved profiles encourage repeat visits and ongoing engagement.
- **Insights for improvement:** Review trends and popular listings can reveal what customers value most (e.g., friendly service, best deals).

## Features

- Google Sign-In for returning users plus guest session support
- Browse local businesses with categories, ratings, and deals
- Favourite businesses and manage your favourites list
- Create and read reviews per business
- Responsive UI with polished interactions

## Tech stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js, Express, EJS templates
- **Database:** MongoDB with Mongoose
- **Auth:** Google OAuth for signed-in users + UUID guest sessions

## Architecture overview

- **Express API + EJS pages**: EJS renders the login, profile, and business pages; the rest of the experience uses JSON APIs.
- **Data models**: Businesses, users, and reviews are stored in MongoDB. Reviews are limited to one per user per business.
- **Authentication**: Guests receive a UUID token; Google users authenticate via ID token verification and receive a session token stored in MongoDB.

## API overview

All API routes are prefixed with `/api`.

- **Auth**
  - `POST /api/auth/google` — Log in with Google (expects `{ token }` in the body)
- **Users**
  - `POST /api/users/generate` — Create a guest session (returns a user token)
  - `POST /api/users/logout` — End a session (header: `x-user-token`)
  - `GET /api/users/me` — Get current user (header: `x-user-token`)
  - `GET /api/users/favourites` — Get current user favourites (header: `x-user-token`)
- **Businesses**
  - `GET /api/businesses` — List businesses with review/favourite stats
  - `GET /api/businesses/:id` — Fetch a single business + stats
- **Favourites**
  - `GET /api/favourites/:businessId` — Check if favourited (header: `x-user-token`)
  - `POST /api/favourites/:businessId` — Toggle favourite (header: `x-user-token`)
- **Reviews**
  - `POST /api/reviews/:businessId` — Create a review (header: `x-user-token`)
  - `GET /api/reviews/:businessId` — List reviews for a business
  - `GET /api/reviews/me` — List reviews from the current user (header: `x-user-token`)
- **Categories**
  - `GET /api/categories` — List supported business categories

## Copyrighted material

- Seeded business image asset ownership/usage details are documented in `COPYRIGHTED_MATERIAL.md`.

## Local development

### Prerequisites

- **Node.js** (recommended: 18+)
- **MongoDB** (local instance or hosted)
- **Google OAuth Client ID** (for Google Sign-In)

### Environment variables

Create a `.env` file in the project root with:

```
PORT=3000
MONGODB_URI=your_mongodb_uri
GOOGLE_CLIENT_ID=your_google_client_id
```

### Install and run

```
npm install
npm run seed
npm start
```

Then visit: `http://localhost:3000`

### Running tests

```
npm test
```

## Project structure

```
.
├── middleware/          # Auth middleware
├── models/              # Mongoose schemas
├── public/              # Frontend assets
├── routes/              # API routes
├── views/               # EJS templates
├── server.js            # Express app entry
├── database.js          # MongoDB connection helpers
└── seed.js              # Seed script
```

## Roadmap ideas

- Deal/offer scheduling and expiration
- Business timetable to show opening and closing times