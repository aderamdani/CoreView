/**
 * MikroTik Firewall Packet Tracer
 * Simulates first-match logic through firewall filter chains.
 */

/* ── IP helpers ─────────────────────────────────────────────────── */
function ipToInt(ip) {
  const p = ip.split('.').map(Number);
  return ((p[0] << 24) | (p[1] << 16) | (p[2] << 8) | p[3]) >>> 0;
}

function isValidIP(ip) {
  if (!ip) return false;
  const parts = ip.split('.');
  return parts.length === 4 && parts.every(n => !isNaN(n) && +n >= 0 && +n <= 255);
}

export function matchesCIDR(testIp, cidr) {
  if (!cidr || cidr === '' || cidr === '0.0.0.0/0' || cidr === '::/0') return true;
  if (!isValidIP(testIp)) return false;

  let negated = false;
  let c = cidr.trim();
  if (c.startsWith('!')) { negated = true; c = c.slice(1).trim(); }

  const [networkStr, prefixStr] = c.includes('/') ? c.split('/') : [c, '32'];
  const prefixLen = parseInt(prefixStr, 10);
  const mask = prefixLen === 0 ? 0 : (~0 << (32 - prefixLen)) >>> 0;
  const result = (ipToInt(testIp) & mask) === (ipToInt(networkStr) & mask);
  return negated ? !result : result;
}

export function matchesPort(testPort, portSpec) {
  if (!portSpec || portSpec === '') return true;
  const p = parseInt(testPort, 10);
  if (isNaN(p)) return false;
  return String(portSpec).split(',').some(part => {
    const t = part.trim();
    if (t.includes('-')) {
      const [lo, hi] = t.split('-').map(Number);
      return p >= lo && p <= hi;
    }
    return p === parseInt(t, 10);
  });
}

/* ── Human-readable condition descriptions ──────────────────────── */
const FIELD_LABELS = {
  'src-address':       (v) => `IP sumber harus dalam ${v}`,
  'dst-address':       (v) => `IP tujuan harus dalam ${v}`,
  'protocol':          (v) => `Protokol harus ${v.toUpperCase()}`,
  'dst-port':          (v) => `Port tujuan: ${v}`,
  'src-port':          (v) => `Port sumber: ${v}`,
  'in-interface':      (v) => `Masuk via interface "${v}"`,
  'out-interface':     (v) => `Keluar via interface "${v}"`,
  'connection-state':  (v) => `Status koneksi: ${v}`,
  'tcp-flags':         (v) => `TCP flags: ${v}`,
  'limit':             (v) => `Rate limit: ${v}`,
};

function describeField(field, value) {
  return FIELD_LABELS[field] ? FIELD_LABELS[field](value) : `${field} = ${value}`;
}

/* ── Main trace function ─────────────────────────────────────────── */
/**
 * @param {Object} packet - { srcIp, dstIp, protocol, srcPort, dstPort, inInterface, chain, connectionState }
 * @param {Array}  filterRules - config.firewall.filter
 * @returns {{ verdict, matchedRule, matchedStep, steps }}
 */
export function tracePacket(packet, filterRules) {
  const {
    srcIp = '',
    dstIp = '',
    protocol = 'tcp',
    srcPort = '',
    dstPort = '',
    inInterface = '',
    chain = 'input',
    connectionState = 'new',
  } = packet;

  const steps = [];

  // Only active rules in the target chain
  const activeRules = filterRules.filter(r => r.disabled !== 'yes' && r.disabled !== true);
  const chainRules  = activeRules.filter(r => r.chain === chain);

  for (let i = 0; i < chainRules.length; i++) {
    const rule = chainRules[i];
    const ruleIndex = activeRules.indexOf(rule) + 1; // 1-based global position

    const conditions  = [];
    const unknownChecks = [];
    let failed = false;

    /**
     * Evaluates one condition on the rule.
     * Returns early (short-circuit) only for definitive mismatches.
     */
    const check = (field, testFn) => {
      const val = rule[field];
      if (val === undefined || val === null || val === '') return; // field not set → skip
      const matched = testFn(val);
      conditions.push({ field, value: val, matched, desc: describeField(field, val) });
      if (!matched) failed = true;
    };

    check('src-address',      v => matchesCIDR(srcIp, v));
    check('dst-address',      v => matchesCIDR(dstIp, v));
    check('protocol',         v => v.toLowerCase() === protocol.toLowerCase());
    check('dst-port',         v => protocol === 'icmp' ? false : matchesPort(dstPort, v));
    check('src-port',         v => protocol === 'icmp' ? false : matchesPort(srcPort, v));
    check('in-interface',     v => !inInterface || v === inInterface);
    check('connection-state', v => {
      const states = v.split(',').map(s => s.trim().toLowerCase());
      return states.includes(connectionState.toLowerCase());
    });

    // Address lists — we can't resolve membership → flag as unknown
    if (rule['src-address-list']) {
      unknownChecks.push({ field: 'src-address-list', value: rule['src-address-list'] });
    }
    if (rule['dst-address-list']) {
      unknownChecks.push({ field: 'dst-address-list', value: rule['dst-address-list'] });
    }
    if (rule['in-interface-list']) {
      unknownChecks.push({ field: 'in-interface-list', value: rule['in-interface-list'] });
    }

    const matched = !failed;

    const step = { rule, ruleIndex, matched, conditions, unknownChecks, failedFields: conditions.filter(c => !c.matched).map(c => c.field) };
    steps.push(step);

    if (matched) {
      const action = (rule.action || 'accept').toLowerCase();
      if (['accept', 'drop', 'reject'].includes(action)) {
        return { verdict: action, matchedRule: rule, matchedStep: step, steps };
      }
      // log / passthrough / add-to-list → continue to next rule
    }
  }

  // No terminal rule matched
  return { verdict: 'no-match', matchedRule: null, matchedStep: null, steps };
}
