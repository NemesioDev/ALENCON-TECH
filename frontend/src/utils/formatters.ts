export function formatarCnpjMascara(valor: string): string {
  const apenasDigitos = (valor || '').replace(/\D/g, '').slice(0, 14);
  if (apenasDigitos.length <= 2) return apenasDigitos;
  if (apenasDigitos.length <= 5) return `${apenasDigitos.slice(0, 2)}.${apenasDigitos.slice(2)}`;
  if (apenasDigitos.length <= 8) {
    return `${apenasDigitos.slice(0, 2)}.${apenasDigitos.slice(2, 5)}.${apenasDigitos.slice(5)}`;
  }
  if (apenasDigitos.length <= 12) {
    return `${apenasDigitos.slice(0, 2)}.${apenasDigitos.slice(2, 5)}.${apenasDigitos.slice(5, 8)}/${apenasDigitos.slice(8)}`;
  }
  return `${apenasDigitos.slice(0, 2)}.${apenasDigitos.slice(2, 5)}.${apenasDigitos.slice(5, 8)}/${apenasDigitos.slice(8, 12)}-${apenasDigitos.slice(12, 14)}`;
}

export function formatarTelefoneMascara(valor: string): string {
  const d = (valor || '').replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function formatarCompetenciaExibicao(aaaamm: string): string {
  const limpo = (aaaamm || '').replace(/\D/g, '');
  if (limpo.length !== 6) return aaaamm;
  return `${limpo.slice(4, 6)}/${limpo.slice(0, 4)}`;
}

export const OPCOES_COMPETENCIA = [
  { valor: '202611', label: '11/2026 (Novembro/2026)' },
  { valor: '202610', label: '10/2026 (Outubro/2026)' },
  { valor: '202609', label: '09/2026 (Setembro/2026)' },
  { valor: '202608', label: '08/2026 (Agosto/2026)' },
  { valor: '202607', label: '07/2026 (Julho/2026)' },
  { valor: '202606', label: '06/2026 (Junho/2026)' },
  { valor: '201901', label: '01/2019 (Padrão PGMEI SERPRO)' },
  { valor: '201801', label: '01/2018 (Padrão PGDAS-D SERPRO)' },
];

