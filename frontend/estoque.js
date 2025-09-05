// Meus amores o JavaScript e a parte funcional do nosso codigo 0w0
// ==== 🚀 NOVO: URL do nosso backend 🚀 ====
const BACKEND_URL = "http://localhost:3000/api";

// ==== Variável para armazenar os dados do estoque (temporariamente) ====
let categorias = [];

// ==== Seletores de Elementos HTML ====
const menuCategorias = document.getElementById("menu-categorias");
const areaProdutos = document.getElementById("area-produtos");
const form = document.getElementById("form-produto");
const campoBusca = document.getElementById("campo-busca");
const categoriaSelect = document.getElementById("categoria-select");
const subcategoriaSelect = document.getElementById("subcategoria-select");

// ==== Funções de Renderização e Exibição ====
function exibirProdutos(produtosParaExibir, tituloDaPagina, categoriaNome, subcategoriaNome) {
    areaProdutos.innerHTML = "";

    // ADICIONADO: Verifica se existe um nome de categoria para decidir se o botão Voltar deve ser exibido.
    // Isso evita que o botão apareça na tela de resultados da busca.
    if (categoriaNome) {
        const btnVoltar = document.createElement("button");
        btnVoltar.className = "btn-voltar";
        if (subcategoriaNome) {
            btnVoltar.textContent = "↩ Voltar para Subcategorias";
            btnVoltar.onclick = () => mostrarSubcategorias(categoriaNome);
        } else {
            btnVoltar.textContent = "↩ Voltar para Categorias";
            btnVoltar.onclick = () => mostrarCategorias();
        }
        areaProdutos.appendChild(btnVoltar);
    }

    // Título da página
    const titulo = document.createElement("h2");
    titulo.textContent = tituloDaPagina;
    areaProdutos.appendChild(titulo);

    if (!produtosParaExibir || produtosParaExibir.length === 0) {
        const aviso = document.createElement("p");
        aviso.textContent = "Sem produtos nesta categoria.";
        areaProdutos.appendChild(aviso);
        return;
    }

    // ==== essa parte mostra a lista de produtos ====
    produtosParaExibir.forEach(p => {
        const total = Object.values(p.tamanhos).reduce((soma, qtd) => soma + qtd, 0);
        const div = document.createElement("div");
        div.className = "produto";

        // Adiciona classes para alertas de estoque total
        if (total <= 10 && total > 0) {
            div.classList.add("alerta");
        } else if (total === 0) {
            div.classList.add("sem-estoque");
        }

        let tamanhosHTML = '';
        // Adiciona classes para alertas de estoque por tamanho
        for (const tamanho in p.tamanhos) {
            const qtdTamanho = p.tamanhos[tamanho];
            let classesAlerta = '';
            if (qtdTamanho <= 10 && qtdTamanho > 0) {
                classesAlerta = 'alerta-tamanho';
            } else if (qtdTamanho === 0) {
                classesAlerta = 'sem-estoque-tamanho';
            }
            tamanhosHTML += `
                <div class="tamanho-item ${classesAlerta}">
                    <span>${tamanho}: ${p.tamanhos[tamanho]}</span>
                    <button onclick="alterarQuantidade('${categoriaNome}', '${p.id}', 1, '${subcategoriaNome || ""}', '${tamanho}')">+</button>
                    <button onclick="alterarQuantidade('${categoriaNome}', '${p.id}', -1, '${subcategoriaNome || ""}', '${tamanho}')">-</button>
                </div>
            `;
        }

        // Adiciona o valor do produto
        const valorFormatado = p.valor ? `R$ ${p.valor.toFixed(2).replace('.', ',')}` : "Não definido";
        div.innerHTML = `
            <strong>${p.nome}</strong> (ID: ${p.id})<br>
            <em>${p.descricao}</em>
            <strong class="valor-produto">Valor: ${valorFormatado}</strong>
            <div class="area-tamanhos">${tamanhosHTML}</div>
            <strong class="total">Quantidade Total: ${total}</strong>
        `;
        areaProdutos.appendChild(div);
    });
}

// ==== Cria botões das categorias no menu ====
async function mostrarCategorias() {
    menuCategorias.innerHTML = "";
    campoBusca.value = "";
    areaProdutos.innerHTML = `
        <h2>Bem-vindo!</h2>
        <p>Carregando categorias...</p>
    `;

    try {
        // ==== 🚀 NOVO: Busca as categorias do backend 🚀 ====
        const response = await fetch(`${BACKEND_URL}/categorias`);
        if (!response.ok) {
            throw new Error('Erro ao carregar os dados do estoque.');
        }
        categorias = await response.json();
        categorias.sort((a, b) => a.nome.localeCompare(b.nome));

        areaProdutos.innerHTML = `
            <h2>Bem-vindo!</h2>
            <p>Selecione uma categoria para ver os produtos.</p>
        `;
        categorias.forEach(cat => {
            const btn = document.createElement("button");
            btn.textContent = cat.nome;
            btn.onclick = () => {
                if (cat.subcategorias) {
                    mostrarSubcategorias(cat.nome);
                } else {
                    mostrarProdutos(cat.nome);
                }
            };
            menuCategorias.appendChild(btn);
        });

        carregarCategoriasNoFormulario();

    } catch (error) {
        console.error('Falha ao carregar o estoque:', error);
        areaProdutos.innerHTML = `
            <h2>Erro</h2>
            <p>Não foi possível carregar o estoque. Por favor, verifique se o backend está rodando.</p>
        `;
    }
}

// ==== Mostra subcategorias exemplo feminino, masculino,Infantil feminina,Infantil masculino ====
function mostrarSubcategorias(categoriaNome) {
    const categoria = categorias.find(c => c.nome === categoriaNome);
    areaProdutos.innerHTML = "";

    const btnVoltar = document.createElement("button");
    btnVoltar.textContent = "↩ Voltar para Categorias";
    btnVoltar.className = "btn-voltar";
    btnVoltar.onclick = () => mostrarCategorias();
    areaProdutos.appendChild(btnVoltar);

    const h2 = document.createElement("h2");
    h2.textContent = categoriaNome;
    areaProdutos.appendChild(h2);

    const lista = document.createElement("div");
    lista.className = "lista-subcategorias";

    Object.keys(categoria.subcategorias).forEach(sub => {
        const btn = document.createElement("button");
        btn.textContent = sub;
        btn.onclick = () => mostrarProdutos(categoriaNome, sub);
        lista.appendChild(btn);
    });

    areaProdutos.appendChild(lista);
}

// ==== Mostra produtos da categoria (ou subcategoria) e importante pra gente conseguir visualizar
// se tirar isso n vai dar pra ver as categorias====
function mostrarProdutos(categoriaNome, subcategoriaNome = null) {
    const categoria = categorias.find(c => c.nome === categoriaNome);
    let produtos = [];

    if (subcategoriaNome && categoria.subcategorias) {
        produtos = categoria.subcategorias[subcategoriaNome] || [];
    } else if (categoria.produtos) {
        produtos = categoria.produtos;
    }

    const titulo = `${categoriaNome}${subcategoriaNome ? " - " + subcategoriaNome : ""}`;
    exibirProdutos(produtos, titulo, categoriaNome, subcategoriaNome);
}


// ==== Funções de Interação e Lógica do App ====
// ==== Evento para a barra de pesquisa ====
campoBusca.addEventListener("input", realizarBusca);

function realizarBusca() {
    const termo = campoBusca.value.trim().toLowerCase();

    if (termo === "") {
        mostrarCategorias();
        return;
    }

    let resultados = [];

    categorias.forEach(categoria => {
        if (categoria.subcategorias) {
            Object.keys(categoria.subcategorias).forEach(subcategoriaNome => {
                const produtosSub = categoria.subcategorias[subcategoriaNome];
                produtosSub.forEach(produto => {
                    if (
                        produto.nome.toLowerCase().includes(termo) ||
                        produto.id.toLowerCase().includes(termo) ||
                        produto.descricao.toLowerCase().includes(termo) ||
                        categoria.nome.toLowerCase().includes(termo) ||
                        subcategoriaNome.toLowerCase().includes(termo)
                    ) {
                        resultados.push({
                            categoria: categoria.nome,
                            subcategoria: subcategoriaNome,
                            produto: produto
                        });
                    }
                });
            });
        }
    });

    const produtosFormatados = resultados.map(item => item.produto);
    exibirProdutos(produtosFormatados, `Resultados para "${termo}" (${resultados.length} encontrados)`, null, null);
}

// ==== aqui e onde fica o codigo de alterar a quantidade de um produto ====
async function alterarQuantidade(catNome, prodId, delta, subcatNome = null, tamanho) {
    try {
        // ==== 🚀 NOVO: Envia a requisição para o backend 🚀 ====
        const response = await fetch(`${BACKEND_URL}/produtos/${prodId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                categoriaNome: catNome,
                subcategoriaNome: subcatNome,
                tamanho: tamanho,
                delta: delta
            })
        });

        if (!response.ok) {
            throw new Error('Falha ao atualizar a quantidade do produto.');
        }

        // Se a atualização for bem-sucedida, recarrega a página de produtos
        if (campoBusca.value.trim() !== "") {
            realizarBusca();
        } else {
            // Recarrega a categoria do backend para manter a consistência
            await mostrarCategorias();
            mostrarProdutos(catNome, subcatNome);
        }

    } catch (error) {
        console.error('Erro ao alterar a quantidade:', error);
        alert('Erro ao atualizar o estoque.');
    }
}

// ==== NOVO: Função para carregar as categorias no select do formulário ====
function carregarCategoriasNoFormulario() {
    categoriaSelect.innerHTML = '<option value="">Selecione a Categoria</option>';
    categorias.forEach(cat => {
        const option = document.createElement("option");
        option.value = cat.nome;
        option.textContent = cat.nome;
        categoriaSelect.appendChild(option);
    });
    // Adiciona uma opção para novas categorias
    const novaCategoriaOption = document.createElement("option");
    novaCategoriaOption.value = "nova-categoria";
    novaCategoriaOption.textContent = "Adicionar nova categoria";
    categoriaSelect.appendChild(novaCategoriaOption);
}

// ==== AQUI VAI O CODIGO NOVO PARA ATUALIZAR OS INPUTS DE TAMANHO ====
// Mudei o nome da função para ser mais clara
function atualizarCamposTamanho(categoriaNome) {
    const tamanhosInputsContainer = document.getElementById("tamanhos-inputs");
    tamanhosInputsContainer.innerHTML = ''; // Limpa os inputs antigos

    let tamanhos;
    if (categoriaNome === "Calçados") {
        tamanhos = Array.from({
            length: 10
        }, (_, i) => (34 + i).toString());
    } else {
        tamanhos = ["PP", "P", "M", "G", "GG"];
    }

    tamanhos.forEach(tamanho => {
        const div = document.createElement("div");
        div.className = "tamanho-input-item";

        const label = document.createElement("label");
        label.textContent = tamanho;
        label.setAttribute("for", `qtd-${tamanho}`);

        const input = document.createElement("input");
        input.type = "number";
        input.id = `qtd-${tamanho}`;
        input.name = `tamanhos[${tamanho}]`;
        input.min = "0";
        input.value = "0";

        div.appendChild(label);
        div.appendChild(input);
        tamanhosInputsContainer.appendChild(div);
    });
}
// ==== FIM DO CODIGO NOVO ====

// ==== Event Listeners e Inicialização ====
document.addEventListener("DOMContentLoaded", function() {
    mostrarCategorias();
});

// ==== NOVO: Evento para atualizar o select de subcategoria e o fieldset de tamanhos ====
categoriaSelect.addEventListener("change", (e) => {
    const categoriaNome = e.target.value;
    const categoria = categorias.find(c => c.nome === categoriaNome);

    subcategoriaSelect.innerHTML = '';
    subcategoriaSelect.style.display = 'none';

    const tamanhosInputsContainer = document.getElementById("tamanhos-inputs");
    tamanhosInputsContainer.innerHTML = '';

    if (categoria && categoria.subcategorias) {
        subcategoriaSelect.style.display = 'inline-block';
        Object.keys(categoria.subcategorias).forEach(sub => {
            const option = document.createElement("option");
            option.value = sub;
            option.textContent = sub;
            subcategoriaSelect.appendChild(option);
        });
        const novaSubcategoriaOption = document.createElement("option");
        novaSubcategoriaOption.value = "nova-subcategoria";
        novaSubcategoriaOption.textContent = "Adicionar nova subcategoria";
        subcategoriaSelect.appendChild(novaSubcategoriaOption);
    }

    atualizarCamposTamanho(categoriaNome);
});

// ==== aqui e onde fica o codigo para adicionar novo produto ====
form.addEventListener("submit", async e => {
    e.preventDefault();

    let catNome = document.getElementById("categoria-select").value.trim();
    let subcat = document.getElementById("subcategoria-select").value.trim();

    const id = document.getElementById("id").value.trim();
    const nome = document.getElementById("nome").value.trim();
    const descricao = document.getElementById("descricao").value.trim();
    const valor = parseFloat(document.getElementById("valor-produto").value.replace(',', '.')) || 0;

    let tamanhos = {};
    const inputsTamanho = document.getElementById("tamanhos-inputs").querySelectorAll("input");
    inputsTamanho.forEach(input => {
        const tamanho = input.id.replace('qtd-', '').toUpperCase();
        tamanhos[tamanho] = parseInt(input.value) || 0;
    });

    if (!catNome || !id || !nome || !descricao || valor <= 0) {
        alert("Por favor, preencha todos os campos obrigatórios, incluindo um valor válido para o produto.");
        return;
    };

    const novoProduto = {
        id,
        nome,
        descricao,
        valor,
        tamanhos
    };

    try {
        // ==== 🚀 NOVO: Envia o produto para o backend 🚀 ====
        const response = await fetch(`${BACKEND_URL}/produtos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                categoriaNome: catNome,
                subcategoriaNome: subcat,
                novoProduto: novoProduto
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Falha ao adicionar o produto.');
        }

        form.reset();
        await mostrarCategorias();
        alert('Produto cadastrado com sucesso!');
        mostrarProdutos(catNome, subcat || null);

    } catch (error) {
        console.error('Erro no cadastro:', error);
        alert(`Erro no cadastro: ${error.message}`);
    }
});
