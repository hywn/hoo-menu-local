//import { DOMParser } from 'https://deno.land/x/deno_dom/deno-dom-wasm.ts'

const my_DP = new DOMParser()
const to_dom = html_text =>
	new DOMParser().parseFromString(html_text, 'text/html')

const my_fetch = url => fetch('https://www.cs.virginia.edu/~jh7qbe/test.php?url=' + encodeURIComponent(url))

const ohill_dateuri = date => encodeURIComponent(`${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`)

// fetch dom for specific period (mealtime) and date
const on_period_dom = locationId => date => period => my_fetch(`https://virginia.campusdish.com/api/menus/GetMenu?locationId=${locationId}&mode=Daily&periodId=${period}&date=${ohill_dateuri(date)}`)
	.then(r => r.text())
	.then(to_dom)

// gets allergens from dom
// dom => [string]
const on_menuitem_allergens = dom => Object.entries(dom.attributes)
	.filter(([k, v]) => v === 'True')
	.map(([k, v]) => k.match(/^contains(.+)/i))
	.filter(x => x)
	.map(match => match[1])

// gets [station] from dom
// dom => [{ name: 'station name', items: { name: 'item name', allergens: [string] } }]
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
		//.map(s => s.items)
		//.flat()
		//.map(s => s.name)
		//.join('\n')
}

const on_day_menu = ({ locationId, locString }) => async date => {
	const periods = await my_fetch(`http://virginia.campusdish.com/LocationsAndMenus/${locString}?date=${ohill_dateuri(date)}`)
		.then(r => r.text())
		.then(t => {
			// no error checking oop!
			const js = t.match(/menus.periods =(.+);/)[1] // probably computer generated so likely will never change
			return eval(js) // bad
		})

	// actually works without await but um idk
	return await Promise.all(
		periods.map(async ({ name, periodId }) => ({ name, stations: await on_period_dom(locationId)(date)(periodId).then(on_period_to_dj) }))
	)
}

const get_ohill = date => Promise.all(
	[ { locationId: 704, locString: 'FreshFoodCompany', name: 'newcomb' }
	, { locationId: 695, locString: 'ObservatoryHillDiningRoom', name: 'ohill' }
	].map(async info => ({ name: info.name, meals: await on_day_menu(info)(date) }))
)

const get_runk = async date => {

	const html = await my_fetch(`https://dining.virginia.edu/locations/runk-dining-hall/?date=${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`)
		.then(r => r.text())
	const dom = to_dom(html)

	const meal_index = Object.fromEntries([...dom.querySelectorAll('.c-tabs-nav a')].map(a => {
		const index = a.getAttribute('data-tabid')
		const name = a.querySelector('.c-tabs-nav__link-inner').textContent
		return [index, name]
	}))

	const meals = [...dom.querySelectorAll('.c-tab')].map((meal, i) =>
		({ name: meal_index[i]
		 , stations: [...meal.querySelectorAll('.menu-station')].map(dom =>
			({ name: dom.querySelector('h4').textContent
			, items: [...dom.querySelectorAll('.menu-item-li a')].map(item =>
				({ name: item.textContent
				,  tags: [...item.classList]
				}))
			}))
		}))

	return { name: 'runk', meals }
}