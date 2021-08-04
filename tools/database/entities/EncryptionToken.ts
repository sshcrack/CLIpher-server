import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity("encryption_key")
export class EncryptionKeySQL {
    @PrimaryColumn()
    username: string

    @Column()
    key: string

    @Column()
    privateKey: string

    @Column({ type: "timestamp with time zone" })
    expiresAt: Date

    @Column()
    ip: string
}