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
