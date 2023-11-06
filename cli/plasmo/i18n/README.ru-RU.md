<p align="center">
  <a href="https://plasmo.com">
    <img alt="plasmo logo" width="75%" src="https://www.plasmo.com/assets/banner-black-on-white.png" />
  </a>
</p>

<p align="center">
  <a aria-label="License" href="/cli/plasmo/LICENSE">
    <img alt="See License" src="https://img.shields.io/npm/l/plasmo"/>
  </a>
  <a aria-label="NPM" href="https://www.npmjs.com/package/plasmo">
    <img alt="NPM Install" src="https://img.shields.io/npm/v/plasmo?logo=npm"/>
  </a>
  <a aria-label="Twitter" href="https://www.twitter.com/plasmohq">
    <img alt="Follow PlasmoHQ on Twitter" src="https://img.shields.io/twitter/follow/plasmohq?logo=twitter"/>
  </a>
  <a aria-label="Twitch Stream" href="https://www.twitch.tv/plasmohq">
    <img alt="Watch our Live DEMO every Friday" src="https://img.shields.io/twitch/status/plasmohq?logo=twitch&logoColor=white"/>
  </a>
  <a aria-label="Discord" href="https://www.plasmo.com/s/d">
    <img alt="Join our Discord for support and chat about our projects" src="https://img.shields.io/discord/946290204443025438?logo=discord&logoColor=white"/>
  </a>
</p>

<p align="center">
  <a href="/cli/plasmo/README.md">English</a> | <a href="/cli/plasmo/i18n/README.zh-CN.md">简体中文</a> | <a href="/cli/plasmo/i18n/README.vi-VN.md">Tiếng Việt</a> | <a href="/cli/plasmo/i18n/README.de-DE.md">Deutsch</a> | <a href="/cli/plasmo/i18n/README.fr-FR.md">French</a> | <a href="/cli/plasmo/i18n/README.id-ID.md">Indonesian</a> | Русский | <a href="/cli/plasmo/i18n/README.tr-TR.md">Turkish</a> | <a href="/cli/plasmo/i18n/README.ja-JP.md">日本語</a> | <a href="/cli/plasmo/i18n/README.ko-KR.md">한국어</a>
</p>

# Plasmo Framework

Фреймворк [Plasmo](https://www.plasmo.com/) это SDK для разработки кроссплатформерных расширений для браузера, созданное хакерами для хакеров. Разрабатывайте расширения и перестаньте беспокоится о конфигах и специфичных особенностях браузерных расширений.

> Это как [Next.js](https://nextjs.org/) для браузерных расширений!

![CLI Demo](https://www.plasmo.com/assets/plasmo-cli-demo.gif)

## Главные особенности

- Первоклассная поддержка [React](https://reactjs.org/) + [Typescript](https://www.typescriptlang.org/)
- [Декларативная настройка "manifest.json" (MV3)](https://docs.plasmo.com/framework#where-is-the-manifestjson-file)
- [Контент скрипты с поддержкой UI](https://docs.plasmo.com/csui)
- [Вкладки расширения](https://docs.plasmo.com/framework/tab-pages)
- Активная перезагрузка + React HMR
- [`.env*` файлы](https://docs.plasmo.com/framework/env)
- [API для хранения информации](https://docs.plasmo.com/framework/storage)
- [API для общения между различными частями расширения](https://docs.plasmo.com/framework/messaging)
- [Подключение удаленного кода](https://docs.plasmo.com/framework/remote-code) (e.g., for Google Analytics)
- Поддержка [кроссплатфоменности и различных видов манифеста](https://docs.plasmo.com/framework/workflows/build#with-specific-target)
- [Автоматическое развертывание с помощью BPP](https://docs.plasmo.com/framework/workflows/submit)
- Дополнительная поддержка [Svelte](https://github.com/PlasmoHQ/with-svelte) и [Vue](https://github.com/PlasmoHQ/with-vue)

И многое, многое другое! 🚀

## Системные требования

- Node.js 16.x или выше
- MacOS, Windows, или Linux
- (Настоятельно рекомендуется) [pnpm](https://pnpm.io/)

## Примеры

У нас есть примеры, показывающие, как можно использовать Plasmo с [Firebase Authentication](https://github.com/PlasmoHQ/examples/tree/main/with-firebase-auth), [Redux](https://github.com/PlasmoHQ/examples/tree/main/with-redux), [Supabase authentication](https://github.com/PlasmoHQ/examples/tree/main/with-supabase), [Tailwind](https://github.com/PlasmoHQ/examples/tree/main/with-tailwindcss), и многое другое. Чтобы посмотреть, [посетите наш репозиторий примеров](https://github.com/PlasmoHQ/examples).

## Документация

Ознакомьтесь с [documentation](https://docs.plasmo.com/) чтобы получить более глубокое представление о Plasmo Framework.

## Книга расширений браузера

Для более подробного ознакомления с тем, как работают расширения браузера и как их разрабатывать, мы настоятельно рекомендуем новую книгу Мэтта Фрисби ["Building Browser Extensions"](https://buildingbrowserextensions.com/plasmo)

## Использование

```
pnpm create plasmo example-dir
cd example-dir
pnpm dev
```

Дальнейший путь наполнен возможностями.

- Изменение Popup в `popup.tsx`
- Редактирование страницы настроек расширения в `options.tsx`
- Настройка контент скриптов в `content.ts`
- Изменение Background service worker в `background.ts`

### Каталоги

Вы также можете структурировать эти файлы в собственных каталогах:

```
папка-расширения
├───assets
|   └───icon.png
├───popup
|   ├───index.tsx
|   └───button.tsx
├───options
|   ├───index.tsx
|   ├───utils.ts
|   └───input.tsx
├───contents
|   ├───site-one.ts
|   ├───site-two.ts
|   └───site-three.ts
...
```

Наконец, вы также можете избежать размещения исходного кода в вашем корневом каталоге, поместив их в подкаталог `src`, [следуя этому руководству](https://docs.plasmo.com/framework/customization/src). Обратите внимание что `assets` и другие конфигурационные файлы по-прежнему должны находиться в корневом каталоге.

## Поддерживаемые браузеры

Чтобы просмотреть список поддерживаемых браузеров, [пожалуйста, обратитесь к нашей документации здесь](https://docs.plasmo.com/framework/workflows/faq#what-are-the-officially-supported-browser-targets).

## Сообщество

Сообщество Plasmo можно найти в [Discord](https://www.plasmo.com/s/d). Это подходящий канал для получения помощи в использовании Plasmo Framework.

## Внести свой вклад

Пожалуйста, ознакомьтесь с [рекомендациями по контрибьютингу](https://github.com/PlasmoHQ/plasmo/blob/main/.github/CONTRIBUTING.md) чтобы узнать больше.

Большое спасибо всем нашим удивительным [помощникам](https://github.com/PlasmoHQ/plasmo/graphs/contributors) ❤️

Не стесняйтесь присоединиться к веселью и отправить PR!

### Plasmo Framework

<a href="https://github.com/PlasmoHQ/plasmo/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=PlasmoHQ/plasmo" />
</a>

### [Примеры Plasmo](https://github.com/PlasmoHQ/examples)

<a href="https://github.com/PlasmoHQ/examples/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=PlasmoHQ/examples" />
</a>

### [Plasmo Storage](https://github.com/PlasmoHQ/storage)

<a href="https://github.com/PlasmoHQ/storage/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=PlasmoHQ/storage" />
</a>

### [Browser Platform Publisher](https://github.com/PlasmoHQ/bpp)

<a href="https://github.com/PlasmoHQ/bpp/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=PlasmoHQ/bpp" />
</a>

## Дисклеймер

В настоящее время Plasmo является альфа-версией программного обеспечения, и некоторые вещи могут меняться от версии к версии, поэтому, пожалуйста, будьте внимательны и используйте его на свой страх и риск.

# Лицензия

[MIT](https://github.com/PlasmoHQ/plasmo/blob/main/LICENSE) ⭐ [Plasmo](https://www.plasmo.com)
