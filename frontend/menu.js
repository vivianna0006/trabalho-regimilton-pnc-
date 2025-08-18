document.addEventListener('DOMContentLoaded', () => {
    const userCargo = sessionStorage.getItem('userCargo');
    if (!userCargo) {
        alert('Acesso negado. Por favor, faça o login primeiro.');
        window.location.href = 'index.html';
        return;
    }

    const isAdministrador = userCargo === 'Administrador';
    const adminLink = document.getElementById('admin-link');
    if (isAdministrador && adminLink) { adminLink.classList.remove('hidden'); }
    const sangriaLink = document.getElementById('sangria-link');
    if (isAdministrador && sangriaLink) { sangriaLink.classList.remove('hidden'); }
    const suprimentoLink = document.getElementById('suprimento-link');
    if (isAdministrador && suprimentoLink) { suprimentoLink.classList.remove('hidden'); }
    const historicoLink = document.getElementById('historico-link');
    if (isAdministrador && historicoLink) { historicoLink.classList.remove('hidden'); }

    const logoutBtn = document.getElementById('logout-btn-menu');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('Tem certeza que deseja sair?')) {
                sessionStorage.removeItem('userCargo');
                window.location.href = 'index.html';
            }
        });
    }

    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const navRight = document.querySelector('.nav-right');
    if (mobileMenuButton && navRight) {
        mobileMenuButton.addEventListener('click', () => {
            navRight.classList.toggle('active');
        });
    }

    const currentPage = window.location.pathname.split('/').pop();
    const activeLink = document.querySelector(`.navbar-links a[href*="${currentPage}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
});
