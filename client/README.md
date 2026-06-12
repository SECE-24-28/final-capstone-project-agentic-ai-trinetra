# Trinetra Client

Next.js operations console for the Trinetra FastAPI backend.

## Run

```bash
npm run dev
```

The dashboard defaults to `http://127.0.0.1:8000`. To point it elsewhere:

```bash
NEXT_PUBLIC_TRINETRA_API_URL=http://127.0.0.1:8000 npm run dev
```

Mapped backend surfaces:

- `/` and `/health`
- `/auth/login`, `/auth/me`, `/auth/users`
- `/system/status`, `/system/metrics`
- `/analytics`
- `/cameras`
- `/alerts`, `/events`
- `/ws`
