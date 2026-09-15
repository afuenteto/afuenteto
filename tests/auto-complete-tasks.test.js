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
test('guarda con usuario y comparación de tareas; respeta conflictos y errores',async()=>{
 const fila={id:'p',tareas:[{fecha:'2026-09-15'}]};const filters=[];let payload;let conflict=false;let failure=false
 const query={update(value){payload=value;return this},eq(...args){filters.push(args);return this},async select(){return {data:conflict?[]:[{...fila,...payload}],error:failure?new Error('sin conexión'):null}}}
 const client={from:()=>query}
 const saved=await guardarTareasVencidas(client,'u',[fila],'2026-09-16')
 assert.equal(saved[0].tareas[0].hecha,true)
 assert.deepEqual(filters,[['user_id','u'],['id','p'],['tareas',JSON.stringify(fila.tareas)]])
 conflict=true
 assert.equal((await guardarTareasVencidas(client,'u',[fila],'2026-09-16'))[0],fila)
 failure=true
 await assert.rejects(guardarTareasVencidas(client,'u',[fila],'2026-09-16'),/sin conexión/)
})
