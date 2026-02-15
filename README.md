Byte-Sized Business Boost is a community-focused web app that helps people discover, support, and stay connected with small, local businesses. It combines curated business listings, user reviews, and favourites to make it easy to find great local spots and keep coming back.

## Why it matters (non-technical overview)

- **More visibility for local owners:** The app spotlights small businesses with clear categories, reviews, and featured deals so they are easier to discover.
- **Trust through community reviews:** Visitors can read honest, recent feedback to decide where to shop, eat, or book services.
- **Repeat engagement:** Favouriting makes it simple to return to businesses you love, helping owners build recurring customers.
- **Local economic impact:** When people choose local options, more dollars stay in the community, supporting jobs and neighborhood growth.

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
> Routes marked with **(auth)** require the `x-user-token` header.

- **Auth**
  - `POST /api/auth/google` - Log in with Google (expects `{ token }` in the body)

- **Users**
  - `POST /api/users/generate` - Create a guest session (returns the created user, including a token)
  - `POST /api/users/logout` **(auth)** - End the current session
  - `GET /api/users/me` **(auth)** - Get the current authenticated user profile
  - `GET /api/users/favourites` **(auth)** - Get the current user’s favourite business IDs
  - `GET /api/users/:id` **(auth)** - Get a specific user profile (email only returned when viewing your own profile)

- **Businesses**
  - `GET /api/businesses` - List businesses with computed review/favourite stats
    - Optional query: `ids=<comma-separated business IDs>` to fetch only specific businesses in the same order
  - `GET /api/businesses/:id` - Fetch one business with computed rating/review/favourite stats

- **Favourites**
  - `GET /api/favourites/:businessId` **(auth)** - Check whether the current user has favourited a business
  - `POST /api/favourites/:businessId` **(auth)** - Toggle favourite status for a business (guest users cannot favourite)

- **Reviews**
  - `POST /api/reviews/:businessId` **(auth)** - Create a review (registered users only; one review per user per business)
  - `GET /api/reviews/me` **(auth)** - List reviews written by the current user
  - `GET /api/reviews/user/:userId` **(auth)** - List reviews written by a specific user
  - `GET /api/reviews/:businessId` - List reviews for a business

- **Categories**
  - `GET /api/categories` - List supported business categories and icon mappings

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
npm run start:web
```

Then visit: `http://localhost:3000`

## Electron desktop app

This project also ships with an Electron wrapper so you can run and package the app as a desktop application.

### Run the Electron app locally

```
npm install
npm run seed
npm start
```

`npm run start` launches Electron (configured to boot from `desktop/main.js`).

### Build distributables

Use the following scripts to generate desktop build output:

```
# Unpacked directory build (useful for local smoke testing)
npm run build:dir

# Windows installer + portable package
npm run build:win
```

Build artifacts are written to the `release/` directory.

### Running tests

```
npm run test
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