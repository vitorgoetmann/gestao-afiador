# Vibe Afiações

Sistema web para organizar o trabalho de uma oficina de afiação. Reúne clientes, materiais, serviços, recibos e controle financeiro em uma interface para computador e celular.

## Funcionalidades

- **Dashboard:** mostra faturamento por dia, semana, mês e ano, quantidade de clientes e serviços, formas de pagamento e ferramentas mais afiadas. As despesas entram no cálculo do saldo.
- **Clientes:** guarda telefone, endereço e observações. É possível definir um prazo de retorno em meses; quando ele vence, aparece um alerta que pode ser marcado como visto.
- **Materiais:** mantém os itens atendidos pela oficina e seus preços padrão. Esses valores preenchem os itens de uma nova afiação.
- **Afiações:** registra cliente, data, itens, quantidades, desconto, pagamento e observações. O histórico permite editar o serviço, imprimir o recibo ou gerar um PDF.
- **Relatórios:** filtra as afiações por período, cliente, ferramenta e forma de pagamento. Mostra quantidade de serviços, faturamento e valor médio do recorte escolhido.
- **Encontrar clientes:** pesquisa estabelecimentos por atividade e cidade brasileira no formato `Cidade, UF`. O limite escolhido define quantos resultados aparecem por vez. **Mostrar novos resultados** exibe outra leva dos estabelecimentos encontrados, sem repetir os anteriores durante a mesma busca. O botão de WhatsApp abre uma conversa com a mensagem configurada na tela; `{empresa}` insere o nome do estabelecimento. Quando disponíveis, também aparecem links para o mapa, site e rede social.
- **Configurações:** registra despesas, alterna o tema claro ou escuro e permite sair da conta.

A busca de estabelecimentos usa dados abertos da Overture Maps e localiza a cidade pelo Photon. O link **Pesquisar no Google Maps** abre uma pesquisa em outra aba; a busca automática não usa a API do Google. Telefones e outros dados podem estar ausentes ou desatualizados, e o sistema não confirma se um número possui WhatsApp. A mensagem de contato e os filtros de relatório ficam salvos no navegador.

## Como rodar

É preciso ter Node.js, Python e acesso à internet. Na raiz do projeto:

```bash
npm install
python -m venv .venv-leads
```

Instale a dependência da busca:

```powershell
# Windows
.\.venv-leads\Scripts\python.exe -m pip install -r requirements.txt
```

```bash
# Linux ou macOS
.venv-leads/bin/python -m pip install -r requirements.txt
```

Execute `npm run dev`. Sem variáveis de ambiente, o desenvolvimento usa dados de demonstração guardados no navegador. Para usar um projeto Supabase, copie `.env.example` para `.env` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`. Não coloque a chave `service_role` no frontend.

Para iniciar um banco novo, aplique as migrações de `supabase/migrations` na ordem numérica. Em produção, login, clientes, afiações, materiais e despesas usam o Supabase. Cada conta acessa seus próprios registros.

## Publicação

O frontend e a rota `/api/places` rodam na Vercel. Configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no projeto antes do build. A rota de busca valida a sessão no Supabase e usa a dependência Python de `requirements.txt`. O servidor precisa conseguir acessar Photon e Overture Maps.

Dados de estabelecimentos: [Overture Maps](https://docs.overturemaps.org/attribution/).
