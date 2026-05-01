import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  
  async findByGithubId(githubId: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { github_id: githubId } });
  }

  
  async findById(id: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { id } });
  }

  
  async findOrCreate(githubData: {
    github_id: string;
    email: string;
    display_name: string;
    avatar_url: string;
  }): Promise<User> {
    let user = await this.findByGithubId(githubData.github_id);
    if (user) {
      user.email = githubData.email;
      user.display_name = githubData.display_name;
      user.avatar_url = githubData.avatar_url;
      return this.userRepo.save(user);
    }
    return this.userRepo.save(this.userRepo.create(githubData));
  }

  async updateRefreshTokenHash(userId: string, hash: string | null): Promise<void> {
    await this.userRepo.update(userId, { refresh_token_hash: hash });
  }

  async setRole(userId: string, role: string): Promise<void> {
    await this.userRepo.update(userId, { role });
  }
}
