import { test, expect } from 'bun:test'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { lerPreferencias, salvarPreferencias } from '../src/preferencias'

const dir = () => mkdtempSync(join(tmpdir(), 'financas-pref-'))

test('salva e lê as preferências', () => {
  const d = dir()
  salvarPreferencias(d, { modelo: 'opus', esforco: 'high' })
  expect(lerPreferencias(d)).toEqual({ modelo: 'opus', esforco: 'high' })
})

test('sem arquivo devolve null', () => expect(lerPreferencias(dir())).toBeNull())

test('arquivo corrompido ou com valor inválido devolve null', () => {
  const d = dir()
  writeFileSync(join(d, 'preferencias.json'), '{')
  expect(lerPreferencias(d)).toBeNull()
  writeFileSync(join(d, 'preferencias.json'), '{"modelo":"gpt","esforco":"high"}')
  expect(lerPreferencias(d)).toBeNull()
})
