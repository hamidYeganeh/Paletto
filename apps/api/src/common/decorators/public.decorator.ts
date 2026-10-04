import { SetMetadata } from "@nestjs/common"

export const IS_PUBLIC_KEY = "isPublic"
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true)

/** Attach user if a token is present, but do not require one. */
export const OptionalAuth = () => SetMetadata("optionalAuth", true)
