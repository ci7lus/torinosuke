# torinosuke

手っ取り早く Twitter の OAuth でアクセストークンを発行するためのツールです。

## 認証モードについて

PIN Auth と XAuth 両方のモードが使用できます。

### PIN Auth

デスクトップアプリケーションに多く用いられるタイプで、承認後に表示された PIN コードを用いて AT/ATS を取得するモードです。

### XAuth

かつて用いられていた、Twitter 公式アプリが内部で使用している非推奨の認証モードです。<br>
認証時にアカウントのパスワードを直接使用します。

## 免責事項

https://torinosuke.netlify.com/ にて公開されている torinosuke は [dist/\_redirects](./dist/_redirects) からもわかるように Netlify のルーティングを用いて Twitter 側の API に直接リクエストしているため、ホスト主である開発者はそこを通過した情報を把握することはできません。しかし、極力 XAuth を用いるのは避けるようにしてください。
