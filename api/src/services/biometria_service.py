import cv2
import numpy as np
import base64
import re
import os

# Carregando o classificador Haar Cascade para detecção de rostos.
# cv2.data.haarcascades nos dá o caminho para o arquivo XML dentro da biblioteca OpenCV.
HAAR_CASCADE_PATH = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
face_cascade = cv2.CascadeClassifier(HAAR_CASCADE_PATH)

MODEL_STORAGE_PATH = "src/models/lbph_model.yml"

CONFIDENCE_THRESHOLD = 80
def predict_user(cropped_face: np.ndarray) -> (int, float):
    """
    Carrega o modelo LBPH treinado e prevê a identidade do rosto fornecido.

    Args:
        cropped_face (np.ndarray): O rosto processado (da Parte 1).

    Raises:
        FileNotFoundError: Se o modelo 'lbph_model.yml' não for encontrado.
        ValueError: Se a predição não for confiável (confiança acima do limiar).

    Returns:
        tuple[int, float]: O ID do usuário (label) e a confiança da predição.
    """
    if not os.path.exists(MODEL_STORAGE_PATH):
        raise FileNotFoundError("Nenhum modelo de biometria foi treinado ainda. Impossível autenticar.")

    # 1. Crie a instância do reconhecedor
    recognizer = cv2.face.LBPHFaceRecognizer_create()

    # 2. Carregue o modelo treinado do disco
    recognizer.read(MODEL_STORAGE_PATH)

    # 3. Execute a predição no rosto fornecido
    # 'label' será o user_id que o modelo acha que é.
    # 'confidence' será a "distância" (0 = perfeito, 100+ = muito diferente).
    label, confidence = recognizer.predict(cropped_face)

    print(f"Predição: Label (ID) = {label}, Confiança = {confidence}")

    # 4. Verifique a confiança
    if confidence > CONFIDENCE_THRESHOLD:
        # Se a confiança for muito baixa (número alto), não é uma correspondência.
        raise ValueError(
            f"Usuário não reconhecido. Confiança ({confidence}) abaixo do limiar ({CONFIDENCE_THRESHOLD}).")

    # Se a confiança for boa, retorne o ID do usuário (label)
    return label, confidence
def train_and_save_user_model(cropped_face: np.ndarray, user_id: int):
    """
    Carrega o modelo LBPH existente, atualiza-o com o novo rosto
    e o salva de volta no disco.

    Args:
        cropped_face (np.ndarray): A imagem do rosto processada (da Parte 1).
        user_id (int): O ID único do usuário no banco de dados.
    """

    # 1. Crie a instância do reconhecedor LBPH
    # radius=1, neighbors=8, grid_x=8, grid_y=8 são valores padrão bons.
    recognizer = cv2.face.LBPHFaceRecognizer_create(radius=1, neighbors=8, grid_x=8, grid_y=8)

    # 2. Verifique se o modelo global já existe para ser atualizado
    if os.path.exists(MODEL_STORAGE_PATH):
        try:
            # Se existe, carregue o "conhecimento" anterior
            print(f"Carregando modelo existente de {MODEL_STORAGE_PATH} para atualização...")
            recognizer.read(MODEL_STORAGE_PATH)
        except cv2.error as e:
            print(f"Erro ao ler o modelo, um novo será criado. Erro: {e}")
            # Se o arquivo estiver corrompido, tratamos como se não existisse

    # 3. Atualize o modelo com o novo rosto.
    # O LBPH espera uma lista de rostos e uma lista de IDs.
    # O ID DEVE ser um número inteiro, por isso usamos numpy.array de int32.
    print(f"Atualizando modelo com o rosto do usuário ID: {user_id}")
    recognizer.update([cropped_face], np.array([user_id], dtype=np.int32))

    # 4. Crie a pasta 'src/models' se ela não existir
    os.makedirs(os.path.dirname(MODEL_STORAGE_PATH), exist_ok=True)

    # 5. Salve o modelo atualizado de volta no disco
    recognizer.save(MODEL_STORAGE_PATH)
    print(f"Modelo salvo com sucesso em {MODEL_STORAGE_PATH}")


def _decode_image_from_base64(image_base64_string: str) -> np.ndarray:
    """
    Função auxiliar para decodificar uma string Base64 em uma imagem OpenCV (NumPy array).
    """
    # 1. Remove o cabeçalho (ex: "data:image/jpeg;base64,") se ele existir.
    base64_data = re.sub('^data:image/.+;base64,', '', image_base64_string)

    # 2. Decodifica a string Base64 para bytes.
    try:
        image_bytes = base64.b64decode(base64_data)
    except Exception as e:
        raise ValueError(f"String Base64 inválida: {e}")

    # 3. Converte os bytes em um array NumPy.
    image_np_array = np.frombuffer(image_bytes, dtype=np.uint8)

    # 4. Decodifica o array NumPy em uma imagem colorida do OpenCV.
    image = cv2.imdecode(image_np_array, cv2.IMREAD_COLOR)

    if image is None:
        raise ValueError("Não foi possível decodificar a imagem.")

    return image


def process_and_validate_face(image_base64_string: str) -> np.ndarray:
    """
    Orquestra o processo completo de "Parte 1":
    Decodifica, pré-processa, detecta e valida o rosto.

    Args:
        image_base64_string (str): A imagem enviada pelo frontend.

    Raises:
        ValueError: Se a imagem for inválida, nenhum rosto for detectado,
                    ou se múltiplos rostos forem detectados.

    Returns:
        np.ndarray: A imagem do rosto recortado, em escala de cinza e equalizada,
                    pronta para o "treinamento" do LBPH.
    """
    # FASE 1: AQUISIÇÃO (Decodificação)
    image = _decode_image_from_base64(image_base64_string)

    # FASE 2: PRÉ-PROCESSAMENTO
    # 1. Converter para escala de cinza
    gray_image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # 2. Aplicar Equalização de Histograma para normalizar o contraste
    equalized_image = cv2.equalizeHist(gray_image)

    # FASE 3: SEGMENTAÇÃO (Detecção de Rosto)
    # scaleFactor: Quão menor a imagem fica a cada "passo" da detecção.
    # minNeighbors: Quantos "vizinhos" cada retângulo candidato deve ter para ser retido.
    # minSize: O tamanho mínimo do objeto a ser detectado (ex: 30x30 pixels).
    faces = face_cascade.detectMultiScale(
        equalized_image,
        scaleFactor=1.1,
        minNeighbors=5,
        minSize=(30, 30)
    )

    # --- VALIDAÇÃO ---
    if len(faces) == 0:
        # Se nenhum rosto for encontrado, levantamos um erro.
        raise ValueError("Nenhum rosto foi detectado na imagem. Por favor, centralize seu rosto e tente novamente.")

    if len(faces) > 1:
        # Se mais de um rosto for encontrado, levantamos um erro.
        raise ValueError("Múltiplos rostos foram detectados. Apenas uma pessoa é permitida na foto.")


    # --- ISOLAMENTO (Recorte) ---
    # Extrai as coordenadas do primeiro (e único) rosto
    (x, y, w, h) = faces[0]

    # Recorta o rosto da imagem equalizada
    cropped_face = equalized_image[y:y + h, x:x + w]

    # Retorna o rosto pronto para a Parte 2
    return cropped_face