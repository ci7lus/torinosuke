import * as React from "react"
const { useState } = React
import { render } from "react-dom"
import { OAuth } from "oauth"
import axios from "axios"

const client = axios.create({
    validateStatus: () => {
        return true
    },
    responseType: "text",
})

const definedApps: { name: string; ck: string; cs: string }[] = [
    { name: "Twitter for Android", ck: "3nVuSoBZnx6U4vzUxf5w", cs: "Bcs59EFbbsdF6Sl9Ng71smgStWEGwXXKSjYvPVt7qys" },
    { name: "Twitter for iPhone", ck: "IQKbtAYlXLripLGPWd0HUA", cs: "GgDYlkSvaPxGxC4X8liwpUoqKwwr3lCADbz8A7ADU" },
    { name: "Twitter for iPad", ck: "CjulERsDeqhhjSme66ECg", cs: "IQWdVyqFxghAtURHGeGiWAsmCAGmdW3WmbEx6Hck" },
]

const App = () => {
    const [message, setMessage] = useState("")
    const [messageType, setMessageType] = useState("")
    const [useXAuth, setUseXAuth] = useState(false)
    const [consumerKey, setConsumerKey] = useState("")
    const [consumerSecret, setConsumerSecret] = useState("")
    const [isConsumerLocked, setIsConsumerLocked] = useState(false)
    const [isResetLocked, setIsResetLocked] = useState(false)
    const [appSelectorExtended, setAppSelectorExtended] = useState(false)
    const [isDefinedApp, setIsDefinedApp] = useState(false)
    const [screenName, setScreenName] = useState("")
    const [password, setPassword] = useState("")
    const [pin, setPin] = useState("")
    const [OAuthToken, setOAuthToken] = useState("")
    const [OAuthTokenSecret, setOAuthTokenSecret] = useState("")
    const [accessToken, setAccessToken] = useState("")
    const [accessTokenSecret, setAccessTokenSecret] = useState("")

    const clearMessage = () => {
        setMessage("")
        setMessageType("")
    }

    const onApplicationSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setAppSelectorExtended(false)
        setIsConsumerLocked(true)
        setIsResetLocked(true)
        if (useXAuth) {
            const r = await client.post("/api/xauth", {
                ck: consumerKey,
                cs: consumerSecret,
                sn: screenName,
                pw: password,
            })
            if (r.status == 200) {
                setAccessToken(r.data.oauth_token)
                setAccessTokenSecret(r.data.oauth_token_secret)
                clearMessage()
            } else {
                setMessage(`XAuthに失敗しました: ${r.data}`)
                setMessageType("danger")
                setIsConsumerLocked(false)
            }
        } else {
            const auth = new OAuth(
                "https://twitter.com/oauth/request_token",
                "https://twitter.com/oauth/access_token",
                consumerKey,
                consumerSecret,
                "1.0a",
                "oob",
                "HMAC-SHA1"
            )
            const header = auth.authHeader("https://twitter.com/oauth/request_token", "", "", "POST")
            const r = await client.post("/oauth/request_token", null, {
                headers: {
                    Authorization: header,
                },
            })
            if (r.status == 200) {
                const result = new Map(
                    r.data.split("&").map((datum: string) => {
                        return datum.split("=")
                    })
                )
                const token = result["oauth_token"]
                const secret = result["oauth_token_secret"]
                if (token && secret) {
                    setOAuthToken(token)
                    setOAuthTokenSecret(secret)
                    clearMessage()
                } else {
                    setMessage(`認証ページ情報の取得には成功しましたが、認証開始に必要なパラメータが見つかりませんでした。`)
                    setMessageType("danger")
                }
            } else {
                setMessage(`認証ページ情報の取得に失敗しました: ${r.data || r.status}`)
                setMessageType("danger")
                setIsConsumerLocked(false)
            }
        }
        setIsResetLocked(false)
    }
    const onPinSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsResetLocked(true)
        if (!OAuthToken.length || !OAuthTokenSecret.length || !pin.length) {
            setIsResetLocked(false)
            return
        }
        const auth = new OAuth(
            "https://twitter.com/oauth/request_token",
            "https://twitter.com/oauth/access_token",
            consumerKey,
            consumerSecret,
            "1.0a",
            "oob",
            "HMAC-SHA1",
            undefined
        )
        const header = auth.authHeader(
            `https://twitter.com/oauth/access_token?oauth_verifier=${pin}`,
            OAuthToken,
            OAuthTokenSecret,
            "POST"
        )
        const r = await client.post("/oauth/request_token", null, {
            headers: {
                Authorization: header,
            },
        })
        console.log(r)
        /*
        await new Promise((res, rej) => {
            auth.getOAuthAccessToken(OAuthToken, OAuthTokenSecret, pin, (err, at, ats) => {
                if (err) {
                    setMessage(`アクセストークンの取得に失敗しました: ${err.data || err.statusCode}`)
                    setMessageType("danger")
                } else {
                    setAccessToken(at)
                    setAccessTokenSecret(ats)
                    clearMessage()
                }
                setIsResetLocked(false)
                res()
            })
        })*/
    }

    return (
        <div className="section">
            <div className="container">
                <h1 className="title">Twitter OAuth Helper</h1>
                <p>Twitter の OAuth をするためのツールです。</p>
                <hr></hr>
                {0 < message.length && <div className={`notification is-${messageType}`}>{message}</div>}
                <div className="box">
                    <label className="label">認証モード</label>
                    <div className="buttons has-addons">
                        <span
                            className={`button ${!useXAuth && "is-primary is-selected"}`}
                            onClick={() => {
                                setUseXAuth(false)
                            }}
                        >
                            PIN Auth
                        </span>
                        <span
                            className={`button ${useXAuth && "is-warning is-selected"}`}
                            onClick={() => {
                                setUseXAuth(true)
                            }}
                        >
                            XAuth
                        </span>
                    </div>
                    {useXAuth && (
                        <div className="notification">
                            XAuth
                            は公式アプリの情報を用いて認証を試みるときのみ用いることができるモードです。Twitterのユーザー名（スクリーンネーム）とパスワードを用いて認証をします。当サービスはこの情報をできる限り保持しないように作っていますが、利用はあまりおすすめできません。
                            <br />
                            また、XAuth での認証には基本的に一時パスワード（仮コード）を用います。
                        </div>
                    )}
                </div>
                <div className="card">
                    <div className="card-header">
                        <div className="card-header-title">アプリケーションを設定する</div>
                    </div>
                    <div className="card-content">
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
                                        onChange={e => {
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
                                        onChange={e => {
                                            if (!isConsumerLocked) {
                                                setConsumerSecret(e.target.value)
                                                setIsDefinedApp(false)
                                            }
                                        }}
                                    />
                                </div>
                                <p className="help">コンシューマーシークレットを入力してください。</p>
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
                                                onChange={e => {
                                                    if (!isConsumerLocked) {
                                                        setScreenName(e.target.value)
                                                    }
                                                }}
                                            />
                                        </div>
                                        <p className="help">ユーザー名（スクリーンネーム）を入力してください。</p>
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
                                                onChange={e => {
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
                                    <button className="button is-info" type="submit" disabled={isConsumerLocked}>
                                        認証
                                    </button>
                                    <button
                                        className="button is-danger"
                                        type="reset"
                                        disabled={isResetLocked}
                                        onClick={() => {
                                            setIsConsumerLocked(false)
                                            setAccessToken("")
                                            setAccessTokenSecret("")
                                            setPin("")
                                        }}
                                    >
                                        やりなおす
                                    </button>
                                </div>
                                <div
                                    className={`dropdown is-right is-up ${appSelectorExtended && "is-active"} dropdown-padding`}
                                >
                                    <div className="dropdown-trigger">
                                        <button
                                            className="button"
                                            aria-haspopup="true"
                                            aria-controls="dropdown-menu"
                                            type="button"
                                            disabled={isConsumerLocked}
                                            onClick={() => {
                                                setAppSelectorExtended(!appSelectorExtended)
                                            }}
                                        >
                                            <span>定義済みアプリから選ぶ</span>
                                            <span className="icon is-small">
                                                <i className="fas fa-angle-up" aria-hidden="true"></i>
                                            </span>
                                        </button>
                                    </div>
                                    <div className="dropdown-menu" id="dropdown-menu" role="menu">
                                        <div className="dropdown-content">
                                            {definedApps.map(app => (
                                                <a
                                                    key={app.name}
                                                    className="dropdown-item"
                                                    onClick={() => {
                                                        if (!isConsumerLocked) {
                                                            setConsumerKey(app.ck)
                                                            setConsumerSecret(app.cs)
                                                            setIsDefinedApp(true)
                                                            setAppSelectorExtended(false)
                                                        }
                                                    }}
                                                >
                                                    {app.name}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
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
                                            disabled={!isConsumerLocked || Boolean(accessToken.length)}
                                            onChange={e => {
                                                setPin(e.target.value)
                                            }}
                                        />
                                    </div>
                                    <p className="help">表示された PIN コード（数字7桁）を入力してください。</p>
                                </div>
                                <div>
                                    <button
                                        className="button is-info"
                                        disabled={!isConsumerLocked || Boolean(accessToken.length)}
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
                            <p className="is-warinng">アクセストークンを不用意に他者に共有しないでください！</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

render(<App />, document.getElementById("app"))
