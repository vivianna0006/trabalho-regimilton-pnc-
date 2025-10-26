document.addEventListener('DOMContentLoaded', () => {
    // --- 1. VERIFICAÃ‡ÃƒO DE LOGIN ---
    const userCargo = sessionStorage.getItem('userCargo');
    if (!userCargo) {
        window.location.href = './index.html';
        return;
    }

    // --- 2. DADOS DO MENU (COM AS OPÃ‡Ã•ES RESTAURADAS) ---
    const menuItems = [
        { text: 'Início', href: 'menu.html', parent: 'menu' },
        {
            text: 'Caixa',
            href: 'caixa.html',
            parent: 'caixa', // O "pai" de todos os itens do dropdown Ã© 'caixa'
            dropdown: [
                { text: 'Registro de Venda', href: 'caixa.html', adminOnly: false },
                { text: 'Sangria', href: 'sangria.html', adminOnly: true },
                // OPÃ‡Ã•ES RESTAURADAS ABAIXO
                { text: 'Suprimento de Caixa', href: '#', adminOnly: false },
                 { text: 'Histórico de Caixa', href: 'historico.html', adminOnly: true },
                { text: 'Fechamento de Caixa', href: 'fechamentocaixa.html', adminOnly: true }
            ]
        },
        { text: 'Estoque', href: 'estoque.html', parent: 'estoque' },
        { text: 'Cadastro de Funcionarios', href: 'cadastro-funcionarios.html', parent: 'cadastro-funcionarios', adminOnly: true }
    ];
    try {
        const caixa = (Array.isArray(menuItems) ? menuItems : []).find(i => i && i.text === 'Caixa' && Array.isArray(i.dropdown));
        if (caixa) {
            caixa.dropdown = caixa.dropdown.filter(d => d && d.href !== 'historico-vendas.html');
        }
    } catch (_) {}

    // --- 3. LÃ“GICA DE CONSTRUÃ‡ÃƒO DO MENU ---
    const navElement = document.querySelector('nav');
    if (!navElement) return;

    const isAdministrador = userCargo.trim().toLowerCase() === 'administrador';
    const paginaAtual = window.location.pathname.split('/').pop();
    let currentPageParent = '';

    // LÃ³gica para descobrir qual item "pai" deve ser destacado
    menuItems.forEach(item => {
        if (item.href === paginaAtual) {
            currentPageParent = item.parent;
        }
        if (item.dropdown) {
            item.dropdown.forEach(subItem => {
                if (subItem.href === paginaAtual) {
                    currentPageParent = item.parent; // Se estamos numa pÃ¡gina do dropdown, o pai Ã© destacado
                }
            });
        }
    });

    const fixLabel = (t) => {
        if (typeof t !== 'string') return t;
        return t.replace('Início', 'Início').replace('Historico', 'Historico');
    };

    let menuHTML = `<a href="./menu.html" class="brand-name">Styllo Fashion Modas</a><div class="nav-right"><ul class="navbar-links">`;

    menuItems.forEach(item => {
        if (item.adminOnly && !isAdministrador) return;

        // Adiciona a classe 'active' apenas ao <li> pai correto
        const liClass = (item.parent === currentPageParent) ? 'active' : '';

        if (item.dropdown) {
            menuHTML += `<li class="dropdown ${liClass}"><a href="./${item.href}" class="dropbtn">${fixLabel(item.text)}</a><div class="dropdown-content">`;
            item.dropdown.forEach(subItem => {
                if (!subItem.adminOnly || isAdministrador) {
                    menuHTML += `<a href="${subItem.href}">${fixLabel(subItem.text)}</a>`;
                }
            });
            menuHTML += `</div></li>`;
        } else {
            menuHTML += `<li class="${liClass}"><a href="./${item.href}">${fixLabel(item.text)}</a></li>`;
        }
    });

    menuHTML += `</ul><button id="logout-btn-menu" type="button">Sair</button></div>`;
    navElement.innerHTML = menuHTML;

    // 3.1: Dropdown por clique para evitar sumiço ao mover o mouse
    try {
        if (!window.__sfDropdownInit) {
            window.__sfDropdownInit = true;
            const getDropdowns = () => Array.from(document.querySelectorAll('.dropdown'));
            const closeAll = () => getDropdowns().forEach(d => d.classList.remove('open'));

            document.addEventListener('click', (e) => {
                const ddBtn = e.target.closest('.dropdown > .dropbtn');
                const dd = e.target.closest('.dropdown');
                if (ddBtn && dd) {
                    const alreadyOpen = dd.classList.contains('open');
                    // Se já estiver aberto, o segundo clique navega
                    if (alreadyOpen) {
                        const href = ddBtn.getAttribute('href');
                        if (href && href !== '#') {
                            e.preventDefault();
                            try { window.location.href = href; } catch (_) {}
                            return;
                        }
                    }
                    // Primeiro clique: apenas abre/fecha
                    e.preventDefault();
                    getDropdowns().forEach(d => { if (d !== dd) d.classList.remove('open'); });
                    dd.classList.toggle('open');
                    return;
                }
                if (!dd) closeAll();
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') closeAll();
            });
        }
    } catch (_) {}

    // --- 4. FUNCIONALIDADE DO BOTÃƒO "SAIR" ---
    const logoutBtn = document.getElementById('logout-btn-menu');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('Tem certeza que deseja sair?')) {
                sessionStorage.clear();
                window.location.replace('index.html');
            }
        });
    }
});
// Em frontend/auth.js

