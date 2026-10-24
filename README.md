# Agent Bridge Relay

Publicación pública de `command.json` para la extensión **Agent Bridge** de AliceLabs.
Sin cuentas, sin sesiones, sin paneles: el repositorio es el canal.

- **Sitio**: https://alicelabs.site (página estática con las políticas)
- **Operador**: [@eddyflores100-lang](https://github.com/eddyflores100-lang)
- **Licencia**: MIT (ver `LICENSE`)

## Protocolo

El canal funciona como un par de ficheros versionados en `master`:

```
operador  ──commit──▶  command.json  ──▶  extensión (agent-408707)
operador  ◀──commit──  response.json ◀──  extensión (agent-408707)
```

1. El operador escribe `command.json` con un `cmd_seq` **monotónico creciente**
   y hace push a `master`.
2. La extensión hace poll del fichero en bruto (raw GitHub), detecta un
   `cmd_seq` mayor que el último ejecutado, y ejecuta la `action`.
3. La extensión escribe `response.json` con el resultado y lo commitea.
   Un `response.json` vacío (`{}`) significa "comando aún sin responder".

### Schema de `command.json`

```json
{
  "cmd_seq": 642,
  "action": "gettext",
  "args": { "selector": "body" }
}
```

| Campo     | Tipo   | Descripción                                              |
|-----------|--------|----------------------------------------------------------|
| `cmd_seq` | int    | Número de secuencia monotónico. Nunca reutilizar.        |
| `action`  | string | Acción a ejecutar (ver tabla).                           |
| `args`    | object | Argumentos específicos de la acción.                     |

### Acciones

| Acción      | Args típicos                  | Resultado (response.json)        |
|-------------|-------------------------------|----------------------------------|
| `gettext`   | `selector`                    | texto extraído del elemento      |
| `geturl`    | —                             | URL actual de la pestaña         |
| `switchtab` | índice o patrón de título     | confirmación de pestaña activa   |
| `navigate`  | `url`                         | confirmación de navegación       |

### Reglas de convivencia

- **Nunca** reescribir un `cmd_seq` ya usado: la extensión lo ignorará o lo
  re-ejecutará (duplicado).
- No editar `response.json` a mano: es la salida del agente.
- No tocar los ficheros de bounty mientras un bounty esté en curso
  (`frantic-bounty-*` son evidencias de trabajos entregados).

## Artefactos de bounties

Los trabajos completados por el agente se archivan por bounty:

| Fichero                          | Contenido                                  |
|----------------------------------|--------------------------------------------|
| `frantic-bounty-<n>-report.md`   | Informe legible del trabajo entregado       |
| `frantic-bounty-<n>-evidence.json` | Evidencia estructurada (IDs, timestamps)  |
| `frantic-bounty-<n>-send.*`      | Script usado para la entrega                |

## Seguridad

- Las claves API **nunca** se commitean: van por variables de entorno
  (`NITROSEND_API_KEY`, etc.). Las apariciones históricas quedaron
  redactadas en `frantic-bounty-139-*` / `-140-evidence.json` el 25-oct-2026
  y las claves se rotaron desde el panel correspondiente.
- El fichero `index.html` publica las políticas de privacidad y uso del sitio.

## Herramientas

### `tools/publish_command.py`

Publica un comando calculando `cmd_seq` automáticamente (último remoto + 1),
de modo que el operador nunca pisa una secuencia existente:

```bash
export GITHUB_TOKEN=ghp_xxx            # con permisos repo en este repo
python3 tools/publish_command.py --action navigate --args '{"url":"https://example.com"}'
python3 tools/publish_command.py --action gettext --args '{"selector":"h1"}' --dry-run
```
