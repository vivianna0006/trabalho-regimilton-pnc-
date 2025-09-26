document.addEventListener('DOMContentLoaded', () => {
    // --- 1. VERIFICAÇÃO DE LOGIN ---
    const userCargo = sessionStorage.getItem('userCargo');
    if (!userCargo) {
        window.location.href = './index.html';
        return;
    }

    // --- 2. DADOS DO MENU (COM AS OPÇÕES RESTAURADAS) ---
    const menuItems = [
        { text: 'Início', href: 'menu.html', parent: 'menu' },
        {
            text: 'Caixa',
            href: 'caixa.html',
            parent: 'caixa', // O "pai" de todos os itens do dropdown é 'caixa'
            dropdown: [
                { text: 'Registro de Venda', href: 'caixa.html', adminOnly: false },
                { text: 'Sangria', href: 'sangria.html', adminOnly: true },
                // OPÇÕES RESTAURADAS ABAIXO
                { text: 'Suprimento de Caixa', href: '#', adminOnly: true },
                { text: 'Histórico de Vendas', href: '#', adminOnly: true },
                { text: 'Fechamento de Caixa', href: '#', adminOnly: false }
            ]
        },
        { text: 'Estoque', href: 'estoque.html', parent: 'estoque' },
        { text: 'Cadastro de Funcionarios', href: 'cadastro-funcionarios.html', parent: 'cadastro-funcionarios', adminOnly: true }
    ];

    // --- 3. LÓGICA DE CONSTRUÇÃO DO MENU ---
    const navElement = document.querySelector('nav');
    if (!navElement) return;

    const isAdministrador = userCargo.trim().toLowerCase() === 'administrador';
    const paginaAtual = window.location.pathname.split('/').pop();
    let currentPageParent = '';

    // Lógica para descobrir qual item "pai" deve ser destacado
    menuItems.forEach(item => {
        if (item.href === paginaAtual) {
            currentPageParent = item.parent;
        }
        if (item.dropdown) {
            item.dropdown.forEach(subItem => {
                if (subItem.href === paginaAtual) {
                    currentPageParent = item.parent; // Se estamos numa página do dropdown, o pai é destacado
                }
            });
        }
    });

    let menuHTML = `<a href="./menu.html" class="brand-name">Styllo Fashion Modas</a><div class="nav-right"><ul class="navbar-links">`;

    menuItems.forEach(item => {
        if (item.adminOnly && !isAdministrador) return;

        // Adiciona a classe 'active' apenas ao <li> pai correto
        const liClass = (item.parent === currentPageParent) ? 'active' : '';

        if (item.dropdown) {
            menuHTML += `<li class="dropdown ${liClass}"><a href="./${item.href}" class="dropbtn">${item.text}</a><div class="dropdown-content">`;
            item.dropdown.forEach(subItem => {
                if (!subItem.adminOnly || isAdministrador) {
                    menuHTML += `<a href="${subItem.href}">${subItem.text}</a>`;
                }
            });
            menuHTML += `</div></li>`;
        } else {
            menuHTML += `<li class="${liClass}"><a href="./${item.href}">${item.text}</a></li>`;
        }
    });

    menuHTML += `</ul><button id="logout-btn-menu" type="button">Sair</button></div>`;
    navElement.innerHTML = menuHTML;

    // --- 4. FUNCIONALIDADE DO BOTÃO "SAIR" ---
    const logoutBtn = document.getElementById('logout-btn-menu');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('Tem certeza que deseja sair?')) {
                sessionStorage.clear();
                window.location.href = 'index.html';
            }
        });
    }
});