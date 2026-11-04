import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  FileCheck2,
  ShieldAlert,
  ClipboardCheck,
  ListTodo,
  Users,
  Bot,
  Play,
  Download,
  RefreshCw,
  Search,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  Calendar,
  Sparkles,
  X,
  Loader2,
  Send,
} from 'lucide-react';
import {
  formatarCnpjMascara,
  formatarCompetenciaExibicao,
  OPCOES_COMPETENCIA,
} from '../utils/formatters';

const API_BASE = '/api';

interface DashboardGeralProps {
  competencia: string;
  onChangeCompetencia: (nova: string) => void;
  onNavigateAba: (aba: any) => void;
}

export function DashboardGeralView({
  competencia,
  onChangeCompetencia,
  onNavigateAba,
}: DashboardGeralProps) {
  const [dados, setDados] = useState<any | null>(null);
  const [carregando, setCarregando] = useState<boolean>(true);
  const [busca, setBusca] = useState<string>('');
  const [filtroRapido, setFiltroRapido] = useState<
    'TODAS' | 'DAS_PENDENTE' | 'COM_PENDENCIA_FISCAL' | 'EM_DIA'
  >('TODAS');
  const [emitindoEmpresaId, setEmitindoEmpresaId] = useState<number | null>(null);
  const [executandoDiagnostico, setExecutandoDiagnostico] = useState<boolean>(false);
  const [empresaRaioX, setEmpresaRaioX] = useState<any | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const carregarPanorama = useCallback(async () => {
    setCarregando(true);
    try {
      const resp = await fetch(`${API_BASE}/dashboard-geral?competencia=${competencia}`);
      if (resp.ok) {
        const json = await resp.json();
        setDados(json);
        if (empresaRaioX) {
          const atualizada = (json.raioXEmpresas || []).find(
            (e: any) => e.id === empresaRaioX.id
          );
          if (atualizada) setEmpresaRaioX(atualizada);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar Dashboard Geral 360:', err);
    } finally {
      setCarregando(false);
    }
  }, [competencia, empresaRaioX?.id]);

  useEffect(() => {
    carregarPanorama();
  }, [carregarPanorama]);

  // Emitir DAS de uma empresa diretamente pela Visão Geral
  const emitirDasRapido = async (empresaId: number, razaoSocial: string) => {
    setEmitindoEmpresaId(empresaId);
    setFeedbackToast(null);
    try {
      const resp = await fetch(`${API_BASE}/das/emitir-lote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresaIds: [empresaId],
          competencia,
        }),
      });
      if (resp.ok) {
        setFeedbackToast(
          `Guia DAS de "${razaoSocial}" emitida com sucesso e obrigação marcada como Cumprida!`
        );
        await carregarPanorama();
      }
    } finally {
      setEmitindoEmpresaId(null);
    }
  };

  // Rodar diagnóstico fiscal para toda a carteira direto da Visão Geral
  const rodarDiagnosticoGeral = async () => {
    setExecutandoDiagnostico(true);
    setFeedbackToast(null);
    try {
      const resp = await fetch(`${API_BASE}/fiscal-monitor/consultar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service: 'fiscal_status',
          competencia,
        }),
      });
      if (resp.ok) {
        setFeedbackToast(
          'Diagnóstico Fiscal SERPRO executado para todas as empresas da carteira!'
        );
        await carregarPanorama();
      }
    } finally {
      setExecutandoDiagnostico(false);
    }
  };

  // Liberar guia no Client Hub com 1 clique
  const liberarGuiaNoClientHub = async (emp: any) => {
    await fetch(`${API_BASE}/client-hub`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        empresaId: emp.id,
        tipo: 'ENTREGA_GUIA',
        titulo: `Guia DAS ${formatarCompetenciaExibicao(competencia)} Disponível (${emp.guiaMes?.valorTotal || ''})`,
        mensagem: `Olá! Sua guia DAS da competência ${formatarCompetenciaExibicao(competencia)} (vencimento ${emp.guiaMes?.dataVencimento}) já foi emitida via SERPRO e está disponível para pagamento.`,
      }),
    });
    setFeedbackToast(`Guia de "${emp.razaoSocial}" publicada no Client Hub com sucesso!`);
    await carregarPanorama();
  };

  if (carregando && !dados) {
    return (
      <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm font-medium">
          Consolidando panorama 360º de todas as empresas e módulos...
        </p>
      </div>
    );
  }

  if (!dados) return null;

  const { kpis, briefingIa = [], raioXEmpresas = [], ocorrenciasRecentes = [], tarefasUrgentes = [], movimentacoesHub = [] } = dados;

  const empresasFiltradas = raioXEmpresas.filter((emp: any) => {
    const termo = busca.trim().toLowerCase();
    const bateBusca =
      !termo ||
      emp.razaoSocial.toLowerCase().includes(termo) ||
      emp.cnpj.includes(termo) ||
      (emp.municipio || '').toLowerCase().includes(termo) ||
      (emp.responsavelFiscal || '').toLowerCase().includes(termo);

    if (!bateBusca) return false;

    if (filtroRapido === 'DAS_PENDENTE') return emp.guiaMes?.status !== 'EMITIDA';
    if (filtroRapido === 'COM_PENDENCIA_FISCAL') return emp.fiscal?.status !== 'regular';
    if (filtroRapido === 'EM_DIA') {
      return emp.guiaMes?.status === 'EMITIDA' && emp.fiscal?.status === 'regular';
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* BARRA SUPERIOR DE COMANDO & BRIEFING INTELIGENTE DA IA */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950 rounded-2xl p-6 text-white shadow-lg space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-400">
              <Sparkles className="w-4 h-4" />
              Central de Comando 360º • {dados.organizacao?.razaoSocial}
            </span>
            <h3 className="text-xl font-bold mt-1">
              Panorama Geral do Sistema e da Carteira de Clientes
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Acompanhe em uma única tela a emissão de DAS, situação fiscal no SERPRO, obrigações do
              Compliance Monitor, fila de tarefas e solicitações do Client Hub.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 bg-white/10 border border-white/15 rounded-xl px-3 py-2">
              <Calendar className="w-4 h-4 text-blue-300" />
              <select
                value={competencia}
                onChange={(e) => onChangeCompetencia(e.target.value)}
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
              >
                {OPCOES_COMPETENCIA.map((op) => (
                  <option key={op.valor} value={op.valor} className="text-slate-900">
                    {op.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={rodarDiagnosticoGeral}
              disabled={executandoDiagnostico}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold flex items-center gap-2 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${executandoDiagnostico ? 'animate-spin' : ''}`} />
              Atualizar Diagnóstico SERPRO
            </button>

            <button
              type="button"
              onClick={() => onNavigateAba('emissao_das')}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-600/30 transition-all"
            >
              <Play className="w-4 h-4 fill-current" />
              Ir para Emissão DAS em Lote
            </button>
          </div>
        </div>

        {/* Briefing Executivo Diário (AI Assistant) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {briefingIa.map((msg: string, idx: number) => (
            <div
              key={idx}
              className="rounded-xl bg-white/5 border border-white/10 p-3.5 flex items-start gap-2.5 text-xs text-slate-200 leading-relaxed"
            >
              <Bot className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <span>{msg}</span>
            </div>
          ))}
        </div>
      </div>

      {feedbackToast && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex items-center justify-between text-xs font-semibold text-emerald-900 shadow-sm">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackToast}</span>
          </div>
          <button onClick={() => setFeedbackToast(null)} className="underline">
            Fechar
          </button>
        </div>
      )}

      {/* 6 CARDS GLOBAIS DE RESUMO DE TODOS OS MÓDULOS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Card 1: Empresas Cadastradas */}
        <div
          onClick={() => onNavigateAba('clientes')}
          className="cursor-pointer bg-white rounded-2xl p-4 border border-slate-200 hover:border-blue-300 shadow-sm transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">
              Empresas Ativas
            </span>
            <Building2 className="w-4 h-4 text-slate-600" />
          </div>
          <div className="my-2">
            <span className="text-2xl font-bold text-slate-900">{kpis.totalEmpresas}</span>
            <span className="text-xs text-slate-500 ml-1.5">CNPJs</span>
          </div>
          <div className="text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
            <span>{kpis.totalSimples} Simples</span>
            <span>{kpis.totalMei} MEI</span>
          </div>
        </div>

        {/* Card 2: Emissão DAS no Mês */}
        <div
          onClick={() => onNavigateAba('emissao_das')}
          className="cursor-pointer bg-white rounded-2xl p-4 border border-emerald-200 hover:border-emerald-400 shadow-sm transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">
              Guias DAS ({formatarCompetenciaExibicao(competencia)})
            </span>
            <FileCheck2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="my-2 flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-bold text-emerald-600">{kpis.guiasEmitidas}</span>
              <span className="text-xs text-slate-400">/{kpis.totalEmpresas}</span>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              {kpis.taxaEmissaoDas}%
            </span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all"
              style={{ width: `${kpis.taxaEmissaoDas}%` }}
            />
          </div>
        </div>

        {/* Card 3: Fiscal Monitor */}
        <div
          onClick={() => onNavigateAba('fiscal_monitor')}
          className="cursor-pointer bg-white rounded-2xl p-4 border border-red-200 hover:border-red-400 shadow-sm transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">
              Fiscal Monitor
            </span>
            <ShieldAlert className="w-4 h-4 text-red-600" />
          </div>
          <div className="my-2">
            <span className="text-2xl font-bold text-red-600">{kpis.ocorrenciasAbertas}</span>
            <span className="text-xs text-slate-500 ml-1.5">ocorrências</span>
          </div>
          <div className="text-[11px] text-slate-600 flex items-center justify-between border-t border-slate-100 pt-2">
            <span className="text-emerald-700 font-semibold">{kpis.clientesRegulares} reg.</span>
            <span className="text-amber-700 font-semibold">
              {kpis.clientesConsultaFalha} s/ proc.
            </span>
          </div>
        </div>

        {/* Card 4: Compliance Monitor */}
        <div
          onClick={() => onNavigateAba('compliance')}
          className="cursor-pointer bg-white rounded-2xl p-4 border border-indigo-200 hover:border-indigo-400 shadow-sm transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">
              Compliance Fiscal
            </span>
            <ClipboardCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="my-2 flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-bold text-indigo-600">
                {kpis.obrigacoesCumpridas}
              </span>
              <span className="text-xs text-slate-400">/{kpis.obrigacoesTotais}</span>
            </div>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
              {kpis.taxaCompliance}%
            </span>
          </div>
          <div className="text-[11px] text-slate-500 border-t border-slate-100 pt-2">
            Obrigações c/ protocolo no mês
          </div>
        </div>

        {/* Card 5: Tarefas da Equipe */}
        <div
          onClick={() => onNavigateAba('compliance')}
          className="cursor-pointer bg-white rounded-2xl p-4 border border-amber-200 hover:border-amber-400 shadow-sm transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">
              Tarefas da Equipe
            </span>
            <ListTodo className="w-4 h-4 text-amber-600" />
          </div>
          <div className="my-2">
            <span className="text-2xl font-bold text-amber-600">{kpis.tarefasPendentes}</span>
            <span className="text-xs text-slate-500 ml-1.5">abertas</span>
          </div>
          <div className="text-[11px] text-amber-800 border-t border-slate-100 pt-2">
            {kpis.tarefasSemResponsavel > 0
              ? `${kpis.tarefasSemResponsavel} sem responsável`
              : 'Todas atribuídas'}
          </div>
        </div>

        {/* Card 6: Client Hub */}
        <div
          onClick={() => onNavigateAba('client_hub')}
          className="cursor-pointer bg-white rounded-2xl p-4 border border-blue-200 hover:border-blue-400 shadow-sm transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Client Hub</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="my-2">
            <span className="text-2xl font-bold text-blue-600">
              {kpis.docsRecebidosParaValidar + kpis.docsAguardandoCliente}
            </span>
            <span className="text-xs text-slate-500 ml-1.5">interações</span>
          </div>
          <div className="text-[11px] text-slate-600 border-t border-slate-100 pt-2">
            {kpis.docsRecebidosParaValidar} doc(s) p/ validar
          </div>
        </div>
      </div>

      {/* MATRIZ 360º DE TODAS AS EMPRESAS CADASTRADAS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Aparato Geral por Empresa Cadastrada (Visão 360º de Todos os Módulos)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Consulte o status consolidado de cada cliente ou clique em{' '}
              <strong>"Ficha 360º"</strong> para abrir todos os detalhes, obrigações, certidões e
              documentos daquela empresa.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Busca Rápida */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar razão social, CNPJ, cidade..."
                className="h-10 pl-9 pr-3.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 bg-white"
              />
            </div>

            {/* Filtros Rápidos */}
            <div className="inline-flex rounded-xl bg-slate-200/70 p-1">
              {[
                { id: 'TODAS', label: 'Todas' },
                { id: 'DAS_PENDENTE', label: 'DAS Pendente' },
                { id: 'COM_PENDENCIA_FISCAL', label: 'Alerta Fiscal' },
                { id: 'EM_DIA', label: '100% em Dia' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFiltroRapido(f.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    filtroRapido === f.id
                      ? 'bg-white text-blue-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50/40">
                <th className="py-3.5 px-5">Empresa Cliente & Responsável</th>
                <th className="py-3.5 px-4">Regime & Local</th>
                <th className="py-3.5 px-4">Guia DAS ({formatarCompetenciaExibicao(competencia)})</th>
                <th className="py-3.5 px-4">Situação Fiscal (SERPRO)</th>
                <th className="py-3.5 px-4">Compliance & Hub</th>
                <th className="py-3.5 px-5 text-right">Ações Rápidas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70">
              {empresasFiltradas.map((emp: any) => {
                const isEmitindo = emitindoEmpresaId === emp.id;
                const statusDas = emp.guiaMes?.status || 'NAO_GERADA';

                return (
                  <tr key={emp.id} className="hover:bg-slate-50/90 transition-colors">
                    {/* Coluna 1: Empresa */}
                    <td className="py-4 px-5">
                      <div
                        onClick={() => setEmpresaRaioX(emp)}
                        className="font-bold text-slate-900 hover:text-blue-600 cursor-pointer flex items-center gap-2"
                      >
                        <span>{emp.razaoSocial}</span>
                      </div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                        {formatarCnpjMascara(emp.cnpj)} •{' '}
                        <span className="font-sans text-slate-400">
                          Resp: {emp.responsavelFiscal}
                        </span>
                      </div>
                    </td>

                    {/* Coluna 2: Regime e Cidade */}
                    <td className="py-4 px-4">
                      <div>
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            emp.regimeTributario === 'MEI'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}
                        >
                          {emp.regimeTributario === 'MEI' ? 'MEI (PGMEI)' : 'Simples Nacional'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {emp.municipio}/{emp.uf}
                      </div>
                    </td>

                    {/* Coluna 3: Status DAS no Mês */}
                    <td className="py-4 px-4">
                      {statusDas === 'EMITIDA' ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Emitida ({emp.guiaMes.valorTotal})
                          </span>
                          <div className="text-[11px] text-slate-400">
                            Venc: {emp.guiaMes.dataVencimento}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            Pendente no Mês
                          </span>
                          <div className="text-[11px] text-slate-400">
                            Venc: {emp.guiaMes.dataVencimento}
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Coluna 4: Situação Fiscal SERPRO */}
                    <td className="py-4 px-4">
                      {emp.fiscal.status === 'regular' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Regular (Atualizado)
                        </span>
                      )}
                      {emp.fiscal.status === 'attention_required' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                          {emp.fiscal.ocorrenciasAtivasCount} Pendência(s) Ativa(s)
                        </span>
                      )}
                      {emp.fiscal.status === 'failed_or_incomplete' && (
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300"
                          title="Seção 7 do PDF: Consulta incompleta ou sem procuração nunca é considerada regularidade fiscal"
                        >
                          <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                          Sem Consulta / Procuração
                        </span>
                      )}
                    </td>

                    {/* Coluna 5: Compliance & Client Hub */}
                    <td className="py-4 px-4 text-xs">
                      <div className="font-semibold text-slate-800">
                        Obrigações: {emp.compliance.cumpridas}/{emp.compliance.total} cumpridas
                      </div>
                      <div className="text-slate-500 mt-0.5">
                        {emp.operacional.tarefasAbertasCount} tarefa(s) •{' '}
                        {emp.operacional.hubPendentesCount} item(ns) no Hub
                      </div>
                    </td>

                    {/* Coluna 6: Ações Rápidas */}
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {statusDas === 'EMITIDA' && emp.guiaMes?.id ? (
                          <button
                            type="button"
                            onClick={() =>
                              window.open(`${API_BASE}/das/download/${emp.guiaMes.id}`, '_blank')
                            }
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                          >
                            <Download className="w-3.5 h-3.5" />
                            PDF
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={isEmitindo}
                            onClick={() => emitirDasRapido(emp.id, emp.razaoSocial)}
                            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                          >
                            {isEmitindo ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Play className="w-3 h-3 fill-current" />
                            )}
                            Emitir DAS
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setEmpresaRaioX(emp)}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-semibold flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Ficha 360º
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

      {/* 3 PAINÉIS INFERIORES DE RESUMO OPERACIONAL DOS MÓDULOS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel 1: Últimas Ocorrências Fiscais */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-600" />
                Alertas do Fiscal Monitor
              </h4>
              <button
                type="button"
                onClick={() => onNavigateAba('fiscal_monitor')}
                className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
              >
                Abrir Módulo <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {ocorrenciasRecentes.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  Nenhuma ocorrência aberta.
                </div>
              ) : (
                ocorrenciasRecentes.map((oc: any) => (
                  <div key={oc.id} className="p-4 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">
                        {oc.empresa?.razaoSocial}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                        {oc.severidade}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2">{oc.descricao}</p>
                    <p className="text-[10px] text-slate-400">
                      Fonte: {oc.fonte} • Comp. {oc.competencia}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Painel 2: Tarefas Prioritárias da Equipe */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                <ListTodo className="w-4 h-4 text-amber-600" />
                Tarefas Prioritárias da Equipe
              </h4>
              <button
                type="button"
                onClick={() => onNavigateAba('compliance')}
                className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
              >
                Ver Todas <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {tarefasUrgentes.map((t: any) => (
                <div key={t.id} className="p-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">{t.titulo}</span>
                    <span className="text-[11px] font-mono font-semibold text-amber-700">
                      {t.prazo}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Cliente: {t.empresa?.razaoSocial || 'Carteira Geral'} • Resp:{' '}
                    <strong>{t.responsavel}</strong>
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Painel 3: Movimentações no Client Hub */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                Últimas Interações no Client Hub
              </h4>
              <button
                type="button"
                onClick={() => onNavigateAba('client_hub')}
                className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
              >
                Abrir Portal <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {movimentacoesHub.map((m: any) => (
                <div key={m.id} className="p-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">
                      {m.empresa?.razaoSocial}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                      {m.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium">{m.titulo}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL / DRAWER LATERAL: FICHA 360º COMPLETA DA EMPRESA */}
      {empresaRaioX && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-2xl h-full overflow-y-auto shadow-2xl p-6 space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              {/* Topo do Drawer */}
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                    Ficha 360º do Cliente • Visão Unificada Alencon Tech
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 mt-0.5">
                    {empresaRaioX.razaoSocial}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono mt-1">
                    CNPJ: {formatarCnpjMascara(empresaRaioX.cnpj)} • {empresaRaioX.regimeTributario}{' '}
                    • {empresaRaioX.municipio}/{empresaRaioX.uf}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setEmpresaRaioX(null)}
                  className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-900"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Bloco 1: Guia DAS na Competência */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">
                    1. Guia DAS na Competência {formatarCompetenciaExibicao(competencia)}
                  </h4>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      empresaRaioX.guiaMes?.status === 'EMITIDA'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {empresaRaioX.guiaMes?.status}
                  </span>
                </div>

                <div className="text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2">
                  <span>
                    Valor: <strong>{empresaRaioX.guiaMes?.valorTotal}</strong> • Vencimento:{' '}
                    <strong>{empresaRaioX.guiaMes?.dataVencimento}</strong>
                  </span>

                  <div className="flex items-center gap-2">
                    {empresaRaioX.guiaMes?.status === 'EMITIDA' && empresaRaioX.guiaMes?.id ? (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            window.open(
                              `${API_BASE}/das/download/${empresaRaioX.guiaMes.id}`,
                              '_blank'
                            )
                          }
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Baixar Guia PDF
                        </button>
                        <button
                          type="button"
                          onClick={() => liberarGuiaNoClientHub(empresaRaioX)}
                          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Publicar no Client Hub
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          emitirDasRapido(empresaRaioX.id, empresaRaioX.razaoSocial)
                        }
                        className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Emitir DAS Agora via SERPRO
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Bloco 2: Ocorrências Fiscais da Empresa */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-sm">
                  2. Diagnóstico Fiscal Monitor ({empresaRaioX.fiscal?.ocorrencias?.length || 0}{' '}
                  ocorrências registradas)
                </h4>
                <p className="text-xs text-slate-500">{empresaRaioX.fiscal?.mensagemResumo}</p>
                <div className="space-y-2">
                  {(empresaRaioX.fiscal?.ocorrencias || []).map((oc: any) => (
                    <div
                      key={oc.id}
                      className="p-3 rounded-xl border border-red-200 bg-red-50/60 text-xs text-red-950"
                    >
                      <div className="font-bold">
                        [{oc.severidade}] {oc.descricao}
                      </div>
                      <div className="text-[11px] text-red-700 mt-0.5">
                        Fonte: {oc.fonte} • Situação: {oc.situacao}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bloco 3: Obrigações da Empresa no Compliance Monitor */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-sm">
                  3. Obrigações no Compliance Monitor ({empresaRaioX.compliance?.cumpridas}/
                  {empresaRaioX.compliance?.total} cumpridas)
                </h4>
                <div className="space-y-2">
                  {(empresaRaioX.compliance?.instancias || []).map((inst: any) => (
                    <div
                      key={inst.id}
                      className="p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-900">{inst.regra?.codigo}</span> —
                        Venc. {inst.dataVencimento}
                        <div className="text-[11px] text-slate-500">{inst.observacoes}</div>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 font-bold text-slate-800">
                        {inst.estado}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bloco 4: Tarefas e Client Hub */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-sm">
                  4. Solicitações no Client Hub & Tarefas da Equipe
                </h4>
                {(empresaRaioX.operacional?.solicitacoesHub || []).map((s: any) => (
                  <div
                    key={s.id}
                    className="p-3 rounded-xl border border-blue-200 bg-blue-50/40 text-xs"
                  >
                    <div className="font-bold text-slate-900">{s.titulo}</div>
                    <div className="text-slate-600 mt-0.5">Status no Portal: {s.status}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setEmpresaRaioX(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold"
              >
                Fechar Ficha 360º
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

