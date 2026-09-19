import { Controller, Get } from "@nestjs/common";
import type { PublicProfile } from "./profile.model";
import { ProfileService } from "./profile.service";

@Controller("profile")
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  getProfile(): Promise<PublicProfile> {
    return this.profileService.getPublicProfile();
  }
}
