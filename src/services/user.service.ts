/* eslint-disable @typescript-eslint/no-explicit-any */
import { userRepository } from "@/repositories/user.repository";
import { logger } from "@/lib/logger";

export class UserService {
  async syncGoogleUser(profile: {
    email: string;
    name?: string;
    image?: string;
  }, contextInfo?: { ip?: string; userAgent?: string }): Promise<any> {
    try {
      const user = await userRepository.upsertGoogleUser(profile);
      
      await logger.audit({
        userId: user._id.toString(),
        action: "login",
        status: "success",
        ipAddress: contextInfo?.ip,
        userAgent: contextInfo?.userAgent,
        metadata: { provider: "google", email: profile.email }
      });

      return user;
    } catch (error) {
      await logger.audit({
        action: "login",
        status: "failure",
        ipAddress: contextInfo?.ip,
        userAgent: contextInfo?.userAgent,
        metadata: { provider: "google", email: profile.email, error: String(error) }
      });
      throw error;
    }
  }

  async getUserById(userId: string): Promise<any | null> {
    return userRepository.findById(userId);
  }
}

export const userService = new UserService();
