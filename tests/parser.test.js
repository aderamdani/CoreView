import { test } from 'node:test';
import assert from 'node:assert/strict';

import { parseMikroTikConfig, ConfigParseError } from '../src/utils/parser.js';
import { analyzeConfig } from '../src/utils/configAnalyzer.js';
import { generateItemExplanation } from '../src/utils/itemExplainer.js';
import { detectConflicts, detectDuplicates } from '../src/utils/detectConflicts.js';

const BACKSLASH = String.fromCharCode(92);

test('line continuation keeps adjacent tokens apart', () => {
  const config = parseMikroTikConfig(
    '/ip address\nadd address=10.0.0.1/24' + BACKSLASH + '\ninterface=ether1\n',
  );
  assert.equal(config.ipAddresses[0].address, '10.0.0.1/24');
  assert.equal(config.ipAddresses[0].interface, 'ether1');
});

test('line continuation does not double an existing space', () => {
  const config = parseMikroTikConfig(
    '/ip address\nadd address=10.0.0.2/24 ' + BACKSLASH + '\ninterface=ether2\n',
  );
  assert.equal(config.ipAddresses[0].interface, 'ether2');
});

test('line continuation inside a quoted value inserts one space', () => {
  const config = parseMikroTikConfig(
    '/system script\nadd name=test source="line one' + BACKSLASH + '\nline two"\n',
  );
  assert.equal(config.system.scripts[0].source, 'line one line two');
});

test('a file ending in a continuation still keeps its last command', () => {
  const withoutNewline = parseMikroTikConfig('/system identity\nset name=router-1' + BACKSLASH);
  assert.equal(withoutNewline.metadata.identity, 'router-1');

  const withNewline = parseMikroTikConfig('/system identity\nset name=router-2' + BACKSLASH + '\n');
  assert.equal(withNewline.metadata.identity, 'router-2');
});

test('/ip dns accumulates attributes across add and set', () => {
  const config = parseMikroTikConfig(
    '/ip dns\n' +
      'add servers=8.8.8.8,1.1.1.1 cache-size=4096 allow-remote-requests=yes\n' +
      'set allow-remote-requests=no dynamic-entries=yes\n',
  );
  assert.deepEqual(config.dns.servers, ['8.8.8.8', '1.1.1.1']);
  assert.equal(config.dns['cache-size'], '4096');
  assert.equal(config.dns['allow-remote-requests'], 'no');
  assert.equal(config.dns['dynamic-entries'], 'yes');
});

test('a later servers= list replaces the earlier one', () => {
  const config = parseMikroTikConfig('/ip dns\nadd servers=8.8.8.8\nset servers=9.9.9.9\n');
  assert.deepEqual(config.dns.servers, ['9.9.9.9']);
});

test('the _find lookup clause never reaches rendered objects', () => {
  const config = parseMikroTikConfig(
    '/interface ethernet\nset [ find default-name=ether1 ] name=wan comment="uplink"\n' +
      '/ip firewall filter\nadd [ find chain=input ] action=drop\n',
  );
  const iface = config.interfaces.find((i) => i.defaultName === 'ether1');
  assert.ok(iface, 'interface should still be found by its find clause');
  assert.equal(iface.name, 'wan');
  assert.equal(iface.comment, 'uplink');
  assert.equal('_find' in iface, false);
  assert.equal('_find' in config.firewall.filter[0], false);
});

test('DHCP server links to the network named by its network attribute', () => {
  const config = parseMikroTikConfig(
    '/ip dhcp-server network\n' +
      'add name=net-a address=10.0.0.0/24\n' +
      'add name=net-b address=10.2.0.0/24\n' +
      '/ip dhcp-server\n' +
      'add name=d1 interface=e1 network=net-b\n' +
      'add name=d2 interface=e2 network=does-not-exist\n',
  );
  assert.equal(config.dhcp.servers[0].networkObj.name, 'net-b');
  // A dangling reference must stay unlinked rather than fall back to the first
  // network, which would display the wrong address range.
  assert.equal(config.dhcp.servers[1].networkObj, undefined);
});

test('DHCP server falls back to CIDR containment when network is omitted', () => {
  const config = parseMikroTikConfig(
    '/ip dhcp-server network\n' +
      'add name=wide address=0.0.0.0/0\n' +
      'add name=specific address=192.168.1.0/24\n' +
      '/ip address\nadd address=192.168.1.1/24 interface=e1\n' +
      '/ip dhcp-server\nadd name=d1 interface=e1\n',
  );
  assert.equal(config.dhcp.servers[0].networkObj.name, 'specific');
});

test('unusable network addresses are ignored instead of crashing', () => {
  const config = parseMikroTikConfig(
    '/ip dhcp-server network\n' +
      'add name=bad-prefix address=192.168.1.0/99\n' +
      'add name=not-an-ip address=abc/24\n' +
      'add name=no-prefix address=10.0.0.0\n' +
      '/ip address\nadd address=192.168.1.1/24 interface=e1\n' +
      '/ip dhcp-server\nadd name=d1 interface=e1\n',
  );
  assert.equal(config.dhcp.servers[0].networkObj, undefined);
});

test('non-string and blank input are rejected with a readable message', () => {
  for (const bad of [null, undefined, '', '   \n  ']) {
    assert.throws(
      () => parseMikroTikConfig(bad),
      (err) => err instanceof ConfigParseError && /MikroTik/.test(err.message),
    );
  }
});

test('text that is not a RouterOS export is rejected', () => {
  assert.throws(() => parseMikroTikConfig('halo dunia\nini bukan konfigurasi router\n'), ConfigParseError);
});

test('a valid export still parses and keeps its relations', () => {
  const config = parseMikroTikConfig(
    '# model = RB5009UG+S+\n' +
      '# software id = ABCD-1234\n' +
      '/interface ethernet\nset [ find default-name=ether1 ] name=wan\n' +
      '/ip address\nadd address=10.0.0.1/24 interface=wan\n' +
      '/ip pool\nadd name=pool-a ranges=10.0.0.10-10.0.0.100\n' +
      '/ip dhcp-server network\nadd name=net-a address=10.0.0.0/24\n' +
      '/ip dhcp-server\nadd name=dhcp-a interface=wan address-pool=pool-a network=net-a\n' +
      '/ip firewall filter\nadd chain=input action=accept protocol=tcp dst-port=22 comment="ssh"\n' +
      '/system identity\nset name=router-utama\n',
  );
  assert.equal(config.metadata.model, 'RB5009UG+S+');
  assert.equal(config.metadata.identity, 'router-utama');
  assert.equal(config.interfaces.length, 1);
  assert.equal(config.ipAddresses.length, 1);
  assert.equal(config.dhcp.servers[0].networkObj.name, 'net-a');
  assert.equal(config.dhcp.servers[0].poolObj.name, 'pool-a');
  assert.equal(config.dhcp.servers[0].interfaceObj.name, 'wan');
  assert.equal(config.firewall.filter[0].comment, 'ssh');
});

test('a disabled default route is not counted as an internet path', () => {
  const disabled = parseMikroTikConfig('/ip route\nadd dst-address=0.0.0.0/0 gateway=1.1.1.1 disabled=yes\n');
  const active = parseMikroTikConfig('/ip route\nadd dst-address=0.0.0.0/0 gateway=1.1.1.1\n');
  const warns = (config) => analyzeConfig(config).issues.filter((i) => /default route/i.test(i.title));

  assert.equal(warns(disabled).length, 1);
  assert.equal(warns(active).length, 0);
});

test('back-references stay reachable but do not break serialisation', () => {
  const config = parseMikroTikConfig(
    '/ip pool\nadd name=pool-a\n' +
      '/ip address\nadd address=10.0.0.1/24 interface=wan\n' +
      '/interface ethernet\nset [ find default-name=ether1 ] name=wan\n' +
      '/ip dhcp-server network\nadd name=net-a address=10.0.0.0/24\n' +
      '/ip dhcp-server\nadd name=dhcp-a interface=wan address-pool=pool-a network=net-a\n',
  );

  const server = config.dhcp.servers[0];
  assert.equal(server.interfaceObj.name, 'wan');
  assert.equal(server.poolObj.name, 'pool-a');
  assert.equal(server.networkObj.name, 'net-a');
  assert.equal(config.pools[0].dhcpServer.name, 'dhcp-a');
  assert.equal(config.ipAddresses[0].interfaceObj.name, 'wan');

  // The whole point: the graph is cyclic by design, so it has to stay
  // serialisable for search filtering and the HTML report export.
  assert.doesNotThrow(() => JSON.stringify(config));
  assert.equal('interfaceObj' in Object.keys(config.ipAddresses[0]), false);
  assert.equal(Object.keys(config.ipAddresses[0]).includes('poolObj'), false);
});

test('a route gateway is not turned into an interface', () => {
  const config = parseMikroTikConfig(
    '/ip route\nadd dst-address=0.0.0.0/0 gateway=203.0.113.1\n' +
      'add dst-address=10.0.0.0/8 gateway=10.0.0.99\n',
  );
  // gateway= is always an IP; RouterOS names the egress interface `interface=`.
  assert.equal(config.interfaces.filter((i) => i._implicit).length, 0);
  assert.equal(
    config.interfaces.some((i) => i.name === '203.0.113.1'),
    false,
  );
});

test('a route interface= is still discovered', () => {
  const config = parseMikroTikConfig(
    '/ip route\nadd dst-address=0.0.0.0/0 gateway=203.0.113.1 interface=vlan10\n',
  );
  const found = config.interfaces.find((i) => i.name === 'vlan10');
  assert.ok(found);
  assert.equal(found.type, 'vlan');
});

test('pool capacity counts the final octet, not the third', () => {
  const cases = [
    ['10.0.0.2-10.0.0.254', 253],
    ['192.168.88.10-192.168.88.254', 245],
    ['192.168.1.100-192.168.1.200', 101],
    ['10.0.0.2-10.0.0.6', 5],
  ];
  for (const [ranges, expected] of cases) {
    const desc = generateItemExplanation('pool', { name: 'p', ranges });
    assert.match(desc, new RegExp(`Kapasitas: ${expected} alamat`), `for ${ranges}`);
  }
});

test('a small pool still warns, a large one does not', () => {
  assert.match(generateItemExplanation('pool', { name: 'p', ranges: '10.0.0.2-10.0.0.6' }), /sangat kecil/);
  assert.doesNotMatch(
    generateItemExplanation('pool', { name: 'p', ranges: '10.0.0.2-10.0.0.254' }),
    /sangat kecil/,
  );
});

test('ip service restrictions are read from the address attribute', () => {
  const restricted = generateItemExplanation('ip-service', {
    name: 'winbox',
    port: '8291',
    address: '192.168.88.0/24',
  });
  assert.doesNotMatch(restricted, /Terbuka dari semua IP/);

  const open = generateItemExplanation('ip-service', { name: 'winbox', port: '8291' });
  assert.match(open, /Terbuka dari semua IP/);
});

test('ipsec profile reads encryption-algorithm and reports weak settings', () => {
  const strong = generateItemExplanation('ipsec-profile', {
    name: 'p',
    'encryption-algorithm': 'aes-256',
    'dh-group': 'modp2048',
    'hash-algorithm': 'sha256',
  });
  assert.match(strong, /aes-256/);
  assert.doesNotMatch(strong, /tidak direkomendasikan/);

  const weak = generateItemExplanation('ipsec-profile', {
    name: 'p',
    'encryption-algorithm': '3des',
    'dh-group': 'modp1024',
    'hash-algorithm': 'md5',
  });
  assert.match(weak, /3DES/);
  assert.match(weak, /modp1024/);
  assert.match(weak, /MD5/);
});

test('duplicate detection points at the right rule after a disabled one', () => {
  const rules = [
    { chain: 'input', action: 'noop', disabled: 'yes' },
    { chain: 'input', action: 'accept', protocol: 'tcp', 'dst-port': '22' },
    { chain: 'input', action: 'accept', protocol: 'tcp', 'dst-port': '22' },
  ];
  const dupes = detectDuplicates(rules);
  assert.equal(dupes.length, 1);
  assert.equal(dupes[0].originalIndex, 2);
  assert.equal(dupes[0].duplicateIndex, 3);
  assert.deepEqual(rules[dupes[0].originalIndex - 1], dupes[0].original);
});

test('a comma-separated address list is still compared', () => {
  const conflicts = detectConflicts([
    { chain: 'input', action: 'accept', 'src-address': '192.168.0.0/16,10.0.0.0/8', comment: 'internal' },
    { chain: 'input', action: 'drop', 'src-address': '10.1.2.3', comment: 'block-one' },
  ]);
  assert.equal(conflicts.length, 1);
});

test('a conflict reason names the fields that narrowed the rule', () => {
  const conflicts = detectConflicts([
    { chain: 'input', action: 'accept', 'in-interface': 'ether2', 'connection-state': 'established' },
    {
      chain: 'input',
      action: 'drop',
      'in-interface': 'ether2',
      'connection-state': 'established',
      protocol: 'tcp',
      'dst-port': '22',
    },
  ]);
  assert.equal(conflicts.length, 1);
  assert.match(conflicts[0].reason, /interface: ether2/);
  assert.match(conflicts[0].reason, /connection state: established/);
});

test('a disabled masquerade rule is not reported as working NAT', () => {
  const base =
    '/ip route\nadd dst-address=0.0.0.0/0 gateway=10.0.0.1\n' +
    '/ip pool\nadd name=p1\n/interface bridge\nadd name=bridge1\n' +
    '/ip dhcp-server\nadd name=d1 interface=bridge1 address-pool=p1\n';

  const active = analyzeConfig(
    parseMikroTikConfig(base + '/ip firewall nat\nadd chain=srcnat action=masquerade\n'),
  );
  const disabled = analyzeConfig(
    parseMikroTikConfig(base + '/ip firewall nat\nadd chain=srcnat action=masquerade disabled=yes\n'),
  );
  const none = analyzeConfig(parseMikroTikConfig(base));

  const hasMasqIssue = (r) => r.issues.some((i) => /masquerade/i.test(i.title));
  assert.equal(hasMasqIssue(active), false);
  assert.equal(hasMasqIssue(disabled), true);
  assert.equal(hasMasqIssue(none), true);
  assert.doesNotMatch(disabled.plainSummary, /menggunakan NAT/);
});
