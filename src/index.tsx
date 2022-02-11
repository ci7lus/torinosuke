import * as React from "react"
import { useState } from "react"
import { render } from "react-dom"
import { OAuth } from "oauth"
import axios from "axios"
import { apps } from "./apps"
import { ChevronUp, Heart } from "react-feather"

const client = axios.create({
  validateStatus: () => {
    return true
  },
  responseType: "text",
})

const App: React.FC<{}> = () => {
  // ぎゃー！
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState("")

  const [useXAuth, setUseXAuth] = useState(false)

  const [consumerKey, setConsumerKey] = useState("")
  const [consumerSecret, setConsumerSecret] = useState("")

  const [isConsumerLocked, setIsConsumerLocked] = useState(false)
  const [isResetLocked, setIsResetLocked] = useState(false)
  const [isDefinedApp, setIsDefinedApp] = useState(false)

  const [screenName, setScreenName] = useState("")
  const [password, setPassword] = useState("")
  const [pin, setPin] = useState("")

  const [OAuthToken, setOAuthToken] = useState("")
  const [OAuthTokenSecret, setOAuthTokenSecret] = useState("")

  const [isPinUsing, setIsPinUsing] = useState(false)
  const [isOAuthTokenGetting, setIsOAuthTokenGetting] = useState(false)

  const [accessToken, setAccessToken] = useState("")
  const [accessTokenSecret, setAccessTokenSecret] = useState("")

  const clearMessage = () => {
    setMessage("")
    setMessageType("")
  }

  const onResetClick = () => {
    setIsConsumerLocked(false)
    setOAuthToken("")
    setOAuthTokenSecret("")
    setAccessToken("")
    setAccessTokenSecret("")
    setPin("")
  }

  const onApplicationSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsConsumerLocked(true)
    setIsResetLocked(true)
    const auth = new OAuth(
      "https://api.twitter.com/oauth/request_token",
      "https://api.twitter.com/oauth/access_token",
      consumerKey,
      consumerSecret,
      "1.0a",
      "oob",
      "HMAC-SHA1"
    )
    if (useXAuth) {
      const form = new URLSearchParams({
        x_auth_mode: "client_auth",
        x_auth_username: screenName,
        x_auth_password: password,
      })
      const header = auth.authHeader(
        `https://api.twitter.com/oauth/access_token?x_auth_mode=client_auth&x_auth_username=${screenName}&x_auth_password=${password}`,
        "",
        "",
        "POST"
      )
      const r = await client.post<string>("/oauth/access_token", form, {
        headers: {
          Authorization: header,
        },
      })
      if (r.status === 200) {
        const result: Map<string, string> = new Map(
          r.data.split("&").map((datum) => {
            return datum.split("=") as [string, string]
          })
        )
        const token = result.get("oauth_token")
        const secret = result.get("oauth_token_secret")
        if (token && secret) {
          setAccessToken(token)
          setAccessTokenSecret(secret)
          clearMessage()
        } else {
          setMessage(
            `認証には成功しましたが、アクセストークンが見つかりませんでした。`
          )
          setMessageType("danger")
        }
      } else {
        setMessage(`認証に失敗しました: ${JSON.stringify(r.data) || r.status}`)
        setMessageType("danger")
        setIsConsumerLocked(false)
      }
    } else {
      setIsOAuthTokenGetting(true)
      const header = auth.authHeader(
        "https://api.twitter.com/oauth/request_token?oauth_callback=oob",
        "",
        "",
        "POST"
      )
      const r = await client.post<string>("/oauth/request_token", null, {
        headers: {
          Authorization: header,
        },
      })
      if (r.status === 200) {
        const result: Map<string, string> = new Map(
          r.data.split("&").map((datum) => {
            return datum.split("=") as [string, string]
          })
        )
        const token = result.get("oauth_token")
        const secret = result.get("oauth_token_secret")
        if (token && secret) {
          setOAuthToken(token)
          setOAuthTokenSecret(secret)
          clearMessage()
          window.open(
            `https://api.twitter.com/oauth/authorize?oauth_token=${token}`,
            "_blank"
          )
        } else {
          setMessage(
            `認証ページ情報の取得には成功しましたが、認証開始に必要なパラメータが見つかりませんでした。`
          )
          setMessageType("danger")
        }
      } else {
        setMessage(
          `認証ページ情報の取得に失敗しました: ${
            JSON.stringify(r.data) || r.status
          }`
        )
        setMessageType("danger")
        setIsConsumerLocked(false)
      }
      setIsOAuthTokenGetting(false)
    }
    setIsResetLocked(false)
  }
  const onPinSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPinUsing(true)
    setIsResetLocked(true)
    if (!OAuthToken.length || !OAuthTokenSecret.length || !pin.length) {
      setIsResetLocked(false)
      return
    }
    const auth = new OAuth(
      "https://api.twitter.com/oauth/request_token",
      "https://api.twitter.com/oauth/access_token",
      consumerKey,
      consumerSecret,
      "1.0a",
      "oob",
      "HMAC-SHA1",
      undefined
    )
    const header = auth.authHeader(
      `https://api.twitter.com/oauth/access_token?oauth_verifier=${pin}`,
      OAuthToken,
      OAuthTokenSecret,
      "POST"
    )
    const r = await client.post<string>("/oauth/access_token", null, {
      headers: {
        Authorization: header,
      },
    })
    if (r.status === 200) {
      const result: Map<string, string> = new Map(
        r.data.split("&").map((datum) => {
          return datum.split("=") as [string, string]
        })
      )
      const token = result.get("oauth_token")
      const secret = result.get("oauth_token_secret")
      if (token && secret) {
        setAccessToken(token)
        setAccessTokenSecret(secret)
        setOAuthToken("")
        setOAuthTokenSecret("")
        clearMessage()
      } else {
        setMessage(
          `認証には成功しましたが、アクセストークンが見つかりませんでした。`
        )
        setMessageType("danger")
      }
    } else {
      setMessage(`認証に失敗しました: ${JSON.stringify(r.data) || r.status}`)
      setMessageType("danger")
    }
    setIsResetLocked(false)
    setIsPinUsing(false)
  }

  return (
    <>
      <div className="section">
        <div className="container">
          <h1 className="title">Torinosuke</h1>
          <p>
            手っ取り早く Twitter の OAuth
            でアクセストークンを発行するためのツールです。
          </p>
          <hr></hr>
          {0 < message.length && (
            <div className={`notification is-${messageType}`}>{message}</div>
          )}
          <div className="card">
            <div className="card-header">
              <div className="card-header-title">
                アプリケーションを設定する
              </div>
            </div>
            <div className="card-content">
              <label className="label">認証モード</label>
              <div className="buttons has-addons">
                <button
                  className={`button ${!useXAuth && "is-primary is-selected"}`}
                  disabled={isConsumerLocked}
                  onClick={() => {
                    setUseXAuth(false)
                  }}
                >
                  PIN Auth
                </button>
                <button
                  className={`button ${useXAuth && "is-warning is-selected"}`}
                  disabled={isConsumerLocked}
                  onClick={() => {
                    setUseXAuth(true)
                  }}
                >
                  XAuth
                </button>
              </div>
              {useXAuth && (
                <div className="notification">
                  XAuth
                  は公式アプリの情報を用いて認証を試みるときのみ用いることができるモードです。Twitterのユーザー名（スクリーンネーム）とパスワードを用いて認証をします。当サービスはこの情報をできる限り保持しないように作っていますが、利用はあまりおすすめできません。
                  <br />
                  また、XAuth
                  での認証には基本的に一時パスワード（仮コード）を用います。
                </div>
              )}
              <form onSubmit={onApplicationSubmit}>
                <div className="field">
                  <label className="label">コンシューマーキー</label>
                  <div className="control">
                    <input
                      className={`input ${isDefinedApp && "is-success"}`}
                      type="text"
                      placeholder="Consumer Key"
                      required
                      value={consumerKey}
                      disabled={isConsumerLocked}
                      onChange={(e) => {
                        if (!isConsumerLocked) {
                          setConsumerKey(e.target.value)
                          setIsDefinedApp(false)
                        }
                      }}
                    />
                  </div>
                  <p className="help">コンシューマーキーを入力してください。</p>
                </div>
                <div className="field">
                  <label className="label">コンシューマーシークレット</label>
                  <div className="control">
                    <input
                      className={`input ${isDefinedApp && "is-success"}`}
                      type="text"
                      placeholder="Consumer Secret"
                      required
                      value={consumerSecret}
                      disabled={isConsumerLocked}
                      onChange={(e) => {
                        if (!isConsumerLocked) {
                          setConsumerSecret(e.target.value)
                          setIsDefinedApp(false)
                        }
                      }}
                    />
                  </div>
                  <p className="help">
                    コンシューマーシークレットを入力してください。
                  </p>
                </div>
                {useXAuth && (
                  <>
                    <div className="field">
                      <label className="label">スクリーンネーム</label>
                      <div className="control">
                        <input
                          className="input"
                          type="text"
                          placeholder="Screen Name"
                          required={useXAuth}
                          value={screenName}
                          disabled={isConsumerLocked}
                          onChange={(e) => {
                            if (!isConsumerLocked) {
                              setScreenName(e.target.value)
                            }
                          }}
                        />
                      </div>
                      <p className="help">
                        ユーザー名（スクリーンネーム）を入力してください。
                      </p>
                    </div>
                    <div className="field">
                      <label className="label">パスワード</label>
                      <div className="control">
                        <input
                          className="input"
                          type="password"
                          placeholder="Password"
                          required={useXAuth}
                          value={password}
                          disabled={isConsumerLocked}
                          onChange={(e) => {
                            if (!isConsumerLocked) {
                              setPassword(e.target.value)
                            }
                          }}
                        />
                      </div>
                      <p className="help">パスワードを入力してください。</p>
                    </div>
                  </>
                )}
                <div className="app-buttons">
                  <div className="buttons">
                    <button
                      className={`button is-info ${
                        isOAuthTokenGetting && "is-loading"
                      }`}
                      type="submit"
                      disabled={isConsumerLocked}
                    >
                      認証
                    </button>
                    <button
                      className="button is-danger"
                      type="reset"
                      disabled={isResetLocked}
                      onClick={onResetClick}
                    >
                      やりなおす
                    </button>
                  </div>
                  <div
                    className={`dropdown is-right is-up ${
                      !isConsumerLocked && "is-hoverable"
                    }`}
                  >
                    <div className="dropdown-trigger">
                      <button
                        className="button is-right"
                        aria-haspopup="true"
                        aria-controls="dropdown-menu"
                        type="button"
                        disabled={isConsumerLocked}
                      >
                        <span>定義済みアプリから選ぶ</span>
                        <span className="icon is-small">
                          <ChevronUp />
                        </span>
                      </button>
                    </div>
                    <div
                      className="dropdown-menu"
                      id="dropdown-menu"
                      role="menu"
                    >
                      <div className="dropdown-content">
                        {apps.map((app) => (
                          <a
                            key={app.name}
                            className="dropdown-item"
                            onClick={() => {
                              if (!isConsumerLocked) {
                                setConsumerKey(app.ck)
                                setConsumerSecret(app.cs)
                                setIsDefinedApp(true)
                              }
                            }}
                          >
                            {app.name}&nbsp;
                            {app.isPin && (
                              <span className="tag is-success is-normal is-right">
                                PIN
                              </span>
                            )}
                            &nbsp;
                            {app.isOfficial && (
                              <span className="tag is-link is-normal">
                                Official
                              </span>
                            )}
                            &nbsp;
                            {app.isDeprecated && (
                              <span className="tag is-danger is-normal">
                                Deprecated
                              </span>
                            )}
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                {0 < OAuthToken.length && (
                  <a
                    className={`button is-primary ${
                      0 < accessToken.length && "is-disabled"
                    }`}
                    href={`https://api.twitter.com/oauth/authorize?oauth_token=${OAuthToken}`}
                    target="_blank"
                  >
                    認証用リンク
                  </a>
                )}
              </form>
            </div>
          </div>
          {!useXAuth && (
            <div className="card">
              <div className="card-header">
                <div className="card-header-title">PIN を入力する</div>
              </div>
              <div className="card-content">
                <form onSubmit={onPinSubmit}>
                  <div className="field">
                    <label className="label">PIN</label>
                    <div className="control">
                      <input
                        className="input"
                        type="string"
                        required
                        placeholder="PIN"
                        value={pin}
                        disabled={
                          !isConsumerLocked || Boolean(accessToken.length)
                        }
                        onChange={(e) => {
                          setPin(e.target.value)
                        }}
                      />
                    </div>
                    <p className="help">
                      表示された PIN コード（数字7桁）を入力してください。
                    </p>
                  </div>
                  <div>
                    <button
                      className={`button is-info ${isPinUsing && "is-loading"}`}
                      disabled={
                        !isConsumerLocked ||
                        Boolean(accessToken.length) ||
                        isPinUsing
                      }
                      type="submit"
                    >
                      認証情報を取得
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-header">
              <div className="card-header-title">認証情報</div>
            </div>
            <div className="card-content">
              <div className="field">
                <label className="label">アクセストークン</label>
                <div className="control">
                  <input
                    className="input"
                    type="string"
                    placeholder="Access Token"
                    value={accessToken}
                    disabled={!accessToken.length}
                    readOnly
                  />
                </div>
              </div>
              <div className="field">
                <label className="label">アクセストークンシークレット</label>
                <div className="control">
                  <input
                    className="input"
                    type="string"
                    placeholder="Access Token Secret"
                    value={accessTokenSecret}
                    disabled={!accessTokenSecret.length}
                    readOnly
                  />
                </div>
              </div>
              <div>
                <p className="is-warinng">
                  アクセストークンを不用意に他者に共有しないでください！
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <footer className="footer">
        <div className="content has-text-centered">
          <p>
            <strong>torinosuke</strong> made with <Heart size="12" />.<br />
            <a href="https://github.com/ci7lus/torinosuke" target="_blank">
              source code
            </a>
            &nbsp;is licensed&nbsp;
            <a
              href="http://opensource.org/licenses/mit-license.php"
              target="_blank"
            >
              MIT
            </a>
            .
          </p>
        </div>
      </footer>
    </>
  )
}

render(<App />, document.getElementById("app"))
