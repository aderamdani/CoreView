/**
 * Turning a firewall rule into packet tracer form values.
 *
 * Lives in its own module rather than inside the component so the mapping can be
 * tested without a DOM. The form takes one value per field, while a RouterOS rule
 * can carry comma-separated lists and prefix lengths, so the values are narrowed
 * here.
 */

const firstOf = (value) =>
  String(value ?? '')
    .split(',')[0]
    .trim();

const hostOnly = (value) => firstOf(value).split('/')[0];

const firstPort = (value) => {
  const t = firstOf(value);
  return t.includes('-') ? t.split('-')[0].trim() : t;
};

/** Chains the tracer understands. */
export const TRACE_CHAINS = ['input', 'forward', 'output'];

/** Protocols the tracer's select offers. */
export const TRACE_PROTOCOLS = ['tcp', 'udp', 'icmp', 'gre'];

/** Connection states the tracer's select offers. */
export const TRACE_STATES = ['new', 'established', 'related', 'invalid'];

/**
 * Map a firewall rule onto tracer form values.
 *
 * Only fields the rule actually constrains are returned, so the caller can merge
 * the result over its defaults and leave the rest untouched. Values the form has
 * no option for are dropped rather than forced in, because a select cannot
 * display a value outside its option list.
 */
export const formFromRule = (rule) => {
  if (!rule || typeof rule !== 'object') return {};
  const next = {};

  const chain = firstOf(rule.chain).toLowerCase();
  if (TRACE_CHAINS.includes(chain)) next.chain = chain;

  const protocol = firstOf(rule.protocol).toLowerCase();
  if (TRACE_PROTOCOLS.includes(protocol)) next.protocol = protocol;

  if (rule['src-address']) next.srcIp = hostOnly(rule['src-address']);
  if (rule['dst-address']) next.dstIp = hostOnly(rule['dst-address']);
  if (rule['src-port']) next.srcPort = firstPort(rule['src-port']);
  if (rule['dst-port']) next.dstPort = firstPort(rule['dst-port']);
  if (rule['in-interface']) next.inInterface = firstOf(rule['in-interface']);

  const state = firstOf(rule['connection-state']).toLowerCase();
  if (TRACE_STATES.includes(state)) next.connectionState = state;

  return next;
};
