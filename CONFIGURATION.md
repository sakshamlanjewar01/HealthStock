# Trulicare Environment Variable Reference

| Variable Name | Purpose | Required | Example |
| :--- | :--- | :--- | :--- |
| `PORT` | API Server HTTP Port | No (Default: 5000) | `5000` |
| `MONGODB_URI` | MongoDB Connection String | **Yes** | `mongodb://127.0.0.1:27017/trulicare` |
| `JWT_SECRET` | Secret Key for JWT Signatures | **Yes** | `super_secret_trulicare_jwt_key_987654321` |
| `CLIENT_URL` | Allowed CORS Origin URL | **Yes** | `https://trulicare.vercel.app` |
| `SMTP_HOST` | Email SMTP Server Host | Optional | `smtp.gmail.com` |
| `VAPID_PUBLIC_KEY` | Web Push Notification Public Key | Optional | Generated via `npx web-push` |
