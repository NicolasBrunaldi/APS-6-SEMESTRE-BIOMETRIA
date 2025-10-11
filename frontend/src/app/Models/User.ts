export class User{

    nome: string;
    email: string;
    telefone: string;
    nivelAcesso: number;
    foto: string; // Base64

    constructor(nome: string, email: string, telefone: string, nivelAcesso: number, foto: string) {
        this.nome = nome;
        this.email = email;
        this.telefone = telefone;
        this.nivelAcesso = nivelAcesso;
        this.foto = foto;
    }

}