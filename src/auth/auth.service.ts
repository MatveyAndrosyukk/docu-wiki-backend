import {Injectable} from '@nestjs/common';
import {CreateUserDto} from "../users/dto/create-user.dto";
import {UsersService} from "../users/users.service";
import * as bcrypt from 'bcryptjs';
import {User} from "../users/users.model";
import {JwtService} from "@nestjs/jwt";
import {EmailService} from "../email/email.service";
import {OAuth2Client} from 'google-auth-library';

@Injectable()
export class AuthService {
    private client: OAuth2Client;

    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private emailService: EmailService,
    ) {
        this.client = new OAuth2Client(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            'postmessage'
        );
    }

    async register(dto: CreateUserDto) {
        const {email, password} = dto;
        const candidate = await this.usersService.findByEmail(email);
        const candidateByUsername = await this.usersService.findByUsername(dto.name);

        if (candidate) {
            throw new Error(`Email is already registered`);
        }

        if (candidateByUsername) {
            throw new Error('Username is already registered');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await this.usersService.save({
            email,
            password: hashedPassword,
            name: dto.name
        });

        const confirmToken = this.jwtService.sign(
            {email: user.email, id: user.id},
            {expiresIn: '1h'}
        );
        await this.emailService.sendVerificationEmail(email, confirmToken);

        return {message: 'Confirmation email sent'};
    }

    async googleLogin(code: string) {
        const {tokens} = await this.client.getToken(code);
        this.client.setCredentials(tokens);

        const ticket = await this.client.verifyIdToken({
            idToken: tokens.id_token!,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            throw new Error('Unable to get Google user info');
        }

        let user = await this.usersService.findByEmail(payload.email);

        if (!user) {
            const name = await this.usersService.generateUniqueNameFromGoogle(
                payload.given_name,
                payload.family_name,
            );

            user = await this.usersService.save({
                email: payload.email,
                name,
                password: '',
            });
        }

        if (user.banned) {
            throw new Error('User is banned');
        }

        const jwtPayload = {
            email: user.email,
            id: user.id,
            roles: user.roles.map(role => role.value)
        };

        const accessToken = this.jwtService.sign(jwtPayload, { expiresIn: '15m' });
        const refreshToken = this.jwtService.sign(jwtPayload, { expiresIn: '7d' });

        return {
            accessToken,
            refreshToken,
            user,
        };
    }

    async login(dto: CreateUserDto) {
        const user = await this.validateUser(dto);
        return this.generateTokens(user);
    }

    async refresh(refreshToken: string) {
        try {
            const payload = this.jwtService.verify(refreshToken);

            const user = await this.usersService.findById(payload.id);
            if (!user) {
                throw new Error('User not found!')
            }

            return this.generateTokens(user);
        } catch (error) {
            throw new Error('Invalid refresh token');
        }
    }

    async generateTokens(user: User) {
        const fullUser = await this.usersService.findById(user.id);

        const payload = {
            email: fullUser?.email,
            id: fullUser?.id,
            roles: fullUser?.roles.map(role => role.value)
        };

        const accessToken = this.jwtService.sign(payload, {expiresIn: '15m'});
        const refreshToken = this.jwtService.sign(payload, {expiresIn: '7d'})

        return {accessToken, refreshToken};
    }

    async verify(token: string): Promise<void> {
        const payload = await this.jwtService.verify(token);
        const user = await this.usersService.findById((payload as any).id);
        if (!user) {
            throw new Error('User not found');
        }
        user.isConfirmed = true;
        await this.usersService.save(user);
    }

    private async validateUser(dto: CreateUserDto): Promise<User> {
        const {email, password} = dto;
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            throw new Error(`Email ${email} not registered`);
        }
        const passwordEqual = await bcrypt.compare(password, user.password);
        if (!passwordEqual) {
            throw new Error('Password is incorrect');
        }
        if (user.banned) {
            throw new Error('User is banned');
        }
        return user;
    }

    async forgotPassword(email: string): Promise<{ message: string }> {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            throw new Error('User not found');
        }
        const resetToken = this.jwtService.sign(
            {email: user.email, id: user.id, type: 'reset'},
            {expiresIn: '1h'}
        );
        await this.emailService.sendResetPasswordEmail(user.email, resetToken);
        return {message: 'Link has been sent to email address'};
    }

    async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
        const payload = await this.jwtService.verify(token);
        if ((payload as any).type !== 'reset') {
            throw new Error('Invalid token');
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await this.usersService.updatePassword((payload as any).id, hashedPassword);
        return {message: 'Password was reset successfully'};
    }
}