import { Component, OnInit } from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SecurityCodeModal } from '../security-code-modal/security-code-modal';
import { CadastroUserModal } from '../cadastro-user-modal/cadastro-user-modal';

@Component({
  selector: 'app-home',
  imports: [MatButtonModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit{

  constructor(public dialog: MatDialog, private snackBar: MatSnackBar) {}

  ngOnInit() {
    this.getCodigoSeguranca();
  }

  solicitarCodigoCadastro() {

    const dialogRef = this.dialog.open(SecurityCodeModal, {
      width: '500px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.success) {
        this.showSuccessMessage("Código correto! Redirecionando...");
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

  getCodigoSeguranca() {
    //this.AuthService.getCodigoSeguranca()
  }

  // Métodos para exibir mensagens amigáveis
  showErrorMessage(message: string) {
    this.snackBar.open(message, 'Fechar', {
      duration: 4000, // 4 segundos
      panelClass: ['error-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  showSuccessMessage(message: string) {
    this.snackBar.open(message, 'Fechar', {
      duration: 3000, // 3 segundos
      panelClass: ['success-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  showInfoMessage(message: string) {
    this.snackBar.open(message, 'OK', {
      duration: 5000, // 5 segundos
      panelClass: ['info-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

}
