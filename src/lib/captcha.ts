/**
/**
 * Captcha Configuration Helper (Cloudflare Turnstile / Google reCAPTCHA)
 */
export const CAPTCHA_SITE_KEY =
  import.meta.env.VITE_TURNSTILE_SITE_KEY ||
  import.meta.env.VITE_RECAPTCHA_SITE_KEY ||
  '0x4AAAAAAAxPlaceholderTurnstileKey';

export const isCaptchaConfigured = Boolean(
  import.meta.env.VITE_TURNSTILE_SITE_KEY || import.meta.env.VITE_RECAPTCHA_SITE_KEY
);
