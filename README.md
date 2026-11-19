# Vibe Afiações — Gestão de Oficinas

Aplicação web responsiva para centralizar clientes, serviços de afiação, materiais, despesas e prospecção comercial em uma única operação.

[**Acessar demonstração**](https://gestao-afiador.vercel.app)

![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?logo=supabase&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)

## Sobre o projeto

O Vibe Afiações nasceu para substituir controles espalhados por uma rotina digital simples, pensada principalmente para uso no celular. A aplicação acompanha o ciclo completo da oficina: cadastro do cliente, registro do serviço, geração do recibo, análise do resultado e busca de novas oportunidades comerciais.

## Principais funcionalidades

- **Dashboard financeiro:** lucro por dia, semana, mês ou ano, quantidade de serviços e indicadores operacionais.
- **Clientes:** contatos, endereços, observações, WhatsApp e alertas de retorno.
- **Ordens de serviço:** materiais, quantidades, valores, descontos, pagamento e histórico de alterações.
- **Recibos e relatórios:** geração de PDF, filtros por período e visão detalhada dos atendimentos.
- **Materiais e preços:** catálogo reutilizável durante o lançamento de uma afiação.
- **Despesas:** registro usado no cálculo do resultado financeiro.
- **Prospecção:** busca de estabelecimentos por atividade e cidade, com acesso ao WhatsApp e mapa.
- **Experiência mobile-first:** interface responsiva, tema claro/escuro e instalação como PWA.

## Arquitetura e decisões técnicas

- React com TypeScript e rotas protegidas.
- Supabase Auth e PostgreSQL com isolamento de dados por proprietário.
- React Query para cache e sincronização do estado remoto.
- React Hook Form + Zod para formulários tipados e validação.
- Recharts para indicadores e jsPDF para documentos.
- API de prospecção executada no servidor, usando Photon, OpenStreetMap e Overture Maps.
- Modo local com dados no navegador para desenvolvimento e testes sem dependência de credenciais externas.

## Stack

| Camada | Tecnologias |
| --- | --- |
| Interface | React, TypeScript, Tailwind CSS, Lucide |
| Estado e formulários | TanStack Query, React Hook Form, Zod |
| Backend e dados | Supabase, PostgreSQL, Python |
| Relatórios | jsPDF, Recharts |
| Build e deploy | Vite, Vercel |

## Executando localmente

```bash
git clone https://github.com/vitorgoetmann/gestao-afiador.git
cd gestao-afiador
npm install
npm run dev
```

Sem variáveis de ambiente, o projeto inicia em modo local e persiste os dados no navegador. Para usar o Supabase:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## Qualidade e segurança

O projeto inclui migrations com políticas de isolamento por usuário, validação de entrada, testes para a API de prospecção e build TypeScript como verificação de integridade.

## Autor

Desenvolvido por [Vitor Goetmann](https://github.com/vitorgoetmann).
