import { Column, Entity, PrimaryColumn } from 'typeorm';
@Entity("user")
export class UserSQL {
    @PrimaryColumn()
    username: string

    @Column()
    hashedPassword: string

    @Column()
    encryptedPrivateKey: string

    @Column()
    publicKey: string
}