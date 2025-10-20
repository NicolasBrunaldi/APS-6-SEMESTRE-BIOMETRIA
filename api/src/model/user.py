from dataclasses import dataclass
from typing import Optional

@dataclass
class User:
    nome: str
    email: str
    telefone: str
    nivel_acesso: int
    biometria_facial: str
    id: Optional[int] = None