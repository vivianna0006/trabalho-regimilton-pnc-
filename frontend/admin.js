document.addEventListener('DOMContentLoaded', () => {
    const userCargo = sessionStorage.getItem('userCargo');
    if (userCargo !== 'Administrador') {
        
        alert('Acesso negado. Você não tem permissão para ver esta página.');
        window.location.href = 'index.html'; 
        return; 
    }

    const userListDiv = document.getElementById('user-list');
    const adminMessage = document.getElementById('admin-message');
    const logoutBtn = document.getElementById('logout-btn');
    const API_URL = 'http://localhost:3000/api';


    const fetchAndDisplayUsers = async () => {
        try {
            const response = await fetch(`${API_URL}/users`);
            if (!response.ok) {
                throw new Error('Falha ao buscar usuários.');
            }
            const users = await response.json();
            
            userListDiv.innerHTML = ''; 

            users.forEach(user => {
                const userItem = document.createElement('div');
                userItem.className = 'user-item';
                userItem.innerHTML = `
                    <div class="user-details">
                        <strong>Usuário:</strong> ${user.username} <br>
                        <strong>Cargo:</strong> ${user.cargo}
                    </div>
                    <button class="delete-btn" data-username="${user.username}">Excluir</button>
                `;
                userListDiv.appendChild(userItem);
            });

        } catch (error) {
            adminMessage.textContent = error.message;
            adminMessage.style.color = 'red';
        }
    };


    userListDiv.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const usernameToDelete = e.target.dataset.username;


            const isConfirmed = confirm(`Tem certeza que deseja excluir o usuário "${usernameToDelete}"? Esta ação não pode ser desfeita.`);
            
            if (isConfirmed) {
                try {
                    const response = await fetch(`${API_URL}/users/${usernameToDelete}`, {
                        method: 'DELETE',
                    });

                    const data = await response.json();

                    if (response.ok) {
                        adminMessage.textContent = data.message;
                        adminMessage.style.color = 'green';

                        fetchAndDisplayUsers(); 
                    } else {
                        throw new Error(data.message);
                    }

                } catch (error) {
                    adminMessage.textContent = error.message || 'Erro ao conectar com o servidor.';
                    adminMessage.style.color = 'red';
                }
            }
        }
    });


    logoutBtn.addEventListener('click', () => {

        sessionStorage.removeItem('userCargo');
        window.location.href = 'index.html';
    });


    fetchAndDisplayUsers();
});