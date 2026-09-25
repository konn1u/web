const boxes = [
    {width: 50, height: 40},
    {width: 100, height: 20},
    {width: 60, height: 5},
    {width: 95, height: 25},
    {width: 25, height: 30},
    {width: 15, height: 15}
];

const root = document.getElementById('wrapper');

function objToHtml(userObj) {
    const rootEl = document.createElement('div');
    rootEl.classList.add('box');
    
    rootEl.style.width = `${userObj.width}px`;
    rootEl.style.height = `${userObj.height}px`;
    return rootEl;
}

for (let el of boxes) {
    root.appendChild(objToHtml(el));
}