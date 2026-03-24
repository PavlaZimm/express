# Fleet Management Dashboard — Summary

## Co to je

Interní webová aplikace pro sledování stavu vozového parku v reálném čase.
Dispečeři mění status vozidel (Jede / Dovolená / Servis / Stojí), vše se
automaticky loguje a zobrazuje v historii i týdenním kalendáři.

---

## Tech stack

| Vrstva | Technologie |
|--------|-------------|
| Frontend | Next.js 16 (App Router, TypeScript, Tailwind CSS) |
| Databáze | Supabase (PostgreSQL) |
| Realtime | Supabase Realtime (WebSocket, postgres_changes) |
| Hosting | Vercel |
| Ikony | lucide-react |
| Datum/čas | date-fns |

---

## Vozidla

| SPZ | Typ |
|-----|-----|
| 6SM7428 | dodávka |
| 6SM7429 | dodávka |
| 1UZ 1408 | kamion |
| 1UZ 8160 | kamion |
| 1UZ 8168 | kamion |
| 1U7 8413 | kamion |

---

## Funkce

- **Dashboard** (`/`) — kartičky vozidel s okamžitou změnou statusu a realtime aktualizací mezi záložkami
- **Kalendář** (`/calendar`) — týdenní přehled (vozidlo × den) s barevným kódováním, navigací a tooltipem s hodinami
- **Historie** (spodní část dashboardu) — tabulka zápisů s filtry (status, SPZ, datum, aktivní) a CSV exportem
- **Realtime** — všechny změny se propagují do všech otevřených oken bez nutnosti obnovení stránky

---

## Databáze

### Tabulky

**`vehicles`**
```
id          uuid PK
spz         text UNIQUE NOT NULL
type        text ('dodávka' | 'kamion')
driver_name text NULL
status      text ('driving' | 'vacation' | 'service' | 'idle')
```

**`fleet_history`**
```
id          uuid PK
vehicle_id  uuid FK → vehicles.id
spz         text
status      text
start_time  timestamptz
end_time    timestamptz NULL  ← NULL = stále aktivní
```

### Migrace

| Soubor | Co dělá |
|--------|---------|
| `001_initial_schema.sql` | Tabulky, indexy, RLS, seed data |
| `002_add_driver_name.sql` | Sloupec driver_name |
| `003_add_vehicle_type.sql` | Sloupec type + reálná SPZ |
| `004_security_rls.sql` | Zpřísnění RLS politik |

---

## Bezpečnost

### Co je implementováno

| Oblast | Stav | Detail |
|--------|------|--------|
| HTTP security headers | ✅ | X-Frame-Options, CSP, X-Content-Type-Options, Referrer-Policy |
| Content Security Policy | ✅ | Omezení na vlastní origin + Supabase |
| Rate limiting (klient) | ✅ | Max 1 změna statusu / vozidlo / 2 s |
| Validace vstupu | ✅ | SPZ search: max 20 znaků, pouze [A-Za-z0-9\s] |
| Limit datového rozsahu | ✅ | Max 366 dní v historii najednou |
| RLS — backdating | ✅ | INSERT do history max 5 minut zpět |
| RLS — tamper history | ✅ | UPDATE pouze otevřených záznamů |
| RLS — status hodnoty | ✅ | CHECK constraint + RLS WITH CHECK |
| CHECK constraints (DB) | ✅ | status validován přímo v Postgres |

### Vědomé kompromisy (design decision)

| Oblast | Stav | Důvod |
|--------|------|-------|
| Autentizace | ❌ | Záměrně — interní aplikace bez přihlášení |
| Supabase anon key client-side | ⚠️ | Nutné pro realtime z browseru; klíč má pouze anon práva |
| Rate limiting (server) | ❌ | Není API vrstva; Supabase limity řeší základní ochranu |

### Doporučení pro produkci (pokud by byl přístup z internetu)

1. Přidat Supabase Auth (email/heslo nebo OAuth)
2. RLS politiky změnit na `auth.uid() IS NOT NULL`
3. Přidat Next.js middleware pro ochranu routů
4. Nastavit Supabase rate limiting v project settings

---

## Prostředí

### Environment variables (Vercel)

```
NEXT_PUBLIC_SUPABASE_URL      = https://vpcmbmltqteewsikzylf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJ...
```

### Supabase projekt

- **ID:** `vpcmbmltqteewsikzylf`
- **Region:** eu-west-1 (Irsko)
- **Realtime:** povoleno na `vehicles` i `fleet_history`

---

## Architektura datového toku

```
Browser (Dashboard)
  └─ klik na status
       ├─ 1. fleet_history UPDATE (zavřít starý záznam)
       ├─ 2. fleet_history INSERT (nový záznam)
       └─ 3. vehicles UPDATE (nový status)
              └─ Supabase Realtime
                   ├─ Dashboard (všechny záložky) → okamžitá aktualizace kartičky
                   └─ Kalendář (pokud otevřen) → refetch týdne
```

---

## CSV export

- Formát: UTF-8 s BOM (pro Excel)
- Oddělovač: `;` (středník — standard pro CZ/SK Excel)
- Sloupce: `SPZ ; Status ; Začátek ; Konec ; Trvání`
- Exportuje aktuálně filtrovaná data z tabulky historie

---

## Struktura projektu

```
src/
├── app/
│   ├── page.tsx              # Dashboard (SSR + realtime)
│   ├── calendar/page.tsx     # Kalendář (SSR + realtime)
│   └── icon.svg              # Favicon (truck ikona)
├── components/
│   ├── dashboard/
│   │   ├── VehicleGrid.tsx   # Grid 6 vozidel
│   │   ├── VehicleCard.tsx   # Kartička s tlačítky statusu
│   │   └── StatusBadge.tsx   # Barevný badge
│   ├── calendar/
│   │   └── CalendarGrid.tsx  # Týdenní tabulka
│   └── history/
│       ├── HistoryTable.tsx  # Tabulka + stránkování
│       ├── FilterBar.tsx     # Filtry (status, SPZ, datum)
│       └── ExportButton.tsx  # CSV stažení
├── lib/
│   ├── supabase/
│   │   ├── client.ts         # Browser Supabase klient
│   │   └── server.ts         # Server Supabase klient (SSR)
│   ├── hooks/
│   │   ├── useVehicles.ts    # Realtime + updateStatus
│   │   └── useFleetHistory.ts# Filtry + realtime refresh
│   └── utils/
│       ├── statusHelpers.ts  # Barvy, labely, formatování
│       ├── csvExport.ts      # CSV generátor
│       └── calendarHelpers.ts# Výpočty týdne, buildCalendarRows
└── types/fleet.ts            # TypeScript typy
supabase/migrations/          # SQL migrace
```
