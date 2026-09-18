function checkNumber(number){
    if (number == 0) {
        console.log("Ноль");
        return 0;
        }
    
    if (number > 0) {
        console.log("Положительное");
    } else {
        console.log("Отрицательнрое");
    }

    if (number % 2 == 0) {
        console.log("Четное");
    } else {
        console.log("Нечетное");
    }
}

a = 5;
checkNumber(a);