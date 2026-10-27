---
layout: tekst.njk
tittel: Hva er renters rente?
beskrivelse: Renters rente betyr at du får avkastning på avkastningen du allerede har fått. Slik virker det, og hvorfor tiden betyr mer enn beløpet.
ingress: Renters rente betyr at du får avkastning på avkastningen du allerede har fått, ikke bare på pengene du satte inn. Over mange år blir det ofte den største delen av det sparingen vokser til.
permalink: /forklart/renters-rente/
oppdatert: 2026-10-27
---
{%- set e = eksempler -%}
## Et lite eksempel

Setter du 100&nbsp;kr i banken til 5&nbsp;% rente, har du 105&nbsp;kr etter ett år. Neste år får du 5&nbsp;% av 105&nbsp;kr, altså 5,25&nbsp;kr, og har 110,25&nbsp;kr. Tredje år får du 5,51&nbsp;kr. Renten vokser fordi den regnes av et beløp som blir større for hvert år.

Over kort tid er forskjellen liten. Over lang tid blir den stor. 10&nbsp;000&nbsp;kr til 5&nbsp;% i 30&nbsp;år blir {{ e.rentersRente | kr }} med renters rente. Får du bare rente av de opprinnelige 10&nbsp;000 kronene, blir det {{ e.enkelRente | kr }}.

## Tiden betyr mer enn beløpet

Fordi veksten bygger på seg selv, er tid det mest verdifulle i sparing. Sparer du 1&nbsp;000&nbsp;kr i måneden i 40&nbsp;år, ender du med omtrent {{ e.lang.verdi | omtrentKr }}. Sparer du like mye i 30&nbsp;år, får du omtrent {{ e.kort.verdi | omtrentKr }}. Du har satt inn {{ (e.lang.innskudd - e.kort.innskudd) | kr }} mer, men har omtrent dobbelt så mye.

<p class="regnestykke">Eget regnestykke: {{ e.sparing.avk | prosent }} avkastning og {{ e.sparing.kost | prosent }} kostnad i året, før skatt og inflasjon.</p>

## Kostnader vokser også med renters rente

En årlig kostnad trekkes fra hele beløpet hvert år, så den virker over tid på samme måte. Sparer du 1&nbsp;000&nbsp;kr i måneden i 30&nbsp;år, gir {{ satser.kostnadIndeksfond.verdi | prosent }} kostnad omtrent {{ e.billig.verdi | omtrentKr }}. Med {{ satser.kostnadAktiveAksjefond.verdi | prosent }} kostnad blir det omtrent {{ e.dyr.verdi | omtrentKr }}. En forskjell på {{ e.prosentpoeng | desimal }} prosentpoeng i året blir omtrent {{ e.kostnadsforskjell | omtrentKr }} til slutt.

<p class="regnestykke">Eget regnestykke med {{ e.sparing.avk | prosent }} avkastning før kostnader. {{ satser.kostnadIndeksfond.verdi | prosent }} var typisk pris for indeksfond i {{ satser.kostnadIndeksfond.aar }}, og {{ satser.kostnadAktiveAksjefond.verdi | prosent }} var snittprisen for aktive aksjefond i {{ satser.kostnadAktiveAksjefond.aar }}, ifølge <a href="{{ satser.kostnadIndeksfond.url }}">Finanstilsynet</a>.</p>

## Regelen om 72

Vil du anslå hvor lang tid det tar å doble pengene, deler du 72 på avkastningen i prosent. Med 6&nbsp;% i året tar det omtrent 72 / 6 = 12&nbsp;år. Det nøyaktige svaret er {{ e.dobling6 | tall(1) }}&nbsp;år. For avkastning mellom 2 og 15&nbsp;% bommer regelen med mindre enn ett år.

## Inflasjon virker motsatt vei

Prisene stiger også med renters rente. Med {{ satser.inflasjonsmaal.verdi | prosent }} prisvekst i året er prisene etter 30&nbsp;år omtrent {{ ((e.prisvekst30 - 1) * 100) | tall }}&nbsp;% høyere enn i dag. Derfor viser kalkulatoren både kroner og dagens kroner, slik at du ser hva pengene faktisk kan kjøpe.

## Prøv med dine egne tall

[Hvor mye blir sparingen din verdt?](/kalkulatorer/renters-rente/) regner renters rente med dine egne tall, og tar med kostnader, skatt, inflasjon og hvor mye utfallet kan svinge.

<p class="forbehold">Regneeksemplene er generell informasjon, ikke personlig rådgivning. <a href="/ikke-radgivning/">Les mer om hva det betyr</a>.</p>
