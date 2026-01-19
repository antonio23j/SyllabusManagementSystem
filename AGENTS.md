# Repository Guidelines

## Project Structure & Module Organization
- `app/` holds the FastAPI backend (routes, models, utils, database config, app entrypoint).
- `alembic/` contains database migrations.
- `frontend/` hosts the React app (`frontend/src/` for components/pages/hooks/services).
- Root scripts like `run.py`, `create_admin.py`, and `add_admin.py` provide local utilities.
- `syllabus.db` is the local SQLite database used in development.

## Build, Test, and Development Commands

### Backend Commands
**Development Server:**
- `python run.py` runs the FastAPI app in development mode.
- `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000` runs the API with auto-reload.
- `alembic upgrade head` applies all pending database migrations.
- `alembic revision --autogenerate -m "message"` creates a new migration with auto-detected changes.

**Linting & Formatting:**
- `black .` formats Python code (4-space indentation, 88 char line length).
- `isort .` sorts Python imports (absolute imports preferred).
- `flake8 .` checks Python code style and errors.
- `mypy app/` type-checks Python code.

**Testing:**
- `pytest` runs all Python tests.
- `pytest tests/test_file.py` runs tests for a specific file.
- `pytest tests/test_file.py::TestClass::test_method` runs a single test method.
- `pytest --cov=app` runs tests with coverage report.
- `pytest --cov=app --cov-report=html` generates HTML coverage report.

### Frontend Commands
**Development Server:**
- `cd frontend && npm start` starts the React dev server on port 3000.
- `cd frontend && npm run build` creates a production build.
- `cd frontend && npm run build -- --stats` creates build with bundle analyzer.

**Testing:**
- `cd frontend && npm test` runs Jest tests in watch mode.
- `cd frontend && npm test -- --watchAll=false` runs tests once and exits.
- `cd frontend && npm test -- --testNamePattern="test name"` runs specific test by name.
- `cd frontend && npm test -- --coverage` runs tests with coverage report.
- `cd frontend && npm test -- --testPathPattern=Component.test.js` runs tests for specific file.

**Linting:**
- `cd frontend && npm run lint` runs ESLint (via react-scripts).
- `cd frontend && npx eslint src/` runs ESLint directly on source files.

## Code Style Guidelines

### Python Backend
**Imports:**
- Use absolute imports from `app` package (e.g., `from app.database import SessionLocal`).
- Group imports: standard library, third-party, local modules.
- Use `isort` to maintain import order.

**Naming Conventions:**
- Functions/variables: `snake_case` (e.g., `get_user_by_id`, `user_data`).
- Classes: `PascalCase` (e.g., `UserService`, `DatabaseManager`).
- Constants: `UPPER_CASE` (e.g., `DEFAULT_TIMEOUT = 30`).
- Database models: `PascalCase` class names, `snake_case` table names.

**Code Structure:**
- 4-space indentation (configured in `black`).
- Max line length: 88 characters (black default).
- Use type hints for function parameters and return values.
- Use Pydantic models for API request/response validation.
- Use SQLAlchemy ORM with proper relationships and constraints.

**Error Handling:**
- Use FastAPI's `HTTPException` for API errors with appropriate status codes.
- Use try/except blocks for database operations and external API calls.
- Log errors with appropriate levels (DEBUG, INFO, WARNING, ERROR).
- Return consistent error response format.

**Database Patterns:**
- Use dependency injection for database sessions (`Depends(get_db)`).
- Use SQLAlchemy relationships for data loading.
- Implement proper foreign key constraints.
- Use transactions for multi-step operations.

### React Frontend
**Component Structure:**
- Use functional components with hooks (no class components).
- Export default components, named exports for utilities.
- Use arrow functions for component definitions.
- Keep components focused on single responsibility.

**Hooks Usage:**
- `useState` for local component state.
- `useEffect` for side effects (API calls, subscriptions).
- `useContext` for theme/global state.
- `useMemo`/`useCallback` for performance optimization.
- Custom hooks for reusable logic.

**Styling:**
- Use Material-UI (MUI) components and theme system.
- Leverage theme context for dark/light mode support.
- Use `sx` prop for component-specific styling.
- Create reusable style objects/constants for consistency.

**API Integration:**
- Use axios instance with interceptors for authentication.
- Handle loading states and errors consistently.
- Use async/await for API calls.
- Implement proper error boundaries.

**State Management:**
- Local component state for UI-specific data.
- Context API for theme and user authentication.
- Props drilling for component communication.
- Consider custom hooks for complex state logic.

**File Organization:**
- Components: `frontend/src/components/` (reusable UI components).
- Pages: `frontend/src/pages/` (route-level components).
- Services: `frontend/src/services/` (API calls, utilities).
- Theme: `frontend/src/theme.js` (MUI theme configuration).

## Testing Guidelines

### Backend Testing (pytest)
**Test Structure:**
- Test files: `tests/test_*.py` in `tests/` directory.
- Test classes: `TestClassName` for organizing related tests.
- Test methods: `test_descriptive_name` following AAA pattern (Arrange, Act, Assert).

**Testing Patterns:**
- Use fixtures for database sessions and test data.
- Mock external dependencies (API calls, file operations).
- Test API endpoints with FastAPI TestClient.
- Test database operations with test database.
- Include both positive and negative test cases.

**Test Coverage:**
- Aim for >80% code coverage.
- Test error conditions and edge cases.
- Use parameterized tests for similar scenarios.
- Mock expensive operations (external APIs, file I/O).

### Frontend Testing (Jest + React Testing Library)
**Test Structure:**
- Test files: `ComponentName.test.js` or `ComponentName.spec.js`.
- Use `describe` blocks to group related tests.
- Use `it` or `test` for individual test cases.

**Testing Patterns:**
- Test user interactions, not implementation details.
- Use `screen` queries for accessible element selection.
- Mock API calls with `jest.mock()` or `msw`.
- Test component behavior with different props/states.
- Include accessibility testing with `jest-axe`.

**Common Test Scenarios:**
- Component rendering with default/required props.
- User interactions (clicks, form submissions).
- State changes and side effects.
- Error states and loading states.
- Form validation and error messages.

## Commit & Pull Request Guidelines

**Commit Messages:**
- Use imperative mood: "Add user authentication" not "Added user authentication".
- Keep first line under 50 characters.
- Add detailed description for complex changes.
- Reference issue numbers: "Fix login bug (#123)".

**Pull Requests:**
- Include clear title and description.
- List affected areas and changes made.
- Add screenshots for UI changes.
- Request review from appropriate team members.
- Ensure CI checks pass before merging.

**Branch Naming:**
- Feature branches: `feature/description-of-feature`.
- Bug fixes: `fix/description-of-bug`.
- Hotfixes: `hotfix/critical-issue`.

## Security & Configuration Guidelines

**Environment Variables:**
- Store all secrets in environment variables.
- Never commit sensitive data to repository.
- Use `.env` files for local development (add to `.gitignore`).
- Document required environment variables.

**API Security:**
- Use JWT tokens for authentication.
- Implement proper CORS configuration.
- Validate all input data with Pydantic models.
- Use HTTPS in production.
- Implement rate limiting for public endpoints.

**Database Security:**
- Use parameterized queries (SQLAlchemy handles this).
- Implement proper access controls.
- Avoid logging sensitive information.
- Use database migrations for schema changes.

**Frontend Security:**
- Store tokens securely (localStorage for development only).
- Validate user inputs on client and server.
- Implement proper error handling without exposing internals.
- Use Content Security Policy headers.

## Development Workflow

1. **Setup**: Follow Quick Start steps
2. **Development**: Make changes, run tests, format code
3. **Testing**: Write tests for new features, run full test suite
4. **Code Review**: Create PR, address feedback
5. **Deployment**: Build frontend, deploy backend, run migrations

## Performance Considerations

**Backend:**
- Use database indexes for frequently queried fields.
- Implement caching for expensive operations.
- Use async endpoints for I/O operations.
- Optimize database queries with select_related/prefetch_related.

**Frontend:**
- Lazy load components and routes.
- Optimize bundle size (code splitting).
- Use React.memo for expensive components.
- Implement virtualization for large lists.

## Accessibility Guidelines

- Use semantic HTML elements.
- Provide alt text for images.
- Ensure keyboard navigation works.
- Use ARIA attributes when needed.
- Test with screen readers.
- Maintain sufficient color contrast.
- Use proper heading hierarchy.

## Code Review Checklist

**General:**
- [ ] Code follows style guidelines
- [ ] Tests are included and passing
- [ ] No console.logs or debugging code
- [ ] Security best practices followed
- [ ] Performance considerations addressed

**Backend:**
- [ ] Type hints included
- [ ] Error handling implemented
- [ ] Database transactions used appropriately
- [ ] API responses properly validated

**Frontend:**
- [ ] Components are accessible
- [ ] State management is appropriate
- [ ] No memory leaks (cleanup effects)
- [ ] Responsive design implemented</content>
<parameter name="filePath">/home/antonio/syllabus-management/AGENTS.md