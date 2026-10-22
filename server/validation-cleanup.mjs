// Temporary admin-only maintenance. Reviewed snapshots arrive in the
// authenticated request and are never embedded in repository code.
const fields=['id','name','date','time','guests','items','note','status','created_at'];
export async function purgeReviewedValidationOrders(pool,expected){
 if(!Array.isArray(expected)||!expected.length||expected.length>6||new Set(expected.map(e=>e?.id)).size!==expected.length)throw new Error('Invalid cleanup selection');
 for(const e of expected){
  if(!e||typeof e.id!=='string'||!/^NM-[A-F0-9]{12}$/.test(e.id)||typeof e.name!=='string'||!/(?:验证|连通性检查)$/.test(e.name)||e.status!=='cancelled'||!fields.every(k=>Object.hasOwn(e,k)))throw new Error('Only reviewed cancelled validation records may be deleted');
 }
 const client=await pool.connect();
 try{
  await client.query('BEGIN');const targets=[];
  for(const e of [...expected].sort((a,b)=>a.id.localeCompare(b.id))){
   const {rows}=await client.query('SELECT id,name,date,time,guests,items,note,status,created_at FROM orders WHERE id=$1 FOR UPDATE',[e.id]);
   if(!rows.length)continue;
   if(!fields.every(key=>String(rows[0][key])===String(e[key])))throw new Error('Validation record changed; cleanup stopped');
   targets.push(e.id);
  }
  let deleted=[];
  if(targets.length){
   const sql='DELETE FROM orders WHERE id IN ('+targets.map((_,i)=>'$'+(i+1)).join(',')+') RETURNING id';
   const result=await client.query(sql,targets);deleted=result.rows.map(o=>o.id);
   if(deleted.length!==targets.length)throw new Error('Validation cleanup count mismatch');
  }
  await client.query('COMMIT');return deleted.sort();
 }catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
}
