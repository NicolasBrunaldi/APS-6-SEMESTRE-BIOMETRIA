from flask import Blueprint, request, jsonify
from ..services.user_service import cadastrar_user

user_bp = Blueprint('user', __name__)

@user_bp.route('/cadastrar-user', methods=['POST'])
def cadastrarUser():

    user = request.get_json()

    required_fields = ['nome', 'email', 'nivelAcesso', 'telefone', 'foto']

    if not user:
        return jsonify({'message': 'Corpo da requisição está vazio.'}), 400

        # Verifica se todos os campos necessários estão presentes no JSON
    missing_fields = [field for field in required_fields if field not in user]
    if missing_fields:
        return jsonify({'message': f'Campos faltando na requisição: {", ".join(missing_fields)}'}), 400

    try:
        new_user = cadastrar_user(
            nome=user['nome'],
            email=user['email'],
            telefone=user['telefone'],
            nivelAcesso=user['nivelAcesso'],
            imagemBase64=user['foto']
        )

        # Por enquanto, apenas retornamos sucesso para indicar que a rota funciona.
        print("Dados recebidos para cadastro:", user)  # Log para depuração
        return jsonify({'message': 'Usuário registrado com sucesso!'}), 201  # 201 Created

    except Exception as e:
        # Se o serviço levantar uma exceção (ex: email já existe), a rota a captura
        # e a transforma em uma resposta de erro HTTP.
        return jsonify({'message': f'Ocorreu um erro ao registrar o usuário: {str(e)}'}), 500