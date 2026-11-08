// The site no longer uses Firebase: data, logins and files are stored in the
// GoDaddy MySQL database (see src/lib/firebase/*.ts and src/app/api/).
//
// isFirebaseConfigured() is kept so existing services keep working: it now
// means "the site's own data backend is available". When the server has no
// database configured, the API answers "backend-unavailable" and the
// services' existing demo/localStorage fallbacks take over.

export function isFirebaseConfigured(): boolean {
  return true;
}
