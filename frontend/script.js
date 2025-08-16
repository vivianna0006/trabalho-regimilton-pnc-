document.addEventListener('DOMContentLoaded', () => {

    const loginBox = document.getElementById('login-box');
    const loginForm = document.getElementById('login-form');
    const loginMessage = document.getElementById('login-message');
    const API_URL = 'http://localhost:3000/api';
    const checkSystemStatus = async () => {
        try {
            const response = await fetch(`${API_URL}/status`);
            const data = await response.json();
            if (data.usersExist) {
                loginBox.classList.remove('hidden');
            } else {
                window.location.href = 'setup.html';
            }
        } catch (error) {
            document.body.innerHTML = '<h2 style="color: red; text-align: center;">Erro de Conexão</h2><p style="text-align: center;">Não foi possível conectar ao servidor. Verifique se o back-end está rodando e tente novamente.</p>';
        }
    };

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
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
                sessionStorage.setItem('userCargo', data.cargo);

                loginMessage.textContent = data.message + " Redirecionando...";
                loginMessage.style.color = 'green';

setTimeout(() => { // Agenda uma ação para daqui a 1.5 segundos.
    // Após um login bem-sucedido, redireciona TODOS os usuários para a página do menu.
    window.location.href = 'menu.html';
}, 1500); // Define o tempo de espera em milissegundos.

            } else {
                loginMessage.textContent = data.message;
                loginMessage.style.color = 'red';
            }
        } catch (error) {
            loginMessage.textContent = 'Não foi possível conectar ao servidor.';
            loginMessage.style.color = 'red';
        }
    });
    checkSystemStatus();
});