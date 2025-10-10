import bcrypt from 'bcryptjs';
import { Types } from 'mongoose';
import CredentialsProvider from 'next-auth/providers/credentials';
import FacebookProvider from 'next-auth/providers/facebook';
import GoogleProvider from 'next-auth/providers/google';

import connectDB from '@/libs/mongoose';
import { User } from '@/models';

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          await connectDB();

          const user = await (User as any).findOne({ email: credentials.email }).select('+password');

          if (!user || !user.password) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

          if (!isPasswordValid) {
            return null;
          }

          // Check if user is active
          if (user.status !== 1) {
            return null;
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            image: user.avatar,
            role: user.role,
            status: user.status,
          };
        } catch (error) {
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt' as const,
  },
  allowDangerousEmailAccountLinking: true,
  callbacks: {
    async jwt({ token, user, trigger }: any) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.status = user.status;
      }

      if (trigger === 'update' || !token.role) {
        try {
          await connectDB();
          const dbUser = await (User as any).findById(new Types.ObjectId(token.id as string)).select('role status');
          if (dbUser) {
            token.role = dbUser.role;
            token.status = dbUser.status;
          }
        } catch (error) {
          // Silently fail
        }
      }

      return token;
    },
    async session({ session, token }: any) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.status = token.status;
      }
      return session;
    },
    async signIn({ user, account, profile }: any) {
      if (account?.provider === 'google' || account?.provider === 'facebook') {
        try {
          await connectDB();

          const existingUser = await (User as any).findOne({ email: user.email });

          if (!existingUser) {
            const newUser = new User({
              email: user.email,
              name: user.name,
              avatar: user.image,
              role: 3,
              status: 1,
              email_verified_at: new Date(),
              [`${account.provider}_id`]: profile?.id || account.providerAccountId,
              [`is_${account.provider}_linked`]: true,
              password: await bcrypt.hash(Math.random().toString(36), 10),
            });

            await newUser.save();

            user.id = newUser._id.toString();
            user.role = newUser.role;
            user.status = newUser.status;
          } else {
            existingUser[`${account.provider}_id`] = profile?.id || account.providerAccountId;
            existingUser[`is_${account.provider}_linked`] = true;
            existingUser.last_login = new Date();

            if (!existingUser.name && user.name) {
              existingUser.name = user.name;
            }
            if (!existingUser.avatar && user.image) {
              existingUser.avatar = user.image;
            }

            await existingUser.save();

            user.id = existingUser._id.toString();
            user.role = existingUser.role;
            user.status = existingUser.status;
          }

          return true;
        } catch (error) {
          return false;
        }
      }

      return true;
    },
    async redirect({ url, baseUrl }: any) {
      if (url.startsWith(baseUrl)) {
        return url;
      }
      return `${baseUrl}/vi`;
    },
  },
  pages: {
    signIn: '/vi/login',
  },
};