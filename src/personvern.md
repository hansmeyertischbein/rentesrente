---
layout: tekst.njk
tittel: Personvern
beskrivelse: Rentesrente bruker ingen informasjonskapsler og ingen sporing. Tallene du skriver i kalkulatorene, blir i nettleseren din.
eleventyComputed:
  ingress: "{% if konto.url and konto.nokkel %}Rentesrente samler ikke inn personopplysninger om deg, med mindre du selv lager en konto i spillet Overfør. Her er det som skjer når du bruker siden.{% else %}Rentesrente samler ikke inn personopplysninger om deg. Her er det som skjer når du bruker siden.{% endif %}"
permalink: /personvern/
oppdatert: 2026-11-23
---
## Ingen informasjonskapsler og ingen sporing

Siden bruker ingen informasjonskapsler og ingen verktøy for statistikk, annonser eller sporing. Derfor ser du ingen samtykkeboks.

## Tallene dine blir hos deg

Kalkulatorene regner i nettleseren din. Tallene du skriver inn, sendes ikke til oss eller andre. De lagres bare i lenken, etter #-tegnet, slik at du kan dele eller åpne utregningen igjen. Den delen av lenken sendes ikke til serveren når siden lastes.

## Spill som kan huskes

Spillet [Overfør](/spill/overfor/) kan huske hvor langt du har kommet. Det skjer bare hvis du selv krysser av for «Husk spillet på denne enheten». Da lagres saldoen og kjøpene dine i nettleserens lager på enheten din. Det som lagres, sier ingenting om hvem du er, og det sendes ikke til oss eller andre. Fjerner du krysset, slettes det. [Ordjakt](/spill/ordjakt/) husker mynter og kjøp på enheten din bare hvis du krysser av for det i butikken. Fjerner du krysset, slettes de. Spillet [Tjue år](/spill/tjue-ar/) lagrer ingenting.

Spiller du Ordjakt mot en venn, sendes romkoden, en tilfeldig spiller-id, en tilfeldig kode for rekkefølgen av kategorier, runden, poengsummen og antall svar mellom dere gjennom Supabase mens dere spiller. Ordene du skriver, sendes ikke, og meldingene lagres ikke i databasen vår. Nettleseren din kobler seg da til Supabase, som ser IP-adressen din. Spiller du alene, kobles ingenting til.

{% if konto.url and konto.nokkel -%}
<h2 id="kontoer">Konto i spillet Overfør</h2>

Du kan lage en konto i [Overfør](/spill/overfor/) for å spille på flere enheter. Det er frivillig, og spillet virker uten.

- **Hva vi lagrer:** e-postadressen din, passordet ditt i kryptert form og spillet ditt (saldo, kjøp og tidspunktet det ble lagret). Ingenting annet.
- **Hvorfor:** for at du skal kunne logge inn og fortsette spillet på en annen enhet. Grunnlaget er avtalen du inngår når du lager kontoen.
- **Hvor:** hos Supabase, som drifter databasen for oss på servere i EU. Supabase behandler opplysningene bare på våre vegne. Innloggingen huskes i nettleserens lager på enheten din, ikke i informasjonskapsler.
- **E-post:** du får bare e-post for å bekrefte adressen eller bytte passord, aldri nyhetsbrev eller reklame. E-posten sendes gjennom Brevo, et fransk selskap som får e-postadressen din for å levere den. Brevo teller åpninger og trykk på lenken, men knytter dem ikke til e-postadressen din.
- **Hvor lenge:** til du sletter kontoen. Trykk «Slett kontoen» i spillet, så slettes e-posten, passordet og spillet med en gang.
- **Rettighetene dine:** du kan be om innsyn, retting og sletting, og du kan klage til Datatilsynet.

{% endif -%}
## Skrift og innhold

Skriften og alt annet innhold lastes fra rentesrente.no, ikke fra eksterne tjenester.

## Hvor siden ligger

Rentesrente ligger på GitHub Pages, en tjeneste fra GitHub. Når du besøker siden, logger GitHub IP-adressen din av sikkerhetshensyn, ifølge [GitHubs dokumentasjon](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages). Vi har ikke tilgang til disse loggene.

## Lenker til andre nettsteder

Kildene vi lenker til, som Skatteetaten, Norges Bank og Finanstilsynet, har egne regler for personvern som gjelder når du besøker dem.

{% if reklame.harReklame -%}
## Annonselenker

Noen lenker er merket «Annonselenke». Rentesrente får betalt hvis du blir kunde gjennom dem. Vi sender ingen opplysninger om deg med lenken. Når du trykker, kommer du til selskapet eller annonsenettverket, som kan bruke informasjonskapsler på sine egne sider for å registrere at du kom fra oss. Deres regler for personvern gjelder der. Les [slik tjener vi penger](/uavhengighet/).

{% endif -%}
## Ansvarlig

Hans Meyer Tischbein er ansvarlig for Rentesrente. Endrer vi hvordan siden behandler opplysninger, oppdaterer vi denne siden og datoen øverst.
