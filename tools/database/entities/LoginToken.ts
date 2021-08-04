import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity("login_token")
export class LoginTokenSQL {
    @PrimaryGeneratedColumn()
    id?: string

    @Column()
    username: string

    @Column()
    token: string

    @Column()
    encryptedPassword: string

    @Column({ type: "timestamp with time zone" })
    expiresAt: Date
}