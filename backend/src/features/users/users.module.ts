import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { LocalStrategy } from './strategies/local.strategy';
import { jwtDuration, jwtSecret } from './constants';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RoleBasedSerializerInterceptor } from './interceptors/role-based-serializer.interceptor';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule,
    JwtModule.register({
      secret: jwtSecret,
      signOptions: {
        expiresIn: jwtDuration,
      },
    }),
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    LocalStrategy,
    JwtStrategy,
    {
      provide: APP_INTERCEPTOR,
      useClass: RoleBasedSerializerInterceptor,
    },
  ],
  exports: [UsersService],
})
export class UsersModule {}
