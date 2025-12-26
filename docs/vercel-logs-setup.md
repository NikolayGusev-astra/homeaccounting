# Настройка получения логов деплоя Vercel

## Способ 1: Через скрипт (рекомендуется)

### Шаг 1: Получите Vercel Token

1. Откройте https://vercel.com/account/tokens
2. Нажмите "Create Token"
3. Дайте токену имя (например, "Deploy Logs")
4. Скопируйте токен

### Шаг 2: Установите токен

```bash
export VERCEL_TOKEN=your_token_here
```

Или добавьте в `.env.local`:
```
VERCEL_TOKEN=your_token_here
```

### Шаг 3: Запустите скрипт

```bash
npm run vercel:logs
# или
node scripts/check-vercel-deploy.js
```

Скрипт покажет:
- Статус последнего деплоя
- URL деплоя
- Логи сборки
- Сохранит логи в `.cursor/vercel-deploy.log`

## Способ 2: Через Vercel CLI

### Установка

```bash
npm install -g vercel
# или
bun add -g vercel
```

### Авторизация

```bash
vercel login
```

### Получение логов

```bash
# Список деплоев
vercel list

# Логи последнего деплоя
vercel logs

# Логи конкретного деплоя
vercel logs [deployment-url]
```

## Способ 3: Через Vercel Dashboard

1. Откройте https://vercel.com/dashboard
2. Выберите проект `homeaccounting`
3. Перейдите в раздел "Deployments"
4. Выберите нужный деплой
5. Нажмите "View Function Logs" или "View Build Logs"

## Автоматическая проверка после коммита

Можно настроить GitHub Actions для автоматической проверки статуса деплоя:

```yaml
# .github/workflows/check-deploy.yml
name: Check Vercel Deploy
on:
  push:
    branches: [master]

jobs:
  check-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Check deploy status
        run: |
          npm run vercel:logs
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
```

## Примечания

- Токен Vercel имеет права доступа к вашему аккаунту - храните его в безопасности
- Не коммитьте токен в git (уже в .gitignore)
- Логи сохраняются в `.cursor/vercel-deploy.log` для последующего анализа

