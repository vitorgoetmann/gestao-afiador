# Gestão Afiador
Plataforma de gerenciamento operacional e financeiro exclusiva para oficinas e profissionais de afiação de ferramentas.

## Sobre o Projeto
O Gestão Afiador é um sistema web desenvolvido para digitalizar o fluxo de trabalho de afiadores. A aplicação centraliza o registro de todos os serviços realizados (afiações), o cadastro e histórico de clientes, além de fornecer um painel com métricas atualizadas de faturamento e volume de serviços.

## Contexto e Problema Resolvido
Este projeto existe para eliminar a desorganização e a perda de informações causadas pelo uso de controles manuais e anotações em papel. A principal dor que ele resolve é a dificuldade do afiador em rastrear quais ferramentas foram afiadas para quais clientes, além de simplificar o controle financeiro de pagamentos pendentes e concluídos.

## Arquitetura e Tecnologias
* **React e TypeScript**: Construção de interface de usuário estruturada com tipagem estática, garantindo manutenção segura do código.
* **Vite**: Build tool responsável pelo ambiente de desenvolvimento ágil e empacotamento otimizado.
* **Tailwind CSS**: Estilização baseada em utilitários para consistência de design e responsividade.
* **Supabase**: Provedor de Backend as a Service (BaaS) responsável pela persistência de dados relacionais e gerenciamento de sessões.
* **TanStack Query (React Query)**: Camada de gerenciamento de estado assíncrono e cache de dados.
* **Recharts**: Biblioteca para renderização de gráficos operacionais no painel de controle.

## Diferenciais
* **Gestão de Estado Otimizada**: Integração do React Query para reduzir requisições redundantes ao Supabase e proporcionar navegação fluida.
* **Segurança e Validação**: Uso do Zod e React Hook Form para validação estrita de dados na entrada, prevenindo inconsistências no banco de dados.
* **Responsividade Híbrida**: Layout adaptável para uso tanto em terminais fixos (desktop) quanto em dispositivos móveis no chão de fábrica.

## Infraestrutura e Hospedagem
* **Frontend (Hospedagem)**: A aplicação está hospedada na **Vercel**, garantindo entrega contínua (CI/CD) e alta disponibilidade.
* **Backend (Banco de Dados)**: A infraestrutura de dados e autenticação é gerenciada pelo **Supabase**, operando com um banco de dados relacional (PostgreSQL).

## Status do Projeto
Em desenvolvimento (MVP).

## Telas do Sistema

### Dashboard
![Dashboard Desktop](docs/dashboard-noPC.png)
![Dashboard Mobile](docs/dashboard-noCELL.png)

### Gestão de Clientes
![Clientes Desktop](docs/clientes-noPC.png)
![Clientes Mobile](docs/clientes-noCELL.png)

### Histórico de Afiações e Relatórios
![Afiações Mobile](docs/afiacoes-noCELL.png)
![Relatórios Desktop](docs/relatorios-noPC.png)

## Licença
Este projeto possui direitos reservados ao seu autor.

## Início Rápido
```bash
npm install
cp .env.example .env
npm run dev
```
