# Vibe Afiações

O Vibe Afiações ajuda oficinas de afiação a organizar clientes, serviços, materiais e finanças em um só lugar. A interface funciona em computadores e celulares.

## O que o sistema oferece

- **Dashboard:** acompanha faturamento por período, clientes, afiações, formas de pagamento e ferramentas mais atendidas. As despesas registradas entram no cálculo do saldo.
- **Clientes:** mantém contatos, endereços e observações, além de avisar quando chega o prazo de retorno definido para cada pessoa.
- **Materiais:** organiza os itens atendidos e seus preços padrão, que podem ser usados ao cadastrar uma afiação.
- **Afiações:** registra cliente, data, itens, quantidades, desconto, pagamento e observações. Os serviços podem ser consultados e editados depois, com opção de imprimir ou gerar recibo em PDF.
- **Relatórios:** reúne os serviços por período, cliente, ferramenta e forma de pagamento, com totais e valor médio.
- **Despesas:** registra gastos da oficina para acompanhar o resultado financeiro junto ao faturamento.
- **Encontrar clientes:** procura estabelecimentos por atividade e cidade e ajuda a iniciar o contato pelo WhatsApp.
- **Tema e conta:** permite alternar entre os temas claro e escuro e acessar ou encerrar a conta.

## Como funciona o buscador

O buscador recebe uma atividade, como “manicure” ou “pet shop”, e uma cidade brasileira no formato `Cidade, UF`. A quantidade escolhida define quantos resultados são mostrados por vez.

Ao iniciar a busca, o sistema confirma a sessão da conta e localiza os limites da cidade usando o Photon, um serviço de geocodificação baseado em dados abertos do OpenStreetMap. Em seguida, consulta os dados públicos de estabelecimentos da Overture Maps e procura os registros dentro dessa área. Os resultados são filtrados pela atividade e pelo nome ou categoria, estabelecimentos marcados como fechados são descartados, e possíveis duplicatas são removidas. Os mais relevantes aparecem primeiro.

Se houver mais resultados do que a quantidade exibida, **Mostrar novos resultados** apresenta a próxima leva sem repetir os que já apareceram naquela busca. Cada resultado pode incluir endereço, telefone, site, rede social e localização no mapa, conforme a disponibilidade dos dados. O botão do WhatsApp abre a conversa com o número encontrado e a mensagem configurada; `{empresa}` é substituído pelo nome do estabelecimento. Também é possível abrir uma pesquisa manual no Google Maps.

A busca automática não usa a API do Google Maps. A cobertura varia por cidade e atividade: dados públicos podem estar incompletos ou desatualizados, e a presença de um telefone não confirma que ele tenha WhatsApp. A busca funciona no servidor do sistema, que valida o acesso antes de consultar os serviços de mapas.

## Dados e privacidade

No uso com conta, clientes, afiações, materiais e despesas ficam associados ao usuário no Supabase, com isolamento entre contas. A mensagem do WhatsApp e os filtros dos relatórios são guardados no navegador. Os dados do buscador vêm da Overture Maps e a cidade é localizada pelo Photon.

Dados de estabelecimentos: [Overture Maps](https://docs.overturemaps.org/attribution/).
