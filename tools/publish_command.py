#!/usr/bin/env python3
"""Publica un command.json en eddyflores100-lang/agent-bridge-relay con cmd_seq seguro.

Calcula el cmd_seq como (ultimo comando remoto) + 1 leyendo el command.json actual
via API de GitHub, de modo que nunca se pisa una secuencia ya usada.

Uso:
  export GITHUB_TOKEN=ghp_xxx
  python3 tools/publish_command.py --action navigate --args '{"url":"https://example.com"}'
  python3 tools/publish_command.py --action gettext --args '{"selector":"h1"}' --dry-run

Acciones conocidas: gettext, geturl, switchtab, navigate.
"""
import argparse, base64, json, sys, urllib.request

OWNER_REPO = "eddyflores100-lang/agent-bridge-relay"
API = f"https://api.github.com/repos/{OWNER_REPO}/contents/command.json"
KNOWN_ACTIONS = {"gettext", "geturl", "switchtab", "navigate"}

def gh(method: str, url: str, payload: dict | None = None, token: str = ""):
    data = json.dumps(payload).encode() if payload is not None else None
    r = urllib.request.Request(url, data=data, method=method)
    r.add_header("Authorization", f"token {token}")
    r.add_header("Accept", "application/vnd.github+json")
    if data:
        r.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(r) as resp:
        body = resp.read()
        return json.loads(body) if body else {}

def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--action", required=True, choices=sorted(KNOWN_ACTIONS))
    ap.add_argument("--args", default="{}", help="JSON con los argumentos de la accion")
    ap.add_argument("--dry-run", action="store_true", help="muestra el payload y no publica")
    ap.add_argument("--branch", default="master")
    a = ap.parse_args()

    import os
    token = os.environ.get("GITHUB_TOKEN", "")
    if not token and not a.dry_run:
        sys.exit("ERROR: exporta GITHUB_TOKEN con permisos en el repo")

    try:
        args_obj = json.loads(a.args)
    except json.JSONDecodeError as e:
        sys.exit(f"ERROR: --args no es JSON valido: {e}")

    # leer command.json remoto (sha + cmd_seq actual)
    cur = gh("GET", f"{API}?ref={a.branch}", token=token) if token else {}
    sha = cur.get("sha")
    try:
        current = json.loads(base64.b64decode(cur.get("content", "e30=")))
    except Exception:
        current = {}
    last_seq = int(current.get("cmd_seq", 0))
    cmd = {"cmd_seq": last_seq + 1, "action": a.action, "args": args_obj}

    print(f"cmd_seq remoto actual: {last_seq} -> nuevo: {cmd['cmd_seq']}")
    print(json.dumps(cmd, indent=2, ensure_ascii=False))
    if a.dry_run:
        print("(dry-run: no publicado)")
        return
    if not sha:
        sys.exit("ERROR: no se pudo leer command.json remoto (sha vacio) — abortado")

    gh("PUT", API, {
        "message": f"bridge #{cmd['cmd_seq']} {a.action}",
        "content": base64.b64encode(
            json.dumps(cmd, indent=2, ensure_ascii=False).encode()).decode(),
        "sha": sha,
        "branch": a.branch,
    }, token=token)
    print(f"Publicado: bridge #{cmd['cmd_seq']} {a.action}")

if __name__ == "__main__":
    main()
