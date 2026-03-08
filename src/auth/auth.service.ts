// src/auth/auth.service.ts
import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'prisma/prisma.service';
import { Prisma } from '@prisma/client';

type JwtPayload = {
  sub: string;
  email: string;
  role: 'ADMIN' | 'EDITOR' | 'VIEWER';
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly cfg: ConfigService,
  ) {}

  private async hashPassword(p: string) {
    return bcrypt.hash(p, 12);
  }
  private async comparePassword(p: string, h: string) {
    return bcrypt.compare(p, h);
  }

  private async signAccessToken(user: {
    id: string;
    email: string;
    role: string;
  }) {
    const secret = this.cfg.get<string>('JWT_ACCESS_SECRET');
    if (!secret) throw new Error('JWT_ACCESS_SECRET is missing');
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role as any,
    };
    const expiresIn = this.cfg.get<string>('JWT_ACCESS_EXPIRES_IN') || '15m';
    return this.jwt.signAsync(payload, { secret, expiresIn });
  }

  private async signRefreshToken(user: {
    id: string;
    email: string;
    role: string;
  }) {
    const secret = this.cfg.get<string>('JWT_REFRESH_SECRET');
    if (!secret) throw new Error('JWT_REFRESH_SECRET is missing');
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role as any,
    };
    const expiresIn = this.cfg.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';
    return this.jwt.signAsync(payload, { secret, expiresIn });
  }

  async register(input: { email: string; name?: string; password: string }) {
    const passwordHash = await this.hashPassword(input.password);
    try {
      const user = await this.prisma.user.create({
        data: {
          email: input.email,
          name: input.name ?? null,
          passwordHash,
          role: 'VIEWER',
        },
        select: { id: true, email: true, role: true, name: true },
      });

      const [accessToken, refreshToken] = await Promise.all([
        this.signAccessToken(user),
        this.signRefreshToken(user),
      ]);

      return { user, accessToken, refreshToken };
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        // unique constraint violation (email)
        throw new ConflictException('Email already registered');
      }
      throw e;
    }
  }

  async login(email: string, password: string) {
    const u = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        passwordHash: true,
      },
    });
    if (!u?.passwordHash)
      throw new UnauthorizedException('Invalid credentials');

    const ok = await this.comparePassword(password, u.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const user = { id: u.id, email: u.email, role: u.role, name: u.name };
    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessToken(user),
      this.signRefreshToken(user),
    ]);

    return { user, accessToken, refreshToken }; // <-- REQUIRED
  }

  async refresh(refreshToken: string) {
    const payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken, {
      secret: this.cfg.get<string>('JWT_REFRESH_SECRET')!,
    });
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, name: true },
    });
    if (!user) throw new UnauthorizedException('User not found');

    const [accessToken, nextRefreshToken] = await Promise.all([
      this.signAccessToken(user),
      this.signRefreshToken(user),
    ]);

    return { user, accessToken, refreshToken: nextRefreshToken }; // <-- REQUIRED
  }

  async verifyUserToken(accessToken: string) {
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string }>(accessToken, {
        secret: this.cfg.get<string>('JWT_ACCESS_SECRET')!, // access secret
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, role: true, name: true },
      });

      if (!user) throw new UnauthorizedException('User not found');
      return user; // attached as req.user by the guard
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
