# Design: Add src directory to Next.js app

## Overview
Add `src` directory to `apps/web` Next.js application, moving `app` and `components` directories into `src` while keeping `public` directory in its current location.

## Architecture
- Move `apps/web/app` → `apps/web/src/app`
- Move `apps/web/components` → `apps/web/src/components`
- Keep `apps/web/public` in current location
- Update `tsconfig.json` path alias from `"@/*": ["./*"]` to `"@/*": ["./src/*"]`

## Data Flow
- All `@/` import paths will continue to work automatically via updated tsconfig.json path alias
- Relative imports (e.g., `./globals.css`) need manual adjustment after directory moves
- No changes to application logic or component structure

## Error Handling
Potential errors after migration:
1. **Import path errors** - Fixed by updating tsconfig.json path alias
2. **Configuration file path errors** - Fixed by updating any hardcoded paths
3. **Build failures** - Verified by running `pnpm build` and `pnpm lint`

## Testing
- Run `pnpm build` to verify successful compilation
- Run `pnpm lint` to check for code style issues
- Run any existing test suites if available

## Implementation Steps
1. Create `src` directory under `apps/web`
2. Move `app` directory to `src/app`
3. Move `components` directory to `src/components`
4. Update `tsconfig.json` path alias
5. Update any configuration files if needed
6. Verify build and lint pass

## Trade-offs
**Pros:**
- Cleaner project structure following Next.js conventions
- Better separation of source code from configuration
- Easier to maintain as project grows

**Cons:**
- Requires updating import paths (though minimal with path alias)
- Initial migration effort
- Potential for merge conflicts if working in teams