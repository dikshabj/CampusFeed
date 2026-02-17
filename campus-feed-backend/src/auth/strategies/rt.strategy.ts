import { ForbiddenException, Injectable } from "@nestjs/common";
import { Request } from "express";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

@Injectable()
export class RtStrategy extends PassportStrategy(Strategy, 'jwt-refresh'){
    constructor(config: ConfigService){
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: config.get<string>('JWT_REFRESH_SECRET')!,
            passReqToCallback: true,
        });
    }

    validate(req: Request, payload: any){
        const refreshToken = req.headers.authorization?.replace('Bearer' , '').trim();
        if(!refreshToken) throw new ForbiddenException('Refresh Token Malformed');
        return {
            ...payload,
            refreshToken,
        };

    }
}