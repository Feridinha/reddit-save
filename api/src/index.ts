import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { parse } from "node-html-parser"

const app = new Hono()
const rapidSaveBase = "https://rapidsave.com/info?url="
const corsMiddleware = cors({
    origin: "*",
})

app.use("*", corsMiddleware)
app.use("*", logger())

const timeWindowSeconds = 120
const requestsPerWindow = 360
let currentCount = 0

app.use("*", async (c, next) => {
    if (currentCount >= requestsPerWindow) {
        return c.json({ success: false, message: "Rate limited" }, 429)
    }
    currentCount += 1
    await next()
})

app.post("/", async (c) => {
    const url = c.req.query("url")

    if (!url) return c.json({ success: false, message: "No url provided" })

    const response = await fetch(rapidSaveBase + url, { method: "GET" }).catch(
        console.error
    )

    if (!response)
        return c.json({
            success: false,
            message: "Error while sending request to rapidSave",
        })

    const html = await response.text()

    const root = parse(html)

    const data = root.querySelector(".download-info a")

    const downloadUrl = data?.attrs.href

    if (!downloadUrl)
        return c.json({ success: false, message: "Url not found!" })

    return c.json({ success: true, data: downloadUrl })
})

setInterval(() => (currentCount = 0), timeWindowSeconds * 1000)

export default {
    port: process.env.PORT,
    fetch: app.fetch,
}
