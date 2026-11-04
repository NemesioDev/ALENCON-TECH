export type RegimeTributario = 'SIMPLES_NACIONAL' | 'MEI';

export type StatusGuiaMes = 'NAO_GERADA' | 'PROCESSANDO' | 'EMITIDA' | 'ERRO';

export interface GuiaMesInfo {
  id: number | null;
  competencia: string;
  status: StatusGuiaMes;
  idSistema?: string;
  idServico?: string;
  mensagemRetorno: string;
  nomeArquivoPdf?: string;
  modoEmissao?: 'trial' | 'production';
  codigoAutenticacao?: string;
  valorTotal?: string;
  dataVencimento?: string;
  updatedAt?: string;
}

export interface EmpresaCliente {
  id: number;
  organizationId?: string;
  razaoSocial: string;
  cnpj: string;
  regimeTributario: RegimeTributario;
  uf?: string;
  municipio?: string;
  responsavelFiscal?: string;
  pendenciasAtivasCount?: number;
  email: string;
  whatsapp: string;
  createdAt: string;
  guiaMes: GuiaMesInfo;
}

export interface ResumoPainel {
  totalEmpresas: number;
  guiasEmitidasNoMes: number;
  guiasPendentesOuErro: number;
  competencia: string;
}

export interface ConfiguracaoEscritorio {
  id: number;
  organizationId?: string;
  nomePlataforma?: string;
  planoSaaS?: string;
  limiteCnpjs?: number;
  franquiaConsultas?: number;
  modoAmbiente: 'trial' | 'production';
  cnpjEscritorio: string;
  razaoSocial: string;
  consumerKey: string;
  consumerSecret: string;
  certificadoNome: string;
  certificadoPath: string;
  certificadoSenha: string;
  temCertificadoSalvo?: boolean;
  ultimoTesteSucesso: boolean;
  ultimoTesteData: string | null;
  ultimoTesteMensagem: string;
}

export interface FiscalOccurrence {
  id: number;
  empresaId: number;
  empresa?: EmpresaCliente;
  tipo: string;
  severidade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
  descricao: string;
  competencia: string;
  fonte: string;
  idExterno: string;
  situacao: 'ABERTA' | 'EM_TRATAMENTO' | 'RESOLVIDA';
  responsavel: string;
  requiresReview: boolean;
  consultedAt: string;
}

export interface FiscalCheck {
  id: number;
  empresaId: number;
  empresa?: EmpresaCliente;
  source: string;
  service: string;
  competencia: string;
  status: 'regular' | 'attention_required' | 'failed_or_incomplete' | 'outdated';
  executadoPor: string;
  payloadPadrao: string;
  mensagemResumo: string;
  consultedAt: string;
}

export interface ObligationRule {
  id: number;
  codigo: string;
  nome: string;
  regimeAplicavel: string;
  periodicidade: string;
  diaVencimentoPadrao: number;
  uf: string;
  municipio: string;
  fonteNormativa: string;
  dataUltimaRevisao: string;
  abrangenciaExcecoes: string;
  responsavelHomologacao: string;
}

export type EstadoObrigacao =
  | 'A_PROGRAMAR'
  | 'PENDENTE_DOCUMENTOS'
  | 'EM_PROCESSAMENTO'
  | 'TRANSMITIDA_AGUARDANDO'
  | 'CUMPRIDA'
  | 'ATRASO_ERRO_RETIFICACAO';

export interface ObligationInstance {
  id: number;
  empresaId: number;
  empresa: EmpresaCliente;
  regraId: number;
  regra: ObligationRule;
  competencia: string;
  dataVencimento: string;
  estado: EstadoObrigacao;
  responsavel: string;
  protocoloRecibo: string;
  evidenciaArquivo: string;
  observacoes: string;
  updatedAt: string;
}

export interface TeamTask {
  id: number;
  empresaId: number | null;
  empresa?: EmpresaCliente;
  titulo: string;
  descricao: string;
  responsavel: string;
  prazo: string;
  prioridade: string;
  status: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDA';
  origem: string;
  createdAt: string;
}

export interface ClientHubItem {
  id: number;
  empresaId: number;
  empresa: EmpresaCliente;
  tipo: 'SOLICITACAO_DOCUMENTO' | 'COMUNICADO' | 'DUVIDA_CLIENTE' | 'ENTREGA_GUIA';
  titulo: string;
  mensagem: string;
  status:
    | 'AGUARDANDO_CLIENTE'
    | 'DOCUMENTO_RECEBIDO'
    | 'VALIDADO_ESCRITORIO'
    | 'LIBERADO_PORTAL';
  nomeArquivoAnexo: string;
  autor: string;
  respostaCliente: string;
  createdAt: string;
}

export interface AuditLogItem {
  id: number;
  organizationId: string;
  autor: string;
  modulo: string;
  acao: string;
  detalhes: string;
  custoEstimado: number;
  createdAt: string;
}
