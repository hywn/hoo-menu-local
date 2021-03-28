const hello = [
	  [1, 2]
	, [3, 4]
	, [5, 6]
]

/*
{
	1: 2
	3: 4
	5: 6
}
*/

const hello_obj = Object.fromEntries(hello)

console.log(hello_obj)

const abc = Object.entries({
	  'hello': 'world'
	, 'abc': 123
	, 'fourty': 'fifthy'
})

console.log(abc)