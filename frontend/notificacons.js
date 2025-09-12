function showToast(message, type = 'success') { // Define uma função chamada showToast que aceita uma mensagem e um tipo (com 'success' como padrão).
    // O comentário abaixo descreve o bloco de código que cria o contêiner para as notificações.
    let container = document.getElementById('toast-container'); // Procura no documento HTML um elemento com o ID 'toast-container' e o armazena na variável container.
    if (!container) { // Verifica se o contêiner não foi encontrado na página.
        container = document.createElement('div'); // Cria um novo elemento HTML <div> na memória.
        container.id = 'toast-container'; // Define o ID do novo elemento como 'toast-container'.
        container.className = 'toast-container'; // Define a classe CSS do novo elemento como 'toast-container'.
        document.body.appendChild(container); // Adiciona o contêiner recém-criado ao final do <body> do documento HTML.
    } // Fecha o bloco de código que cria o contêiner.


    // O comentário abaixo descreve a criação do elemento de notificação individual.
    const toast = document.createElement('div'); // Cria um novo elemento <div> que será a notificação (o "toast").
    toast.className = `toast ${type}`; // Define a classe do toast, combinando a classe base 'toast' com a classe do tipo ('success' ou 'error').
    toast.textContent = message; // Define o texto que aparecerá dentro da notificação como a mensagem recebida pela função.


    // O comentário abaixo descreve a ação de adicionar a notificação à tela.
    container.appendChild(toast); // Adiciona a notificação recém-criada como um filho do elemento contêiner.


    // O comentário abaixo descreve a remoção automática da notificação.
    setTimeout(() => { // Agenda a execução de uma função para acontecer após um determinado tempo.
        toast.remove(); // Remove o elemento da notificação do documento HTML.
    }, 4000); // Define o tempo de espera em 4000 milissegundos (4 segundos) antes de executar a remoção.
} // Fecha a definição da função showToast.
