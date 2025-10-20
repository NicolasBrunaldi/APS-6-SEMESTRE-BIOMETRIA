# DENTRO DE: api/src/database.py

import os
import mysql.connector
from mysql.connector import Error

def get_db_connection():
    """
    Cria e retorna uma conexão com o banco de dados.
    As credenciais são lidas das variáveis de ambiente.
    """
    try:
        connection = mysql.connector.connect(
            host=os.environ.get('DB_HOST'),
            database=os.environ.get('DB_NAME'),
            user=os.environ.get('DB_USER'),
            password=os.environ.get('DB_PASSWORD')
        )
        if connection.is_connected():
            return connection
    except Error as e:
        print(f"Erro ao conectar ao MySQL: {e}")
        return None