/**
 * Render smoke test.
 *
 * Lint and build both pass on code that throws the moment React renders it: an
 * unresolved identifier is valid JavaScript, and `no-undef` does not inspect JSX
 * element names. That combination shipped a `ReferenceError: Server is not
 * defined` to production, which broke the whole dashboard.
 *
 * This renders every component with a real parsed config, so any error thrown
 * during render fails the check. Run with `npm run test:render` (vite-node,
 * because the components are JSX).
 */
import React from 'react';
import { renderToString } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { parseMikroTikConfig } from '../src/utils/parser.js';
import App from '../src/App.jsx';
import { Dashboard } from '../src/components/Dashboard.jsx';
import { Landing } from '../src/components/Landing.jsx';
import { AboutPanel } from '../src/components/AboutPanel.jsx';
import { MindMap } from '../src/components/MindMap.jsx';
import { OsiTcpView } from '../src/components/OsiTcpView.jsx';
import { NetworkTopology } from '../src/components/NetworkTopology.jsx';
import { PacketTracer } from '../src/components/PacketTracer.jsx';
import { ConfigComparison } from '../src/components/ConfigComparison.jsx';
import { DHCPRangeVisualizer } from '../src/components/DHCPRangeVisualizer.jsx';
import { GlossaryTip } from '../src/components/GlossaryTip.jsx';
import { FirewallConflicts } from '../src/components/FirewallConflicts.jsx';
import { FirewallSwimlane } from '../src/components/FirewallSwimlane.jsx';

const read = (rel) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf-8');
const config = parseMikroTikConfig(read('../public/demo/test-mikrotik.rsc'));
const noop = () => {};

// Each entry is a thunk, not a JSX element. Keeping the element out of the array
// literal avoids a react/jsx-key false positive: these are rendered one at a
// time, never as a list.
const cases = [
  ['App', () => <App />],
  ['Dashboard', () => <Dashboard config={config} searchTerm="" />],
  ['Landing', () => <Landing onFileParsed={noop} />],
  ['AboutPanel', () => <AboutPanel />],
  ['MindMap', () => <MindMap config={config} onNavigate={noop} />],
  ['OsiTcpView', () => <OsiTcpView config={config} onNavigate={noop} />],
  ['NetworkTopology', () => <NetworkTopology config={config} onNavigate={noop} />],
  ['PacketTracer', () => <PacketTracer config={config} onNavigate={noop} />],
  ['ConfigComparison', () => <ConfigComparison onNavigate={noop} />],
  ['DHCPRangeVisualizer', () => <DHCPRangeVisualizer server={config.dhcp.servers[0]} />],
  ['GlossaryTip', () => <GlossaryTip term="NAT" />],
  ['FirewallConflicts', () => <FirewallConflicts rules={config.firewall.filter} />],
  ['FirewallSwimlane', () => <FirewallSwimlane rules={config.firewall.filter} onNavigate={noop} />],
];

let failures = 0;
for (const [name, render] of cases) {
  try {
    const html = renderToString(render());
    if (!html) throw new Error('rendered nothing');
    console.log(`  ok    ${name} (${html.length} chars)`);
  } catch (error) {
    failures += 1;
    console.error(`  FAIL  ${name}: ${error.constructor.name}: ${error.message}`);
  }
}

// A parse failure on the bundled demo would silently turn every render above
// into an empty-state render, which would make the whole check meaningless.
if (config.interfaces.length === 0) {
  failures += 1;
  console.error('  FAIL  the demo config parsed to zero interfaces');
}

console.log(`\n${cases.length} components rendered, ${failures} failure(s)`);
process.exit(failures === 0 ? 0 : 1);
