import { prisma } from './prisma';

export const EMPRESAS_DEMO = [
  {
    razaoSocial: 'Padaria e Confeitaria Pão Dourado Ltda',
    cnpj: '12345678000195',
    regimeTributario: 'SIMPLES_NACIONAL',
    uf: 'SP',
    municipio: 'São Paulo',
    responsavelFiscal: 'Ana Costa (Fiscal)',
    email: 'financeiro@paodourado.com.br',
    whatsapp: '11987654321',
  },
  {
    razaoSocial: 'Carlos Eduardo Silva Design Gráfico MEI',
    cnpj: '23456789000180',
    regimeTributario: 'MEI',
    uf: 'SP',
    municipio: 'Campinas',
    responsavelFiscal: 'Marcos Lima (Contábil)',
    email: 'carlos.design@email.com.br',
    whatsapp: '11976543210',
  },
  {
    razaoSocial: 'TechSolutions Consultoria em TI Ltda',
    cnpj: '34567890000177',
    regimeTributario: 'SIMPLES_NACIONAL',
    uf: 'RJ',
    municipio: 'Rio de Janeiro',
    responsavelFiscal: 'Ana Costa (Fiscal)',
    email: 'fiscal@techsolutions.com.br',
    whatsapp: '21998877665',
  },
  {
    razaoSocial: 'Mariana Oliveira Estética e Bem-Estar MEI',
    cnpj: '45678901000162',
    regimeTributario: 'MEI',
    uf: 'MG',
    municipio: 'Belo Horizonte',
    responsavelFiscal: 'Marcos Lima (Contábil)',
    email: 'contato@marianaestetica.com.br',
    whatsapp: '31988776655',
  },
  {
    razaoSocial: 'Comércio de Autopeças Via Rápida Ltda',
    cnpj: '56789012000158',
    regimeTributario: 'SIMPLES_NACIONAL',
    uf: 'PR',
    municipio: 'Curitiba',
    responsavelFiscal: 'Carla Mendes (Sênior)',
    email: 'contabil@viarapidaautopecas.com.br',
    whatsapp: '41991122334',
  },
];

export const REGRAS_OBRIGACOES_INICIAIS = [
  {
    codigo: 'PGDAS-D',
    nome: 'Apuração e Emissão DAS — Simples Nacional (PGDAS-D)',
    regimeAplicavel: 'SIMPLES_NACIONAL',
    periodicidade: 'MENSAL',
    diaVencimentoPadrao: 20,
    uf: 'TODAS',
    municipio: 'TODOS',
    fonteNormativa: 'LC nº 123/2006 e Resolução CGSN nº 140/2018 (Art. 38 a 40)',
    dataUltimaRevisao: '2026-10-20',
    abrangenciaExcecoes:
      'Obrigatório até o dia 20 do mês subsequente ao período de apuração, inclusive sem movimento.',
    responsavelHomologacao: 'Dr. Roberto Alencon (CRC-SP 1SP234567/O-0)',
  },
  {
    codigo: 'PGMEI',
    nome: 'Emissão de Guia Mensal DAS-MEI (PGMEI)',
    regimeAplicavel: 'MEI',
    periodicidade: 'MENSAL',
    diaVencimentoPadrao: 20,
    uf: 'TODAS',
    municipio: 'TODOS',
    fonteNormativa: 'Resolução CGSN nº 140/2018 (Art. 100 a 106)',
    dataUltimaRevisao: '2026-10-20',
    abrangenciaExcecoes:
      'Valor fixo mensal (INSS + ICMS/ISS). Prorroga-se para o 1º dia útil seguinte se cair em feriado ou fim de semana.',
    responsavelHomologacao: 'Dr. Roberto Alencon (CRC-SP 1SP234567/O-0)',
  },
  {
    codigo: 'DCTFWEB',
    nome: 'Declaração de Débitos e Créditos Tributários Federais Previdenciários (DCTFWeb)',
    regimeAplicavel: 'SIMPLES_NACIONAL',
    periodicidade: 'MENSAL',
    diaVencimentoPadrao: 15,
    uf: 'TODAS',
    municipio: 'TODOS',
    fonteNormativa: 'IN RFB nº 2.005/2021 e alterações posteriores',
    dataUltimaRevisao: '2026-10-10',
    abrangenciaExcecoes:
      'Originada do fechamento do eSocial e EFD-Reinf até o dia 15 do mês seguinte.',
    responsavelHomologacao: 'Carla Mendes (Coordenadora Fiscal)',
  },
  {
    codigo: 'DEFIS',
    nome: 'Declaração de Informações Socioeconômicas e Fiscais (DEFIS)',
    regimeAplicavel: 'SIMPLES_NACIONAL',
    periodicidade: 'ANUAL',
    diaVencimentoPadrao: 31,
    uf: 'TODAS',
    municipio: 'TODOS',
    fonteNormativa: 'Resolução CGSN nº 140/2018 (Art. 72)',
    dataUltimaRevisao: '2026-09-15',
    abrangenciaExcecoes: 'Entrega anual até 31 de março do ano-calendário subsequente.',
    responsavelHomologacao: 'Dr. Roberto Alencon (CRC-SP 1SP234567/O-0)',
  },
  {
    codigo: 'DASN-SIMEI',
    nome: 'Declaração Anual Simplificada para o MEI (DASN-SIMEI)',
    regimeAplicavel: 'MEI',
    periodicidade: 'ANUAL',
    diaVencimentoPadrao: 31,
    uf: 'TODAS',
    municipio: 'TODOS',
    fonteNormativa: 'Resolução CGSN nº 140/2018 (Art. 109)',
    dataUltimaRevisao: '2026-09-15',
    abrangenciaExcecoes: 'Entrega anual até 31 de maio de cada exercício.',
    responsavelHomologacao: 'Marcos Lima (Analista SIMEI)',
  },
];

export async function runSeed() {
  // 1. Configuração da Organização Alencon Tech e SERPRO
  await prisma.configuracaoEscritorio.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      organizationId: 'org_alencon_001',
      nomePlataforma: 'Alencon Tech',
      planoSaaS: 'Professional',
      limiteCnpjs: 50,
      franquiaConsultas: 500,
      modoAmbiente: 'trial',
      cnpjEscritorio: '00000000000191',
      razaoSocial: 'Alencon Contabilidade & Inteligência Fiscal Ltda',
      consumerKey: '',
      consumerSecret: '',
      certificadoNome: '',
      certificadoPath: '',
      certificadoSenha: '',
      ultimoTesteSucesso: true,
      ultimoTesteData: new Date(),
      ultimoTesteMensagem: 'Modo Simulação SERPRO (Trial) ativo e homologado na Alencon Tech.',
    },
  });

  // 2. Empresas Clientes da Carteira
  const empresasCriadas = [];
  for (const emp of EMPRESAS_DEMO) {
    const registro = await prisma.empresasClientes.upsert({
      where: { cnpj: emp.cnpj },
      update: {
        razaoSocial: emp.razaoSocial,
        regimeTributario: emp.regimeTributario,
        uf: emp.uf,
        municipio: emp.municipio,
        responsavelFiscal: emp.responsavelFiscal,
        email: emp.email,
        whatsapp: emp.whatsapp,
      },
      create: emp,
    });
    empresasCriadas.push(registro);
  }

  // 3. Catálogo de Obrigações e Regras (Compliance Monitor)
  const regrasCriadas = [];
  for (const regra of REGRAS_OBRIGACOES_INICIAIS) {
    const r = await prisma.obligationRule.upsert({
      where: { codigo: regra.codigo },
      update: regra,
      create: regra,
    });
    regrasCriadas.push(r);
  }

  // 4. Gerar Instâncias de Obrigações para a competência 202610 (se ainda não existirem)
  const regraPgdas = regrasCriadas.find((r) => r.codigo === 'PGDAS-D');
  const regraPgmei = regrasCriadas.find((r) => r.codigo === 'PGMEI');
  const regraDctf = regrasCriadas.find((r) => r.codigo === 'DCTFWEB');

  const estadosExemplo = [
    'CUMPRIDA',
    'EM_PROCESSAMENTO',
    'PENDENTE_DOCUMENTOS',
    'TRANSMITIDA_AGUARDANDO',
    'ATRASO_ERRO_RETIFICACAO',
  ];

  for (let i = 0; i < empresasCriadas.length; i++) {
    const emp = empresasCriadas[i];
    const regraPrincipal = emp.regimeTributario === 'MEI' ? regraPgmei : regraPgdas;
    if (regraPrincipal) {
      await prisma.obligationInstance.upsert({
        where: {
          empresaId_regraId_competencia: {
            empresaId: emp.id,
            regraId: regraPrincipal.id,
            competencia: '202610',
          },
        },
        update: {},
        create: {
          empresaId: emp.id,
          regraId: regraPrincipal.id,
          competencia: '202610',
          dataVencimento: '20/11/2026',
          estado: estadosExemplo[i % estadosExemplo.length],
          responsavel: emp.responsavelFiscal,
          protocoloRecibo:
            estadosExemplo[i % estadosExemplo.length] === 'CUMPRIDA'
              ? `REC-SERPRO-202610-00${emp.id}`
              : '',
          observacoes:
            estadosExemplo[i % estadosExemplo.length] === 'PENDENTE_DOCUMENTOS'
              ? 'Aguardando envio do extrato de vendas pelo Client Hub.'
              : estadosExemplo[i % estadosExemplo.length] === 'ATRASO_ERRO_RETIFICACAO'
              ? 'Divergência de alíquota de ISS identificada para retificação.'
              : 'Fluxo operacional monitorado pela Alencon Tech.',
        },
      });
    }

    if (emp.regimeTributario === 'SIMPLES_NACIONAL' && regraDctf) {
      await prisma.obligationInstance.upsert({
        where: {
          empresaId_regraId_competencia: {
            empresaId: emp.id,
            regraId: regraDctf.id,
            competencia: '202610',
          },
        },
        update: {},
        create: {
          empresaId: emp.id,
          regraId: regraDctf.id,
          competencia: '202610',
          dataVencimento: '15/11/2026',
          estado: i === 0 ? 'CUMPRIDA' : 'A_PROGRAMAR',
          responsavel: emp.responsavelFiscal,
          protocoloRecibo: i === 0 ? `DCTF-202610-998${emp.id}` : '',
          observacoes: 'Integração eSocial + EFD-Reinf.',
        },
      });
    }
  }

  // 5. População Inicial do Fiscal Monitor (Consultas e Ocorrências Padronizadas - Seção 5.3)
  const totalChecks = await prisma.fiscalCheck.count();
  if (totalChecks === 0 && empresasCriadas.length >= 5) {
    // Cliente 1: Regular e atualizado
    await prisma.fiscalCheck.create({
      data: {
        empresaId: empresasCriadas[0].id,
        source: 'serpro',
        service: 'fiscal_status',
        competencia: '202610',
        status: 'regular',
        mensagemResumo: 'Situação fiscal regular perante RFB/PGFN. Sem pendências ativas.',
        payloadPadrao: JSON.stringify(
          {
            organization_id: 'org_alencon_001',
            client_id: `client_00${empresasCriadas[0].id}`,
            source: 'serpro',
            service: 'fiscal_status',
            consulted_at: new Date().toISOString(),
            status: 'regular',
            occurrences: [],
          },
          null,
          2
        ),
      },
    });

    // Cliente 3: Com Pendência Fiscal (attention_required - exatamente como Seção 5.3 do PDF)
    const checkComPendencia = await prisma.fiscalCheck.create({
      data: {
        empresaId: empresasCriadas[2].id,
        source: 'serpro',
        service: 'fiscal_status',
        competencia: '202610',
        status: 'attention_required',
        mensagemResumo: '2 ocorrências fiscais identificadas no diagnóstico SERPRO Integra Contador.',
        payloadPadrao: JSON.stringify(
          {
            organization_id: 'org_alencon_001',
            client_id: `client_00${empresasCriadas[2].id}`,
            source: 'serpro',
            service: 'fiscal_status',
            consulted_at: '2026-11-04T09:00:00',
            status: 'attention_required',
            occurrences: [
              {
                type: 'fiscal_pending',
                description: 'Ausência de declaração PGDAS-D na competência 2026-09',
                competence: '2026-09',
                requires_review: true,
              },
              {
                type: 'caixa_postal',
                description: 'Mensagem não lida na Caixa Postal e-CAC: Termo de Intimação',
                competence: '2026-10',
                requires_review: true,
              },
            ],
          },
          null,
          2
        ),
      },
    });

    await prisma.fiscalOccurrence.createMany({
      data: [
        {
          empresaId: empresasCriadas[2].id,
          fiscalCheckId: checkComPendencia.id,
          tipo: 'omissao_declaracao',
          severidade: 'ALTA',
          descricao: 'Ausência de declaração PGDAS-D na competência 2026-09 detectada via SERPRO.',
          competencia: '2026-09',
          fonte: 'SERPRO Integra Contador (SITFIS)',
          idExterno: 'SERPRO-OCC-8821',
          situacao: 'ABERTA',
          responsavel: 'Ana Costa (Fiscal)',
          requiresReview: true,
        },
        {
          empresaId: empresasCriadas[2].id,
          fiscalCheckId: checkComPendencia.id,
          tipo: 'caixa_postal',
          severidade: 'CRITICA',
          descricao: 'Mensagem importante não lida na Caixa Postal e-CAC (Termo de Intimação PGDAS).',
          competencia: '2026-10',
          fonte: 'SERPRO Integra Contador (CAIXAPOSTAL)',
          idExterno: 'SERPRO-MSG-4410',
          situacao: 'ABERTA',
          responsavel: 'Ana Costa (Fiscal)',
          requiresReview: true,
        },
        {
          empresaId: empresasCriadas[4].id,
          tipo: 'debito_aberto',
          severidade: 'MEDIA',
          descricao: 'Parcela de parcelamento Simples Nacional (PERT-SN) com vencimento no mês corrente.',
          competencia: '2026-10',
          fonte: 'SERPRO Integra Contador (PARCSN)',
          idExterno: 'SERPRO-PARC-1092',
          situacao: 'EM_TRATAMENTO',
          responsavel: 'Carla Mendes (Sênior)',
          requiresReview: true,
        },
      ],
    });

    // Cliente 4: Consulta malsucedida/incompleta (Regra da Seção 7: nunca exibir como regularidade!)
    await prisma.fiscalCheck.create({
      data: {
        empresaId: empresasCriadas[3].id,
        source: 'serpro',
        service: 'fiscal_status',
        competencia: '202610',
        status: 'failed_or_incomplete',
        mensagemResumo:
          'Procuração eletrônica SERPRO expirada ou pendente de renovação pelo titular. NÃO considerar como regularidade fiscal.',
        payloadPadrao: JSON.stringify(
          {
            organization_id: 'org_alencon_001',
            client_id: `client_00${empresasCriadas[3].id}`,
            source: 'serpro',
            service: 'fiscal_status',
            consulted_at: new Date().toISOString(),
            status: 'failed_or_incomplete',
            error: 'PROCURACAO_EXPIRADA',
            occurrences: [],
          },
          null,
          2
        ),
      },
    });
  }

  // 6. Tarefas Iniciais da Equipe (Seção 2.1, 2.2 e 6.1)
  const totalTasks = await prisma.task.count();
  if (totalTasks === 0 && empresasCriadas.length >= 5) {
    await prisma.task.createMany({
      data: [
        {
          empresaId: empresasCriadas[2].id,
          titulo: 'Transmitir PGDAS-D em atraso (09/2026) e emitir guia',
          descricao: 'Gerado automaticamente a partir da ocorrência SERPRO-OCC-8821 no Fiscal Monitor.',
          responsavel: 'Ana Costa (Fiscal)',
          prazo: '10/11/2026',
          prioridade: 'ALTA',
          status: 'PENDENTE',
          origem: 'Fiscal Monitor',
        },
        {
          empresaId: empresasCriadas[2].id,
          titulo: 'Ler Termo de Intimação na Caixa Postal e-CAC',
          descricao: 'Verificar mensagem SERPRO-MSG-4410 antes do prazo de ciência.',
          responsavel: 'Sem responsável',
          prazo: '08/11/2026',
          prioridade: 'ALTA',
          status: 'PENDENTE',
          origem: 'Fiscal Monitor',
        },
        {
          empresaId: empresasCriadas[4].id,
          titulo: 'Revisar retificação de ISS no PGDAS-D 10/2026',
          descricao: 'Conferir notas fiscais municipais de Curitiba antes de reemitir o DAS.',
          responsavel: 'Carla Mendes (Sênior)',
          prazo: '18/11/2026',
          prioridade: 'MEDIA',
          status: 'EM_ANDAMENTO',
          origem: 'Compliance Monitor',
        },
      ],
    });
  }

  // 7. Solicitações e Comunicados do Client Hub (Seção 2.4)
  const totalHub = await prisma.clientHubRequest.count();
  if (totalHub === 0 && empresasCriadas.length >= 5) {
    await prisma.clientHubRequest.createMany({
      data: [
        {
          empresaId: empresasCriadas[2].id,
          tipo: 'SOLICITACAO_DOCUMENTO',
          titulo: 'Envio de Extrato de Faturamento e XMLs de Outubro/2026',
          mensagem:
            'Olá! Precisamos do relatório de notas emitidas e extrato bancário de Outubro/2026 para finalizar a apuração do PGDAS-D.',
          status: 'AGUARDANDO_CLIENTE',
          autor: 'Ana Costa (Alencon)',
        },
        {
          empresaId: empresasCriadas[0].id,
          tipo: 'ENTREGA_GUIA',
          titulo: 'Guia DAS Simples Nacional 10/2026 Disponível para Pagamento',
          mensagem:
            'Sua guia DAS referente à competência 10/2026 (vencimento 20/11/2026) já foi conferida, emitida via SERPRO e está liberada no portal.',
          status: 'LIBERADO_PORTAL',
          nomeArquivoAnexo: 'DAS_PGDASD_12345678000195_202610.pdf',
          autor: 'Automação Alencon Tech',
          respostaCliente: 'Recebido! Já agendamos o pagamento no banco.',
        },
        {
          empresaId: empresasCriadas[3].id,
          tipo: 'COMUNICADO',
          titulo: 'Renovação da Procuração Eletrônica e-CAC / SERPRO',
          mensagem:
            'Identificamos no nosso monitor que a procuração eletrônica para consultas automáticas vence esta semana. Segue passo a passo para renovação.',
          status: 'DOCUMENTO_RECEBIDO',
          nomeArquivoAnexo: 'Comprovante_Procuracao_eCAC.pdf',
          autor: 'Marcos Lima (Alencon)',
          respostaCliente: 'Acabei de renovar no portal e-CAC e anexei o protocolo!',
        },
      ],
    });
  }

  // 8. Logs de Auditoria Iniciais (Seção 4 e 7)
  const totalAudit = await prisma.auditLog.count();
  if (totalAudit === 0) {
    await prisma.auditLog.createMany({
      data: [
        {
          autor: 'Sistema Alencon Tech',
          modulo: 'SEGURANCA',
          acao: 'INICIALIZACAO_MULTI_TENANT',
          detalhes: 'Isolamento lógico organization_id="org_alencon_001" validado no núcleo.',
          custoEstimado: 0.0,
        },
        {
          autor: 'Worker Fiscal Monitor',
          modulo: 'FISCAL_MONITOR',
          acao: 'CONSULTA_SITUACAO_FISCAL_LOTE',
          detalhes: 'Execução de diagnóstico SERPRO (SITFIS + Caixa Postal) para 5 CNPJs da carteira.',
          custoEstimado: 1.25,
        },
      ],
    });
  }

  console.log('✅ Seed Alencon Tech concluído com todos os módulos do PDF!');
}

if (require.main === module) {
  runSeed()
    .catch((err) => {
      console.error('Erro ao executar seed:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
