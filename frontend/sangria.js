document.addEventListener('DOMContentLoaded', () => { // Adiciona um "ouvinte" que espera todo o HTML da página carregar antes de executar o código dentro das chaves.
    // O comentário abaixo é um separador para organizar o código, indicando a seção de segurança.
    // O comentário abaixo descreve a finalidade do bloco de código seguinte.
    const userCargo = sessionStorage.getItem('userCargo'); // Pega o valor da chave 'userCargo' que foi guardado na memória da sessão do navegador durante o login.
    if (!userCargo) { // Verifica se a variável 'userCargo' está vazia, ou seja, se o utilizador não está logado.
        alert('Acesso negado. Por favor, faça o login primeiro.'); // Exibe uma caixa de alerta padrão do navegador com uma mensagem de acesso negado.
        window.location.href = './index.html'; // Redireciona o navegador do utilizador para a página de login 'index.html'.
        return; // Interrompe imediatamente a execução de todo o código dentro desta função.
    } // Fecha o bloco da condição 'if'.
    const isAdministrador = userCargo === 'Administrador'; // Compara o cargo do utilizador com 'Administrador' e guarda o resultado (verdadeiro/falso) na variável.
    const adminLink = document.getElementById('admin-link'); // Procura no HTML o elemento que tem o ID 'admin-link' e guarda-o numa variável.
    if (isAdministrador && adminLink) { adminLink.classList.remove('hidden'); } // Se for administrador e o link existir, remove a classe 'hidden' para o tornar visível.
    const sangriaLink = document.getElementById('sangria-link'); // Procura no HTML o elemento que tem o ID 'sangria-link'.
    if (isAdministrador && sangriaLink) { sangriaLink.classList.remove('hidden'); } // Se for administrador e o link existir, remove a classe 'hidden' para o tornar visível.
    const suprimentoLink = document.getElementById('suprimento-link'); // Procura no HTML o elemento que tem o ID 'suprimento-link'.
    if (isAdministrador && suprimentoLink) { suprimentoLink.classList.remove('hidden'); } // Se for administrador e o link existir, remove a classe 'hidden' para o tornar visível.
    const historicoLink = document.getElementById('historico-link'); // Procura no HTML o elemento que tem o ID 'historico-link'.
    if (isAdministrador && historicoLink) { historicoLink.classList.remove('hidden'); } // Se for administrador e o link existir, remove a classe 'hidden' para o tornar visível.
    const logoutBtn = document.getElementById('logout-btn-menu'); // Procura no HTML o botão que tem o ID 'logout-btn-menu'.
    if (logoutBtn) { // Verifica se o botão de logout foi efetivamente encontrado na página.
        logoutBtn.addEventListener('click', () => { // Adiciona um "ouvinte" que executa uma função quando o botão for clicado.
            if (confirm('Tem certeza que deseja sair?')) { // Exibe uma caixa de confirmação do navegador e verifica se o utilizador clicou em "OK".
                sessionStorage.removeItem('userCargo'); // Remove a informação 'userCargo' da memória da sessão do navegador.
                sessionStorage.removeItem('username'); // Remove a informação 'username' da memória da sessão do navegador.
                window.location.href = './index.html'; // Redireciona o navegador do utilizador para a página de login.
            } // Fecha o bloco da condição 'if' da confirmação.
        }); // Fecha a função do "ouvinte" de clique.
    } // Fecha o bloco 'if' que verifica a existência do botão.


    // O comentário abaixo é um separador para organizar o código, indicando a seção da lógica da sangria.
    const sangriaForm = document.getElementById('sangria-form'); // Procura no HTML o formulário que tem o ID 'sangria-form'.
    const valorInput = document.getElementById('sangria-valor'); // Procura no HTML o campo de texto que tem o ID 'sangria-valor'.


    // O comentário abaixo descreve a finalidade da função seguinte.
    const formatarMoeda = (valor) => { // Declara uma função chamada 'formatarMoeda' que recebe um valor (string) como argumento.
        // O comentário abaixo descreve a ação da linha seguinte.
        const apenasNumeros = valor.replace(/\D/g, ''); // Remove todos os caracteres que não são dígitos numéricos da string de valor.
        // O comentário abaixo descreve a ação da linha seguinte.
        const numeroComZeros = apenasNumeros.padStart(3, '0'); // Garante que a string tenha pelo menos 3 dígitos, adicionando '0' à esquerda se necessário.
        // O comentário abaixo descreve a ação da linha seguinte.
        const centavos = numeroComZeros.slice(-2); // Extrai os dois últimos dígitos da string para representar os centavos.
        // O comentário abaixo descreve a ação da linha seguinte.
        const inteiro = numeroComZeros.slice(0, -2); // Extrai todos os dígitos, exceto os dois últimos, para representar a parte inteira.
        // O comentário abaixo descreve a ação da linha seguinte.
        const inteiroFormatado = parseInt(inteiro, 10).toLocaleString('pt-BR'); // Converte a parte inteira para número e depois formata como uma string com separadores de milhar no padrão brasileiro.
       
        return `${inteiroFormatado},${centavos}`; // Retorna a string final formatada, juntando a parte inteira e os centavos com uma vírgula.
    }; // Fecha a declaração da função 'formatarMoeda'.


    // O comentário abaixo descreve a finalidade do bloco de código seguinte.
    valorInput.addEventListener('input', () => { // Adiciona um "ouvinte" que é acionado toda a vez que o utilizador digita algo no campo de valor.
        const valorFormatado = formatarMoeda(valorInput.value); // Chama a função de formatação com o valor atual do campo.
        valorInput.value = valorFormatado; // Atualiza o valor no campo de texto com o valor já formatado.
    }); // Fecha o "ouvinte" do campo de valor.


    // O comentário abaixo descreve a finalidade do bloco de código seguinte.
    sangriaForm.addEventListener('submit', async (e) => { // Adiciona um "ouvinte" que executa uma função assíncrona quando o formulário é enviado.
        e.preventDefault(); // Impede o comportamento padrão do formulário, que é recarregar a página.


        const valor = valorInput.value; // Pega o valor atual (já formatado) do campo de texto.
        const motivo = document.getElementById('sangria-motivo').value; // Pega o texto digitado no campo de motivo da sangria.
        const utilizador = sessionStorage.getItem('username'); // Pega o nome do utilizador logado que foi guardado na memória da sessão.


        // O comentário abaixo descreve a finalidade do bloco 'if' seguinte.
        if (!utilizador) { // Verifica se não foi encontrado um nome de utilizador na sessão.
            showToast('Erro: Utilizador não identificado. Por favor, faça logout e login novamente.', 'error'); // Mostra uma notificação de erro informando sobre o problema de autenticação.
            return; // Interrompe a execução da função se o utilizador não for encontrado.
        } // Fecha o bloco 'if' de validação do utilizador.


        // O comentário abaixo explica a conversão de valor na linha seguinte.
        const valorNumerico = parseFloat(valor.replace(/\./g, '').replace(',', '.')); // Converte a string de moeda (ex: "1.234,56") para um número (1234.56).


        if (isNaN(valorNumerico) || valorNumerico <= 0) { // Verifica se o valor não é um número válido (isNaN) ou se é menor ou igual a zero.
            showToast('Por favor, insira um valor válido para a sangria.', 'error'); // Chama a função para mostrar uma notificação de erro se o valor for inválido.
            return; // Interrompe a execução da função se o valor for inválido.
        } // Fecha o bloco 'if' de validação do valor.


        const transacao = { // Cria um objeto JavaScript para guardar os dados da transação.
            type: 'sangria', // Define o tipo da transação.
            amount: valorNumerico, // Guarda o valor numérico da transação.
            reason: motivo, // Guarda o motivo da transação.
            user: utilizador // Guarda o nome do utilizador que realizou a transação.
        }; // Fecha a criação do objeto 'transacao'.


        try { // Inicia um bloco de código que pode gerar um erro (neste caso, a comunicação com o servidor).
            const response = await fetch('http://localhost:3000/api/sangria', { // Faz uma requisição para o endereço da API de sangria e espera (await) a resposta.
                method: 'POST', // Define o método da requisição como POST (para enviar dados).
                headers: { 'Content-Type': 'application/json' }, // Informa ao servidor que os dados enviados estão no formato JSON.
                body: JSON.stringify(transacao) // Converte o objeto 'transacao' para o formato de texto JSON para ser enviado.
            }); // Fecha o objeto de configuração da requisição fetch.


            const data = await response.json(); // Espera a resposta do servidor chegar e a converte de texto JSON para um objeto JavaScript.
            if (!response.ok) throw new Error(data.message); // Se a resposta do servidor indicar um erro, lança uma exceção com a mensagem vinda do servidor.


            showToast('Sangria registada com sucesso!'); // Se tudo correu bem, mostra uma notificação de sucesso.
            sangriaForm.reset(); // Limpa todos os campos do formulário.


        } catch (error) { // Captura qualquer erro que tenha ocorrido no bloco 'try' (seja de rede ou lançado pela linha 'throw').
            showToast(error.message || 'Erro ao registar a sangria.', 'error'); // Mostra a mensagem do erro capturado ou uma mensagem padrão.
        } // Fecha o bloco 'catch'.
    }); // Fecha o "ouvinte" de envio do formulário.
}); // Fecha o "ouvinte" do 'DOMContentLoaded'.
