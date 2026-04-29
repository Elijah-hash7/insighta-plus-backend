import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  github_id: string;       

  @Column()
  email: string;              

  @Column({ nullable: true })
  display_name: string;       

  @Column({ nullable: true })
  avatar_url: string;        

  @Column({ default: 'analyst' })
  role: string;               

  @Column({ nullable: true })
  refresh_token_hash: string; 

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
