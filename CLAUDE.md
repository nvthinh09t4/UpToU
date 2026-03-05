# Project: MyApp

## Stack
- Backend: ASP.NET Core 8 Web API (C#)
- Frontend: ReactJS + Vite + Tailwind CSS
- Database: SQL Server + Entity Framework Core
- Auth: JWT Bearer tokens
- Cloud: Azure (App Service, Blob Storage, Service Bus)

## Directory Structure
```
/src
  /MyApp.API            — ASP.NET Core project
  /MyApp.Core           — Domain entities, interfaces
  /MyApp.Infrastructure — EF Core, repositories, services
/client                 — React Vite app
/tests                  — xUnit + MSTest
```

## ASP.NET Core API Best Practices
- Follow RESTful conventions: proper HTTP verbs, meaningful resource URLs, correct status codes
- Use the Options pattern (IOptions<T>) for all configuration — never read IConfiguration directly in services
- Apply the Mediator pattern (MediatR) to decouple controllers from business logic
- Use FluentValidation for all request validation — never validate manually inside controllers or services
- Return ProblemDetails (RFC 7807) for all error responses using a global exception handler middleware
- Use ILogger<T> everywhere — structured logging with Serilog as the provider
- Apply rate limiting, CORS, and response compression at the middleware level
- Use cancellation tokens in all async controller actions and service methods
- Version all APIs via URL prefix (/api/v1/...) from day one
- Never expose internal exceptions or stack traces to API consumers
- Use output caching or IMemoryCache for read-heavy endpoints
- Apply [ApiController] attribute and use ActionResult<T> for all endpoints

## Logging Guidelines
- Use structured logging everywhere — always pass data as named properties, never interpolate into the message string
  ```csharp
  // ✅ Correct
  _logger.LogInformation("Order created. {OrderId} {CustomerId} {TotalAmount}", order.Id, order.CustomerId, order.Total);

  // ❌ Wrong
  _logger.LogInformation($"Order created: {order.Id}");
  ```
- Log at the correct level:
  - `LogTrace` — very detailed diagnostic data (only in dev, usually disabled)
  - `LogDebug` — internal flow useful during development
  - `LogInformation` — significant business events (order created, user logged in, payment processed)
  - `LogWarning` — unexpected but recoverable situations (retry attempted, fallback used, validation failed)
  - `LogError` — exceptions and failures that need attention but don't crash the app
  - `LogCritical` — application-breaking failures (DB unreachable at startup, config missing)

- **Always log exceptions with the exception object as the first argument** — never just log the message string
  ```csharp
  // ✅ Correct — Serilog captures full stack trace
  _logger.LogError(ex, "Failed to process payment. {OrderId} {PaymentProvider}", orderId, provider);

  // ❌ Wrong — stack trace is lost
  _logger.LogError("Failed to process payment: " + ex.Message);
  ```

- **Always include a correlation/request ID** in every log entry for traceability across services
  ```csharp
  // In middleware — attach to all subsequent logs automatically
  using (_logger.BeginScope(new Dictionary<string, object>
  {
      ["CorrelationId"] = context.TraceIdentifier,
      ["UserId"] = context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "anonymous"
  }))
  {
      await _next(context);
  }
  ```

- Log every important business action — including who did it, what changed, and when:
  - User authentication: login success, login failure (with reason), logout, token refresh
  - Authorization failures: who tried to access what and was denied
  - Data mutations: create, update, delete — log entity type, ID, and actor
  - External service calls: outbound HTTP requests, responses, latency, and failures
  - Background jobs: start, finish, item count processed, duration, errors
  - File/blob operations: uploads, downloads, deletions
  - Configuration or feature flag changes at runtime

- **Use a global exception handler middleware** — never swallow exceptions silently
  ```csharp
  app.UseExceptionHandler(builder => builder.Run(async context =>
  {
      var exception = context.Features.Get<IExceptionHandlerFeature>()?.Error;
      var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();

      logger.LogError(exception, "Unhandled exception. {Method} {Path} {QueryString}",
          context.Request.Method,
          context.Request.Path,
          context.Request.QueryString);

      context.Response.StatusCode = StatusCodes.Status500InternalServerError;
      await context.Response.WriteAsJsonAsync(new ProblemDetails
      {
          Status = 500,
          Title = "An unexpected error occurred.",
          Detail = context.TraceIdentifier
      });
  }));
  ```

- **Never swallow exceptions silently** — if you catch, you must log
  ```csharp
  // ✅ Correct
  try { await _paymentService.ChargeAsync(order); }
  catch (PaymentException ex)
  {
      _logger.LogError(ex, "Payment charge failed. {OrderId} {Amount}", order.Id, order.Total);
      throw; // re-throw unless you have a deliberate fallback
  }

  // ❌ Wrong — exception disappears, impossible to debug
  try { await _paymentService.ChargeAsync(order); }
  catch { }
  ```

- **Log warnings for expected-but-notable failures** (not every validation error is an error-level event)
  ```csharp
  if (product == null)
  {
      _logger.LogWarning("Product not found during order creation. {ProductId} {RequestedBy}", productId, userId);
      return Result.Fail("Product not found.");
  }
  ```

- Configure Serilog output sinks per environment:
  - Development: Console (human-readable, colored)
  - Staging/Production: Console (JSON) + Azure Application Insights (or Seq)
  - Never log to local files in containerized/cloud environments

- **Sensitive data must never appear in logs**: passwords, tokens, credit card numbers, PII (mask or omit entirely)
  ```csharp
  // ✅ Log the user ID, not the credentials
  _logger.LogInformation("Login attempt. {Email} {IpAddress}", email, ipAddress);
  // ❌ Never do this
  _logger.LogInformation("Login attempt. {Email} {Password}", email, password);
  ```

- On the React frontend, log significant UI events using a centralized logger (not raw console.log):
  ```typescript
  // logger.ts — wraps console, can be extended to send to a logging service
  export const logger = {
    info:  (msg: string, data?: object) => console.info(`[INFO] ${msg}`, data ?? ''),
    warn:  (msg: string, data?: object) => console.warn(`[WARN] ${msg}`, data ?? ''),
    error: (msg: string, error?: unknown, data?: object) => console.error(`[ERROR] ${msg}`, error ?? '', data ?? ''),
  };

  // Always log unhandled errors in the global error boundary
  // Always log failed API calls in the Axios response interceptor
  // Always log authentication events (login, logout, session expired)
  ```

## SQL Server & EF Core Best Practices
- Always define explicit column types in entity configurations (HasColumnType("decimal(18,2)"))
- Use IEntityTypeConfiguration<T> — never configure entities inside OnModelCreating directly
- Apply global query filters for soft delete (IsDeleted) on all applicable entities
- Index foreign keys and any column used in WHERE clauses
- Avoid lazy loading — use explicit .Include() and projection to DTOs
- Never call SaveChangesAsync inside repositories — only call it at the service/Unit of Work level
- Use AsNoTracking() for all read-only queries
- Use ExecuteUpdateAsync / ExecuteDeleteAsync for bulk operations instead of loading entities
- Name migrations descriptively: AddOrderStatusColumn, CreateIndexOnCustomerEmail
- Use database transactions explicitly for multi-step write operations
- Never use SELECT * — always project to the exact columns needed

## React Best Practices
- Co-locate component files: keep component, styles, tests, and types in the same folder
- Prefer composition over prop drilling — use Context or Zustand only when truly needed
- Keep components small and focused — one responsibility per component
- Memoize expensive computations with useMemo, prevent unnecessary re-renders with React.memo and useCallback
- Always handle loading, error, and empty states explicitly — never leave them implicit
- Use React Query (TanStack Query) for all server state — no useEffect for data fetching
- Prefer controlled components for forms; use React Hook Form to avoid manual state management
- Use TypeScript strictly — no any, no ts-ignore without an explanation comment
- Code-split by route using React.lazy and Suspense for large apps
- Accessibility first: semantic HTML, aria-* attributes, keyboard navigation support

## Coding Guidelines (Consistency & Quality)
- **Naming**: PascalCase for classes/components/types, camelCase for variables/methods/props, UPPER_SNAKE_CASE for constants
- **File length**: keep files under 300 lines — split if larger
- **Method length**: keep methods under 30 lines — extract helper methods if longer
- **No magic numbers**: extract all literals into named constants or configuration
- **Early return**: prefer guard clauses over deeply nested if/else
- **No commented-out code**: delete dead code, use git history instead
- **No TODO without a ticket**: every TODO must reference an issue number (// TODO: #123)
- **Imports**: group and order — framework → third-party → internal; alphabetical within each group
- **DRY**: if the same logic appears more than twice, extract it into a shared utility
- **Fail fast**: validate inputs at the boundary (API layer, form submit) — assume clean data inside the domain

## Test-First Workflow (TDD)
**This is mandatory. No feature is considered complete unless all tests pass.**

### The Workflow
1. **Write the test first** — before writing any implementation code
2. **Run the test** — confirm it fails (red)
3. **Write the minimum code** to make it pass (green)
4. **Refactor** — clean up while keeping tests green
5. **Never submit a PR** where any test is skipped, ignored, or failing

### Backend — xUnit Standards
- Use the AAA pattern strictly: Arrange → Act → Assert, with a blank line between each section
- Use Moq for mocking dependencies — never use real databases or HTTP calls in unit tests
- Use FluentAssertions for all assertions — no bare Assert.Equal
- One logical assertion per test (multiple .Should() chains on the same result is fine)
- Test method naming: MethodName_Scenario_ExpectedResult (e.g. CreateOrderAsync_WhenStockInsufficient_ThrowsException)
- Use [Theory] + [InlineData] for data-driven tests
- Integration tests use a separate project, an in-memory SQL Server (EF Core InMemory or Testcontainers)
- Aim for >= 80% coverage on services and domain logic

### Frontend — Vitest + React Testing Library Standards
- Test behavior, not implementation — query by role/label/text, never by CSS class or component internals
- Mock API calls with MSW (Mock Service Worker) — not by mocking modules directly
- Test every user interaction: click, type, submit, error state, loading state
- Use userEvent over fireEvent for realistic interaction simulation
- Snapshot tests are discouraged — prefer explicit assertions on rendered output
- Test file lives next to the component: Button.tsx → Button.test.tsx

## Definition of Done
A task is only complete when ALL of the following are true:
- [ ] Unit tests written before implementation
- [ ] All tests pass (`dotnet test` / `npm test`)
- [ ] No new linting errors (`dotnet format` / `eslint`)
- [ ] Code reviewed against these guidelines
- [ ] No secrets or hardcoded values committed
- [ ] API changes reflected in Swagger/OpenAPI docs
- [ ] PR description explains the "why", not just the "what"

## Common Commands
- `dotnet watch run`                                  — run backend with hot reload
- `npm run dev`                                       — run frontend dev server
- `dotnet ef migrations add <n>`                     — add a new migration
- `dotnet test`                                       — run all tests
- `dotnet test --collect:"XPlat Code Coverage"`      — run with coverage report
- `npm test`                                          — run frontend tests
- `npm run test:coverage`                             — run frontend tests with coverage
- `dotnet format`                                     — auto-format C# code
- `npx eslint . --fix`                               — auto-fix JS/TS lint errors