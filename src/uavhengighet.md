---
layout: tekst.njk
tittel: Slik tjener vi penger
beskrivelse: Hvordan Rentesrente finansieres, hvordan reklame merkes, og reglene som hindrer at betaling påvirker tall, tekst og rekkefølge.
ingress: Rentesrente har ingen inntekter i dag. Her står reglene som gjelder hvis det endrer seg.
ingressReklame: Rentesrente tjener penger på annonselenker. De er alltid merket, og de påvirker aldri tall, tekst eller rekkefølge.
permalink: /uavhengighet/
oppdatert: 2026-11-14
---
{% if reklame.harReklame -%}
## Annonselenker

En annonselenke er en lenke der Rentesrente får betalt hvis du blir kunde hos selskapet. Du betaler ikke mer av den grunn. Rentesrente har ingen andre inntekter: ingen bannerannonser, ingen sponset tekst og ingen betalte plasseringer.
{%- else -%}
## Ingen inntekter i dag

Rentesrente har ingen annonser, ingen betalte lenker og ingen sponsorer.

## Hva som kan komme

Siden skal kunne bære seg selv over tid. Da kan det komme annonselenker til banker og fondstilbydere. En annonselenke er en lenke der Rentesrente får betalt hvis du blir kunde hos selskapet. Reglene under gjelder fra den første lenken.
{%- endif %}

## Reglene våre

- **Reklame er alltid merket.** Hver betalt lenke har merket «Annonselenke», og hver liste med slike lenker har overskriften «Reklame».
- **Betaling påvirker ikke innholdet.** Kalkulatorene regner likt uansett hvem vi har avtale med. Forklaringene skrives uten hensyn til avtaler.
- **Betaling gir ikke bedre plass.** Lister med annonselenker står alfabetisk. Listene viser bare selskaper vi har avtale med, og det står ved hver liste.
- **Ingen personlige råd.** En annonselenke er ikke en anbefaling om hva du bør velge. Innholdet er [generell informasjon, ikke personlig rådgivning](/ikke-radgivning/).
- **Bare selskaper med tillatelse.** Vi kontrollerer hvert selskap mot Finanstilsynets virksomhetsregister før vi lenker til det.
- **Noe tar vi aldri betalt for.** Det gjelder forbrukslån, kredittkort, kryptovaluta, CFD-er, pengespill og forsikring.
- **Vi selger ikke opplysninger om deg.** Rentesrente samler ikke inn personopplysninger. Les mer om [personvern](/personvern/).

## Avtalene våre

{% if reklame.harReklame -%}
<div class="tabell-rull">
  <table class="kildetabell">
    <thead><tr><th scope="col">Selskap</th><th scope="col">Hva vi får betalt for</th><th scope="col">Avtale gjennom</th><th scope="col">Sist kontrollert</th></tr></thead>
    <tbody>
      {%- for p in reklame.aktive %}
      <tr><td><a href="{{ p.tillatelse }}">{{ p.navn }}</a></td><td>{{ p.godtgjorelse }}</td><td>{{ p.nettverk }}</td><td>{{ p.kontrollert | dato }}</td></tr>
      {%- endfor %}
    </tbody>
  </table>
</div>

Lenken på hvert navn går til selskapet i Finanstilsynets virksomhetsregister.
{%- else -%}
Rentesrente har ingen avtaler i dag. Når den første kommer, står den her med navn, hva vi får betalt for, og datoen vi sist kontrollerte den.
{%- endif %}

## Les også

- [Om Rentesrente](/om/)
- [Hvor mye blir sparingen din verdt?](/kalkulatorer/renters-rente/)
