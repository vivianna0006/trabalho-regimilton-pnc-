document.addEventListener('DOMContentLoaded', () => { // Garante que o código só rode após o carregamento completo da página.

    // --- ELEMENTOS DO DOM ---
    // Procura e armazena os elementos HTML com os quais vamos interagir.
    const loginBox = document.getElementById('login-box');
    const loginForm = document.getElementById('login-form');
    const loginMessage = document.getElementById('login-message');
    const API_URL = 'http://localhost:3000/api'; // Define o endereço base da nossa API.

    // --- FUNÇÃO DE VERIFICAÇÃO INICIAL ---
    // Esta função verifica se o sistema já tem utilizadores ou se precisa da configuração inicial.
    const checkSystemStatus = async () => {
        try {
            const response = await fetch(`${API_URL}/status`);
            const data = await response.json();
            
            if (data.usersExist) {
                // Se já existem utilizadores, mostra a caixa de login.
                loginBox.classList.remove('hidden');
            } else {
                // Se não existem utilizadores, redireciona para a página de configuração.
                window.location.href = './setup.html';
            }
        } catch (error) {
            // Se não conseguir conectar ao servidor, mostra uma mensagem de erro clara.
            document.body.innerHTML = '<h2 style="color: red; text-align: center;">Erro de Conexão</h2><p style="text-align: center;">Não foi possível conectar ao servidor. Verifique se o back-end está rodando e tente novamente.</p>';
        }
    };

    // --- LÓGICA DO FORMULÁRIO DE LOGIN ---
    // Adiciona um "ouvinte" para quando o formulário de login for enviado.
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Impede o comportamento padrão de recarregar a página.
        
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (data.success) {
                // Se o login for bem-sucedido, guarda os dados do utilizador no navegador.
                sessionStorage.setItem('userCargo', data.cargo);
                sessionStorage.setItem('username', data.username);

                loginMessage.textContent = data.message + " Redirecionando...";
                loginMessage.style.color = 'green';

                // Redireciona para a página do menu após 1.5 segundos.
                setTimeout(() => {
                    window.location.href = './menu.html';
                }, 1500);
            } else {
                // Se o login falhar, mostra a mensagem de erro vinda do servidor.
                loginMessage.textContent = data.message;
                loginMessage.style.color = 'red';
            }
        } catch (error) {
            loginMessage.textContent = 'Não foi possível conectar ao servidor.';
            loginMessage.style.color = 'red';
        }
    });

    // Inicia a verificação do sistema assim que a página carrega.
    checkSystemStatus();
});