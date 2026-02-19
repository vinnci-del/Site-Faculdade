---
description: Sincronizar alterações com GitHub e implantar no Vercel
---
Este workflow automatiza o envio das alterações para o repositório remoto.

1. Verifica se há um repositório remoto configurado.
// turbo
2. Adiciona todas as alterações.
`git add .`
// turbo
3. Faz o commit com uma mensagem descritiva.
`git commit -m "update: sincronização automática das atividades"`
// turbo
4. Envia para o branch principal.
`git push origin main`

*Nota: Certifique-se de que o repositório está conectado ao Vercel para que a atualização do site seja automática.*
