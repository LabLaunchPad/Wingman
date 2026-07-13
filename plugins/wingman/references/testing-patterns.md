# Testing Patterns — Cross-Skill Reference

Applied by the Engineer seat and all skills that produce or modify code. Every test written in this project must follow these patterns. Violations are caught in review and treated as quality defects.

---

## 1. AAA Structure (Arrange / Act / Assert)

Every test follows the three-phase structure. No exceptions.

```typescript
it("calculates total price with discount applied", () => {
  // Arrange
  const items = [{ price: 100 }, { price: 200 }];
  const discount = 0.15;

  // Act
  const total = calculateTotal(items, discount);

  // Assert
  expect(total).toBe(255);
});
```

### Rules

- **Arrange** — Set up inputs, dependencies, and state. Keep it minimal.
- **Act** — Call the single function/method under test. One action per test.
- **Assert** — Verify the outcome. One logical assertion preferred; multiple allowed when testing a single contract.

### What to avoid

- Tests that act then arrange (setup scattered through the test body)
- Tests with multiple independent assertions covering unrelated behavior
- Assertions hidden inside helper functions (assertions must be visible in the test body)

---

## 2. Naming Conventions

### Pattern

```
it("should {expected behavior} when {condition}")
```

### Examples

```typescript
it("should return 404 when user does not exist", () => { ... });
it("should throw ValidationError when email is empty", () => { ... });
it("should send welcome email when user registers", () => { ... });
it("should retry 3 times when upstream service times out", () => { ... });
```

### Rules

- Names describe behavior, not implementation
- Use "should" prefix consistently
- Condition clause provides context
- Never name tests `test1`, `test2`, `it works`, or similar
- File naming: `{module}.test.ts` or `{module}.spec.ts` (pick one per project, be consistent)

---

## 3. Mocking Guidelines

### When to mock

| Scenario | Mock? | Why |
|----------|-------|-----|
| External API calls | YES | Non-deterministic, slow, rate-limited |
| Database queries (unit tests) | YES | Speed, isolation, determinism |
| File system (unit tests) | YES | Speed, portability |
| Time-dependent code | YES | `Date.now()`, timers, schedules |
| Internal pure functions | NO | Test the real thing |
| Domain logic | NO | Mocks hide bugs in core behavior |
| Adjacent modules you own | Prefer NO | Use fakes or real instances |

### Mocking rules

1. **Mock at the boundary, not the center.** Mock external I/O, not internal logic.
2. **Verify behavior, not implementation.** Assert on outputs and side effects, not on mock call sequences.
3. **Prefer fakes over mocks.** A fake implementation is clearer than a mock with 15 expectations.
4. **Reset mocks between tests.** Prevent test pollution.
5. **Don't mock what you don't own.** If a library's interface changes, your mocks won't catch it.

### Example

```typescript
// Bad: mocking the function under test's internals
const mockCalculate = vi.fn();
mockCalculate.mockReturnValue(255);

// Good: mocking the external dependency only
vi.mock("./db", () => ({
  getUser: vi.fn().mockResolvedValue({ id: 1, name: "Alice" }),
}));

it("should return user profile when user exists", async () => {
  const profile = await getProfile(1);
  expect(profile.name).toBe("Alice");
});
```

---

## 4. Coverage Targets

### Minimums

| Metric | Target | Enforcement |
|--------|--------|-------------|
| Line coverage | 80% | CI gate — below 80% fails the build |
| Branch coverage | 80% | CI gate |
| Function coverage | 80% | CI gate |
| New code coverage | 90% | PR gate — new/changed code must meet higher bar |

### What to cover

- Every public function/method: at least happy path + one error case
- Every branch: if/else, switch, ternary, optional chaining
- Every error path: thrown errors, rejected promises, edge cases
- Integration seams: where modules connect, data transforms

### What NOT to chase

- Coverage of third-party library internals
- Getter/setter trivial accessors (unless they have logic)
- Generated code
- Test code itself

### Coverage report command

```bash
bun test --coverage
```

Review the HTML report. Focus on files below the threshold. Coverage tooling is advisory for prioritization; the 80% minimum is mandatory.

---

## 5. Anti-Patterns

### Testing implementation details

```typescript
// Bad: tests internal state
component.state = "loading";
expect(component.state).toBe("loading");

// Good: tests observable behavior
render(<Component />);
expect(screen.getByText("Loading...")).toBeInTheDocument();
```

### Test interdependence

```typescript
// Bad: test depends on previous test's state
it("creates user", () => { users.create("alice"); });
it("finds user", () => { expect(users.find("alice")).toBeTruthy(); });

// Good: each test is independent
it("finds user when user exists", () => {
  users.create("alice");
  expect(users.find("alice")).toBeTruthy();
});
```

### Brittle assertions

```typescript
// Bad: asserts on implementation details
expect(component.find(".btn-primary > span").text()).toBe("Submit");

// Good: asserts on meaningful contract
expect(screen.getByRole("button", { name: "Submit" })).toBeInTheDocument();
```

### Giant tests

```typescript
// Bad: 200-line test covering 10 scenarios
it("handles everything", () => { ... });

// Good: focused tests, one scenario each
it("should return 400 when body is empty", () => { ... });
it("should return 409 when email already exists", () => { ... });
it("should return 201 with user id when valid", () => { ... });
```

### Flaky patterns

- Relying on test execution order
- Using `Date.now()` without mocking
- Testing timing-dependent behavior without deterministic time
- Shared mutable state between tests
- Network calls in unit tests

---

## 6. TDD Workflow Reference

The mandatory Red-Green-Refactor cycle. Every feature starts with a failing test.

### Step 1: RED — Write a failing test

```bash
bun test --filter "new feature"
# Confirm: test fails with clear error message
```

- Write the test first, before any production code
- The test should describe the desired behavior in plain terms
- It MUST fail for the right reason (not a syntax error)

### Step 2: GREEN — Write minimum code to pass

```bash
bun test --filter "new feature"
# Confirm: test passes
```

- Write the simplest code that makes the test pass
- Don't add anything the test doesn't demand
- It's okay if the code is ugly — that's what refactor is for

### Step 3: REFACTOR — Improve while green

```bash
bun test
# Confirm: all tests still pass
```

- Improve naming, extract functions, reduce duplication
- Apply the 5-tag taxonomy to assess rigor level
- Run full suite after every refactor pass

### Step 4: Full suite verification

```bash
bun test --jobs=4
# Confirm: zero failures across entire project
```

### TDD rules

1. Never skip RED. A test you didn't write doesn't count.
2. Never skip GREEN verification. Assumed passing is not passing.
3. Never refactor with failing tests.
4. Every commit must leave all tests green.
5. If a test is hard to write, the design needs improvement.

---

## Integration Test Patterns

For tests that verify module-to-module or service-to-service behavior.

```typescript
describe("User registration flow", () => {
  it("should create user and send welcome email", async () => {
    // Arrange
    const db = await createTestDatabase();
    const mailer = createFakeMailer();
    const service = createUserService(db, mailer);

    // Act
    const user = await service.register({ email: "test@example.com", name: "Test" });

    // Assert
    expect(user.id).toBeDefined();
    expect(user.email).toBe("test@example.com");
    expect(mailer.sent).toHaveLength(1);
    expect(mailer.sent[0].to).toBe("test@example.com");

    // Cleanup
    await db.close();
  });
});
```

### Integration test rules

- Use real databases with test data (or in-memory variants)
- Clean up after each test (or use transactions with rollback)
- Mock only external services (email providers, payment gateways)
- Test the full path from input to output
- Verify data persistence, not just return values

---

## Application Rules

1. **Engineer seat** enforces these patterns at every checkpoint.
2. Tests that violate anti-patterns are flagged in review and must be fixed.
3. Coverage below 80% is a **blocking NO_GO** at ship-readiness.
4. TDD is mandatory for new features; allowed (not mandatory) for bug fixes.
5. This document is versioned. Changes require a Boardroom checkpoint.
