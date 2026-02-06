# Google Sign-In Setup Guide

## Quick Start

### 1. Get Your Google Client ID

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Enable the **Google+ API**:
   - Go to APIs & Services > Library
   - Search for "Google+ API"
   - Click Enable
4. Create OAuth 2.0 credentials:
   - Go to APIs & Services > Credentials
   - Click "Create Credentials" > "OAuth client ID"
   - Select "Web application"
   - Configure authorized redirect URIs:
     - `http://localhost:5173` (development)
     - `http://localhost:5173/auth/callback` (development callback)
     - `https://yourdomain.com` (production)
     - `https://yourdomain.com/auth/callback` (production callback)
   - Click Create
5. Copy the **Client ID** (don't copy the secret, you don't need it for client-side)

### 2. Configure Environment Variables

1. Open/create `frontend/.env.local`:
   ```env
   VITE_GOOGLE_CLIENT_ID=your_client_id_here
   ```

2. Replace `your_client_id_here` with your actual Client ID from step 1

### 3. Start the Development Server

```bash
cd frontend
npm install  # if you haven't already
npm run dev
```

The app will be available at `http://localhost:5173`

### 4. Test Google Sign-In

1. Navigate to `http://localhost:5173/login`
2. Click the "Sign in with Google" button
3. Complete Google authentication
4. You should be redirected to `/lobby` with your user profile loaded

## How It Works

1. **Login Page**: Displays Google's native sign-in button
2. **Google Auth**: User authenticates with their Google account
3. **Token Decoding**: JWT token from Google is decoded client-side
4. **User Profile**: Creates a `UserProfile` from Google user data
5. **State Management**: User state is stored in React context
6. **Navigation**: Auto-redirects to `/lobby` when authenticated

## Files Involved

- `frontend/.env.local` - Google Client ID configuration
- `frontend/src/services/auth.ts` - Authentication service with Google OAuth
- `frontend/src/contexts/GameContext.tsx` - Game state management with auth
- `frontend/src/pages/Login.tsx` - Login page with Google button
- `frontend/src/styles/google-signin.css` - Google button styling

## Troubleshooting

### "Failed to load Google Sign-In library"
- Check that your Client ID is set in `.env.local`
- Verify the Client ID is valid (starts with numbers)

### Google button not appearing
- Ensure `.env.local` has `VITE_GOOGLE_CLIENT_ID` set
- Clear browser cache and hard refresh
- Check browser console for errors

### "Unauthorized" error
- Verify your redirect URIs in Google Cloud Console match exactly
- Check that `localhost:5173` is in the authorized list
- For production, add your domain to the list

### Can't login even after clicking button
- Check browser console for errors
- Verify the email domain is allowed
- Some domains may have restrictions

## Security Notes

⚠️ **Important**:
- Never commit `.env.local` to version control
- The Client ID is public (it's for client-side use only)
- JWT tokens are decoded client-side (for demo purposes)
- In production, consider validating tokens on your backend
- Always use HTTPS in production

## Production Checklist

- [ ] Add your production domain to authorized redirect URIs
- [ ] Update `.env.local` (or use CI/CD environment variables)
- [ ] Test with your production domain
- [ ] Enable HTTPS
- [ ] Consider backend token validation
- [ ] Set up proper error logging
- [ ] Add user session persistence
