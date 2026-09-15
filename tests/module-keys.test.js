import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parse } from '@babel/parser'

test('la ventana de configuración y los módulos tienen claves distintas para la misma cuenta', () => {
  const ast = parse(readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8'), {
    sourceType: 'module', plugins: ['jsx'],
  })
  const keys = new Map()
  function visit(node) {
    if (!node || typeof node !== 'object') return
    if (node.type === 'JSXOpeningElement' && ['HomeModules', 'ModulesSettings'].includes(node.name.name)) {
      const expression = node.attributes.find(attribute => attribute.name?.name === 'key')?.value?.expression
      assert.equal(expression?.type, 'TemplateLiteral', 'La clave debe distinguir el componente y la cuenta')
      const keyFor = account => expression.quasis.map(part => part.value.cooked).join(account)
      assert.notEqual(keyFor('cuenta-a'), keyFor('cuenta-b'), 'Cambiar de cuenta debe reiniciar el componente')
      keys.set(node.name.name, keyFor('misma-cuenta'))
    }
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach(visit)
      else if (value && typeof value === 'object') visit(value)
    }
  }
  visit(ast)
  assert.equal(keys.size, 2)
  assert.notEqual(keys.get('HomeModules'), keys.get('ModulesSettings'), 'Las claves duplicadas pueden dejar copias del DOM sin controles')
})
