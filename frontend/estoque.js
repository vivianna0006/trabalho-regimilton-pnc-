// Constante que armazena a URL base do backend.
const BACKEND_URL = "http://localhost:3000";

// --- Estrutura de Dados e Selectores de Elementos ---
let categorias = [
    { nome: "Acessórios", subcategorias: { Feminino: [], Masculino: [], "Infantil Feminina": [], "Infantil Masculina": [] } },
    { nome: "Blusas", subcategorias: { "Feminina": [], Masculina: [], "Infantil Feminina": [], "Infantil Masculina": [] } },
    { nome: "Bolsas", subcategorias: { Feminina: [], Masculina: [], "Infantil Feminina": [], "Infantil Masculina": [] } },
    { nome: "Bonés", subcategorias: { Feminino: [], Masculino: [] } },
    { nome: "Calçados", subcategorias: { Feminino: [], Masculino: [], "Infantil Feminino": [], "Infantil Masculino": [] } },
    { nome: "Calças", subcategorias: { Feminina: [], Masculina: [], "Infantil Feminina": [], "Infantil Masculina": [] } },
    { nome: "Cintos", subcategorias: { Feminino: [], Masculino: [] } },
    { nome: "Cropped", subcategorias: { "Feminina": [] } },
    { nome: "Saias", subcategorias: { Feminina: [], "Infantil Feminina": [] } },
    { nome: "Shorts", subcategorias: { Feminino: [], Masculino: [], "Infantil Feminina": [], "Infantil Masculina": [] } },
    { nome: "Vestidos", subcategorias: { Feminina: [], "Infantil Feminina": [] } }
];

categorias.sort((a, b) => a.nome.localeCompare(b.nome));

const menuCategorias = document.getElementById("menu-categorias");
const areaProdutos = document.getElementById("area-produtos");
const form = document.getElementById("form-produto");
const campoBusca = document.getElementById("campo-busca");
const categoriaSelect = document.getElementById("categoria-select");
const subcategoriaSelect = document.getElementById("subcategoria-select");
const tamanhosInputs = document.getElementById('tamanhos-inputs');
const fieldsetTamanhos = document.getElementById('fieldset-tamanhos');

// --- Funções de Renderização e Exibição ---

function exibirProdutos(produtos, tituloDaPagina, categoriaNome, subcategoriaNome) {
    areaProdutos.innerHTML = "";

    if (categoriaNome) {
        const btnVoltar = document.createElement("button");
        btnVoltar.className = "btn-voltar";
        btnVoltar.textContent = "↩ Voltar";
        btnVoltar.onclick = subcategoriaNome ? () => mostrarSubcategorias(categoriaNome) : () => mostrarCategorias();
        areaProdutos.appendChild(btnVoltar);
    }

    const titulo = document.createElement("h2"); //Cria um elemento de título de nível 2 (<h2>).
    titulo.textContent = tituloDaPagina; //Define o texto do título com o valor passado para a função.
    areaProdutos.appendChild(titulo); // Adiciona o título dentro da área de produtos, logo abaixo do botão "Voltar".

    if (!produtos || produtos.length === 0) {
        const aviso = document.createElement("p");
        if (tituloDaPagina.startsWith("Resultados para")) {
            aviso.textContent = "Nenhum produto encontrado com este termo.";
        } else {
            aviso.textContent = "Nenhum produto encontrado nesta categoria.";
        }
        areaProdutos.appendChild(aviso);
        return; // Interrompe a execução da função, Como não há produtos para exibir, o restante do código não precisa ser executado.
    }

    produtos.forEach(p => {
        const total = Object.values(p.tamanhos).reduce((soma, qtd) => soma + qtd, 0);
        const div = document.createElement("div");
        div.className = `produto ${total <= 10 && total > 0 ? "alerta" : ""} ${total === 0 ? "sem-estoque" : ""}`;

        let tamanhosHTML = '';
        for (const tamanho in p.tamanhos) {
            const qtdTamanho = p.tamanhos[tamanho];
            const classesAlerta = qtdTamanho <= 10 && qtdTamanho > 0 ? 'alerta-tamanho' : (qtdTamanho === 0 ? 'sem-estoque-tamanho' : '');
            tamanhosHTML += `
                <div class="tamanho-item ${classesAlerta}">
                    <span>${tamanho}: ${qtdTamanho}</span>
                    <button onclick="alterarQuantidade('${p.categoriaNome}', '${p.id}', 1, '${p.subcategoriaNome || ""}', '${tamanho}')">+</button>
                    <button onclick="alterarQuantidade('${p.categoriaNome}', '${p.id}', -1, '${p.subcategoriaNome || ""}', '${tamanho}')">-</button>
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

function mostrarCategorias() {
    menuCategorias.innerHTML = "";
    campoBusca.value = "";
    areaProdutos.innerHTML = `
        <h2>Bem-vindo!</h2>
        <p>Selecione uma categoria para ver os produtos.</p>
    `;

    categorias.forEach(cat => {
        const btn = document.createElement("button");
        btn.textContent = cat.nome;
        btn.onclick = () => cat.subcategorias ? mostrarSubcategorias(cat.nome) : buscarEExibirProdutos(cat.nome);
        menuCategorias.appendChild(btn);
    });
}

function mostrarSubcategorias(categoriaNome) {
    const categoria = categorias.find(c => c.nome === categoriaNome);
    if (!categoria) return;

    areaProdutos.innerHTML = "";
    const btnVoltar = document.createElement("button");
    btnVoltar.textContent = "↩ Voltar para Categorias";
    btnVoltar.className = "btn-voltar";
    btnVoltar.onclick = () => mostrarCategorias();
    areaProdutos.appendChild(btnVoltar);

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

async function buscarEExibirProdutos(categoriaNome, subcategoriaNome = null) {
    areaProdutos.innerHTML = `<h2>Carregando produtos de ${categoriaNome}${subcategoriaNome ? ' - ' + subcategoriaNome : ''}...</h2>`;
    const url = `${BACKEND_URL}/produtos?categoria=${categoriaNome}${subcategoriaNome ? '&subcategoria=' + subcategoriaNome : ''}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Erro ao buscar produtos do servidor.');
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

// Variável para armazenar o timer do debounce
let searchTimer;

async function realizarBusca() {
    const termo = campoBusca.value.trim().toLowerCase();
    
    // Limpa o timer anterior para evitar buscas duplicadas
    clearTimeout(searchTimer);

    // Se o campo estiver vazio, retorna para a visualização de categorias
    if (termo === "") {
        mostrarCategorias();
        return;
    }

    // Define um novo timer para executar a busca após um pequeno atraso (ex: 300ms)
    searchTimer = setTimeout(async () => {
        areaProdutos.innerHTML = `<h2>Buscando por "${termo}"...</h2>`;

        try {
            const response = await fetch(`${BACKEND_URL}/produtos?termo=${termo}`);

            if (!response.ok) {
                throw new Error('Erro na busca.');
            }

            const produtosEncontrados = await response.json();
            exibirProdutos(produtosEncontrados, `Resultados para "${termo}"`, null, null);

        } catch (error) {
            console.error('Erro ao buscar produtos:', error);
            areaProdutos.innerHTML = `
                <h2>Resultados da busca</h2>
                <p>Não foi possível realizar a busca. Verifique sua conexão com o backend.</p>
            `;
        }
    }, 300); // <-- 300 milissegundos de atraso
}

async function alterarQuantidade(catNome, prodId, delta, subcatNome = null, tamanho) {
    try {
        const response = await fetch(`${BACKEND_URL}/produtos/${prodId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ categoriaNome: catNome, subcategoriaNome: subcatNome, tamanho: tamanho, delta: delta })
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
    } catch (error) {
        console.error('Erro ao sincronizar com o backend:', error);
        alert('Atenção: Não foi possível sincronizar com o servidor.');
    }
}

async function adicionarProduto(event) {
    event.preventDefault();

    const id = document.getElementById("id").value;
    const nome = document.getElementById("nome").value;
    const descricao = document.getElementById("descricao").value;
    const valor = parseFloat(document.getElementById("valor").value);
    const categoria = categoriaSelect.value;
    const subcategoria = subcategoriaSelect.value;

    const tamanhos = {};
    const inputsTamanho = tamanhosInputs.querySelectorAll('input[type="number"]');
    inputsTamanho.forEach(input => {
        tamanhos[input.name] = parseInt(input.value, 10);
    });

    if (categoria === "") {
        alert("Por favor, selecione uma categoria.");
        return;
    }

    const novoProduto = { id, nome, descricao, valor, categoriaNome: categoria, subcategoriaNome: subcategoria, tamanhos };

    try {
        const response = await fetch(`${BACKEND_URL}/produtos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(novoProduto)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Erro ao adicionar produto.');
        }

        const produtoCriado = await response.json();
        console.log("Produto adicionado:", produtoCriado);
        form.reset();
        alert("Produto adicionado com sucesso!");
        mostrarCategorias();
    } catch (error) {
        console.error('Erro ao adicionar produto:', error);
        alert(`Erro ao adicionar produto: ${error.message}`);
    }
}

// --- Funções para o Formulário de Cadastro ---

function carregarFormularioDeCategorias() {
    // Limpa os campos antes de preencher
    categoriaSelect.innerHTML = '';
    subcategoriaSelect.innerHTML = '';
    
    // Adiciona uma opção padrão em branco para evitar erros de seleção
    categoriaSelect.appendChild(new Option("Selecione uma Categoria", ""));
    subcategoriaSelect.appendChild(new Option("Selecione uma Subcategoria", ""));
    subcategoriaSelect.style.display = 'none'; // Esconde a subcategoria inicialmente

    // Preenche o menu de categorias com base no array 'categorias'
    categorias.forEach(categoria => {
        const option = new Option(categoria.nome, categoria.nome);
        categoriaSelect.appendChild(option);
    });
    
    // Lógica para gerar inputs de tamanho/calçado
    const gerarInputsDeTamanho = (tamanhos) => {
        tamanhosInputs.innerHTML = ''; // Limpa os inputs antigos
        tamanhos.forEach(tamanho => {
            const inputGroup = document.createElement('div');
            inputGroup.className = 'tamanho-input-group';
            inputGroup.innerHTML = `
                <label for="qtd-${tamanho}">${tamanho}:</label>
                <input type="number" id="qtd-${tamanho}" name="${tamanho}" value="0" min="0" required />
            `;
            tamanhosInputs.appendChild(inputGroup);
        });
        fieldsetTamanhos.style.display = 'block';
    };

    // Adiciona o 'listener' de evento para o menu de categoria.
    categoriaSelect.addEventListener('change', () => {
        const categoriaSelecionada = categoriaSelect.value;
        const categoriaObj = categorias.find(c => c.nome === categoriaSelecionada);

        // Oculta/mostra e preenche a subcategoria
        if (categoriaObj?.subcategorias) {
            subcategoriaSelect.style.display = 'inline-block';
            subcategoriaSelect.innerHTML = '<option value="">Selecione uma Subcategoria</option>';
            Object.keys(categoriaObj.subcategorias).forEach(sub => {
                subcategoriaSelect.appendChild(new Option(sub, sub));
            });
            // Preenche a subcategoria com a primeira opção (ou a padrão) e dispara o evento de 'change'
            subcategoriaSelect.value = Object.keys(categoriaObj.subcategorias)[0] || "";
            subcategoriaSelect.dispatchEvent(new Event('change'));
        } else {
            subcategoriaSelect.style.display = 'none';
            // Garante que o campo de tamanho seja exibido para categorias sem subcategoria
            toggleTamanhosVisibility();
        }
    });

    // Lógica para mostrar/esconder e gerar os inputs de tamanho
    const toggleTamanhosVisibility = () => {
        const categoriaSelecionada = categoriaSelect.value;
        
        if (!categoriaSelecionada) {
            fieldsetTamanhos.style.display = 'none';
            return;
        }

        switch(categoriaSelecionada) {
            case 'Calçados':
                const numerosCalcados = Array.from({ length: 12 }, (_, i) => 33 + i);
                gerarInputsDeTamanho(numerosCalcados);
                fieldsetTamanhos.querySelector('legend').textContent = 'Quantidade por Numeração';
                break;
            case 'Acessórios':
            case 'Bolsas':
            case 'Cintos':
            case 'Bonés':
                tamanhosInputs.innerHTML = '';
                fieldsetTamanhos.querySelector('legend').textContent = 'Sem Tamanhos';
                fieldsetTamanhos.style.display = 'block';
                break;
            default:
                const tamanhosRoupa = ['PP', 'P', 'M', 'G', 'GG'];
                gerarInputsDeTamanho(tamanhosRoupa);
                fieldsetTamanhos.querySelector('legend').textContent = 'Quantidade por Tamanho';
                break;
        }
    };

    // Adiciona o listener para o menu de subcategoria
    subcategoriaSelect.addEventListener('change', toggleTamanhosVisibility);
    
    // Inicia com o fieldset de tamanhos escondido
    fieldsetTamanhos.style.display = 'none';
}

// --- Inicialização e Event Listeners ---

document.addEventListener("DOMContentLoaded", () => {
    mostrarCategorias();
    carregarFormularioDeCategorias();
});

form.addEventListener('submit', adicionarProduto);

// Adiciona o listener para a busca em tempo real
campoBusca.addEventListener("input", realizarBusca);
