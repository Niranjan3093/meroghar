import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import User from '../models/User.js';

/**
 * Configure Passport.js strategies for OAuth social login.
 * Handles Google and Facebook authentication with account linking —
 * if a user with the same email already exists, the OAuth provider ID
 * is linked to that existing account instead of creating a duplicate.
 */
const configurePassport = () => {
  // Serialize user ID into session
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  // Deserialize user from session by ID
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });

  // ─── Google Strategy ────────────────────────────────────────────────
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: '/api/auth/google/callback',
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value;

            // 1. Check if user already authenticated with Google before
            let user = await User.findOne({ googleId: profile.id });
            if (user) return done(null, user);

            // 2. Check if an account with the same email already exists → link it
            if (email) {
              user = await User.findOne({ email });
              if (user) {
                user.googleId = profile.id;
                if (!user.avatar || user.avatar.includes('placeholder')) {
                  user.avatar = profile.photos?.[0]?.value || user.avatar;
                }
                user.isVerified = true;
                user.emailVerified = true;
                await user.save();
                return done(null, user);
              }
            }

            // 3. Brand-new user — create account
            user = await User.create({
              googleId: profile.id,
              name: profile.displayName,
              email,
              avatar: profile.photos?.[0]?.value || 'https://via.placeholder.com/150',
              isVerified: true,
              emailVerified: true,
            });

            return done(null, user);
          } catch (error) {
            return done(error, null);
          }
        }
      )
    );
    console.log('✓ Google OAuth strategy configured');
  } else {
    console.warn('⚠ Google OAuth credentials not set — Google login disabled');
  }

  // ─── Facebook Strategy ──────────────────────────────────────────────
  if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    passport.use(
      new FacebookStrategy(
        {
          clientID: process.env.FACEBOOK_APP_ID,
          clientSecret: process.env.FACEBOOK_APP_SECRET,
          callbackURL: '/api/auth/facebook/callback',
          profileFields: ['id', 'displayName', 'photos', 'email'],
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value;

            // 1. Check if user already authenticated with Facebook before
            let user = await User.findOne({ facebookId: profile.id });
            if (user) return done(null, user);

            // 2. Check if an account with the same email already exists → link it
            if (email) {
              user = await User.findOne({ email });
              if (user) {
                user.facebookId = profile.id;
                if (!user.avatar || user.avatar.includes('placeholder')) {
                  user.avatar = profile.photos?.[0]?.value || user.avatar;
                }
                user.isVerified = true;
                user.emailVerified = true;
                await user.save();
                return done(null, user);
              }
            }

            // 3. Brand-new user — create account
            user = await User.create({
              facebookId: profile.id,
              name: profile.displayName,
              email,
              avatar: profile.photos?.[0]?.value || 'https://via.placeholder.com/150',
              isVerified: true,
              emailVerified: true,
            });

            return done(null, user);
          } catch (error) {
            return done(error, null);
          }
        }
      )
    );
    console.log(' Facebook OAuth strategy configured');
  } else {
    console.warn(' Facebook OAuth credentials not set — Facebook login disabled');
  }
};

export default configurePassport;
