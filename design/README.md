# Designsystem for Rentesrente

Rentesrente skal se rolig og presis ut, som et sted der tallene stemmer. Uttrykket kommer fra ett grep: tall som vokser, satt i en skrift som bokstavelig talt blir bredere. Alt annet holdes stille.

Verdiene ligger i [tokens.css](tokens.css). Endre dem der, ikke i sidene.

## Prinsipper

1. **Tallet er helten.** Hver kalkulator åpner med svaret i én setning og ett stort tall. Ingen annen pynt konkurrerer med det.
2. **Farge betyr noe.** Multegult er alltid det pengene har tjent (avkastning, renters rente). Fjordblått er alltid det du har satt inn selv. Bruk dem aldri til dekor, knapper eller overskrifter.
3. **Setninger før skjemaer.** Kalkulatorer spør slik et menneske ville spurt: «Jeg starter med [10 000] kr og sparer [1 000] kr i måneden i [30] år.» Forutsetningene står under, med kilde.
4. **Åpent oppsett, ikke kort.** Innhold skilles med luft og tynne linjer, ikke med bokser og skygger.
5. **Venstrejustert.** All tekst og alle tall står til venstre, bortsett fra tallkolonner i tabeller, som står til høyre.

## Farger

| Token | Lys | Mørk | Bruk |
|---|---|---|---|
| `--paper` | #F6F7F3 | #111914 | Sidebakgrunn |
| `--field` | #FFFFFF | #19231D | Felt og grafflate |
| `--ink` | #17251E | #E6ECE7 | Tekst, kontroller, fokusring |
| `--ink-2` | #33433A | #C3CDC6 | Sekundær tekst |
| `--muted` | #5A665F | #9AA79F | Hjelpetekst, akser, feltkanter |
| `--rule` | #D7DDD5 | #2A372F | Skillelinjer og rutenett |
| `--multe` | #B07600 | #BF8517 | Det pengene har tjent |
| `--fjord` | #2A6FA8 | #4E8DD6 | Det du har satt inn |
| `--opp` | #16A05A | #2FD27A | Forsidegrafikken: kurs som stiger. Bare pynt, aldri om penger i en utregning |
| `--ned` | #DC4A3D | #FF6B5E | Forsidegrafikken: kurs som faller. Bare pynt |
| `--error` | #A8321F | #F08A73 | Feilmeldinger, alltid med tekst |

Kontrast mot `--paper` (WCAG): tekst 14,8:1 lys og 14,9:1 mørk, hjelpetekst 5,6:1 og 7,2:1. Multe og fjord er grafikkfarger og brukes ikke som brødtekst.

Graffargene er kontrollert med dataviz-skillens validator (lyshet, metning, fargeblindhet og kontrast) mot begge flater: multe og fjord skiller seg med ΔE over 21 for protanopi, og begge har minst 3:1 mot flaten.

## Typografi

Én familie: **Archivo** (variabel, vekt 100–900, bredde 62–125 %), servert fra eget domene.

| Rolle | Størrelse | Vekt | Bredde |
|---|---|---|---|
| Stort resultattall | 48 px mobil, 72 px stor skjerm | 650 | 125 % |
| Overskrift 1 | 36 / 48 px | 700 | 118 % |
| Overskrift 2 | 24 px | 650 | 118 % |
| Ingress og kalkulatorsetning | 21 px | 400 | 100 % |
| Brødtekst | 17 / 18 px, linjeavstand 1,6 | 400 | 100 % |
| Hjelpetekst | 14 px | 400 | 100 % |

Tabulære tall (`tnum`) bare i tabeller og akser; store tall bruker proporsjonale tall. Tekstbredden holdes under 38rem.

## Komponenter

- **Setningskalkulator:** felt inne i en setning, med 2 px strek under i `--ink` og minst 16 px tekst.
- **Fordelingsstripe:** én stripe som viser hvor mye av sluttbeløpet som er innskudd (fjord) og avkastning (multe), med 2 px mellomrom og avrundede ender.
- **Graf:** linjer på 2 px, rutenett på 1 px i `--rule`, området mellom innskudd og verdi i `--multe-wash`, usikkerhet som tynne linjer. Forklaring over grafen, tabell under.
- **Kilde:** liten tekst under hver standardverdi: kilde, år og «Sist kontrollert».
