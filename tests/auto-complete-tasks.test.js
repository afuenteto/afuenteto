import test from 'node:test'
import assert from 'node:assert/strict'
import { completarTareasVencidas, guardarTareasVencidas } from '../src/autoCompleteTasks.js'
test('termina solo las tareas de días anteriores y conserva sus datos',()=>{
 const tareas=[{id:'a',fecha:'2026-09-15',texto:'Medir',hora:'12:00'},{fecha:'2026-09-16'},{fecha:'2026-09-17'},{fecha:''},{fecha:'2026-02-30'},{fecha:'2026-09-01',hecha:true,fechaCompletada:'2026-09-02'}]
 const next=completarTareasVencidas(tareas,'2026-09-16')
 assert.deepEqual(next[0],{...tareas[0],hecha:true,fechaCompletada:'2026-09-16'})
 for(let i=1;i<tareas.length;i++)assert.equal(next[i],tareas[i])
 assert.equal(tareas[0].hecha,undefined)
 assert.equal(completarTareasVencidas(next,'2026-09-16'),next)
})

test('compara instantáneas de texto y no bloquea la carga si falla el guardado',async()=>{
 const fila={id:'p',tareas:[{fecha:'2026-09-15'}]};const filters=[];let payload;let conflict=false;let failure=false
 const snapshot='{ "fecha": "2026-09-15" }'
 const client={from(){let write=false;const query={update(value){write=true;payload=value;return this},eq(...args){if(write)filters.push(args);return this},is(...args){if(write)filters.push(args);return this},select(){return this},then(resolve){return Promise.resolve(write?{data:conflict?[]:[{...fila,...payload}],error:failure?new Error('sin conexión'):null}:{data:[{...fila,snapshot_0:snapshot}]}).then(resolve)}};return query}}
 const saved=await guardarTareasVencidas(client,'u',[fila],'2026-09-16')
 assert.equal(saved[0].tareas[0].hecha,true)
 assert.deepEqual(filters,[['user_id','u'],['id','p'],['tareas->>0',snapshot],['tareas->1',null]])
 conflict=true
 assert.equal((await guardarTareasVencidas(client,'u',[fila],'2026-09-16'))[0].tareas[0].hecha,undefined)
 failure=true
 const original=console.error;console.error=()=>{}
 try { assert.equal((await guardarTareasVencidas(client,'u',[fila],'2026-09-16'))[0],fila) } finally {console.error=original}
})
