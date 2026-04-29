import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/user.service';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) { }


    // Takes the GitHub code, talks to GitHub, finds/creates user, returns tokens
    async githubLogin(code: string, code_verifier: string, isCli: boolean = false) {
        // Exchange code for GitHub access token
        const githubToken = await this.exchangeCodeForToken(code, code_verifier, isCli);

        // Use GitHub token to get user's profile
        const githubUser = await this.getGithubUser(githubToken);

        // Find or create user in OUR database
        const user = await this.usersService.findOrCreate({
            github_id: String(githubUser.id),
            email: githubUser.email || `${githubUser.login}@github.com`,
            display_name: githubUser.name || githubUser.login,
            avatar_url: githubUser.avatar_url,
        });

        // Generate OUR tokens
        const tokens = await this.generateTokens(user.id, user.role);

        // Store hashed refresh token in database
        const hash = await bcrypt.hash(tokens.refresh_token, 10);
        await this.usersService.updateRefreshTokenHash(user.id, hash);

        return { user, ...tokens };
    }

    // Refresh: give me a new access token using the refresh token
    async refreshTokens(userId: string, refreshToken: string) {
        const user = await this.usersService.findById(userId);
        if (!user || !user.refresh_token_hash) {
            throw new UnauthorizedException('Access denied');
        }

        // Check if the refresh token matches what we have stored
        const matches = await bcrypt.compare(refreshToken, user.refresh_token_hash);
        if (!matches) {
            throw new UnauthorizedException('Access denied');
        }

        // Generate fresh tokens
        const tokens = await this.generateTokens(user.id, user.role);
        const hash = await bcrypt.hash(tokens.refresh_token, 10);
        await this.usersService.updateRefreshTokenHash(user.id, hash);

        return tokens;
    }

    // Logout: clear the refresh token so it can't be used again
    async logout(userId: string) {
        await this.usersService.updateRefreshTokenHash(userId, null);
    }

    async getMe(userId: string) {
        const user = await this.usersService.findById(userId);
        if (!user) throw new UnauthorizedException('User not found');
        // Return user info WITHOUT the refresh token hash
        const { refresh_token_hash, ...safeUser } = user;
        return { status: 'success', data: safeUser };
    }



    private async exchangeCodeForToken(code: string, code_verifier: string, isCli: boolean): Promise<string> {
        const clientId = isCli ? this.configService.get('GITHUB_CLI_CLIENT_ID') : this.configService.get('GITHUB_CLIENT_ID');
        const clientSecret = isCli ? this.configService.get('GITHUB_CLI_CLIENT_SECRET') : this.configService.get('GITHUB_CLIENT_SECRET');

        const response = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            body: JSON.stringify({
                client_id: clientId,
                client_secret: clientSecret,
                code,
                code_verifier,
            }),
        });

        const data = await response.json();
        if (data.error) {
            throw new UnauthorizedException(`GitHub OAuth failed: ${data.error_description}`);
        }
        return data.access_token;
    }

    private async getGithubUser(accessToken: string): Promise<any> {
        const response = await fetch('https://api.github.com/user', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        return response.json();
    }

    private async generateTokens(userId: string, role: string) {
        const payload = { sub: userId, role };

        const [access_token, refresh_token] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: this.configService.get('JWT_SECRET'),
                expiresIn: '15m',
            }),
            this.jwtService.signAsync(payload, {
                secret: this.configService.get('JWT_REFRESH_SECRET'),
                expiresIn: '7d',
            }),
        ]);

        return { access_token, refresh_token };
    }
}
