import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { CsrfGuard } from "../auth/csrf.guard";
import { OriginGuard } from "../auth/origin.guard";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import { NoStoreInterceptor } from "../auth/no-store.interceptor";
import { AdminService } from "./admin.service";
import { profileInput, projectInput } from "./admin.validation";

@Controller("admin")
@UseGuards(OriginGuard, SessionAuthGuard, CsrfGuard)
@UseInterceptors(NoStoreInterceptor)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("projects") projects() {
    return this.adminService.projects();
  }
  @Get("projects/:id") project(@Param("id", ParseIntPipe) id: number) {
    return this.adminService.projectById(id);
  }
  @Post("projects") createProject(@Body() body: unknown) {
    return this.adminService.createProject(projectInput(body));
  }
  @Patch("projects/:id") updateProject(
    @Param("id", ParseIntPipe) id: number,
    @Body() body: unknown,
  ) {
    return this.adminService.updateProject(id, projectInput(body));
  }
  @Get("profile") profile() {
    return this.adminService.profile();
  }
  @Put("profile") updateProfile(@Body() body: unknown) {
    return this.adminService.updateProfile(profileInput(body));
  }
  @Patch("profile") patchProfile(@Body() body: unknown) {
    return this.adminService.updateProfile(profileInput(body));
  }
}
