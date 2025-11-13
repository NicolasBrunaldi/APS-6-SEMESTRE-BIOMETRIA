import { Component, ViewChild, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDialogActions } from "@angular/material/dialog";
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import * as tf from '@tensorflow/tfjs';
import * as faceDetection from '@tensorflow-models/face-detection';
import { MatDialogRef } from '@angular/material/dialog';
import { SecurityCodeModal } from '../security-code-modal/security-code-modal';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth-service';
import { Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-validacao-facial-modal',
  imports: [CommonModule, 
            MatFormFieldModule,
            MatSelectModule,
            MatInputModule, 
            MatDialogActions, 
            MatDialogModule,
            MatButtonModule, 
            MatDividerModule, 
            MatIconModule],
  templateUrl: './validacao-facial-modal.html',
  styleUrl: './validacao-facial-modal.css'
})

export class ValidacaoFacialModal implements OnDestroy, OnInit{

  isCameraOn = false;
  capturedImage: string | null = null;
  stream: MediaStream | null = null;
  private foto: any;
  attemptMessage: string | null = null;
  isDestroyed: boolean = false;
  isAttempting: boolean = false;
  counter = 1;

  private faceDetector: faceDetection.FaceDetector | null = null;
  public validationMessage: string | null = null;

  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;


  constructor(public dialogRef: MatDialogRef<SecurityCodeModal>, 
    private authService: AuthService,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: { nivelAcesso: number }
  ) {}

  async ngOnInit() {
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
    if (this.isDestroyed) return; // Evita múltiplas chamadas
    this.capturedImage = null; // Reseta a imagem anterior
    try {
      // Pede permissão e obtém o stream da câmera
      this.stream = await navigator.mediaDevices.getUserMedia({ video: true });
      console.log("Câmera ligada");

      this.isCameraOn = true;

      // Aguarda o Angular renderizar o videoElement
      setTimeout(() => {
        if (this.videoElement && this.videoElement.nativeElement) {
          this.videoElement.nativeElement.srcObject = this.stream;
          this.videoElement.nativeElement.oncanplay = () => {
            // Só inicia a validação DEPOIS que o vídeo estiver pronto
            if (this.videoElement && this.videoElement.nativeElement) {
              this.attemptValidation();
            }
          };
        } else {
          // Se não estiver disponível, tenta novamente em 100ms
          setTimeout(() => this.startCamera(), 100);
        }
      }, 0);

    } catch (err) {
      this.validationMessage = "Não foi possível acessar a câmera. Verifique as permissões.";
      console.error("Erro ao acessar a câmera: ", err);
    }
  }

  async attemptValidation() {
    // Não executa se o componente foi destruído ou se uma tentativa já está em andamento
    if (this.isDestroyed || this.isAttempting) return;

    this.validationMessage = null;
    this.attemptMessage = "Validando... Mantenha o rosto parado.";
    console.log("Iniciando tentativa de validação facial..." + this.counter);
    // 1. Pré-validação com TensorFlow.js
    const isFaceValid = await this.validateCurrentFrame();
    if (!isFaceValid) {
      this.attemptMessage = this.validationMessage || "Nenhum rosto válido detectado.";
      this.capturedImage = null;
      this.scheduleNextAttempt();
      console.log("Pré-validação falhou: ");
      return;
    }

    // 2. Se a pré-validação for OK, captura a imagem
    const context = this.canvasElement.nativeElement.getContext('2d');
    if (!context) {
      this.attemptMessage = "Erro no navegador (canvas).";
      this.capturedImage = null;
      this.scheduleNextAttempt();
      return;
    }
    const video = this.videoElement.nativeElement;
    context.canvas.width = video.videoWidth;
    context.canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

    const imageBase64 = context.canvas.toDataURL('image/jpeg');
    this.capturedImage = imageBase64; // Atualiza a pré-visualização

    // 3. Envia para o Backend
    this.authService.validaImagemUsuario(imageBase64, this.data.nivelAcesso).subscribe({
      next: (response) => {
        // SUCESSO!
        this.stopCamera();
        this.snackBar.open('Acesso Concedido!', 'Fechar', { duration: 3000 });
        this.dialogRef.close({ success: true, data: response });
      },
      error: (error) => {
        // FALHA NO BACKEND (ex: rosto não reconhecido, permissão negada)
        this.validationMessage = error.error.message || 'Usuário não reconhecido.';
        this.scheduleNextAttempt();
      }
    });
  }

  /**
   * Agenda a próxima tentativa de validação após 3 segundos.
   */
  scheduleNextAttempt() {
    this.isAttempting = false;
    
    // Se o componente foi destruído, não agenda uma nova tentativa
    if (this.isDestroyed) return;

    setTimeout(() => {
      console.log("Tentativa de validação facial número: " + this.counter++);
      this.attemptValidation();
    }, 5000); // Tenta novamente em 5 segundos
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
    this.isDestroyed = true;
    this.stopCamera();
  }
}
