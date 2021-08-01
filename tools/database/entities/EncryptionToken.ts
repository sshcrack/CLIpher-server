import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity("encryption_key")
export class EncryptionKeySQL {
    @PrimaryColumn()
    username: string

    @Column()
    key: string

    @Column()
    privateKey: string

    @Column()
    expiresAt: number

    @Column()
    ip: string
}