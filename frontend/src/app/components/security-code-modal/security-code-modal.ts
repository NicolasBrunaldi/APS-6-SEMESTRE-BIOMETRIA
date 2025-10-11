import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-security-code-modal',
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  templateUrl: './security-code-modal.html',
  styleUrl: './security-code-modal.css'
})
export class SecurityCodeModal {

  hasError = false;
  errorMessage = '';
  codeValue = '';

  constructor(
    public dialogRef: MatDialogRef<SecurityCodeModal>
  ) {}

  // Método para permitir apenas números
  onlyNumbers(event: any) {
    const input = event.target;
    // Remove qualquer caractere que não seja número
    input.value = input.value.replace(/[^0-9]/g, '');
    
    // Limita a 6 dígitos
    if (input.value.length > 6) {
      input.value = input.value.slice(0, 6);
    }

    this.codeValue = input.value;
    
    // Remove o erro quando o usuário começar a digitar novamente
    if (this.hasError) {
      this.clearError();
    }
  }

  confirmCode() {
    if (this.codeValue.length < 6) {
      this.showError('O código deve ter exatamente 6 dígitos');
      return;
    }

    const codigoDigitado = parseInt(this.codeValue, 10);
    if (codigoDigitado === 445566) {
      this.dialogRef.close({ success: true, code: this.codeValue });
    } else {
      console.log('Has error:', this.hasError);
      this.showError('Código incorreto. Tente novamente.');
    }
  }

  showError(message: string) {
    this.hasError = true;
    this.errorMessage = message;
    console.log('Error shown:', this.hasError, this.errorMessage);
  }

  clearError() {
    this.hasError = false;
    this.errorMessage = '';
  }

  cancel() {
    this.dialogRef.close({ success: false });
  }
  
}
