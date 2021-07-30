import { Column, Entity, PrimaryColumn } from 'typeorm';
@Entity("accounts")
export class AccountSQL {
    @PrimaryColumn()
    id: number

    @Column()
    username: string

    @Column()
    hashedPassword: string

    @Column()
    encryptedPrivKey: string

    @Column()
    publicKey: string
}