// A lógica de segurança e menu foi removida e centralizada em auth.js

// --- LÓGICA DO FORMULÁRIO DE CADASTRO ---

// Procura e armazena os elementos do formulário com os quais vamos interagir.
const cadastroForm = document.getElementById('cadastro-form');
const cpfInput = document.getElementById('cpf');
const telefoneInput = document.getElementById('telefone');

// URL da nossa API no back-end.
const API_URL = 'http://localhost:3000/api';

// --- FUNÇÕES DE MÁSCARA E VALIDAÇÃO ---

// Máscara automática de CPF
cpfInput.addEventListener("input", (e) => {
    let value = e.target.value.replace(/\D/g, ""); // Remove tudo o que não for número.
    if (value.length > 11) value = value.slice(0, 11); // Limita a 11 dígitos.
    value = value.replace(/(\d{3})(\d)/, "$1.$2"); // Adiciona o primeiro ponto.
    value = value.replace(/(\d{3})(\d)/, "$1.$2"); // Adiciona o segundo ponto.
    value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2"); // Adiciona o traço.
    e.target.value = value; // Atualiza o valor no campo.
});

// Função para validar se o CPF é matematicamente válido
function validarCPF(cpf) {
    cpf = cpf.replace(/[^\d]+/g, ""); // Remove pontos e traço.
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false; // Rejeita CPFs com todos os números repetidos.
    let soma = 0, resto;
    for (let i = 1; i <= 9; i++) soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    resto = (soma * 10) % 11;
    if ((resto === 10) || (resto === 11)) resto = 0;
    if (resto !== parseInt(cpf.substring(9, 10))) return false;
    soma = 0;
    for (let i = 1; i <= 10; i++) soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    resto = (soma * 10) % 11;
    if ((resto === 10) || (resto === 11)) resto = 0;
    if (resto !== parseInt(cpf.substring(10, 11))) return false;
    return true; // Se passar por todas as verificações, o CPF é válido.
}

// Máscara automática de telefone
telefoneInput.addEventListener('input', () => {
    let valor = telefoneInput.value.replace(/\D/g, ''); // Remove tudo o que não é número.
    if (valor.length > 11) valor = valor.slice(0, 11); // Limita a 11 números.
    valor = valor.replace(/^(\d{2})(\d)/, '($1) $2'); // Adiciona os parênteses do DDD.
    valor = valor.replace(/(\d{5})(\d)/, '$1-$2'); // Adiciona o hífen.
    telefoneInput.value = valor; // Atualiza o valor no campo.
});


// --- SUBMISSÃO DO FORMULÁRIO ---

// Evento que é acionado quando o formulário é submetido.
cadastroForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Impede o comportamento padrão do navegador de recarregar a página.

    const cpfValue = cpfInput.value; // Pega o valor do campo CPF.
    if (!validarCPF(cpfValue)) { // Valida o CPF usando a função acima.
        showToast("CPF inválido! Por favor, digite um CPF válido.", 'error'); // Mostra uma notificação de erro.
        return; // Para a execução se o CPF for inválido.
    }

    // Pega os valores dos outros campos do formulário.
    const username = document.getElementById('novo-username').value;
    const password = document.getElementById('nova-senha').value;
    const cargo = document.getElementById('novo-cargo').value;

    try { // Inicia uma "tentativa" de comunicar com o servidor.
        // Faz uma requisição do tipo POST para a nossa rota de registo no servidor.
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST', // Define o método como POST (para enviar dados).
            headers: { 'Content-Type': 'application/json' }, // Informa ao servidor que estamos a enviar dados em formato JSON.
            body: JSON.stringify({ username, password, cargo }) // Converte os dados para texto JSON e envia-os.
        });

        const data = await response.json(); // Converte a resposta do servidor de volta para um objeto JavaScript.

        if (!response.ok) { // Se a resposta do servidor indicar um erro...
            throw new Error(data.message || 'Ocorreu um erro.'); // ...lança uma exceção com a mensagem de erro.
        }

        showToast('Funcionário registrado com sucesso!'); // Mostra uma notificação de sucesso.
        cadastroForm.reset(); // Limpa todos os campos do formulário.

    } catch (error) { // Se ocorrer um erro durante a "tentativa"...
        showToast(error.message, 'error'); // ...mostra a mensagem de erro numa notificação vermelha.
    }
});