import env from "@/config/env.config.js"

//

type Mail = {
    to: string | string[]
    subject: string
    text?: string
    html?: string
}

//

// --- Sends through archmail, the gmail credentials never leave the backend
const send = async (mail: Mail) => {
    const { url, apikey, address, password, fromName } = env.archmail
    const res = await fetch(`${url.replace(/\/+$/, "")}/api/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apikey}` },
        body: JSON.stringify({ gmail: { address, password }, fromName: fromName || undefined, mail }),
    })

    if (!res.ok) throw new Error(`[Service.Mail]: Archmail responded ${res.status} ${await res.text().catch(() => "")}`)
}

//

export default { send }
