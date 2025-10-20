import os
import jwt
import datetime
from ..services import biometria_service, user_service
from ..model import user

CODIGO_SEGURANCA = 459653

# Esta é a chave secreta que o JWT usa para assinar os tokens.
JWT_SECRET_KEY = "2bfbd414303471bdb4ccf78b38ced107f5df89899cf426437dfdfc09c0ea7ace"

# Conteúdo secreto simulado
DUMMY_CONTENT = {
    1: "Conteúdo confidencial de Nível 1: Relatórios gerais de toxinas.",
    2: "Conteúdo secreto de Nível 2: Localização das divisões e nomes dos diretores.",
    3: "Conteúdo de Nível 3 (Ministro): A fórmula da toxina 'Pandora'."
}


class AuthenticationError(Exception):
    """Erro customizado para falhas de autenticação (ex: rosto não reconhecido)"""
    pass


class AuthorizationError(Exception):
    """Erro customizado para falhas de autorização (ex: permissão insuficiente)"""
    pass


def authenticate_user_by_face(image_base64: str, requested_access_level: int) -> dict:
    """
    Orquestra o fluxo de login:
    1. Processa e valida o rosto (Parte 1).
    2. Prevê a identidade do usuário (Parte 3).
    3. Busca o usuário no banco de dados.
    4. Verifica se ele tem autorização para o nível solicitado.
    5. Gera um JWT e retorna o conteúdo secreto.
    """

    # --- Parte 1: Processamento da Imagem ---
    try:
        cropped_face = biometria_service.process_and_validate_face(image_base64)
    except ValueError as e:
        # Ex: "Nenhum rosto detectado" ou "Múltiplos rostos"
        raise AuthenticationError(str(e))

    # --- Parte 3: Reconhecimento (Predição) ---
    try:
        user_id, confidence = biometria_service.predict_user(cropped_face)
    except (FileNotFoundError, ValueError) as e:
        # FileNotFoundError: Modelo não existe.
        # ValueError: Confiança muito baixa (rosto não reconhecido).
        raise AuthenticationError(f"Autenticação falhou: {str(e)}")

    # --- Busca no Banco de Dados ---
    user = user_service.get_user_by_id(user_id)
    if user is None:
        raise AuthenticationError(f"Usuário com ID {user_id} não encontrado no banco de dados.")

    # --- Lógica de Autorização ---
    # O usuário (ex: Ministro, Nível 3) pode acessar algo de nível menor (ex: Nível 1)? Sim.
    if user.nivel_acesso < requested_access_level:
        raise AuthorizationError(
            f"Acesso negado. Seu nível ({user.nivel_acesso}) é insuficiente para acessar o nível ({requested_access_level}).")

    # --- Sucesso! Gerar JWT e Conteúdo ---

    # O usuário está autenticado E autorizado.

    # 1. Gerar o Token JWT
    payload = {
        'userId': user.id,
        'name': user.nome,
        'accessLevel': user.nivel_acesso,
        'exp': datetime.datetime.now(datetime.UTC) + datetime.timedelta(hours=1)  # Token expira em 1 hora
    }
    token = jwt.encode(payload, JWT_SECRET_KEY, algorithm="HS256")

    # 2. Obter o conteúdo secreto (nesta simulação, com base no nível solicitado)
    content = DUMMY_CONTENT.get(requested_access_level, "Conteúdo não encontrado.")

    return {
        'message': f"Bem-vindo, {user.nome}!",
        'token': token,
        'content': content
    }

def validar_codigo_seguranca(codigo) -> bool:

    if not isinstance(codigo, int):
        return False

    return codigo == CODIGO_SEGURANCA