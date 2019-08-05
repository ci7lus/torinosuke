import crypto from "crypto"
import { URLSearchParams } from "url"
import axios from "axios"
import Koa from "koa"
import Router from "koa-router"
import Body from "koa-body"
import * as $ from "transform-ts"
import { OAuth } from "oauth"
// compatible with node < 12
import "polyfill-object.fromentries"

const app = new Koa()

const router = new Router<any, any>()
const apiRouter = new Router<any, any>()

apiRouter.post("/request_token", Body(), async ctx => {
    const body = $.obj({
        ck: $.string,
        cs: $.string,
    }).transformOrThrow(ctx.request.body)
    const auth = new OAuth(
        "https://api.twitter.com/oauth/request_token",
        "https://api.twitter.com/oauth/access_token",
        body.ck,
        body.cs,
        "1.0a",
        "oob",
        "HMAC-SHA1"
    )
    try {
        const requestToken = await new Promise((res, rej) => {
            auth.getOAuthRequestToken((err, token, secret) => {
                if (err) {
                    rej(err)
                }
                res({
                    token: token,
                    secret: secret,
                })
            })
        })
        ctx.body = requestToken
        ctx.type = "json"
    } catch (error) {
        ctx.body = error.data
        ctx.throw(error.statusCode)
    }
})

apiRouter.post("/access_token", Body(), async ctx => {
    const body = $.obj({
        ck: $.string,
        cs: $.string,
        token: $.string,
        secret: $.string,
        pin: $.string,
    }).transformOrThrow(ctx.request.body)
    const auth = new OAuth(
        "https://api.twitter.com/oauth/request_token",
        "https://api.twitter.com/oauth/access_token",
        body.ck,
        body.cs,
        "1.0a",
        "oob",
        "HMAC-SHA1"
    )
    try {
        const requestToken = await new Promise((res, rej) => {
            auth.getOAuthAccessToken(body.token, body.secret, body.pin, (err, token, secret) => {
                if (err) {
                    rej(err)
                }
                res({
                    token: token,
                    secret: secret,
                })
            })
        })
        ctx.body = requestToken
        ctx.type = "json"
    } catch (error) {
        ctx.body = error.data
        ctx.throw(error.statusCode)
    }
})

apiRouter.post("/xauth", Body(), async ctx => {
    const body = $.obj({
        ck: $.string,
        cs: $.string,
        sn: $.string,
        pw: $.string,
    }).transformOrThrow(ctx.request.body)

    const uri = "https://api.twitter.com/oauth/access_token"
    const credential = {
        x_auth_mode: "client_auth",
        x_auth_username: body.sn,
        x_auth_password: body.pw,
    }
    const OAuthPayload = {
        oauth_consumer_key: body.ck,
        oauth_signature_method: "HMAC-SHA1",
        oauth_timestamp: Math.floor(new Date().getTime() / 1000),
        oauth_version: "1.0a",
        oauth_nonce: crypto
            .createHash("md5")
            .update(crypto.randomBytes(32))
            .digest()
            .toString("hex"),
        oauth_token: "",
    }
    const payloads = Object.fromEntries(
        Object.entries({ ...credential, ...OAuthPayload }).sort((a, b) => {
            if (a[0] < b[0]) {
                return -1
            } else {
                return 1
            }
        })
    )

    const signature = crypto
        .createHmac("sha1", Buffer.from(`${body.cs}&`))
        .update(
            [
                "POST",
                encodeURIComponent(uri),
                encodeURIComponent(
                    Object.entries(payloads)
                        .map(payload => {
                            return payload.join("=")
                        })
                        .join("&")
                ),
            ].join("&")
        )
        .digest()
        .toString("base64")
    const headerSign = { ...OAuthPayload, oauth_signature: encodeURIComponent(signature) }

    const form = new URLSearchParams()
    Object.entries(credential).map(entry => {
        form.append(entry[0], entry[1])
    })

    const r = await axios.post(uri, form, {
        headers: {
            Authorization: `OAuth ${Object.entries(headerSign)
                .map(entry => {
                    entry[1] = `"${entry[1]}"`
                    return entry.join("=")
                })
                .join(", ")}`,
            "User-Agent": "Twitter",
            Accpet: "*/*",
        },
        responseType: "text",
        validateStatus: status => {
            return true
        },
    })
    if (r.status == 200) {
        ctx.body = Object.fromEntries(
            r.data.split("&").map((datum: string) => {
                return datum.split("=")
            })
        )
        ctx.type = "json"
    } else {
        ctx.throw(r.status)
    }
})

router.use("/api", apiRouter.routes())
app.use(router.routes())

export default app.callback()
