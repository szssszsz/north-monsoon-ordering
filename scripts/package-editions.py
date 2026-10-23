"""Package each compiled edition with its own complete, credential-free source tree."""
from pathlib import Path
import json, shutil, subprocess, sys, zipfile

root=Path(__file__).resolve().parents[1]
destination=Path(sys.argv[1] if len(sys.argv)>1 else root/'releases').resolve()
destination.mkdir(parents=True,exist_ok=True)
files=subprocess.check_output(['git','ls-files','--cached','--others','--exclude-standard','-z'],cwd=root).decode().split('\0')
for key,name,entry in [('classic','北境季风_山河珍藏_独立完整包','https://north-monsoon-atelier.onrender.com/'),('reverie','北境季风_月下回响_独立完整包','https://north-monsoon-atelier.onrender.com/encore/')]:
    folder=destination/name
    if folder.exists():shutil.rmtree(folder)
    folder.mkdir(exist_ok=True)
    for relative in files:
        if not relative or relative.startswith(('.git/','.openai/','releases/')) or Path(relative).name.startswith('.env') and relative!='.env.example':continue
        source=root/relative
        if not source.is_file():continue
        target=folder/relative
        target.parent.mkdir(parents=True,exist_ok=True)
        shutil.copy2(source,target)
    (folder/'edition.json').write_text(json.dumps({'edition':key})+'\n')
    package=json.loads((folder/'package.json').read_text())
    package['name']='north-monsoon-'+key
    package['scripts']['build']='node scripts/compose-wind.mjs && vite build'
    package['scripts']['preview']='vite preview --host 127.0.0.1'
    (folder/'package.json').write_text(json.dumps(package,ensure_ascii=False,indent=2)+'\n')
    lock=json.loads((folder/'package-lock.json').read_text())
    lock['name']=package['name'];lock['packages']['']['name']=package['name']
    (folder/'package-lock.json').write_text(json.dumps(lock,ensure_ascii=False,indent=2)+'\n')
    built=root/'dist' if key=='classic' else root/'dist/encore'
    shutil.copytree(built,folder/'dist',dirs_exist_ok=True,ignore=shutil.ignore_patterns('encore') if key=='classic' else None)
    if key=='reverie':
        for ext in ['png','svg']:shutil.copy2(folder/f'public/encore-qr.{ext}',folder/f'public/ordering-qr.{ext}')
    guide=f'''# {name}\n\n在线入口：{entry}\n\n这是可以独立运行、独立修改、独立部署的一整版，不依赖另一版的目录或资源。\n\n## 预览\n\n安装 Node.js 24 或更高版本，在此目录执行：\n\n```sh\nnpm ci\nnpm run preview\n```\n\n浏览器打开终端显示的本机地址。预览使用已构建的 dist；重新构建使用 `npm run build`。dist 也可放在任意静态 HTTP 服务中预览；请通过 HTTP 地址访问，ES 模块不支持双击 file:// 运行。\n\n## 订单服务\n\n当前线上两版沿用同一订单 API 和管理后台。纯静态预览用于查看界面与动效；预约提交、订单查询需要部署 /api/* 反向代理。现网规则为：/api/* 转发到 https://north-monsoon-banquet.onrender.com/api/*，/admin 重写到 /admin.html。若独立搭建后端，按 .env.example 配置 PostgreSQL 等变量，再执行 npm start。\n\n完整源码在 src、server、scripts、test；成品资源在 dist。包内没有 node_modules、管理员口令、数据库连接串或真实订单。\n\n## 版本\n\n默认 edition.json={key}。本包默认 build 仅生成这一版。保留 scripts/build-editions.mjs 作为可选的双版构建工具，但本包 dist 中只有本版。\n'''
    (folder/'使用说明.md').write_text(guide)
    manifest={str(p.relative_to(folder)):__import__('hashlib').sha256(p.read_bytes()).hexdigest() for p in folder.rglob('*') if p.is_file() and p.name!='SHA256.json'}
    (folder/'SHA256.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
    archive=destination/(name+'.zip')
    with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=8) as z:
        for p in sorted(folder.rglob('*')):
            if p.is_file():z.write(p,p.relative_to(destination))
    with zipfile.ZipFile(archive) as z:assert z.testzip() is None
    print(json.dumps({'edition':key,'archive':str(archive),'files':len(manifest)+1,'bytes':archive.stat().st_size},ensure_ascii=False))
