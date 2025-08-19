import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import { createSecretKey } from 'crypto';
import { SignJWT, jwtVerify, JWTPayload } from 'jose';
import { PrismaService } from 'prisma/prisma.service';
import * as argon2 from 'argon2';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  private get secret() {
    const key = process.env.JWT_DEV_SECRET ?? 'dev-secret-change-me';
    return createSecretKey(Buffer.from(key, 'utf-8'));
  }

  private get issuer() {
    return process.env.JWT_ISSUER ?? 'dev';
  }

  private get audience() {
    return process.env.JWT_AUDIENCE ?? 'dev';
  }

  // ===== LOCAL REGISTER =====
  async register(
    email: string,
    password: string,
    name?: string,
    role: Role = Role.EDITOR,
  ) {
    const exists = await this.prisma.user.findUnique({ where: { email } });
    if (exists) throw new ConflictException('Email je već registrovan');

    const passwordHash = await argon2.hash(password);
    const user = await this.prisma.user.create({
      data: { email, name: name ?? null, role, passwordHash },
    });
    return this.signUserToken(
      user.id,
      user.email,
      user.role,
      user.name ?? undefined,
    );
  }

  // ===== LOCAL LOGIN =====
  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash)
      throw new UnauthorizedException('Neispravni kredencijali');

    const ok = await argon2.verify(user.passwordHash, password);
    if (!ok) throw new UnauthorizedException('Neispravni kredencijali');

    return this.signUserToken(
      user.id,
      user.email,
      user.role,
      user.name ?? undefined,
    );
  }

  signUserToken(userId: string, email: string, role: Role, name?: string) {
    const payload = { userId, email, role, name: name ?? null };
    const accessToken = this.jwt.sign(payload, {
      subject: userId,
      secret: process.env.JWT_SECRET!,
      audience: process.env.JWT_AUDIENCE ?? 'app',
      issuer: process.env.JWT_ISSUER ?? 'app',
      expiresIn: process.env.JWT_EXPIRES ?? '7d',
    });
    return { accessToken };
  }

  verifyUserToken(token: string) {
    return this.jwt.verify(token, {
      secret: process.env.JWT_SECRET!,
      audience: process.env.JWT_AUDIENCE ?? 'app',
      issuer: process.env.JWT_ISSUER ?? 'app',
    });
  }

  async signDevToken(payload: JWTPayload) {
    return new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setIssuer(this.issuer)
      .setAudience(this.audience)
      .setExpirationTime('7d')
      .sign(this.secret);
  }

  async verifyDevToken(token: string) {
    const { payload } = await jwtVerify(token, this.secret, {
      issuer: this.issuer,
      audience: this.audience,
    });
    return payload as JWTPayload & {
      sub: string;
      email: string;
      name?: string;
      role?: string;
    };
  }
}
