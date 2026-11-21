import { CanActivate, ExecutionContext, ForbiddenException, Injectable, SetMetadata, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SupabaseService } from '../supabase/supabase.service';

export type AppRole = 'ADMIN' | 'ACCOUNTANT' | 'SECRETARY' | 'BOARD_MEMBER' | 'FARM_WORKER' | 'MEMBER';
export interface AuthUser { id: string; email: string; role: AppRole; memberId: string | null; fullName: string }

export const ROLES_KEY = 'roles';
/** Restrict an endpoint to these roles (from the `profiles` table in Supabase). */
export const Roles = (...roles: AppRole[]) => SetMetadata(ROLES_KEY, roles);

/**
 * Accepts the Supabase access token the portal sends (`Authorization: Bearer …`), checks it with
 * Supabase Auth, and loads the user's role and member number from `profiles`.
 */
@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(private supabase: SupabaseService, private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const header: string = req.headers?.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!token) throw new UnauthorizedException('Sign in required.');

    const { data, error } = await this.supabase.db.auth.getUser(token);
    if (error || !data?.user) throw new UnauthorizedException('Your session has expired. Please sign in again.');

    const { data: profile } = await this.supabase.db.from('profiles').select('email, role, member_id, full_name, active').eq('id', data.user.id).maybeSingle();
    if (!profile || !profile.active) throw new ForbiddenException('This account is not active.');

    const user: AuthUser = { id: data.user.id, email: profile.email, role: profile.role, memberId: profile.member_id, fullName: profile.full_name || profile.email };
    req.user = user;

    const roles = this.reflector.getAllAndOverride<AppRole[]>(ROLES_KEY, [context.getHandler(), context.getClass()]);
    if (roles?.length && !roles.includes(user.role)) {
      throw new ForbiddenException(`Your role (${user.role}) cannot do this. Required: ${roles.join(', ')}.`);
    }
    return true;
  }
}
