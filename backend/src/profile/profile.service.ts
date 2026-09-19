import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { PublicProfile } from "./profile.model";
import { profileRelations, publicProfile } from "./profile.mapper";

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}
  async getPublicProfile(): Promise<PublicProfile> {
    const record = await this.prisma.profile.findUnique({
      where: { id: 1 },
      include: profileRelations,
    });
    if (!record)
      throw new ServiceUnavailableException("Public profile unavailable");
    return publicProfile(record);
  }
}
