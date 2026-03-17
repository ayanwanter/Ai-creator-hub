// Firebase Client SDKs are no longer strictly needed if using API routes exclusively,
// but we keep the structure for compatibility if any library expects them.

window.dispatchEvent(new CustomEvent('firebase-ready'));
