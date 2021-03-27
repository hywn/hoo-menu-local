import { serve } from 'https://deno.land/std@0.91.0/http/server.ts'
import { parse } from 'https://deno.land/std@0.91.0/flags/mod.ts'

import get_on from './newcomb-ohill-test.js'
import get_runk from './runk.js'

const get_all = async () =>
	[await get_runk(new Date())]

let data = await get_all()
setInterval(async () => {
	console.log('heybro')
	data = await get_all()
}, 1000 * 10)

const { port } = parse(Deno.args)
if (port == null) {
	console.error('need port')
	Deno.exit()
}

const server = serve({ port })

console.log(`now serving on port ${port}`)

for await (const request of server)
	request.respond({ body: JSON.stringify(data) })