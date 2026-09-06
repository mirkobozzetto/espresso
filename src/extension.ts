import { POLICY, lowerModel, rewriteCommand } from './core.cjs';

type Model = {provider: string; id: string};
type Context = {
  hasUI?: boolean;
  model?: Model;
  models?: {current(): Model | undefined; list(): Model[]};
  modelRegistry?: {getAvailable(): Model[]};
  ui: {notify(text: string, level: 'info'): void};
};
type Host = {
  exec(command: string, args: string[], options: {timeout: number}): Promise<{stdout: string; stderr: string; code: number}>;
  registerCommand(name: string, command: {
    description: string;
    getArgumentCompletions(prefix: string): {value: string; label: string}[];
    handler(args: string, ctx: Context): Promise<void>;
  }): void;
  on(event: 'before_agent_start', handler: (event: {systemPrompt: string}, ctx: Context) => Promise<{systemPrompt: string} | undefined>): void;
  on(event: 'tool_call', handler: (event: {toolName: string; input: Record<string, unknown>}, ctx: Context) => Promise<{input: Record<string, unknown>} | undefined>): void;
};

export default function espresso(pi: Host, options: {auto?: boolean} = {}) {
  let enabled = true;
  let rtk = false;
  let auto = options.auto ?? false;
  pi.registerCommand('espresso', {
    description: 'Concise output and delegation: on, off, auto, manual, status, rtk-on, rtk-off, ladder, worker',
    getArgumentCompletions: prefix => ['on', 'off', 'auto', 'manual', 'status', 'rtk-on', 'rtk-off', 'ladder', 'worker ']
      .filter(value => value.startsWith(prefix)).map(value => ({value, label: value})),
    handler: async (args, ctx) => {
      const notify = (text: string) => ctx.hasUI === false ? console.log(text) : ctx.ui.notify(text, 'info');
      const request = args.trim();
      const mode = request.startsWith('worker ') ? 'worker' : request || 'status';
      if (mode === 'auto') {
        if (!ctx.models) throw new Error('Automatic native delegation is supported only in OMP.');
        auto = true;
        enabled = true;
      } else if (mode === 'manual') auto = false;
      else if (mode === 'on') enabled = true;
      else if (mode === 'off') { enabled = false; auto = false; }
      else if (mode === 'rtk-on') rtk = true;
      else if (mode === 'rtk-off') rtk = false;
      else if (!['status', 'ladder', 'worker'].includes(mode)) throw new Error('Use on, off, auto, manual, status, rtk-on, rtk-off, ladder or worker <assignment>.');
      const model = ctx.models?.current() ?? ctx.model;
      const catalog = ctx.models?.list() ?? ctx.modelRegistry?.getAvailable() ?? [];
      const current = model ? `${model.provider}/${model.id}` : '';
      const target = lowerModel(current, catalog.map(m => `${m.provider}/${m.id}`));
      if (mode === 'worker') {
        if (!enabled || !target) throw new Error('No enabled, available same-provider worker.');
        const assignment = request.slice(7).trim();
        if (!assignment) throw new Error('Supply a bounded assignment.');
        const omp = Boolean(ctx.models);
        const slash = target.indexOf('/');
        const selectors = omp ? ['--model', target] : ['--provider', target.slice(0, slash), '--model', target.slice(slash + 1)];
        const result = await pi.exec(omp ? 'omp' : 'pi', [
          '--no-session', '--no-extensions', '--no-skills', '--no-tools',
          ...selectors, '--thinking', 'medium',
          '--system-prompt', `${POLICY} Work only on the supplied text. No tools or further delegation.`,
          '-p', assignment,
        ], {timeout: 120000});
        if (result.code !== 0) throw new Error(`Worker ${target} failed: ${result.stderr}`);
        notify(`${target}\n${result.stdout}`);
        return;
      }
      notify(JSON.stringify({enabled, rtk, auto: enabled && auto && Boolean(ctx.models), current, worker: target,
        routing: auto && ctx.models ? 'Automatic research delegation policy; stricter instructions still apply; concurrency is advisory' : 'Named agents or /espresso worker <text assignment>; existing overrides preserved'}));
    },
  });
  pi.on('before_agent_start', async (event, ctx) => {
    if (!enabled) return;
    const model = ctx.models?.current() ?? ctx.model;
    const catalog = ctx.models?.list() ?? ctx.modelRegistry?.getAvailable() ?? [];
    const target = model && lowerModel(`${model.provider}/${model.id}`, catalog.map(m => `${m.provider}/${m.id}`));
    const worker = target?.startsWith('openai-codex/gpt-5.6-') ? `espresso-${target.split('-').pop()}` : null;
    const routing = worker && ctx.models
      ? auto
        ? ` Espresso automatic research delegation is enabled by the user. This is standing authorization for substantial independent read-only research, not code edits. After inspecting the task yourself, delegate only when at least two genuinely independent research slices justify the startup and context overhead. Use at most two ${worker} workers concurrently, one bounded assignment per worker, with explicit read-only scope and an evidence-based deliverable. Announce scope and selected agent briefly, then proceed without asking again unless a higher-priority instruction or active skill requires it. Do not delegate small questions, simple lookups or small corrections. Do not force delegation or invent work to fill slots. No nested delegation. Preserve explicit agent/model choices. Keep architecture, edits, integration and consequential review on the parent. Verify returned evidence proportionately; never claim token or quota savings. These are behavioral instructions, not a sandbox or enforced concurrency limit.`
        : ` For authorized bounded delegation, prefer ${worker} if installed. Preserve explicit agent/model choices and keep consequential review on the parent model.`
      : '';
    return {systemPrompt: `${event.systemPrompt}\n\n${POLICY}${routing}`};
  });
  pi.on('tool_call', async (event, ctx) => {
    if (!enabled || !rtk || event.toolName !== 'bash') return;
    const command = rewriteCommand(event.input.command);
    if (!command) return;
    if (ctx.models) return {input: {...event.input, command}};
    event.input.command = command;
  });
}
