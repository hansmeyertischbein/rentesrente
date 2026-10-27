// Hjelpere for feltene inne i setningskalkulatorene.
// Feltene i setningen blir like brede som tallet i dem.
export function tilpassBredde(input, minste = 4) {
  input.style.width = `${Math.max(input.value.length, minste) + 0.8}ch`;
}
