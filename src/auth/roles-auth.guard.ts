import {CanActivate, ExecutionContext, ForbiddenException, Injectable} from "@nestjs/common";
import {Observable} from "rxjs";
import {Reflector} from "@nestjs/core";
import {ROLES_KEYS} from "./roles-auth.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {
    }

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const requiredRoles = this.reflector.get<string[]>(ROLES_KEYS, context.getHandler());

        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            throw new ForbiddenException('User not authorized');
        }

        if (!user.roles || !Array.isArray(user.roles)) {
            throw new ForbiddenException('User has no roles');
        }

        if (!user || !user.roles) {
            throw new ForbiddenException('User is not authorized of has no roles');
        }

        const userRolesValues = user.roles.map((role: any) => role.value);
        const hasRole = requiredRoles.some(role => userRolesValues.includes(role));
        if (!hasRole) {
            throw new ForbiddenException('No permissions');
        }
        return true;
    }

}