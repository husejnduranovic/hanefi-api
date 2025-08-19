import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { DevLoginDto } from './dto/dev-login.dto';
import { DevJwtGuard } from './guards/dev-jwt.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { Role } from '../common/enums/role.enum';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('dev-login')
  async devLogin(@Body() dto: DevLoginDto) {
    // For dev: use email as sub
    const payload = {
      sub: dto.email,
      email: dto.email,
      name: dto.name,
      role: dto.role ?? Role.VIEWER,
    };
    const accessToken = await this.auth.signDevToken(payload);
    return { accessToken };
  }

  // REGISTER (stvara usera sa hash lozinkom)
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const { accessToken } = await this.auth.register(
      dto.email,
      dto.password,
      dto.name,
    );
    return { accessToken };
  }

  // LOGIN (vrati JWT)
  @Post('login')
  async login(@Body() dto: LoginDto) {
    const { accessToken } = await this.auth.login(dto.email, dto.password);
    return { accessToken };
  }

  // @UseGuards(DevJwtGuard)
  // @Get('me')
  // async meDev(@CurrentUser() user: any) {
  //   return { user };
  // }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() user: any) {
    return { user };
  }
}
