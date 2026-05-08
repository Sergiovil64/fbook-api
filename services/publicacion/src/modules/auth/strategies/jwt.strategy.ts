import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}/.well-known/jwks.json`,
      }),
      algorithms: ['RS256'],
    });
  }

  async validate(payload: Record<string, unknown>) {
    if (!payload?.sub) {
      throw new UnauthorizedException();
    }
    return {
      userId:   payload['sub'] as string,
      username: payload['cognito:username'] as string,
      email:    payload['email'] as string,
      roles:    (payload['cognito:groups'] as string[]) ?? [],
    };
  }
}
