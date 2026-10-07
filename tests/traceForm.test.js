import { test } from 'node:test';
import assert from 'node:assert/strict';

import { formFromRule, TRACE_CHAINS, TRACE_PROTOCOLS, TRACE_STATES } from '../src/utils/traceForm.js';

test('a rule fills the fields it constrains', () => {
  assert.deepEqual(
    formFromRule({
      chain: 'forward',
      protocol: 'tcp',
      'src-address': '10.0.0.5/32',
      'dst-address': '192.168.1.0/24',
      'dst-port': '22',
      'in-interface': 'ether1',
      'connection-state': 'new',
    }),
    {
      chain: 'forward',
      protocol: 'tcp',
      srcIp: '10.0.0.5',
      dstIp: '192.168.1.0',
      dstPort: '22',
      inInterface: 'ether1',
      connectionState: 'new',
    },
  );
});

test('fields the rule does not constrain are left out', () => {
  const result = formFromRule({ chain: 'input' });
  assert.deepEqual(result, { chain: 'input' });
  assert.equal('srcIp' in result, false);
  assert.equal('dstPort' in result, false);
});

test('a comma list keeps only the first entry', () => {
  assert.equal(formFromRule({ 'src-address': '10.0.0.1,10.0.0.2' }).srcIp, '10.0.0.1');
  assert.equal(formFromRule({ 'dst-port': '80,443,8080' }).dstPort, '80');
});

test('a port range keeps its lower bound', () => {
  assert.equal(formFromRule({ 'dst-port': '1000-2000' }).dstPort, '1000');
  assert.equal(formFromRule({ 'src-port': '32768-65535' }).srcPort, '32768');
});

test('address prefixes are stripped', () => {
  assert.equal(formFromRule({ 'src-address': '192.168.0.0/16' }).srcIp, '192.168.0.0');
  assert.equal(formFromRule({ 'dst-address': '::/0' }).dstIp, '::');
});

test('values outside the select options are dropped', () => {
  // The form's selects only offer a fixed set, so anything else would render as
  // a blank control with no matching option.
  assert.equal('protocol' in formFromRule({ protocol: 'ospf' }), false);
  assert.equal('chain' in formFromRule({ chain: 'srcnat' }), false);
  assert.equal('connectionState' in formFromRule({ 'connection-state': 'untracked' }), false);
});

test('values are normalised to lower case', () => {
  assert.equal(formFromRule({ chain: 'FORWARD' }).chain, 'forward');
  assert.equal(formFromRule({ protocol: 'TCP' }).protocol, 'tcp');
  assert.equal(formFromRule({ 'connection-state': 'Established' }).connectionState, 'established');
});

test('every offered option is accepted', () => {
  for (const chain of TRACE_CHAINS) assert.equal(formFromRule({ chain }).chain, chain);
  for (const protocol of TRACE_PROTOCOLS) assert.equal(formFromRule({ protocol }).protocol, protocol);
  for (const state of TRACE_STATES) {
    assert.equal(formFromRule({ 'connection-state': state }).connectionState, state);
  }
});

test('missing or malformed input yields nothing rather than throwing', () => {
  assert.deepEqual(formFromRule(null), {});
  assert.deepEqual(formFromRule(undefined), {});
  assert.deepEqual(formFromRule('bukan objek'), {});
  assert.deepEqual(formFromRule({}), {});
  assert.deepEqual(formFromRule({ chain: '', 'src-address': '' }), {});
});

test('a real rule from the parser maps cleanly', () => {
  // Shape produced by src/utils/parser.js for /ip firewall filter.
  const parsed = {
    chain: 'input',
    action: 'drop',
    protocol: 'tcp',
    'dst-port': '22',
    'src-address': '203.0.113.0/24',
    comment: 'blokir ssh',
  };
  const form = formFromRule(parsed);
  assert.equal(form.chain, 'input');
  assert.equal(form.protocol, 'tcp');
  assert.equal(form.dstPort, '22');
  assert.equal(form.srcIp, '203.0.113.0');
  // `action` and `comment` are not form fields and must not leak in.
  assert.equal('action' in form, false);
  assert.equal('comment' in form, false);
});
