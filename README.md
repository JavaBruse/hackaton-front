```shell
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt-get install -y nodejs
sudo npm install -g @angular/cli
```

Коммит

```shell
git commit -m "message"
```

отправка комитов на сервер

```shell
git push
```

получение изменений с сервера

```shell
git pull
```

Запуск в режиме разработки.

```shell
ng serve
```

статус, добавить порт, применить настройки

```shell
sudo ufw status
sudo ufw allow 3000
sudo ufw enable
```

/////////////////////

1. Проверить текущую версию

В проекте выполни:

```shell
ng version
```

Увидишь версию Angular CLI и Angular (у тебя сейчас 19.2.14).

🔹 2. Обновить Angular CLI глобально

```shell
npm install -g @angular/cli@latest
```

🔹 3. Обновить Angular в проекте

В корне проекта:

```shell
ng update @angular/core@latest @angular/cli@latest
```

⚡ Angular CLI сам подскажет, какие ещё пакеты нужно подтянуть.
Например, может сказать про RxJS, TypeScript и Zone.js.

🔹 4. Обновить остальные Angular пакеты

Если используешь Angular Material, Forms и прочее:

```shell
ng update @angular/material@latest
```

🔹 5. Проверить и протестировать

После апдейта:

```shell
npm install
ng serve
```

🔹 6. Что важно:

Angular обновляется только мажорно (19 → 20) через ng update.

Иногда нужно почистить node_modules и package-lock.json, если конфликтуют зависимости:

```shell
rm -rf node_modules package-lock.json
npm install
```

Установка иконок для ангуляра.

```shell
npm install @fortawesome/angular-fontawesome@latest @fortawesome/free-solid-svg-icons@latest @fortawesome/fontawesome-svg-core@latest --legacy-peer-deps
```
