document.addEventListener('DOMContentLoaded', () => { // Executa o código dentro desta função somente após a página HTML inteira ter sido carregada.
    const userCargo = sessionStorage.getItem('userCargo'); // Busca no armazenamento do navegador o valor associado à chave 'userCargo' e o guarda na constante userCargo.
    if (!userCargo) { // Verifica se a variável userCargo está vazia ou nula (ou seja, se o usuário não está logado).
        alert('Acesso negado. Por favor, faça o login primeiro.'); // Exibe uma caixa de alerta na tela com uma mensagem de acesso negado.
        window.location.href = 'index.html'; // Redireciona o usuário para a página de login (index.html).
        return; // Interrompe a execução do restante do script para evitar erros.
    } // Fecha o bloco de verificação de login.


    const isAdministrador = userCargo === 'Administrador'; // Cria uma variável booleana (true/false) que é verdadeira se o cargo do usuário for exatamente 'Administrador'.
    const adminLink = document.getElementById('admin-link'); // Procura no HTML o elemento com o ID 'admin-link' e o armazena na constante adminLink.
    if (isAdministrador && adminLink) { adminLink.classList.remove('hidden'); } // Se o usuário for administrador E o link de admin existir, remove a classe 'hidden' para torná-lo visível.
    const sangriaLink = document.getElementById('sangria-link'); // Procura no HTML o elemento com o ID 'sangria-link'.
    if (isAdministrador && sangriaLink) { sangriaLink.classList.remove('hidden'); } // Se o usuário for administrador E o link de sangria existir, remove a classe 'hidden' para torná-lo visível.
    const suprimentoLink = document.getElementById('suprimento-link'); // Procura no HTML o elemento com o ID 'suprimento-link'.
    if (isAdministrador && suprimentoLink) { suprimentoLink.classList.remove('hidden'); } // Se o usuário for administrador E o link de suprimento existir, remove a classe 'hidden' para torná-lo visível.
    const historicoLink = document.getElementById('historico-link'); // Procura no HTML o elemento com o ID 'historico-link'.
    if (isAdministrador && historicoLink) { historicoLink.classList.remove('hidden'); } // Se o usuário for administrador E o link de histórico existir, remove a classe 'hidden' para torná-lo visível.


    const logoutBtn = document.getElementById('logout-btn-menu'); // Procura no HTML o botão de sair pelo seu ID.
    if (logoutBtn) { // Verifica se o botão de sair foi encontrado na página.
        logoutBtn.addEventListener('click', () => { // Adiciona um "ouvinte" que espera por um clique no botão para executar uma função.
            if (confirm('Tem certeza que deseja sair?')) { // Exibe uma caixa de confirmação (com OK/Cancelar) para o usuário.
                sessionStorage.removeItem('userCargo'); // Se o usuário clicar em OK, remove a informação 'userCargo' do armazenamento do navegador.
                window.location.href = 'index.html'; // Redireciona o usuário de volta para a página de login.
            } // Fecha o bloco da confirmação.
        }); // Fecha o "ouvinte" de clique.
    } // Fecha o bloco que verifica se o botão existe.


    const mobileMenuButton = document.getElementById('mobile-menu-button'); // Procura no HTML o botão do menu "hambúrguer" pelo seu ID.
    const navRight = document.querySelector('.nav-right'); // Procura no HTML o primeiro elemento que tenha a classe 'nav-right'.
    if (mobileMenuButton && navRight) { // Verifica se ambos os elementos (botão mobile e o menu) foram encontrados.
        mobileMenuButton.addEventListener('click', () => { // Adiciona um "ouvinte" de clique ao botão do menu mobile.
            navRight.classList.toggle('active'); // A cada clique, adiciona a classe 'active' ao menu se ela não existir, ou a remove se ela já existir.
        }); // Fecha o "ouvinte" de clique.
    } // Fecha o bloco de verificação dos elementos do menu mobile.


    const currentPage = window.location.pathname.split('/').pop(); // Pega o nome do arquivo da URL atual (ex: 'menu.html').
    const activeLink = document.querySelector(`.navbar-links a[href*="${currentPage}"]`); // Procura por um link de navegação cujo 'href' contenha o nome do arquivo da página atual.
    if (activeLink) { // Verifica se um link correspondente à página atual foi encontrado.
        activeLink.classList.add('active'); // Adiciona a classe 'active' ao link encontrado para destacá-lo visualmente.
    } // Fecha o bloco de verificação do link ativo.
}); // Fecha o "ouvinte" do evento 'DOMContentLoaded'.
