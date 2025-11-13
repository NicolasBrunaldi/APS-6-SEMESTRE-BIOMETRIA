from flask import Blueprint, request, jsonify
from ..services import auth_service
from ..services.auth_service import AuthenticationError, AuthorizationError

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/validar-codigo-seguranca', methods=['POST'])
def validarCodigoSeguranca():

    codigo = request.get_json()

    if not codigo or 'codigoSeguranca' not in codigo:
        return jsonify({'message': 'O corpo da requisição está inválido ou a chave "codigoSeguranca" não foi encontrada.'}), 400

    codigo_recebido = codigo.get('codigoSeguranca')

    # 2. Chama o serviço para executar a LÓGICA DE NEGÓCIO
    is_valid = auth_service.validar_codigo_seguranca(codigo_recebido)

    # 3. A rota formata a RESPOSTA HTTP com base no resultado do serviço
    if is_valid:
        return jsonify({'message': 'Código de segurança validado com sucesso!', 'isValid': True}), 200
    else:
        return jsonify({'message': 'Código de segurança incorreto.', 'isValid': False}), 401


@auth_bp.route('/validar-imagem-usuario', methods=['POST'])
def validar_imagem_usuario():
    """
    Endpoint para autenticar um usuário com biometria facial
    e autorizá-lo para um nível de acesso.
    """
    data = request.get_json()

    # 1. Validar a requisição
    if not data or 'imagemBase64' not in data or 'nivelAcesso' not in data:
        return jsonify({'message': 'Requisição inválida. "imagemBase64" e "nivelAcesso" são obrigatórios.'}), 400

    try:
        image_base64 = data['imagemBase64']
        requested_access_level = data['nivelAcesso']

        # 2. Chamar o serviço orquestrador
        response_data = auth_service.authenticate_user_by_face(image_base64, requested_access_level)

        # 3. Retornar sucesso
        return jsonify(response_data), 200

    except AuthenticationError as e:
        # Ex: Rosto não detectado, rosto não reconhecido, usuário não encontrado
        return jsonify({'message': f"Falha na autenticação: {str(e)}"}), 401  # 401 Unauthorized

    except AuthorizationError as e:
        # Ex: Usuário Nível 1 tentando acessar Nível 3
        return jsonify({'message': f"Acesso negado: {str(e)}"}), 403  # 403 Forbidden

    except Exception as e:
        # Qualquer outro erro inesperado
        return jsonify({'message': f"Erro interno do servidor: {str(e)}"}), 500




