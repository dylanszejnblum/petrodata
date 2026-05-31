# FRONTEND-PROMPT — Company Logos, Stock Ticker Cards + Province Export Profiles

**Effort:** ~6 hours
**Tags:** frontend, companies, logos, stock-prices, provinces, exports
**Depends on:** BACKEND-PROMPT — Unified Companies + Provinces O&G Logos Stocks

---

## Objective

Upgrade the company pages and build province pages to include O&G operators, company logos, live stock prices, and multi-sector export profiles.

## 1. Company List — Logo + Stock Badge

Update the existing `/companies` list to show:

```
┌──────────────────────────────────────────────────────────────┐
│  COMPAÑÍAS — 81 empresas (minería + petróleo & gas)          │
│                                                               │
│  [Filtro: Todas · Minería · Petróleo & Gas]                  │
│  [Buscar...]                                                  │
├──────────────────────────────────────────────────────────────┤
│  ┌────┬──────────────────┬──────────┬──────────┬───────────┐ │
│  │ #  │ Empresa          │ Sector   │ Proy.    │ Bolsa     │ │
│  ├────┼──────────────────┼──────────┼──────────┼───────────┤ │
│  │  1 │ [🖼] YPF S.A.    │ Petróleo │ 350      │ NYSE $42 │ │
│  │  2 │ [🖼] CNEA         │ Minería  │ 8        │ Estatal   │ │
│  │  3 │ [🖼] Vista Energy │ Petróleo │ 120      │ NYSE $48 │ │
│  │  4 │ [🖼] Blue Sky U.  │ Minería  │ 4        │ TSX-V     │ │
│  │ ... │                  │          │          │           │ │
│  └────┴──────────────────┴──────────┴──────────┴───────────┘ │
│                                                               │
│  [Mostrando 20 de 81 — Cargar más]                           │
└──────────────────────────────────────────────────────────────┘
```

**Logo display:**
```tsx
// Use OperatorAvatar-style pattern — Google favicon with first-letter fallback
function CompanyLogo({ company }: { company: Company }) {
  const [failed, setFailed] = useState(false);
  if (!company.website || failed) {
    return <FirstLetterAvatar name={company.name} />;
  }
  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${new URL(company.website).hostname}&sz=64`}
      onError={() => setFailed(true)}
      className="w-8 h-8 rounded"
    />
  );
}
```

**Stock badge (inline):**
```tsx
function StockBadge({ ticker, exchange }: { ticker: string; exchange: string }) {
  const { data } = useQuery(['stock-price', ticker], () =>
    fetch(`/api/v2/companies/prices`).then(r => r.json())
  );
  const price = data?.find(p => p.ticker === ticker);
  if (!price) return <span className="text-dim text-sm">{exchange}</span>;
  return (
    <span className={`text-sm font-mono ${price.change_pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
      {exchange} ${price.price} {price.change_pct >= 0 ? '▲' : '▼'} {Math.abs(price.change_pct)}%
    </span>
  );
}
```

## 2. Company Detail — Unified Layout

```
┌──────────────────────────────────────────────────────────────┐
│  [🖼] YPF S.A.                            [NYSE] $42.15 ▲  │
│  ─────────────────────────────────────────                  │
│  Sector: Petróleo & Gas · Argentina                          │
│  Web: ypf.com · 350 pozos activos                           │
├──────────────────────────────────────────────────────────────┤
│  [ANIMATED COUNTERS]                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │  350     │ │  65,000  │ │  45%     │ │  250M    │        │
│  │Pozos     │ │bbl/día   │ │Vaca M.   │ │boe/mes  │        │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
│                                                               │
│  [Stock price mini-chart — last 30 days]                      │
│  ┌────────────────────────────────────────────────────┐       │
│  │  ▁▂▃▄▅▆▇█▇▆▅▄▃▂▁▂▃▄▅▆▇█▇▆▅▄▃▂▁   $42.15           │       │
│  │  Últimos 30 días — NYSE:YPF                      │       │
│  └────────────────────────────────────────────────────┘       │
│                                                               │
│  [PRODUCTION BY PROVINCE — for O&G companies]                 │
│  ┌────────────────────────────────────────────────────┐       │
│  │  Neuquén: ████████████████████  78%    47K bbl/d  │       │
│  │  Santa Cruz: ████████          18%    11K bbl/d   │       │
│  │  Mendoza: ██                    4%     2K bbl/d   │       │
│  └────────────────────────────────────────────────────┘       │
│                                                               │
│  [PROJECT PORTFOLIO — for mining companies, existing view]    │
│  ┌─────┬──────────────┬──────────┬────────────┬────────────┐  │
│  │  #  │ Proyecto     │ Provincia│ Estado     │ Recurso    │  │
│  ├─────┼──────────────┼──────────┼────────────┼────────────┤  │
│  │  1  │ Cerro Solo   │ Chubut   │ Avanzada   │ 35.4 MLbs  │  │
│  └─────┴──────────────┴──────────┴────────────┴────────────┘  │
│                                                               │
│  [MONTHLY PRODUCTION CHART — for O&G companies]               │
│  Oil (bbl/d) and Gas (MMcf/d) stacked area, last 24 months    │
│                                                               │
│  [VM SHARE donut] — Vaca Muerta vs Conventional               │
└──────────────────────────────────────────────────────────────┘
```

## 3. Province Pages (NEW)

### Province List
```
┌──────────────────────────────────────────────────────────────┐
│  PROVINCIAS                                                    │
│                                                               │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐     │
│  │ Neuquén  │ Santa    │ Chubut   │ Mendoza  │ Salta    │     │
│  │ 3502 pr. │ Cruz     │ 511 pr.  │ 403 pr.  │ 120 pr.  │     │
│  │ O&G + U  │ 505 pr.  │ O&G + U  │ O&G + U  │ O&G + U  │     │
│  │ $7,000M  │ $4,200M  │ $3,100M  │ $1,800M  │ $1,200M  │     │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘     │
│                                                               │
│  [Ver todas las 23 provincias ▼]                              │
└──────────────────────────────────────────────────────────────┘
```

### Province Detail
```
┌──────────────────────────────────────────────────────────────┐
│  NEUQUÉN                                                      │
│  Cuenca Neuquina · 3,502 proyectos activos                    │
│                                                               │
│  [ANIMATED COUNTERS]                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │  3,502   │ │  5       │ │  12M     │ │  $7B     │        │
│  │Proyectos │ │Empresas  │ │bbl/mes   │ │Export./año│       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
│                                                               │
│  [SECTOR TABS: Petróleo | Gas | Minería | Exportaciones]     │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  PETRÓLEO                                                │   │
│  │  Producción: 12M bbl/mes · 380K bbl/d                    │   │
│  │  Vaca Muerta: 78% de la producción                       │   │
│  │  Pozos activos: 3,200                                     │   │
│  │                                                           │   │
│  │  Top operadores:                                          │   │
│  │  [🖼] YPF       ████████████████ 45%  171K bbl/d         │   │
│  │  [🖼] Vista     ████████████      30%  114K bbl/d         │   │
│  │  [🖼] Shell     ██████            15%   57K bbl/d         │   │
│  │  [🖼] PAE       ████             10%   38K bbl/d         │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                               │
│  [EXPORT PROFILE]                                             │
│  ┌────────────────────────────────────────────────────┬─────┐ │
│  │ Sector           │ Producto        │ Valor anual   │ %   │ │
│  ├──────────────────┼─────────────────┼───────────────┼─────┤ │
│  │ Petróleo         │ Crudo           │ $5,200M       │ 74% │ │
│  │ Gas              │ Gas natural     │ $1,800M       │ 26% │ │
│  │ Minería          │ Uranio          │ $0            │ 0%  │ │
│  └──────────────────┴─────────────────┴───────────────┴─────┘ │
│                                                               │
│  [PRODUCTION HISTORY CHART]                                   │
│  Monthly oil + gas production, last 24 months, stacked area   │
│                                                               │
│  [VM VS CONVENTIONAL donut chart]                             │
│                                                               │
│  [NAV] ← Río Negro  |  Mendoza →  |  Ver todos los proyectos │
└──────────────────────────────────────────────────────────────┘
```

## 4. Export Summary Page (NEW) — `/exportaciones`

```
┌──────────────────────────────────────────────────────────────┐
│  EXPORTACIONES — Minería, Petróleo & Gas                     │
│                                                               │
│  [SECTOR TABS: Todos · Petróleo · Gas · Minería]             │
│                                                               │
│  [TOTAL BAR — animated]                                       │
│  $15,000M exportaciones mineras + energéticas (2024)         │
│                                                               │
│  [STACKED BAR CHART — by sector, last 5 years]               │
│  ┌────────────────────────────────────────────────────┐       │
│  │  ▓ Petróleo ▓ Gas ▓ Minería                       │       │
│  │  2020  2021  2022  2023  2024                      │       │
│  └────────────────────────────────────────────────────┘       │
│                                                               │
│  [TOP EXPORTS TABLE]                                          │
│  ┌─────┬──────────────┬──────────┬──────────────┬──────────┐ │
│  │  #  │ Producto     │ Sector   │ Valor anual   │ Var %   │ │
│  ├─────┼──────────────┼──────────┼──────────────┼──────────┤ │
│  │  1  │ Petróleo cr.│ Petróleo │ $8,500M      │ +12%    │ │
│  │  2  │ Gas natural  │ Gas      │ $3,200M      │ +8%     │ │
│  │  3  │ Oro          │ Minería  │ $2,100M      │ -3%     │ │
│  │  4  │ Litio        │ Minería  │ $1,800M      │ +25%    │ │
│  │  5  │ Plata        │ Minería  │ $900M        │ +5%     │ │
│  │ ... │              │          │              │         │ │
│  └─────┴──────────────┴──────────┴──────────────┴──────────┘ │
│                                                               │
│  [BY PROVINCE MAP] — Choropleth by export value               │
└──────────────────────────────────────────────────────────────┘
```

## 5. Design Notes

- **Logo component:** Reuse/extend the existing `OperatorAvatar` component pattern already in `minerals/frontend/src/components/Petrodata/map/OperatorAvatar.tsx` (Google favicon → first-letter fallback, sizes sm/md/lg)
- **Stock prices:** Fetch from `/api/v2/companies/prices` with React Query, refresh every 5 minutes
- **Animations:** anime.js for stat counters on company and province pages
- **Navigation:** Breadcrumbs from company → province → project (bidirectional links)

## Acceptance Criteria

- [ ] Company list shows all 81+ companies (mineral + O&G) with logos
- [ ] Stock badges on public companies with live price + change
- [ ] Company detail shows unified view: O&G production + mineral projects
- [ ] Province list page with cards showing combined stats
- [ ] Province detail with sector tabs (Petróleo / Gas / Minería / Exportaciones)
- [ ] Export summary page with stacked bar chart + choropleth
- [ ] All counters animated with anime.js
- [ ] Logo fallback (first-letter avatar) when favicon fails
- [ ] Stock price refresh every 5 minutes (no stale data)
- [ ] Dark theme consistent with existing design system
- [ ] Responsive (province cards collapse on mobile)

## What to Skip

- Do NOT build a stock screener or portfolio feature
- Do NOT add historical stock prices beyond 30-day mini-chart
- Do NOT scrape Argentina customs data — use the pipeline output
- Do NOT build a full page per non-O&G province (23 provinces off the shelf is fine)
