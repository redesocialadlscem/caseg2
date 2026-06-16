thomasnrs@hotmail.com 'maconha123' 'Thomas Navarro'
lucasrodrigo1922@hotmail.com 'cajati2014' 'Lucas Carvalho'





Sistema de Interações Ao Vivo para Plataforma de Cursos de Segurança
Objetivo

Desenvolver um sistema de interações em tempo real integrado à sala de aula ao vivo (Jitsi) com dois objetivos simultâneos:

Aumentar o engajamento e aprendizado dos alunos.
Medir participação e atenção real durante a aula.

O sistema deve permitir que o professor prepare interações antes da aula e as dispare manualmente ou automaticamente durante a transmissão.

Conceito Geral

Durante a aula ao vivo, o professor poderá lançar atividades interativas que aparecem instantaneamente para todos os alunos conectados.

As interações devem funcionar como:

Ferramenta pedagógica.
Validação de atenção.
Registro de participação.
Evidência para certificação.

O aluno não deve precisar sair da aula para responder.

As atividades devem aparecer diretamente na interface da aula ao vivo.

Integração com Jitsi
Layout recomendado

Dividir a tela em:

┌───────────────────────────────┬──────────────┐
│                               │              │
│           JITSI               │ Interações   │
│                               │              │
│                               │              │
└───────────────────────────────┴──────────────┘

Alternativamente, permitir modo popup/modal para atividades obrigatórias.

Módulo de Criação de Interações

O professor deve possuir uma área chamada:

Banco de Interações

Onde pode criar, editar, duplicar, organizar e reutilizar atividades.

Categorias:

Quiz
Múltipla escolha
Verdadeiro ou Falso
Complete a frase
Digitação rápida
Palavra-chave
Imagem interativa
Clique na área correta
Ligue as colunas
Ordenação de passos
Simulação de ocorrência
Enquete
Presença relâmpago
Tipo 1 - Quiz

Campos:

Pergunta

Alternativa A
Alternativa B
Alternativa C
Alternativa D

Resposta Correta

Tempo Limite

Exibir:

Qual o primeiro procedimento ao identificar um princípio de incêndio?

○ Acionar alarme
○ Ignorar ocorrência
○ Registrar em sistema
○ Chamar visitante

Tempo: 20 segundos
Tipo 2 - Verdadeiro ou Falso

Exemplo:

O vigilante pode abandonar o posto sem autorização.

○ Verdadeiro
○ Falso
Tipo 3 - Complete a Frase

Exemplo:

O equipamento utilizado para combate inicial a incêndio é o ________.

Correção automática por palavras-chave.

Tipo 4 - Palavra-Chave

Objetivo:

Validar atenção.

Professor informa verbalmente uma palavra durante a aula.

Depois dispara:

Digite a palavra informada pelo instrutor.

Tempo:

10 a 30 segundos.

Tipo 5 - Presença Relâmpago

Objetivo:

Confirmar que o aluno está acompanhando.

Exemplo:

Clique no botão abaixo em até 10 segundos.

[CONFIRMAR PRESENÇA]

Registrar:

Quem respondeu.
Tempo de resposta.
Tipo 6 - Imagem Interativa

Professor envia uma imagem.

Pergunta:

Clique onde existe um risco de segurança.

O sistema registra coordenadas clicadas.

Comparar com áreas corretas configuradas pelo professor.

Exemplos:

Extintor bloqueado.
Saída de emergência obstruída.
Falta de EPI.
Pessoa em área restrita.
Tipo 7 - Ligue as Colunas

Exemplo:

Extintor → Combate a incêndio

Rádio → Comunicação

CFTV → Monitoramento

Interface drag-and-drop.

Tipo 8 - Ordene os Passos

Exemplo:

Organize corretamente o procedimento:

- Acionar alarme
- Identificar risco
- Evacuar local
- Informar responsáveis

Aluno reorganiza a sequência.

Tipo 9 - Simulação de Ocorrência

Principal funcionalidade da plataforma.

Exemplo:

🚨 OCORRÊNCIA

Visitante sem identificação tenta acessar área restrita.

O que fazer?

Opções:

Liberar acesso
Solicitar identificação
Ignorar
Acionar apoio

Após votação:

Exibir estatísticas.

Professor comenta a resposta correta.

Tipo 10 - Enquete

Sem resposta certa.

Exemplo:

Você já trabalhou em portaria?

○ Sim
○ Não

Mostrar resultados em tempo real.

Agendamento de Interações

Cada interação pode ser configurada como:

Manual

Professor escolhe quando disparar.

Automática

Disparar após:

5 minutos
15 minutos
30 minutos
45 minutos

Ou em horários específicos.

Painel do Professor

Durante a aula:

Interações da Aula

[LIBERAR]

Quiz #1
Quiz #2
Imagem #1
Simulação #1

Ao abrir:

Participantes:
95/110

Respondidas:
87

Pendentes:
8

Tempo médio:
5 segundos

Taxa de acerto:
78%

Atualização em tempo real via WebSocket.

Ranking de Participação

Criar sistema de pontuação.

Pontuação

Entrou na aula:

+10

Respondeu interação:

+5

Resposta correta:

+5

Resposta em menos de 5 segundos:

+3

Ignorou interação:

-10

Saiu da sala:

-5

Score de Atenção

Calcular automaticamente.

Exemplo:

Aluno: João Silva

Tempo conectado:
100%

Interações respondidas:
95%

Acertos:
88%

Tempo médio:
6 segundos

Score de Atenção:
91%
Dashboard Analítico

Após a aula gerar relatório.

Relatório da Turma
Participantes:
120

Interações aplicadas:
15

Taxa média de resposta:
93%

Taxa média de acerto:
84%

Tempo médio de resposta:
7 segundos
Relatório Individual
Aluno:
Carlos

Tempo conectado:
98%

Interações recebidas:
15

Respondidas:
14

Acertos:
12

Erros:
2

Score de atenção:
89%
Certificação

Permitir regras configuráveis.

Exemplo:

Presença mínima:
75%

Score de atenção mínimo:
70%

Interações respondidas:
80%

Caso não cumpra:

Certificado bloqueado.
Banco Reutilizável de Conteúdo

Permitir:

Duplicar interação.
Compartilhar entre cursos.
Organizar por categoria.
Organizar por disciplina.
Importar/exportar.

Exemplo:

Curso Vigilante

250 Quizzes
80 Simulações
120 Imagens
50 Ordenações
Requisitos Técnicos
Frontend: React/Next.js.
Atualização em tempo real via WebSocket.
Compatível com desktop e mobile.
Integração transparente com Jitsi.
Persistência de respostas.
Histórico completo.
Escalável para milhares de alunos simultâneos.
Tempo real inferior a 1 segundo entre disparo e exibição.
Sistema antifraude básico para impedir múltiplas respostas.
Diferencial da Plataforma

A plataforma não deve parecer um sistema de provas.

Ela deve transmitir a sensação de um Centro de Operações de Segurança, utilizando:

Alertas.
Ocorrências.
Simulações.
Decisões rápidas.
Cenários reais.

O aluno deve sentir que está participando ativamente da operação e não apenas assistindo a uma videoaula passiva. Isso aumenta retenção, engajamento e qualidade da aprendizagem, ao mesmo tempo em que gera métricas confiáveis de participação real.