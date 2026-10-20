-- active_wells contaba todas las filas declaradas, también los pozos que
-- informaron producción cero (parados, en reparación). Agosto 2026 en Vaca
-- Muerta daba 5.337 "activos" contra 4.206 que produjeron. Se recalcula
-- contando sólo boe > 0, igual que /inversiones y las series por provincia.
-- Sólo datos: el esquema no cambia.
WITH p AS (
  SELECT date_month, operator_slug, concession, yacimiento, province, formation_slug, vm_combined,
         count(*) FILTER (WHERE boe > 0)::int AS n
  FROM fact_production_monthly
  GROUP BY 1, 2, 3, 4, 5, 6, 7
)
UPDATE agg_monthly_by_operator a
SET active_wells = p.n
FROM p
WHERE a.date_month = p.date_month
  AND a.operator_slug = p.operator_slug
  AND a.concession = p.concession
  AND a.yacimiento = p.yacimiento
  AND a.province = p.province
  AND a.formation_slug = p.formation_slug
  AND a.vm_combined = p.vm_combined
  AND a.active_wells IS DISTINCT FROM p.n;
