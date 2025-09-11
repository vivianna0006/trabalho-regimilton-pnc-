document.addEventListener('DOMContentLoaded', () => {
    // --- ROTINA DE SEGURANÇA E LÓGICA DO MENU ---
    // (Esta parte garante que a página é segura e que o menu funciona corretamente)
    const userCargo = sessionStorage.getItem('userCargo');
    if (!userCargo) {
        alert('Acesso negado. Por favor, faça o login primeiro.');
        window.location.href = './index.html';
        return;
    }
    const isAdministrador = userCargo === 'Administrador';
    const adminLink = document.getElementById('admin-link');
    if (isAdministrador && adminLink) { adminLink.classList.remove('hidden'); }
    const sangriaLink = document.getElementById('sangria-link');
    if (isAdministrador && sangriaLink) { sangriaLink.classList.remove('hidden'); }
    const suprimentoLink = document.getElementById('suprimento-link');
    if (isAdministrador && suprimentoLink) { suprimentoLink.classList.remove('hidden'); }
    const historicoLink = document.getElementById('historico-link');
    if (isAdministrador && historicoLink) { historicoLink.classList.remove('hidden'); }
    const logoutBtn = document.getElementById('logout-btn-menu');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('Tem certeza que deseja sair?')) {
                sessionStorage.removeItem('userCargo');
                sessionStorage.removeItem('username');
                window.location.href = './index.html';
            }
        });
    }

    // --- LÓGICA DA SANGRIA ---
    const sangriaForm = document.getElementById('sangria-form');
    const valorInput = document.getElementById('sangria-valor');

    // Função para formatar o valor como moeda enquanto o utilizador digita
    const formatarMoeda = (valor) => {
        // Remove tudo o que não for número
        const apenasNumeros = valor.replace(/\D/g, '');
        // Adiciona zeros à esquerda se necessário para garantir que temos pelo menos 3 dígitos (para os centavos)
        const numeroComZeros = apenasNumeros.padStart(3, '0');
        // Pega os últimos dois dígitos para serem os centavos
        const centavos = numeroComZeros.slice(-2);
        // Pega o resto para ser o valor inteiro
        const inteiro = numeroComZeros.slice(0, -2);
        // Formata o número com pontos para os milhares (padrão brasileiro)
        const inteiroFormatado = parseInt(inteiro, 10).toLocaleString('pt-BR');
        
        return `${inteiroFormatado},${centavos}`;
    };

    // Adiciona o "ouvinte" que formata o valor a cada tecla digitada
    valorInput.addEventListener('input', () => {
        const valorFormatado = formatarMoeda(valorInput.value);
        valorInput.value = valorFormatado;
    });

    // Lógica para enviar o formulário
    sangriaForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const valor = valorInput.value;
        const motivo = document.getElementById('sangria-motivo').value;
        const utilizador = sessionStorage.getItem('username');

        // Validação robusta antes de enviar
        if (!utilizador) {
            showToast('Erro: Utilizador não identificado. Por favor, faça logout e login novamente.', 'error');
            return;
        }

        // Converte o valor formatado (ex: "1.234,56") para um número puro (1234.56) que o servidor entende
        const valorNumerico = parseFloat(valor.replace(/\./g, '').replace(',', '.'));

        if (isNaN(valorNumerico) || valorNumerico <= 0) {
            showToast('Por favor, insira um valor válido para a sangria.', 'error');
            return;
        }

        const transacao = {
            type: 'sangria',
            amount: valorNumerico,
            reason: motivo,
            user: utilizador
        };

        try {
            const response = await fetch('http://localhost:3000/api/sangria', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transacao)
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message);

            showToast('Sangria registada com sucesso!');
            sangriaForm.reset();

        } catch (error) {
            showToast(error.message || 'Erro ao registar a sangria.', 'error');
        }
    });
});