import { Injectable } from "@nestjs/common";
import { publicProfile } from "./profile.data";
import { PublicProfile } from "./profile.model";

@Injectable()
export class ProfileService {
  getPublicProfile(): PublicProfile {
    return publicProfile;
  }
}
