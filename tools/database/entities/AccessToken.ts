import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity("access_token")
export class AccessTokenSQL {
    @PrimaryGeneratedColumn()
    id?: string

    @Column()
    username: string

    @Column()
    token: string

    @Column({ type: "timestamp with time zone" })
    expiresAt: Date
}