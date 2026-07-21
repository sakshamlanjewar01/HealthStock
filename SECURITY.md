# Trulicare Security Policy & Controls

## 🛡️ OWASP Top 10 Safeguards

1. **Broken Access Control (A01)**: Enforced via `restrictTo('Pharmacist', 'Doctor', 'Admin')` middleware.
2. **Cryptographic Failures (A02)**: Passwords hashed via BCrypt (10 rounds). Sensitive PII fields encrypted with AES-256-CBC.
3. **Injection Vectors (A03)**: Mongoose ODM parameterized schemas neutralize NoSQL injection; Helmet CSP & React text node escaping block XSS.
4. **Insecure Design (A04)**: Dual-tier rate limiting (`authLimiter` 15/15m, `apiLimiter` 100/15m).
5. **Security Misconfiguration (A05)**: Standardized `.env` and `.env.example` configurations.

---

## 🔒 Reporting Security Vulnerabilities

Please report security issues directly to `security@trulicare.com`.
