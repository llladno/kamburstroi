import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(login: string, password: string): Promise<{ accessToken: string }> {
    const admin = await this.prisma.adminUser.findUnique({ where: { login } });
    if (!admin) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }

    const passwordMatches = await bcrypt.compare(password, admin.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }

    const accessToken = await this.jwt.signAsync({ sub: admin.id, login: admin.login });
    return { accessToken };
  }
}
