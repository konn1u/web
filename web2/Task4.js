function getRandInt(min, max) {
    const minCeil = Math.ceil(min);
    const maxFloor = Math.floor(max);
    return Math.floor(Math.random() * (maxFloor - minCeil + 1)) + minCeil;
}

num = getRandInt(1, 10);
userInput = prompt("Введите число от 1 до 10:");
while (userInput != num) {
    userInput = prompt("Введите число от 1 до 10:");

    if (userInput > 10 || userInput < 1) {
        console.log("Введите число от 1 до 10.");
        continue;
    }

    if (userInput > num) {
        console.log("Меньше.");
    } else {
        console.log("Больше.")
    }

    if (userInput == num) {
        console.log("Угадал.");
        break;
    }
}