import { DOMParser } from 'https://deno.land/x/deno_dom/deno-dom-wasm.ts'

const url = 'https://dining.virginia.edu/locations/runk-dining-hall/?date=2021-03-27'
const text = await fetch(url).then(r => r.text())

const dom = new DOMParser().parseFromString(text, 'text/html')

const food_dom = [...dom.querySelectorAll('.is-active')]
const meals = [...dom.querySelectorAll('.c-tabs-nav__link-inner')]

const meal = food_dom.map(food_dom => {
	const meals = dom.querySelector('.c-tabs-nav__link-inner').textContent
	const food_name  = [...food_dom.querySelectorAll('.show-nutrition')].map(x => x.textContent)
    const food = food_name.map((fname, i) => ({"food": fname, "allergen": food_dom.querySelectorAll('.show-nutrition')[i].getAttribute("class")}))
	return { "name": meals, "food": food }
})

function food (){

}
console.log(meal)
