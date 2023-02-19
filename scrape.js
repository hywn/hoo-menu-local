/// NOTE: if one thing produces garbage data the others fail as well

const my_DP = new DOMParser()
const to_dom = html_text =>
	new DOMParser().parseFromString(html_text, 'text/html')

const my_fetch = url => fetch('https://www.cs.virginia.edu/~jh7qbe/test.php?url=' + encodeURIComponent(url))

const ohill_dateuri = date => encodeURIComponent(`${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`)

// fetch scrapes stations for specific period (mealtime) and date
// stringable => Date => stringable => [station]
const get_mark = locationId => date => async period => {
	const mark = await my_fetch(`https://virginia.campusdish.com/api/menu/GetMenus?locationId=${locationId}&mode=Daily&periodId=${period}&date=${ohill_dateuri(date)}`)
		.then(r => r.json())

	const stations = Object.fromEntries(
		mark.Menu.MenuStations.map(({ StationId, Name }) => [ StationId, { name: Name, items: [] } ])
	)

	for (const p of mark.Menu.MenuProducts)
		stations[p.StationId].items.push({ name: p.Product.MarketingName })

	return Object.values(stations).filter(({ items }) => items.length > 0)
}

const on_day_menu = ({ locationId, locString }) => async date => {
	const periods = await my_fetch(`http://virginia.campusdish.com/LocationsAndMenus/${locString}?date=${ohill_dateuri(date)}`)
		.then(r => r.text())
		.then(t => {
			// no error checking oop!
			const js = t.match(/periods: (\[.*\])/)[1] // probably computer generated so likely will never change
			return eval(js) // bad
		})

	// actually works without await but um idk
	return await Promise.all(
		periods.map(async ({ name, periodId }) => ({ name, stations: await get_mark(locationId)(date)(periodId) }))
	)
}

const get_ohill = date => Promise.all(
	[ { locationId: 695, locString: 'ObservatoryHillDiningRoom', name: 'ohill' }
	, { locationId: 704, locString: 'FreshFoodCompany', name: 'newcomb' }
	].map(async info => ({ name: info.name, meals: await on_day_menu(info)(date) }))
)

const get_runk = async date => {

	const html = await my_fetch(`https://harvesttableuva.com/locations/runk-dining-hall/?date=${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`)
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