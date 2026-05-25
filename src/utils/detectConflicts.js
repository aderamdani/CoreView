/**
 * Detects firewall rules that are shadowed by earlier rules in the same chain.
 * A rule B is shadowed by rule A when:
 *   - A appears before B in the same chain
 *   - A is not disabled and has a terminal action (accept/drop/reject)
 *   - A's match conditions are equal to or broader than B's conditions
 *   → B will never be reached because A already handles all traffic B would match
 */

function ipToInt(ip) {
  const p = ip.split('.').map(Number);
  return ((p[0] << 24) | (p[1] << 16) | (p[2] << 8) | p[3]) >>> 0;
}

function cidrContains(cidrA, cidrB) {
  if (!cidrA || cidrA === '' || cidrA === '0.0.0.0/0') return true;
  if (!cidrB || cidrB === '' || cidrB === '0.0.0.0/0') return false;
  try {
    const [netA, prefA] = cidrA.includes('/') ? cidrA.split('/') : [cidrA, '32'];
    const [netB, prefB] = cidrB.includes('/') ? cidrB.split('/') : [cidrB, '32'];
    const pA = parseInt(prefA, 10), pB = parseInt(prefB, 10);
    if (pA > pB) return false; // A is more specific → can't cover broader B
    const maskA = pA === 0 ? 0 : (~0 << (32 - pA)) >>> 0;
    return (ipToInt(netA) & maskA) >>> 0 === (ipToInt(netB) & maskA) >>> 0;
  } catch { return false; }
}

function portContains(portSpecA, portSpecB) {
  if (!portSpecA || portSpecA === '') return true;
  if (!portSpecB || portSpecB === '') return false;
  // Parse B's ports and check each is within A's ranges
  const rangesA = String(portSpecA).split(',').map(p => {
    const t = p.trim();
    if (t.includes('-')) { const [lo, hi] = t.split('-').map(Number); return [lo, hi]; }
    const n = parseInt(t, 10); return [n, n];
  });
  const portsB = String(portSpecB).split(',').map(p => {
    const t = p.trim();
    if (t.includes('-')) { const [lo, hi] = t.split('-').map(Number); return [lo, hi]; }
    const n = parseInt(t, 10); return [n, n];
  });
  return portsB.every(([bLo, bHi]) =>
    rangesA.some(([aLo, aHi]) => aLo <= bLo && aHi >= bHi)
  );
}

function coversField(valA, valB, compareFn) {
  if (!valA || valA === '') return true;   // A has no constraint → covers any B
  if (!valB || valB === '') return false;  // A is specific, B has no constraint → A doesn't cover "any B"
  return compareFn(valA, valB);
}

function ruleAShadowsB(ruleA, ruleB) {
  if (ruleA.disabled === 'yes' || ruleA.disabled === true) return false;
  if (ruleB.disabled === 'yes' || ruleB.disabled === true) return false;
  if (ruleA.chain !== ruleB.chain) return false;

  const action = (ruleA.action || 'accept').toLowerCase();
  if (!['accept', 'drop', 'reject'].includes(action)) return false;

  if (!coversField(ruleA['src-address'], ruleB['src-address'], cidrContains)) return false;
  if (!coversField(ruleA['dst-address'], ruleB['dst-address'], cidrContains)) return false;

  const pA = (ruleA.protocol || '').toLowerCase();
  const pB = (ruleB.protocol || '').toLowerCase();
  if (pA) {
    if (!pB) return false; // A is proto-specific, B is any → A doesn't cover B
    if (pA !== pB) return false;
  }

  // Only check ports if protocol is comparable
  if (!coversField(ruleA['dst-port'], ruleB['dst-port'], portContains)) return false;
  if (!coversField(ruleA['src-port'], ruleB['src-port'], portContains)) return false;

  const ifA = (ruleA['in-interface'] || '').toLowerCase();
  const ifB = (ruleB['in-interface'] || '').toLowerCase();
  if (ifA) {
    if (!ifB) return false;
    if (ifA !== ifB) return false;
  }

  // connection-state
  const csA = ruleA['connection-state'] || '';
  const csB = ruleB['connection-state'] || '';
  if (csA) {
    if (!csB) return false;
    const statesA = csA.split(',').map(s => s.trim().toLowerCase());
    const statesB = csB.split(',').map(s => s.trim().toLowerCase());
    if (!statesB.every(s => statesA.includes(s))) return false;
  }

  return true;
}

function describeWhy(ruleA, ruleB) {
  const parts = [];
  const pA = (ruleA.protocol || '').toLowerCase();
  const pB = (ruleB.protocol || '').toLowerCase();

  if (!ruleA['src-address'])  parts.push('src IP: semua');
  else                        parts.push(`src IP: ${ruleA['src-address']} ⊇ ${ruleB['src-address'] || 'semua'}`);

  if (!ruleA['dst-address'])  parts.push('dst IP: semua');
  else                        parts.push(`dst IP: ${ruleA['dst-address']} ⊇ ${ruleB['dst-address'] || 'semua'}`);

  if (!pA)                    parts.push('protokol: semua');
  else                        parts.push(`protokol: ${pA}`);

  if (!ruleA['dst-port'])     parts.push('port: semua');
  else                        parts.push(`port: ${ruleA['dst-port']}`);

  return parts.join(', ');
}

/**
 * @param {Array} filterRules - config.firewall.filter
 * @returns {Array} conflicts: [{ shadowingRule, shadowingIndex, shadowedRule, shadowedIndex, chain, reason }]
 */
export function detectConflicts(filterRules) {
  const active = filterRules.filter(r => r.disabled !== 'yes' && r.disabled !== true);
  const conflicts = [];

  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      if (ruleAShadowsB(active[i], active[j])) {
        conflicts.push({
          shadowingRule:  active[i],
          shadowingIndex: filterRules.indexOf(active[i]) + 1,
          shadowedRule:   active[j],
          shadowedIndex:  filterRules.indexOf(active[j]) + 1,
          chain: active[i].chain,
          reason: describeWhy(active[i], active[j]),
        });
      }
    }
  }

  return conflicts;
}

/**
 * Detect duplicate rules (identical match conditions).
 */
export function detectDuplicates(filterRules) {
  const active = filterRules.filter(r => r.disabled !== 'yes' && r.disabled !== true);
  const keys = ['chain', 'action', 'protocol', 'src-address', 'dst-address', 'src-port', 'dst-port', 'in-interface', 'connection-state'];
  const seen = new Map();
  const dupes = [];

  for (let i = 0; i < active.length; i++) {
    const key = keys.map(k => (active[i][k] || '')).join('|');
    if (seen.has(key)) {
      dupes.push({
        original: seen.get(key).rule,
        originalIndex: seen.get(key).idx + 1,
        duplicate: active[i],
        duplicateIndex: filterRules.indexOf(active[i]) + 1,
        chain: active[i].chain,
      });
    } else {
      seen.set(key, { rule: active[i], idx: i });
    }
  }

  return dupes;
}
