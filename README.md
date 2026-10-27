# Task Management REST API

A RESTful API built with **Node.js, Express.js, and PostgreSQL** for managing users, projects, and tasks. It includes JWT authentication, task filtering, searching, pagination, sorting, overdue task tracking, and dashboard statistics.

## Features

- User registration and login
- Password hashing using bcrypt
- JWT-based authentication
- Project CRUD operations
- Task CRUD operations
- PostgreSQL relational database with foreign keys
- SQL JOINs to retrieve tasks with their project names
- Task filtering by status, priority, and project
- Search tasks by title
- Pagination and sorting
- Overdue task tracking
- Dashboard statistics
- Input validation and centralized error handling

## Technology Stack

- Node.js
- Express.js
- PostgreSQL
- `pg` — PostgreSQL client
- `bcrypt` — password hashing
- `jsonwebtoken` — JWT authentication
- `dotenv` — environment configuration
- Postman — API testing

## Database Schema

### Users
Stores user accounts, email addresses, password hashes, and creation timestamps.

### Projects
Stores projects owned by users. Each project references a user through `user_id`.

### Tasks
Stores tasks associated with projects, including title, description, status, priority, due date, and timestamps.

### Relationships

- One user can have many projects.
- One project can have many tasks.
- Deleting a user cascades to their projects.
- Deleting a project cascades to its tasks.

## Prerequisites

Install the following:

- Node.js and npm
- PostgreSQL
- Postman or another HTTP client

## Installation

1. Clone this repository:

   ```bash
   git clone YOUR_GITHUB_REPOSITORY_URL
   ```

2. Navigate to the project directory:

   ```bash
   cd "Task Management REST API"
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Create a PostgreSQL database named `task_management`.

5. Execute the SQL schema file to create the tables and indexes. The schema file will be provided in the repository.

6. Create a `.env` file in the project root using the configuration below.

7. Start the development server:

   ```bash
   npm run dev
   ```

The API runs at `http://localhost:3000` by default.

## Environment Variables

Create a local `.env` file using these settings and replace the placeholder values with your own credentials:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=task_management
DB_USER=postgres
DB_PASSWORD=your_postgresql_password
JWT_SECRET=replace_with_a_long_random_secret
```

Never commit `.env` or expose your database password or JWT secret. Use `.env.example` as a template.

## API Endpoints

### Authentication

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Register a user |
| POST | `/api/auth/login` | Log in and receive a JWT |

### Projects

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/projects` | Create a project |
| GET | `/api/projects` | List your projects |
| GET | `/api/projects/:id` | Get one project |
| PUT | `/api/projects/:id` | Update a project |
| DELETE | `/api/projects/:id` | Delete a project |

### Tasks

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/tasks` | Create a task |
| GET | `/api/tasks` | List and filter tasks |
| GET | `/api/tasks/:id` | Get one task |
| PUT | `/api/tasks/:id` | Update a task |
| DELETE | `/api/tasks/:id` | Delete a task |
| GET | `/api/tasks/overdue` | List overdue tasks |

### Dashboard

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/dashboard/stats` | Get task statistics |

Protected endpoints require this HTTP header:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

Register and log in first to obtain a token.

## Task Filtering, Search, Pagination, and Sorting

Examples:

```http
GET /api/tasks?status=pending
GET /api/tasks?priority=high
GET /api/tasks?search=assignment
GET /api/tasks?page=1&limit=5
GET /api/tasks?sortBy=due_date&order=asc
GET /api/tasks?status=pending&priority=high&page=1&limit=5
```

Supported task statuses:

- `pending`
- `in_progress`
- `completed`

Supported priorities:

- `low`
- `medium`
- `high`

Supported sorting fields are `created_at`, `due_date`, `priority`, and `title`. Sort order can be `asc` or `desc`.

## Error Handling

The API returns appropriate HTTP status codes, including:

- `200 OK` — request succeeded.
- `201 Created` — a record was created.
- `400 Bad Request` — invalid input.
- `401 Unauthorized` — authentication failed or a token is missing.
- `404 Not Found` — a resource was not found.
- `409 Conflict` — duplicate record, where handled.
- `500 Internal Server Error` — unexpected server error.

## Testing

Use the included Postman collection to test the API:

1. Register a user.
2. Log in to obtain a JWT.
3. Use the token as a Bearer Token for protected requests.
4. Test project and task CRUD operations, filtering, pagination, sorting, overdue tasks, and dashboard statistics.

Import `Task-Management-REST-API.postman_collection.json` into Postman to access the saved requests.

## License

For academic and educational use.
