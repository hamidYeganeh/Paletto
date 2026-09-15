# Paletto

Product architecture, release phases and the executable engineering backlog are documented in the [Paletto Product & Engineering Blueprint](./docs/README.md).

> The current application is an early visual prototype. The blueprint is the source of truth for evolving it into the marketplace; documentation does not imply that the described features are already implemented.

## Existing workspace

This is a Next.js monorepo template with shadcn/ui.

## Adding components

To add components to your app, run the following command at the root of your `web` app:

```bash
pnpm dlx shadcn@latest add button -c apps/web
```

This will place the ui components in the `packages/ui/src/components` directory.

## Using components

To use the components in your app, import them from the `ui` package.

```tsx
import { Button } from "@workspace/ui/components/button"
```

## Implemented community platform

The current functional implementation, role journeys, configuration, verification and remaining production requirements are documented in [Implementation status](./docs/10-implementation-status.md).

```sh
npm run dev:demo --workspace web
```

Open `/explore`, `/studio`, `/account` or `/gallery/demo`. Demo venues are clearly labeled and cannot accept real payments. MongoDB replica-set transactions are supported for persistent deployments; live payment requires merchant configuration.
