/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseRepository } from "./base.repository";
import { User, UserDocument } from "@/models/User";

export class UserRepository extends BaseRepository<UserDocument> {
  constructor() {
    super(User);
  }

  async findByEmail(email: string): Promise<any | null> {
    return this.findOne({ email: email.toLowerCase() });
  }

  async updateLastLogin(userId: string): Promise<any | null> {
    return this.update(userId, { lastLoginAt: new Date() });
  }

  async upsertGoogleUser(profile: {
    email: string;
    name?: string;
    image?: string;
    googleId?: string;
  }): Promise<any> {
    const email = profile.email.toLowerCase();
    const existing = await this.findOne({ email, isDeleted: false });

    if (existing) {
      const updateData: any = { lastLoginAt: new Date() };
      if (profile.name) updateData.name = profile.name;
      if (profile.image) updateData.image = profile.image;
      if (profile.googleId) updateData.googleId = profile.googleId;
      return this.update(existing._id.toString(), updateData);
    }

    return this.create({
      email,
      name: profile.name || "NEET Student",
      image: profile.image || "",
      googleId: profile.googleId || "",
      role: "student",
      lastLoginAt: new Date()
    });
  }
}

export const userRepository = new UserRepository();
