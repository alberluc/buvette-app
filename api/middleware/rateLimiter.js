import rateLimit from 'express-rate-limit'

// Bloque le brute-force sur les routes qui vérifient un mot de passe
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de tentatives. Réessayez dans 15 minutes.' },
  skipSuccessfulRequests: true, // ne compte que les échecs
})

// Bloque l'énumération de clés de licence
export const activateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de tentatives. Réessayez dans une heure.' },
})
