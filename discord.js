import fetch from "node-fetch"
export default async function postToDiscord(discordWebhook, data) {

    const payload = { content: data }
    return fetch(discordWebhook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
}
