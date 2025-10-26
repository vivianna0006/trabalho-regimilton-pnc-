// VARIÁVEL GLOBAL PARA ARMAZENAR OS DADOS TEÓRICOS DO DIA
let dadosDia = {
    suprimentos: 0.00,
    vendasDinheiro: 0.00,
    vendasCartao: 0.00,
    sangrias: 0.00,
    devolucoes: 0.00
};

// ======================================================================
// FUNÇÕES AUXILIARES
// ======================================================================

// Função para formatar o número como moeda brasileira (R$) com o sinal
const formatarMoeda = (valor) => {
    const valorAbsoluto = Math.abs(valor);
    const sinal = valor > 0 ? '+' : (valor < 0 ? '-' : ''); 
    const valorFormatado = valorAbsoluto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }).replace('R$', '');
    return `R$ ${sinal} ${valorFormatado.trim()}`;
};

// Função para aplicar estilos de cor e retornar o status
const aplicarEstiloDiferenca = (elemento, valor) => {
    elemento.classList.remove('quebra', 'sobra', 'neutro');
    const TOLERANCIA = 0.01; 
    if (Math.abs(valor) < TOLERANCIA) { 
        elemento.classList.add('neutro');
        return 'Bateu (OK)';
    } else if (valor < 0) {
        elemento.classList.add('quebra');
        return 'Quebra (Faltou)';
    } else {
        elemento.classList.add('sobra');
        return 'Sobra (Excedente)';
    }
};

// Função para aplicar estilos de TAGS de status
const aplicarEstiloStatus = (elemento, status) => {
    elemento.classList.remove('quebra-tag', 'sobra-tag', 'neutro-tag');
    if (status.includes('Quebra')) {
        elemento.classList.add('quebra-tag');
    } else if (status.includes('Sobra')) {
        elemento.classList.add('sobra-tag');
    } else {
        elemento.classList.add('neutro-tag');
    }
    const match = status.match(/\(([^)]+)\)/);
    elemento.textContent = match ? match[1] : status; 
};


// ======================================================================
// LÓGICA PRINCIPAL (FECHAMENTO DE CAIXA)
// ======================================================================

/**
 * 1. BUSCA DE DADOS E CÁLCULO DO ESPERADO.
 */
async function iniciarFechamento() {
    const dataFechamento = document.getElementById('data-fechamento').value;
    
    if (!dataFechamento) {
        console.error('Selecione uma data para iniciar o fechamento.');
        return;
    }

    try {
        // --- CHAMA O ENDPOINT DA API ---
        const response = await ApiClient.fetch(`/caixa/resumo?data=${dataFechamento}`);
        
        if (!response.ok) {
            const erroData = await response.json();
            throw new Error(erroData.message || 'Erro ao carregar dados do dia.');
        }
        
        dadosDia = await response.json();
        
        // Garante que todos os campos existam e sejam números (0 se null/undefined)
        dadosDia.suprimentos = parseFloat(dadosDia.suprimentos) || 0.00;
        dadosDia.vendasDinheiro = parseFloat(dadosDia.vendasDinheiro) || 0.00;
        dadosDia.vendasCartao = parseFloat(dadosDia.vendasCartao) || 0.00;
        dadosDia.sangrias = parseFloat(dadosDia.sangrias) || 0.00;
        dadosDia.devolucoes = parseFloat(dadosDia.devolucoes) || 0.00;

    } catch (error) {
        console.error('Erro ao buscar dados do dia:', error);
        // Zera os dados e a exibição em caso de falha de conexão
        dadosDia = { suprimentos: 0.00, vendasDinheiro: 0.00, vendasCartao: 0.00, sangrias: 0.00, devolucoes: 0.00 };
    }
    
    // --- CÁLCULOS DO VALOR ESPERADO (TEÓRICO) ---
    const vendasDinheiroLiquidas = dadosDia.vendasDinheiro - dadosDia.devolucoes;
    const esperadoCaixaDinheiro = 
        dadosDia.suprimentos + 
        vendasDinheiroLiquidas - 
        dadosDia.sangrias;
    const esperadoGeral = esperadoCaixaDinheiro + dadosDia.vendasCartao;

    // --- EXIBIÇÃO DOS TOTAIS ESPERADOS ---
    document.getElementById('val-suprimento').textContent = formatarMoeda(dadosDia.suprimentos);
    document.getElementById('val-vendas-dinheiro').textContent = formatarMoeda(dadosDia.vendasDinheiro);
    document.getElementById('val-vendas-cartao').textContent = formatarMoeda(dadosDia.vendasCartao);
    document.getElementById('val-sangrias').textContent = formatarMoeda(dadosDia.sangrias);
    document.getElementById('val-devolucoes').textContent = formatarMoeda(dadosDia.devolucoes);

    document.getElementById('val-esperado-caixa').textContent = formatarMoeda(esperadoCaixaDinheiro);
    document.getElementById('val-esperado-geral').textContent = formatarMoeda(esperadoGeral);

    // --- SETUP DA CONFERÊNCIA (UX) ---
    document.getElementById('dinheiro-contado').value = 0.00.toFixed(2);
    document.getElementById('cartao-extrato').value = dadosDia.vendasCartao.toFixed(2);

    // Salva os valores esperados (teóricos) nos inputs para serem usados no cálculo de diferença
    document.getElementById('dinheiro-contado').dataset.esperadoDinheiro = esperadoCaixaDinheiro.toFixed(2);
    document.getElementById('cartao-extrato').dataset.esperadoCartao = dadosDia.vendasCartao.toFixed(2);

    calcularDiferenca();
}

/**
 * 2. CÁLCULO DA DIFERENÇA ENTRE ESPERADO E CONTADO (EXECUTA AO DIGITAR).
 */
function calcularDiferenca() {
    const dinheiroContado = parseFloat(document.getElementById('dinheiro-contado').value) || 0;
    const cartaoExtrato = parseFloat(document.getElementById('cartao-extrato').value) || 0;
    
    const esperadoCaixaDinheiro = parseFloat(document.getElementById('dinheiro-contado').dataset.esperadoDinheiro) || 0;
    const esperadoCartao = parseFloat(document.getElementById('cartao-extrato').dataset.esperadoCartao) || 0;
    
    // Diferença = Contado - Esperado
    const diferencaDinheiro = dinheiroContado - esperadoCaixaDinheiro;
    const diferencaCartao = cartaoExtrato - esperadoCartao;
    const diferencaGeral = diferencaDinheiro + diferencaCartao;

    // ATUALIZAÇÃO DA TELA
    const elDifDinheiro = document.getElementById('val-dif-dinheiro');
    const statusDinheiro = aplicarEstiloDiferenca(elDifDinheiro, diferencaDinheiro);
    aplicarEstiloStatus(document.getElementById('status-dinheiro'), statusDinheiro);
    elDifDinheiro.textContent = formatarMoeda(diferencaDinheiro);

    const elDifCartao = document.getElementById('val-dif-cartao');
    const statusCartao = aplicarEstiloDiferenca(elDifCartao, diferencaCartao);
    aplicarEstiloStatus(document.getElementById('status-cartao'), statusCartao);
    elDifCartao.textContent = formatarMoeda(diferencaCartao);

    const elDifGeral = document.getElementById('val-dif-geral');
    const statusGeral = aplicarEstiloDiferenca(elDifGeral, diferencaGeral); 
    aplicarEstiloStatus(document.getElementById('status-geral'), statusGeral.split(' ')[0]); 
    elDifGeral.textContent = formatarMoeda(diferencaGeral);
    
    // Habilita o botão
    const btnFinalizar = document.getElementById('finalizar-fechamento');
    const temDadosEsperados = esperadoCaixaDinheiro !== 0 || esperadoCartao !== 0; 
    const contagemFeita = dinheiroContado > 0 || cartaoExtrato > 0;
    
    btnFinalizar.disabled = !(temDadosEsperados || contagemFeita);
}

/**
 * 3. FUNÇÃO DE FINALIZAÇÃO (ENVIO PARA A API).
 */
async function finalizarCaixa() {
    const diferencaGeralElement = document.getElementById('val-dif-geral');
    const textoDiferenca = diferencaGeralElement.textContent.replace('R$', '').trim();
    const sinal = textoDiferenca.startsWith('-') ? -1 : 1;
    const valorNumerico = parseFloat(textoDiferenca.replace(/[^\d.]/g, '')) || 0; 
    const diferencaGeral = sinal * valorNumerico;

    const statusGeral = document.getElementById('status-geral').textContent; 
    let statusTextoCompleto = 'Bateu (OK)';
    if (statusGeral === 'Faltou') statusTextoCompleto = 'Quebra (Faltou)';
    if (statusGeral === 'Excedente') statusTextoCompleto = 'Sobra (Excedente)';
    
    if (confirm(`Confirma o fechamento do caixa com status: ${statusTextoCompleto} e diferença de ${formatarMoeda(diferencaGeral)}?`)) {
        
        const dinheiroContado = parseFloat(document.getElementById('dinheiro-contado').value) || 0;
        const cartaoContado = parseFloat(document.getElementById('cartao-extrato').value) || 0;
        const esperadoCaixa = parseFloat(document.getElementById('dinheiro-contado').dataset.esperadoDinheiro) || 0;
        const esperadoCartao = parseFloat(document.getElementById('cartao-extrato').dataset.esperadoCartao) || 0;
        
        const dadosFechamento = {
            data: document.getElementById('data-fechamento').value,
            dinheiroContado: dinheiroContado,
            cartaoContado: cartaoContado,
            esperadoCaixaDinheiro: esperadoCaixa,
            esperadoCartao: esperadoCartao,
            diferencaGeral: diferencaGeral,
            statusFinal: statusTextoCompleto,
            dadosHistoricos: dadosDia 
        };
        
        try {
            const response = await ApiClient.post('/caixa/fechar', dadosFechamento);
            
            if (response.ok) {
                console.log("Fechamento Finalizado com sucesso!", dadosFechamento);
                // notificar.showSuccess('Fechamento de Caixa realizado com sucesso!');
                
            } else {
                const erroData = await response.json();
                console.error("Erro ao finalizar o caixa:", erroData.message);
                // notificar.showError(erroData.message || 'Erro ao finalizar o caixa.');
            }
        } catch (error) {
            console.error("Erro de comunicação com a API:", error);
            // notificar.showError('Falha na conexão com a API de fechamento.');
        }
    }
}


// ======================================================================
// INICIALIZAÇÃO
// ======================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Seta a data de hoje no input e inicia a busca de dados
    const hoje = new Date().toISOString().split('T')[0];
    const dataInput = document.getElementById('data-fechamento');
    if (dataInput) {
        dataInput.value = hoje;
    }
    
    // Inicia o carregamento dos dados do dia atual
    iniciarFechamento();
    
    // Adiciona o listener para recalcular a diferença ao alterar os campos contados
    document.getElementById('dinheiro-contado').addEventListener('input', calcularDiferenca);
    document.getElementById('cartao-extrato').addEventListener('input', calcularDiferenca);
    
    // OBS: O listener para o botão "Finalizar Fechamento" não é adicionado aqui 
    // porque ele está no HTML com onclick="finalizarCaixa()", para evitar duplicidade.
});