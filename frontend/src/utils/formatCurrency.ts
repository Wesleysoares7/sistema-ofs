/**
 * Converte um número para sua representação em extenso em português
 * @param num - Número a ser convertido
 * @returns String com o número em extenso
 */
export function numberToExtensoPT(num: number): string {
  if (num === 0) return 'Zero';

  const unidades = ['', 'Um', 'Dois', 'Três', 'Quatro', 'Cinco', 'Seis', 'Sete', 'Oito', 'Nove'];
  const dezenas = ['', '', 'Vinte', 'Trinta', 'Quarenta', 'Cinquenta', 'Sessenta', 'Setenta', 'Oitenta', 'Noventa'];
  const centenas = ['', 'Cento', 'Duzentos', 'Trezentos', 'Quatrocentos', 'Quinhentos', 'Seiscentos', 'Setecentos', 'Oitocentos', 'Novecentos'];
  const escalas = ['', 'Mil', 'Milhão', 'Bilhão', 'Trilhão'];

  function lerGrupo(n: number): string {
    let resultado = '';

    const c = Math.floor(n / 100);
    const d = Math.floor((n % 100) / 10);
    const u = n % 10;

    if (c > 0) {
      if (c === 1 && d === 0 && u === 0) {
        resultado = 'Cem';
      } else {
        resultado = centenas[c];
      }
    }

    if (d > 1) {
      if (resultado) resultado += ' e ';
      resultado += dezenas[d];
      if (u > 0) {
        resultado += ' e ' + unidades[u];
      }
    } else if (d === 1) {
      if (resultado) resultado += ' e ';
      const especiais = ['Dez', 'Onze', 'Doze', 'Treze', 'Quatorze', 'Quinze', 'Dezesseis', 'Dezessete', 'Dezoito', 'Dezenove'];
      resultado += especiais[u];
    } else if (u > 0) {
      if (resultado) resultado += ' e ';
      resultado += unidades[u];
    }

    return resultado;
  }

  const inteiro = Math.floor(num);
  const grupos: number[] = [];
  let temp = inteiro;

  while (temp > 0) {
    grupos.unshift(temp % 1000);
    temp = Math.floor(temp / 1000);
  }

  let resultado = '';
  for (let i = 0; i < grupos.length; i++) {
    if (grupos[i] > 0) {
      if (resultado) {
        if (grupos[i] < 100) {
          resultado += ' e ';
        } else {
          resultado += ', ';
        }
      }
      resultado += lerGrupo(grupos[i]);
      if (i < grupos.length - 1 && grupos[i] > 0) {
        resultado += ' ' + escalas[grupos.length - i - 1];
      }
    }
  }

  return resultado;
}

/**
 * Formata um valor monetário com extenso
 * @param valor - Valor em reais
 * @returns String formatada como "R$ XX,XX (Xxxxx Reais)"
 */
export function formatarValorComExtenso(valor: number): string {
  const formatado = valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const extenso = numberToExtensoPT(Math.floor(valor));
  const centavos = Math.round((valor % 1) * 100);

  let textoCompleto = extenso;
  if (centavos > 0) {
    textoCompleto += ` e ${numberToExtensoPT(centavos)} Centavos`;
  } else {
    textoCompleto += ' Reais';
  }

  return `${formatado} (${textoCompleto})`;
}
