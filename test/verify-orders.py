import urllib.request,urllib.error,http.cookiejar,json,sys,uuid,secrets,datetime
base=sys.argv[1].rstrip('/')
import subprocess,tempfile,pathlib
scratch=tempfile.TemporaryDirectory(prefix='nm-verify-')
def client():
 cookie=str(pathlib.Path(scratch.name)/str(uuid.uuid4()))
 def call(path,body=None,csrf=None):
  args=['curl','--silent','--show-error','--max-time','30','--cookie',cookie,'--cookie-jar',cookie,'-H','Origin: '+base,'-w','\n%{http_code}',base+path]
  if body is not None:args+=['-H','Content-Type: application/json','--data-binary','@-']
  if csrf:args+=['-H','X-CSRF-Token: '+csrf]
  r=subprocess.run(args,input=json.dumps(body) if body is not None else None,text=True,capture_output=True,check=True)
  raw,status=r.stdout.rsplit('\n',1)
  try:return int(status),json.loads(raw)
  except ValueError:raise RuntimeError('Non-JSON API response '+status+': '+raw[:100])
 return call
one,two=client(),client()
s,c=one('/api/session');assert s==200
s,d=two('/api/session');assert s==200
csrf,other=c['csrf'],d['csrf']
date=(datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=8)))+datetime.timedelta(days=1)).date().isoformat()
payload=dict(name='系统连通性检查',date=date,time='12:00',guests=2,items=['mist','wind','cloud'],note='自动验证记录，验证结束后取消。',requestId=str(uuid.uuid4()),key=secrets.token_hex(32))
assert one('/api/orders',payload,'wrong')[0]==403
s,data=one('/api/orders',payload,csrf);assert s==201,(s,data)
id,receipt=data['order']['id'],data['receipt']
assert one('/api/orders',payload,csrf)[1]['order']['id']==id
assert two('/api/orders')[1]['orders']==[]
assert two('/api/orders',dict(action='cancel',id=id),other)[0]==403
assert two('/api/orders',dict(action='lookup',receipt=receipt),other)[1]['order']['id']==id
assert two('/api/orders',dict(action='lookup',receipt=id+'.'+'0'*64),other)[0]==404
for patch in [dict(items=['fake']),dict(guests=0),dict(date='2026-02-30')]:
 bad={**payload,**patch,'requestId':str(uuid.uuid4())}
 assert one('/api/orders',bad,csrf)[0]==400
assert one('/api/admin')[0]==403
assert two('/api/orders',dict(action='cancel',id=id,key=payload['key']),other)[0]==200
assert next(o for o in one('/api/orders')[1]['orders'] if o['id']==id)['status']=='cancelled'
print(json.dumps({'all_checks_passed':True,'order_id':id,'checks':['create','durable read','duplicate prevention','cross-session isolation','receipt lookup','invalid receipt','invalid menu/date/guests','CSRF rejection','admin isolation','authorized cancellation']},ensure_ascii=False))
