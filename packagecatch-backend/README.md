# PackageCatch Backend

Node.js Express backend for PackageCatch application.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables in `.env`:
   - `JWT_SECRET`: Secret key for JWT tokens
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_ANON_KEY`: Your Supabase anon key

3. Set up Supabase database:
   - Create a `users` table with columns: id (uuid, primary), email (text), password (text), full_name (text), phone (text), address (text), landmark (text), profile_photo (text), role (text, default 'USER')
   - Create a storage bucket called `profile-photos`

4. Run the server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Profile
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update user profile
- `PUT /api/profile/password` - Change password

### Upload
- `POST /api/upload/photo` - Upload profile photo

All protected routes require `Authorization: Bearer <token>` header.