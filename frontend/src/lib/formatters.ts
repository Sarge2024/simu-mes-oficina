/**
 * Utilitários de formatação para o sistema.
 */

/**
 * Formata uma string para o padrão de CPF ou CNPJ.
 * @param value String com números brutos ou já formatados.
 * @returns String formatada ou original se não for possível formatar.
 */
export const formatCPFCNPJ = (value: string): string => {
  if (!value) return '';
  
  // Remove tudo o que não é dígito
  const digits = value.replace(/\D/g, '');
  
  // Se for maior que 14, corta (limite de CNPJ)
  const cleanValue = digits.slice(0, 14);

  if (cleanValue.length <= 11) {
    // CPF: 000.000.000-00
    return cleanValue
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  } else {
    // CNPJ: 00.000.000/0000-00
    return cleanValue
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  }
};

/**
 * Valida um número de CPF.
 */
export const validateCPF = (cpf: string): boolean => {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11 || !!digits.match(/(\d)\1{10}/)) return false;
  
  const calc = (n: number) => {
    let sum = 0;
    for (let i = 0; i < n; i++) sum += parseInt(digits[i]) * (n + 1 - i);
    const rev = 11 - (sum % 11);
    return rev === 10 || rev === 11 ? 0 : rev;
  };
  
  return calc(9) === parseInt(digits[9]) && calc(10) === parseInt(digits[10]);
};

/**
 * Valida um número de CNPJ.
 */
export const validateCNPJ = (cnpj: string): boolean => {
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length !== 14 || !!digits.match(/(\d)\1{13}/)) return false;
  
  const calc = (n: number) => {
    const weights = n === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < n; i++) sum += parseInt(digits[i]) * weights[i];
    const rev = 11 - (sum % 11);
    return rev === 10 || rev === 11 ? 0 : rev;
  };
  
  return calc(12) === parseInt(digits[12]) && calc(13) === parseInt(digits[13]);
};

/**
 * Valida CPF ou CNPJ baseado no tamanho.
 */
export const isValidCPFCNPJ = (value: string): boolean => {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 11) return validateCPF(digits);
  if (digits.length === 14) return validateCNPJ(digits);
  return false;
};

/**
 * Formata moeda para Real Brasileiro (R$).
 */
export const formatCurrency = (value: number | string): string => {
  const amount = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(amount)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
};

/**
 * Formata uma placa de veículo para o padrão brasileiro AAA-9999 (tradicional) ou mantém AAA9A99 (Mercosul).
 */
export const formatarPlaca = (placa: string): string => {
  const limpa = placa.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (limpa.length !== 7) return limpa;
  
  // Se for tradicional (quinto caractere é número): AAA-9999
  const ehTradicional = /^[A-Z]{3}[0-9]{4}$/.test(limpa);
  if (ehTradicional) {
    return `${limpa.slice(0, 3)}-${limpa.slice(3)}`;
  }
  return limpa;
};

/**
 * Valida se a placa é do formato tradicional (AAA-9999) ou Mercosul (AAA9A99).
 */
export const validarPlaca = (placa: string): boolean => {
  const limpa = placa.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (limpa.length !== 7) return false;
  return /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(limpa);
};
