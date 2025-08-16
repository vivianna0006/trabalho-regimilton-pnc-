document.addEventListener('DOMContentLoaded', () => { // Garante que o código só rode após o carregamento completo da página.

    // --- ROTINA DE SEGURANÇA ---
    const userCargo = sessionStorage.getItem('userCargo'); // Busca o cargo do usuário que foi salvo no login.
    if (!userCargo) { // Se não encontrar um cargo (usuário não logado)...
        alert('Acesso negado. Por favor, faça o login primeiro.'); // ...exibe um alerta.
        window.location.href = 'index.html'; // ...e redireciona para a página de login.
        return; // Para a execução do script.
    }
const mobileMenuButton = document.getElementById('mobile-menu-button'); // Encontra o botão hambúrguer.
const navRight = document.querySelector('.nav-right'); // Encontra o contêiner do menu da direita.

mobileMenuButton.addEventListener('click', () => { // Adiciona um "ouvinte" de clique ao botão.
    navRight.classList.toggle('active'); // Adiciona ou remove a classe 'active', que o CSS usa para mostrar/esconder o menu.
});
    // --- LÓGICA DO BOTÃO DE SAIR ---
    const logoutBtn = document.getElementById('botao-sair'); // Encontra o botão de sair.
    logoutBtn.addEventListener('click', () => { // Adiciona um "ouvinte" de clique ao botão.
        sessionStorage.removeItem('userCargo'); // Remove a informação de login do navegador.
        window.location.href = 'index.html'; // Redireciona para a página de login.
    });
});
// --- LÓGICA DE PERMISSÕES ---
const adminLink = document.getElementById('admin-link'); // Encontra o link de "Cadastro de Funcionarios".

// Adiciona um log no console para depuração. Isso nos ajuda a ver o que o código está "pensando".
console.log("Verificando permissões. Cargo encontrado:", userCargo);

// A verificação corrigida: .trim() remove espaços extras antes de comparar.
if (userCargo && userCargo.trim() === 'Administrador') {
    console.log("Permissão de Administrador concedida. Mostrando o link.");
    adminLink.classList.remove('hidden'); // Torna o link visível.
} else {
    console.log("Permissão de Administrador negada. O link permanecerá oculto.");
}
