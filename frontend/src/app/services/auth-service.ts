import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly URL_CODIGO_SEGURANCA = 'http://localhost:5000/api/auth/validar-codigo-seguranca';
  private readonly URL_VALIDACAO_IMAGEM = 'http://localhost:5000/api/auth/validar-imagem-usuario';

  constructor(private httpClient : HttpClient) { }



  getCodigoSeguranca(codigoSeguranca: number) : Observable<boolean> {
    return this.httpClient.post<boolean>(this.URL_CODIGO_SEGURANCA, { codigoSeguranca });
  }

  validaImagemUsuario(imagemBase64: string, nivelAcesso: number) : Observable<boolean> {
    console.log('Chamando validaImagemUsuario com nivelAcesso');
    return this.httpClient.post<boolean>(this.URL_VALIDACAO_IMAGEM, { imagemBase64, nivelAcesso });
  }
}
