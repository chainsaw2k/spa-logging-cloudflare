/**
 * - Run `npx wrangler dev src/index.js` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npx wrangler publish src/index.js --name my-worker` to publish your worker
 */

export default {
	async fetch(request, env, ctx) {
		let r = await domyfetch(env).then((res) => res.json()).then(async (data) => {
			const d = Math.floor(Date.now() / 1000);
			const ob = { ts: d, connected: data.connected, temp: data.temperatureF, spaboy_connected: data.spaboy_connected, ph: data.ph, ph_status: data.ph_status, orp: data.orp, orp_status: data.orp_status, };
			await sendmydata(env, ob);
			await write_d1(env, d, data.ph);
			return JSON.stringify(ob);
		}).catch((r) => 'error')
		return new Response(r)
	},

	// https://developers.cloudflare.com/workers/runtime-apis/scheduled-event/
	async scheduled(event, env, ctx) {
		ctx.waitUntil(domyfetch(env).then((res) => res.json()).then(async (data) => {
			const d = Math.floor(Date.now() / 1000);
			const ob = { ts: d, connected: data.connected, temp: data.temperatureF, spaboy_connected: data.spaboy_connected, ph: data.ph, ph_status: data.ph_status, orp: data.orp, orp_status: data.orp_status, };
			await sendmydata(env, ob);
			await write_d1(env, d, data.ph)
			return JSON.stringify(ob);
		}).catch((r) => 'error'))
	},
};

async function domyfetch(env) {
	/**
	 * Example someHost is set up to take in a JSON request
	 * Replace url with the host you wish to send requests to
	 * @param {string} someHost the host to send the request to
	 * @param {string} url the URL to send the request to
	 */
	const someHost = 'https://api.myarcticspa.com';
	const url = someHost + '/v2/spa/status';

	/**
	 * gatherResponse awaits and returns a response body as a string.
	 * Use await gatherResponse(..) in an async function to get the response body
	 * @param {Response} response
	 */
	async function gatherResponse(response) {
		const { headers } = response;
		const contentType = headers.get('content-type') || '';
		if (contentType.includes('application/json')) {
			return JSON.stringify(await response.json());
		}
		return response.text();
	}

	const init = {
		headers: {
			'content-type': 'application/json;charset=UTF-8',
			'X-API-KEY': env.ARCTIC_API_KEY,
		},
	};

	const response = await fetch(url, init);
	const results = await gatherResponse(response);
	console.log('arctic spa results ', results)
	return new Response(results, init);
};

// https://grafana.com/docs/grafana-cloud/data-configuration/metrics/metrics-graphite/
async function sendmydata(env, d) {
	/**
	 * Example someHost is set up to take in a JSON request
	 * Replace url with the host you wish to send requests to
	 * @param {string} url the URL to send the request to
	 * @param {BodyInit} body the JSON data to send in the request
	 */
	const someHost = 'https://graphite-prod-10-prod-us-central-0.grafana.net';
	const url = someHost + '/graphite/metrics';
	const body = [
		{
			name: "test.ph",
			interval: 60,
			value: d.ph,
			time: d.ts,
		},
		{
			name: "test.temp",
			interval: 60,
			value: d.temp,
			time: d.ts,
		},
		{
			name: "test.orp",
			interval: 60,
			value: d.orp,
			time: d.ts,
		},
		{
			name: "test.connected",
			interval: 60,
			value: d.connected ? 1 : 0,
			time: d.ts,
		},

	];

	/**
	 * gatherResponse awaits and returns a response body as a string.
	 * Use await gatherResponse(..) in an async function to get the response body
	 * @param {Response} response
	 */
	async function gatherResponse(response) {
		const { headers } = response;
		const contentType = headers.get('content-type') || '';
		if (contentType.includes('application/json')) {
			return JSON.stringify(await response.json());
		} else if (contentType.includes('application/text')) {
			return response.text();
		} else if (contentType.includes('text/html')) {
			return response.text();
		} else {
			return response.text();
		}
	}

	const init = {
		body: JSON.stringify(body),
		method: 'POST',
		headers: {
			'content-type': 'application/json',
			'Authorization': 'Bearer ' + env.GRAFANA_USER_ID + ':' + env.GRAFANA_GRAPHITE_KEY,
		},
	};
	// beware: https://community.cloudflare.com/t/fetch-never-returns-in-worker/273401
	const response = await fetch(url, init);
	const results = await gatherResponse(response);
	console.log('grafana results ', results)
	return new Response(results, init);
};

async function write_d1(env, ts, ph) {
	try {
		console.log(ts, ph)
		await env.D1_PH_LOG_BINDING.prepare(
			"INSERT INTO ph_data (ts, ph) VALUES ( ?, ? );"
		)
			.bind(ts, ph)
			.run();
			console.log('DB WRITE SUCCESS')
	} catch (e) {
		console.log('db write error', e)
	}
};