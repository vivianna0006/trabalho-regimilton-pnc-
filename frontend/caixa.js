document.addEventListener('DOMContentLoaded', () => { // Adiciona um "ouvinte" que espera toda a página HTML carregar para então executar o código dentro desta função.
    const userCargo = sessionStorage.getItem('userCargo'); // Busca no armazenamento do navegador o valor salvo com a chave 'userCargo'.


    // A condicional abaixo verifica se o usuário está logado antes de continuar.
    if (!userCargo) { // Se a variável 'userCargo' for nula ou vazia (ou seja, o usuário não está logado)...
        alert('Acesso negado. Por favor, faça o login primeiro.'); // ...exibe uma caixa de alerta informando que o acesso foi negado.
        window.location.href = 'index.html'; // ...redireciona o usuário para a página de login 'index.html'.
        return; // ...interrompe a execução do script para impedir que o resto do código seja lido.
    } // Fecha o bloco da condicional 'if'.


    const isAdministrador = userCargo === 'Administrador'; // Cria uma variável booleana (true/false) que verifica se o cargo do usuário é 'Administrador'.


    // O bloco de código abaixo controla a visibilidade dos links do menu.
    const adminLink = document.getElementById('admin-link'); // Procura no HTML o elemento com o ID 'admin-link' e o armazena na variável.
    if (isAdministrador && adminLink) { adminLink.classList.remove('hidden'); } // Se o usuário for administrador e o link existir, remove a classe 'hidden' para torná-lo visível.
    const sangriaLink = document.getElementById('sangria-link'); // Procura no HTML o elemento com o ID 'sangria-link' e o armazena na variável.
    if (isAdministrador && sangriaLink) { sangriaLink.classList.remove('hidden'); } // Se for administrador e o link existir, remove a classe 'hidden' para torná-lo visível.
    const suprimentoLink = document.getElementById('suprimento-link'); // Procura no HTML o elemento com o ID 'suprimento-link' e o armazena na variável.
    if (isAdministrador && suprimentoLink) { suprimentoLink.classList.remove('hidden'); } // Se for administrador e o link existir, remove a classe 'hidden' para torná-lo visível.
    const historicoLink = document.getElementById('historico-link'); // Procura no HTML o elemento com o ID 'historico-link' e o armazena na variável.
    if (isAdministrador && historicoLink) { historicoLink.classList.remove('hidden'); } // Se for administrador e o link existir, remove a classe 'hidden' para torná-lo visível.


    const logoutBtn = document.getElementById('logout-btn-menu'); // Procura no HTML o botão de sair pelo seu ID.
    if (logoutBtn) { // Se o botão de sair existir...
        logoutBtn.addEventListener('click', () => { // ...adiciona um "ouvinte" que espera por um clique no botão.
            if (confirm('Tem certeza que deseja sair?')) { // Se o usuário clicar, exibe uma caixa de confirmação.
                sessionStorage.removeItem('userCargo'); // Se o usuário confirmar, remove o 'userCargo' do armazenamento do navegador.
                sessionStorage.removeItem('username'); // Remove também o 'username' do armazenamento.
                window.location.href = 'index.html'; // Redireciona o usuário para a página de login.
            } // Fecha o bloco 'if' da confirmação.
        }); // Fecha o "ouvinte" de evento de clique.
    } // Fecha o bloco 'if' que verifica a existência do botão.
    const activeLink = document.querySelector('.navbar-links a[href*="caixa.html"]'); // Procura por um link no menu que contenha "caixa.html" no seu 'href'.
    // O comentário abaixo descreve a ação da próxima linha de código.
    if (activeLink) { // Se o link da página atual for encontrado no menu...
        activeLink.classList.add('active'); // ...adiciona a classe 'active' a ele para destacá-lo visualmente.
    } // Fecha o bloco 'if' da verificação do link ativo.
    const buscaInput = document.getElementById('busca-produto'); // Armazena o campo de busca de produtos em uma variável.
    const listaProdutosDiv = document.getElementById('lista-produtos'); // Armazena o container da lista de resultados da busca em uma variável.
    const listaVendaDiv = document.getElementById('lista-venda'); // Armazena o container da lista de itens da venda atual em uma variável.
    const totalVendaEl = document.getElementById('total-venda'); // Armazena o elemento que exibe o total da venda em uma variável.
    const finalizarVendaBtn = document.getElementById('finalizar-venda-btn'); // Armazena o botão de finalizar venda em uma variável.
    const toastNotification = document.getElementById('toast-notification'); // Armazena o elemento de notificação (toast) em uma variável.
    const API_URL = 'http://localhost:3000/api'; // Define o endereço base do servidor (backend) em uma constante.


    let todosOsProdutos = []; // Cria uma lista (array) vazia para armazenar todos os produtos do estoque.
    let vendaAtual = []; // Cria uma lista (array) vazia para armazenar os itens da venda que está sendo realizada.


    const showToast = (message) => { // Define uma função chamada 'showToast' que recebe uma mensagem como parâmetro.
        if (!toastNotification) return; // Se o elemento de notificação não existir, interrompe a função.
        toastNotification.textContent = message; // Define o texto da notificação com a mensagem recebida.
        toastNotification.classList.add('show'); // Adiciona a classe 'show' para tornar a notificação visível com animação.
        const hideToast = () => { // Define uma função interna para esconder a notificação.
            toastNotification.classList.remove('show'); // Remove a classe 'show' para esconder a notificação com animação.
            window.removeEventListener('click', hideToast); // Remove o "ouvinte" de clique para não ficar acumulando.
        }; // Fecha a definição da função 'hideToast'.
        setTimeout(() => { // Aguarda um pequeno intervalo de tempo (100 milissegundos).
            window.addEventListener('click', hideToast, { once: true }); // Adiciona um "ouvinte" que esconde a notificação ao primeiro clique na tela.
        }, 100); // Define o tempo de espera.
        setTimeout(hideToast, 5000); // Define um tempo máximo de 5 segundos para a notificação sumir automaticamente.
    }; // Fecha a definição da função 'showToast'.


    // O comentário abaixo descreve a função assíncrona 'fetchProdutos'.
    const fetchProdutos = async () => { // Define uma função assíncrona (que pode esperar por operações) para buscar os produtos.
        try { // Inicia um bloco 'try' para tentar executar um código que pode gerar erro.
            const response = await fetch(`${API_URL}/products`); // Faz uma requisição ao servidor para a rota de produtos e aguarda a resposta.
            if (!response.ok) throw new Error(`Erro ${response.status}: Não foi possível buscar os produtos.`); // Se a resposta não for de sucesso, lança um erro.
            todosOsProdutos = await response.json(); // Se a resposta for sucesso, converte os dados para JSON e os guarda na variável 'todosOsProdutos'.
            renderizarProdutos([]); // Chama a função para renderizar a lista de produtos, passando uma lista vazia para começar.
        } catch (error) { // Inicia um bloco 'catch' para capturar qualquer erro que ocorra no 'try'.
            console.error("### ERRO AO BUSCAR PRODUTOS:", error); // Exibe o erro detalhado no console do navegador para depuração.
            showToast("ERRO: " + error.message, 'error'); // Exibe uma notificação de erro para o usuário.
        } // Fecha o bloco 'try...catch'.
    }; // Fecha a definição da função 'fetchProdutos'.


    // O comentário abaixo descreve a função 'renderizarProdutos'.
    const renderizarProdutos = (produtos) => { // Define uma função para exibir a lista de produtos na tela.
        listaProdutosDiv.innerHTML = ''; // Limpa completamente o conteúdo da área de resultados da busca.
        produtos.forEach(produto => { // Para cada produto na lista recebida...
            const produtoDiv = document.createElement('div'); // ...cria um novo elemento 'div' na memória.
            produtoDiv.className = 'item-produto'; // ...define a classe CSS deste novo 'div'.
            produtoDiv.innerHTML = `
                <span>${produto.name} (R$ ${produto.price.toFixed(2)})</span>
                <button class="add-btn" data-id="${produto.id}">Adicionar</button>
            `; // Define o conteúdo HTML interno do 'div' com o nome, preço e um botão de adicionar.
            listaProdutosDiv.appendChild(produtoDiv); // ...adiciona o 'div' recém-criado à página, dentro da área de resultados.
        }); // Fecha o laço 'forEach'.
    }; // Fecha a definição da função 'renderizarProdutos'.
    // O comentário abaixo descreve a função 'renderizarVenda'.
    const renderizarVenda = () => { // Define uma função para exibir os itens da venda atual e calcular o total.
        listaVendaDiv.innerHTML = ''; // Limpa completamente o conteúdo da área da venda atual.
        let total = 0; // Inicializa a variável para o cálculo do total da venda com o valor zero.
        vendaAtual.forEach((item, index) => { // Para cada item na lista 'vendaAtual'...
            const itemDiv = document.createElement('div'); // ...cria um novo elemento 'div' na memória.
            itemDiv.className = 'item-venda'; // ...define a classe CSS deste novo 'div'.
            itemDiv.innerHTML = `
                <span>${item.name} (R$ ${item.price.toFixed(2)})</span>
                <button class="remove-btn" data-index="${index}">Remover</button>
                `; // Define o conteúdo HTML interno do 'div' com o nome, preço e um botão de remover.
            listaVendaDiv.appendChild(itemDiv); // ...adiciona o 'div' recém-criado à página, dentro da área da venda.
            total += item.price; // ...soma o preço do item ao total da venda.
        }); // Fecha o laço 'forEach'.
        totalVendaEl.textContent = `Total: R$ ${total.toFixed(2)}`; // Atualiza o texto do elemento do total com o valor final formatado.
    }; // Fecha a definição da função 'renderizarVenda'.
    // O comentário abaixo descreve o "ouvinte" de evento para a busca.
    buscaInput.addEventListener('input', () => { // Adiciona um "ouvinte" que dispara a função toda vez que o usuário digita no campo de busca.
        const termoBusca = buscaInput.value.toLowerCase(); // Pega o texto digitado, converte para minúsculas para facilitar a comparação.
        if (termoBusca.length >= 2) { // Se o texto digitado tiver 2 ou mais caracteres...
            const produtosFiltrados = todosOsProdutos.filter(produto => // ...filtra a lista de 'todosOsProdutos'.
                produto.name.toLowerCase().includes(termoBusca) || // Mantém na lista os produtos cujo nome (em minúsculas) inclui o termo buscado.
                produto.id.includes(termoBusca) // Ou cujo ID inclui o termo buscado.
            ); // Fecha o filtro.
            renderizarProdutos(produtosFiltrados); // Chama a função para exibir na tela apenas os produtos filtrados.
        } else { // Caso contrário (se o texto tiver menos de 2 caracteres)...
            renderizarProdutos([]); // ...chama a função para limpar a lista de resultados da tela.
        } // Fecha o bloco 'if...else'.
    }); // Fecha o "ouvinte" de evento 'input'.


    // O comentário abaixo descreve o "ouvinte" para a tecla Enter.
    buscaInput.addEventListener('keydown', (event) => { // Adiciona um "ouvinte" que dispara a função quando uma tecla é pressionada no campo de busca.
        if (event.key === 'Enter') { // Se a tecla pressionada for 'Enter'...
            event.preventDefault(); // ...impede o comportamento padrão do navegador (como submeter um formulário).
            const primeiroBotao = listaProdutosDiv.querySelector('.add-btn'); // ...procura pelo primeiro botão "Adicionar" na lista de resultados.
            if (primeiroBotao) { // Se um botão for encontrado...
                primeiroBotao.click(); // ...simula um clique nesse botão.
            } // Fecha o 'if' que verifica a existência do botão.
        } // Fecha o 'if' que verifica a tecla pressionada.
    }); // Fecha o "ouvinte" de evento 'keydown'.


    // O comentário abaixo descreve o "ouvinte" para o clique em "Adicionar".
    listaProdutosDiv.addEventListener('click', (e) => { // Adiciona um "ouvinte" de clique na área de resultados da busca.
        if (e.target.classList.contains('add-btn')) { // Se o elemento clicado for um botão com a classe 'add-btn'...
            const produtoId = e.target.dataset.id; // ...pega o ID do produto armazenado no atributo 'data-id' do botão.
            const produtoParaAdicionar = todosOsProdutos.find(p => p.id === produtoId); // ...procura na lista completa pelo produto com aquele ID.
            if (produtoParaAdicionar) { // Se o produto for encontrado...
                vendaAtual.push(produtoParaAdicionar); // ...adiciona o produto à lista da 'vendaAtual'.
                renderizarVenda(); // ...atualiza a exibição da venda na tela.
                buscaInput.value = ''; // ...limpa o texto do campo de busca.
                renderizarProdutos([]); // ...limpa a lista de resultados da busca.
                buscaInput.focus(); // ...coloca o cursor de volta no campo de busca para a próxima pesquisa.
            } // Fecha o 'if' que verifica se o produto foi encontrado.
        } // Fecha o 'if' que verifica se o alvo do clique foi o botão.
    }); // Fecha o "ouvinte" de evento 'click'.


    // O comentário abaixo descreve o "ouvinte" para o clique em "Remover".
    listaVendaDiv.addEventListener('click', (e) => { // Adiciona um "ouvinte" de clique na área da venda atual.
        if (e.target.classList.contains('remove-btn')) { // Se o elemento clicado for um botão com a classe 'remove-btn'...
            const indexParaRemover = parseInt(e.target.dataset.index, 10); // ...pega o índice do item armazenado no 'data-index' do botão.
            vendaAtual.splice(indexParaRemover, 1); // ...remove 1 item da lista 'vendaAtual' na posição daquele índice.
            renderizarVenda(); // ...atualiza a exibição da venda na tela (já sem o item removido).
        } // Fecha o 'if' que verifica o alvo do clique.
    }); // Fecha o "ouvinte" de evento 'click'.


    finalizarVendaBtn.addEventListener('click', async () => { // Adiciona um "ouvinte" de clique assíncrono ao botão de finalizar venda.
        console.log("--- [Passo A] Botão 'Finalizar Venda' foi clicado. ---"); // Registra uma mensagem no console para depuração.


        if (vendaAtual.length === 0) { // Se a lista da venda atual estiver vazia...
            console.log("-> [Falha] A venda está vazia."); // ...registra uma mensagem de falha no console.
            showToast('Adicione pelo menos um produto para finalizar a venda.', 'error'); // ...exibe uma notificação de erro para o usuário.
            return; // ...interrompe a execução da função.
        } // Fecha o 'if' da verificação de venda vazia.
        const vendedor = sessionStorage.getItem('username'); // Pega o nome do usuário logado que foi salvo no armazenamento do navegador.
        const saleData = { items: vendaAtual, seller: vendedor }; // Cria um objeto com os itens da venda e o nome do vendedor.
        console.log("-> A preparar para enviar os seguintes dados:", saleData); // Registra no console os dados que serão enviados ao servidor.


        try { // Inicia um bloco 'try' para a comunicação com o servidor.
            console.log("-> A iniciar a requisição 'fetch' para /api/sales..."); // Registra o início da requisição no console.
            const response = await fetch(`${API_URL}/sales`, { // Faz a requisição para a rota de vendas e aguarda a resposta.
                method: 'POST', // Define o método da requisição como POST (para enviar dados).
                headers: { 'Content-Type': 'application/json' }, // Informa ao servidor que os dados estão no formato JSON.
                body: JSON.stringify(saleData) // Converte o objeto com os dados da venda para texto JSON e o envia.
            }); // Fecha o objeto de opções da requisição 'fetch'.
            console.log("-> Resposta do servidor recebida. Status:", response.status); // Registra o status da resposta do servidor no console.


            const data = await response.json(); // Converte a resposta do servidor para um objeto JavaScript e aguarda.
            if (!response.ok) { // Se a resposta do servidor não indicar sucesso...
                console.error("-> A resposta do servidor não foi 'ok'. Mensagem:", data.message); // ...registra a mensagem de erro no console.
                throw new Error(data.message || 'Ocorreu um erro no servidor.'); // ...lança um novo erro com a mensagem do servidor.
            } // Fecha o 'if' da verificação da resposta.


            console.log("-> SUCESSO! A chamar showToast."); // Registra uma mensagem de sucesso no console.
            showToast('Venda finalizada e registada com sucesso!'); // Exibe uma notificação de sucesso para o usuário.
            vendaAtual = []; // Limpa a lista de itens da venda atual.
            renderizarVenda(); // Atualiza a exibição da venda na tela, que agora aparecerá vazia.
        } catch (error) { // Inicia o bloco 'catch' para capturar qualquer erro na comunicação.
            console.error("### ERRO no bloco 'try/catch':", error); // Registra o erro detalhado no console.
            showToast(error.message, 'error'); // Exibe a mensagem de erro em uma notificação para o usuário.
        } // Fecha o bloco 'try...catch'.
    }); // Fecha o "ouvinte" de clique do botão de finalizar venda.


    // O comentário abaixo descreve a chamada inicial da função.
    fetchProdutos(); // Chama a função para buscar os produtos do estoque assim que o script é carregado.
}); // Fecha o "ouvinte" de evento 'DOMContentLoaded' que envolve todo o script.
