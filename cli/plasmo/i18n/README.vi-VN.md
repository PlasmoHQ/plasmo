<p align="center">
  <a href="https://plasmo.com">
    <img alt="plasmo logo" width="75%" src="https://www.plasmo.com/assets/banner-black-on-white.png" />
  </a>
</p>

<p align="center">
  <a aria-label="License" href="/cli/plasmo/LICENSE">
    <img alt="Xem License" src="https://img.shields.io/npm/l/plasmo"/>
  </a>
  <a aria-label="NPM" href="https://www.npmjs.com/package/plasmo">
    <img alt="NPM Install" src="https://img.shields.io/npm/v/plasmo?logo=npm"/>
  </a>
  <a aria-label="Twitter" href="https://www.twitter.com/plasmohq">
    <img alt="Theo dõi PlasmoHQ trên Twitter" src="https://img.shields.io/twitter/follow/plasmohq?logo=twitter"/>
  </a>
  <a aria-label="Twitch Stream" href="https://www.twitch.tv/plasmohq">
    <img alt="Xem trực tiếp DEMO mỗi thứ Sáu" src="https://img.shields.io/twitch/status/plasmohq?logo=twitch&logoColor=white"/>
  </a>
  <a aria-label="Discord" href="https://www.plasmo.com/s/d">
    <img alt="Tham gia Discord để chat về Plasmo" src="https://img.shields.io/discord/946290204443025438?logo=discord&logoColor=white"/>
  </a>
</p>

<p align="center">
  <a href="/cli/plasmo/README.md">English</a> | <a href="/cli/plasmo/i18n/README.zh-CN.md">简体中文</a> | Tiếng Việt | <a href="/cli/plasmo/i18n/README.de-DE.md">Deutsch</a> | <a href="/cli/plasmo/i18n/README.fr-FR.md">French</a>
</p>

# Plasmo Framework

[Plasmo](https://www.plasmo.com/) là một framework dùng để xây dựng ứng dụng mở rộng cho trình duyệt web (browser extension) với nhiều tính năng tối ưu hóa, tạo bởi hackers cho hackers. Xây dựng sản phẩm mà không phải lo lắng về config và những dị thù khi làm việc với extension.

> Giống như [Next.js](https://nextjs.org/) cho extension!

![CLI Demo](https://www.plasmo.com/assets/plasmo-cli-demo.gif)

## Tính năng

- [React](https://reactjs.org/) + [Typescript](https://www.typescriptlang.org/)
- [Tự động hóa `manifest.json` với MV3](https://docs.plasmo.com/#where-is-the-manifestjson-file)
- Tự động reload trình duyệt
- [`.env*` file](https://docs.plasmo.com/browser-extension/env)
- [Content Scripts UI](https://docs.plasmo.com/csui)
- [Gói mã nguồn online](https://docs.plasmo.com/workflows/remote-code) (e.g for gtag4)
- [Tự động xuất bản với BPP](https://docs.plasmo.com/workflows/submit)
- [Tạo extension cho mọi trình duyệt](https://docs.plasmo.com/workflows/build#with-specific-target)
- Dùng với [Svelte](https://github.com/PlasmoHQ/with-svelte) hoặc [Vue](https://github.com/PlasmoHQ/with-vue)
- Và nhiều hơn nữa! 🚀

## Yêu cầu hệ thống

- Node.js 16.x trở lên
- MacOS, Windows, hoặc Linux
- (Khuyến khích) [pnpm](https://pnpm.io/)

## Ví dụ

Chúng tôi có các ví dụ giới thiệu cách bạn có thể sử dụng Plasmo với [Firebase Authentication](https://github.com/PlasmoHQ/examples/tree/main/with-firebase-auth), [Redux](https://github.com/PlasmoHQ/examples/tree/main/with-redux), [Supabase authentication](https://github.com/PlasmoHQ/examples/tree/main/with-supabase), [Tailwind](https://github.com/PlasmoHQ/examples/tree/main/with-tailwindcss), và nhiều hơn nữa. Để xem chúng, hãy [truy cập kho ví dụ của chúng tôi](https://github.com/PlasmoHQ/examples).

## Tài liệu

Xem [tài liệu](https://docs.plasmo.com/) để nhìn chuyên sâu hơn.

## Cách sử dụng

```
pnpm create plasmo example-dir
cd example-dir
pnpm dev
```

Con đường phía trước còn nhiều trông gai.

- Thay đổi popup trong `popup.tsx`
- Thay đổi trang Options trong `options.tsx`
- Thay đổi Content script trong `content.ts`
- Thay đổi dịch vụ nền (Background service worker) trong `background.ts`

### Thư mục

Bạn có thể sắp xếp các tệp này trong thư mục riêng của chúng:

```
ext-dir
├───assets
|   └───icon512.png
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

Cuối cùng, bạn cũng có thể tránh đặt mã nguồn vào thư mục gốc của mình bằng cách đặt chúng vào thư mục con `src`, [làm theo hướng dẫn này](https://docs.plasmo.com/customization/src). Lưu ý, thư mục `assets` và các tệp config vẫn cần phải ở trong thư mục gốc.

## Cộng đồng

Cộng đồng Plasmo có thể được tìm thấy trên [Discord](https://www.plasmo.com/s/d). Đây là kênh thích hợp để nhận trợ giúp về việc sử dụng Plasmo Framework.

[Quy tắc ứng xử](./.github/CODE_OF_CONDUCT.md) của chúng tôi áp dụng cho tất cả các kênh cộng đồng của Plasmo.

## Đóng góp

Vui lòng xem [hướng dẫn đóng góp](https://github.com/PlasmoHQ/plasmo/blob/main/.github/CONTRIBUTING.md) để tìm hiểu thêm.

## Tuyên bố từ chối trách nhiệm

Plasmo hiện là phần mềm alpha và một số thứ có thể thay đổi từ phiên bản này sang phiên bản khác. Xin lưu ý, Plasmo sẽ không chịu trách nhiệm nếu bạn gặp rủi ro khi xử dụng phần mềm này.

# Giấy phép bản quyền

[MIT](https://github.com/PlasmoHQ/plasmo/blob/main/LICENSE) ⭐ [Plasmo](https://www.plasmo.com)
