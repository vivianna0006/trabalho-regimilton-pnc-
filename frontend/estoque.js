// Constante que armazena a URL base do backend.
const BACKEND_URL = "http://localhost:3000";
// --- Estrutura de Dados ---

// Objeto que define as categorias e subcategorias disponíveis.
let categorias = [  // Declara uma variável chamada categorias e a inicializa como um array (uma lista).
    {
        nome: "Acessórios", // Dentro do objeto, essa linha define uma propriedade chamada nome com o valor "Acessórios". É o nome da sua categoria principal.
        subcategorias: { // Ele serve para agrupar as subcategorias da categoria "Acessórios".
            Feminino: [], // Dentro do objeto subcategorias, você tem duas propriedades: Feminino,Masculino,infantil feminina,infantil masculino,
            // O valor de cada uma é um array vazio ([]) pois  no código, a lista de produtos (os itens),
            // será carregada dinamicamente do seu backend (servidor).
            Masculino: [],
            "Infantil Feminina": [],
            "Infantil Masculina": []
        }
    },
    // a explicacao acima de repete para o restante das categorias e subcategorias.
    {
        nome: "Blusas",
        subcategorias: {
            "Feminina": [],
            Masculina: [],
            "Infantil Feminina": [],
            "Infantil Masculina": []
        }
    },
    {
        nome: "Bolsas",
        subcategorias: {
            Feminina: [],
            Masculina: [],
            "Infantil Feminina": [],
            "Infantil Masculina": []
        }
    },
    {
        nome: "Bonés",
        subcategorias: {
            Feminino: [],
            Masculino: []
        }
    },
    {
        nome: "Calçados",
        subcategorias: {
            Feminino: [],
            Masculino: [],
            "Infantil Feminino": [],
            "Infantil Masculino": []
        }
    },
    {
        nome: "Calças",
        subcategorias: {
            Feminina: [],
            Masculina: [],
            "Infantil Feminina": [],
            "Infantil Masculina": []
        }
    },
    {
        nome: "Cintos",
        subcategorias: {
            Feminino: [],
            Masculino: []
        }
    },
    {
        nome: "Cropped",
        subcategorias: {
            "Feminina": []
        }
    },
    {
        nome: "Saias",
        subcategorias: {
            Feminina: [],
            "Infantil Feminina": []
        }
    },
    {
        nome: "Shorts",
        subcategorias: {
            Feminino: [],
            Masculino: [],
            "Infantil Feminina": [],
            "Infantil Masculina": []
        }
    },
    {
        nome: "Vestidos",
        subcategorias: {
            Feminina: [],
            "Infantil Feminina": []
        }
    }
];

categorias.sort((a, b) => a.nome.localeCompare(b.nome)); // Ordena as categorias em ordem alfabética para exibição.

// --- Seletores de Elementos HTML ---

const menuCategorias = document.getElementById("menu-categorias"); // O código procura por um elemento HTML (como um <div> ou <nav>)
// que tenha o id="menu-categorias"
// e armazena uma referência para ele na variável menuCategorias.
const areaProdutos = document.getElementById("area-produtos"); // Procura pelo elemento com o id="area-produtos",
// que é a área onde os produtos serão exibidos, e o salva na variável areaProdutos.
const form = document.getElementById("form-produto"); // Encontra o formulário de cadastro de produtos (<form>) com o id="form-produto"
// e o armazena na variável form.
const campoBusca = document.getElementById("campo-busca");// Localiza o campo de entrada de texto (<input>) usado para a busca, com o id="campo-busca",
// e o salva na variável campoBusca.
const categoriaSelect = document.getElementById("categoria-select");// Identifica o menu suspenso (<select>) para a seleção de categorias,
// com o id="categoria-select", e o armazena em categoriaSelect.
const subcategoriaSelect = document.getElementById("subcategoria-select");//Faz o mesmo para o menu suspenso de subcategorias,
// com o id="subcategoria-select", e o salva em subcategoriaSelect.

// --- Funções de Renderização e Exibição ---
/**
 * Exibe a lista de produtos na interface, criando os elementos HTML dinamicamente.
 * @param {Array} produtosParaExibir - Lista de produtos a serem mostrados.
 * @param {string} tituloDaPagina - Título a ser exibido acima dos produtos.
 * @param {string} categoriaNome - Nome da categoria atual.
 * @param {string} subcategoriaNome - Nome da subcategoria (opcional).
 */

function exibirProdutos(produtosParaExibir, tituloDaPagina, categoriaNome, subcategoriaNome) {
    areaProdutos.innerHTML = "";  // produtosParaExibir: Uma lista (array) de objetos,
    // onde cada objeto representa um produto com suas informações.
    // tituloDaPagina: O título que será exibido no topo da lista.
    // categoriaNome: O nome da categoria a que os produtos pertencem.
    //subcategoriaNome: O nome da subcategoria, se houver.

    if (categoriaNome) { //if (categoriaNome): Verifica se a variável categoriaNome existe.
        // Se sim, significa que o usuário está navegando em uma categoria específica e
        // portanto, precisa de um botão para voltar.
        const btnVoltar = document.createElement("button"); //Cria um novo elemento de botão (para o usuario conseguir voltar).
        btnVoltar.className = "btn-voltar"; //Adiciona uma classe CSS ao botão para que ele possa ser estilizado.
        btnVoltar.textContent = "↩ Voltar"; // Define o texto que aparecerá dentro do botão.
        btnVoltar.onclick = subcategoriaNome ? () => mostrarSubcategorias(categoriaNome) : () => mostrarCategorias(); // Aqui se define o que acontece quando o botão é clicado.
        // O código usa uma operação ternária para decidir qual função chamar, por exemplo se usuario tiver na subcategorias(feminina,masculina etc..)
        // dai chama a função mostrarSubcategorias para voltar para a página de subcategorias, e
        // () => mostrarCategorias(): Caso contrário (se não houver subcategoria),
        // chama a função mostrarCategorias para voltar à lista principal de categorias.
        areaProdutos.appendChild(btnVoltar); //: Adiciona o botão criado dentro da área de produtos.
    }

    const titulo = document.createElement("h2"); //Cria um elemento de título de nível 2 (<h2>).
    titulo.textContent = tituloDaPagina; //Define o texto do título com o valor passado para a função.
    areaProdutos.appendChild(titulo); // Adiciona o título dentro da área de produtos, logo abaixo do botão "Voltar".

    if (!produtosParaExibir || produtosParaExibir.length === 0) { // Aqui verifica se a lista de produtos está vazia ou não existe.
        // O ! é o operador de negação, então !produtosParaExibir verifica se a variável é nula ou indefinida.
        const aviso = document.createElement("p"); // // Se a lista estiver vazia, o código cria um parágrafo (<p>),
        aviso.textContent = "Sem produtos nesta categoria.";// com a mensagem "Sem produtos nesta categoria."
        areaProdutos.appendChild(aviso);
        return; // Interrompe a execução da função, Como não há produtos para exibir, o restante do código não precisa ser executado.
    }

    produtosParaExibir.forEach(p => { // Inicia um loop que percorre cada produto na lista produtosParaExibir.
        // A variável p representa cada produto individualmente a cada iteração do loop.
        // Todo o código abaixo, até o final da função, será executado para cada produto.
        const total = Object.values(p.tamanhos).reduce((soma, qtd) => soma + qtd, 0); // Esta linha calcula o total de itens em estoque para um produto.
        //Object.values(p.tamanhos): Pega todos os valores do objeto p.
        // tamanhos que são as quantidades de cada tamanho, como G: 5, M: 8 Isso retorna uma lista como [5, 8].
        //.reduce((soma, qtd) => soma + qtd, 0): Soma todos os números dessa lista. E 0 é o valor inicial da soma.
        const div = document.createElement("div");//Cria um novo elemento div para conter as informações de um único produto.
        div.className = "produto"; //div.className = "produto";: Adiciona a classe CSS produto à div.

        if (total <= 10 && total > 0) { //Verifica a quantidade total de um produto. Se for menor ou igual a 10 e maior que 0.
            div.classList.add("alerta");// adiciona a classe alerta à div que muda a corde fundo,
            // se for entre 0 e 10 vai ficar amarelo, e se zerar vai ficar vermelho.
        } else if (total === 0) { // Se a quantidade total for igual a 0, adiciona a classe sem-estoque.
            div.classList.add("sem-estoque");
        }

        let tamanhosHTML = ''; // Cria uma variável vazia para guardar o HTML que será gerado para cada tamanho do produto.
        for (const tamanho in p.tamanhos) { //Inicia um loop que percorre cada chave (o nome do tamanho, como "P", "M", "G") dentro do objeto p.tamanhos.
            const qtdTamanho = p.tamanhos[tamanho]; //Pega a quantidade do tamanho atual.
            let classesAlerta = ''; //Verifica se a quantidade desse tamanho é baixa (<= 10) ou zero e, dependendo disso, define a variável classesAlerta.
            if (qtdTamanho <= 10 && qtdTamanho > 0) {
                classesAlerta = 'alerta-tamanho';
            } else if (qtdTamanho === 0) { // **CORRIGIDO**: A palavra-chave em português 'senão se' foi alterada para o correto 'else if'.
                classesAlerta = 'sem-estoque-tamanho';
            }
            //Adiciona o HTML de um novo div de tamanho à variável tamanhosHTML (linha 190).
            //O HTML inclui o nome do tamanho e sua quantidade (linha 191 ).
            //Os botões + e - possuem o atributo onclick, que chama a função alterarQuantidade (linha 192 a 194 )
            // passando todos os parâmetros necessários para identificar qual produto e qual tamanho devem ser alterados.
            tamanhosHTML += `
                <div class="tamanho-item ${classesAlerta}">
                    <span>${tamanho}: ${p.tamanhos[tamanho]}</span>
                    <button onclick="alterarQuantidade('${categoriaNome}', '${p.id}', 1, '${subcategoriaNome || ""}', '${tamanho}')">+</button>
                    <button onclick="alterarQuantidade('${categoriaNome}', '${p.id}', -1, '${subcategoriaNome || ""}', '${tamanho}')">-</button>
                </div>
            `;
        }

        const valorFormatado = p.valor ? `R$ ${p.valor.toFixed(2).replace('.', ',')}` : "Não definido"; // Verifica se o produto tem um valor.
        // Se sim, formata o valor para a moeda brasileira (R$ 10,00). Se não, define a mensagem "Não definido".
        // Logo abaixo define o conteúdo HTML de toda a div do produto. Esse código usa um template literal (as crases `)
        // para inserir as informações do produto, como nome, ID, descrição, o valor formatado
        // e o HTML dos tamanhos que foi gerado no loop anterior (${tamanhosHTML}).
        div.innerHTML = `
            <strong>${p.nome}</strong> (ID: ${p.id})<br>
            <em>${p.descricao}</em>
            <strong class="valor-produto">Valor: ${valorFormatado}</strong>
            <div class="area-tamanhos">${tamanhosHTML}</div>
            <strong class="total">Quantidade Total: ${total}</strong>
        `;
        areaProdutos.appendChild(div);  //areaProdutos.appendChild(div);: Adiciona a div completa de um produto na área de exibição principal, areaProdutos.
    });
}


// Mostra os botões de categoria no menu lateral.

function mostrarCategorias() { //exibir o menu principal com as categorias de produtos e, ao mesmo tempo, resetar a área de exibição para a tela inicial.
    menuCategorias.innerHTML = ""; //limpa o conteúdo do elemento HTML que representa o menu de categorias,
    // garantindo que o menu esteja "zerado" antes de ser preenchido com as novas opções.
    campoBusca.value = ""; //o valor do campo de busca é resetado para uma string vazia ("").
    // Isso evita que uma busca anterior continue visível quando o usuário retorna à tela principal.
    //Logo abaixo limpa a área principal onde os produtos são exibidos e a preenche com uma mensagem de boas-vindas.
    // Ela usa um template literal (as crases `) para inserir um título <h2> e um parágrafo <p>
    // que orientam o usuário a selecionar uma categoria no menu.
    areaProdutos.innerHTML = ` 
        <h2>Bem-vindo!</h2>
        <p>Selecione uma categoria para ver os produtos.</p>
    `;

    categorias.forEach(cat => { // inicia um loop que percorre cada item dentro da lista categorias,
        // para cada categoria ser encontrada, o código dentro das chaves será executado.
        // A variável cat representa o objeto da categoria atual (por exemplo, { nome: "Blusas", ... }).
        const btn = document.createElement("button");  //Para cada categoria, um novo elemento de botão é criado.
        btn.textContent = cat.nome; //O texto do botão é definido com o nome da categoria, como "Blusas".
        btn.onclick = () => { //O código verifica se a categoria atual (cat) possui a propriedade subcategorias.
            if (cat.subcategorias) { //Se a categoria tiver subcategorias, a função
                mostrarSubcategorias(cat.nome); // é chamada para exibir os botões dessas subcategorias.
            } else { //Se a categoria não tiver subcategorias, a função buscarEExibirProdutos é
                // chamada para carregar e exibir os produtos diretamente daquela categoria.
                buscarEExibirProdutos(cat.nome);
            }
        };
        menuCategorias.appendChild(btn); //Depois que o botão é criado e configurado,
        // esta linha o adiciona ao menu de categorias na página, tornando-o visível para o usuário.
    });
    // **REMOVIDO**: A chamada de função `carregarCategoriasNoFormulario()` foi removida porque não há uma definição para ela em seu código.
}

/**
 * Exibe a lista de subcategorias para uma categoria específica.
 *
 * @param {string} categoriaNome - O nome da categoria principal.
 */
function mostrarSubcategorias(categoriaNome) { // **CORRIGIDO**: A palavra-chave em português 'função' foi alterada para o correto 'function'.
    const categoria = categorias.find(c => c.nome === categoriaNome); // Ela procura, dentro da lista categorias,
    // o objeto de categoria cujo nome (c.nome) é igual ao categoriaNome,
    // O método .find() retorna o primeiro objeto que corresponde a essa condição, salvando-o na variável categoria.
    areaProdutos.innerHTML = ""; // Aqui, a área principal onde os produtos são mostrados é limpa, isso remove qualquer conteúdo anterior,
    // como a lista de produtos, deixando o espaço vazio para os botões das subcategorias.

    const btnVoltar = document.createElement("button"); // Cria um novo elemento de botão
    btnVoltar.textContent = "↩ Voltar para Categorias"; //Define o texto que aparecerá no botão.
    btnVoltar.className = "btn-voltar"; // Adiciona uma classe CSS ao botão, permitindo que ele seja estilizado.
    btnVoltar.onclick = () => mostrarCategorias(); // Essa linha define a ação do botão quando o usuário clica,
    // a função mostrarCategorias é chamada, levando-o de volta à tela inicial com a lista principal de categorias.
    areaProdutos.appendChild(btnVoltar); // Adiciona o botão criado à área principal da página.

    const h2 = document.createElement("h2"); //Cria um novo elemento de título de nível 2 (<h2>).
    h2.textContent = categoriaNome; //O texto do título é definido com o nome da categoria, como "Blusas",
    // para que o usuário saiba em qual categoria ele está navegando.
    areaProdutos.appendChild(h2); // Adiciona o título à página, logo abaixo do botão de voltar.

    const lista = document.createElement("div"); // Cria um novo elemento div que servirá como um contêiner para botões de subcategoria.
    lista.className = "lista-subcategorias"; // Adiciona uma classe CSS ao contêiner para que ele possa ser estilizado.

    Object.keys(categoria.subcategorias).forEach(sub => { // Acessa o objeto de subcategorias da categoria principal,
        // pega todas as chaves (os nomes) desse objeto de subcategorias, por exemplo: "Masculino", "Feminino", etc...
        // .forEach(sub => ...): Inicia um loop que executa o código dentro das chaves para cada nome de subcategoria.
        const btn = document.createElement("button"); // Dentro do loop, um novo botão é criado para cada subcategoria.
        btn.textContent = sub; // O texto do botão é definido com o nome da subcategoria, como "Masculino".
        btn.onclick = () => buscarEExibirProdutos(categoriaNome, sub);//Ao clicar a função buscarEExibirProdutos é chamada,
        // passando tanto o nome da categoria quanto o nome da subcategoria, para que ela possa carregar e exibir apenas os produtos corretos.
        lista.appendChild(btn); //Adiciona o botão de subcategoria ao contêiner lista.
    });

    areaProdutos.appendChild(lista);  //Finalmente, depois que todos os botões foram criados e adicionados ao contêiner lista,
    // o contêiner inteiro é adicionado à área principal da página, tornando todos os botões visíveis para o usuário.
}

// --- Funções de Comunicação com o Backend ---

/**
 * Busca produtos no backend e atualiza a exibição na página.
 *
 * @param {string} categoriaNome - A categoria para buscar.
 * @param {string} [subcategoriaNome=null] - Uma subcategoria (opcional).
 */
async function buscarEExibirProdutos(categoriaNome, subcategoriaNome = null) { // A palavra-chave async
    // indica que a função é assíncrona, Isso significa que ela pode executar operações demoradas (como buscar dados na internet)
    // sem travar a execução do restante do código.
    // (categoriaNome, subcategoriaNome = null): o nome da categoria é obrigatório, e o nome da subcategoria é opcional.
    // Se a subcategoria não for fornecida, seu valor padrão será null.
    //Logo abaixo na: areaProdutos.innerHTML = ` ela limpa a área de produtos e insere uma mensagem de "carregando".
    // Isso dá um feedback visual ao usuário enquanto os dados estão sendo buscados. A parte ${subcategoriaNome ? ' - ' + subcategoriaNome : ''}
    // é uma operação ternária que adiciona o nome da subcategoria (precedido por um traço) ao título apenas se ela existir.
    areaProdutos.innerHTML = ` // 
        <h2>Carregando produtos de ${categoriaNome}${subcategoriaNome ? ' - ' + subcategoriaNome : ''}...</h2>
    `;
    const url = `${BACKEND_URL}/produtos?categoria=${categoriaNome}${subcategoriaNome ? '&subcategoria=' + subcategoriaNome : ''}`;//Esta linha constrói
    // a URL completa que será usada para fazer a requisição ao servidor (backend).
    try { //Inicia um bloco de código que "tenta" executar uma operação. Se algo der errado (um erro acontecer), o controle passa para o bloco catch.
        const response = await fetch(url); //Essa é a linha que faz a requisição.
        if (!response.ok) { // **CORRIGIDO**: Foi removido o espaço extra entre '!' e 'response'. A propriedade .ok de uma resposta de busca é true se a solicitação foi bem-sucedida (código de status 200-299).
            // Se a resposta não for ok (por exemplo, um erro 404), esta condição é verdadeira.
            throw new Error('Erro ao buscar produtos do servidor.'); // Se a condição for verdadeira, um novo erro é "lançado".
            // Isso interrompe a execução do bloco try e move o código para o bloco catch.
        }
        const produtos = await response.json(); //Converte o corpo da resposta do response para um objeto JavaScript.
        // O await é usado novamente, pois essa conversão é um processo assíncrono. O resultado é salvo na variável produtos.
        exibirProdutos(produtos, `${categoriaNome}${subcategoriaNome ? ' - ' + subcategoriaNome : ''}`, categoriaNome, subcategoriaNome); //Chama a função exibirProdutos,
        // passando todos os dados necessários: a lista de produtos,
        // o título formatado e os nomes da categoria e subcategoria para o botão "voltar".
    } catch (error) { //Este bloco de código é executado se qualquer erro ocorrer no bloco try.
        console.error('Erro ao carregar produtos:', error); //Exibe o erro no console do navegador, o que é útil para depurar problemas.
        //Logo abaixo se um erro acontecer, o código atualiza a área de produtos com uma mensagem de erro "amigável" para o usuário,
        // ele ainda exibe o título da categoria/subcategoria, mas informa que a busca falhou.
        areaProdutos.innerHTML = ` 
            <h2>${categoriaNome}${subcategoriaNome ? ' - ' + subcategoriaNome : ''}</h2>
            <p>Ocorreu um erro ao carregar os produtos. Verifique sua conexão com o backend.</p>
        `;
    }
}

/**
 * Realiza uma busca de produtos no backend com base em um termo de pesquisa.
 */
async function realizarBusca() { // Pega o texto que o usuário digitou no campo de busca,
    const termo = campoBusca.value.trim().toLowerCase(); //remove quaisquer espaços em branco no início ou no fim do texto.
    // Isso evita que buscas como " camisa" causem problemas.
    //.toLowerCase(): Converte todo o texto para letras minúsculas. Isso garante que a busca não seja sensível a maiúsculas
    //e minúsculas, ou seja, buscar por "Camisa" ou "camisa" retorne os mesmos resultados.

    if (termo === "") { //Verifica se o termo de busca está vazio. Isso acontece se o usuário simplesmente apagar o texto e clicar em "buscar".
        mostrarCategorias(); //Se o termo for vazio, a função chama mostrarCategorias, que retorna a página para o estado inicial,
        // exibindo os botões das categorias.
        return; // Interrompe a execução da função aqui. Se o termo for vazio, não há necessidade de continuar com a busca.
    }

    try { // Inicia um bloco de código onde a busca será realizada. Se ocorrer algum erro, a execução é movida para o bloco catch.
        const response = await fetch(`${BACKEND_URL}/produtos/busca?termo=${termo}`); // Faz uma requisição assíncrona ao servidor (indicado por BACKEND_URL).
        //`${BACKEND_URL}/produtos/busca?termo=${termo}`: Constrói a URL para a busca. O termo de busca é adicionado como um parâmetro de consulta (?termo=...).
        if (!response.ok) { // Verifica se a resposta do servidor foi bem-sucedida (código de status 200-299).
            // Se a resposta não for ok, significa que algo deu errado no servidor (por exemplo, um erro 500).
            throw new Error('Erro na busca.');// Se a resposta não for ok, um erro é "lançado", e o código para o bloco catch.
        }
        const produtosEncontrados = await response.json(); //Converte o corpo da resposta, que está em formato JSON, para um objeto JavaScript.
        // A variável produtosEncontrados agora contém a lista de produtos que correspondem ao termo de busca.
        exibirProdutos(produtosEncontrados, `Resultados para "${termo}" (${produtosEncontrados.length} encontrados)`, null, null); //Chama a função
        // exibirProdutos para mostrar os resultados: produtosEncontrados: A lista de produtos retornada pelo servidor,`Resultados para
        // "${termo}" (...)`: Um título personalizado para a página de resultados. Ele mostra o termo de busca
        // e a quantidade de produtos encontrados,null, null: Os últimos dois argumentos são null porque, em uma busca,
        // não há uma categoria ou subcategoria específica para exibir no cabeçalho ou para o botão "voltar".
    } catch (error) { // Este bloco é executado se qualquer erro ocorrer durante a busca (por exemplo, falha na conexão de rede ou o erro lançado no try).
        console.error('Erro ao buscar produtos:', error); // Exibe o erro no console do navegador, o que é útil para depurar.
        areaProdutos.innerHTML = ` 
            <h2>Resultados da busca</h2>
            <p>Não foi possível realizar a busca. Tente novamente.</p>
        `; // atualiza a área de produtos com uma mensagem de erro amigável, informando ao usuário que a busca falhou.
    }
}

/**
 * Atualiza a quantidade de um produto específico no backend.
 *
 * @param {string} catNome - Nome da categoria.
 * @param {string} prodId - ID do produto.
 * @param {number} delta - A quantidade a ser adicionada ou removida (+1 ou -1).
 * @param {string} subcatNome - Nome da subcategoria (opcional).
 * @param {string} tamanho - O tamanho do produto.
 */
async function alterarQuantidade(catNome, prodId, delta, subcatNome = null, tamanho) { // A função `changeQuantity` foi renomeada para `alterarQuantidade` para coincidir com o nome usado no `onclick`. Os parâmetros também foram traduzidos para português para manter a consistência.
    // Indica que esta é uma função assíncrona,
    // Isso permite usar a palavra-chave await dentro dela para esperar que uma operação demorada (como uma requisição à rede)
    // termine antes de prosseguir.
    try { // Inicia um bloco de código onde as operações podem falhar. Se qualquer erro ocorrer aqui dentro,
        // a execução é interrompida e o controle é transferido para o bloco catch.
        const response = await fetch(`${BACKEND_URL}/produtos/${prodId}`, { //Faz uma requisição à API para atualizar o produto
            // o await faz com que o código espere a resposta do servidor. `${BACKEND_URL}/produtos/${prodId}`: Constrói a URL para
            // a requisição, ela usa o ID do produto para identificar o produto específico que será modificado.
            method: 'PUT', //Define o método HTTP da requisição como PUT. Esse método é usado para atualizar um recurso existente no servidor.
            headers: { //Informa ao servidor que o corpo da requisição será enviado em formato JSON.
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ //Contém os dados que serão enviados para o servidor,JSON.stringify(...): Converte o objeto JavaScript
                // em uma string JSON, que é o formato exigido pelo servidor. Ele inclui todas as informações necessárias para que o backend
                // saiba qual item alterar: a categoria, a subcategoria, o tamanho e a quantidade a ser adicionada (delta).
                categoriaNome: catNome,
                subcategoriaNome: subcatNome,
                tamanho: tamanho,
                delta: delta
            })
        });

        if (!response.ok) { 
            //Verifica se a resposta da requisição foi bem-sucedida (um status HTTP 200-299).
            // Se o status for de erro (por exemplo, 404 ou 500), a condição é verdadeira.
            throw new Error('Falha ao atualizar a quantidade no backend.'); // Se a resposta não for ok,
            // um erro é "lançado", o que faz o código parar e ir direto para o bloco catch.
        }

        if (campoBusca.value.trim() !== "") { //Checa se há um termo de busca no campo de busca.
            realizarBusca();// Se houver um termo de busca, a função realizarBusca()
            // é chamada novamente para recarregar os resultados da busca, refletindo a mudança na quantidade.
        } else { // Se o campo de busca estiver vazio, significa que o usuário está navegando por categorias.
            buscarEExibirProdutos(catNome, subcatNome); //Neste caso, a função buscarEExibirProdutos() é chamada
            // para recarregar os produtos da categoria/subcategoria atual, atualizando a exibição.
        }

    } catch (error) { //Este bloco é executado se qualquer erro ocorrer no bloco try, seja um erro de rede ou o erro que foi lançado manualmente.
        console.error('Erro ao sincronizar com o backend:', error); //Exibe o erro no console do navegador para fins de depuração.
        alert('Atenção: Não foi possível sincronizar com o servidor.'); //Exibe uma mensagem de alerta para o usuário, informando que a operação falhou.
    }
}

// --- Event Listeners e Início do Programa ---
// Este bloco estava com um erro de sintaxe e foi movido para fora das funções para ser executado
// quando a página estiver totalmente carregada.

document.addEventListener("DOMContentLoaded", () => {
    // Esta função exibe o menu de categorias e os botões
    // assim que a página carrega.
    mostrarCategorias();

    // Este listener garante que a busca funcione ao digitar
    campoBusca.addEventListener("input", realizarBusca);
});