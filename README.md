## Overview

(TODO Description)

~Time Spent: TODO

Design is documented [here](docs/design.md).
LLM Usage is documented [here](docs/llm_usage.md).

## Local Development

### Prerequisites

TODO - dependencies, versions and how to install them on different platforms

TODO - project setup; environment variables, cloning the repo, etc.

### Running The Application

Copy the example environment file and start all services:

```bash
cp .env.example .env
docker compose up -d
```

Migrations are run automatically when the backend container starts.

If you only want the database running and everything else locally (hot reloading):

```bash
docker compose up -d db
pnpm dev
```

### Seeding The Data

With the application running, seed the database from the project root:

```bash
docker compose exec backend pnpm run seed:prod
```

### Running Tests

Run the backend unit tests from the project root:

```bash
pnpm --filter backend test
```

Run with coverage:

```bash
pnpm --filter backend test:cov
```

### Examples

TODO - GraphQL (and other examples)

## Notes

### [Tradeoffs](docs/design.md#tradeoffs)

### [Assumptions](docs/design.md#assumptions)

### [Concerns](docs/design.md#concerns)

### [Possible Improvements](docs/design.md#possible-improvements)

## Deployment

TODO - how it could be deployed and secured in an Azure setting
