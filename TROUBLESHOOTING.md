# Trulicare Production Troubleshooting Matrix

| Issue | Cause | Resolution |
| :--- | :--- | :--- |
| `JWT_SECRET not configured` | Missing `.env` secret key | Set `JWT_SECRET` in environment variables. |
| CORS Blocked | Origin mismatch | Update `CLIENT_URL` in backend `.env`. |
| Mongo Connection Timeout | Invalid IP whitelist or URI | Verify MongoDB Atlas IP Access List (0.0.0.0/0). |
