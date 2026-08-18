# Cyber Phishing Simulator Frontend

This Angular frontend powers the Cyber Phishing Simulator experience for learners and trainers. It provides the user interface for authentication, learner dashboards, scenario delivery, scenario management, and admin workflows.

## What this project contains

- Authentication flows for sign-in, sign-out, and profile settings
- Learner-facing views such as dashboards, results, and module progression
- Trainer/admin views for managing learners, scenarios, and administration tasks
- Shared UI components for headers, cards, navigation, and reusable list tables
- NgRx state management for auth and scenario related features

## Project structure

- `src/app/auth` – authentication UI and state
- `src/app/learner` – learner dashboards, module pages, and learner-specific components
- `src/app/scenario` – scenario management, editing, and learner scenario flows
- `src/app/admin` – administrator dashboard and related views
- `src/app/shared` – shared components, models, and constants
- `src/environments` – environment configuration for development and production

## Getting started

### Prerequisites

- Node.js and npm
- Angular CLI (or use the local package from this project)

### Install dependencies

```bash
npm install
```

### Run the development server

```bash
npm start
```

Then open http://localhost:4200/ in your browser.

### Build for production

```bash
npm run build
```

### Run unit tests

```bash
npm test -- --watch=false --browsers=ChromeHeadless
```

## Notes

This app is currently structured around a role-based experience:

- Learners can view dashboards, scenarios, and results
- Trainers/admins can manage learners and scenario libraries

If you are working on a new feature, it is usually best to place shared UI under `src/app/shared`, feature-specific screens under the relevant domain folder, and state updates under the corresponding NgRx slice.
