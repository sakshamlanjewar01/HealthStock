# Trulicare Maintenance & Operations Guide

- **Database Backup**: Schedule daily `mongodump` snapshots for MongoDB Atlas clusters.
- **SSL Maintenance**: Automatic renewal managed by Vercel and Render via Let's Encrypt TLS 1.3.
- **Dependencies**: Periodically run `npm audit` and `npm update`.
