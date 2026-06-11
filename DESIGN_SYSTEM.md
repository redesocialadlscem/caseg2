# 🏗️ CASEG2 Design System: Neo-Brutalism Industrial Safety

> **Versão:** 1.0.0  
> **Stack:** React 19 + Tailwind CSS 4.x + Lucide React  
> **Conceito:** Segurança industrial, robustez, clareza absoluta e funcionalidade sem ornamentos desnecessários.

Este documento é a **fonte única de verdade visual** para o projeto CASEG2. Qualquer implementação frontend deve seguir estritamente estas diretrizes para garantir consistência, acessibilidade e a identidade "Industrial Safety".

---

## 0. 🎨 Design Tokens Globais

Os tokens são definidos via `@theme` no `src/client/styles.css` (Tailwind v4). Nunca use valores hexadecimais ou pixels soltos no código; use sempre as classes utilitárias ou variáveis CSS.

### Paleta de Cores

| Token | Valor Hex | Classe Tailwind | Uso Obrigatório |
| :--- | :--- | :--- | :--- |
| **Brand** | `#166534` | `bg-brand`, `text-brand` | Botões primários, links ativos, ícones de destaque, badges de progresso. |
| **Brand Light** | `#22c55e` | `bg-brand-light` | Estados de hover em elementos brand, feedbacks de sucesso. |
| **Ink** | `#000000` | `border-black`, `text-black` | **Todas** as bordas de elementos interativos, textos principais, sombras. |
| **Surface** | `#FFFFFF` | `bg-surface`, `bg-white` | Fundos de cards, inputs, modais e página principal. |
| **Stats BG** | `#ECFDF5` | `bg-emerald-50` | Fundo exclusivo da seção de estatísticas/métricas. |
| **Footer BG** | `#111827` | `bg-gray-900` | Fundo do rodapé institucional. |
| **Danger** | `#DC2626` | `bg-red-600` | Ações destrutivas, erros de validação, alertas críticos. |

> ⚠️ **REGRA DE OURO:** Zero gradientes. Zero glassmorphism. Zero transparências decorativas. A estética é plana, sólida e de alto contraste.

### Tipografia

A hierarquia visual é estabelecida pelo peso e tamanho, não por cores diferentes nos títulos.

| Nível | Fonte | Peso | Tamanho (clamp) | Tracking | Uso |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **H1** | Space Grotesk | Bold (700) | `text-4xl md:text-6xl` | `-0.02em` | Hero sections, títulos de página principal. |
| **H2** | Space Grotesk | Bold (700) | `text-3xl md:text-4xl` | `-0.02em` | Seções, headers de cards grandes. |
| **H3** | Space Grotesk | Bold (700) | `text-xl md:text-2xl` | `-0.01em` | Títulos de cards, subtítulos de seção. |
| **Body** | Inter | Regular (400) | `text-base md:text-lg` | `normal` | Parágrafos, descrições, conteúdo longo. |
| **Label** | Inter | Medium (500) | `text-sm uppercase` | `wide` | Labels de input, badges, captions, botões. |

### Espaçamento & Bordas

-   **Grid Base:** Múltiplos de 4px (`p-4`, `gap-6`, `mt-8`).
-   **Borda Padrão:** `border-2 border-black` (Classe utilitária: `.brutal-border`).
-   **Border Radius:** `rounded-xl` (12px) para todos os containers interativos (botões, cards, inputs). Evite cantos totalmente quadrados (muito agressivo) ou muito redondos (muito suave).
-   **Sombras:** Sempre duras, sem blur.
    -   Default: `shadow-brutal` → `4px 4px 0px 0px #000`
    -   Hover: `6px 6px 0px 0px #000` + `translate(-2px, -2px)`
    -   Active/Pressed: `0px 0px 0px 0px #000` + `translate(2px, 2px)`
    -   Small (ícones/badges): `shadow-brutal-sm` → `2px 2px 0px 0px #000`

---

## 1. 🧩 Catálogo de Componentes Base

Todos os componentes devem usar as classes utilitárias `.brutal-border`, `.brutal-shadow` e `.brutal-interactive` quando aplicável.

### PrimaryButton
O elemento mais importante da interface. Transmite ação e segurança.

```tsx
// Exemplo de uso das classes
<button className="
  bg-brand text-white 
  font-display font-bold uppercase tracking-wide 
  px-6 py-3 rounded-xl 
  border-2 border-black 
  shadow-brutal brutal-interactive
  hover:bg-brand-light
  disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none
">
  Explorar Cursos
</button>
```

**Variantes:**
-   **Solid (Primary):** `bg-brand text-white`
-   **Outline (Secondary):** `bg-white text-black hover:bg-gray-50`
-   **Danger:** `bg-red-600 text-white hover:bg-red-700`
-   **Dark:** `bg-black text-white hover:bg-gray-800`

### Input Fields
Campos de formulário devem ser claros e ter feedback de erro visível.

-   **Container:** `bg-white border-2 border-black rounded-xl px-4 py-3 w-full`
-   **Focus:** `focus:outline-none focus:ring-4 focus:ring-brand/30 focus:border-brand` (Anel externo suave + borda colorida)
-   **Error State:** `border-red-600 focus:ring-red-600/30` + mensagem de erro abaixo em `text-red-600 text-sm font-medium mt-1`
-   **Label:** Sempre acima do input, `font-bold uppercase text-xs tracking-wide mb-2 block`

### Cards
Containers genéricos para agrupar conteúdo.

-   **Default:** `bg-white border-2 border-black rounded-xl shadow-brutal p-6`
-   **Accent:** `bg-emerald-50 border-2 border-black rounded-xl shadow-brutal p-6` (Para destaques sutis)
-   **Interactive:** Adicione `.brutal-interactive` se o card for clicável (ex: CourseCard).

### Badges & Tags
Pequenos indicadores de status ou categoria.

-   **Estilo:** `inline-flex items-center px-3 py-1 rounded-lg border-2 border-black text-xs font-bold uppercase tracking-wide shadow-brutal-sm`
-   **Cores:** Fundo branco com texto preto (neutro), fundo brand com texto branco (ativo/sucesso), fundo amarelo com texto preto (aviso).

### Ícones (Lucide React)
Use exclusivamente a biblioteca `lucide-react`. Mantenha `strokeWidth={2.5}` para consistência visual com as bordas grossas.

| Contexto | Ícones Recomendados |
| :--- | :--- |
| Segurança/Auth | `Shield`, `Lock`, `KeyRound`, `Eye`, `EyeOff` |
| Cursos/Aprendizado | `BookOpen`, `GraduationCap`, `Clock`, `Layers`, `PlayCircle` |
| Usuário/Social | `User`, `Users`, `Award`, `BadgeCheck` |
| Navegação/UI | `Menu`, `X`, `ChevronRight`, `Search`, `Filter`, `MoreVertical` |
| Feedback | `CheckCircle2`, `AlertTriangle`, `Info`, `Loader2` |

---

## 2. 📐 Layouts e Padrões de Página

### Header Público
-   **Desktop:** Sticky top-0, z-50, bg-white, border-b-2 border-black. Grid 3 colunas: Logo (esq), Nav Links (centro), Auth Buttons (dir).
-   **Mobile (<640px):** Logo (esq), Hamburger Menu (dir). Menu abre dropdown vertical full-width com borda inferior preta.
-   **Altura Fixa:** `h-20` (80px) para alinhar com a grid base.

### Sidebar Dashboard
-   **Desktop Expandida:** `w-64` fixa à esquerda, border-r-2 border-black, bg-white. Logo topo, nav vertical, user profile bottom.
-   **Desktop Compacta:** `w-20` apenas ícones + tooltip.
-   **Mobile:** Drawer off-canvas à esquerda, overlay escuro ao abrir.
-   **Item Ativo:** `bg-brand text-white shadow-brutal-sm translate-x-1` (feedback tátil lateral).

### Grid Systems
Use CSS Grid nativo com classes responsivas:
-   **Stats/Diferenciais:** `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6`
-   **Cursos:** `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8`
-   **Formulários:** Max-width `max-w-md mx-auto` para login/register; `max-w-2xl` para formulários complexos.

### Footer
-   **BG:** `bg-gray-900 text-white`
-   **Borda Topo:** `border-t-4 border-brand` (detalhe industrial)
-   **Layout:** 4 colunas desktop, stack mobile.
-   **Links:** `hover:text-brand transition-colors` (sem sublinhado, cor como feedback).

---

## 3. 🚦 Regras de Ouro do Neo-Brutalism Industrial

1.  **ZERO GRADIENTES:** Se você sentir vontade de usar um gradiente, pare. Use uma cor sólida ou um padrão de textura sutil (opcional).
2.  **SOMBRAS SÃO FÍSICAS:** Sombras representam elevação real. Elas se movem com o objeto. Nunca use `blur` em sombras neo-brutalistas.
3.  **BORDA PRETA É LEI:** Todo elemento que pode ser clicado, preenchido ou interagido DEVE ter borda preta de 2px. Elementos puramente decorativos podem não ter borda.
4.  **FEEDBACK TÁTIL:** Botões e cards interativos DEVEM ter `translate` no hover/active. O usuário precisa "sentir" o clique visualmente.
5.  **ALTO CONTRASTE:** Texto preto sobre branco ou branco sobre verde/preto. Evite cinzas claros para texto legível. Cinzas são apenas para labels secundários ou desabilitados.
6.  **SEM ORNAMENTOS:** Nada de sombras coloridas, brilhos, neon ou efeitos de vidro. A beleza vem da proporção, espaçamento e tipografia.

---

## 4. 🗺️ Especificações por Rota

### Home (`/`)
-   **Hero:** Duas colunas. Esquerda: H1 + Subtítulo + 2 CTAs (Solid + Outline). Direita: Ilustração vetorial ou foto tratada com filtro P&B + overlay verde sutil, borda preta grossa.
-   **Diferenciais:** Grid 3 colunas. Cards brancos com ícone grande no topo (dentro de círculo/quadrado brand).
-   **Cursos Destaque:** Grid 3 colunas. CourseCard com imagem 16:9, badge categoria sobreposto, preço em destaque.
-   **Stats:** Fundo `bg-emerald-50`. Grid 4 colunas. StatCards com números gigantes.

### Login / Register (`/login`, `/register`)
-   **Layout:** Centralizado vertical e horizontalmente. Card único `max-w-md`.
-   **Header Card:** Logo centralizado + título "Entrar" ou "Criar Conta".
-   **Inputs:** Stack vertical com gap-4. Toggle senha obrigatório.
-   **Footer Card:** Link "Esqueci minha senha" ou "Já tenho conta" alinhado centro.

### Dashboard (`/dashboard`)
-   **Welcome Banner:** Card accent com saudação personalizada e resumo rápido.
-   **Stats Grid:** 4 cards métricas (Horas estudadas, Cursos concluídos, Certificados, Streak).
-   **Continuar Estudando:** Lista vertical de cards horizontais com ProgressBar integrado.
-   **Timeline/Atividade:** Feed simples com ícones e timestamps.

### Catálogo de Cursos (`/courses`)
-   **Filtros:** Barra lateral desktop (checkboxes estilizados) / Drawer mobile.
-   **Grid Resultados:** 3 colunas. Empty state ilustrado se zero resultados.
-   **Paginação:** Botões "Anterior" / "Próximo" estilo outline + números ativos em solid.

### Admin Panel (`/admin/*`)
-   **Sidebar:** Escura (`bg-gray-900 text-white`) para diferenciar contexto administrativo.
-   **Tabelas:** Bordas pretas, header `bg-gray-100`, linhas alternadas opcional. Ações na última coluna (ícones edit/delete).
-   **Modais CRUD:** Overlay escuro, card centralizado, header com título + X, footer com botões Cancelar/Salvar alinhados direita.

---

## 5. 📱 Responsividade e Breakpoints

Adote abordagem **Mobile-First**. Estilize primeiro para mobile, depois adicione complexidade para telas maiores.

| Breakpoint | Largura | Comportamento Chave |
| :--- | :--- | :--- |
| **Mobile** | `< 640px` | Stack vertical, menu hamburger, fontes menores, padding reduzido, stats 2x2 grid. |
| **Tablet** | `640px - 1024px` | Grids 2 colunas, sidebar compacta opcional, fontes médias. |
| **Desktop** | `> 1024px` | Grids 3-4 colunas, sidebar expandida, hero 2 colunas, max-width container `1280px`. |

### Adaptações Críticas
-   **Tipografia Fluida:** Use `clamp()` ou classes responsivas (`text-3xl md:text-5xl`) para evitar títulos gigantes em mobile.
-   **Touch Targets:** Em mobile, botões e inputs devem ter altura mínima de 48px (`min-h-12`).
-   **Espaçamento:** Reduza paddings globais em mobile (`p-4` vs `p-8` desktop) para aproveitar área útil.
-   **Imagens:** Sempre `w-full h-auto object-cover` com aspect-ratio definido para evitar layout shift.

---

## 6. ♿ Acessibilidade (Não Negociável)

Neo-Brutalism NÃO é desculpa para inacessibilidade.

-   **Contraste:** Todas as combinações de cor devem passar WCAG AA (idealmente AAA). Preto/Branco/Verde Escuro já garantem isso.
-   **Foco Visível:** `:focus-visible` com outline de 3px brand + offset. Nunca remova outline sem substituir por algo melhor.
-   **Semântica:** Use `<button>` para ações, `<a>` para navegação, `<nav>`, `<main>`, `<header>`, `<footer>` corretamente.
-   **Alt Text:** Todas as imagens devem ter alt descritivo ou `alt=""` se puramente decorativas.
-   **Reduced Motion:** Respeite `prefers-reduced-motion`. Desabilite translates e animações para esses usuários.

```css
@media (prefers-reduced-motion: reduce) {
  .brutal-interactive {
    transition: none;
    transform: none !important;
  }
}
```

---

## 7. 🛠️ Implementação Técnica (Quick Reference)

### CSS Variables (`styles.css`)
```css
@theme {
  --color-brand: #166534;
  --color-brand-light: #22c55e;
  --color-surface: #ffffff;
  --color-ink: #000000;
  --font-display: 'Space Grotesk', sans-serif;
  --font-body: 'Inter', sans-serif;
  --shadow-brutal: 4px 4px 0px 0px var(--color-ink);
  --shadow-brutal-sm: 2px 2px 0px 0px var(--color-ink);
}
```

### Classes Utilitárias Essenciais
```css
.brutal-border { border: 2px solid var(--color-ink); }
.brutal-shadow { box-shadow: var(--shadow-brutal); }
.brutal-interactive {
  transition: all 0.15s ease-in-out;
}
.brutal-interactive:hover {
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0px 0px var(--color-ink);
}
.brutal-interactive:active {
  transform: translate(2px, 2px);
  box-shadow: none;
}
```

### Checklist Antes do Commit
- [ ] Todos os elementos interativos têm `.brutal-border` e `.brutal-interactive`?
- [ ] Zero gradientes ou glassmorphism adicionados?
- [ ] Fontes Display vs Body usadas corretamente?
- [ ] Estados hover/active/focus/disabled testados?
- [ ] Responsividade verificada em 375px, 768px e 1440px?
- [ ] Contraste de cores validado?
- [ ] Sem classes mágicas ou valores hardcoded fora do @theme?

---

*Este documento evolui com o projeto. Ao criar novos componentes ou padrões, atualize esta bíblia imediatamente. Consistência é construída diariamente.*
