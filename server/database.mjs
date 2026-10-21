export class Database {
 constructor(pool){this.pool=pool;}
 prepare(sql){return new Statement(this.pool,sql,[]);}
}
class Statement {
 constructor(pool,sql,values){this.pool=pool;let i=0;this.sql=sql.replace(/\?/g,()=>'$'+(++i));this.values=values;}
 bind(...values){return new Statement(this.pool,this.sql,values);}
 normalize(row){if(row&&row.created_at!==undefined)row.created_at=Number(row.created_at);return row;}
 async first(){const r=await this.pool.query(this.sql,this.values);return this.normalize(r.rows[0])??null;}
 async all(){const r=await this.pool.query(this.sql,this.values);return {results:r.rows.map(x=>this.normalize(x))};}
 async run(){await this.pool.query(this.sql,this.values);return {success:true};}
}
export async function migrate(pool){
 await pool.query(`CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, csrf TEXT NOT NULL, created_at BIGINT NOT NULL)`);
 await pool.query(`CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY,session TEXT NOT NULL,request_id TEXT NOT NULL,access_hash TEXT NOT NULL,name TEXT NOT NULL,date TEXT NOT NULL,time TEXT NOT NULL,guests INTEGER NOT NULL,items TEXT NOT NULL,note TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'confirmed',created_at BIGINT NOT NULL)`);
 await pool.query(`CREATE INDEX IF NOT EXISTS orders_session ON orders(session)`);
 await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS orders_request ON orders(session,request_id)`);
 await pool.query(`CREATE TABLE IF NOT EXISTS admin_sessions (id TEXT PRIMARY KEY, expires BIGINT NOT NULL)`);
}
