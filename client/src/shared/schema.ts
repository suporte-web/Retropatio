// ========================
// TIPAGEM DE VEÍCULO
// ========================
export type Veiculo = {
  id: string | number;
  placaCavalo: string;
  placaCarreta?: string;
  motorista: string;
  transportadora?: string;
  cliente?: string;
  statusCarga?: string;
  situacao: string;
  dataEntrada: string;
  dataSaida?: string;
  vagaId?: number | null; 

};
         // opcional


// ========================
// TIPAGEM DE FILIAL
// ========================
export interface Filial {
  id: string;
  nome: string;
  codigo: string;
  endereco: string;
  ativo: boolean;
};


// CHAMADA
// ========================
export type Chamada = {
  id: string | number;
  veiculoId: string;
  motivo: string;
  status: "pendente" | "atendida" | string;
  createdAt: string;
  dataAtendimento?: string;
};

// ========================
// TIPAGEM PARA AUDIT LOG
// ========================
export type AuditLog = {
  id: number;
  acao: string;
  entidade: string;

  ipAddress?: string;
  dadosAntes?: string;
  dadosDepois?: string;

  createdAt: string;   // ISO date string
};

export interface Fornecedor {
  id: string;
  nome: string;
  cnpj?: string;
  endereco?: string;
  telefone?: string;
  createdAt?: string;
  updatedAt?: string;
  ativo: boolean; 
}

export type User = {
  id: string;
  nome?: string | null;  
  username: string;     // 👈 existe no backend
  email: string;
  password?: string;    // retornado apenas na criação
  role: "porteiro" | "cliente" | "gestor" | "admin";
  ativo: boolean;
  filialId?: string | null;
  createdAt?: string;
  updatedAt?: string;
};


export type Vaga = {
  id: number;                  // id da vaga (INT)
  filialId: string;            // UUID da filial
  tipoVagaId: number;          // tipo da vaga (INT)
  NomeVaga: string;            // número da vaga (ex: V044, A01)
  status: "livre" | "ocupada"; // status da vaga
  descricao?: string | null;   // opcional (caso queira usar)
};

export type Visitante = {
  id: number;
  nome: string;
  cpf: string;
  empresa?: string | null;
  tipoVisita: string;
  motivoVisita?: string | null;
  status: "aguardando" | "aprovado" | "dentro" | "saiu";
  dataEntrada?: string | null;
  dataSaida?: string | null;
  filialId: string;
};
