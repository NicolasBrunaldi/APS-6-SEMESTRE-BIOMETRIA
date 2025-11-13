import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../Models/User';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class CadastroService {


  private readonly URL_CADASTRO = 'http://localhost:5000/api/user/cadastrar-user';

  constructor(private httpClient : HttpClient) { }


  cadastrarUsuario(user: User) : Observable<User> {
    return this.httpClient.post<User>(this.URL_CADASTRO, user);
  }
}
