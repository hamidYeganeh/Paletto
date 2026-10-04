import { Injectable } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import { InjectModel } from "@nestjs/mongoose"
import { Model, Types } from "mongoose"
import * as bcrypt from "bcryptjs"
import { createHash, randomBytes } from "node:crypto"
import {
  ConflictError,
  UnauthorizedError,
  ValidationError,
} from "@/common/errors/domain.errors"
import {
  Session,
  SessionDocument,
} from "@/audit/schemas/session.schema"
import {
  ROLES,
  User,
  UserDocument,
} from "@/users/schemas/user.schema"

const SESSION_TTL_MS = 7 * 24 * 3600 * 1000

export type PublicUser = {
  id: string
  name: string
  email: string
  role: string
  bio: string
  city: string
  disciplines: string[]
  marketingConsent: boolean
  createdAt?: Date
}

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly users: Model<UserDocument>,
    @InjectModel(Session.name) private readonly sessions: Model<SessionDocument>,
    private readonly jwt: JwtService
  ) {}

  toPublic(user: UserDocument): PublicUser {
    return {
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      bio: user.bio,
      city: user.city,
      disciplines: user.disciplines ?? [],
      marketingConsent: user.marketingConsent,
      createdAt: (user as unknown as { createdAt?: Date }).createdAt,
    }
  }

  async register(input: {
    email: string
    password: string
    name?: string
    role?: string
  }): Promise<{ user: PublicUser; token: string }> {
    const existing = await this.users.exists({ email: input.email })
    if (existing) throw new ConflictError("این ایمیل قبلاً ثبت شده است.")
    const passwordHash = await bcrypt.hash(input.password, 12)
    const role =
      input.role && (ROLES as readonly string[]).includes(input.role)
        ? (input.role as (typeof ROLES)[number])
        : "enthusiast"
    const user = await this.users.create({
      email: input.email,
      passwordHash,
      name: input.name?.trim() || "عضو پالتو",
      role,
    })
    return this.issueSession(user)
  }

  async login(input: { email: string; password: string }) {
    const user = await this.users.findOne({ email: input.email })
    const ok =
      user &&
      (await bcrypt.compare(input.password, user.passwordHash).catch(() => false))
    if (!user || !ok) throw new UnauthorizedError("ایمیل یا رمز عبور درست نیست.")
    return this.issueSession(user)
  }

  async logout(token: string): Promise<void> {
    await this.sessions.deleteOne({ tokenHash: this.hash(token) })
  }

  async changePassword(
    userId: string,
    input: { currentPassword: string; newPassword: string },
    currentToken: string
  ): Promise<void> {
    const user = await this.users.findById(userId)
    if (!user) throw new UnauthorizedError()
    const ok = await bcrypt
      .compare(input.currentPassword, user.passwordHash)
      .catch(() => false)
    if (!ok) throw new ValidationError("رمز فعلی درست نیست.")
    user.passwordHash = await bcrypt.hash(input.newPassword, 12)
    await user.save()
    // Close every other session; keep the current device signed in.
    await this.sessions.deleteMany({
      userId: user._id,
      tokenHash: { $ne: this.hash(currentToken) },
    })
  }

  private async issueSession(user: UserDocument) {
    const token = randomBytes(32).toString("hex")
    await this.sessions.create({
      tokenHash: this.hash(token),
      userId: user._id,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    })
    const payload = { sub: String(user._id), role: user.role }
    return {
      user: this.toPublic(user),
      token: await this.jwt.signAsync(payload),
    }
  }

  /** Bearer tokens are random; the JWT carries identity, the DB grants validity. */
  private async verifySession(token: string): Promise<UserDocument | null> {
    const session = await this.sessions.findOne({
      tokenHash: this.hash(token),
      expiresAt: { $gt: new Date() },
    })
    if (!session) return null
    return this.users.findById(session.userId)
  }

  private hash(value: string): string {
    return createHash("sha256").update(value).digest("hex")
  }

  async resolveUserFromToken(token: string): Promise<UserDocument | null> {
    return this.verifySession(token)
  }

  async countSessions(userId: Types.ObjectId): Promise<number> {
    return this.sessions.countDocuments({ userId })
  }
}
