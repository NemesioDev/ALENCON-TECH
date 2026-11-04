import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  LayoutDashboard,
  Building2,
  Settings,
  FileCheck2,
  AlertTriangle,
  Play,
  Download,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Upload,
  ShieldCheck,
  Sparkles,
  Trash2,
  FileSpreadsheet,
  Info,
  Calendar,
  Filter,
  RefreshCw,
  KeyRound,
  Lock,
  CheckSquare,
  Square,
  ShieldAlert,
  ClipboardCheck,
  Bot,
  Users,
  Activity,
} from 'lucide-react';
import {
  EmpresaCliente,
  ResumoPainel,
  ConfiguracaoEscritorio,
  RegimeTributario,
} from './types';
import {
  formatarCnpjMascara,
  formatarTelefoneMascara,
  formatarCompetenciaExibicao,
  OPCOES_COMPETENCIA,
} from './utils/formatters';
import {
  FiscalMonitorView,
  ComplianceMonitorView,
  AiAssistantView,
  ClientHubView,
  GovernancaSaaSView,
} from './components/ModulosAlencon';
import { DashboardGeralView } from './components/DashboardGeralView';

type AbaAtiva =
  | 'visao_geral'
  | 'emissao_das'
  | 'fiscal_monitor'
  | 'compliance'
  | 'ai_assistant'
  | 'client_hub'
  | 'clientes'
  | 'configuracoes'
  | 'governanca';

const API_BASE = '/api';

export default function App() {
  const [abaAtiva, setAbaAtiva] = useState<AbaAtiva>('visao_geral');

  // Estados da Tela 1: Painel de Emissão em Lote (SERPRO PGDAS-D & PGMEI)
  const [competencia, setCompetencia] = useState<string>('202610');
  const [filtroRegime, setFiltroRegime] = useState<string>('TODOS');
  const [empresas, setEmpresas] = useState<EmpresaCliente[]>([]);
  const [resumo, setResumo] = useState<ResumoPainel>({
    totalEmpresas: 0,
    guiasEmitidasNoMes: 0,
    guiasPendentesOuErro: 0,
    competencia: '202610',
  });
  const [carregandoTabela, setCarregandoTabela] = useState<boolean>(false);
  const [selecionadasIds, setSelecionadasIds] = useState<number[]>([]);
  const [emitindoLote, setEmitindoLote] = useState<boolean>(false);
  const [progressoLote, setProgressoLote] = useState<{ atual: number; total: number }>({
    atual: 0,
    total: 0,
  });
  const [empresaProcessandoAgora, setEmpresaProcessandoAgora] = useState<number | null>(null);
  const [modalErro, setModalErro] = useState<{
    aberto: boolean;
    razaoSocial: string;
    cnpj: string;
    mensagem: string;
  } | null>(null);

  // Estados do Cadastro de Clientes
  const [novaRazaoSocial, setNovaRazaoSocial] = useState('');
  const [novoCnpj, setNovoCnpj] = useState('');
  const [novoRegime, setNovoRegime] = useState<RegimeTributario>('SIMPLES_NACIONAL');
  const [novaUf, setNovaUf] = useState('SP');
  const [novoMunicipio, setNovoMunicipio] = useState('São Paulo');
  const [novoResponsavel, setNovoResponsavel] = useState('Ana Costa (Fiscal)');
  const [novoEmail, setNovoEmail] = useState('');
  const [novoWhatsapp, setNovoWhatsapp] = useState('');
  const [salvandoEmpresa, setSalvandoEmpresa] = useState(false);
  const [mostrarImportacaoLote, setMostrarImportacaoLote] = useState(false);
  const [textoImportacaoLote, setTextoImportacaoLote] = useState('');
  const [alertaClientes, setAlertaClientes] = useState<{
    tipo: 'sucesso' | 'erro';
    texto: string;
  } | null>(null);

  // Estados das Configurações e Conexão SERPRO
  const [config, setConfig] = useState<ConfiguracaoEscritorio>({
    id: 1,
    organizationId: 'org_alencon_001',
    nomePlataforma: 'Alencon Tech',
    planoSaaS: 'Professional',
    modoAmbiente: 'trial',
    cnpjEscritorio: '00000000000191',
    razaoSocial: 'Alencon Contabilidade & Inteligência Fiscal Ltda',
    consumerKey: '',
    consumerSecret: '',
    certificadoNome: '',
    certificadoPath: '',
    certificadoSenha: '',
    temCertificadoSalvo: false,
    ultimoTesteSucesso: true,
    ultimoTesteData: null,
    ultimoTesteMensagem: '',
  });
  const [salvandoConfig, setSalvandoConfig] = useState(false);
  const [testandoConexao, setTestandoConexao] = useState(false);
  const [arrastandoCertificado, setArrastandoCertificado] = useState(false);
  const [alertaConfig, setAlertaConfig] = useState<{
    tipo: 'sucesso' | 'erro';
    titulo: string;
    texto: string;
  } | null>(null);
  const inputFileRef = useRef<HTMLInputElement | null>(null);

  const carregarEmpresas = useCallback(async () => {
    setCarregandoTabela(true);
    try {
      const params = new URLSearchParams({
        competencia,
        regime: filtroRegime,
      });
      const resp = await fetch(`${API_BASE}/empresas?${params.toString()}`);
      const dados = await resp.json();
      if (resp.ok) {
        setEmpresas(dados.empresas || []);
        setResumo(
          dados.resumo || {
            totalEmpresas: 0,
            guiasEmitidasNoMes: 0,
            guiasPendentesOuErro: 0,
            competencia,
          }
        );
      }
    } catch (err) {
      console.error('Erro ao buscar empresas:', err);
    } finally {
      setCarregandoTabela(false);
    }
  }, [competencia, filtroRegime]);

  const carregarConfiguracoes = useCallback(async () => {
    try {
      const resp = await fetch(`${API_BASE}/configuracoes`);
      if (resp.ok) {
        const dados = await resp.json();
        setConfig(dados);
      }
    } catch (err) {
      console.error('Erro ao carregar configurações:', err);
    }
  }, []);

  useEffect(() => {
    carregarEmpresas();
  }, [carregarEmpresas]);

  useEffect(() => {
    carregarConfiguracoes();
  }, [carregarConfiguracoes]);

  const todasSelecionadas =
    empresas.length > 0 && empresas.every((emp) => selecionadasIds.includes(emp.id));

  const alternarSelecionarTodas = () => {
    if (todasSelecionadas) {
      setSelecionadasIds([]);
    } else {
      setSelecionadasIds(empresas.map((e) => e.id));
    }
  };

  const alternarSelecionarEmpresa = (id: number) => {
    setSelecionadasIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const emitirGuiasLote = async (idsParaEmitir?: number[]) => {
    const alvos = idsParaEmitir && idsParaEmitir.length > 0 ? idsParaEmitir : selecionadasIds;

    if (alvos.length === 0) {
      const todosIds = empresas.map((e) => e.id);
      if (todosIds.length === 0) return;
      setSelecionadasIds(todosIds);
      await executarEmissaoSequencial(todosIds);
      return;
    }

    await executarEmissaoSequencial(alvos);
  };

  const executarEmissaoSequencial = async (ids: number[]) => {
    setEmitindoLote(true);
    setProgressoLote({ atual: 0, total: ids.length });

    setEmpresas((prev) =>
      prev.map((emp) =>
        ids.includes(emp.id)
          ? {
              ...emp,
              guiaMes: {
                ...emp.guiaMes,
                status: 'PROCESSANDO',
                mensagemRetorno: 'Conectando ao Integra Contador SERPRO...',
              },
            }
          : emp
      )
    );

    for (let i = 0; i < ids.length; i++) {
      const empresaId = ids[i];
      setEmpresaProcessandoAgora(empresaId);
      setProgressoLote({ atual: i + 1, total: ids.length });

      try {
        await new Promise((r) => setTimeout(r, 400));

        const resp = await fetch(`${API_BASE}/das/emitir-lote`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            empresaIds: [empresaId],
            competencia,
          }),
        });

        const dados = await resp.json();
        const resultadoItem = dados?.resultados?.[0];

        if (resp.ok && resultadoItem?.guia) {
          setEmpresas((prev) =>
            prev.map((emp) =>
              emp.id === empresaId
                ? {
                    ...emp,
                    guiaMes: {
                      id: resultadoItem.guia.id,
                      competencia: resultadoItem.guia.competencia,
                      status: resultadoItem.guia.status,
                      idSistema: resultadoItem.guia.idSistema,
                      idServico: resultadoItem.guia.idServico,
                      mensagemRetorno: resultadoItem.guia.mensagemRetorno,
                      nomeArquivoPdf: resultadoItem.guia.nomeArquivoPdf,
                      modoEmissao: resultadoItem.guia.modoEmissao,
                      codigoAutenticacao: resultadoItem.guia.codigoAutenticacao,
                      valorTotal: resultadoItem.guia.valorTotal,
                      dataVencimento: resultadoItem.guia.dataVencimento,
                    },
                  }
                : emp
            )
          );
        } else {
          setEmpresas((prev) =>
            prev.map((emp) =>
              emp.id === empresaId
                ? {
                    ...emp,
                    guiaMes: {
                      ...emp.guiaMes,
                      status: 'ERRO',
                      mensagemRetorno:
                        dados?.erro || 'Falha ao comunicar com a API do SERPRO.',
                    },
                  }
                : emp
            )
          );
        }
      } catch (err: any) {
        setEmpresas((prev) =>
          prev.map((emp) =>
            emp.id === empresaId
              ? {
                  ...emp,
                  guiaMes: {
                    ...emp.guiaMes,
                    status: 'ERRO',
                    mensagemRetorno: err.message || 'Erro de conexão com o servidor.',
                  },
                }
              : emp
          )
        );
      }
    }

    setEmpresaProcessandoAgora(null);
    setEmitindoLote(false);
    await carregarEmpresas();
  };

  const baixarPdfGuia = (guiaId: number | null) => {
    if (!guiaId) return;
    window.open(`${API_BASE}/das/download/${guiaId}`, '_blank');
  };

  const salvarNovaEmpresa = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlertaClientes(null);
    setSalvandoEmpresa(true);

    try {
      const resp = await fetch(`${API_BASE}/empresas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razaoSocial: novaRazaoSocial,
          cnpj: novoCnpj,
          regimeTributario: novoRegime,
          uf: novaUf,
          municipio: novoMunicipio,
          responsavelFiscal: novoResponsavel,
          email: novoEmail,
          whatsapp: novoWhatsapp,
        }),
      });
      const dados = await resp.json();

      if (!resp.ok) {
        setAlertaClientes({
          tipo: 'erro',
          texto: dados.erro || 'Não foi possível cadastrar a empresa.',
        });
      } else {
        setAlertaClientes({
          tipo: 'sucesso',
          texto: `Empresa "${dados.razaoSocial}" cadastrada com sucesso!`,
        });
        setNovaRazaoSocial('');
        setNovoCnpj('');
        setNovoEmail('');
        setNovoWhatsapp('');
        await carregarEmpresas();
      }
    } catch (err: any) {
      setAlertaClientes({
        tipo: 'erro',
        texto: err.message || 'Erro de comunicação ao salvar empresa.',
      });
    } finally {
      setSalvandoEmpresa(false);
    }
  };

  const carregarDadosDemonstracao = async () => {
    setAlertaClientes(null);
    setSalvandoEmpresa(true);
    try {
      const resp = await fetch(`${API_BASE}/empresas/demo`, { method: 'POST' });
      const dados = await resp.json();
      if (resp.ok) {
        setAlertaClientes({
          tipo: 'sucesso',
          texto:
            dados.mensagem ||
            'Empresas de demonstração carregadas! Confira na aba Painel de Emissão.',
        });
        await carregarEmpresas();
      }
    } catch {
      setAlertaClientes({
        tipo: 'erro',
        texto: 'Erro ao carregar empresas de demonstração.',
      });
    } finally {
      setSalvandoEmpresa(false);
    }
  };

  const importarClientesEmLote = async () => {
    if (!textoImportacaoLote.trim()) return;
    setAlertaClientes(null);
    setSalvandoEmpresa(true);

    try {
      const linhas = textoImportacaoLote
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);

      const listaParaImportar = linhas.map((linha) => {
        const partes = linha.split(/[;,|\t]/).map((p) => p.trim());
        return {
          razaoSocial: partes[0] || '',
          cnpj: partes[1] || '',
          regimeTributario: partes[2] || 'SIMPLES_NACIONAL',
          email: partes[3] || '',
          whatsapp: partes[4] || '',
        };
      });

      const resp = await fetch(`${API_BASE}/empresas/lote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empresas: listaParaImportar }),
      });

      const dados = await resp.json();
      if (resp.ok) {
        setAlertaClientes({
          tipo: 'sucesso',
          texto: dados.mensagem,
        });
        setTextoImportacaoLote('');
        setMostrarImportacaoLote(false);
        await carregarEmpresas();
      } else {
        setAlertaClientes({
          tipo: 'erro',
          texto: dados.erro || 'Erro ao importar lista.',
        });
      }
    } catch (err: any) {
      setAlertaClientes({
        tipo: 'erro',
        texto: err.message || 'Falha ao importar empresas.',
      });
    } finally {
      setSalvandoEmpresa(false);
    }
  };

  const removerEmpresa = async (id: number, razaoSocial: string) => {
    if (!window.confirm(`Deseja realmente remover a empresa "${razaoSocial}"?`)) return;
    try {
      await fetch(`${API_BASE}/empresas/${id}`, { method: 'DELETE' });
      setSelecionadasIds((prev) => prev.filter((item) => item !== id));
      await carregarEmpresas();
    } catch (err) {
      console.error('Erro ao excluir empresa:', err);
    }
  };

  const alternarModoAmbiente = async (novoModo: 'trial' | 'production') => {
    setAlertaConfig(null);
    const novaConfig = { ...config, modoAmbiente: novoModo };
    setConfig(novaConfig);

    try {
      await fetch(`${API_BASE}/configuracoes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novaConfig),
      });
    } catch (err) {
      console.error('Erro ao alternar modo:', err);
    }
  };

  const salvarConfiguracoes = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvandoConfig(true);
    setAlertaConfig(null);
    try {
      const resp = await fetch(`${API_BASE}/configuracoes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const dados = await resp.json();
      if (resp.ok) {
        setConfig(dados.configuracao);
        setAlertaConfig({
          tipo: 'sucesso',
          titulo: 'Configurações Salvas!',
          texto: 'Os parâmetros de integração do escritório foram salvos com segurança.',
        });
      } else {
        setAlertaConfig({
          tipo: 'erro',
          titulo: 'Erro ao Salvar',
          texto: dados.erro || 'Verifique os campos informados.',
        });
      }
    } catch (err: any) {
      setAlertaConfig({
        tipo: 'erro',
        titulo: 'Erro de Comunicação',
        texto: err.message,
      });
    } finally {
      setSalvandoConfig(false);
    }
  };

  const enviarArquivoCertificado = async (arquivo: File) => {
    setAlertaConfig(null);
    const formData = new FormData();
    formData.append('certificado', arquivo);
    formData.append('certificadoSenha', config.certificadoSenha || '');

    try {
      const resp = await fetch(`${API_BASE}/configuracoes/certificado`, {
        method: 'POST',
        body: formData,
      });
      const dados = await resp.json();
      if (resp.ok) {
        setConfig(dados.configuracao);
        setAlertaConfig({
          tipo: 'sucesso',
          titulo: 'Certificado Digital A1 Carregado!',
          texto: dados.mensagem,
        });
      } else {
        setAlertaConfig({
          tipo: 'erro',
          titulo: 'Falha no Upload do Certificado',
          texto: dados.erro || 'Não foi possível enviar o arquivo .pfx.',
        });
      }
    } catch (err: any) {
      setAlertaConfig({
        tipo: 'erro',
        titulo: 'Erro no Upload',
        texto: err.message,
      });
    }
  };

  const testarConexaoComSerpro = async () => {
    setTestandoConexao(true);
    setAlertaConfig(null);
    try {
      const resp = await fetch(`${API_BASE}/configuracoes/testar-conexao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const dados = await resp.json();
      if (resp.ok && dados.sucesso) {
        setAlertaConfig({
          tipo: 'sucesso',
          titulo: 'Conexão com o SERPRO Funcionando Perfeitamente!',
          texto: dados.mensagem,
        });
        await carregarConfiguracoes();
      } else {
        setAlertaConfig({
          tipo: 'erro',
          titulo: 'Não Foi Possível Autenticar no SERPRO',
          texto:
            dados.mensagem ||
            'Verifique se o Certificado A1 (.pfx), a senha e as chaves Consumer Key/Secret estão corretos.',
        });
      }
    } catch (err: any) {
      setAlertaConfig({
        tipo: 'erro',
        titulo: 'Erro ao Testar Conexão',
        texto: err.message || 'Falha ao conectar ao servidor back-end.',
      });
    } finally {
      setTestandoConexao(false);
    }
  };

  const itensMenu: {
    id: AbaAtiva;
    titulo: string;
    subtitulo: string;
    icone: React.ReactNode;
    badge?: string;
  }[] = [
    {
      id: 'visao_geral',
      titulo: 'Visão Geral 360º',
      subtitulo: 'Dashboard Geral & Empresas',
      icone: <LayoutDashboard className="w-5 h-5 shrink-0" />,
      badge: 'Início',
    },
    {
      id: 'emissao_das',
      titulo: 'Emissão DAS (SERPRO)',
      subtitulo: 'PGDAS-D & PGMEI em Lote',
      icone: <FileCheck2 className="w-5 h-5 shrink-0" />,
    },
    {
      id: 'fiscal_monitor',
      titulo: 'Fiscal Monitor',
      subtitulo: 'Situação Fiscal & Eventos',
      icone: <ShieldAlert className="w-5 h-5 shrink-0" />,
      badge: 'Módulo 1',
    },
    {
      id: 'compliance',
      titulo: 'Compliance Monitor',
      subtitulo: 'Obrigações, Regras & Tarefas',
      icone: <ClipboardCheck className="w-5 h-5 shrink-0" />,
      badge: 'Módulo 2',
    },
    {
      id: 'ai_assistant',
      titulo: 'AI Assistant (MCP)',
      subtitulo: 'Consultas & Guardrails IA',
      icone: <Bot className="w-5 h-5 shrink-0" />,
      badge: 'Módulo 3',
    },
    {
      id: 'client_hub',
      titulo: 'Client Hub',
      subtitulo: 'Portal Cliente ↔ Escritório',
      icone: <Users className="w-5 h-5 shrink-0" />,
      badge: 'Módulo 4',
    },
    {
      id: 'clientes',
      titulo: 'Carteira de Clientes',
      subtitulo: `Empresas & Perfis (${resumo.totalEmpresas})`,
      icone: <Building2 className="w-5 h-5 shrink-0" />,
    },
    {
      id: 'configuracoes',
      titulo: 'Integration Hub SERPRO',
      subtitulo: 'Certificado A1 & Credenciais',
      icone: <Settings className="w-5 h-5 shrink-0" />,
    },
    {
      id: 'governanca',
      titulo: 'Auditoria & Indicadores',
      subtitulo: 'Multi-Tenant, Custos & LGPD',
      icone: <Activity className="w-5 h-5 shrink-0" />,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 text-slate-800">
      {/* MENU LATERAL (SIDEBAR ALENCON TECH) */}
      <aside className="w-full md:w-72 bg-slate-900 text-white flex flex-col shrink-0 shadow-xl">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30 font-extrabold text-lg">
            AT
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight text-white leading-tight">
              ALENCON <span className="text-blue-400">TECH</span>
            </h1>
            <p className="text-[11px] text-slate-400">Inteligência & Automação Contábil</p>
          </div>
        </div>

        {/* Status Rápido do Ambiente */}
        <div className="px-4 pt-4">
          <div
            onClick={() => setAbaAtiva('configuracoes')}
            className={`cursor-pointer rounded-xl p-3 border transition-all ${
              config.modoAmbiente === 'trial'
                ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-200 hover:bg-emerald-950'
                : 'bg-blue-950/60 border-blue-700/60 text-blue-200 hover:bg-blue-950'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider mb-1">
              <span>Integration Hub SERPRO</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-white/10">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    config.modoAmbiente === 'trial' ? 'bg-emerald-400' : 'bg-blue-400'
                  }`}
                />
                {config.modoAmbiente === 'trial' ? 'Simulação' : 'Produção'}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {config.modoAmbiente === 'trial'
                ? 'Testes gratuitos ativos (Sem Certificado A1)'
                : 'Conectado à Receita Federal (mTLS A1)'}
            </p>
          </div>
        </div>

        {/* Navegação entre todos os módulos */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {itensMenu.map((item) => (
            <button
              key={item.id}
              onClick={() => setAbaAtiva(item.id)}
              className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                abaAtiva === item.id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {item.icone}
                <div className="text-left truncate">
                  <div className="font-semibold truncate">{item.titulo}</div>
                  <div className="text-[10px] opacity-75 font-normal truncate">
                    {item.subtitulo}
                  </div>
                </div>
              </div>
              {item.badge && (
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 ${
                    abaAtiva === item.id
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-800 text-blue-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
          <div className="font-semibold text-slate-200 truncate">{config.razaoSocial}</div>
          <div className="flex items-center justify-between">
            <span>Tenant: {config.organizationId || 'org_alencon_001'}</span>
            <span className="text-blue-400 font-bold">{config.planoSaaS || 'Professional'}</span>
          </div>
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="bg-white border-b border-slate-200 px-6 lg:px-8 py-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {abaAtiva === 'visao_geral' &&
                'Dashboard Geral 360º — Aparato Completo do Sistema e Empresas'}
              {abaAtiva === 'emissao_das' && 'Painel de Emissão de DAS em Lote (Integra Contador)'}
              {abaAtiva === 'fiscal_monitor' &&
                'Módulo 1 — Fiscal Monitor (Situação Fiscal, Eventos e Ocorrências)'}
              {abaAtiva === 'compliance' &&
                'Módulo 2 — Compliance Monitor (Obrigações, Regras Normativas e Tarefas)'}
              {abaAtiva === 'ai_assistant' &&
                'Módulo 3 — AI Assistant (Consultas Controladas com Guardrails e MCP)'}
              {abaAtiva === 'client_hub' &&
                'Módulo 4 — Client Hub (Portal de Relacionamento Escritório ↔ Cliente)'}
              {abaAtiva === 'clientes' && 'Carteira de Empresas Clientes & Perfis Tributários'}
              {abaAtiva === 'configuracoes' &&
                'Integration Hub — Credenciais do Escritório e Conexão SERPRO'}
              {abaAtiva === 'governanca' &&
                'Governança Multi-Tenant, Logs de Auditoria e Indicadores SaaS'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Transformando rotinas fiscais e contábeis em processos monitorados, rastreáveis e
              inteligentes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border ${
                config.modoAmbiente === 'trial'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              {config.modoAmbiente === 'trial'
                ? 'Modo Simulação SERPRO (Gratuito)'
                : 'Modo Produção (Receita Federal Real)'}
            </span>
          </div>
        </header>

        <div className="p-6 lg:p-8 flex-1 space-y-6 max-w-7xl w-full mx-auto">
          {/* ===================================================================
              ABA INICIAL: VISÃO GERAL 360º (DASHBOARD DE TODO O SISTEMA E EMPRESAS)
             =================================================================== */}
          {abaAtiva === 'visao_geral' && (
            <DashboardGeralView
              competencia={competencia}
              onChangeCompetencia={(nova) => setCompetencia(nova)}
              onNavigateAba={(destino) => setAbaAtiva(destino)}
            />
          )}

          {/* ===================================================================
              MÓDULOS DO PDF ALENCON TECH
             =================================================================== */}
          {abaAtiva === 'fiscal_monitor' && <FiscalMonitorView empresas={empresas} />}
          {abaAtiva === 'compliance' && <ComplianceMonitorView competencia={competencia} />}
          {abaAtiva === 'ai_assistant' && <AiAssistantView />}
          {abaAtiva === 'client_hub' && <ClientHubView empresas={empresas} />}
          {abaAtiva === 'governanca' && <GovernancaSaaSView />}

          {/* ===================================================================
              PAINEL DE EMISSÃO EM LOTE (DASHBOARD PRINCIPAL DAS)
             =================================================================== */}
          {abaAtiva === 'emissao_das' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      Total de Empresas Cadastradas
                    </p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">
                      {resumo.totalEmpresas}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Carteira ativa Simples Nacional & MEI
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
                    <Building2 className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-emerald-200/80 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Guias Emitidas no Mês</p>
                    <p className="text-3xl font-bold text-emerald-600 mt-1">
                      {resumo.guiasEmitidasNoMes}
                    </p>
                    <p className="text-xs text-emerald-600/80 mt-1">
                      Competência {formatarCompetenciaExibicao(competencia)} pronta c/ evidência
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <FileCheck2 className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-amber-200/80 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      Guias Pendentes / Com Erro
                    </p>
                    <p className="text-3xl font-bold text-amber-600 mt-1">
                      {resumo.guiasPendentesOuErro}
                    </p>
                    <p className="text-xs text-amber-600/80 mt-1">
                      Aguardando geração na competência {formatarCompetenciaExibicao(competencia)}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* BARRA DE CONTROLE */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex flex-col">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      Competência (Mês/Ano)
                    </label>
                    <select
                      value={competencia}
                      onChange={(e) => setCompetencia(e.target.value)}
                      disabled={emitindoLote}
                      className="h-11 px-3.5 rounded-xl border border-slate-300 bg-slate-50 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    >
                      {OPCOES_COMPETENCIA.map((op) => (
                        <option key={op.valor} value={op.valor}>
                          {op.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Filter className="w-3.5 h-3.5 text-blue-600" />
                      Regime Tributário
                    </label>
                    <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                      {[
                        { id: 'TODOS', label: 'Todos' },
                        { id: 'SIMPLES_NACIONAL', label: 'Simples Nacional' },
                        { id: 'MEI', label: 'MEI' },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          disabled={emitindoLote}
                          onClick={() => setFiltroRegime(tab.id)}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            filtroRegime === tab.id
                              ? 'bg-white text-blue-600 shadow-sm'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => carregarEmpresas()}
                    disabled={emitindoLote || carregandoTabela}
                    title="Atualizar lista"
                    className="h-12 px-3.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center gap-2 text-sm font-medium disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${carregandoTabela ? 'animate-spin' : ''}`}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() => emitirGuiasLote()}
                    disabled={emitindoLote || empresas.length === 0}
                    className="h-12 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {emitindoLote ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>
                          Emitindo Guias ({progressoLote.atual}/{progressoLote.total})...
                        </span>
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5 fill-current" />
                        <span>
                          Emitir DAS em Lote
                          {selecionadasIds.length > 0
                            ? ` (${selecionadasIds.length} selecionada${
                                selecionadasIds.length > 1 ? 's' : ''
                              })`
                            : ' (Todas)'}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {emitindoLote && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin shrink-0" />
                    <div className="text-sm">
                      <span className="font-semibold text-blue-950">
                        Worker de Emissão SERPRO em execução...
                      </span>{' '}
                      <span className="text-blue-700">
                        Cada guia emitida atualiza automaticamente o estado da obrigação para
                        "Cumprida" no Compliance Monitor e grava o protocolo na Auditoria.
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-blue-800 bg-blue-100 px-3 py-1 rounded-full shrink-0">
                    {Math.round((progressoLote.atual / Math.max(progressoLote.total, 1)) * 100)}%
                  </span>
                </div>
              )}

              {/* TABELA DE EMPRESAS */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <span>Empresas Listadas ({empresas.length})</span>
                    {selecionadasIds.length > 0 && (
                      <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full">
                        {selecionadasIds.length} marcada(s) para emissão
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500">
                    Competência ativa:{' '}
                    <strong className="text-slate-800">
                      {formatarCompetenciaExibicao(competencia)}
                    </strong>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/40">
                        <th className="py-3.5 px-5 w-12">
                          <button
                            type="button"
                            onClick={alternarSelecionarTodas}
                            disabled={emitindoLote}
                            className="text-slate-500 hover:text-blue-600 flex items-center"
                            title="Selecionar todas as empresas"
                          >
                            {todasSelecionadas ? (
                              <CheckSquare className="w-5 h-5 text-blue-600" />
                            ) : (
                              <Square className="w-5 h-5" />
                            )}
                          </button>
                        </th>
                        <th className="py-3.5 px-4">Razão Social</th>
                        <th className="py-3.5 px-4">CNPJ</th>
                        <th className="py-3.5 px-4">Regime</th>
                        <th className="py-3.5 px-4">Status da Guia no Mês</th>
                        <th className="py-3.5 px-6 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/70 text-sm">
                      {empresas.map((emp) => {
                        const isSelected = selecionadasIds.includes(emp.id);
                        const status = emp.guiaMes?.status || 'NAO_GERADA';
                        const isProcessingThis =
                          status === 'PROCESSANDO' || empresaProcessandoAgora === emp.id;

                        return (
                          <tr
                            key={emp.id}
                            className={`transition-colors ${
                              isProcessingThis
                                ? 'bg-blue-50/70'
                                : isSelected
                                ? 'bg-slate-50'
                                : 'hover:bg-slate-50/80'
                            }`}
                          >
                            <td className="py-4 px-5">
                              <button
                                type="button"
                                disabled={emitindoLote}
                                onClick={() => alternarSelecionarEmpresa(emp.id)}
                                className="text-slate-400 hover:text-blue-600 flex items-center"
                              >
                                {isSelected ? (
                                  <CheckSquare className="w-5 h-5 text-blue-600" />
                                ) : (
                                  <Square className="w-5 h-5" />
                                )}
                              </button>
                            </td>

                            <td className="py-4 px-4">
                              <div className="font-semibold text-slate-900 flex items-center gap-2">
                                <span>{emp.razaoSocial}</span>
                                {(emp.pendenciasAtivasCount || 0) > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => setAbaAtiva('fiscal_monitor')}
                                    className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 hover:bg-red-200"
                                    title="Ver ocorrências no Fiscal Monitor"
                                  >
                                    {emp.pendenciasAtivasCount} pendência(s) fiscal(is)
                                  </button>
                                )}
                              </div>
                              <div className="text-xs text-slate-400 mt-0.5">
                                {emp.uf || 'SP'}/{emp.municipio || 'São Paulo'} • Resp:{' '}
                                {emp.responsavelFiscal || 'Ana Costa'}
                                {emp.guiaMes?.valorTotal
                                  ? ` • Valor: ${emp.guiaMes.valorTotal} (Venc. ${emp.guiaMes.dataVencimento})`
                                  : ''}
                              </div>
                            </td>

                            <td className="py-4 px-4 font-mono text-xs font-medium text-slate-700">
                              {formatarCnpjMascara(emp.cnpj)}
                            </td>

                            <td className="py-4 px-4">
                              {emp.regimeTributario === 'MEI' ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                                  MEI (PGMEI)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                                  Simples Nacional
                                </span>
                              )}
                            </td>

                            <td className="py-4 px-4">
                              {isProcessingThis && (
                                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200 animate-pulse">
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                                  Processando...
                                </span>
                              )}

                              {!isProcessingThis && status === 'NAO_GERADA' && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                                  Não Gerada
                                </span>
                              )}

                              {!isProcessingThis && status === 'EMITIDA' && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  Emitida com Sucesso
                                </span>
                              )}

                              {!isProcessingThis && status === 'ERRO' && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
                                  <XCircle className="w-3.5 h-3.5 text-red-600" />
                                  Erro na Receita
                                </span>
                              )}
                            </td>

                            <td className="py-4 px-6 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {status === 'EMITIDA' && emp.guiaMes?.id && (
                                  <button
                                    type="button"
                                    onClick={() => baixarPdfGuia(emp.guiaMes.id)}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                    Baixar PDF
                                  </button>
                                )}

                                {status === 'ERRO' && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setModalErro({
                                        aberto: true,
                                        razaoSocial: emp.razaoSocial,
                                        cnpj: formatarCnpjMascara(emp.cnpj),
                                        mensagem:
                                          emp.guiaMes?.mensagemRetorno ||
                                          'Erro retornado pelo SERPRO.',
                                      })
                                    }
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold transition-all"
                                  >
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                    Ver Motivo do Erro
                                  </button>
                                )}

                                <button
                                  type="button"
                                  disabled={emitindoLote}
                                  onClick={() => emitirGuiasLote([emp.id])}
                                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-semibold transition-all disabled:opacity-40"
                                >
                                  <Play className="w-3 h-3 fill-current" />
                                  {status === 'EMITIDA' ? 'Regerar' : 'Emitir'}
                                </button>
                              </div>
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

          {/* ===================================================================
              CADASTRO DE CLIENTES E PERFIS TRIBUTÁRIOS (`clients` & `tax_profiles`)
             =================================================================== */}
          {abaAtiva === 'clientes' && (
            <div className="space-y-6">
              {alertaClientes && (
                <div
                  className={`p-4 rounded-2xl border flex items-center justify-between ${
                    alertaClientes.tipo === 'sucesso'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}
                >
                  <div className="flex items-center gap-3 text-sm font-medium">
                    {alertaClientes.tipo === 'sucesso' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                    )}
                    <span>{alertaClientes.texto}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAlertaClientes(null)}
                    className="text-xs font-semibold underline opacity-75 hover:opacity-100"
                  >
                    Fechar
                  </button>
                </div>
              )}

              <div className="bg-gradient-to-r from-blue-900 to-slate-900 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-blue-300 mb-1">
                    <Sparkles className="w-4 h-4" />
                    Importação Estruturada & Demonstração (Seção 5.4)
                  </span>
                  <h3 className="text-lg font-bold">
                    Importação Rápida de Clientes ou Dados de Demonstração
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Carregue empresas de exemplo com 1 clique ou importe planilha/CSV estruturado
                    com validação e rastreabilidade.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={carregarDadosDemonstracao}
                    disabled={salvandoEmpresa}
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold flex items-center gap-2 transition-all"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    Carregar Dados de Demonstração (1 Clique)
                  </button>

                  <button
                    type="button"
                    onClick={() => setMostrarImportacaoLote((v) => !v)}
                    className="px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    {mostrarImportacaoLote ? 'Fechar Importação em Lote' : 'Importar Vários Clientes'}
                  </button>
                </div>
              </div>

              {mostrarImportacaoLote && (
                <div className="bg-white rounded-2xl p-6 border border-blue-200 shadow-sm space-y-4">
                  <h4 className="font-bold text-slate-900 text-base">
                    Importar Vários Clientes de Uma Vez
                  </h4>
                  <textarea
                    rows={4}
                    value={textoImportacaoLote}
                    onChange={(e) => setTextoImportacaoLote(e.target.value)}
                    placeholder={`Exemplo:\nMercado Bom Preço Ltda; 11.222.333/0001-44; SIMPLES; contato@bompreco.com.br; 11999998888`}
                    className="w-full rounded-xl border border-slate-300 p-3.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setMostrarImportacaoLote(false)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={importarClientesEmLote}
                      disabled={salvandoEmpresa}
                      className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Processar Importação em Lote
                    </button>
                  </div>
                </div>
              )}

              <form
                onSubmit={salvarNovaEmpresa}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5"
              >
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-blue-600" />
                    Novo Cliente & Perfil Tributário (`clients` + `tax_profiles`)
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="lg:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      Razão Social *
                    </label>
                    <input
                      type="text"
                      required
                      value={novaRazaoSocial}
                      onChange={(e) => setNovaRazaoSocial(e.target.value)}
                      placeholder="Ex: Comercial de Alimentos São José Ltda"
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      CNPJ *
                    </label>
                    <input
                      type="text"
                      required
                      value={novoCnpj}
                      onChange={(e) => setNovoCnpj(formatarCnpjMascara(e.target.value))}
                      placeholder="00.000.000/0001-00"
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-sm font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      Regime Tributário *
                    </label>
                    <select
                      value={novoRegime}
                      onChange={(e) => setNovoRegime(e.target.value as RegimeTributario)}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white text-sm font-medium"
                    >
                      <option value="SIMPLES_NACIONAL">Simples Nacional (PGDAS-D)</option>
                      <option value="MEI">MEI (PGMEI)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      UF / Município
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={2}
                        value={novaUf}
                        onChange={(e) => setNovaUf(e.target.value.toUpperCase())}
                        className="w-16 h-11 px-2.5 rounded-xl border border-slate-300 text-sm text-center font-bold"
                      />
                      <input
                        type="text"
                        value={novoMunicipio}
                        onChange={(e) => setNovoMunicipio(e.target.value)}
                        className="flex-1 h-11 px-3 rounded-xl border border-slate-300 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      Responsável na Equipe
                    </label>
                    <input
                      type="text"
                      value={novoResponsavel}
                      onChange={(e) => setNovoResponsavel(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      E-mail
                    </label>
                    <input
                      type="email"
                      value={novoEmail}
                      onChange={(e) => setNovoEmail(e.target.value)}
                      placeholder="financeiro@empresa.com.br"
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      WhatsApp
                    </label>
                    <input
                      type="text"
                      value={novoWhatsapp}
                      onChange={(e) => setNovoWhatsapp(formatarTelefoneMascara(e.target.value))}
                      placeholder="(11) 99999-9999"
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-sm"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={salvandoEmpresa}
                    className="h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Cadastrar Empresa Cliente
                  </button>
                </div>
              </form>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 text-sm">
                    Carteira de Clientes Cadastrados ({empresas.length})
                  </h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase bg-slate-50/50">
                        <th className="py-3 px-6">Razão Social</th>
                        <th className="py-3 px-4">CNPJ</th>
                        <th className="py-3 px-4">Regime & UF</th>
                        <th className="py-3 px-4">Responsável</th>
                        <th className="py-3 px-6 text-right">Remover</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/60">
                      {empresas.map((emp) => (
                        <tr key={emp.id} className="hover:bg-slate-50">
                          <td className="py-3.5 px-6 font-medium text-slate-900">
                            {emp.razaoSocial}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                            {formatarCnpjMascara(emp.cnpj)}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                emp.regimeTributario === 'MEI'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-indigo-100 text-indigo-800'
                              }`}
                            >
                              {emp.regimeTributario === 'MEI' ? 'MEI' : 'Simples Nacional'}
                            </span>
                            <span className="ml-2 text-xs text-slate-500">
                              ({emp.uf || 'SP'}/{emp.municipio || 'São Paulo'})
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-xs text-slate-600">
                            {emp.responsavelFiscal || 'Ana Costa (Fiscal)'}
                          </td>
                          <td className="py-3.5 px-6 text-right">
                            <button
                              type="button"
                              onClick={() => removerEmpresa(emp.id, emp.razaoSocial)}
                              className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================
              CONFIGURAÇÕES DO ESCRITÓRIO E CONEXÃO SERPRO
             =================================================================== */}
          {abaAtiva === 'configuracoes' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                      Integration Hub — Conector SERPRO Integra Contador (Seção 5)
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                      Selecione o Ambiente de Conexão com o SERPRO
                    </h3>
                  </div>

                  <div className="inline-flex rounded-2xl bg-slate-100 p-1.5 border border-slate-200 self-start">
                    <button
                      type="button"
                      onClick={() => alternarModoAmbiente('trial')}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                        config.modoAmbiente === 'trial'
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Sparkles className="w-4 h-4" />
                      Modo Simulação (Testes Gratuitos)
                    </button>

                    <button
                      type="button"
                      onClick={() => alternarModoAmbiente('production')}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                        config.modoAmbiente === 'production'
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Lock className="w-4 h-4" />
                      Modo Produção (Receita Federal Real)
                    </button>
                  </div>
                </div>

                {config.modoAmbiente === 'trial' ? (
                  <div className="rounded-2xl bg-emerald-50/90 border border-emerald-200 p-5 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                      <Info className="w-5 h-5" />
                    </div>
                    <div className="space-y-1.5 text-sm text-emerald-950">
                      <h4 className="font-bold text-emerald-900">
                        Você está no Modo Simulação (Testes Gratuitos do SERPRO)
                      </h4>
                      <p className="text-emerald-800 leading-relaxed">
                        No <strong>Modo Simulação</strong>, o sistema testa a geração de PDFs
                        gratuitamente usando os dados oficiais de demonstração do{' '}
                        <strong>Integra Contador SERPRO</strong>,{' '}
                        <strong>sem precisar de Certificado Digital A1</strong>. Independentemente
                        do CNPJ ou mês selecionado no painel, o sistema envia automaticamente por
                        baixo dos panos os parâmetros exigidos pelo servidor de testes do SERPRO (
                        <code>00000000000191</code>, competência <code>201801</code> para PGDAS-D e{' '}
                        <code>201901</code> para PGMEI).
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl bg-blue-50/90 border border-blue-200 p-5 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div className="space-y-1.5 text-sm text-blue-950">
                      <h4 className="font-bold text-blue-900">
                        Modo Produção Ativo (Receita Federal Real via mTLS)
                      </h4>
                      <p className="text-blue-800 leading-relaxed">
                        No <strong>Modo Produção</strong>, o sistema autentica em{' '}
                        <code>https://autenticacao.sapi.serpro.gov.br/authenticate</code> injetando
                        seu Certificado Digital A1 (<code>.pfx</code>) com mTLS e suas chaves{' '}
                        <code>Consumer Key</code> e <code>Consumer Secret</code> contratadas na Loja
                        SERPRO.
                      </p>
                    </div>
                  </div>
                )}

                {alertaConfig && (
                  <div
                    className={`rounded-2xl p-5 border flex items-start gap-4 ${
                      alertaConfig.tipo === 'sucesso'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                        : 'bg-red-50 border-red-300 text-red-900'
                    }`}
                  >
                    {alertaConfig.tipo === 'sucesso' ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <h4 className="font-bold text-sm">{alertaConfig.titulo}</h4>
                      <p className="text-xs mt-1 leading-relaxed">{alertaConfig.texto}</p>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                  <div className="text-xs text-slate-500">
                    Endpoint ativo:{' '}
                    <code className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-mono">
                      {config.modoAmbiente === 'trial'
                        ? 'https://gateway.apiserpro.serpro.gov.br/integra-contador-trial/v1/Emitir'
                        : 'https://gateway.apiserpro.serpro.gov.br/integra-contador/v1/Emitir'}
                    </code>
                  </div>

                  <button
                    type="button"
                    onClick={testarConexaoComSerpro}
                    disabled={testandoConexao}
                    className="h-11 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all disabled:opacity-60"
                  >
                    {testandoConexao ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Testando Conexão com o SERPRO...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        Testar Conexão com o SERPRO
                      </>
                    )}
                  </button>
                </div>
              </div>

              <form
                onSubmit={salvarConfiguracoes}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <KeyRound className="w-5 h-5 text-blue-600" />
                      Credenciais de Produção (Loja SERPRO & Cofre de Certificado Digital A1)
                    </h3>
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                    Role-Type: TERCEIROS
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                      Nome / Razão Social do Escritório Contábil
                    </label>
                    <input
                      type="text"
                      value={config.razaoSocial}
                      onChange={(e) => setConfig({ ...config, razaoSocial: e.target.value })}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                      CNPJ do Escritório Contábil
                    </label>
                    <input
                      type="text"
                      value={formatarCnpjMascara(config.cnpjEscritorio)}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          cnpjEscritorio: formatarCnpjMascara(e.target.value),
                        })
                      }
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-sm font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                      Consumer Key (Loja SERPRO)
                    </label>
                    <input
                      type="text"
                      value={config.consumerKey}
                      onChange={(e) => setConfig({ ...config, consumerKey: e.target.value })}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-sm font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                      Consumer Secret (Loja SERPRO)
                    </label>
                    <input
                      type="password"
                      value={config.consumerSecret}
                      onChange={(e) => setConfig({ ...config, consumerSecret: e.target.value })}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-sm font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 pt-2">
                  <div className="lg:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                      Arquivo do Certificado Digital A1 (.pfx)
                    </label>
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setArrastandoCertificado(true);
                      }}
                      onDragLeave={() => setArrastandoCertificado(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setArrastandoCertificado(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) enviarArquivoCertificado(file);
                      }}
                      onClick={() => inputFileRef.current?.click()}
                      className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
                        arrastandoCertificado
                          ? 'border-blue-500 bg-blue-50'
                          : config.certificadoNome
                          ? 'border-emerald-300 bg-emerald-50/40'
                          : 'border-slate-300 bg-slate-50 hover:bg-slate-100/70'
                      }`}
                    >
                      <input
                        ref={inputFileRef}
                        type="file"
                        accept=".pfx,.p12"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) enviarArquivoCertificado(file);
                        }}
                      />
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Upload className="w-6 h-6 text-blue-600" />
                        {config.certificadoNome ? (
                          <p className="text-sm font-bold text-emerald-900">
                            Certificado Carregado: {config.certificadoNome}
                          </p>
                        ) : (
                          <p className="text-sm font-semibold text-slate-700">
                            Arraste e solte seu Certificado Digital A1 (<code>.pfx</code>) aqui
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                        Senha do Certificado A1 (.pfx)
                      </label>
                      <input
                        type="password"
                        value={config.certificadoSenha}
                        onChange={(e) =>
                          setConfig({ ...config, certificadoSenha: e.target.value })
                        }
                        placeholder="Digite a senha do certificado"
                        className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-sm"
                      />
                    </div>

                    <div className="pt-4 flex justify-end">
                      <button
                        type="submit"
                        disabled={salvandoConfig}
                        className="w-full h-11 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Salvar Credenciais do Escritório
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>

      {modalErro?.aberto && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Detalhes do Retorno da Receita Federal / SERPRO
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {modalErro.razaoSocial} • CNPJ {modalErro.cnpj}
                </p>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs text-red-900 font-mono leading-relaxed">
              {modalErro.mensagem}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setModalErro(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
              >
                Entendi, Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
