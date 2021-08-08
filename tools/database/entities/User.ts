import { Column, Entity, PrimaryColumn } from 'typeorm';
@Entity("user")
export class UserSQL {
    @PrimaryColumn({comment: "User's username"})
    username: string

    @Column({ comment: "User's hashed password by bcrypt"})
    hashedPassword: string

    @Column({comment: "This is the encrypted 2FA Secret of this user (encrypted with the password of him)"})
    TFASecret: string

    @Column({ default: false, comment: "Indicates if the user has verified its 2FA Login" })
    TFAVerified: boolean

    @Column({ comment: "Private key used for decrypting user's password on login/register request" })
    privateKey: string

    @Column({ comment: "Public key which is used by the client to encrypt their password and send it to the server"})
    publicKey: string
}