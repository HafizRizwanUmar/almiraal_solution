# Almiraal Backend

Real backend with MongoDB auth — replaces the old proxy.

## Deploy to Vercel

1. Push this folder to a new GitHub repo
2. Import repo in Vercel
3. Add these Environment Variables in Vercel settings:

```
MONGO_URI=<your atlas connection string>
JWT_SECRET=<any long random string>
SEED_SECRET=almiraal_seed_2026
CLOUDINARY_CLOUD_NAME=dhmaitldj
CLOUDINARY_API_KEY=433579832297866
CLOUDINARY_API_SECRET=IZP1eiLJlrTMzvTLv1bLNiW7li0
EMAIL_USER=almiraalmarketing@gmail.com
EMAIL_PASS=yaoh wscv nhic ektz
RECEIVER_EMAIL=info@almiraal.com
```

4. Deploy

## Create first admin user

After deploy, call this once in browser:
```
POST https://your-new-backend.vercel.app/api/auth/seed?secret=almiraal_seed_2026
Body: { "email": "your@email.com", "password": "YourPassword" }
```

Or just hit it in browser (GET will 405, use Postman/Thunder Client).

## API Routes

- `POST /api/auth/login` — returns JWT token
- `POST /api/auth/seed?secret=...` — creates first admin (one-time)
