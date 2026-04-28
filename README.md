## Overview

PatientReg is a secure patient registration system for medical practices. It covers the workflow of practice staff initiating a registration request, a patient completing and consenting to their registration document via a jwt secured link, and staff reviewing, approving, or rejecting the submission.

Design is documented [here](docs/design.md).
LLM Usage is documented [here](docs/llm_usage.md).
Tauri vs Electron comparison [here](docs/arhitecture-note.md)
Azure Deployment and Security [here](docs/azure.md)

Approximate Time Spent: 40 hours

---

## Prerequisites

The following tools must be installed before running the application locally.

| Tool | Version | Install |
|------|---------|---------|
| Node.js | ≥ 22 | [nodejs.org](https://nodejs.org) |
| pnpm | ≥ 10 | `npm install -g pnpm` |
| Docker & Docker Compose | ≥ 28 | [docs.docker.com](https://docs.docker.com/get-docker/) |

---

## Environment Variables

Copy the example file before starting anything:

```bash
cp .env.example .env
```

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_USERNAME` | PostgreSQL username | `postgres` |
| `DB_PASSWORD` | PostgreSQL password | `postgres` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_HOST` | Database hostname (set automatically in Docker) | `localhost` |
| `BACKEND_PORT` | Port the NestJS API listens on | `3000` |
| `FRONTEND_PORT` | Port the React Router frontend listens on | `5173` |
| `SECRET` | Secret used to sign JWT registration-link tokens | `supersecretsecretkey` |
| `PATIENT_APP_URL` | Base URL of the patient-facing app — embedded in registration links sent to patients | `http://localhost:5173` |

> **Production note:** Change `SECRET` to a long, random string. Never commit a real `.env` file.

---

## Running Locally

### Full stack via Docker (recommended)

Starts the database, backend, and frontend together. Migrations run automatically when the backend container starts.

```bash
cp .env.example .env
docker compose up -d
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend (GraphQL) | http://localhost:3000/graphql |

### Hybrid — database in Docker, apps with hot-reload

Useful when actively developing. Starts only Postgres in Docker and runs both apps locally with file-watching.

```bash
# Terminal 1 — start the database
docker compose up -d db

# Terminal 2 — start backend + frontend with hot-reload (from repo root)
pnpm install
pnpm dev
```

The `pnpm dev` script runs the NestJS backend (`start:dev`) and the React Router frontend (`dev`) concurrently.

---

## Seeding the Database

The seed script creates two practices, two patient identities, and consent templates for each practice.

**With the full Docker stack running:**

```bash
docker compose exec backend pnpm run seed:prod
```

**With the apps running locally (hybrid mode):**

```bash
pnpm --filter backend run seed
```

Seeded data:

| Entity | Values |
|--------|--------|
| Practices | Winelands Family Practice, Intercare Panorama |
| Patient identities (RSA IDs) | `0501018431087` (Johan de Wet), `9001015009086` (Emily Jacobs) |

> The practice IDs printed after seeding are required as the Bearer token when calling practice-scoped GraphQL operations (see below).

---

## Running Tests

Backend unit tests (from the repo root):

```bash
pnpm --filter backend test
```

With coverage:

```bash
pnpm --filter backend test:cov
```

Watch mode during development:

```bash
pnpm --filter backend test:watch
```

---

## GraphQL API

The GraphQL endpoint is available at `http://localhost:3000/graphql` (Apollo Sandbox is served at that URL in development).

### Authentication

Two token types are used as `Authorization: Bearer <token>` headers:

| Context | Token |
|---------|-------|
| Practice staff operations | The practice's UUID (obtained after seeding or from the `practices` query) |
| Patient operations | The short-lived JWT session token returned by `verifyRegistration` |

### Example Operations

#### List all practices (no auth required)

```graphql
query Practices {
  practices {
    id
    name
  }
}
```

#### Initiate a registration request (practice auth)

```graphql
mutation InitiateRegistration($input: InitiateRegistrationInput!) {
  initiateRegistration(input: $input) {
    registrationRequestId
    registrationRequestStatus
    practiceName
  }
}
```

Variables:

```json
{
  "input": {
    "practiceId": "<practice-uuid>",
    "initiatedByStaffId": "<staff-uuid>",
    "rsaId": "0501018431087"
  }
}
```

#### Verify patient identity from a registration link (no auth required)

```graphql
mutation VerifyRegistration($input: VerifyRegistrationInput!) {
  verifyRegistration(input: $input) {
    success
    sessionToken
    expiresAt
    errorCode
    maxAttempts
    attemptsAfterFailure
  }
}
```

Variables:

```json
{
  "input": {
    "token": "<registration-link-jwt>",
    "rsaId": "0501018431087"
  }
}
```

The returned `sessionToken` is used as the Bearer token for all subsequent patient-scoped operations.

#### Submit a registration document (patient auth)

```graphql
mutation SubmitRegistrationDocument($input: SubmitRegistrationDocumentInput!) {
  submitRegistrationDocument(input: $input) {
    registrationRequestId
    registrationRequestStatus
    practiceName
  }
}
```

Variables:

```json
{
  "input": {
    "registrationRequestId": "<request-uuid>",
    "personalInformation": {
      "firstname": "Johan",
      "lastname": "de Wet",
      "dateOfBirth": "2005-01-01",
      "gender": "MALE"
    },
    "contactDetails": {
      "phone": "+27825550199",
      "email": "johan@example.com",
      "residentialAddress": "1 Main Road, Cape Town"
    },
    "medicalAidDetails": {
      "scheme": "Discovery Health",
      "memberNumber": "12345678"
    },
    "medicalHistory": {
      "allergies": "Penicillin",
      "chronicConditions": "None"
    }
  }
}
```

#### Give consent (patient auth)

```graphql
mutation GiveConsent($registrationRequestId: String!) {
  giveConsent(registrationRequestId: $registrationRequestId) {
    givenAt
  }
}
```

#### View all registration requests for a practice (practice auth)

```graphql
query PracticeRegistrationRequests {
  practiceRegistrationRequests {
    registrationRequestId
    registrationRequestStatus
    practiceName
    rejectionReason
    patient {
      firstname
      lastname
      email
      phone
    }
    document {
      submittedAt
    }
  }
}
```

#### Approve a registration (practice auth)

```graphql
mutation ApproveRegistration($input: ApproveRegistrationInput!) {
  approveRegistration(input: $input) {
    registrationRequestId
    registrationRequestStatus
    practiceName
  }
}
```

Variables:

```json
{
  "input": {
    "registrationRequestId": "<request-uuid>",
    "approvedByStaffId": "<staff-uuid>"
  }
}
```

#### Reject a registration (practice auth)

```graphql
mutation RejectRegistration($input: RejectRegistrationInput!) {
  rejectRegistration(input: $input) {
    registrationRequestId
    registrationRequestStatus
    practiceName
    rejectionReason
  }
}
```

Variables:

```json
{
  "input": {
    "registrationRequestId": "<request-uuid>",
    "rejectedByStaffId": "<staff-uuid>",
    "reason": "ID document does not match provided details."
  }
}
```

---

## Notes

### [Tradeoffs](docs/design.md#tradeoffs)

### [Assumptions](docs/design.md#assumptions)

### [Concerns](docs/design.md#concerns)

### [Possible Improvements](docs/design.md#possible-improvements)

## Deployment

TODO - how it could be deployed and secured in an Azure setting
