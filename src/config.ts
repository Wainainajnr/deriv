
// Use this file to store application-wide configuration
// It helps in managing different environments (development vs. production)

// IMPORTANT: The REDIRECT_URI must EXACTLY match the one you've registered
// in your Deriv application settings.
// Note: Deriv requires HTTPS redirect URIs, so local OAuth testing requires
// deployment to Vercel or using an HTTPS tunnel like ngrok

export const DERIV_APP_ID = "114223";
export const REDIRECT_URI = "https://derivedge.vercel.app/callback";
