<?php
// Caminho do arquivo JSON (ajuste se a pasta for diferente)
$arquivo = _DIR_ . "/database.json";

// Captura os dados do formulário
$username = $_POST['username'] ?? '';
$password = $_POST['password'] ?? '';
$cargo = $_POST['cargo'] ?? '';

// Verifica se não está vazio
if ($username && $password && $cargo) {
    // Lê o conteúdo atual do arquivo JSON
    if (file_exists($arquivo)) {
        $dados = json_decode(file_get_contents($arquivo), true);
    } else {
        $dados = [];
    }

    // Gera um hash da senha (mais seguro)
    $hash = password_hash($password, PASSWORD_DEFAULT);

    // Novo usuário
    $novoUsuario = [
        "username" => $username,
        "password" => $hash,
        "cargo" => $cargo
    ];

    // Adiciona no array
    $dados[] = $novoUsuario;

    // Salva de volta no arquivo JSON (com formatação bonita)
    file_put_contents($arquivo, json_encode($dados, JSON_PRETTY_PRINT));

    echo "Usuário cadastrado com sucesso!";
} else {
    echo "Preencha todos os campos!";
}
?>