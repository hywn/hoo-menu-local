import { DOMParser } from 'https://deno.land/x/deno_dom/deno-dom-wasm.ts'

const rename = Object.fromEntries(Object.entries(
	{ egg: 'eggs'
	, soy: 'soy'
	, wheat: 'wheat'
	, milk: 'milk'
	, fish: 'fish'
	, shellfish: 'shellfish'
	, peanut: 'peanuts'
	, tree_nuts: 'treenuts'
	}
).map(([k, v]) => [`allergen-has_${k}`, v]))

const regularise_allergen = tag => rename[tag] || 'error'

const get_runk = async date => {
	const url = `https://dining.virginia.edu/locations/runk-dining-hall/?date=${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
	const text = await fetch(url).then(r => r.text())

	const dom = new DOMParser().parseFromString(text, 'text/html')

	const mealNames_unparsed = [...dom.querySelectorAll('.c-tabs-nav__link-inner')].map(x => x.textContent)
	const mealNames = mealNames_unparsed.map(x => x.split(" (")[0])
	const food_dom = [...dom.querySelectorAll('.c-tab')]

	const mealDivs = food_dom.map(food_dom => {
		const food_name  = [...food_dom.querySelectorAll('.show-nutrition')].map(x => x.textContent)
	const food = food_name.map((fname, i) => ({"food": fname, "allergen": food_dom.querySelectorAll('.show-nutrition')[i].getAttribute("class")}))

	var allergen = []
	for(var i = 0; i < food.length; i++)
	allergen.push(food[i].allergen.split(" "))

	var allergen_parsed =[]
	for(var i = 0; i < food.length; i++)
	allergen_parsed.push(allergen[i].filter(x => x.includes("allergen")))
	//console.log(allergen_parsed)

	//const foodfood = food.map((fname, i) => ({"food": fname.food, "allergen": allergens[i]}))

	const foodfood = food_name.map((fname, i) => ({"name": fname, "allergens": allergen_parsed[i].map(regularise_allergen)}))


		return foodfood
	})



	const meals = (mealNames, mealDivs) => {
	const meal = mealNames.map((mealname, i) => ({"name": mealname, "food": mealDivs[i]}))
	return meal
	}
	return { name: 'runk', meals: meals(mealNames, mealDivs) }
}

//console.log(new Set((await get_runk(new Date())).meals.map(h => h.food).flat().map(f => f.allergens).flat()))

export default get_runk