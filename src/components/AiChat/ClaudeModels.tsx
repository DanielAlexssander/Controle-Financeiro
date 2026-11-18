import { LuChevronDown } from 'react-icons/lu';
import { SiClaude } from 'react-icons/si';
import claudeCode from '../../assets/claude-code.svg';
import { MODELOS, type Modelo } from '../../services/ai/chatProtocol';

const names: Record<Modelo, string> = { sonnet: 'Sonnet', opus: 'Opus', haiku: 'Haiku' };

export function ClaudeModelName({ model }: { model: Modelo }) {
  return <span className="claude-model"><SiClaude aria-hidden="true" />{names[model]}</span>;
}

export function ClaudeCodeBrand() {
  return <span className="claude-provider"><img src={claudeCode} width="24" height="24" alt="" />Claude Code</span>;
}

export function CompatibleModels() {
  return (
    <details open className="compatible-models">
      <summary>
        <strong>Modelos compatíveis</strong>
        <ClaudeCodeBrand />
        <LuChevronDown className="disclosure-icon" aria-hidden="true" />
      </summary>
      <ul>
        {MODELOS.map(model => <li key={model}><ClaudeModelName model={model} /></li>)}
      </ul>
    </details>
  );
}
