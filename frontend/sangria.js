
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
