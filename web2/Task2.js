const numbers = [4, 8, 15, 16, 23, 42];

let s = 0;
let mx = 0;
const numbers10 = [];

for (let i=0; i <= numbers.length-1;i++) {
    s += numbers[i];
    if (numbers[i] > mx) {
        mx = numbers[i];
    }
    if (numbers[i] > 10) {
        numbers10.push(numbers[i]);
    }
}

console.log(s, mx, numbers10);

const sum = numbers.reduce((accumulator, current) => accumulator + current, 0);
const max = Math.max(...numbers); 
const num10 = numbers.filter(num => num > 10);

console.log(sum, max, num10);