import { DOMParser } from 'https://deno.land/x/deno_dom/deno-dom-wasm.ts'

const my_DP = new DOMParser()
const toDOM = text => my_DP.parseFromString(text, 'text/html')

const my_fetch = url => fetch('hms.virginia.edu/~jh7qbe/test.php?url=' + encodeURIComponent(url))

const ohill_dateuri = date => encodeURIComponent(`${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`)

// should be Promise [{ periodId, name}]
const on_getPeriods = locString => date => my_fetch(`http://virginia.campusdish.com/LocationsAndMenus/${locString}?date=${ohill_dateuri(date)}`)
	.then(r => r.text())
	.then(t => {
		// no error checking oop!
		const js = t.match(/menus.periods =(.+);/)[1] // probably computer generated so likely will never change
		return eval(js) // bad
	})

// fetch dom for specific period (mealtime) and date
const on_period_dom = locationId => date => period => my_fetch(`https://virginia.campusdish.com/api/menus/GetMenu?locationId=${locationId}&mode=Daily&periodId=${period}&date=${ohill_dateuri(date)}`)
	.then(r => r.text())
	.then(toDOM)

// prob need to map to standard names in future
const on_menuitem_allergens = dom => Object.entries(dom.attributes)
	.filter(([k, v]) => v === 'True')
	.map(([k, v]) => k.match(/^contains(.+)/i))
	.filter(x => x)
	.map(match => match[1])

// dom to json
const on_period_to_dj = dom => {
	const stations = [...dom.querySelectorAll('.menu__station')].map(dom => {
		const name = dom.querySelector('.station-header-title').textContent
		const items = [...dom.querySelectorAll('.menu__item')]

		return { name, items: items.map(dom => {
			const name_container = dom.querySelector('.item__name')
			const name = name_container.textContent.trim()
			//	? name_container.textContent.trim()
			//	: name_container.querySelector('a').textContent
			const productId = dom.getAttribute('data-menu-product-id')

			const desc = (dom.querySelector('.item__content') || {}).textContent || null

			const tags = [...dom.querySelectorAll('.item__details li img')].map(x => x.getAttribute('alt'))

			const allergens = on_menuitem_allergens(dom)

			return { name, allergens//, tags, desc, productId }
			}
		})}
	})

	return stations
		.filter(({ name }) => name !== 'Deli' && name !== 'Salad Bar')
		.map(s => s.items)
		.flat()
		//.map(s => s.name)
		//.join('\n')
}

const on_food = locationId => date => period => on_period_dom(locationId)(date)(period).then(on_period_to_dj)

const on_day_menu = ({ locationId, locString }) => async date => {

	const periods = await on_getPeriods(locString)(date)

	// actually works without await but um idk
	return await Promise.all(
		periods.map(async ({ name, periodId }) => ({ name, food: await on_food(locationId)(date)(periodId) }))
	)
}

const data = [
	  { locationId: 704, locString: 'FreshFoodCompany', name: 'newcomb' }
	, { locationId: 695, locString: 'ObservatoryHillDiningRoom', name: 'ohill' }
]

const get_on = () => Promise.all(data.map(
	async info => ({ name: info.name, meals: await on_day_menu(info)(new Date()) })
))

export default get_on