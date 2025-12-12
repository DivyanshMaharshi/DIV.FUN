function findRandomNumber() {
      const diceInput = document.getElementById("dice");
      const resultHeader = document.getElementById("diceResult");
      const userNumberString = diceInput.value;
      if (!userNumberString) {
        alert("Please enter a number first!");
        return;
      }
      const numberValue = Number(userNumberString);

      if (numberValue <= 0 || isNaN(numberValue)) {
        alert("Please enter a positive, valid number!");
        return;
      }
      const randomNumber = Math.floor(Math.random() * numberValue) + 1;
      resultHeader.textContent = "You rolled a: " + randomNumber;
}

function changeColor() {
      const body = document.body;

      const r = Math.floor(Math.random() * 256);
      const g = Math.floor(Math.random() * 256);
      const b = Math.floor(Math.random() * 256);
      
      body.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
}

function resetColor() {
    const body = document.body;
    body.style.backgroundColor = "#FCF5EF";
}

function findTime() {
    const dateDetails = document.getElementById("dateDetails");
    const timeDetails = document.getElementById("timeDetails");
    
    const d = new Date();

    const year = d.getFullYear();
    const date = d.getDate();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const month = monthNames[d.getMonth()];

    const hour = d.getHours();
    const minute = d.getMinutes();
    const second = d.getSeconds(); 

    const dateMessage = `We are in the year ${year} in ${month} month with the date today being ${date}! (${date}/${d.getMonth()+1}/${year})`;

    const timeMessage = `Also, its the ${hour} hour of the day with the minute being ${minute} in the ${second} second! (${hour}:${minute}:${second})`;
    
    dateDetails.textContent = dateMessage;
    timeDetails.textContent = timeMessage;
    }