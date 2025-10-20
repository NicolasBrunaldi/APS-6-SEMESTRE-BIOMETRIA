import { Component, OnInit } from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SecurityCodeModal } from '../security-code-modal/security-code-modal';
import { CadastroUserModal } from '../cadastro-user-modal/cadastro-user-modal';
import { ValidacaoFacialModal } from '../validacao-facial--modal/validacao-facial-modal';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-home',
  imports: [MatButtonModule, MatCardModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home{

  isAuthenticated = false;
  welcomeMessage: string | null = null;
  secretContent: string | null = null;

  constructor(public dialog: MatDialog, private snackBar: MatSnackBar) {}

  solicitarCodigoCadastro() {

    const dialogRef = this.dialog.open(SecurityCodeModal, {
      width: '500px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.success) {
        this.openCadastroUserModal();
      }
    });
  }

  openCadastroUserModal() {
    const dialogRef = this.dialog.open(CadastroUserModal, {
      width: '500px',
      disableClose: true
    });

    
  }

  solicitarAcesso(nivelAcesso: number) {

    const dialogRef = this.dialog.open(ValidacaoFacialModal, {
      width: '500px',
      disableClose: true,
      data: { nivelAcesso }
    });

// --- PASSO 1: "Ouça" o fechamento do modal ---
    dialogRef.afterClosed().subscribe(result => {
      // 'result' é o que você enviou no dialogRef.close() do modal
      // Ex: { success: true, data: { message, token, content } }
      
      console.log('Modal de validação fechado. Resultado:', result);

      if (result && result.success) {
        // Se a autenticação foi bem-sucedida, atualize o estado!
        this.isAuthenticated = true;
        this.welcomeMessage = result.data.message; // Ex: "Bem-vindo, Usuário!"
        this.secretContent = result.data.content;  // O conteúdo secreto
        
        // (Opcional, mas bom para segurança) Salve o token
        localStorage.setItem('authToken', result.data.token);
        }
    });
  }

  logout() {
    // Reseta o estado da aplicação para voltar à tela inicial
    this.isAuthenticated = false;
    this.welcomeMessage = null;
    this.secretContent = null;
    // localStorage.removeItem('authToken');
    this.snackBar.open('Você foi desconectado.', 'Fechar', { duration: 3000 });
  }
}