import { Column, Entity, PrimaryColumn } from 'typeorm';
@Entity("user")
export class UserSQL {
    @PrimaryColumn()
    id: number

    @Column()
    username: string

    @Column()
    hashedPassword: string

    @Column()
    encryptedPrivateKey: string

    @Column()
    publicKey: string
}