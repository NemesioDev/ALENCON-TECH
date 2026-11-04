import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  BellRing,
  Code2,
  ClipboardCheck,
  BookOpen,
  ListTodo,
  Bot,
  Send,
  ShieldCheck,
  Users,
  FileText,
  Download,
  Activity,
  Lock,
  Layers,
  Sparkles,
  Plus,
  Check,
  ArrowRight,
  Scale,
} from 'lucide-react';
import {
  EmpresaCliente,
  FiscalCheck,
  FiscalOccurrence,
  ObligationRule,
  ObligationInstance,
  EstadoObrigacao,
  TeamTask,
  ClientHubItem,
  AuditLogItem,
} from '../types';
import { formatarCnpjMascara, formatarCompetenciaExibicao } from '../utils/formatters';

const API_BASE = '/api';

// ============================================================================
// 1. MÓDULO FISCAL MONITOR (SEÇÃO 2.1, 3.2, 5.3 e 7 DO PDF ALENCON TECH)
// ============================================================================

export function FiscalMonitorView({ empresas }: { empresas: EmpresaCliente[] }) {
  const [carregando, setCarregando] = useState(false);
  const [executandoConsulta, setExecutandoConsulta] = useState(false);
  const [resumo, setResumo] = useState({
    totalMonitorados: 0,
    clientesRegulares: 0,
    clientesComPendencia: 0,
    consultasFalhasOuDesatualizadas: 0,
    ocorrenciasAbertas: 0,
  });
  const [consultas, setConsultas] = useState<FiscalCheck[]>([]);
  const [ocorrencias, setOcorrencias] = useState<FiscalOccurrence[]>([]);
  const [servicoSelecionado, setServicoSelecionado] = useState('fiscal_status');
  const [empresaGatilhoId, setEmpresaGatilhoId] = useState<string>('');
  const [jsonModal, setJsonModal] = useState<{ titulo: string; payload: string } | null>(null);
  const [mensagemFeedback, setMensagemFeedback] = useState<string | null>(null);

  const carregarDados = useCallback(async () => {
    setCarregando(true);
    try {
      const resp = await fetch(`${API_BASE}/fiscal-monitor`);
      if (resp.ok) {
        const dados = await resp.json();
        setResumo(dados.resumo);
        setConsultas(dados.consultas || []);
        setOcorrencias(dados.ocorrencias || []);
      }
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const executarDiagnosticoSerpro = async () => {
    setExecutandoConsulta(true);
    setMensagemFeedback(null);
    try {
      const resp = await fetch(`${API_BASE}/fiscal-monitor/consultar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service: servicoSelecionado,
          competencia: '202610',
        }),
      });
      const dados = await resp.json();
      if (resp.ok) {
        setMensagemFeedback(dados.mensagem);
        await carregarDados();
      }
    } finally {
      setExecutandoConsulta(false);
    }
  };

  const dispararEventoGatilho = async () => {
    setExecutandoConsulta(true);
    setMensagemFeedback(null);
    try {
      const resp = await fetch(`${API_BASE}/fiscal-monitor/evento-gatilho`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresaId: empresaGatilhoId || undefined,
          tipoEvento: 'caixa_postal',
        }),
      });
      const dados = await resp.json();
      if (resp.ok) {
        setMensagemFeedback(dados.mensagem);
        await carregarDados();
      }
    } finally {
      setExecutandoConsulta(false);
    }
  };

  const atualizarOcorrencia = async (
    id: number,
    situacao: 'EM_TRATAMENTO' | 'RESOLVIDA',
    criarTarefaEquipe = false
  ) => {
    await fetch(`${API_BASE}/fiscal-monitor/ocorrencias/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ situacao, criarTarefaEquipe }),
    });
    setMensagemFeedback(
      criarTarefaEquipe
        ? 'Ocorrência encaminhada para tratamento e Tarefa criada automaticamente no Compliance Monitor!'
        : `Status da ocorrência atualizado para ${situacao}.`
    );
    await carregarDados();
  };

  return (
    <div className="space-y-6">
      {/* Regra Crítica de Segurança e Conformidade (Seção 3.2 e 7 - Página 8 do PDF) */}
      <div className="rounded-2xl bg-amber-50 border border-amber-300 p-4 flex items-start gap-3.5">
        <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-950 leading-relaxed">
          <strong className="font-bold">
            Diretriz de Conformidade Alencon Tech (Seção 3.2 e 7):
          </strong>{' '}
          A interface distingue estritamente{' '}
          <span className="font-semibold text-emerald-700">
            Informação Atualizada (Regular)
          </span>
          ,{' '}
          <span className="font-semibold text-red-700">
            Ocorrência Identificada (Attention Required)
          </span>{' '}
          e{' '}
          <span className="font-semibold text-amber-800">
            Consulta Malsucedida / Procuração Expirada
          </span>
          . Uma consulta malsucedida, incompleta ou desatualizada{' '}
          <strong>nunca é apresentada como confirmação de regularidade fiscal</strong>.
        </div>
      </div>

      {mensagemFeedback && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex items-center justify-between text-xs font-semibold text-emerald-900">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{mensagemFeedback}</span>
          </div>
          <button onClick={() => setMensagemFeedback(null)} className="underline">
            Fechar
          </button>
        </div>
      )}

      {/* Cards de Diagnóstico da Carteira */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-emerald-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">
            Regular (Consulta Atualizada)
          </p>
          <p className="text-3xl font-bold text-emerald-600 mt-1">{resumo.clientesRegulares}</p>
          <p className="text-[11px] text-emerald-700 mt-1">
            Ausência confirmada de ocorrências
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-red-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">
            Com Pendência (Attention Required)
          </p>
          <p className="text-3xl font-bold text-red-600 mt-1">{resumo.clientesComPendencia}</p>
          <p className="text-[11px] text-red-700 mt-1">
            {resumo.ocorrenciasAbertas} ocorrência(s) ativa(s) para revisão
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-amber-300 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">
            Consulta Falha / Desatualizada
          </p>
          <p className="text-3xl font-bold text-amber-600 mt-1">
            {resumo.consultasFalhasOuDesatualizadas}
          </p>
          <p className="text-[11px] text-amber-700 mt-1">
            Não considerar como regularidade fiscal
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">
            Histórico de Consultas (Auditadas)
          </p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{consultas.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">
            Integration Hub SERPRO padronizado
          </p>
        </div>
      </div>

      {/* Barra de Execução do Worker Fiscal & Gatilho de Eventos (Seção 2.1 e 5.2) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Adaptador SERPRO (Seção 5.2)
            </label>
            <select
              value={servicoSelecionado}
              onChange={(e) => setServicoSelecionado(e.target.value)}
              className="h-10 px-3 rounded-xl border border-slate-300 text-xs font-semibold bg-slate-50"
            >
              <option value="fiscal_status">fiscal_status.py (Diagnóstico SITFIS / CND)</option>
              <option value="mailbox">mailbox.py (Caixa Postal e-CAC / Intimações)</option>
              <option value="pgdas">pgdas.py (Malha PGDAS-D / Omissões)</option>
              <option value="dctfweb">dctfweb.py (Débitos Previdenciários DCTFWeb)</option>
              <option value="payments">payments.py (Parcelamentos PERT/RELP)</option>
            </select>
          </div>

          <button
            type="button"
            onClick={executarDiagnosticoSerpro}
            disabled={executandoConsulta}
            className="h-10 px-4 mt-4 lg:mt-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-2 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${executandoConsulta ? 'animate-spin' : ''}`} />
            Executar Consulta Padronizada na Carteira
          </button>
        </div>

        {/* Simulador de Eventos como Gatilho (Seção 2.1 - Página 2) */}
        <div className="flex flex-wrap items-center gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
          <select
            value={empresaGatilhoId}
            onChange={(e) => setEmpresaGatilhoId(e.target.value)}
            className="h-10 px-3 rounded-xl border border-slate-300 text-xs bg-slate-50"
          >
            <option value="">Selecionar cliente para evento...</option>
            {empresas.map((e) => (
              <option key={e.id} value={e.id}>
                {e.razaoSocial}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={dispararEventoGatilho}
            disabled={executandoConsulta}
            className="h-10 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-2"
            title="Simula o recebimento de um evento de atualização do SERPRO (events.py) que inicia uma consulta direcionada"
          >
            <BellRing className="w-4 h-4 text-amber-400" />
            Simular Evento como Gatilho (SERPRO Events)
          </button>
        </div>
      </div>

      {/* Tabela de Ocorrências Fiscais Rastreáveis */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <h3 className="font-bold text-slate-900 text-sm">
            Ocorrências, Débitos e Pendências Rastreáveis (`fiscal_occurrences`)
          </h3>
          <span className="text-xs text-slate-500">
            Preserva fonte, ID externo e timestamp da consulta
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase bg-slate-50/40">
                <th className="py-3 px-5">Cliente / CNPJ</th>
                <th className="py-3 px-4">Ocorrência & Fonte</th>
                <th className="py-3 px-4">Competência</th>
                <th className="py-3 px-4">Severidade</th>
                <th className="py-3 px-4">Situação</th>
                <th className="py-3 px-5 text-right">Tratamento Operacional</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70">
              {ocorrencias.map((oc) => (
                <tr key={oc.id} className="hover:bg-slate-50">
                  <td className="py-3.5 px-5">
                    <div className="font-semibold text-slate-900">
                      {oc.empresa?.razaoSocial || `Cliente #${oc.empresaId}`}
                    </div>
                    <div className="text-xs font-mono text-slate-500">
                      {oc.empresa ? formatarCnpjMascara(oc.empresa.cnpj) : ''} • Resp:{' '}
                      {oc.responsavel}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-medium text-slate-800">{oc.descricao}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Fonte: <strong>{oc.fonte}</strong> • ID: <code>{oc.idExterno}</code> •{' '}
                      {new Date(oc.consultedAt).toLocaleString('pt-BR')}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-700">
                    {oc.competencia}
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        oc.severidade === 'CRITICA'
                          ? 'bg-red-100 text-red-800 border border-red-200'
                          : oc.severidade === 'ALTA'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {oc.severidade}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        oc.situacao === 'RESOLVIDA'
                          ? 'bg-emerald-100 text-emerald-800'
                          : oc.situacao === 'EM_TRATAMENTO'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}
                    >
                      {oc.situacao === 'ABERTA'
                        ? 'Aberta (Requer Revisão)'
                        : oc.situacao === 'EM_TRATAMENTO'
                        ? 'Em Tratamento'
                        : 'Resolvida'}
                    </span>
                  </td>

                  <td className="py-3.5 px-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {oc.situacao !== 'RESOLVIDA' && (
                        <>
                          <button
                            type="button"
                            onClick={() => atualizarOcorrencia(oc.id, 'EM_TRATAMENTO', true)}
                            className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold"
                            title="Gera uma tarefa para a equipe e muda para Em Tratamento"
                          >
                            + Gerar Tarefa
                          </button>
                          <button
                            type="button"
                            onClick={() => atualizarOcorrencia(oc.id, 'RESOLVIDA', false)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                          >
                            Concluir
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Histórico de Consultas & JSON Padronizado da Seção 5.3 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <h3 className="font-bold text-slate-900 text-sm">
            Histórico de Consultas e Respostas Padronizadas (`fiscal_checks` — Seção 5.3)
          </h3>
          <span className="text-xs text-slate-500">
            Clique em "Ver JSON Padronizado" para inspecionar o contrato interno da Seção 5.3
          </span>
        </div>

        <div className="divide-y divide-slate-200/70">
          {consultas.slice(0, 8).map((c) => (
            <div
              key={c.id}
              className="px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 hover:bg-slate-50 text-xs"
            >
              <div className="space-y-0.5">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <span>{c.empresa?.razaoSocial || `Cliente #${c.empresaId}`}</span>
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {c.source} / {c.service}
                  </span>
                </div>
                <div className="text-slate-600">{c.mensagemResumo}</div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-slate-400">
                  {new Date(c.consultedAt).toLocaleString('pt-BR')}
                </span>

                <span
                  className={`px-2.5 py-1 rounded-full font-bold ${
                    c.status === 'regular'
                      ? 'bg-emerald-100 text-emerald-800'
                      : c.status === 'attention_required'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}
                >
                  {c.status}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setJsonModal({
                      titulo: `${c.empresa?.razaoSocial} (${c.service})`,
                      payload: c.payloadPadrao,
                    })
                  }
                  className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold flex items-center gap-1.5"
                >
                  <Code2 className="w-3.5 h-3.5 text-blue-600" />
                  Ver JSON (Seção 5.3)
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de inspeção do JSON Padronizado da Seção 5.3 */}
      {jsonModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  Modelo Interno Padronizado de Resposta (Seção 5.3 do PDF)
                </h4>
                <p className="text-xs text-slate-500">{jsonModal.titulo}</p>
              </div>
              <button
                onClick={() => setJsonModal(null)}
                className="text-xs font-bold text-slate-500 hover:text-slate-900"
              >
                Fechar
              </button>
            </div>
            <pre className="bg-slate-900 text-emerald-300 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-80">
              {jsonModal.payload}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 2. MÓDULO COMPLIANCE MONITOR & TAREFAS (SEÇÃO 2.2 - PÁGINA 3 DO PDF)
// ============================================================================

const ESTADOS_OBRIGACAO_META: Record<
  EstadoObrigacao,
  { label: string; significado: string; badgeClass: string }
> = {
  A_PROGRAMAR: {
    label: 'A programar',
    significado: 'Obrigação identificada, ainda fora da janela operacional.',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
  },
  PENDENTE_DOCUMENTOS: {
    label: 'Pendente de documentos',
    significado: 'A execução depende de informações ou arquivos.',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  EM_PROCESSAMENTO: {
    label: 'Em processamento',
    significado: 'Equipe está preparando ou executando a obrigação.',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  TRANSMITIDA_AGUARDANDO: {
    label: 'Transmitida, aguardando confirmação',
    significado: 'Envio realizado, mas a evidência final ainda precisa ser validada.',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  CUMPRIDA: {
    label: 'Cumprida',
    significado: 'Conclusão confirmada e evidência armazenada.',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  ATRASO_ERRO_RETIFICACAO: {
    label: 'Em atraso / Com erro / Retificação',
    significado: 'Estados excepcionais que exigem tratamento específico.',
    badgeClass: 'bg-red-100 text-red-800 border-red-200',
  },
};

export function ComplianceMonitorView({ competencia }: { competencia: string }) {
  const [subAba, setSubAba] = useState<'instancias' | 'regras' | 'tarefas'>('instancias');
  const [regras, setRegras] = useState<ObligationRule[]>([]);
  const [instancias, setInstancias] = useState<ObligationInstance[]>([]);
  const [tarefas, setTarefas] = useState<TeamTask[]>([]);
  const [novaTarefaTitulo, setNovaTarefaTitulo] = useState('');
  const [novaTarefaResp, setNovaTarefaResp] = useState('Ana Costa (Fiscal)');
  const [novaTarefaPrazo, setNovaTarefaPrazo] = useState('18/11/2026');

  // Nova regra homologada
  const [novoCodigoRegra, setNovoCodigoRegra] = useState('');
  const [novoNomeRegra, setNovoNomeRegra] = useState('');
  const [novaFonteNormativa, setNovaFonteNormativa] = useState('');
  const [novoResponsavelHomologacao, setNovoResponsavelHomologacao] = useState(
    'Dr. Roberto Alencon (CRC-SP)'
  );

  const carregarCompliance = useCallback(async () => {
    const resp = await fetch(`${API_BASE}/compliance?competencia=${competencia}`);
    if (resp.ok) {
      const dados = await resp.json();
      setRegras(dados.regras || []);
      setInstancias(dados.instancias || []);
      setTarefas(dados.tarefas || []);
    }
  }, [competencia]);

  useEffect(() => {
    carregarCompliance();
  }, [carregarCompliance]);

  const gerarCalendarioCompetencia = async () => {
    await fetch(`${API_BASE}/compliance/gerar-competencia`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ competencia }),
    });
    await carregarCompliance();
  };

  const alterarEstadoInstancia = async (id: number, novoEstado: EstadoObrigacao) => {
    const protocolo =
      novoEstado === 'CUMPRIDA' ? `REC-${Date.now().toString().slice(-7)}` : undefined;
    await fetch(`${API_BASE}/compliance/instancias/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        estado: novoEstado,
        ...(protocolo ? { protocoloRecibo: protocolo } : {}),
      }),
    });
    await carregarCompliance();
  };

  const criarTarefa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaTarefaTitulo.trim()) return;
    await fetch(`${API_BASE}/compliance/tarefas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo: novaTarefaTitulo,
        responsavel: novaTarefaResp,
        prazo: novaTarefaPrazo,
        prioridade: 'ALTA',
        origem: 'Compliance Monitor',
      }),
    });
    setNovaTarefaTitulo('');
    await carregarCompliance();
  };

  const concluirTarefa = async (id: number) => {
    await fetch(`${API_BASE}/compliance/tarefas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'CONCLUIDA' }),
    });
    await carregarCompliance();
  };

  const cadastrarNovaRegra = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoCodigoRegra || !novoNomeRegra) return;
    await fetch(`${API_BASE}/compliance/regras`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        codigo: novoCodigoRegra,
        nome: novoNomeRegra,
        fonteNormativa: novaFonteNormativa,
        responsavelHomologacao: novoResponsavelHomologacao,
      }),
    });
    setNovoCodigoRegra('');
    setNovoNomeRegra('');
    setNovaFonteNormativa('');
    await carregarCompliance();
  };

  return (
    <div className="space-y-6">
      {/* Navegação interna do Compliance Monitor */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
          <button
            type="button"
            onClick={() => setSubAba('instancias')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 ${
              subAba === 'instancias'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            Obrigações da Competência ({instancias.length})
          </button>

          <button
            type="button"
            onClick={() => setSubAba('regras')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 ${
              subAba === 'regras'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Catálogo de Regras & Fonte Normativa ({regras.length})
          </button>

          <button
            type="button"
            onClick={() => setSubAba('tarefas')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 ${
              subAba === 'tarefas'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ListTodo className="w-4 h-4" />
            Tarefas e Alertas da Equipe ({tarefas.filter((t) => t.status !== 'CONCLUIDA').length})
          </button>
        </div>

        <button
          type="button"
          onClick={gerarCalendarioCompetencia}
          className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-2 shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Gerar / Sincronizar Obrigações ({formatarCompetenciaExibicao(competencia)})
        </button>
      </div>

      {/* SUB-ABA 1: INSTÂNCIAS E OS 6 ESTADOS DA PÁGINA 3 DO PDF */}
      {subAba === 'instancias' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {(Object.keys(ESTADOS_OBRIGACAO_META) as EstadoObrigacao[]).map((chave) => {
              const meta = ESTADOS_OBRIGACAO_META[chave];
              const qtd = instancias.filter((i) => i.estado === chave).length;
              return (
                <div
                  key={chave}
                  className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${meta.badgeClass}`}
                    >
                      {meta.label}
                    </span>
                    <p className="text-[11px] text-slate-500 mt-1.5 leading-snug">
                      {meta.significado}
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 mt-2">{qtd}</p>
                </div>
              );
            })}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <h3 className="font-bold text-slate-900 text-sm">
                Matriz de Obrigações, Prazos, Responsáveis e Evidências (`obligation_instances`)
              </h3>
              <span className="text-xs text-slate-500">
                Sincronizado automaticamente quando uma guia DAS é emitida via SERPRO
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase bg-slate-50/40">
                    <th className="py-3 px-5">Cliente</th>
                    <th className="py-3 px-4">Obrigação</th>
                    <th className="py-3 px-4">Vencimento</th>
                    <th className="py-3 px-4">Responsável</th>
                    <th className="py-3 px-4">Estado (Página 3 do PDF)</th>
                    <th className="py-3 px-5">Recibo / Protocolo / Evidência</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70">
                  {instancias.map((inst) => {
                    const meta =
                      ESTADOS_OBRIGACAO_META[inst.estado] || ESTADOS_OBRIGACAO_META.A_PROGRAMAR;
                    return (
                      <tr key={inst.id} className="hover:bg-slate-50">
                        <td className="py-3.5 px-5">
                          <div className="font-semibold text-slate-900">
                            {inst.empresa?.razaoSocial}
                          </div>
                          <div className="text-xs font-mono text-slate-400">
                            {formatarCnpjMascara(inst.empresa?.cnpj || '')}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-800">{inst.regra?.codigo}</span>
                          <div className="text-xs text-slate-500">{inst.observacoes}</div>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-700">
                          {inst.dataVencimento}
                        </td>

                        <td className="py-3.5 px-4 text-xs font-medium text-slate-700">
                          {inst.responsavel}
                        </td>

                        <td className="py-3.5 px-4">
                          <select
                            value={inst.estado}
                            onChange={(e) =>
                              alterarEstadoInstancia(inst.id, e.target.value as EstadoObrigacao)
                            }
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border cursor-pointer ${meta.badgeClass}`}
                          >
                            {(Object.keys(ESTADOS_OBRIGACAO_META) as EstadoObrigacao[]).map(
                              (st) => (
                                <option key={st} value={st}>
                                  {ESTADOS_OBRIGACAO_META[st].label}
                                </option>
                              )
                            )}
                          </select>
                        </td>

                        <td className="py-3.5 px-5 text-xs">
                          {inst.protocoloRecibo ? (
                            <span className="inline-flex items-center gap-1.5 font-mono font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {inst.protocoloRecibo}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Aguardando protocolo</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* SUB-ABA 2: CATÁLOGO DE REGRAS COM FONTE NORMATIVA E HOMOLOGAÇÃO (PÁGINA 3) */}
      {subAba === 'regras' && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4 flex items-start gap-3">
            <Scale className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-900 leading-relaxed">
              <strong>Governança de Regras Fiscais (Página 3 do PDF):</strong> Cada regra registra
              obrigatoriamente a <strong>fonte normativa</strong>,{' '}
              <strong>data da última revisão</strong>, <strong>abrangência/exceções</strong> e o{' '}
              <strong>responsável pela homologação</strong>. A IA pode auxiliar na interpretação de
              alterações, mas nenhuma regra fiscal é publicada sem aprovação humana.
            </p>
          </div>

          <form
            onSubmit={cadastrarNovaRegra}
            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-5 gap-3 items-end"
          >
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Código *
              </label>
              <input
                type="text"
                required
                value={novoCodigoRegra}
                onChange={(e) => setNovoCodigoRegra(e.target.value)}
                placeholder="Ex: EFD-REINF"
                className="w-full h-10 px-3 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Nome da Obrigação *
              </label>
              <input
                type="text"
                required
                value={novoNomeRegra}
                onChange={(e) => setNovoNomeRegra(e.target.value)}
                placeholder="Escrituração Fiscal Digital de Retenções"
                className="w-full h-10 px-3 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Fonte Normativa *
              </label>
              <input
                type="text"
                required
                value={novaFonteNormativa}
                onChange={(e) => setNovaFonteNormativa(e.target.value)}
                placeholder="IN RFB nº 2.043/2021"
                className="w-full h-10 px-3 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <button
              type="submit"
              className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Homologar Regra
            </button>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {regras.map((r) => (
              <div
                key={r.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-lg bg-blue-100 text-blue-800 font-bold text-xs">
                    {r.codigo}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    {r.periodicidade} • Venc. dia {r.diaVencimentoPadrao}
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm">{r.nome}</h4>
                <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div>
                    <strong>Fonte Normativa:</strong> {r.fonteNormativa}
                  </div>
                  <div>
                    <strong>Abrangência / Exceções:</strong> {r.abrangenciaExcecoes}
                  </div>
                  <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                    <span>Revisão: {r.dataUltimaRevisao}</span>
                    <span>Homologado por: {r.responsavelHomologacao}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-ABA 3: TAREFAS E ALERTAS DA EQUIPE */}
      {subAba === 'tarefas' && (
        <div className="space-y-5">
          <form
            onSubmit={criarTarefa}
            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-wrap items-end gap-3"
          >
            <div className="flex-1 min-w-[240px]">
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Nova Tarefa Operacional
              </label>
              <input
                type="text"
                value={novaTarefaTitulo}
                onChange={(e) => setNovaTarefaTitulo(e.target.value)}
                placeholder="Ex: Conferir recibo DCTFWeb e liberar guia no Client Hub"
                className="w-full h-10 px-3.5 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Responsável
              </label>
              <input
                type="text"
                value={novaTarefaResp}
                onChange={(e) => setNovaTarefaResp(e.target.value)}
                className="h-10 px-3 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Prazo
              </label>
              <input
                type="text"
                value={novaTarefaPrazo}
                onChange={(e) => setNovaTarefaPrazo(e.target.value)}
                className="h-10 px-3 rounded-xl border border-slate-300 text-xs w-28"
              />
            </div>

            <button
              type="submit"
              className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Criar Tarefa
            </button>
          </form>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-200/70">
            {tarefas.map((t) => (
              <div
                key={t.id}
                className="p-4 flex flex-wrap items-center justify-between gap-4 hover:bg-slate-50"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        t.status === 'CONCLUIDA'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {t.status}
                    </span>
                    <span className="font-bold text-sm text-slate-900">{t.titulo}</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {t.descricao} • Origem: <strong>{t.origem}</strong> • Responsável:{' '}
                    <strong>{t.responsavel}</strong> • Prazo: <strong>{t.prazo}</strong>
                  </p>
                </div>

                {t.status !== 'CONCLUIDA' && (
                  <button
                    type="button"
                    onClick={() => concluirTarefa(t.id)}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Concluir Tarefa
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 3. MÓDULO AI ASSISTANT COM FERRAMENTAS CONTROLADAS & GUARDRAILS (SEÇÃO 2.3 e 6)
// ============================================================================

const FERRAMENTAS_IA = [
  {
    id: 'consultar_pendencias',
    label: 'consultar_pendencias',
    pergunta: 'Quais clientes possuem pendências fiscais ou alertas na Caixa Postal?',
  },
  {
    id: 'listar_obrigacoes',
    label: 'listar_obrigacoes',
    pergunta: 'Listar obrigações sem recibo ou com vencimento próximo na competência.',
  },
  {
    id: 'consultar_prazos',
    label: 'consultar_prazos',
    pergunta: 'Identificar tarefas sem responsável ou com prazo próximo.',
  },
  {
    id: 'gerar_relatorio',
    label: 'gerar_relatorio',
    pergunta: 'Produzir relatório executivo periódico da carteira Alencon Tech.',
  },
  {
    id: 'listar_clientes',
    label: 'listar_clientes',
    pergunta: 'Listar clientes ativos acessíveis à organização e seus responsáveis.',
  },
];

export function AiAssistantView() {
  const [pergunta, setPergunta] = useState('');
  const [consultando, setConsultando] = useState(false);
  const [resultadoIa, setResultadoIa] = useState<{
    ferramentaExecutada: string;
    escopoValidado: string;
    dataConsulta: string;
    guardrailsAplicados: string[];
    resposta: {
      dadosConfirmados: string[];
      inferenciaAnalise: string;
      recomendacoesAprovacaoHumana: string[];
    };
  } | null>(null);
  const [tarefaAprovadaMsg, setTarefaAprovadaMsg] = useState<string | null>(null);

  const consultarAssistente = async (perguntaTexto: string, ferramentaForcada?: string) => {
    setConsultando(true);
    setTarefaAprovadaMsg(null);
    try {
      const resp = await fetch(`${API_BASE}/ai-assistant/consultar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pergunta: perguntaTexto,
          ferramentaForcada,
        }),
      });
      if (resp.ok) {
        const dados = await resp.json();
        setResultadoIa(dados);
      }
    } finally {
      setConsultando(false);
    }
  };

  useEffect(() => {
    consultarAssistente(
      'Quais clientes possuem pendências fiscais?',
      'consultar_pendencias'
    );
  }, []);

  const aprovarCriacaoTarefaHumana = async (recomendacao: string) => {
    await fetch(`${API_BASE}/compliance/tarefas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo: recomendacao,
        descricao: 'Ação sugerida pelo AI Assistant e aprovada explicitamente pelo operador humano.',
        responsavel: 'Ana Costa (Fiscal)',
        prazo: '12/11/2026',
        prioridade: 'ALTA',
        origem: 'AI Assistant (Aprovação Humana)',
      }),
    });
    setTarefaAprovadaMsg(`Ação aprovada! Tarefa "${recomendacao}" criada e registrada na auditoria.`);
  };

  return (
    <div className="space-y-6">
      {/* Banner de Guardrails da Seção 6.2 e MCP Seção 6.3 */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white rounded-2xl p-6 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-300">
            <Bot className="w-4 h-4" />
            AI Assistant & MCP Server (Seção 2.3 e 6 do PDF)
          </span>
          <span className="text-[11px] bg-white/10 px-3 py-1 rounded-full font-mono">
            Escopo RLS: org_alencon_001
          </span>
        </div>
        <h3 className="text-lg font-bold">
          Consultas em Linguagem Natural sobre Ferramentas Controladas
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          O assistente não possui acesso irrestrito ao banco nem recebe senhas ou certificados
          digitais (Guardrails Seção 6.2). Ele aciona ferramentas auditadas, separa{' '}
          <strong>Dado Confirmado</strong> de <strong>Inferência</strong> e exige{' '}
          <strong>aprovação humana explícita</strong> para criar tarefas ou ações sensíveis.
        </p>

        {/* Botões das Ferramentas Controladas da Tabela 6.1 (Página 7) */}
        <div className="flex flex-wrap gap-2 pt-2">
          {FERRAMENTAS_IA.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                setPergunta(f.pergunta);
                consultarAssistente(f.pergunta, f.id);
              }}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-mono text-blue-200 transition-all"
            >
              ⚡ {f.label}()
            </button>
          ))}
        </div>
      </div>

      {/* Barra de Pergunta em Linguagem Natural */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (pergunta.trim()) consultarAssistente(pergunta);
        }}
        className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center gap-3"
      >
        <input
          type="text"
          value={pergunta}
          onChange={(e) => setPergunta(e.target.value)}
          placeholder="Pergunte ao AI Assistant (ex: Quais clientes possuem pendências fiscais? Quais obrigações estão sem recibo?)"
          className="flex-1 h-11 px-4 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={consultando}
          className="h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
          Consultar IA
        </button>
      </form>

      {tarefaAprovadaMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {tarefaAprovadaMsg}
        </div>
      )}

      {resultadoIa && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Principal: Dados Confirmados, Inferência e Recomendações */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 font-mono text-xs font-bold">
                    Tool: {resultadoIa.ferramentaExecutada}
                  </span>
                  <span className="text-xs text-slate-500">
                    Consultado em {new Date(resultadoIa.dataConsulta).toLocaleString('pt-BR')}
                  </span>
                </div>
                <span className="text-xs font-semibold text-emerald-700">
                  {resultadoIa.escopoValidado}
                </span>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  1. Dados Confirmados nas Fontes Oficiais (Com Data e Origem)
                </h4>
                <ul className="space-y-2 text-xs text-slate-800 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                  {resultadoIa.resposta.dadosConfirmados.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 leading-relaxed">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  2. Síntese Analítica / Inferência Assistida
                </h4>
                <p className="text-sm text-slate-700 bg-blue-50/60 border border-blue-100 p-4 rounded-xl leading-relaxed">
                  {resultadoIa.resposta.inferenciaAnalise}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  3. Próximos Passos Sugeridos (Exige Aprovação Humana — Seção 2.3)
                </h4>
                <div className="space-y-2">
                  {resultadoIa.resposta.recomendacoesAprovacaoHumana.map((rec, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-slate-200 flex items-center justify-between gap-3 bg-white"
                    >
                      <span className="text-xs font-medium text-slate-800">{rec}</span>
                      <button
                        type="button"
                        onClick={() => aprovarCriacaoTarefaHumana(rec)}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-blue-600 text-white text-xs font-semibold shrink-0 flex items-center gap-1.5 transition-colors"
                      >
                        <span>Aprovar e Criar Tarefa</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Coluna Lateral: Guardrails Verificados (Seção 6.2) */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4 self-start">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              Guardrails da IA Verificados (Seção 6.2)
            </div>
            <ul className="space-y-2.5 text-xs text-slate-600">
              {resultadoIa.guardrailsAplicados.map((g, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{g}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 4. MÓDULO CLIENT HUB — PORTAL DO CLIENTE (SEÇÃO 2.4 DO PDF)
// ============================================================================

export function ClientHubView({ empresas }: { empresas: EmpresaCliente[] }) {
  const [solicitacoes, setSolicitacoes] = useState<ClientHubItem[]>([]);
  const [guiasLiberadas, setGuiasLiberadas] = useState<any[]>([]);
  const [empresaId, setEmpresaId] = useState<string>('');
  const [tipo, setTipo] = useState('SOLICITACAO_DOCUMENTO');
  const [titulo, setTitulo] = useState('');
  const [mensagem, setMensagem] = useState('');

  const carregarHub = useCallback(async () => {
    const resp = await fetch(`${API_BASE}/client-hub`);
    if (resp.ok) {
      const dados = await resp.json();
      setSolicitacoes(dados.solicitacoes || []);
      setGuiasLiberadas(dados.guiasLiberadas || []);
    }
  }, []);

  useEffect(() => {
    carregarHub();
  }, [carregarHub]);

  const publicarNoPortal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empresaId || !titulo) return;
    await fetch(`${API_BASE}/client-hub`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ empresaId, tipo, titulo, mensagem }),
    });
    setTitulo('');
    setMensagem('');
    await carregarHub();
  };

  const simularEnvioDocumentoCliente = async (id: number) => {
    await fetch(`${API_BASE}/client-hub/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'DOCUMENTO_RECEBIDO',
        nomeArquivoAnexo: `Extrato_Fiscal_${Date.now().toString().slice(-4)}.pdf`,
        respostaCliente: 'Documento enviado pelo portal do cliente para apuração.',
      }),
    });
    await carregarHub();
  };

  const validarDocumentoEscritorio = async (id: number) => {
    await fetch(`${API_BASE}/client-hub/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'VALIDADO_ESCRITORIO',
      }),
    });
    await carregarHub();
  };

  return (
    <div className="space-y-6">
      {/* Formulário para Solicitar Documento ou Enviar Comunicado ao Cliente */}
      <form
        onSubmit={publicarNoPortal}
        className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4"
      >
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-600" />
          Nova Solicitação de Documentos ou Comunicado no Portal do Cliente (Seção 2.4)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
              Cliente Destinatário *
            </label>
            <select
              required
              value={empresaId}
              onChange={(e) => setEmpresaId(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-300 text-xs bg-white"
            >
              <option value="">Selecione a empresa...</option>
              {empresas.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.razaoSocial}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
              Tipo de Interação
            </label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-300 text-xs bg-white"
            >
              <option value="SOLICITACAO_DOCUMENTO">Solicitação de Documento</option>
              <option value="COMUNICADO">Comunicado / Alerta Fiscal</option>
              <option value="ENTREGA_GUIA">Liberação de Guia / Relatório</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
              Assunto / Título *
            </label>
            <input
              type="text"
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Envio de Notas Fiscais de Serviço Tomados — Competência 10/2026"
              className="w-full h-10 px-3.5 rounded-xl border border-slate-300 text-xs"
            />
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          <input
            type="text"
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
            placeholder="Mensagem detalhada para o cliente visualizar no portal..."
            className="flex-1 h-10 px-3.5 rounded-xl border border-slate-300 text-xs"
          />
          <button
            type="submit"
            className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shrink-0"
          >
            Publicar no Client Hub
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Solicitações, Documentos e Histórico de Respostas */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
            <h4 className="font-bold text-slate-900 text-sm">
              Solicitações, Recebimento de Documentos e Histórico Cliente ↔ Escritório
            </h4>
          </div>

          <div className="divide-y divide-slate-200/70">
            {solicitacoes.map((s) => (
              <div key={s.id} className="p-5 space-y-2.5 hover:bg-slate-50/60">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[11px]">
                      {s.empresa?.razaoSocial}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        s.status === 'AGUARDANDO_CLIENTE'
                          ? 'bg-amber-100 text-amber-800'
                          : s.status === 'DOCUMENTO_RECEBIDO'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {s.status}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">
                    {new Date(s.createdAt).toLocaleString('pt-BR')}
                  </span>
                </div>

                <h5 className="font-bold text-slate-900 text-sm">{s.titulo}</h5>
                <p className="text-xs text-slate-600">{s.mensagem}</p>

                {s.respostaCliente && (
                  <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3 text-xs text-blue-950">
                    <strong>Resposta do Cliente:</strong> {s.respostaCliente}
                    {s.nomeArquivoAnexo && (
                      <span className="ml-2 font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-blue-200">
                        📎 {s.nomeArquivoAnexo}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-1">
                  {s.status === 'AGUARDANDO_CLIENTE' && (
                    <button
                      type="button"
                      onClick={() => simularEnvioDocumentoCliente(s.id)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                    >
                      Simular Upload pelo Cliente
                    </button>
                  )}
                  {s.status === 'DOCUMENTO_RECEBIDO' && (
                    <button
                      type="button"
                      onClick={() => validarDocumentoEscritorio(s.id)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                    >
                      Validar Recebimento (Escritório)
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Guias DAS e Comprovantes Liberados no Portal do Cliente */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden self-start">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              Guias DAS Liberadas no Portal ({guiasLiberadas.length})
            </h4>
          </div>

          <div className="divide-y divide-slate-200/70">
            {guiasLiberadas.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                Nenhuma guia emitida ainda. Gere guias na aba "Emissão em Lote" para disponibilizar
                aqui automaticamente.
              </div>
            ) : (
              guiasLiberadas.map((g) => (
                <div key={g.id} className="p-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-xs text-slate-900">
                      {g.empresa?.razaoSocial}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Comp. {formatarCompetenciaExibicao(g.competencia)} • {g.valorTotal}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => window.open(`${API_BASE}/das/download/${g.id}`, '_blank')}
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    PDF
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 5. GOVERNANÇA, AUDITORIA & MODELO SAAS MULTI-TENANT (SEÇÕES 3.3, 7, 9 e 10)
// ============================================================================

export function GovernancaSaaSView() {
  const [dados, setDados] = useState<{
    organizacao: any;
    indicadoresProduto: any;
    logs: AuditLogItem[];
  } | null>(null);

  const carregarGovernanca = useCallback(async () => {
    const resp = await fetch(`${API_BASE}/governanca`);
    if (resp.ok) {
      setDados(await resp.json());
    }
  }, []);

  useEffect(() => {
    carregarGovernanca();
  }, [carregarGovernanca]);

  if (!dados) {
    return <div className="p-8 text-center text-sm text-slate-500">Carregando auditoria...</div>;
  }

  const { organizacao, indicadoresProduto, logs } = dados;

  return (
    <div className="space-y-6">
      {/* Resumo Multi-Tenant & Plano SaaS (Seções 3.3 e 9 do PDF) */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400">
            <Layers className="w-4 h-4" />
            Arquitetura Multi-Tenant & Isolamento Lógico (Seção 3.3 e 9)
          </div>
          <h3 className="text-lg font-bold">
            {organizacao.razaoSocial} • Tenant ID: <code>{organizacao.organizationId}</code>
          </h3>
          <p className="text-xs text-slate-300">
            Plano Ativo: <strong>{organizacao.planoSaaS}</strong> • CNPJs Monitorados:{' '}
            <strong>
              {organizacao.cnpjsUtilizados}/{organizacao.limiteCnpjs}
            </strong>{' '}
            • Franquia de Consultas SERPRO:{' '}
            <strong>
              {organizacao.consultasRealizadas}/{organizacao.franquiaConsultas}
            </strong>
          </p>
        </div>

        <div className="flex gap-2">
          {['Starter', 'Professional', 'Business'].map((plano) => (
            <span
              key={plano}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border ${
                organizacao.planoSaaS === plano
                  ? 'bg-blue-600 text-white border-blue-400'
                  : 'bg-white/5 text-slate-400 border-white/10'
              }`}
            >
              {plano}
            </span>
          ))}
        </div>
      </div>

      {/* Indicadores para Avaliar o Produto (Página 10 do PDF Alencon Tech) */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Indicadores Oficiais de Avaliação do Produto (Página 10 do PDF)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
            <p className="text-[11px] font-semibold text-slate-500">
              Horas Manuais Economizadas/Mês
            </p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {indicadoresProduto.horasEconomizadasMes}h
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
            <p className="text-[11px] font-semibold text-slate-500">
              Obrigações com Evidência
            </p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">
              {indicadoresProduto.percentualComEvidencia}%
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
            <p className="text-[11px] font-semibold text-slate-500">
              Tempo Atualização → Ciência
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              ~{indicadoresProduto.tempoMedioCienciaMinutos} min
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
            <p className="text-[11px] font-semibold text-slate-500">
              Ocorrências Tratadas no Prazo
            </p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">
              {indicadoresProduto.ocorrenciasTratadasNoPrazo}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
            <p className="text-[11px] font-semibold text-slate-500">
              Custo Médio API / Cliente
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              R$ {indicadoresProduto.custoMedioPorCliente}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
            <p className="text-[11px] font-semibold text-slate-500">
              Taxa de Consultas Inconclusivas
            </p>
            <p className="text-2xl font-bold text-amber-600 mt-1">
              {indicadoresProduto.taxaFalhasConsultas}%
            </p>
          </div>
        </div>
      </div>

      {/* Trilha de Auditoria e Segurança LGPD (audit_logs - Seção 4 e 7) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            Trilha de Auditoria Imutável (`audit_logs` — Seção 4 e 7)
          </h4>
          <span className="text-xs text-slate-500">
            Custo acumulado de APIs no período: R$ {indicadoresProduto.custoTotalAcumulado}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase bg-slate-50/40">
                <th className="py-3 px-5">Data / Hora</th>
                <th className="py-3 px-4">Tenant</th>
                <th className="py-3 px-4">Módulo</th>
                <th className="py-3 px-4">Ação Auditada</th>
                <th className="py-3 px-4">Detalhes e Contexto</th>
                <th className="py-3 px-5 text-right">Custo API</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="py-3 px-5 font-mono text-slate-500">
                    {new Date(log.createdAt).toLocaleString('pt-BR')}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">{log.organizationId}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold">
                      {log.modulo}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-blue-700">{log.acao}</td>
                  <td className="py-3 px-4 text-slate-700">{log.detalhes}</td>
                  <td className="py-3 px-5 text-right font-mono text-slate-500">
                    {log.custoEstimado > 0 ? `R$ ${log.custoEstimado.toFixed(2)}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

