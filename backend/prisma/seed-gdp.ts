import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Argentina nominal GDP, current US$ (World Bank, CC-BY 4.0).
const WB_URL =
  'https://api.worldbank.org/v2/country/ARG/indicator/NY.GDP.MKTP.CD?format=json&per_page=100';
const SERIES = 'gdp_usd';
const SOURCE = 'worldbank';

interface WbRow {
  date: string;
  value: number | null;
}

async function main() {
  const t0 = Date.now();
  const resp = await fetch(WB_URL);
  if (!resp.ok) throw new Error(`World Bank HTTP ${resp.status}`);
  const body = (await resp.json()) as [unknown, WbRow[]];
  const rows = (body[1] ?? []).filter((r) => r.value != null);
  if (!rows.length) throw new Error('World Bank returned no GDP rows');

  let upserted = 0;
  // Idempotent upsert by [source, series, date]. No TRUNCATE.
  for (const r of rows) {
    const date = new Date(Date.UTC(Number(r.date), 0, 1)); // annual → YYYY-01-01
    if (Number.isNaN(date.getTime())) continue;
    await prisma.factPrice.upsert({
      where: { fact_price_source_series_date: { source: SOURCE, series: SERIES, date } },
      create: {
        source: SOURCE,
        series: SERIES,
        name: 'Argentina GDP (current US$)',
        unit: 'USD',
        date,
        value: r.value as number,
      },
      update: { value: r.value as number, name: 'Argentina GDP (current US$)', unit: 'USD' },
    });
    upserted++;
  }

  console.log(
    `  gdp: ${upserted} annual rows upserted (${rows[0].date}…${rows[rows.length - 1].date}) in ${((Date.now() - t0) / 1000).toFixed(2)}s`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
