# Собирает автономную страницу agash-mebel.html из src/App.jsx без Node.js.
# React, lucide-react, Tailwind и Babel подключаются с CDN; JSX компилируется в браузере.
# Запуск: powershell -ExecutionPolicy Bypass -File .\build-standalone.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$utf8 = New-Object System.Text.UTF8Encoding($false)

$app = [IO.File]::ReadAllText((Join-Path $root "src\App.jsx"), $utf8)
$app = [regex]::Replace($app, 'import\s*\{([^}]*)\}\s*from\s*"react";', 'const {$1} = React;')
$app = [regex]::Replace($app, 'import\s*\{([^}]*)\}\s*from\s*"lucide-react";', 'const {$1} = LucideReact;')
$app = $app.Replace("export default function App", "function App")
if ($app -match '(?m)^\s*(import|export)\s') { throw "В App.jsx остались import/export, которые сборщик не умеет переписать." }
if ($app.Contains("</script")) { throw "В App.jsx встречается </script>, это сломает встраивание." }

$template = @'
<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Ағаш — кухни и шкафы-купе на заказ в Астане</title>
<meta name="description" content="Кухни и шкафы-купе под ваши размеры. Конфигуратор с чертежом и ценой в тенге, заявка в WhatsApp.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600;700&family=Unbounded:wght@500;600&display=swap" rel="stylesheet">
<style>
  html, body { margin: 0; background: #F5F5F4; }
  @media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) body { background: #0C0A09; } }
  :root[data-theme="dark"] body { background: #0C0A09; }
  #boot { font: 16px system-ui, sans-serif; color: #57534E; padding: 40px 20px; text-align: center; }
</style>
<script src="https://cdn.tailwindcss.com/3.4.17"></script>
<script>
  tailwind.config = {
    darkMode: ["variant", [
      "@media (prefers-color-scheme: dark) { &:not([data-theme=light] *) }",
      "&:is([data-theme=dark] *)"
    ]]
  };
</script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js"></script>
<script>window.react = window.React; /* UMD-сборка lucide-react ищет React под этим именем */</script>
<script src="https://cdn.jsdelivr.net/npm/lucide-react@0.383.0/dist/umd/lucide-react.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.26.2/babel.min.js"></script>
</head>
<body>
<div id="root"><p id="boot">Загружаем конфигуратор…</p></div>
<script type="text/babel" data-presets="react">
/*__APP__*/

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
</script>
</body>
</html>
'@

$html = $template.Replace("/*__APP__*/", $app)
$out = Join-Path $root "agash-mebel.html"
[IO.File]::WriteAllText($out, $html, $utf8)
Write-Host ("Готово: {0} ({1:N0} КБ)" -f $out, ((Get-Item $out).Length / 1KB))
