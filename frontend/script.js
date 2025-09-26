document.addEventListener('DOMContentLoaded', () => {
  const loginBox = document.getElementById('login-box');
  const loginForm = document.getElementById('login-form');
  const loginMessage = document.getElementById('login-message');

  if (loginBox) {
    loginBox.classList.add('hidden');
  }

  const parseJson = async (response) => {
    if (!response) {
      return {};
    }

    const contentType = response.headers?.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return {};
    }

    try {
      return await response.json();
    } catch (_) {
      return {};
    }
  };

  const showError = (message) => {
    if (loginBox) {
      loginBox.classList.remove('hidden');
    }
    if (loginMessage) {
      loginMessage.textContent = message;
      loginMessage.style.color = 'red';
    }
  };

  const showNeutralMessage = (message) => {
    if (loginMessage) {
      loginMessage.textContent = message;
      loginMessage.style.color = '#333';
    }
  };

  const clearMessage = () => {
    if (loginMessage) {
      loginMessage.textContent = '';
      loginMessage.style.color = '';
    }
  };

  const checkSystemStatus = async () => {
    try {
      const response = await ApiClient.fetch('/status', { cache: 'no-store' });
      const data = await parseJson(response);

      if (!response.ok) {
        throw new Error(data.message || 'Nao foi possivel verificar o status do sistema.');
      }

      if (data.usersExist) {
        if (loginBox) {
          loginBox.classList.remove('hidden');
        }
        clearMessage();
      } else {
        window.location.replace('setup.html');
      }
    } catch (error) {
      showError(error.message || 'Nao foi possivel conectar ao servidor. Verifique se o back-end esta em execucao.');
    }
  };

  if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const username = document.getElementById('login-username')?.value || '';
      const password = document.getElementById('login-password')?.value || '';

      if (!username || !password) {
        showError('Informe usuario e senha.');
        return;
      }

      showNeutralMessage('Validando credenciais...');

      try {
        const response = await ApiClient.fetch('/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });

        const data = await parseJson(response);

        if (response.ok && data.success) {
          sessionStorage.setItem('userCargo', data.cargo);
          sessionStorage.setItem('username', data.username);

          if (loginMessage) {
            loginMessage.textContent = `${data.message} Redirecionando...`;
            loginMessage.style.color = 'green';
          }

          setTimeout(() => {
            window.location.href = './menu.html';
          }, 1200);
        } else {
          showError(data.message || 'Nao foi possivel realizar o login.');
        }
      } catch (error) {
        showError(error.message || 'Nao foi possivel conectar ao servidor.');
      }
    });
  }

  checkSystemStatus();
});
