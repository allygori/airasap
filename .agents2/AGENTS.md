<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->


# Project: Pasaria TypeScript Agent Guidelines

## 🛠 Commands
- Build: `pnpm run build`
- Test: `pnpm test`
- Lint: `pnpm run lint`

## 🏗 Tech Stack
- TypeScript ^5+ (Strict Mode)
- Node.js 20.14.0
- Frameworks: Next.js 16.2.4

## ✍️ Code Style
- **Naming**: Use kebab-case for file, PascalCase for classes/types/interfaces, camelCase for variables/functions.
- **Patterns**: Prefer functional patterns and immutability where possible, use Type instead of Interface.
- **Example**:
  // Bad
  ```ts
    function add(a, b) { return a + b; }
  ```
  // Good
  ```ts
  const add = (a: number, b: number): number => a + b;
  ```

## 🚧 Boundaries
- NEVER use `any`. Use `unknown` if types are truly uncertain.
- DO NOT modify the `dist/` or `node_modules/` directories.
- ASK for permission before adding new NPM packages.

## 📁 Structure
- `/app`: Next.js App routes
- `/modules`: Modules
- `/lib`: Shared libraries

