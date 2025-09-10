function showToast(message, type = 'success') {
    // Procura se já existe um contêiner de notificações. Se não, cria um.
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    // Cria o elemento da notificação
    const toast = document.createElement('div');
    toast.className = `toast ${type}`; // Aplica a classe de estilo 'success' ou 'error'
    toast.textContent = message;

    // Adiciona a notificação ao contêiner
    container.appendChild(toast);

    // Remove a notificação da tela após a animação terminar (o tempo da animação é 4s)
    setTimeout(() => {
        toast.remove();
    }, 4000);
}
