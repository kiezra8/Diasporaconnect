import { Injectable, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  KEYS, ALL_KEYS, ADMIN_ONLY_KEYS, WRITER_ROLES, MEMBER_WRITABLE, MEMBER_ALLOWED_STATUS,
  MEMBER_PROFILE_FIELDS, MEMBER_READ_OWN, MEMBER_READ_ALL,
} from './state.keys';

export interface AuthUser { id: string; email: string; fullName: string; role: string }

@Injectable()
export class StateService {
  constructor(private prisma: PrismaService) {}

  async getValue<T = any>(key: string, fallback: T): Promise<T> {
    const row = await this.prisma.appState.findUnique({ where: { key } });
    return row ? (row.value as unknown as T) : fallback;
  }

  /** Server-side write used by payments etc. (read-modify-write inside a transaction, bumps the version). */
  async mutate<T = any>(key: string, fallback: T, fn: (current: T) => T, by = 'system'): Promise<{ value: T; version: number; updatedAt: Date }> {
    return this.prisma.$transaction(async tx => {
      const row = await tx.appState.findUnique({ where: { key } });
      const next = fn(row ? (row.value as unknown as T) : fallback);
      const saved = row
        ? await tx.appState.update({ where: { key }, data: { value: next as any, version: row.version + 1, updatedBy: by } })
        : await tx.appState.create({ data: { key, value: next as any, version: 1, updatedBy: by } });
      return { value: saved.value as unknown as T, version: saved.version, updatedAt: saved.updatedAt };
    });
  }

  /** The member record (in the shared members collection) that belongs to this login. */
  async memberIdFor(user: AuthUser): Promise<string | null> {
    const members = await this.getValue<any[]>(KEYS.MEMBERS, []);
    const m = members.find(x => (x.email || '').toLowerCase() === user.email.toLowerCase());
    return m ? m.memberId : null;
  }

  async list(user: AuthUser, since?: string) {
    const where: Prisma.AppStateWhereInput = since ? { updatedAt: { gt: new Date(since) } } : {};
    const rows = await this.prisma.appState.findMany({ where, orderBy: { updatedAt: 'asc' } });
    if (user.role !== 'MEMBER') {
      return rows.map(r => ({ key: r.key, value: r.value, version: r.version, updatedAt: r.updatedAt.toISOString() }));
    }
    const memberId = await this.memberIdFor(user);
    const members = await this.getValue<any[]>(KEYS.MEMBERS, []);
    const me = members.find(m => m.memberId === memberId);
    return rows
      .filter(r => MEMBER_READ_OWN.has(r.key) || MEMBER_READ_ALL.has(r.key))
      .map(r => ({ key: r.key, value: MEMBER_READ_OWN.has(r.key) ? this.ownRows(r.key, r.value, memberId, me) : r.value, version: r.version, updatedAt: r.updatedAt.toISOString() }));
  }

  private ownRows(key: string, value: any, memberId: string | null, me: any) {
    if (!Array.isArray(value) || !memberId) return [];
    if (key === KEYS.TRANSACTIONS) {
      return value.filter(t => `${t.category} ${t.description}`.includes(memberId) || (me?.name && `${t.category} ${t.description}`.includes(me.name)));
    }
    if (key === KEYS.DIVIDENDS) {
      return value.map(d => ({ ...d, rows: (d.rows || []).filter((r: any) => r.memberId === memberId) }));
    }
    return value.filter(x => x.memberId === memberId || x.id === memberId);
  }

  async put(user: AuthUser, key: string, value: any, baseVersion: number | null, force = false) {
    if (!ALL_KEYS.has(key)) throw new BadRequestException(`Unknown collection ${key}`);
    if (user.role === 'MEMBER') return this.memberMerge(user, key, value);
    if (!WRITER_ROLES.has(user.role)) throw new ForbiddenException('Your role is read-only.');
    if (ADMIN_ONLY_KEYS.has(key) && user.role !== 'ADMIN') throw new ForbiddenException('Only the Administrator can change this.');
    if (force && user.role !== 'ADMIN') throw new ForbiddenException('Only the Administrator can overwrite server data.');

    return this.prisma.$transaction(async tx => {
      const row = await tx.appState.findUnique({ where: { key } });
      if (row && !force && baseVersion !== row.version) {
        throw new ConflictException({ message: 'This data was changed by someone else. Reload and try again.', version: row.version });
      }
      const saved = row
        ? await tx.appState.update({ where: { key }, data: { value, version: row.version + 1, updatedById: user.id, updatedBy: user.fullName } })
        : await tx.appState.create({ data: { key, value, version: 1, updatedById: user.id, updatedBy: user.fullName } });
      return { key, version: saved.version, updatedAt: saved.updatedAt.toISOString() };
    });
  }

  /** Members never overwrite a collection: their own new/pending items are merged into the server copy. */
  private async memberMerge(user: AuthUser, key: string, incoming: any) {
    if (!MEMBER_WRITABLE.has(key)) throw new ForbiddenException('Members cannot change this data.');
    if (!Array.isArray(incoming)) throw new BadRequestException('Expected a list');
    const memberId = await this.memberIdFor(user);
    if (!memberId) throw new ForbiddenException('No member record is linked to this login.');

    const result = await this.mutate<any[]>(key, [], current => {
      const list = Array.isArray(current) ? [...current] : [];
      if (key === KEYS.MEMBERS) {
        const mine = incoming.find(m => m.memberId === memberId);
        const i = list.findIndex(m => m.memberId === memberId);
        if (mine && i >= 0) MEMBER_PROFILE_FIELDS.forEach(f => { if (mine[f] !== undefined) list[i] = { ...list[i], [f]: mine[f] }; });
        return list;
      }
      const allowed = MEMBER_ALLOWED_STATUS[key] || [];
      incoming
        .filter(item => item && item.memberId === memberId && allowed.includes(item.status))
        .forEach(item => {
          const i = list.findIndex(x => x.id === item.id);
          if (i < 0) list.unshift(item);                                   // new submission
          else if (allowed.includes(list[i].status)) list[i] = item;       // still pending → may edit
        });
      return list;
    }, user.fullName);

    // send back what this member is allowed to see
    const members = await this.getValue<any[]>(KEYS.MEMBERS, []);
    return { key, version: result.version, updatedAt: result.updatedAt.toISOString(), value: this.ownRows(key, result.value, memberId, members.find(m => m.memberId === memberId)) };
  }
}
