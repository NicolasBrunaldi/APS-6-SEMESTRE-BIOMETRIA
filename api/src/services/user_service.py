from ..model.user import User
from ..database import get_db_connection
from ..services.biometria_service import process_and_validate_face
from ..services.biometria_service import train_and_save_user_model

def cadastrar_user(nome: str, email: str, telefone: str, nivelAcesso: int, imagemBase64: str):

    print("Iniciando Parte 1: Processamento da imagem...")
    cropped_face = process_and_validate_face(imagemBase64)
    print("Parte 1 concluída: Rosto validado e recortado.")

    biometric_data_placeholder = "LBPH_REGISTERED"

    conn = get_db_connection()
    if conn is None:
        raise ConnectionError("Não foi possível conectar ao banco de dados.")

    cursor = conn.cursor()

    try:
        # 1. VERIFICAR SE O E-MAIL JÁ EXISTE (REGRA DE NEGÓCIO)
        cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
        if cursor.fetchone():
            raise ValueError(f"O e-mail '{email}' já está cadastrado.")

        # 2. INSERIR O NOVO USUÁRIO NO BANCO
        sql = """
                INSERT INTO users (nome, email, telefone, nivel_acesso, biometria_facial)
                VALUES (%s, %s, %s, %s, %s)
            """
        user_data = (nome, email, telefone, nivelAcesso, biometric_data_placeholder)
        cursor.execute(sql, user_data)

        # 3. OBTER O ID DO NOVO USUÁRIO
        new_user_id = cursor.lastrowid
        print(f"Usuário inserido com sucesso. Novo ID: {new_user_id}")

        # --- PARTE 2: TREINAMENTO E REGISTRO LBPH ---
        # Agora que temos o ID, podemos treinar o modelo.
        print("Iniciando Parte 2: Treinamento do modelo LBPH...")
        train_and_save_user_model(cropped_face, new_user_id)
        print("Parte 2 concluída: Modelo LBPH atualizado.")

        # Confirma a transação
        conn.commit()

        # 3. RETORNAR O OBJETO USER COMPLETO
        return User(
            id=new_user_id,
            nome=nome,
            email=email,
            telefone=telefone,
            nivel_acesso=nivelAcesso,
            biometria_facial=biometric_data_placeholder
        )
    except Exception as e:
        print(f"Erro no serviço de usuário: {e}")
        conn.rollback()
        raise e
    finally:
        cursor.close()
        conn.close()

def get_user_by_id(user_id: int) -> User | None:
    """
    Busca um usuário no banco de dados pelo seu ID.

    Args:
        user_id (int): O ID do usuário.

    Returns:
        User | None: O objeto User se encontrado, None caso contrário.
    """
    conn = get_db_connection()
    if conn is None:
        raise ConnectionError("Não foi possível conectar ao banco de dados.")

    cursor = conn.cursor(dictionary=True) # dictionary=True retorna linhas como dicionários

    try:
        cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
        user_data = cursor.fetchone()

        if user_data:
            # Mapeia os nomes das colunas (com _ ) para os atributos da dataclass
            return User(
                id=user_data['id'],
                nome=user_data['nome'],
                email=user_data['email'],
                telefone=user_data['telefone'],
                nivel_acesso=user_data['nivel_acesso'],
                biometria_facial=user_data['biometria_facial']
            )
        return None # Retorna None se o usuário não for encontrado
    except Exception as e:
        raise e
    finally:
        cursor.close()
        conn.close()