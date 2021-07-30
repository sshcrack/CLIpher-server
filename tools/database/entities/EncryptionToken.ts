import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity("encryption_token")
export class EncryptionTokenSQL {
    @PrimaryColumn()
    username: string

    @Column()
    token: string

    @Column()
    ip: string
}