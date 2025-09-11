document.addEventListener('DOMContentLoaded', () => { // Adiciona um "ouvinte" que espera todo o HTML da página carregar antes de executar o código dentro das chaves.


    // O comentário abaixo é um separador para organizar o código, indicando a seção de seleção de elementos.
    // O comentário abaixo descreve a finalidade do bloco de código seguinte.
    const loginBox = document.getElementById('login-box'); // Procura no HTML o elemento que tem o ID 'login-box' e guarda-o numa variável.
    const loginForm = document.getElementById('login-form'); // Procura no HTML o elemento do formulário que tem o ID 'login-form'.
    const loginMessage = document.getElementById('login-message'); // Procura no HTML o parágrafo que tem o ID 'login-message' para exibir mensagens.
    const API_URL = 'http://localhost:3000/api'; // Define uma constante com o endereço base do servidor (backend) para facilitar futuras manutenções.


    // O comentário abaixo é um separador para organizar o código, indicando a seção da função de verificação.
    // O comentário abaixo descreve a finalidade da função seguinte.
    const checkSystemStatus = async () => { // Declara uma função assíncrona (que pode usar 'await') para verificar o estado do sistema.
        try { // Inicia um bloco de código que pode gerar um erro (neste caso, a comunicação com o servidor).
            const response = await fetch(`${API_URL}/status`); // Faz uma requisição para a rota '/status' da API e espera (await) pela resposta.
            const data = await response.json(); // Espera a resposta do servidor chegar e a converte de texto JSON para um objeto JavaScript.
           
            if (data.usersExist) { // Verifica a propriedade 'usersExist' no objeto recebido do servidor.
                // O comentário abaixo descreve a finalidade do bloco 'if' seguinte.
                loginBox.classList.remove('hidden'); // Se existem utilizadores, remove a classe 'hidden' da caixa de login para a tornar visível.
            } else { // Caso a condição anterior seja falsa...
                // O comentário abaixo descreve a finalidade do bloco 'else' seguinte.
                window.location.href = './setup.html'; // Se não existem utilizadores, redireciona o navegador para a página de configuração inicial.
            } // Fecha o bloco 'else'.
        } catch (error) { // Captura qualquer erro que tenha ocorrido no bloco 'try' (ex: falha de rede).
            // O comentário abaixo descreve a finalidade do bloco 'catch' seguinte.
            document.body.innerHTML = '<h2 style="color: red; text-align: center;">Erro de Conexão</h2><p style="text-align: center;">Não foi possível conectar ao servidor. Verifique se o back-end está rodando e tente novamente.</p>'; // Substitui todo o conteúdo da página por uma mensagem de erro clara.
        } // Fecha o bloco 'catch'.
    }; // Fecha a declaração da função 'checkSystemStatus'.


    // O comentário abaixo é um separador para organizar o código, indicando a seção da lógica de login.
    // O comentário abaixo descreve a finalidade do bloco de código seguinte.
    loginForm.addEventListener('submit', async (e) => { // Adiciona um "ouvinte" que executa uma função assíncrona quando o formulário de login é enviado.
        e.preventDefault(); // Impede o comportamento padrão do formulário, que é recarregar a página.
       
        const username = document.getElementById('login-username').value; // Pega o valor (texto) digitado no campo de utilizador.
        const password = document.getElementById('login-password').value; // Pega o valor (texto) digitado no campo de senha.


        try { // Inicia um bloco de código que pode gerar um erro.
            const response = await fetch(`${API_URL}/login`, { // Faz uma requisição para a rota '/login' da API e espera (await) pela resposta.
                method: 'POST', // Define o método da requisição como POST, pois estamos a enviar dados.
                headers: { 'Content-Type': 'application/json' }, // Informa ao servidor que os dados no corpo da requisição estão no formato JSON.
                body: JSON.stringify({ username, password }), // Converte um objeto JavaScript com o utilizador e senha para o formato de texto JSON.
            }); // Fecha o objeto de configuração da requisição fetch.


            const data = await response.json(); // Espera a resposta do servidor chegar e a converte de texto JSON para um objeto JavaScript.


            if (data.success) { // Verifica se a propriedade 'success' na resposta do servidor é verdadeira.
                // O comentário abaixo descreve a finalidade do bloco 'if' seguinte.
                sessionStorage.setItem('userCargo', data.cargo); // Guarda o cargo do utilizador na memória da sessão do navegador.
                sessionStorage.setItem('username', data.username); // Guarda o nome de utilizador na memória da sessão do navegador.


                loginMessage.textContent = data.message + " Redirecionando..."; // Exibe a mensagem de sucesso do servidor no parágrafo de mensagens.
                loginMessage.style.color = 'green'; // Muda a cor do texto da mensagem para verde.


                // O comentário abaixo descreve a finalidade do bloco de código seguinte.
                setTimeout(() => { // Agenda a execução de uma função para depois de um certo tempo.
                    window.location.href = './menu.html'; // Redireciona o navegador do utilizador para a página do menu principal.
                }, 1500); // Define o tempo de espera para 1500 milissegundos (1.5 segundos).
            } else { // Caso a condição 'data.success' seja falsa...
                // O comentário abaixo descreve a finalidade do bloco 'else' seguinte.
                loginMessage.textContent = data.message; // Exibe a mensagem de erro vinda do servidor.
                loginMessage.style.color = 'red'; // Muda a cor do texto da mensagem para vermelho.
            } // Fecha o bloco 'else'.
        } catch (error) { // Captura qualquer erro que tenha ocorrido no bloco 'try'.
            loginMessage.textContent = 'Não foi possível conectar ao servidor.'; // Exibe uma mensagem de erro de conexão genérica.
            loginMessage.style.color = 'red'; // Muda a cor do texto da mensagem para vermelho.
        } // Fecha o bloco 'catch'.
    }); // Fecha o "ouvinte" de envio do formulário.


    // O comentário abaixo descreve a finalidade da linha seguinte.
    checkSystemStatus(); // Chama a função 'checkSystemStatus' para iniciar a verificação assim que o script é carregado.
}); // Fecha o "ouvinte" do 'DOMContentLoaded'.
