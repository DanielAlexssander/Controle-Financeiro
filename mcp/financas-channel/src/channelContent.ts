/** Texto que vira o corpo do evento <channel> entregue à sessão do Claude. */
export const buildChannelContent = (texto: string, snapshotJson: string | null): string => {
  const pergunta = `Pergunta: ${texto}`
  if (snapshotJson === null) return pergunta
  return `Dados financeiros atualizados do site:\n<dados_financeiros>\n${snapshotJson}\n</dados_financeiros>\n\n${pergunta}`
}
