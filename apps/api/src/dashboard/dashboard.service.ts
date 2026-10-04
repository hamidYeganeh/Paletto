import { Injectable } from "@nestjs/common"
import { AuthService } from "@/auth/auth.service"
import { UsersService } from "@/users/users.service"
import { OrdersService } from "@/orders/orders.service"
import { EntitiesService } from "@/entities/entities.service"
import { CampaignsService } from "@/campaigns/campaigns.service"
import { RequestsService } from "@/requests/requests.service"
import { SocialService } from "@/social/social.service"
import { AuditService } from "@/audit/audit.service"

/**
 * Read-model aggregation for the user dashboard. Composes domain services
 * instead of touching collections directly, keeping module boundaries intact.
 */
@Injectable()
export class DashboardService {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
    private readonly orders: OrdersService,
    private readonly entities: EntitiesService,
    private readonly campaigns: CampaignsService,
    private readonly requests: RequestsService,
    private readonly social: SocialService,
    private readonly audit: AuditService
  ) {}

  async overview(actor: { id: string; role: string }) {
    const user = await this.users.findById(actor.id)
    if (!user) return null
    const [entities, orders, campaigns, requests, saves, auditLog] =
      await Promise.all([
        this.entities.mine(actor),
        this.orders.ownedByOrManaged(actor),
        this.campaigns.statsForOwner(actor.id),
        this.requests.forUser(actor.id, actor.role),
        this.social.mine(actor.id),
        actor.role === "admin" ? this.audit.recent(100) : Promise.resolve([]),
      ])
    return {
      user: this.auth.toPublic(user),
      ...entities,
      orders,
      campaigns,
      requests,
      saves,
      users: actor.role === "admin" ? await this.users.listArtists() : [],
      audit: auditLog,
    }
  }
}
