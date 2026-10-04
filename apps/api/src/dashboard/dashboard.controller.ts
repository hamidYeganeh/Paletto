import {Controller, Get} from "@nestjs/common"
import { DashboardService } from "./dashboard.service"
import { CurrentUser } from "@/common/decorators/current-user.decorator"
import type { UserDocument } from "@/users/schemas/user.schema"

@Controller("dashboard")
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  overview(@CurrentUser() user: UserDocument) {
    return this.dashboard.overview({
      id: String(user._id),
      role: user.role,
    })
  }
}
