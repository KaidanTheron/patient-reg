export abstract class Encrypter {
    abstract encrypt(plaintext: string): Promise<string>;

    abstract decrypt(ciphertext: string): Promise<string>;
}