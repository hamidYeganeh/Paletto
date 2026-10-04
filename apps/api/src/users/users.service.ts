import { Injectable, NotFoundException } from "@nestjs/common"
import { InjectModel } from "@nestjs/mongoose"
import { Model, Types } from "mongoose"
import { User, UserDocument } from "@/users/schemas/user.schema"
import { AuthService } from "@/auth/auth.service"
import { taxonomy } from "./taxonomy"

export { taxonomy }

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly users: Model<UserDocument>,
    private readonly auth: AuthService
  ) {}

  async updateProfile(
    userId: string,
    input: {
      name: string
      bio: string
      city: string
      disciplines: string[]
      marketingConsent: boolean
    }
  ) {
    const user = await this.users.findByIdAndUpdate(
      userId,
      { $set: input },
      { new: true }
    )
    if (!user) throw new NotFoundException()
    return this.auth.toPublic(user)
  }

  /** Public artist/curator profiles for the catalog page. */
  async listArtists(): Promise<ReturnType<AuthService["toPublic"]>[]> {
    const users = await this.users
      .find({ role: { $in: ["artist", "curator"] } })
      .limit(200)
      .lean()
    return users.map((u) =>
      this.auth.toPublic(u as unknown as UserDocument)
    )
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.users.findOne({ email: email.toLowerCase() })
  }

  async findById(id: string): Promise<UserDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null
    return this.users.findById(id)
  }
}
