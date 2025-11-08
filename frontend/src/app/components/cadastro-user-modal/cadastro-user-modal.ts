import { Component, ViewChild, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup } from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDialogActions } from "@angular/material/dialog";
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { User } from '../../Models/User';
import { FormBuilder, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import * as tf from '@tensorflow/tfjs';
import * as faceDetection from '@tensorflow-models/face-detection';
import { CadastroService } from '../../services/cadastro-service';
import { MatDialogRef } from '@angular/material/dialog';
import { SecurityCodeModal } from '../security-code-modal/security-code-modal';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-cadastro-user-modal',
  imports: [CommonModule, 
            MatFormFieldModule,
            MatSelectModule,
            MatInputModule, 
            MatDialogActions, 
            MatDialogModule,
            MatButtonModule, 
            MatDividerModule, 
            MatIconModule, 
            ReactiveFormsModule],
  templateUrl: './cadastro-user-modal.html',
  styleUrl: './cadastro-user-modal.css'
})

export class CadastroUserModal implements OnDestroy, OnInit{

  user: User = new User("", "", "", 0, "");


  public countdown: number = 5;
  public isCountingDown = false;
  private countdownInterval: any = null; 

  cadastroForm!: FormGroup;
  isCameraOn = false;
  capturedImage: string | null = null;
  stream: MediaStream | null = null;

  private faceDetector: faceDetection.FaceDetector | null = null;
  public validationMessage: string | null = null;

  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;


  constructor(public dialogRef: MatDialogRef<SecurityCodeModal>, 
    private fb: FormBuilder, 
    private cadastroService: CadastroService,
    private snackBar: MatSnackBar
  ) {}

  async ngOnInit() {

    this.cadastroForm = this.fb.group({
      nome: [this.user.nome, Validators.required],
      email: [this.user.email, [Validators.required, Validators.email]],
      telefone: [this.user.telefone, [Validators.required, Validators.pattern(/^\(\d{2}\)\s\d{4,5}-\d{4}$|^\d{10,11}$/)]],
      nivelAcesso: [this.user.nivelAcesso, Validators.required],
      foto: [this.user.foto]
    });
  await this.loadFaceDetectorModel();
  }

  // --- NOVA LÓGICA COM TENSORFLOW.JS ---

  private async loadFaceDetectorModel() {
    try {
      console.log('Carregando modelo de detecção facial...');
      
      // Garante que o backend do TensorFlow (WebGL) esteja pronto
      await tf.ready();

      // Configura o modelo. MediaPipeFaceDetector é rápido e preciso.
      const model = faceDetection.SupportedModels.MediaPipeFaceDetector;
      const detectorConfig: faceDetection.MediaPipeFaceDetectorMediaPipeModelConfig = {
        runtime: 'mediapipe',
        solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_detection', // Carrega dependências de um CDN
      };
      
      // Cria a instância do detector
      this.faceDetector = await faceDetection.createDetector(model, detectorConfig);
      
      console.log('Modelo de detecção facial carregado com sucesso!');
    } catch (error) {
      console.error('Erro ao carregar o modelo de detecção facial:', error);
    }
  }

  /**
   * Valida o quadro de vídeo atual para garantir que há exatamente um rosto.
   * Retorna true se for válido, false caso contrário.
   */
  async validateCurrentFrame(): Promise<boolean> {
    if (!this.faceDetector || !this.videoElement) {
      this.validationMessage = 'Detector não está pronto.';
      return false;
    }

    // Estima os rostos no vídeo
    const faces = await this.faceDetector.estimateFaces(this.videoElement.nativeElement, {
      flipHorizontal: false, 
    });

    if (faces.length === 0) {
      this.validationMessage = 'Nenhum rosto detectado. Por favor, centralize-se na câmera.';
      return false;
    }

    if (faces.length > 1) {
      this.validationMessage = 'Múltiplos rostos detectados. Apenas uma pessoa pode estar na foto.';
      return false;
    }
    return true;
  }

  async startCamera() {
    this.capturedImage = null; // Reseta a imagem anterior
    try {
      // Pede permissão e obtém o stream da câmera
      this.stream = await navigator.mediaDevices.getUserMedia({ video: true });
      console.log("Câmera ligada");
      
      this.isCameraOn = true;
      
setTimeout(() => {
        if (this.videoElement && this.videoElement.nativeElement) {
          this.videoElement.nativeElement.srcObject = this.stream;
          // Inicia a contagem regressiva assim que a câmera ligar
          this.startRegistrationCountdown(); 
        }
      }, 0);
      
    } catch (err) {
      this.validationMessage = "Não foi possível acessar a câmera. Verifique as permissões.";
      console.error("Erro ao acessar a câmera: ", err);
    }
  }

  startRegistrationCountdown() {
    this.isCountingDown = true;
    this.countdown = 5; // Reseta a contagem
    this.validationMessage = "Fique parado, centralize seu rosto...";

    this.countdownInterval = setInterval(async () => {
      this.countdown--;
      
      if (this.countdown === 0) {
        clearInterval(this.countdownInterval); // Para o intervalo
        this.isCountingDown = false;
        
        // Tenta capturar a imagem
        await this.captureImage();
      }
    }, 1000); // Roda a cada 1 segundo
  }

  async captureImage() {
    if (!this.isCameraOn) return;

    // Verifica se os elementos existem
    if (!this.canvasElement || !this.videoElement) {
      console.error('Elementos canvas ou video não encontrados');
      return;
    }

    const isFaceValid = await this.validateCurrentFrame();

    if (!isFaceValid) {
      this.startRegistrationCountdown();
      return; // Interrompe o processo de captura
    }
    // Pega o contexto 2D do canvas
    const context = this.canvasElement.nativeElement.getContext('2d');
    if (context) {
      const video = this.videoElement.nativeElement;
      // Define a resolução do canvas igual à do vídeo
      this.canvasElement.nativeElement.width = video.videoWidth;
      this.canvasElement.nativeElement.height = video.videoHeight;

      // "Desenha" o quadro atual do vídeo no canvas

      context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        
      // Converte o conteúdo do canvas para uma imagem em formato Base64
      this.capturedImage = this.canvasElement.nativeElement.toDataURL('image/jpeg');
      
      // Atribui a imagem capturada ao objeto user
      this.user.foto = this.capturedImage;
      
      // Para a câmera para liberar o recurso
      this.stopCamera();
    }
  }

  stopCamera() {
    if (this.stream) {
      // Itera sobre todas as faixas (vídeo, áudio) e as para.
      this.stream.getTracks().forEach(track => track.stop());
    }
    this.isCameraOn = false;
  }

  // Boa prática: garantir que a câmera seja desligada se o modal for fechado
  ngOnDestroy(): void {
    this.stopCamera();
  }

  cadastrarUser() {
    if (this.cadastroForm.valid) {
      const formData = this.cadastroForm.value;
      
      this.user.nome = formData.nome;
      this.user.email = formData.email;
      this.user.telefone = formData.telefone;
      this.user.nivelAcesso = formData.nivelAcesso;
      this.user.foto = this.capturedImage || '';

      this.cadastroService.cadastrarUsuario(this.user).subscribe({
        next: (response) => {
          console.log('Usuário cadastrado com sucesso:', response);
          this.snackBar.open('Usuário cadastrado com sucesso!', 'Fechar', { duration: 3000 });
          this.dialogRef.close({ success: true, user: this.user });
        },
        error: (error) => {
          console.error('Erro ao cadastrar usuário:', error);
          this.snackBar.open('Erro ao cadastrar usuário. Tente novamente.', 'Fechar', { duration: 3000 });
        }
      });  
    } else {
      this.cadastroForm.markAllAsTouched();
    }
  }

}
