// Garante que o script só roda depois que o DOM estiver totalmente carregado
document.addEventListener('DOMContentLoaded', () => {

    console.log("--- [cadastro-funcionarios.js] Script iniciado ---");

    // Recupera o cargo do usuário armazenado no sessionStorage
    const userCargo = sessionStorage.getItem('userCargo');
    console.log("Cargo encontrado no sessionStorage:", `"${userCargo}"`); 

    // Se não existir cargo ou se não for "Administrador", bloqueia acesso
    if (!userCargo || userCargo.trim() !== 'Administrador') {
        console.error("ACESSO NEGADO! O utilizador não é Administrador ou não está logado. A redirecionar...");
        alert('Acesso negado. Apenas gerentes podem aceder a esta página.');
        window.location.href = 'menu.html'; // Redireciona para o menu
        return; // Interrompe a execução do script
    }
    
    console.log("Verificação de segurança passou. O utilizador é um Administrador.");

    // Função para exibir elementos escondidos no menu
    const showElement = (elementId) => {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.remove('hidden'); // Remove a classe "hidden"
            if (element.classList.contains('hidden')) {
                console.error(`### PROBLEMA: A classe 'hidden' não foi removida do elemento #${elementId}.`);
            } else {
                console.log(`SUCESSO: O link #${elementId} está agora visível.`);
            }
        } else {
            console.error(`### ERRO: O elemento com id '${elementId}' não foi encontrado no HTML.`);
        }
    };

    // Mostra os links do menu que estavam ocultos
    showElement('admin-link');
    showElement('sangria-link');
    showElement('suprimento-link');
    showElement('historico-link');

    // Configura o botão de logout
    const logoutBtn = document.getElementById('logout-btn-menu');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('Tem certeza que deseja sair?')) {
                sessionStorage.removeItem('userCargo'); // Apaga cargo da sessão
                window.location.href = 'index.html'; // Redireciona para tela inicial
            }
        });
    }

    // Destaca o link "Cadastro de Funcionários" no menu como ativo
    const activeLink = document.querySelector('.navbar-links a[href*="cadastro-funcionarios.html"]');
    if (activeLink) {
        activeLink.classList.add('active');
    }

    // Captura o formulário e a área de mensagens
    const cadastroForm = document.getElementById('cadastro-form');
    const cadastroMessage = document.getElementById('cadastro-message');

    // URL da API backend
    const API_URL = 'http://localhost:3000/api';

    // Evento de envio do formulário
    cadastroForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Impede o recarregamento da página

        // Pega valores digitados nos campos
        const username = document.getElementById('novo-username').value;
        const password = document.getElementById('nova-senha').value;
        const cargo = document.getElementById('novo-cargo').value;

        try {
            // Faz requisição para o backend (endpoint /register)
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, cargo }) // Envia os dados em JSON
            });

            const data = await response.json(); // Converte resposta em JSON

            // Se houver erro na resposta, lança exceção
            if (!response.ok) {
                throw new Error(data.message || 'Ocorreu um erro.');
            }

            // Se deu certo, mostra mensagem verde
            cadastroMessage.textContent = 'Funcionário cadastrado com sucesso!';
            cadastroMessage.style.color = 'green';
            cadastroForm.reset(); // Limpa os campos do formulário

        } catch (error) {
            // Mostra erro em vermelho
            cadastroMessage.textContent = error.message;
            cadastroMessage.style.color = 'red';
        }
    });
});
// Máscara de CPF automática
document.getElementById("cpf").addEventListener("input", function (e) {
    let value = e.target.value.replace(/\D/g, ""); // Remove tudo que não for número
    if (value.length > 11) value = value.slice(0, 11); // Limita a 11 dígitos

    // Coloca a máscara progressivamente
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");

    e.target.value = value; // Atualiza o valor no input
});

// Função para validar se o CPF é verdadeiro
function validarCPF(cpf) {
    cpf = cpf.replace(/[^\d]+/g, ""); // Remove pontos e traço
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false; // Rejeita CPFs repetidos (ex: 111.111...)

    let soma = 0, resto;

    // Primeiro dígito verificador
    for (let i = 1; i <= 9; i++) soma += parseInt(cpf.substring(i-1, i)) * (11 - i);
    resto = (soma * 10) % 11;
    if ((resto === 10) || (resto === 11)) resto = 0;
    if (resto !== parseInt(cpf.substring(9, 10))) return false;

    // Segundo dígito verificador
    soma = 0;
    for (let i = 1; i <= 10; i++) soma += parseInt(cpf.substring(i-1, i)) * (12 - i);
    resto = (soma * 10) % 11;
    if ((resto === 10) || (resto === 11)) resto = 0;
    if (resto !== parseInt(cpf.substring(10, 11))) return false;

    return true;
}

// Impede envio do formulário se o CPF for inválido
document.querySelector("form").addEventListener("submit", function(e) {
    let cpf = document.getElementById("cpf").value;
    if (!validarCPF(cpf)) {
        alert("CPF inválido! Digite um CPF válido.");
        e.preventDefault(); // Cancela o envio
    }
});
// Máscara automática de telefone
const telefoneInput = document.getElementById('telefone');

telefoneInput.addEventListener('input', function() {
    let valor = telefoneInput.value.replace(/\D/g, ''); // Remove tudo que não é número

    if (valor.length > 11) {
        valor = valor.slice(0, 11); // Limita a 11 números
    }

    // Coloca a máscara (DDD e hífen)
    valor = valor.replace(/^(\d{2})(\d)/, '($1) $2'); // Ex: (99) 9
    valor = valor.replace(/(\d{5})(\d)/, '$1-$2'); // Ex: 99999-9999

    telefoneInput.value = valor; // Atualiza no campo
});