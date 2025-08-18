document.addEventListener('DOMContentLoaded', () => {

    console.log("--- [cadastro-funcionarios.js] Script iniciado ---");

    const userCargo = sessionStorage.getItem('userCargo');
    console.log("Cargo encontrado no sessionStorage:", `"${userCargo}"`); 

    if (!userCargo || userCargo.trim() !== 'Administrador') {
        console.error("ACESSO NEGADO! O utilizador não é Administrador ou não está logado. A redirecionar...");
        alert('Acesso negado. Apenas gerentes podem aceder a esta página.');
        window.location.href = 'menu.html'; 
        return;
    }
    
    console.log("Verificação de segurança passou. O utilizador é um Administrador.");


    const showElement = (elementId) => {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.remove('hidden');
            if (element.classList.contains('hidden')) {
                console.error(`### PROBLEMA: A classe 'hidden' não foi removida do elemento #${elementId}.`);
            } else {
                console.log(`SUCESSO: O link #${elementId} está agora visível.`);
            }
        } else {
            console.error(`### ERRO: O elemento com id '${elementId}' não foi encontrado no HTML.`);
        }
    };

    showElement('admin-link');
    showElement('sangria-link');
    showElement('suprimento-link');
    showElement('historico-link');

    const logoutBtn = document.getElementById('logout-btn-menu');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('Tem certeza que deseja sair?')) {
                sessionStorage.removeItem('userCargo');
                window.location.href = 'index.html';
            }
        });
    }

    const activeLink = document.querySelector('.navbar-links a[href*="cadastro-funcionarios.html"]');
    if (activeLink) {
        activeLink.classList.add('active');
    }

    const cadastroForm = document.getElementById('cadastro-form');
    const cadastroMessage = document.getElementById('cadastro-message');
    const API_URL = 'http://localhost:3000/api';

    cadastroForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('novo-username').value;
        const password = document.getElementById('nova-senha').value;
        const cargo = document.getElementById('novo-cargo').value;

        try {
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, cargo })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Ocorreu um erro.');
            }

            cadastroMessage.textContent = 'Funcionário cadastrado com sucesso!';
            cadastroMessage.style.color = 'green';
            cadastroForm.reset(); // Limpa o formulário

        } catch (error) {
            cadastroMessage.textContent = error.message;
            cadastroMessage.style.color = 'red';
        }
    });
});
