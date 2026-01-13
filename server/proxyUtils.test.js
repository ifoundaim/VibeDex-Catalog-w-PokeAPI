import test from 'node:test'
import assert from 'node:assert/strict'
import { buildUpstreamUrl, normalizeQueryValue } from './proxyUtils.js'

test('normalizeQueryValue returns first element for arrays', () => {
  assert.equal(normalizeQueryValue(['a', 'b']), 'a')
  assert.equal(normalizeQueryValue([]), '')
})

test('normalizeQueryValue returns string as-is', () => {
  assert.equal(normalizeQueryValue('x'), 'x')
})

test('normalizeQueryValue returns empty string for non-string non-array', () => {
  assert.equal(normalizeQueryValue(undefined), '')
  assert.equal(normalizeQueryValue(null), '')
  assert.equal(normalizeQueryValue(123), '')
})

test('buildUpstreamUrl trims base slashes and ensures leading path slash', () => {
  assert.equal(
    buildUpstreamUrl('http://localhost:5173////', '__demo/protected', ''),
    'http://localhost:5173/__demo/protected'
  )
})

test('buildUpstreamUrl normalizes query prefix', () => {
  assert.equal(
    buildUpstreamUrl('http://localhost:5173', '/x', 'a=1&b=2'),
    'http://localhost:5173/x?a=1&b=2'
  )
  assert.equal(
    buildUpstreamUrl('http://localhost:5173', '/x', '?a=1'),
    'http://localhost:5173/x?a=1'
  )
})

